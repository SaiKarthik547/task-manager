import socketio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os # Added by instruction
from app.core.config import settings
from app.api.v1.api import api_router
from app.core.socket import sio
from app.db.init_db import init_db
from app.core.jobs import start_jobs
from app.core.middlewares import RequestLoggingMiddleware, limiter, _rate_limit_exceeded_handler, RateLimitExceeded

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Set all CORS enabled origins
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
         # Frontend might be running on 3000, 5173, etc.
         # Allow all for now
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.add_middleware(RequestLoggingMiddleware)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Added by instruction
@app.on_event("startup")
async def startup_event():
    # Initialize DB (creates tables if missing)
    init_db()
    # Start background scheduler
    start_jobs()
    print("Startup complete. Database seeded if it was empty. Background Jobs Started.")

@app.get("/")
def root():
    return {"message": "Welcome to Task Manager API", "docs": "/docs"}

app.include_router(api_router, prefix=settings.API_V1_STR)

# Mount Socket.IO
app = socketio.ASGIApp(sio, app)
