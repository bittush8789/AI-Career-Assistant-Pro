from fastapi import APIRouter
from backend.schemas import JobRequest
from backend.services.groq_service import generate_ai_response
import json
import re

router = APIRouter(prefix="/jobs", tags=["Jobs"])

@router.post("/recommend")
async def recommend_jobs(
    request: JobRequest
):
    prompt = f"""
    Based on the following profile, recommend the top 3 best matching job titles and roles.
    Skills: {request.skills}
    Experience: {request.experience}
    Preferred Role: {request.preferred_role}
    
    Return the result strictly as a valid JSON object with a list of "jobs". Each job should have "title", "why_matched", and "missing_skills" (list).
    Format:
    {{
      "jobs": [
        {{
          "title": "Job Title",
          "why_matched": "Reason",
          "missing_skills": ["skill1", "skill2"]
        }}
      ]
    }}
    Do not use markdown blocks.
    """
    
    response_text = generate_ai_response(
        prompt=prompt,
        system_prompt="You are an Expert Job Matching AI."
    )
    
    json_match = re.search(r'\{.*\}', response_text.replace('\n', ''), re.IGNORECASE)
    if json_match:
        try:
            result = json.loads(json_match.group(0))
        except:
            result = {"raw_response": response_text}
    else:
        try:
            result = json.loads(response_text)
        except:
            result = {"raw_response": response_text}
            
    return {"status": "success", "recommendations": result}
