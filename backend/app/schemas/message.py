from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime
from .user import User # or UserBase

class MessageBase(BaseModel):
    content: str

class MessageCreate(MessageBase):
    recipient_id: Optional[int] = None # For creating conversation
    conversation_id: Optional[int] = None # For sending to existing?

class MessageResponse(MessageBase):
    id: int
    conversation_id: int
    sender_id: int
    created_at: datetime
    sender: Optional[User] = None
    is_private: int
    
    class Config:
        from_attributes = True

class ConversationBase(BaseModel):
    pass

class ConversationResponse(BaseModel):
    id: int
    type: str
    name: Optional[str] = None
    updated_at: Optional[datetime] = None # derived from last message?
    participants: List[User] = []
    last_message: Optional[MessageResponse] = None

    class Config:
        from_attributes = True

class NotificationBase(BaseModel):
    pass

class NotificationResponse(BaseModel):
    id: int
    type: str
    title: str
    content: Optional[str] = None
    link: Optional[str] = None
    is_read: int
    created_at: datetime

    class Config:
        from_attributes = True
