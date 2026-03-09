from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.project import Task, task_dependencies
from app.models.system import Notification
from app.core.socket import sio
import re

class TaskService:
    @staticmethod
    def validate_status_transition(current_status: str, new_status: str):
        """
        Validates if a task status transition is allowed.
        Simple state machine for Phase 3.
        """
        allowed_transitions = {
            "not_started": ["in_progress", "cancelled"],
            "in_progress": ["in_review", "completed", "blocked", "cancelled"],
            "in_review": ["completed", "in_progress"], # Approved -> Complete, Rejected -> in_progress
            "blocked": ["in_progress", "cancelled"],
            "completed": [], # Terminal state
            "cancelled": []  # Terminal state
        }
        
        # If no status change, it's valid
        if current_status == new_status:
            return True
            
        if new_status not in allowed_transitions.get(current_status, []):
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid status transition from {current_status} to {new_status}"
            )
        return True

    @staticmethod
    def check_dependencies(db: Session, task_id: int):
        """
        Query TaskDependency table to ensure a task is not moved to "in_progress" 
        if blocked_by tasks are incomplete.
        """
        task = db.query(Task).filter(Task.id == task_id).first()
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
            
        # Check all tasks that this task DEPENDS ON
        for dep in task.dependencies:
            if dep.status != "completed":
                raise HTTPException(
                    status_code=400, 
                    detail=f"Cannot start task. Dependent task '{dep.title}' is not completed."
                )
        return True

    @staticmethod
    async def create_and_emit_notification(db: Session, user_id: int, notif_type: str, title: str, content: str):
        """
        Centralized alert generation and socket emission.
        """
        notification = Notification(
            user_id=user_id,
            type=notif_type,
            title=title,
            content=content,
            is_read=0
        )
        db.add(notification)
        db.commit()
        db.refresh(notification)

        # Emit standard notification payload
        await sio.emit(
            "notification_created",
            {
                "id": notification.id,
                "type": notification.type,
                "title": notification.title,
                "content": notification.content,
                "created_at": notification.created_at.isoformat(),
                "is_read": notification.is_read
            },
            room=f"user_{user_id}"
        )
        return notification

    @staticmethod
    async def process_mentions(db: Session, content: str, sender_name: str, task_title: str):
        """
        Implement @username regex parser. Generates notifications for mentions.
        """
        from app.models.auth import User
        
        # Find all lowercase word characters preceded by @
        mentions = re.findall(r'@(\w+)', content)
        if not mentions:
            return []
            
        notified_users = []
        for username in set(mentions):
            user = db.query(User).filter(User.username == username).first()
            if user:
                await TaskService.create_and_emit_notification(
                    db=db,
                    user_id=user.id,
                    notif_type="mention",
                    title="New Mention",
                    content=f"{sender_name} mentioned you in task: '{task_title}'"
                )
                notified_users.append(user.id)
                
        return notified_users

    @staticmethod
    async def emit_task_created(task: Task):
        if not task.assigned_to:
            return
        await sio.emit(
            "task_created",
            {
                "task": {
                    "id": task.id,
                    "title": task.title,
                    "description": task.description,
                    "status": task.status,
                    "priority": task.priority,
                    "assigned_to": task.assigned_to,
                    "project_id": task.project_id,
                    "due_date": task.due_date.isoformat() if task.due_date else None,
                    "created_by": task.created_by
                }
            },
            room=f"user_{task.assigned_to}"
        )

    @staticmethod
    async def emit_task_updated(task: Task):
        if not task.assigned_to:
            return
        await sio.emit(
            "task_updated",
            {
                "task": {
                    "id": task.id,
                    "title": task.title,
                    "description": task.description,
                    "status": task.status,
                    "priority": task.priority,
                    "assigned_to": task.assigned_to,
                    "project_id": task.project_id,
                    "due_date": task.due_date.isoformat() if task.due_date else None,
                    "created_by": task.created_by
                }
            },
            room=f"user_{task.assigned_to}"
        )

    @staticmethod
    async def emit_task_comment_created(task: Task, comment, user):
        if not task.assigned_to:
            return
        await sio.emit(
            "task_comment_created",
            {
                "taskId": task.id,
                "comment": {
                    "id": comment.id,
                    "comment": comment.comment,
                    "created_at": comment.created_at.isoformat(),
                    "user": {
                        "id": user.id,
                        "full_name": user.full_name,
                        "username": user.username
                    }
                }
            },
            room=f"user_{task.assigned_to}"
        )

task_service = TaskService()
