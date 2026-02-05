# Smart Learners AI

A full-stack AI Learning Management Platform with Django backend and React frontend.

## Architecture

```
Smart_Learners_AI/
├── backend/                 # Django REST API (Port 8000)
│   ├── authentication/      # User auth app
│   ├── backend/            # Django settings
│   ├── db.sqlite3          # SQLite database
│   └── manage.py
│
└── Frontend/               # React + Vite (Port 3000)
    ├── components/         # React components
    ├── services/           # API services
    └── index.html
```

## Quick Start

### 1. Start Backend Server (Terminal 1)

```bash
cd backend
setup_and_run.bat   # Windows
# OR
./setup_and_run.sh  # Linux/Mac
```

Backend will run at: **http://localhost:8000**

### 2. Start Frontend Server (Terminal 2)

```bash
cd Frontend
npm install
npm run dev
```

Frontend will run at: **http://localhost:3000**

### 3. Open Application

Navigate to **http://localhost:3000** in your browser.

## Features

### Authentication
- User Registration (Signup)
- User Login
- Session-based authentication
- Backend health status indicator

### Learning Platform
- Interactive Dashboard
- 5-Week AI Curriculum
- Capstone Projects
- Skill Assessments
- AI Lab with coding challenges
- Progress Analytics
- Certificates

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup/` | Register new user |
| POST | `/api/auth/login/` | Login with credentials |
| POST | `/api/auth/logout/` | Logout current user |
| GET | `/api/auth/profile/` | Get user profile |
| GET | `/api/auth/health/` | Check server status |

## Tech Stack

### Backend
- Django 4.2
- Django REST Framework
- SQLite3 Database
- django-cors-headers

### Frontend
- React 19
- TypeScript
- Vite
- Tailwind CSS
- Lucide Icons

## Development

### Backend Development
```bash
cd backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
python manage.py runserver 8000
```

### Frontend Development
```bash
cd Frontend
npm run dev
```

### Create Admin User
```bash
cd backend
python manage.py createsuperuser
```
Access admin at: http://localhost:8000/admin/

## License

© 2025 SMARTLEARNERS AI. All rights reserved.
