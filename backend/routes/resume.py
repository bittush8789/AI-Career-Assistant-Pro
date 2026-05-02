from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional
from backend.schemas import ResumeRewriteRequest
from backend.services.parser import parse_resume
from backend.services.groq_service import generate_ai_response
import json
import re

router = APIRouter(prefix="/resume", tags=["Resume"])

@router.post("/analyze")
async def analyze_resume(
    resume_file: Optional[UploadFile] = File(None),
    resume_text: Optional[str] = Form(None),
    job_description: Optional[str] = Form(None)
):
    import logging
    logger = logging.getLogger(__name__)

    if not resume_text and not resume_file:
        raise HTTPException(status_code=400, detail="Must provide either resume_file or resume_text")

    text = ""
    if resume_file:
        content = await resume_file.read()
        try:
            text = parse_resume(content, resume_file.filename)
            logger.info(f"Extracted {len(text)} chars from {resume_file.filename}")
        except Exception as e:
            logger.error(f"Failed to parse resume: {str(e)}")
            raise HTTPException(status_code=400, detail="Unable to read resume text. Please upload readable PDF/DOCX.")
            
    if resume_text:
        text += "\n" + resume_text
        
    text = text.strip()

    if not text or len(text) < 50:
        raise HTTPException(status_code=400, detail="Could not extract sufficient text from resume. Please upload readable PDF/DOCX.")

    if not job_description or len(job_description.strip()) < 20:
        raise HTTPException(status_code=400, detail="Job description is required and must be sufficiently detailed.")

    logger.info(f"Starting analysis. Resume length: {len(text)}, JD length: {len(job_description)}")

    jd_text = f"\nJob Description:\n{job_description}"

    prompt = f"""
    Analyze the resume strictly using resume text and job description.

    Return ONLY valid JSON:

    {{
     "ats_score": number,
     "match_score": number,
     "matched_keywords": [],
     "missing_keywords": [],
     "skills_found": [],
     "suggestions": [],
     "final_verdict": ""
    }}

    No markdown.
    No explanation.
    No extra text.
    
    Resume text:
    {text}
    {jd_text}
    """
    
    logger.info("Sending prompt to AI")
    try:
        response_text = generate_ai_response(
            prompt=prompt,
            system_prompt="You are an expert ATS System and Technical Recruiter. Only return valid JSON."
        )
        logger.info(f"Received raw AI response length: {len(response_text)}")
    except Exception as e:
        logger.error(f"AI Service Error: {str(e)}")
        response_text = ""
    
    # Cleaning Markdown
    cleaned_text = response_text.strip()
    if cleaned_text.startswith("```json"):
        cleaned_text = cleaned_text[7:]
    elif cleaned_text.startswith("```"):
        cleaned_text = cleaned_text[3:]
    if cleaned_text.endswith("```"):
        cleaned_text = cleaned_text[:-3]
    cleaned_text = cleaned_text.strip()
    
    result = None
    try:
        result = json.loads(cleaned_text)
        logger.info("Successfully parsed JSON response")
    except:
        json_match = re.search(r'\{.*\}', cleaned_text, re.DOTALL)
        if json_match:
            try:
                result = json.loads(json_match.group(0))
                logger.info("Successfully extracted JSON using regex")
            except:
                logger.warning("Regex extracted string is not valid JSON")
                pass

    # FALLBACK LOGIC
    if not result or not isinstance(result, dict) or "ats_score" not in result:
        logger.warning("AI JSON failed. Using manual fallback scoring logic.")
        # Manual keyword scoring
        jd_words = set(re.findall(r'\b[a-zA-Z]{3,}\b', job_description.lower()))
        resume_words = set(re.findall(r'\b[a-zA-Z]{3,}\b', text.lower()))
        
        matched = list(jd_words.intersection(resume_words))
        missing = list(jd_words.difference(resume_words))
        
        # Simple heuristic, don't want a massive list of generic words
        tech_keywords = ['python', 'java', 'aws', 'docker', 'kubernetes', 'react', 'node', 'sql', 'nosql', 'api', 'git', 'ci/cd', 'agile', 'linux']
        jd_tech = [w for w in jd_words if w in tech_keywords]
        resume_tech = [w for w in resume_words if w in tech_keywords]
        
        matched_tech = list(set(jd_tech).intersection(set(resume_tech)))
        missing_tech = list(set(jd_tech).difference(set(resume_tech)))
        
        score = int((len(matched_tech) / max(len(jd_tech), 1)) * 100)
        
        result = {
            "ats_score": max(50, score),
            "match_score": score,
            "matched_keywords": matched_tech[:10],
            "missing_keywords": missing_tech[:15],
            "skills_found": list(resume_words)[:10],
            "suggestions": ["Please review the missing keywords and incorporate them.", "Consider using AI again if the service recovers."],
            "final_verdict": "Moderate Match" if score > 60 else "Weak Match"
        }

    # Ensure format contract
    final_output = {
        "success": True,
        "ats_score": result.get("ats_score", 0),
        "match_score": result.get("match_score", 0),
        "matched_keywords": result.get("matched_keywords", []),
        "missing_keywords": result.get("missing_keywords", []),
        "skills_found": result.get("skills_found", []),
        "suggestions": result.get("suggestions", []),
        "final_verdict": result.get("final_verdict", "Unknown")
    }

    from backend.state import update_dashboard_state
    update_dashboard_state({
        "resume_score": final_output["ats_score"],
        "jobs_matched": 1 if final_output["match_score"] >= 70 else 0,
        "best_role": "Uploaded Job Description"
    })

    return final_output

@router.post("/rewrite")
async def rewrite_resume(
    resume_file: Optional[UploadFile] = File(None),
    resume_text: Optional[str] = Form(None),
    role: str = Form(...),
    job_description: Optional[str] = Form(None),
    rewrite_style: str = Form("ATS Optimized")
):
    if resume_file:
        content = await resume_file.read()
        text = parse_resume(content, resume_file.filename)
    elif resume_text:
        text = resume_text
    else:
        raise HTTPException(status_code=400, detail="Must provide either resume_file or resume_text")

    if not text or len(text) < 50:
        raise HTTPException(status_code=400, detail="Could not extract sufficient text from resume")

    jd_text = f"Use job description:\n{job_description}" if job_description else ""

    prompt = f"""
    Rewrite this resume professionally for role: {role}
    
    {jd_text}
    
    Style: {rewrite_style}
    Make it ATS optimized and modern.
    
    Original Resume:
    {text}
    """
    
    response_text = generate_ai_response(
        prompt=prompt,
        system_prompt="You are an expert Resume Writer and Career Coach."
    )
    
    return {"status": "success", "rewritten_resume": response_text}

@router.post("/analyze-multi")
async def analyze_multi_resume(
    resume_file: Optional[UploadFile] = File(None),
    resume_text: Optional[str] = Form(None),
    jobs_json: str = Form(...)
):
    if resume_file:
        content = await resume_file.read()
        text = parse_resume(content, resume_file.filename)
    elif resume_text:
        text = resume_text
    else:
        raise HTTPException(status_code=400, detail="Must provide either resume_file or resume_text")

    if not text or len(text) < 50:
        raise HTTPException(status_code=400, detail="Could not extract sufficient text from resume")

    try:
        jobs = json.loads(jobs_json)
    except:
        raise HTTPException(status_code=400, detail="Invalid JSON for jobs_json")

    if not jobs:
        raise HTTPException(status_code=400, detail="Must provide at least one job")

    jobs_str = "\n".join([f"- Role: {job.get('title', 'Unknown')}\n  Description: {job.get('job_description', '')}" for job in jobs])

    prompt = f"""
    Analyze this resume against multiple job descriptions.

    For each role return:
    1. "ats_score": (integer 0-100)
    2. "match_score": (integer 0-100)
    3. "missing_keywords": (array of strings)
    4. "skills_found": (array of strings)
    5. "status": (string, one of: "Strong Match", "Good Match", "Improve", "Poor")

    Then return:
    6. "best_roles": (array of top 3 role titles)
    7. "common_missing_keywords": (array of unique strings missing across most jobs)
    8. "overall_suggestions": (array of strings for resume improvement)

    Jobs to analyze against:
    {jobs_str}

    Original Resume:
    {text}

    Return strictly a valid JSON object matching this exact schema:
    {{
      "results": [
        {{
          "role": "Role Title",
          "ats_score": 85,
          "match_score": 88,
          "missing_keywords": ["skill1"],
          "skills_found": ["skill2"],
          "status": "Strong Match"
        }}
      ],
      "best_roles": ["Role Title 1", "Role Title 2"],
      "common_missing_keywords": ["keyword1"],
      "overall_suggestions": ["suggestion1"]
    }}
    Do not include markdown code blocks.
    """
    
    response_text = generate_ai_response(
        prompt=prompt,
        system_prompt="You are an expert ATS System and Technical Recruiter. Only return valid JSON."
    )
    
    cleaned_text = response_text.strip()
    if cleaned_text.startswith("```json"):
        cleaned_text = cleaned_text[7:]
    elif cleaned_text.startswith("```"):
        cleaned_text = cleaned_text[3:]
    if cleaned_text.endswith("```"):
        cleaned_text = cleaned_text[:-3]
    cleaned_text = cleaned_text.strip()
    
    try:
        result = json.loads(cleaned_text)
    except:
        json_match = re.search(r'\{.*\}', cleaned_text, re.DOTALL)
        if json_match:
            try:
                result = json.loads(json_match.group(0))
            except:
                result = None
        else:
            result = None

    if not result or "results" not in result:
        # Fallback keyword matching
        resume_lower = text.lower()
        results = []
        all_missing = set()
        
        for job in jobs:
            job_title = job.get('title', 'Unknown')
            job_desc = job.get('job_description', '').lower()
            
            job_words = set(re.findall(r'\b[a-z]{3,}\b', job_desc)) if job_desc else set(job_title.lower().split())
            resume_words = set(re.findall(r'\b[a-z]{3,}\b', resume_lower))
            
            intersection = job_words.intersection(resume_words)
            overlap = len(intersection) / max(len(job_words), 1)
            
            score = int(min(overlap * 100 + 40, 95))
            matched = list(intersection)[:10]
            missing = list(job_words - resume_words)[:10]
            for m in missing:
                all_missing.add(m)
                
            results.append({
                "role": job_title,
                "ats_score": score,
                "match_score": score - 5,
                "missing_keywords": missing,
                "skills_found": matched,
                "status": "Strong Match" if score > 75 else "Good Match" if score > 60 else "Improve"
            })
            
        results.sort(key=lambda x: x["ats_score"], reverse=True)
        best_roles = [r["role"] for r in results[:3]]
        
        result = {
            "results": results,
            "best_roles": best_roles,
            "common_missing_keywords": list(all_missing)[:15],
            "overall_suggestions": ["Optimize your resume keywords.", "Review missing skills for top roles."]
        }

    if isinstance(result, dict) and "results" in result:
        jobs_matched = sum(1 for r in result.get("results", []) if r.get("match_score", 0) >= 70)
        best_role = result.get("best_roles", ["Pending"])[0] if result.get("best_roles") else "Pending"
        
        from backend.state import update_dashboard_state
        update_dashboard_state({
            "jobs_matched": jobs_matched,
            "best_role": best_role
        })

    return {"status": "success", "data": result}
