import os
from dotenv import load_dotenv

# Load environment variables from the parent debate directory
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

class Config:
    GROQ_API_KEY = os.getenv("GROQ_API_KEY")
    DEBATER_MODEL = os.getenv("DEBATER_MODEL", "openai/gpt-oss-20b")
    JUDGE_MODEL = os.getenv("JUDGE_MODEL", "openai/gpt-oss-120b")
    VISION_MODEL = os.getenv("VISION_MODEL", "openai/gpt-oss-20b")
    PORT = int(os.getenv("PORT", 5000))
    FLASK_DEBUG = os.getenv("FLASK_DEBUG", "True") == "True"
