from fastapi import APIRouter
from backend.schemas import InterviewRequest
from backend.services.groq_service import generate_ai_response

router = APIRouter(prefix="/interview", tags=["Interview Prep"])

@router.post("/questions")
async def generate_interview_questions(
    request: InterviewRequest
):
    prompt = f"""
    Generate 20 comprehensive interview questions and suggested answers for a {request.role} position.
    Include a mix of:
    - 5 Behavioral / HR round questions
    - 15 Technical questions (ranging from basic to advanced)
    
    Format the output clearly with the Question in bold and the Suggested Answer below it.
    """
    
    response_text = generate_ai_response(
        prompt=prompt,
        system_prompt="You are a Senior Hiring Manager and Technical Interviewer."
    )
    
    return {"status": "success", "interview_prep": response_text}
