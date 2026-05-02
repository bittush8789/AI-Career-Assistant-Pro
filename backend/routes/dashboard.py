from fastapi import APIRouter
from backend.state import dashboard_state

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/stats")
async def get_dashboard_stats():
    return dashboard_state

@router.post("/reset")
async def reset_dashboard_stats():
    dashboard_state["resume_score"] = 0
    dashboard_state["jobs_matched"] = 0
    dashboard_state["salary_estimate"] = "Calculating..."
    dashboard_state["best_role"] = "Pending"
    return {"status": "reset"}
