from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from backend.schemas import CoverLetterRequest
from backend.services.groq_service import generate_ai_response
from backend.services.parser import parse_resume
import os
import shutil
from typing import Optional

router = APIRouter(prefix="/cover-letter", tags=["Cover Letter"])

@router.post("/generate")
async def generate_cover_letter(
    request: CoverLetterRequest
):
    personalization_info = f"\nPersonalization / Previous Company Growth Details: {request.personalization}" if request.personalization else ""
    
    prompt = f"""
    Write a highly professional, personalized cover letter for the following details:
    Name: {request.name}
    Target Role: {request.role}
    Target Company: {request.company}
    Experience Level: {request.experience}
    Key Skills: {request.skills}{personalization_info}
    
    The cover letter should be engaging, confident, and tailored to show how the candidate's skills map to the role at the target company. Do not use generic templates, make it unique.
    """
    
    response_text = generate_ai_response(
        prompt=prompt,
        system_prompt="You are an expert Career Coach and Copywriter."
    )
    
    return {"status": "success", "cover_letter": response_text}

@router.post("/upload-generate")
async def upload_generate_cover_letter(
    resume_file: UploadFile = File(...),
    role: str = Form(...),
    company: str = Form(...),
    job_description: Optional[str] = Form(None)
):
    # 1. Delete previous temporary file
    folder = "backend/temp/uploads"
    os.makedirs(folder, exist_ok=True)
    for filename in os.listdir(folder):
        file_path = os.path.join(folder, filename)
        try:
            if os.path.isfile(file_path) or os.path.islink(file_path):
                os.unlink(file_path)
            elif os.path.isdir(file_path):
                shutil.rmtree(file_path)
        except Exception as e:
            pass

    # 2. Validate file type and size
    content = await resume_file.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds 5MB limit")

    ext = os.path.splitext(resume_file.filename or "")[1].lower()
    if ext not in [".pdf", ".docx"]:
        raise HTTPException(status_code=400, detail="Only PDF and DOCX files are allowed")

    # 3. Save latest resume
    save_path = os.path.join(folder, resume_file.filename or "uploaded_resume")
    with open(save_path, "wb") as f:
        f.write(content)

    # 4. Extract resume text
    resume_text = parse_resume(content, resume_file.filename or "resume")

    if not resume_text or len(resume_text.strip()) < 50:
        raise HTTPException(status_code=400, detail="Could not extract sufficient text from resume")

    # 5. Use extracted resume data + role + company
    jd_info = f"{job_description}" if job_description else "N/A"

    prompt = f"""You are an expert career coach.

Based on the uploaded resume below, create a personalized professional cover letter.

Resume Data:
{resume_text}

Role:
{role}

Company:
{company}

Job Description:
{jd_info}

Instructions:
- Use real skills from resume
- Mention relevant experience
- Mention projects if useful
- Tailor for company
- Human sounding tone
- Strong opening
- Strong closing
- ATS friendly
- Professional format
- 300 to 450 words
"""

    response_text = generate_ai_response(
        prompt=prompt,
        system_prompt="You are an expert AI Career Assistant."
    )

    return {
        "success": True,
        "cover_letter": response_text
    }
