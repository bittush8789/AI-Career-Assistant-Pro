from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from backend.schemas import UserCreate, UserResponse, Token, DashboardStats
from backend.routes import resume, cover, interview, roadmap, salary, jobs, dashboard
from backend.services.groq_service import selected_model_var

app = FastAPI(title="AI Career Assistant Pro API")

@app.middleware("http")
async def extract_selected_model(request: Request, call_next):
    model_name = request.headers.get("X-Model-Name")
    token = None
    if model_name:
        token = selected_model_var.set(model_name)
    try:
        response = await call_next(request)
        return response
    finally:
        if token:
            selected_model_var.reset(token)

@app.get("/models")
async def get_models():
    return [
        {"id": "llama3-70b-8192", "name": "llama3-70b-8192 (Default)", "provider": "Groq"},
        {"id": "canopylabs/orpheus-arabic-saudi", "name": "canopylabs/orpheus-arabic-saudi", "provider": "Canopy Labs"},
        {"id": "canopylabs/orpheus-v1-english", "name": "canopylabs/orpheus-v1-english", "provider": "Canopy Labs"},
        {"id": "groq/compound", "name": "groq/compound", "provider": "Groq"},
        {"id": "groq/compound-mini", "name": "groq/compound-mini", "provider": "Groq"},
        {"id": "llama-3.1-8b-instant", "name": "llama-3.1-8b-instant", "provider": "Meta"},
        {"id": "llama-3.3-70b-versatile", "name": "llama-3.3-70b-versatile", "provider": "Meta"},
        {"id": "meta-llama/llama-4-scout-17b-16e-i", "name": "meta-llama/llama-4-scout-17b-16e-i", "provider": "Meta"},
        {"id": "meta-llama/llama-prompt-guard-2-2", "name": "meta-llama/llama-prompt-guard-2-2", "provider": "Meta"},
        {"id": "meta-llama/llama-prompt-guard-2-8", "name": "meta-llama/llama-prompt-guard-2-8", "provider": "Meta"},
        {"id": "openai/gpt-oss-120b", "name": "openai/gpt-oss-120b", "provider": "OpenAI"},
        {"id": "openai/gpt-oss-20b", "name": "openai/gpt-oss-20b", "provider": "OpenAI"},
        {"id": "openai/gpt-oss-safeguard-20b", "name": "openai/gpt-oss-safeguard-20b", "provider": "OpenAI"},
        {"id": "whisper-large-v3", "name": "whisper-large-v3", "provider": "OpenAI"},
        {"id": "whisper-large-v3-turbo", "name": "whisper-large-v3-turbo", "provider": "OpenAI"},
    ]

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(resume.router)
app.include_router(cover.router)
app.include_router(interview.router)
app.include_router(roadmap.router)
app.include_router(salary.router)
app.include_router(jobs.router)
app.include_router(dashboard.router)



@app.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats():
    return DashboardStats(
        resume_score=85.0,
        jobs_matched=12,
        salary_estimate="$120,000 - $150,000",
        interview_readiness=80.0
    )

@app.get("/profile", response_model=UserResponse)
async def get_profile():
    return UserResponse(id=1, username="mockuser", email="mockuser@example.com", is_active=True)

# Mount frontend
frontend_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend")
app.mount("/", StaticFiles(directory=frontend_path, html=True), name="frontend")
