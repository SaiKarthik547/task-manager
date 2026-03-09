import asyncio
import os
import sys

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine, Base
from app.models.auth import User, Role, Permission
from app.core.security import get_password_hash

def seed_users():
    print("Seeding users...")
    db = SessionLocal()
    try:
        # Get roles
        admin_role = db.query(Role).filter(Role.name == "admin").first()
        manager_role = db.query(Role).filter(Role.name == "manager").first()
        employee_role = db.query(Role).filter(Role.name == "employee").first()

        users_to_create = [
            # Admins
            {"username": "admin2", "email": "admin2@example.com", "full_name": "Second Admin", "role": admin_role},
            
            # Managers
            {"username": "manager2", "email": "manager2@example.com", "full_name": "Sales Manager", "role": manager_role},
            {"username": "manager3", "email": "manager3@example.com", "full_name": "Engineering Manager", "role": manager_role},
            
            # Employees
            {"username": "emp2", "email": "emp2@example.com", "full_name": "John Doe", "role": employee_role},
            {"username": "emp3", "email": "emp3@example.com", "full_name": "Jane Smith", "role": employee_role},
            {"username": "emp4", "email": "emp4@example.com", "full_name": "Alice Johnson", "role": employee_role},
            {"username": "emp5", "email": "emp5@example.com", "full_name": "Bob Williams", "role": employee_role},
        ]

        for user_data in users_to_create:
            existing_user = db.query(User).filter(User.username == user_data["username"]).first()
            if not existing_user:
                new_user = User(
                    username=user_data["username"],
                    email=user_data["email"],
                    full_name=user_data["full_name"],
                    password_hash=get_password_hash("Password@123"),
                    is_active=True
                )
                db.add(new_user)
                if user_data["role"]:
                    new_user.roles.append(user_data["role"])
                print(f"Created user: {user_data['username']}")
            else:
                print(f"User {user_data['username']} already exists")
        
        db.commit()
        print("User seeding complete.")
    except Exception as e:
        print(f"Error seeding: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_users()
