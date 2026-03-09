from fastapi.encoders import jsonable_encoder
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api import deps
from app.models import Task, User, TaskComment, Notification
from app.schemas import project as project_schemas
from app.core.socket import sio

router = APIRouter()

@router.get("/")
def read_tasks(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    # Filter by permission
    # If Admin/Manager (view_all) -> return all
    # If Employee -> return assigned_to or project member?
    # Simple logic: check 'tasks.view_all'. If yes, all. Else, assigned_to me.
    
    has_view_all = False
    try:
        deps.PermissionChecker("tasks.view_all")(current_user)
        has_view_all = True
    except HTTPException:
        pass
    
    if has_view_all:
        tasks = db.query(Task).all()
    else:
        tasks = db.query(Task).filter(Task.assigned_to == current_user.id).all()
        
    return jsonable_encoder({"tasks": tasks})

@router.get("/{task_id}")
def read_task(
    task_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Permission check?
    return jsonable_encoder({"task": task})

@router.post("/")
async def create_task(
    task_in: project_schemas.TaskCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    _: bool = Depends(deps.PermissionChecker("tasks.create")),
):
    task = Task(
        **task_in.model_dump(),
        created_by=current_user.id
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    
    # Real-time notification and event emission
    if task.assigned_to:
        # Create notification
        notification = Notification(
            user_id=task.assigned_to,
            type="task_assigned",
            title="New Task Assigned",
            content=f"You were assigned '{task.title}'",
            is_read=0
        )
        db.add(notification)
        db.commit()
        db.refresh(notification)

        # Emit task_created event
        await sio.emit(
            "task_created",
            {
                "task": {
                    "id": task.id,
                    "title": task.title,
                    "description": task.description,
                    "status": task.status,
                    "priority": task.priority,
                    "assigned_to": task.assigned_to,
                    "project_id": task.project_id,
                    "due_date": task.due_date.isoformat() if task.due_date else None,
                    "created_by": task.created_by
                }
            },
            room=f"user_{task.assigned_to}"
        )

        # Emit notification_created event
        await sio.emit(
            "notification_created",
            {
                "id": notification.id,
                "type": notification.type,
                "title": notification.title,
                "content": notification.content,
                "created_at": notification.created_at.isoformat(),
                "is_read": notification.is_read
            },
            room=f"user_{task.assigned_to}"
        )
        
    return jsonable_encoder({"task": task, "message": "Task created"})

@router.patch("/{task_id}")
async def update_task(
    task_id: int,
    task_in: project_schemas.TaskUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Permissions: edit_all OR (edit_own AND assigned_to) OR (edit_team AND ???)
    has_edit_all = False
    try:
        deps.PermissionChecker("tasks.edit_all")(current_user)
        has_edit_all = True
    except HTTPException:
        pass
    
    is_assigned = task.assigned_to == current_user.id
    can_edit_own = False
    try:
        deps.PermissionChecker("tasks.edit_own")(current_user)
        can_edit_own = True
    except:
        pass
    
    if not (has_edit_all or (is_assigned and can_edit_own)):
         raise HTTPException(status_code=403, detail="Not enough permissions")

    for field, value in task_in.model_dump(exclude_unset=True).items():
        setattr(task, field, value)
    
    db.commit()
    db.refresh(task)
    
    # Emit task_updated event
    if task.assigned_to:
        await sio.emit(
            "task_updated",
            {
                "task": {
                    "id": task.id,
                    "title": task.title,
                    "description": task.description,
                    "status": task.status,
                    "priority": task.priority,
                    "assigned_to": task.assigned_to,
                    "project_id": task.project_id,
                    "due_date": task.due_date.isoformat() if task.due_date else None,
                    "created_by": task.created_by
                }
            },
            room=f"user_{task.assigned_to}"
        )
        
    return jsonable_encoder({"task": task, "message": "Task updated"})

@router.delete("/{task_id}")
def delete_task(
    task_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    _: bool = Depends(deps.PermissionChecker("tasks.delete")),
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    db.delete(task)
    db.commit()
    return {"message": "Task deleted"}

@router.get("/{task_id}/comments")
def read_comments(
    task_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    comments = db.query(TaskComment).filter(TaskComment.task_id == task_id).all()
    return {"comments": comments}

@router.post("/{task_id}/comments")
async def create_comment(
    task_id: int,
    comment_in: project_schemas.CommentCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    _: bool = Depends(deps.PermissionChecker("tasks.comment")),
):
    comment = TaskComment(
        task_id=task_id,
        user_id=current_user.id,
        comment=comment_in.comment
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    
    # Return with user info for UI
    
    # Emit comment event
    # If the task is assigned, emit to the assignee
    task = db.query(Task).filter(Task.id == task_id).first()
    if task and task.assigned_to:
        await sio.emit(
            "task_comment_created",
            {
                "taskId": task_id,
                "comment": {
                    "id": comment.id,
                    "comment": comment.comment,
                    "created_at": comment.created_at.isoformat(),
                    "user": {
                        "id": current_user.id,
                        "full_name": current_user.full_name,
                        "username": current_user.username
                    }
                }
            },
            room=f"user_{task.assigned_to}"
        )
    
    return {
        "comment": comment,
        "user": {
            "id": current_user.id,
            "full_name": current_user.full_name,
            "username": current_user.username
        }
    }
