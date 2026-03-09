from fastapi.encoders import jsonable_encoder
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
from sqlalchemy.orm import Session
from app.api import deps
from app.models import Task, User, TaskComment, Notification, TaskAttachment
from app.schemas import project as project_schemas
from app.core.socket import sio
from app.services.task_service import task_service

router = APIRouter()

@router.get("/")
def read_tasks(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    # Instead of using the Dependency which raises 403 directly, 
    # we manually check if the user has the 'tasks.view_all' permission mapped.
    # Since permissions are loaded into the JWT and user obj, we can query it safely.
    
    # Alternatively, just check if they are Admin or Manager via Role ID:
    # 1: Admin, 2: Manager, 3: Employee
    
    is_admin_or_manager = False
    if current_user.roles:
        for role in current_user.roles:
            if role.name in ["Admin", "Manager"]:
                is_admin_or_manager = True
                break
                
    if is_admin_or_manager:
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
        # Create notification and emit event
        await task_service.create_and_emit_notification(
            db=db,
            user_id=task.assigned_to,
            notif_type="task_assigned",
            title="New Task Assigned",
            content=f"You were assigned '{task.title}'"
        )

        # Emit task_created event
        await task_service.emit_task_created(task)
        
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

    # Use TaskService for business logic constraints if status is changing
    if task_in.status and task_in.status != task.status:
        task_service.validate_status_transition(task.status, task_in.status)
        if task_in.status == "in_progress":
            task_service.check_dependencies(db, task.id)

    for field, value in task_in.model_dump(exclude_unset=True).items():
        setattr(task, field, value)
    
    db.commit()
    db.refresh(task)
    
    # Emit task_updated event
    if task.assigned_to:
        await task_service.emit_task_updated(task)
        
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

@router.post("/{task_id}/attachments")
async def create_attachment(
    task_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    Upload a file attachment for a task with size and type validation.
    """
    # 1. Validate MIME Type
    ALLOWED_TYPES = [
        "image/jpeg", "image/png", 
        "application/pdf", 
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document", # docx
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" # xlsx
    ]
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400, 
            detail="File type not supported. Use JPG, PNG, PDF, DOCX, or XLSX."
        )

    # 2. Validate Size (10MB max)
    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File too large. Maximum size is 10MB.")
    await file.seek(0) # Reset pointer
    
    # 3. Sanitize and save
    file_path = f"uploads/{task_id}_{file.filename.replace(' ', '_')}"
    
    # Mock saving to disk
    with open(file_path, "wb") as buffer:
        buffer.write(content)
        
    attachment = TaskAttachment(
        task_id=task_id,
        file_name=file.filename,
        file_path=file_path,
        uploaded_by=current_user.id
    )
    db.add(attachment)
    db.commit()
    db.refresh(attachment)
    return jsonable_encoder(attachment)

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
        await task_service.emit_task_comment_created(task, comment, current_user)
        
    # Process Mentions using TaskService
    await task_service.process_mentions(
        db=db,
        content=comment.comment,
        sender_name=current_user.full_name,
        task_title=task.title if task else f"Task #{task_id}"
    )
    
    return {
        "comment": comment,
        "user": {
            "id": current_user.id,
            "full_name": current_user.full_name,
            "username": current_user.username
        }
    }
