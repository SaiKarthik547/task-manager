from fastapi.encoders import jsonable_encoder
from typing import Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text, func
from app.api import deps
from app.models import User, Task, Project

router = APIRouter()

@router.get("/overview")
def get_analytics_overview(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Returns high-level statistics: total tasks, completed tasks, overdue tasks.
    Enforces RBAC based on user role (is_admin).
    """
    is_admin = any(row.name == "Admin" for row in current_user.roles)
    
    if is_admin:
        total_tasks = db.query(Task).count()
        completed_tasks = db.query(Task).filter(Task.status == "completed").count()
        # simplified overdue check for all tasks with due_date < current date
        overdue_tasks = db.query(Task).filter(Task.status != "completed", Task.due_date != None, Task.due_date < func.now()).count()
    else:
        # Employee stats
        total_tasks = db.query(Task).filter(Task.assigned_to == current_user.id).count()
        completed_tasks = db.query(Task).filter(Task.assigned_to == current_user.id, Task.status == "completed").count()
        overdue_tasks = db.query(Task).filter(Task.assigned_to == current_user.id, Task.status != "completed", Task.due_date != None, Task.due_date < func.now()).count()

    return jsonable_encoder({
        "total_tasks": total_tasks,
        "completed_tasks": completed_tasks,
        "overdue_tasks": overdue_tasks,
        "completion_rate": round(completed_tasks / total_tasks * 100, 1) if total_tasks > 0 else 0
    })

@router.get("/project-health")
def get_project_health(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Returns array of project health groups: [{ name: "green", value: 5 }, ...]
    """
    is_admin = any(row.name == "Admin" for row in current_user.roles)
    
    if is_admin:
        projects = db.query(Project.health, func.count(Project.id)).group_by(Project.health).all()
    else:
        # User projects via assigned tasks or ownership
        from app.models.project import project_members
        member_proj_ids = db.query(project_members.c.project_id).filter(project_members.c.user_id == current_user.id)
        task_proj_ids = db.query(Task.project_id).filter(Task.assigned_to == current_user.id)
        
        projects = db.query(Project.health, func.count(Project.id)).filter(
            (Project.owner_id == current_user.id) | 
            (Project.id.in_(member_proj_ids)) | 
            (Project.id.in_(task_proj_ids))
        ).group_by(Project.health).all()
        
    health_data = [{"name": h[0] if h[0] else "unknown", "value": h[1]} for h in projects]
    return jsonable_encoder({"project_health": health_data})

@router.get("/tasks-completion-timeline")
def get_tasks_timeline(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Returns tasks completed per day. (SQLite compatible)
    """
    is_admin = any(row.name == "Admin" for row in current_user.roles)
    
    # SQLite DATE() function to group by day
    if is_admin:
        timeline = db.query(
            func.date(Task.updated_at).label("date"),
            func.count(Task.id).label("completed")
        ).filter(Task.status == "completed").group_by(func.date(Task.updated_at)).all()
    else:
        timeline = db.query(
            func.date(Task.updated_at).label("date"),
            func.count(Task.id).label("completed")
        ).filter(Task.status == "completed", Task.assigned_to == current_user.id).group_by(func.date(Task.updated_at)).all()
        
    timeline_data = [{"date": t[0], "completed": t[1]} for t in timeline]
    return jsonable_encoder({"timeline": timeline_data})
