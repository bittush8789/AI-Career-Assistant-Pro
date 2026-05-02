from pydantic import BaseModel, EmailStr
from typing import Optional, List

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class DashboardStats(BaseModel):
    resume_score: float
    jobs_matched: int
    salary_estimate: str
    interview_readiness: float

class ResumeAnalyzeRequest(BaseModel):
    resume_text: str

class ResumeRewriteRequest(BaseModel):
    resume_text: str
    target_role: str

class CoverLetterRequest(BaseModel):
    name: str
    role: str
    company: str
    experience: str
    skills: str
    personalization: Optional[str] = None

class InterviewRequest(BaseModel):
    role: str

class RoadmapRequest(BaseModel):
    current_role: str
    target_role: str

class SalaryRequest(BaseModel):
    role: str
    experience_years: int
    country: str
    city: str
    skills: str

class JobRequest(BaseModel):
    skills: str
    experience: str
    preferred_role: str
