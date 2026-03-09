# Task Management System (TMS)

A production-ready, 100% free, self-hosted **Enterprise Task Management Platform** with real-time messaging, comprehensive RBAC, audit logging, and privacy-first end-to-end encrypted communications.

**Version**: 1.0.0  
**Last Updated**: February 2026  
**License**: MIT (Free for commercial and personal use)

---

## 📋 Table of Contents

- [Features](#features)
- [System Architecture](#system-architecture)
- [Tech Stack](#tech-stack)
- [Database Schema](#database-schema)
- [Installation](#installation)
- [Configuration](#configuration)
- [API Endpoints](#api-endpoints)
- [Permission Matrix](#permission-matrix)
- [Real-Time Features](#real-time-features)
- [Project Structure](#project-structure)

---

## ✨ Features

### 🚀 Production-Grade Implementation Updates
✅ **System-Wide Dark Mode** - Premium dynamic theming implemented with Tailwind CSS and saved user preferences.
✅ **Robust Authentication** - Fixed Python 3.12+ legacy `passlib` issues by migrating to direct `bcrypt` hashing for 100% login success.
✅ **Real-Time Direct Messaging** - Re-architected Socket.io implementation to deliver messages instantly to private `user_{id}` rooms.
✅ **Enterprise Scalability** - SQLite upgraded to Write-Ahead Logging (WAL) mode to handle high-frequency concurrent socket reads/writes without database locking.
✅ **Data Consistency** - All FastApi endpoints fully patched with `jsonable_encoder` to eliminate 500 Pydantic formatting errors.
✅ **Offline Notifications** - Real-time chat activity seamlessly triggers persistent database notifications when users are interacting.

### Core Functionality
✅ **100% Free & Open-Source** - No paid dependencies or licensing fees  
✅ **Self-Hosted** - Full control over your data and infrastructure  
✅ **Multi-Environment** - SQLite for development, PostgreSQL for production  
✅ **Offline Capable** - Works with local database, full synchronization  

### Task Management
✅ **Hierarchical Tasks** - Parent-child task structure with subtasks  
✅ **Task Dependencies** - Define task prerequisites and blocking relationships  
✅ **Progress Tracking** - Completion percentage, estimated vs. actual hours  
✅ **Status Management** - not_started, in_progress, completed, blocked  
✅ **Priority Levels** - low, medium, high, critical  
✅ **Due Dates & Reminders** - ISO 8601 date handling with timezone support  
✅ **Task Comments** - Inline discussion threads for each task  
✅ **File Attachments** - Upload and manage task-related files  

### Project Management
✅ **Project Ownership** - Clear ownership and responsibility  
✅ **Team Collaboration** - Add multiple members with role-based permissions  
✅ **Project Health Score** - Real-time project status indicator  
✅ **Flexible Scheduling** - Start/end dates with progress visualization  

### User & Access Management
✅ **Role-Based Access Control (RBAC)** - Fine-grained permission system  
✅ **Multi-Role Support** - Users can have multiple roles simultaneously  
✅ **40+ Permissions** - Comprehensive permission matrix for all operations  
✅ **Admin Role Bypass** - Admin role automatically grants all permissions  
✅ **User Deactivation** - Disable accounts without deletion  

### Real-Time Communication
✅ **WebSocket-Based Messaging** - Socket.IO for real-time updates  
✅ **Direct Messages** - One-on-one encrypted conversations  
✅ **Group Conversations** - Team-based discussion channels  
✅ **Task Comments** - Real-time comment notifications  
✅ **User Presence** - See who's online in real-time  
✅ **Notification System** - Task assignments, mentions, and events  

### Security & Privacy
✅ **End-to-End Encryption** - Message content encrypted at rest  
✅ **Privacy-First Design** - Admins cannot read private messages  
✅ **JWT Authentication** - Secure token-based auth with 7-day expiry  
✅ **Password Security** - bcrypt hashing with salt  
✅ **Audit Logging** - Track all user actions with timestamps  
✅ **IP Address Tracking** - Log request origins  

### Admin Features
✅ **User Management** - Create, update, deactivate users  
✅ **Role Management** - Create custom roles and permissions  
✅ **Permission Assignment** - Granular control over role capabilities  
✅ **System Settings** - Configurable system parameters  
✅ **Audit Dashboard** - Complete activity logs  

---

## 🏗️ System Architecture

```mermaid
graph TB
    subgraph Frontend["🎨 Frontend Layer<br/>(React + TypeScript + Vite + Tailwind CSS)"]
        Login["📱 Login Page"]
        Dashboard["📊 Dashboard<br/>Role-Based Routing"]
        Projects["📁 Projects"]
        Tasks["✅ Tasks"]
        Messages["💬 Messages/Chat"]
        AdminPanel["⚙️ Admin Panel<br/>Users & Roles"]
        SocketClient["🔌 Socket.IO Client<br/>Real-time Updates"]
    end

    subgraph API["🔌 API Gateway Layer<br/>(FastAPI + Uvicorn : localhost:8000)"]
        Auth["🔐 /api/v1/auth<br/>Login & Token"]
        UserAPI["👥 /api/v1/users<br/>User Management"]
        RoleAPI["🔑 /api/v1/roles<br/>RBAC Management"]
        ProjectAPI["📋 /api/v1/projects<br/>Project Ops"]
        TaskAPI["✏️ /api/v1/tasks<br/>Task Ops"]
        MessageAPI["📧 /api/v1/messages<br/>Conversations"]
        NotifAPI["🔔 /api/v1/notifications<br/>Alerts"]
    end

    subgraph Services["⚙️ Service Layer"]
        AuthService["🔒 Auth Service<br/>JWT Validation<br/>Token Generation<br/>Password Hash"]
        PermService["✓ Permission Checker<br/>RBAC Logic<br/>Role Verification"]
        TaskService["📋 Business Logic<br/>Task Workflows<br/>Dependencies"]
        SocketService["🔌 Socket.IO Server<br/>Real-time Handler<br/>Presence Tracking<br/>Event Emission"]
    end

    subgraph DataAccess["💾 Data Access Layer<br/>(SQLAlchemy ORM)"]
        ORM["🗂️ SQLAlchemy<br/>Query Builder<br/>DB Session Mgmt<br/>Relationship Mgmt"]
    end

    subgraph Database["🗄️ Database Layer<br/>(SQLite Dev / PostgreSQL Prod)"]
        Users["👥 users"]
        Roles["🔐 roles"]
        Perms["📋 permissions"]
        Projects["📁 projects"]
        Tasks["✅ tasks"]
        TaskComments["💭 task_comments"]
        Conversations["💬 conversations"]
        Messages["📧 messages<br/>Encrypted"]
        Notifications["🔔 notifications"]
        AuditLog["📊 audit_logs"]
        Settings["⚙️ system_settings"]
        Attachments["📎 attachments"]
    end

    DB["💾 SQLite / PostgreSQL<br/>Persistent Storage"]

    %% Frontend connections
    Frontend -->|HTTP REST| API
    Frontend -->|WebSocket| SocketService
    
    %% API to Services
    API -->|Uses| AuthService
    API -->|Uses| PermService
    API -->|Uses| TaskService
    API -->|Uses| SocketService
    
    %% Services to Data Access
    AuthService -->|Query| ORM
    PermService -->|Query| ORM
    TaskService -->|Query| ORM
    SocketService -->|Query| ORM
    
    %% Data Access to Database Tables
    ORM -->|SQLAlchemy| Database
    
    %% Database to Physical DB
    Database -->|Persists| DB
    
    %% Styling
    classDef frontend fill:#e3f2fd,stroke:#1976d2,stroke-width:2px,color:#000
    classDef api fill:#fff3e0,stroke:#f57c00,stroke-width:2px,color:#000
    classDef service fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px,color:#000
    classDef dataAccess fill:#e8f5e9,stroke:#388e3c,stroke-width:2px,color:#000
    classDef database fill:#fce4ec,stroke:#c2185b,stroke-width:2px,color:#000
    classDef db fill:#f1f8e9,stroke:#558b2f,stroke-width:2px,color:#000
    
    class Frontend frontend
    class API api
    class Services service
    class DataAccess dataAccess
    class Database database
    class DB db
```

---

## 💻 Tech Stack

### Backend
| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| Framework | FastAPI | 0.109.0+ | Modern Python web framework |
| Server | Uvicorn | 0.27.0+ | ASGI server for async support |
| ORM | SQLAlchemy | 2.0.25+ | Database abstraction layer |
| Validation | Pydantic | 2.5.3+ | Data validation & serialization |
| Auth | python-jose | 3.3.0+ | JWT token creation/validation |
| Password | passlib + bcrypt | 1.7.4+ | Secure password hashing |
| Real-time | python-socketio | 5.11.0+ | WebSocket communication |
| Database | SQLite (Dev) | - | Lightweight local database |
| Database | PostgreSQL | (Optional) | Production database |

### Frontend
| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| Library | React | 19.2.0+ | UI framework |
| Language | TypeScript | Latest | Type-safe JavaScript |
| Build Tool | Vite | Latest | Lightning-fast build tool |
| Routing | React Router | 7.1.3+ | Client-side routing |
| HTTP Client | Axios | 1.6.5+ | Promise-based HTTP client |
| Real-time | Socket.IO Client | 4.6.1+ | WebSocket client |
| CSS Framework | Tailwind CSS | 4.0+ | Utility-first CSS |
| Linting | ESLint | 9.39.1+ | Code quality |

### Development Tools
- Python 3.10+
- Node.js 18+ (for frontend tooling)
- Git for version control

---

## 📊 Database Schema

### Core Tables

#### 1. **Users** (`users`)
```sql
- id: INTEGER (PK)
- username: VARCHAR(50) UNIQUE
- email: VARCHAR(100) UNIQUE
- password_hash: VARCHAR(255) bcrypt hashed
- full_name: VARCHAR(100)
- is_active: INTEGER (0=inactive, 1=active)
- created_at: DATETIME
- updated_at: DATETIME
- last_login: DATETIME
```

#### 2. **Roles** (`roles`)
```sql
- id: INTEGER (PK)
- name: VARCHAR(50) UNIQUE
- description: TEXT
- is_system_role: INTEGER (0=custom, 1=system)
- created_at: DATETIME
```

#### 3. **Permissions** (`permissions`)
```sql
- id: INTEGER (PK)
- name: VARCHAR(50) UNIQUE (e.g., 'tasks.create')
- resource: VARCHAR(50) (e.g., 'tasks')
- action: VARCHAR(20) (e.g., 'create')
- description: TEXT
```

#### 4. **Projects** (`projects`)
```sql
- id: INTEGER (PK)
- name: VARCHAR(100)
- description: TEXT
- owner_id: INTEGER (FK → users)
- status: VARCHAR(20) (active|completed|archived)
- priority: VARCHAR(20) (low|medium|high|critical)
- start_date: DATE
- end_date: DATE
- health_score: INTEGER (0-100)
- created_at: DATETIME
- updated_at: DATETIME
```

#### 5. **Tasks** (`tasks`)
```sql
- id: INTEGER (PK)
- title: VARCHAR(200)
- description: TEXT
- project_id: INTEGER (FK → projects)
- parent_task_id: INTEGER (FK → tasks)
- assigned_to: INTEGER (FK → users)
- created_by: INTEGER (FK → users)
- status: VARCHAR(20) (not_started|in_progress|completed|blocked)
- priority: VARCHAR(20) (low|medium|high|critical)
- due_date: DATETIME
- estimated_hours: DECIMAL(5,2)
- actual_hours: DECIMAL(5,2)
- completion_percentage: INTEGER (0-100)
- created_at: DATETIME
- updated_at: DATETIME
- completed_at: DATETIME
```

#### 6. **Conversations** (`conversations`)
```sql
- id: INTEGER (PK)
- type: VARCHAR(20) (direct|group|task)
- task_id: INTEGER (FK → tasks, nullable)
- name: VARCHAR(100)
- created_by: INTEGER (FK → users)
- created_at: DATETIME
```

#### 7. **Messages** (`messages`)
```sql
- id: INTEGER (PK)
- conversation_id: INTEGER (FK → conversations)
- sender_id: INTEGER (FK → users)
- content_encrypted: TEXT (AES-256 encrypted)
- checksum: VARCHAR(64) (SHA-256)
- is_private: INTEGER (0=group, 1=private)
- created_at: DATETIME
- edited_at: DATETIME
```

#### 8. **Notifications** (`notifications`)
```sql
- id: INTEGER (PK)
- user_id: INTEGER (FK → users)
- type: VARCHAR(50) (task_assigned|mentioned|reminder|etc)
- title: VARCHAR(200)
- content: TEXT
- link: VARCHAR(500)
- is_read: INTEGER (0|1)
- created_at: DATETIME
```

#### 9. **Audit Logs** (`audit_logs`)
```sql
- id: INTEGER (PK)
- user_id: INTEGER (FK → users)
- action: VARCHAR(100) (create|update|delete|login|etc)
- resource_type: VARCHAR(50) (user|task|project|etc)
- resource_id: INTEGER
- metadata: TEXT (JSON)
- ip_address: VARCHAR(45)
- created_at: DATETIME (indexed)
```

### Association Tables

- **user_roles** - Links users to roles (many-to-many)
- **role_permissions** - Links roles to permissions (many-to-many)
- **project_members** - Links users to projects with custom roles
- **conversation_participants** - Links users to conversations
- **task_dependencies** - Defines task blocking relationships

---

## 🚀 Installation

### Prerequisites
- Python 3.10 or higher
- Node.js 18 or higher (for development/build)
- PostgreSQL 13+ (optional, for production)

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment (optional but recommended)
python -m venv venv
source venv/Scripts/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Initialize database
python -m app.db.init_db

# Seed with sample data
python -m app.db.seed_db

# Run development server
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Server will be available at: **http://localhost:8000**  
API Documentation (Swagger UI): **http://localhost:8000/docs**

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will be available at: **http://localhost:5173**

---

## ⚙️ Configuration

### Backend (.env)
```env
# Database
DATABASE_URL=sqlite:///./database.sqlite
# For PostgreSQL: postgresql://user:password@localhost/dbname

# Security
SECRET_KEY=your-secret-key-here-change-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=10080  # 7 days

# API Settings
PROJECT_NAME=Task Manager API
API_V1_STR=/api

# CORS Configuration
BACKEND_CORS_ORIGINS=["http://localhost:5173", "http://127.0.0.1:5173"]
```

### Frontend (.env.local)
```env
VITE_API_URL=http://localhost:8000
```

---

## 🔌 API Endpoints

### Authentication
- **POST** `/api/v1/auth/login` - Login with username/password
- **GET** `/api/v1/auth/me` - Get current user info

### Users
- **GET** `/api/v1/users` - List all users (requires permission)
- **GET** `/api/v1/users/{user_id}` - Get user details
- **PATCH** `/api/v1/users/{user_id}` - Update user
- **POST** `/api/v1/users/{user_id}/roles` - Assign role to user
- **DELETE** `/api/v1/users/{user_id}/roles/{role_id}` - Remove role

### Roles & Permissions
- **GET** `/api/v1/roles` - List roles
- **GET** `/api/v1/roles/permissions` - List all permissions
- **POST** `/api/v1/roles` - Create custom role
- **PATCH** `/api/v1/roles/{role_id}` - Update role
- **POST** `/api/v1/roles/{role_id}/permissions` - Assign permission
- **DELETE** `/api/v1/roles/{role_id}/permissions/{permission_id}` - Remove permission

### Projects
- **GET** `/api/v1/projects` - List projects
- **POST** `/api/v1/projects` - Create project
- **GET** `/api/v1/projects/{project_id}` - Get project details
- **PATCH** `/api/v1/projects/{project_id}` - Update project
- **DELETE** `/api/v1/projects/{project_id}` - Delete project
- **POST** `/api/v1/projects/{project_id}/members` - Add team member
- **DELETE** `/api/v1/projects/{project_id}/members/{user_id}` - Remove member

### Tasks
- **GET** `/api/v1/tasks` - List tasks (filtered by permissions)
- **POST** `/api/v1/tasks` - Create task
- **GET** `/api/v1/tasks/{task_id}` - Get task details
- **PATCH** `/api/v1/tasks/{task_id}` - Update task
- **DELETE** `/api/v1/tasks/{task_id}` - Delete task
- **POST** `/api/v1/tasks/{task_id}/comments` - Add comment
- **GET** `/api/v1/tasks/{task_id}/comments` - Get comments

### Messages
- **GET** `/api/v1/messages/conversations` - List conversations
- **GET** `/api/v1/messages/{conversation_id}` - Get messages
- **POST** `/api/v1/messages` - Create conversation

### Notifications
- **GET** `/api/v1/notifications` - Get notifications
- **PATCH** `/api/v1/notifications/{notification_id}/read` - Mark as read

---

## 🔐 Permission Matrix

### User Management Permissions
- `users.view` - View all users
- `users.create` - Create new users
- `users.edit` - Edit any user
- `users.edit_own` - Edit own profile
- `users.delete` - Delete users

### Role Management
- `roles.view` - View roles
- `roles.create` - Create custom roles
- `roles.edit` - Edit roles
- `roles.delete` - Delete roles
- `permissions.view` - View permissions
- `permissions.assign` - Assign permissions to roles

### Project Management
- `projects.view` - View projects
- `projects.create` - Create projects
- `projects.edit_own` - Edit own projects
- `projects.edit_all` - Edit any project
- `projects.delete_own` - Delete own projects
- `projects.delete_all` - Delete any project

### Task Management
- `tasks.view_assigned` - View assigned tasks
- `tasks.view_team` - View team tasks
- `tasks.view_all` - View all tasks
- `tasks.create` - Create tasks
- `tasks.edit_own` - Edit own tasks
- `tasks.edit_team` - Edit team tasks
- `tasks.edit_all` - Edit any task
- `tasks.delete` - Delete tasks
- `tasks.approve` - Approve task completion
- `tasks.reject` - Reject tasks
- `tasks.comment` - Comment on tasks
- `tasks.upload` - Upload attachments

### Messaging
- `messages.send` - Send messages
- `messages.view_own` - View own messages
- `messages.view_metadata` - View message metadata only (no content)

### System
- `audit.view` - View audit logs
- `system.edit` - Edit system settings
- `backup.create` - Create backups
- `backup.restore` - Restore backups
- `reports.view` - View reports

### Default Role Permissions

| Permission | Admin | Manager | Employee |
|-----------|:-----:|:-------:|:-------:|
| users.view | ✅ | ❌ | ❌ |
| users.edit | ✅ | ❌ | ❌ |
| roles.* | ✅ | ❌ | ❌ |
| projects.view | ✅ | ✅ | ✅ |
| projects.create | ✅ | ✅ | ❌ |
| projects.edit_all | ✅ | ✅ | ❌ |
| tasks.view_all | ✅ | ✅ | ❌ |
| tasks.create | ✅ | ✅ | ✅ |
| tasks.edit_own | ✅ | ✅ | ✅ |
| messages.* | ✅ | ✅ | ✅ |
| audit.view | ✅ | ❌ | ❌ |

---

## 🔄 Real-Time Features

### Socket.IO Events

#### Server → Client
- `user_online` - User joined the system
- `user_offline` - User left the system
- `task_created` - New task assigned to user
- `task_updated` - Task status/details changed
- `notification_created` - System notification
- `message_received` - New message in conversation

#### Client → Server
- `join_conversation` - User joins a conversation room
- `send_message` - Send message to conversation
- `authenticate` - Authenticate socket connection

### Connection
- Authentication via JWT token in auth header
- Auto-reconnect with exponential backoff
- Fallback to polling if WebSocket unavailable
- Per-user room creation for direct notifications

---

## 📁 Project Structure

```
task manager/
│
├── backend/                          # Python FastAPI backend
│   ├── app/
│   │   ├── main.py                   # Application entry point
│   │   ├── api/
│   │   │   ├── deps.py               # Dependency injection & auth
│   │   │   └── v1/
│   │   │       ├── api.py            # Router registry
│   │   │       └── endpoints/
│   │   │           ├── auth.py       # Authentication endpoints
│   │   │           ├── users.py      # User management
│   │   │           ├── roles.py      # RBAC management
│   │   │           ├── projects.py   # Project operations
│   │   │           ├── tasks.py      # Task operations
│   │   │           ├── messages.py   # Messaging system
│   │   │           └── notifications.py  # Notifications
│   │   ├── core/
│   │   │   ├── config.py             # Configuration management
│   │   │   ├── database.py           # Database setup & sessions
│   │   │   ├── security.py           # Password hashing
│   │   │   └── socket.py             # Socket.IO server
│   │   ├── db/
│   │   │   ├── init_db.py            # Database initialization
│   │   │   └── seed_db.py            # Sample data seeding
│   │   ├── models/                   # SQLAlchemy models
│   │   │   ├── auth.py               # User, Role, Permission
│   │   │   ├── project.py            # Project, Task models
│   │   │   ├── messaging.py          # Conversation, Message
│   │   │   └── system.py             # Notification, AuditLog
│   │   └── schemas/                  # Pydantic request/response models
│   │       ├── auth.py, user.py, role.py
│   │       ├── project.py, message.py
│   │       └── user.py
│   ├── requirements.txt               # Python dependencies
│   ├── run_backend.ps1               # Windows startup script
│   └── database.sqlite               # SQLite database (auto-created)
│
├── frontend/                         # React TypeScript frontend
│   ├── src/
│   │   ├── main.tsx                  # Entry point
│   │   ├── App.tsx                   # Root component
│   │   ├── App.css                   # Global styles
│   │   ├── index.css                 # Tailwind imports
│   │   ├── vite-env.d.ts             # Vite type definitions
│   │   ├── context/
│   │   │   ├── AuthContext.tsx       # Authentication state
│   │   │   └── SocketContext.tsx     # Real-time connection
│   │   ├── pages/                    # Route pages
│   │   │   ├── Login.tsx             # Login page
│   │   │   ├── Dashboard.tsx         # Main dashboard
│   │   │   ├── Projects.tsx          # Projects list
│   │   │   ├── Tasks.tsx             # Tasks list
│   │   │   ├── Messages.tsx          # Messaging
│   │   │   ├── Profile.tsx           # User profile
│   │   │   ├── ProjectDetails.tsx    # Project view
│   │   │   └── admin/
│   │   │       ├── AdminDashboard.tsx
│   │   │       ├── Users.tsx         # User management
│   │   │       └── Roles.tsx         # Role management
│   │   ├── components/
│   │   │   └── Layout.tsx            # Navigation layout
│   │   ├── lib/
│   │   │   └── api.ts                # Axios API client
│   │   └── assets/                   # Images, icons
│   ├── package.json                  # Node.js dependencies
│   ├── vite.config.ts                # Vite configuration
│   ├── tsconfig.json                 # TypeScript configuration
│   ├── tailwind.config.js            # Tailwind CSS config
│   └── index.html                    # HTML entry
│
└── README.md                         # This file
```

---

## 🔑 Default Credentials

| Field | Value |
|-------|-------|
| Username | `admin` |
| Password | `Admin@123` |

⚠️ **IMPORTANT**: Change these credentials immediately after first login in a production environment!

---

## 🛠️ Development

### Running Tests
```bash
# Backend
cd backend
pytest

# Frontend
cd frontend
npm run test
```

### Code Quality
```bash
# Backend linting
pylint app/

# Frontend linting
npm run lint
```

### Building for Production

**Backend**:
```bash
# No build needed for FastAPI
# Just run with uvicorn in production mode
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

**Frontend**:
```bash
cd frontend
npm run build
# Output: dist/
```

---

## 📝 License

MIT License - Free for commercial and personal use

Copyright (c) 2026

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files to use, modify, and
distribute it, subject to the following conditions:

- **Warranty**: Provided as-is, without warranties
- **Liability**: Authors not liable for damages
- **Commercial Use**: Permitted
- **Modification**: Permitted
- **Distribution**: Permitted with original license

See LICENSE file for full details.

---

## 📞 Support & Contributions

For issues, questions, or contributions:
- Open an Issue in the repository
- Submit pull requests for enhancements
- Review CONTRIBUTING.md for guidelines

---

**Last Updated**: February 27, 2026  
**Maintained By**: Development Team
