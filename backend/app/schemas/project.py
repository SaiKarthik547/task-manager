from typing import Optional, List
from pydantic import BaseModel, condecimal
from datetime import date, datetime
from .user import User

class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None
    status: Optional[str] = 'active'
    priority: Optional[str] = 'medium'
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    
class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    owner_id: Optional[int] = None # Admin reassignment?

class Project(ProjectBase):
    id: int
    owner_id: int
    health_score: int
    created_at: datetime
    updated_at: datetime
    owner: Optional[User] = None
    members: List[User] = []

    class Config:
        from_attributes = True

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    status: Optional[str] = 'not_started'
    priority: Optional[str] = 'medium'
    due_date: Optional[datetime] = None
    estimated_hours: Optional[condecimal(max_digits=5, decimal_places=2)] = None
    actual_hours: Optional[condecimal(max_digits=5, decimal_places=2)] = None
    completion_percentage: Optional[int] = 0

class TaskCreate(TaskBase):
    project_id: Optional[int] = None
    assigned_to: Optional[int] = None
    parent_task_id: Optional[int] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    due_date: Optional[datetime] = None
    assigned_to: Optional[int] = None
    estimated_hours: Optional[condecimal(max_digits=5, decimal_places=2)] = None
    actual_hours: Optional[condecimal(max_digits=5, decimal_places=2)] = None
    completion_percentage: Optional[int] = None

class Task(TaskBase):
    id: int
    project_id: Optional[int]
    assigned_to: Optional[int]
    created_by: int
    created_at: datetime
    updated_at: datetime
    assignee: Optional[User] = None
    creator: Optional[User] = None
    project: Optional[Project] = None # Careful with recursion if Project has Tasks

    class Config:
        from_attributes = True

class CommentBase(BaseModel):
    comment: str

class CommentCreate(CommentBase):
    pass

class Comment(CommentBase):
    id: int
    task_id: int
    user_id: int
    created_at: datetime
    user: Optional[User] = None

    class Config:
        from_attributes = True
