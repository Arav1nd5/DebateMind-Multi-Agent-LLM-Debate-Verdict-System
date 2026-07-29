import os
from dotenv import load_dotenv

# Load environment variables from the parent debate directory
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

class Config:
    GROQ_API_KEY = os.getenv("GROQ_API_KEY")
    DEBATER_MODEL = "llama-3.1-8b-instant"
    JUDGE_MODEL = "llama-3.3-70b-versatile"
    VISION_MODEL = "llama-3.2-11b-vision-instruct"
    PORT = int(os.getenv("PORT", 5000))
    FLASK_DEBUG = os.getenv("FLASK_DEBUG", "True") == "True"
