from sqlalchemy import Column, ForeignKey, Integer, String, DateTime, Date, DECIMAL, Table, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

# Association Tables
project_members = Table('project_members', Base.metadata,
    Column('project_id', Integer, ForeignKey('projects.id', ondelete="CASCADE"), primary_key=True),
    Column('user_id', Integer, ForeignKey('users.id', ondelete="CASCADE"), primary_key=True),
    Column('role', String(20), default='member'),
    Column('added_at', DateTime(timezone=True), server_default=func.now())
)

task_dependencies = Table('task_dependencies', Base.metadata,
    Column('task_id', Integer, ForeignKey('tasks.id', ondelete="CASCADE"), primary_key=True),
    Column('depends_on_task_id', Integer, ForeignKey('tasks.id', ondelete="CASCADE"), primary_key=True)
)

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String(20), default='active')
    priority = Column(String(20), default='medium')
    start_date = Column(Date)
    end_date = Column(Date)
    health = Column(String(20), default='green')
    health_score = Column(Integer, default=100)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    owner = relationship("app.models.auth.User", foreign_keys=[owner_id])
    members = relationship("app.models.auth.User", secondary=project_members)
    tasks = relationship("Task", back_populates="project", cascade="all, delete-orphan")

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"))
    parent_task_id = Column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=True)
    assigned_to = Column(Integer, ForeignKey("users.id"), index=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String(20), default='not_started', index=True)
    priority = Column(String(20), default='medium')
    due_date = Column(DateTime(timezone=True))
    estimated_hours = Column(DECIMAL(5, 2))
    actual_hours = Column(DECIMAL(5, 2))
    completion_percentage = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    completed_at = Column(DateTime(timezone=True))

    project = relationship("Project", back_populates="tasks")
    assignee = relationship("app.models.auth.User", foreign_keys=[assigned_to])
    creator = relationship("app.models.auth.User", foreign_keys=[created_by])
    parent = relationship("Task", remote_side=[id], backref="subtasks")
    
    dependencies = relationship(
        "Task",
        secondary=task_dependencies,
        primaryjoin=id==task_dependencies.c.task_id,
        secondaryjoin=id==task_dependencies.c.depends_on_task_id,
        backref="dependent_tasks"
    )
    
    comments = relationship("TaskComment", back_populates="task", cascade="all, delete-orphan")
    attachments = relationship("TaskAttachment", back_populates="task", cascade="all, delete-orphan")

class TaskComment(Base):
    __tablename__ = "task_comments"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    comment = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    task = relationship("Task", back_populates="comments")
    user = relationship("app.models.auth.User")

class TaskAttachment(Base):
    __tablename__ = "task_attachments"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer)
    mime_type = Column(String(100))
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())

    task = relationship("Task", back_populates="attachments")
    user = relationship("app.models.auth.User")
