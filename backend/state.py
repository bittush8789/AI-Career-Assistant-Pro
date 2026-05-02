from datetime import datetime

# Global state for dashboard metrics (in-memory for local dev)
dashboard_state = {
    "resume_score": 0,
    "jobs_matched": 0,
    "salary_estimate": "Calculating...",
    "best_role": "Pending",
    "updated_at": datetime.now().strftime("%Y-%m-%d %H:%M")
}

def update_dashboard_state(updates: dict):
    global dashboard_state
    for key, value in updates.items():
        if key in dashboard_state:
            dashboard_state[key] = value
    dashboard_state["updated_at"] = datetime.now().strftime("%Y-%m-%d %H:%M")
