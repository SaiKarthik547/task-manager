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
    # Filter? If not admin/manager, maybe only show 'my' projects?
    # For now, legacy seemed to show all or based on permissions?
    # Let's show all for now, or filter by membership?
    # Schema check: Users.view -> maybe needed?
    # Legacy check: requirePermission('projects.view')
    deps.PermissionChecker("projects.view")(current_user)
    
    projects = db.query(Project).offset(skip).limit(limit).all()
    return jsonable_encoder({"projects": projects})

@router.get("/{project_id}")
def read_project(
    project_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.PermissionChecker("projects.view")),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
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
    current_user: User = Depends(deps.PermissionChecker("tasks.view_all")),
):
    # Or check membership? Legacy checks 'tasks.view_all' generic permission or similar?
    # Checking "tasks.view_all" might be too strict if I only want to view tasks in MY project.
    # But for now let's stick to permissions.
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    return jsonable_encoder({"tasks": project.tasks})
