import os
import sys

def verify():
    print("=== MULTI-AGENT COURTROOM VERIFICATION SYSTEM ===")
    
    # Add parent and local directories to path
    sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))
    sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), 'app')))

    try:
        print("\n1. Testing Module Imports...")
        import flask
        import langchain
        import langchain_core
        import langchain_groq
        import pypdf
        import docx
        import dotenv
        import PIL
        print("   [SUCCESS] Core library dependencies imported successfully.")
    except ImportError as e:
        print(f"   [FAILURE] Core library import failed: {str(e)}")
        print("   Ensure your virtual environment is active and 'pip install -r requirements.txt' is complete.")
        return False

    try:
        print("\n2. Testing Application Module Imports...")
        from app.config import Config
        from app.memory import memory_manager
        from app.file_parser import parse_uploaded_file, analyze_image_with_vision
        from app.prompts import ROUND1_DEBATER_PROMPT
        print("   [SUCCESS] debate/app core scripts imported successfully.")
    except Exception as e:
        print(f"   [FAILURE] Application script import failed: {str(e)}")
        return False

    try:
        print("\n3. Testing Flask App Creation...")
        from app import create_app
        app = create_app()
        print("   [SUCCESS] Flask application factory created the app without errors.")
    except Exception as e:
        print(f"   [FAILURE] Flask app factory failed: {str(e)}")
        return False

    try:
        print("\n4. Testing Isolated Memory Manager...")
        session_id = memory_manager.create_session("Java", "Python")
        session = memory_manager.get_session(session_id)
        if (session 
            and session["topics"]["A"] == "Java" 
            and session["agent_a"]["topic"] == "Java"
            and session["agent_b"]["topic"] == "Python"):
            
            memory_manager.update_agent_round(session_id, "A", "round1", "Java is robust")
            session = memory_manager.get_session(session_id)
            if session["agent_a"]["round1"] == "Java is robust" and session["agent_b"]["round1"] is None:
                print("   [SUCCESS] Isolated Agent Memory verified. Stances and rounds are isolated.")
            else:
                print("   [FAILURE] Memory manager modified incorrect keys or collapsed memories.")
                return False
        else:
            print("   [FAILURE] Memory manager did not initialize correct keys.")
            return False
    except Exception as e:
        print(f"   [FAILURE] Memory manager execution error: {str(e)}")
        return False

    print("\n=================================================")
    print("SUCCESS: ALL STATIC AND LOCAL MODULE CHECKS PASSED!")
    print("=================================================")
    return True

if __name__ == "__main__":
    success = verify()
    sys.exit(0 if success else 1)
