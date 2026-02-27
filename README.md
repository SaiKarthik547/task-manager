# Task Management System

A production-ready, 100% free, self-hosted Employee Task Management System with real-time messaging, RBAC, and privacy-first design.

## Features

✅ **100% Free & Open-Source** - No paid dependencies  
✅ **Local-First** - SQLite/PostgreSQL, works offline  
✅ **Real-Time Messaging** - Built-in WebSocket chat  
✅ **Role-Based Access Control** - Customizable permissions  
✅ **Privacy-First** - Admins cannot read private messages  
✅ **Multi-Role Support** - Users can have multiple roles  

## Quick Start

### Backend Setup

```bash
cd backend
npm install
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"  # Generate encryption key
# Add encryption key to .env
cp .env.example .env
# Edit .env and paste the encryption key
node scripts/init-db.js  # Initialize database
node scripts/seed.js      # Seed with sample data
npm run start:dev
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### Default Login

- **Username**: `admin`
- **Password**: `Admin@123`
- ⚠️ Change immediately after first login!

## Tech Stack

- **Backend**: Node.js + Express + TypeScript
- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Database**: SQLite (PostgreSQL ready)
- **Real-time**: Socket.IO
- **Auth**: JWT + bcrypt

## License

MIT License - Free for commercial and personal use
