from fastapi.encoders import jsonable_encoder
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api import deps
from app.models import Project, User, project_members
from app.schemas import project as project_schemas

router = APIRouter()

@router.get("/")
def read_projects(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    skip: int = 0,
    limit: int = 100
):
    has_view_all = False
    try:
        deps.PermissionChecker("projects.view")(current_user)
        has_view_all = True
    except HTTPException:
        pass
        
    is_admin_or_manager = any(r.name in ["Admin", "Manager"] for r in current_user.roles)
    
    if has_view_all or is_admin_or_manager:
        projects = db.query(Project).offset(skip).limit(limit).all()
    else:
        # Employee: Only see projects where they are owner, member, or have a task
        from app.models.project import Task
        
        member_proj_ids = db.query(project_members.c.project_id).filter(project_members.c.user_id == current_user.id)
        task_proj_ids = db.query(Task.project_id).filter(Task.assigned_to == current_user.id)
        
        projects = db.query(Project).filter(
            (Project.owner_id == current_user.id) | 
            (Project.id.in_(member_proj_ids)) | 
            (Project.id.in_(task_proj_ids))
        ).offset(skip).limit(limit).all()
        
    return jsonable_encoder({"projects": projects})

@router.get("/{project_id}")
def read_project(
    project_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    # Employees can only view if they are associated
    is_admin_or_manager = any(r.name in ["Admin", "Manager"] for r in current_user.roles)
    if not is_admin_or_manager:
        from app.models.project import Task
        is_member = db.query(project_members).filter_by(project_id=project_id, user_id=current_user.id).first() is not None
        has_task = db.query(Task).filter_by(project_id=project_id, assigned_to=current_user.id).first() is not None
        if project.owner_id != current_user.id and not is_member and not has_task:
             raise HTTPException(status_code=403, detail="Not enough permissions to view this project")

    return jsonable_encoder({"project": project})

@router.post("/")
def create_project(
    project_in: project_schemas.ProjectCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.PermissionChecker("projects.create")),
):
    project = Project(
        **project_in.model_dump(),
        owner_id=current_user.id
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return jsonable_encoder({"project": project, "message": "Project created"})

@router.patch("/{project_id}")
def update_project(
    project_id: int,
    project_in: project_schemas.ProjectUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Check permission logic
    # edit_own AND owner OR edit_all
    is_owner = project.owner_id == current_user.id
    has_edit_all = False
    try:
        deps.PermissionChecker("projects.edit_all")(current_user)
        has_edit_all = True
    except HTTPException:
        pass

    if not (has_edit_all or (is_owner and deps.PermissionChecker("projects.edit_own")(current_user))):
         raise HTTPException(status_code=403, detail="Not enough permissions")

    for field, value in project_in.model_dump(exclude_unset=True).items():
        setattr(project, field, value)

    db.commit()
    db.refresh(project)
    return jsonable_encoder({"project": project, "message": "Project updated"})

@router.delete("/{project_id}")
def delete_project(
    project_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    is_owner = project.owner_id == current_user.id
    has_delete_all = False
    try:
        deps.PermissionChecker("projects.delete_all")(current_user)
        has_delete_all = True
    except HTTPException:
        pass

    if not (has_delete_all or (is_owner and deps.PermissionChecker("projects.delete_own")(current_user))):
         raise HTTPException(status_code=403, detail="Not enough permissions")

    db.delete(project)
    db.commit()
    return {"message": "Project deleted"}

@router.post("/{project_id}/members")
def add_member(
    project_id: int,
    member_data: dict, # {userId: int, role: str}
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    # Check edit permissions on project?
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    # Same permission check as edit
    is_owner = project.owner_id == current_user.id
    has_edit_all = False
    try:
        deps.PermissionChecker("projects.edit_all")(current_user)
        has_edit_all = True
    except HTTPException:
        pass

    if not (has_edit_all or (is_owner and deps.PermissionChecker("projects.edit_own")(current_user))):
         raise HTTPException(status_code=403, detail="Not enough permissions")

    user_id = member_data.get("userId")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user in project.members:
        raise HTTPException(status_code=409, detail="User already a member")

    # We need to insert into project_members with role
    # SQLAlchemy relationship append doesn't support extra columns easily without association object pattern or direct insert.
    # We defined 'project_members' as a Table.
    stmt = project_members.insert().values(project_id=project_id, user_id=user_id, role=member_data.get("role", "member"))
    db.execute(stmt)
    db.commit()
    
    return {"message": "Member added"}

@router.delete("/{project_id}/members/{user_id}")
def remove_member(
    project_id: int,
    user_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    # Permission check...
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # ... (same check) ...
    stmt = project_members.delete().where(project_members.c.project_id == project_id, project_members.c.user_id == user_id)
    db.execute(stmt)
    db.commit()

    return {"message": "Member removed"}

@router.get("/{project_id}/tasks")
def read_project_tasks(
    project_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # RBAC: Employees can only view if they are associated
    is_admin_or_manager = any(r.name in ["Admin", "Manager"] for r in current_user.roles)
    if not is_admin_or_manager:
        from app.models.project import Task
        is_member = db.query(project_members).filter_by(project_id=project_id, user_id=current_user.id).first() is not None
        has_task = db.query(Task).filter_by(project_id=project_id, assigned_to=current_user.id).first() is not None
        if project.owner_id != current_user.id and not is_member and not has_task:
             raise HTTPException(status_code=403, detail="Not enough permissions to view tasks for this project")
             
        # Optional: return ONLY tasks assigned to them? The UI usually expects all tasks in the project board
        # if they have access to the board. We will return all project tasks to allow collaboration visibility.

    return jsonable_encoder({"tasks": project.tasks})
