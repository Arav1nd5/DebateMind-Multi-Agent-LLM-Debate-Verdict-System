from langchain_groq import ChatGroq
from app.config import Config

def get_debater_llm():
    if not Config.GROQ_API_KEY or "YOUR_GROQ_API_KEY" in Config.GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY is not set or has placeholder value in debate/.env")
    return ChatGroq(
        model=Config.DEBATER_MODEL,
        temperature=0.7,
        groq_api_key=Config.GROQ_API_KEY
    )

def get_judge_llm():
    if not Config.GROQ_API_KEY or "YOUR_GROQ_API_KEY" in Config.GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY is not set or has placeholder value in debate/.env")
    return ChatGroq(
        model=Config.JUDGE_MODEL,
        temperature=0.2, # Low temperature for more logical reasoning and evaluation
        groq_api_key=Config.GROQ_API_KEY
    )

def get_vision_llm():
    if not Config.GROQ_API_KEY or "YOUR_GROQ_API_KEY" in Config.GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY is not set or has placeholder value in debate/.env")
    return ChatGroq(
        model=Config.VISION_MODEL,
        temperature=0.1, # Low temperature for accurate description
        groq_api_key=Config.GROQ_API_KEY
    )
