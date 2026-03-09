from fastapi.encoders import jsonable_encoder
from datetime import datetime, timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm

from app.api import deps
from app.core import security
from app.core.config import settings
from app.models import User
from app.schemas import auth as auth_schemas
from jose import jwt

router = APIRouter()

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    
    # "exp" claim is standard
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm="HS256")
    return encoded_jwt

@router.post("/login", response_model=auth_schemas.Token)
def login_access_token(
    db: Session = Depends(deps.get_db),
    login_req: auth_schemas.LoginRequest = None # Support JSON body
):
    # Support both JSON and Form (if we want, but frontend sends JSON)
    if not login_req:
         raise HTTPException(status_code=400, detail="Missing request body")

    user = db.query(User).filter(User.username == login_req.username).first()
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    if not security.verify_password(login_req.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # Build payload to match legacy: userId, username, email, roleIds, permissions
    role_ids = [r.id for r in user.roles]
    permissions = []
    for role in user.roles:
        for perm in role.permissions:
            permissions.append(perm.name)
    
    # Dedup permissions
    permissions = list(set(permissions))

    payload = {
        "userId": user.id,
        "username": user.username,
        "email": user.email,
        "roleIds": role_ids,
        "permissions": permissions,
        "sub": str(user.id) # Standard claim
    }

    encoded_token = jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")

    # Update last login
    user.last_login = datetime.utcnow()
    db.commit()

    return {
        "access_token": encoded_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "fullName": user.full_name,
            "roleIds": role_ids,
            "permissions": permissions
        }
    }

@router.get("/me", response_model=dict) # Return dict matching frontend expectation
def read_users_me(
    current_user: User = Depends(deps.get_current_active_user),
):
    role_ids = [r.id for r in current_user.roles]
    permissions = []
    for role in current_user.roles:
        for perm in role.permissions:
            permissions.append(perm.name)
    permissions = list(set(permissions))

    return {
        "user": {
            "id": current_user.id,
            "username": current_user.username,
            "email": current_user.email,
            "fullName": current_user.full_name, # Frontend expects fullName
            "roleIds": role_ids,
            "permissions": permissions,
            "is_active": current_user.is_active,
            "created_at": current_user.created_at,
            "last_login": current_user.last_login,
        }
    }
