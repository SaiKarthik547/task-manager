from sqlalchemy import Column, ForeignKey, Integer, String, DateTime, Table, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

conversation_participants = Table('conversation_participants', Base.metadata,
    Column('conversation_id', Integer, ForeignKey('conversations.id', ondelete="CASCADE"), primary_key=True),
    Column('user_id', Integer, ForeignKey('users.id', ondelete="CASCADE"), primary_key=True),
    Column('joined_at', DateTime(timezone=True), server_default=func.now()),
    Column('last_read_at', DateTime(timezone=True))
)

class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(String(20), nullable=False) # 'direct' or 'group' or 'task'
    task_id = Column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=True)
    name = Column(String(100))
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    participants = relationship("app.models.auth.User", secondary=conversation_participants)
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")
    task = relationship("app.models.project.Task")

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content_encrypted = Column(Text, nullable=False)
    checksum = Column(String(64))
    is_private = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    edited_at = Column(DateTime(timezone=True))

    conversation = relationship("Conversation", back_populates="messages")
    sender = relationship("app.models.auth.User")
    attachments = relationship("MessageAttachment", back_populates="message", cascade="all, delete-orphan")

class MessageAttachment(Base):
    __tablename__ = "message_attachments"

    id = Column(Integer, primary_key=True, index=True)
    message_id = Column(Integer, ForeignKey("messages.id", ondelete="CASCADE"), nullable=False)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer)
    mime_type = Column(String(100))
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())

    message = relationship("Message", back_populates="attachments")
