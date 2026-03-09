from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import logging

from app.core.database import SessionLocal
from app.models import Project, Task, Notification
from app.services.task_service import task_service

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()

async def recalculate_project_health():
    """Run hourly: Recalculate health based on completed vs total tasks"""
    logger.info("Running Project Health Recalculation...")
    db: Session = SessionLocal()
    try:
        projects = db.query(Project).all()
        for project in projects:
            total_tasks = len(project.tasks)
            if total_tasks == 0:
                project.health = "green"
            else:
                completed = sum(1 for t in project.tasks if t.status == "completed")
                ratio = completed / total_tasks
                
                # Check overdue tasks
                now = datetime.utcnow()
                overdue = sum(1 for t in project.tasks if t.status != "completed" and t.due_date and t.due_date < now)
                
                if overdue > len(project.tasks) * 0.2:
                    project.health = "red"
                elif ratio < 0.5 and overdue > 0:
                    project.health = "yellow"
                else:
                    project.health = "green"
        db.commit()
    except Exception as e:
        logger.error(f"Error in recalculate_project_health: {e}")
    finally:
        db.close()

async def daily_deadline_reminders():
    """Run daily: Find tasks due in <24h and notify assignees"""
    logger.info("Running Daily Deadline Reminders...")
    db: Session = SessionLocal()
    try:
        now = datetime.utcnow()
        tomorrow = now + timedelta(days=1)
        
        tasks_due_soon = db.query(Task).filter(
            Task.status != "completed",
            Task.due_date > now,
            Task.due_date <= tomorrow,
            Task.assigned_to != None
        ).all()
        
        for task in tasks_due_soon:
            await task_service.create_and_emit_notification(
                db=db,
                user_id=task.assigned_to,
                notif_type="deadline_reminder",
                title="Task Deadline Approaching",
                content=f"Task '{task.title}' is due in less than 24 hours!"
            )
    except Exception as e:
        logger.error(f"Error in daily_deadline_reminders: {e}")
    finally:
        db.close()

async def weekly_notification_cleanup():
    """Run weekly: Delete read notifications older than 30 days"""
    logger.info("Running Weekly Notification Cleanup...")
    db: Session = SessionLocal()
    try:
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        
        deleted_count = db.query(Notification).filter(
            Notification.is_read == 1,
            Notification.created_at < thirty_days_ago
        ).delete()
        
        db.commit()
        logger.info(f"Cleaned up {deleted_count} old notifications.")
    except Exception as e:
        logger.error(f"Error in weekly_notification_cleanup: {e}")
    finally:
        db.close()

def start_jobs():
    """Initialize and start the background scheduler"""
    logger.info("Starting Background Scheduler...")
    
    # Add real cron jobs
    scheduler.add_job(recalculate_project_health, CronTrigger(minute=0)) # hourly
    scheduler.add_job(daily_deadline_reminders, CronTrigger(hour=9, minute=0)) # daily at 9am
    scheduler.add_job(weekly_notification_cleanup, CronTrigger(day_of_week='sun', hour=2, minute=0)) # sunday 2am
    
    # Run once at startup for testing/sync
    scheduler.add_job(recalculate_project_health)
    
    scheduler.start()
