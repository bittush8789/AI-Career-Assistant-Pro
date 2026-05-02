from fastapi import APIRouter
from backend.schemas import SalaryRequest
from backend.services.groq_service import generate_ai_response
import re

router = APIRouter(prefix="/salary", tags=["Salary Predictor"])

@router.post("/predict")
async def predict_salary(
    request: SalaryRequest
):
    prompt = f"""
    Predict the realistic salary range for the following profile:
    Role: {request.role}
    Experience: {request.experience_years} years
    Location: {request.city}, {request.country}
    Skills: {request.skills}
    
    Provide the output as a concise, realistic salary range (e.g. "$120,000 - $150,000" or "₹15,00,000 - ₹22,00,000") and a brief explanation of why.
    """
    
    response_text = generate_ai_response(
        prompt=prompt,
        system_prompt="You are an Expert Compensation Analyst and Global Tech Recruiter."
    )
    
    # Try to extract the range
    range_match = re.search(r'[\$₹€£]\d+[\d,]*\s*-\s*[\$₹€£]\d+[\d,]*', response_text)
    estimate_val = range_match.group(0) if range_match else "Available in details"
    
    from backend.state import update_dashboard_state
    update_dashboard_state({"salary_estimate": estimate_val})

    return {"status": "success", "salary_estimate": response_text, "range": estimate_val}
