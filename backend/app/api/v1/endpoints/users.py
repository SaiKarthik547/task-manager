from fastapi.encoders import jsonable_encoder
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api import deps
from app.core import security
from app.models import User, Role
from app.schemas import user as user_schemas, role as role_schemas

router = APIRouter()

@router.get("/") # Returns {users: []}
def read_users(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    skip: int = 0,
    limit: int = 100
):
    has_view_all = False
    try:
        deps.PermissionChecker("users.view")(current_user)
        has_view_all = True
    except HTTPException:
        pass
        
    is_admin_or_manager = any(r.name in ["Admin", "Manager"] for r in current_user.roles)
    
    if has_view_all or is_admin_or_manager:
        users = db.query(User).offset(skip).limit(limit).all()
    else:
        # Strict RBAC for Employees: See Admins, Managers, Teammates, and Project Co-Members
        from app.models.project import project_members
        from app.models.auth import Role, user_roles
        
        # 1. Admins and Managers
        admin_and_mgr_roles = db.query(Role.id).filter(Role.name.in_(["Admin", "Manager"])).all()
        role_ids = [r[0] for r in admin_and_mgr_roles]
        
        admin_mgr_user_ids = []
        if role_ids:
            admin_mgr_users = db.query(user_roles.c.user_id).filter(user_roles.c.role_id.in_(role_ids)).all()
            admin_mgr_user_ids = [u[0] for u in admin_mgr_users]
            
        # 2. Teammates (same manager)
        teammate_ids = []
        if current_user.manager_id:
            teammates = db.query(User.id).filter(User.manager_id == current_user.manager_id).all()
            teammate_ids = [t[0] for t in teammates]
            
        # 3. Project Co-Members
        project_ids_subq = db.query(project_members.c.project_id).filter(project_members.c.user_id == current_user.id).subquery()
        co_members = db.query(project_members.c.user_id).filter(project_members.c.project_id.in_(project_ids_subq)).all()
        co_member_ids = [m[0] for m in co_members]
        
        # Combine all allowed IDs
        allowed_ids = set([current_user.id, current_user.manager_id] + admin_mgr_user_ids + teammate_ids + co_member_ids)
        allowed_ids.discard(None)
        
        users = db.query(User).filter(User.id.in_(list(allowed_ids))).offset(skip).limit(limit).all()
        
    return jsonable_encoder({"users": users})

@router.get("/{user_id}")
def read_user_by_id(
    user_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return jsonable_encoder({"user": user})

@router.patch("/{user_id}")
def update_user(
    user_id: int,
    user_in: user_schemas.UserUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Permission check
    is_self = user_id == current_user.id
    has_edit_any = False
    try:
        deps.PermissionChecker("users.edit")(current_user)
        has_edit_any = True
    except HTTPException:
        pass
    
    if not (is_self or has_edit_any):
        raise HTTPException(status_code=403, detail="Not enough permissions")

    # Update fields
    if user_in.email is not None:
        user.email = user_in.email
    if user_in.full_name is not None:
        user.full_name = user_in.full_name
    if user_in.password is not None:
        user.password_hash = security.get_password_hash(user_in.password)
    if user_in.is_active is not None:
        if not has_edit_any:
             raise HTTPException(status_code=403, detail="Cannot change activation status")
        user.is_active = user_in.is_active

    db.commit()
    return {"message": "User updated"}

@router.post("/{user_id}/roles")
def assign_role(
    user_id: int,
    role_data: dict, # {roleId: int}
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.PermissionChecker("users.edit")),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    role_id = role_data.get("roleId")
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    if role in user.roles:
        raise HTTPException(status_code=409, detail="User already has this role")
    
    user.roles.append(role)
    db.commit()
    return {"message": "Role assigned"}

@router.delete("/{user_id}/roles/{role_id}")
def remove_role(
    user_id: int,
    role_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.PermissionChecker("users.edit")),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    if role not in user.roles:
        return {"message": "Role removed"} # Idempotent matches legacy? Legacy error? Legacy is silent or error? Legacy code: DELETE FROM where... if not found just 0 rows.
    
    user.roles.remove(role)
    db.commit()
    return {"message": "Role removed"}

@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.PermissionChecker("users.delete")),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db.delete(user)
    db.commit()
    return {"message": "User deleted"}
