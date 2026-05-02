import os
import contextvars
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if not GROQ_API_KEY or GROQ_API_KEY == "your_groq_api_key_here":
    print("WARNING: GROQ_API_KEY not set. Using mock responses for development.")
    client = None
else:
    client = Groq(api_key=GROQ_API_KEY)

MODEL_NAME = "llama3-70b-8192" # or "mixtral-8x7b-32768"

selected_model_var = contextvars.ContextVar("selected_model", default=MODEL_NAME)

def generate_ai_response(prompt: str, system_prompt: str = "You are an expert AI Career Assistant.") -> str:
    model_to_use = selected_model_var.get()
    
    if not client:
        return f"[MOCK RESPONSE] Using model: {model_to_use}\nSystem: {system_prompt}\nPrompt: {prompt[:50]}..."
        
    try:
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": system_prompt
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            model=model_to_use,
            temperature=0.7,
            max_tokens=2048,
        )
        return chat_completion.choices[0].message.content
    except Exception as e:
        return f"Error connecting to AI service with model {model_to_use}: {str(e)}"

