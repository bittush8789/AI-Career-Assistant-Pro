from fastapi import APIRouter
from backend.schemas import RoadmapRequest
from backend.services.groq_service import generate_ai_response

router = APIRouter(prefix="/roadmap", tags=["Career Roadmap"])

@router.post("/generate")
async def generate_roadmap(
    request: RoadmapRequest
):
    prompt = f"""
    Create a highly detailed 3-month career roadmap to transition from {request.current_role} to {request.target_role}.
    
    Structure it month-by-month and include:
    - Specific skills and technologies to learn
    - Mini-projects to build
    - Recommended certifications or courses
    - Interview preparation tips
    """
    
    response_text = generate_ai_response(
        prompt=prompt,
        system_prompt="You are an Expert Career Counselor and Tech Industry Mentor."
    )
    
    return {"status": "success", "roadmap": response_text}
