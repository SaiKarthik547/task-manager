from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine, Base
from app.models import User, Role, Permission, Project, Task, SystemSettings, user_roles, role_permissions
from app.core.security import get_password_hash
from datetime import datetime, timedelta, date

def seed_db():
    print("🔧 Ensuring database schema is up to date...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        print("🌱 Seeding database...")
        
        # 1. Permissions
        permissions_data = [
            # User Management
            {'name': 'users.view', 'resource': 'users', 'action': 'view', 'description': 'View all users'},
            {'name': 'users.create', 'resource': 'users', 'action': 'create', 'description': 'Create new users'},
            {'name': 'users.edit', 'resource': 'users', 'action': 'edit', 'description': 'Edit any user'},
            {'name': 'users.edit_own', 'resource': 'users', 'action': 'edit', 'description': 'Edit own profile'},
            {'name': 'users.delete', 'resource': 'users', 'action': 'delete', 'description': 'Delete users'},
            
            # Role Management
            {'name': 'roles.view', 'resource': 'roles', 'action': 'view', 'description': 'View roles'},
            {'name': 'roles.create', 'resource': 'roles', 'action': 'create', 'description': 'Create custom roles'},
            {'name': 'roles.edit', 'resource': 'roles', 'action': 'edit', 'description': 'Edit roles'},
            {'name': 'roles.delete', 'resource': 'roles', 'action': 'delete', 'description': 'Delete roles'},
            
            # Permission Management
            {'name': 'permissions.view', 'resource': 'permissions', 'action': 'view', 'description': 'View permissions'},
            {'name': 'permissions.assign', 'resource': 'permissions', 'action': 'assign', 'description': 'Assign permissions to roles'},

            # Project Management
            {'name': 'projects.view', 'resource': 'projects', 'action': 'view', 'description': 'View projects'},
            {'name': 'projects.create', 'resource': 'projects', 'action': 'create', 'description': 'Create projects'},
            {'name': 'projects.edit_own', 'resource': 'projects', 'action': 'edit', 'description': 'Edit own projects'},
            {'name': 'projects.edit_all', 'resource': 'projects', 'action': 'edit', 'description': 'Edit any project'},
            {'name': 'projects.delete_own', 'resource': 'projects', 'action': 'delete', 'description': 'Delete own projects'},
            {'name': 'projects.delete_all', 'resource': 'projects', 'action': 'delete', 'description': 'Delete any project'},

            # Task Management
            {'name': 'tasks.view_assigned', 'resource': 'tasks', 'action': 'view', 'description': 'View assigned tasks'},
            {'name': 'tasks.view_team', 'resource': 'tasks', 'action': 'view', 'description': 'View team tasks'},
            {'name': 'tasks.view_all', 'resource': 'tasks', 'action': 'view', 'description': 'View all tasks'},
            {'name': 'tasks.create', 'resource': 'tasks', 'action': 'create', 'description': 'Create tasks'},
            {'name': 'tasks.edit_own', 'resource': 'tasks', 'action': 'edit', 'description': 'Edit own tasks'},
            {'name': 'tasks.edit_team', 'resource': 'tasks', 'action': 'edit', 'description': 'Edit team tasks'},
            {'name': 'tasks.edit_all', 'resource': 'tasks', 'action': 'edit', 'description': 'Edit any task'},
            {'name': 'tasks.delete', 'resource': 'tasks', 'action': 'delete', 'description': 'Delete tasks'},
            {'name': 'tasks.approve', 'resource': 'tasks', 'action': 'approve', 'description': 'Approve tasks'},
            {'name': 'tasks.reject', 'resource': 'tasks', 'action': 'reject', 'description': 'Reject tasks'},
            {'name': 'tasks.comment', 'resource': 'tasks', 'action': 'comment', 'description': 'Comment on tasks'},
            {'name': 'tasks.upload', 'resource': 'tasks', 'action': 'upload', 'description': 'Upload attachments'},

            # Messaging
            {'name': 'messages.send', 'resource': 'messages', 'action': 'send', 'description': 'Send messages'},
            {'name': 'messages.view_own', 'resource': 'messages', 'action': 'view', 'description': 'View own messages'},
            {'name': 'messages.view_metadata', 'resource': 'messages', 'action': 'view', 'description': 'View message metadata only'},

            # Audit & System
            {'name': 'audit.view', 'resource': 'audit', 'action': 'view', 'description': 'View audit logs'},
            {'name': 'system.edit', 'resource': 'system', 'action': 'edit', 'description': 'Edit system settings'},
            {'name': 'backup.create', 'resource': 'backup', 'action': 'create', 'description': 'Create backups'},
            {'name': 'backup.restore', 'resource': 'backup', 'action': 'restore', 'description': 'Restore backups'},
            {'name': 'reports.view', 'resource': 'reports', 'action': 'view', 'description': 'View reports'},
        ]

        if db.query(Permission).count() == 0:
            for p_data in permissions_data:
                perm = Permission(**p_data)
                db.add(perm)
            db.commit()
            print(f"✅ Created {len(permissions_data)} permissions")
        
        # 2. Roles
        roles_data = [
            {'name': 'Admin', 'description': 'Full system access', 'is_system_role': 1},
            {'name': 'Manager', 'description': 'Team and project management', 'is_system_role': 1},
            {'name': 'Employee', 'description': 'Basic task access', 'is_system_role': 1},
        ]

        roles_map = {}
        if db.query(Role).count() == 0:
            for r_data in roles_data:
                role = Role(**r_data)
                db.add(role)
                db.commit() # commit to get ID
                db.refresh(role)
                roles_map[role.name] = role
            print(f"✅ Created {len(roles_data)} roles")
        else:
             for r in db.query(Role).all():
                 roles_map[r.name] = r

        # 3. Assign Permissions
        # Admin gets all
        admin_role = roles_map.get('Admin')
        all_perms = db.query(Permission).all()
        if admin_role and not admin_role.permissions:
            admin_role.permissions = all_perms
            db.commit()
            print("✅ Admin permissions assigned")

        # Manager Permissions
        manager_perm_names = [
            'users.view',
            'projects.view', 'projects.create', 'projects.edit_own', 'projects.delete_own',
            'tasks.view_team', 'tasks.create', 'tasks.edit_team', 'tasks.approve', 'tasks.reject', 'tasks.comment',
            'messages.send', 'messages.view_own', 'reports.view',
        ]
        manager_role = roles_map.get('Manager')
        if manager_role and not manager_role.permissions:
             manager_perms = [p for p in all_perms if p.name in manager_perm_names]
             manager_role.permissions = manager_perms
             db.commit()
             print("✅ Manager permissions assigned")

        # Employee Permissions
        employee_perm_names = [
            'tasks.view_assigned', 'tasks.edit_own', 'tasks.comment', 'tasks.upload',
            'messages.send', 'messages.view_own', 'users.edit_own',
        ]
        employee_role = roles_map.get('Employee')
        if employee_role and not employee_role.permissions:
             employee_perms = [p for p in all_perms if p.name in employee_perm_names]
             employee_role.permissions = employee_perms
             db.commit()
             print("✅ Employee permissions assigned")

        # 4. Users
        users_raw = [
             {'username': 'admin', 'email': 'admin@localhost.local', 'password': 'Admin@123', 'full_name': 'System Administrator', 'role': 'Admin'},
             {'username': 'admin2', 'email': 'admin2@localhost.local', 'password': 'Admin@123', 'full_name': 'Second Admin', 'role': 'Admin'},
             
             {'username': 'manager1', 'email': 'manager1@localhost.local', 'password': 'Manager@123', 'full_name': 'John Manager', 'role': 'Manager'},
             {'username': 'manager2', 'email': 'manager2@localhost.local', 'password': 'Manager@123', 'full_name': 'Sarah Manager', 'role': 'Manager'},
             {'username': 'manager3', 'email': 'manager3@localhost.local', 'password': 'Manager@123', 'full_name': 'David Manager', 'role': 'Manager'},
             
             {'username': 'employee1', 'email': 'employee1@localhost.local', 'password': 'Employee@123', 'full_name': 'Alice Employee', 'role': 'Employee', 'manager': 'manager1'},
             {'username': 'employee2', 'email': 'employee2@localhost.local', 'password': 'Employee@123', 'full_name': 'Mary Employee', 'role': 'Employee', 'manager': 'manager1'},
             {'username': 'emp2', 'email': 'emp2@localhost.local', 'password': 'Employee@123', 'full_name': 'James Employee', 'role': 'Employee', 'manager': 'manager2'},
             {'username': 'emp3', 'email': 'emp3@localhost.local', 'password': 'Employee@123', 'full_name': 'Linda Employee', 'role': 'Employee', 'manager': 'manager2'},
             {'username': 'emp4', 'email': 'emp4@localhost.local', 'password': 'Employee@123', 'full_name': 'Robert Employee', 'role': 'Employee', 'manager': 'manager3'},
             {'username': 'emp5', 'email': 'emp5@localhost.local', 'password': 'Employee@123', 'full_name': 'Patricia Employee', 'role': 'Employee', 'manager': 'manager3'},
        ]

        # First pass: Create users
        user_objs = {}
        for u_data in users_raw:
            user = db.query(User).filter(User.username == u_data['username']).first()
            if not user:
                user = User(
                    username=u_data['username'],
                    email=u_data['email'],
                    password_hash=get_password_hash(u_data['password']),
                    full_name=u_data['full_name'],
                    is_active=1
                )
                db.add(user)
                db.commit()
                db.refresh(user)
                
                role = roles_map.get(u_data['role'])
                if role:
                    user.roles.append(role)
                    db.commit()
            user_objs[u_data['username']] = user

        # Second pass: Assign managers
        for u_data in users_raw:
            if 'manager' in u_data:
                user = user_objs[u_data['username']]
                manager = user_objs.get(u_data['manager'])
                if manager:
                    user.manager_id = manager.id
        db.commit()
        print(f"✅ Created/Verified {len(users_raw)} users with manager mappings")

        # 5. Sample Data (Expanded)
        if db.query(Project).count() <= 1:
            m1 = user_objs['manager1']
            m2 = user_objs['manager2']
            
            p1 = Project(name='Website Redesign', description='Modern UI for company site', owner_id=m1.id, status='active', priority='high', start_date=date(2026, 1, 20), end_date=date(2026, 3, 20), health='green')
            p2 = Project(name='Mobile App v2', description='New React Native app', owner_id=m2.id, status='active', priority='medium', start_date=date(2026, 2, 5), end_date=date(2026, 5, 20), health='yellow')
            db.add_all([p1, p2])
            db.commit()
            db.refresh(p1)
            db.refresh(p2)

            # Assign tasks to all employees so they see SOMETHING
            tasks = [
                Task(title='Design Homepage', project_id=p1.id, assigned_to=user_objs['employee1'].id, created_by=m1.id, status='completed', due_date=datetime.now() - timedelta(days=2)),
                Task(title='Setup API', project_id=p1.id, assigned_to=user_objs['employee2'].id, created_by=m1.id, status='in_progress', due_date=datetime.now() + timedelta(days=5)),
                Task(title='Login Screen', project_id=p2.id, assigned_to=user_objs['emp2'].id, created_by=m2.id, status='in_progress', due_date=datetime.now() - timedelta(days=1)), # Overdue
                Task(title='Push Notifications', project_id=p2.id, assigned_to=user_objs['emp3'].id, created_by=m2.id, status='not_started', due_date=datetime.now() + timedelta(days=10)),
            ]
            db.add_all(tasks)
            db.commit()
            print("✅ Created expanded sample projects and tasks")
        
        # System Settings
        if db.query(SystemSettings).count() == 0:
            settings = [
                {'key': 'organization_name', 'value': 'My Company', 'description': 'Organization name'},
                {'key': 'max_file_size_mb', 'value': '50', 'description': 'Maximum file upload size in MB'},
                {'key': 'session_timeout_minutes', 'value': '480', 'description': 'Session timeout (8 hours)'},
                {'key': 'enable_email_notifications', 'value': 'false', 'description': 'Enable email notifications (local only)'},
            ]
            for s in settings:
                 db.add(SystemSettings(**s))
            db.commit()
            print("✅ Created system settings")

    except Exception as e:
        print(f"❌ Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
