from fastapi.encoders import jsonable_encoder
from typing import Any, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.api import deps
from app.models import User

router = APIRouter()

@router.get("/")
def search_all(
    q: str = Query(..., min_length=2, description="Search term query"),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Search across Tasks and Projects using basic SQL LIKE or internal logic.
    For production scale, SQLite FTS5 extension could be used, but LIKE over thousands of rows 
    is fast enough for an internal tool.
    
    Returns structured { tasks: [], projects: [] } based on RBAC.
    """
    is_admin = any(row.name == "Admin" for row in current_user.roles)
    
    # 1. Search Tasks
    task_results = []
    if is_admin:
        tasks = db.execute(
            text("SELECT id, title, description, status FROM tasks WHERE title LIKE :q OR description LIKE :q LIMIT 20"),
            {"q": f"%{q}%"}
        ).fetchall()
    else:
        # Employee - only tasks assigned to them or in their projects
        tasks = db.execute(
            text('''
                SELECT t.id, t.title, t.description, t.status 
                FROM tasks t
                LEFT JOIN project_members pm ON t.project_id = pm.project_id
                WHERE (t.title LIKE :q OR t.description LIKE :q)
                AND (t.assigned_to = :uid OR pm.user_id = :uid)
                LIMIT 20
            '''),
            {"q": f"%{q}%", "uid": current_user.id}
        ).fetchall()
        
    for t in tasks:
        task_results.append({
            "id": t[0], "title": t[1], "description": t[2], "status": t[3]
        })
        
    # 2. Search Projects
    project_results = []
    if is_admin:
        projects = db.execute(
            text("SELECT id, name, description, health FROM projects WHERE name LIKE :q OR description LIKE :q LIMIT 20"),
            {"q": f"%{q}%"}
        ).fetchall()
    else:
        projects = db.execute(
            text('''
                SELECT p.id, p.name, p.description, p.health 
                FROM projects p
                LEFT JOIN project_members pm ON p.id = pm.project_id
                WHERE (p.name LIKE :q OR p.description LIKE :q)
                AND (p.owner_id = :uid OR pm.user_id = :uid)
                LIMIT 20
            '''),
            {"q": f"%{q}%", "uid": current_user.id}
        ).fetchall()
        
    for p in projects:
        project_results.append({
            "id": p[0], "name": p[1], "description": p[2], "health": p[3]
        })
        
    return jsonable_encoder({
        "tasks": task_results,
        "projects": project_results
    })
