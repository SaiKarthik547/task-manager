# Task Manager Backend Setup & Run Script

Write-Host "🚀 Setting up Python Backend..." -ForegroundColor Green

# Check if Python is installed
if (-not (Get-Command "python" -ErrorAction SilentlyContinue)) {
    Write-Error "Python is not installed. Please install Python 3.10+."
    exit 1
}

# Create virtual environment if it doesn't exist
if (-not (Test-Path "venv")) {
    Write-Host "Creating virtual environment..."
    python -m venv venv
}

# Activate venv
Write-Host "Activating virtual environment..."
.\venv\Scripts\Activate.ps1

# Install dependencies
Write-Host "Installing dependencies..."
pip install -r requirements.txt

# Initialize Database
if (-not (Test-Path "database.sqlite")) {
    Write-Host "Initializing Database..."
    $env:PYTHONPATH="."
    python -m app.db.init_db
    python -m app.db.seed_db
} else {
    Write-Host "Database already exists. Skipping initialization."
}

# Run Server
Write-Host "Starting Server..." -ForegroundColor Cyan
uvicorn app.main:app --reload --host 0.0.0.0 --port 3000
