from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api import deps
from app.models import Role, Permission
from app.schemas import role as role_schemas

router = APIRouter()

@router.get("/", response_model=Any)
def read_roles(
    db: Session = Depends(deps.get_db),
    current_user: Any = Depends(deps.PermissionChecker("roles.view")),
):
    roles = db.query(Role).order_by(Role.is_system_role.desc(), Role.name.asc()).all()
    return {"roles": roles}

@router.get("/permissions", response_model=Any)
def read_all_permissions(
    db: Session = Depends(deps.get_db),
    current_user: Any = Depends(deps.PermissionChecker("permissions.view")),
):
    permissions = db.query(Permission).order_by(Permission.resource, Permission.action).all()
    return {"permissions": permissions}

@router.get("/{role_id}/permissions", response_model=Any)
def read_role_permissions(
    role_id: int,
    db: Session = Depends(deps.get_db),
    current_user: Any = Depends(deps.PermissionChecker("roles.view")),
):
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    return {"permissions": role.permissions}

@router.post("/", response_model=Any)
def create_role(
    role_in: role_schemas.RoleCreate,
    db: Session = Depends(deps.get_db),
    current_user: Any = Depends(deps.PermissionChecker("roles.create")),
):
    role = db.query(Role).filter(Role.name == role_in.name).first()
    if role:
        raise HTTPException(status_code=409, detail="Role name already exists")
    
    new_role = Role(
        name=role_in.name,
        description=role_in.description,
        is_system_role=0
    )
    db.add(new_role)
    db.commit()
    db.refresh(new_role)
    return {"message": "Role created", "roleId": new_role.id}

@router.patch("/{role_id}", response_model=Any)
def update_role(
    role_id: int,
    role_in: role_schemas.RoleUpdate,
    db: Session = Depends(deps.get_db),
    current_user: Any = Depends(deps.PermissionChecker("roles.edit")),
):
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    if role.is_system_role:
        raise HTTPException(status_code=403, detail="Cannot modify system roles")
    
    if role_in.name is not None:
        role.name = role_in.name
    if role_in.description is not None:
        role.description = role_in.description
    
    db.commit()
    return {"message": "Role updated"}

@router.post("/{role_id}/permissions", response_model=Any)
def assign_permission(
    role_id: int,
    perm_data: dict, # {permissionId: int}
    db: Session = Depends(deps.get_db),
    current_user: Any = Depends(deps.PermissionChecker("permissions.assign")),
):
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    perm_id = perm_data.get("permissionId")
    permission = db.query(Permission).filter(Permission.id == perm_id).first()
    if not permission:
        raise HTTPException(status_code=404, detail="Permission not found")
    
    if permission in role.permissions:
        raise HTTPException(status_code=409, detail="Permission already assigned")
    
    role.permissions.append(permission)
    db.commit()
    return {"message": "Permission assigned"}

@router.delete("/{role_id}/permissions/{permission_id}", response_model=Any)
def remove_permission(
    role_id: int,
    permission_id: int,
    db: Session = Depends(deps.get_db),
    current_user: Any = Depends(deps.PermissionChecker("permissions.assign")),
):
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    permission = db.query(Permission).filter(Permission.id == permission_id).first()
    if not permission:
        raise HTTPException(status_code=404, detail="Permission not found")
    
    if permission in role.permissions:
        role.permissions.remove(permission)
        db.commit()
    
    return {"message": "Permission removed"}

@router.delete("/{role_id}", response_model=Any)
def delete_role(
    role_id: int,
    db: Session = Depends(deps.get_db),
    current_user: Any = Depends(deps.PermissionChecker("roles.delete")),
):
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    if role.is_system_role:
        raise HTTPException(status_code=403, detail="Cannot delete system roles")
    
    db.delete(role)
    db.commit()
    return {"message": "Role deleted"}
