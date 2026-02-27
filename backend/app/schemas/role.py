from typing import Optional, List
from pydantic import BaseModel

class PermissionBase(BaseModel):
    id: int
    name: str
    resource: str
    action: str
    description: Optional[str] = None
    
    class Config:
        from_attributes = True

class RoleBase(BaseModel):
    id: int
    name: str # 'description' was missing in Base? No.
    description: Optional[str] = None
    is_system_role: int

    class Config:
        from_attributes = True

class RoleCreate(BaseModel):
    name: str
    description: Optional[str] = None

class RoleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class RoleWithPermissions(RoleBase):
    permissions: List[PermissionBase] = []
