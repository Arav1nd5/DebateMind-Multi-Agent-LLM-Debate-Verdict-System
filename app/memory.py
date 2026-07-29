import uuid
from typing import Dict, Any

class IsolatedAgentMemory:
    """
    Maintains clean, isolated memory slots for Agent A, Agent B, and the Judge 
    across all debate rounds for a given session.
    """
    def __init__(self):
        # Maps session_id -> session state dictionary
        self._store: Dict[str, Dict[str, Any]] = {}

    def create_session(self, topic_a: str, topic_b: str) -> str:
        session_id = str(uuid.uuid4())
        self._store[session_id] = {
            "session_id": session_id,
            "topics": {
                "A": topic_a,
                "B": topic_b
            },
            "background_context": "",
            "agent_a": {
                "topic": topic_a,
                "round1": None,
                "round2": None,
                "round3": None
            },
            "agent_b": {
                "topic": topic_b,
                "round1": None,
                "round2": None,
                "round3": None
            },
            "judge": {
                "analysis_r1": None,
                "analysis_r2": None,
                "final_verdict": None
            }
        }
        return session_id

    def set_background_context(self, session_id: str, context: str):
        """Sets parsed file or image descriptions for the session context"""
        session = self._store.get(session_id)
        if session:
            session["background_context"] = context


    def update_agent_round(self, session_id: str, agent_id: str, round_key: str, content: str):
        """Updates Agent A or Agent B's response for round1, round2, or round3"""
        session = self._store.get(session_id)
        if session:
            key = "agent_a" if agent_id.upper() == "A" else "agent_b"
            if round_key in session[key]:
                session[key][round_key] = content

    def update_judge_analysis(self, session_id: str, analysis_key: str, content: str):
        """Updates Judge intermediate critiques (analysis_r1, analysis_r2) or final_verdict"""
        session = self._store.get(session_id)
        if session:
            if analysis_key in session["judge"]:
                session["judge"][analysis_key] = content

    def get_session(self, session_id: str) -> Dict[str, Any]:
        """Returns the full session state"""
        return self._store.get(session_id, {})

    def clear_session(self, session_id: str):
        """Clears session data from memory"""
        if session_id in self._store:
            del self._store[session_id]

# Singleton instance
memory_manager = IsolatedAgentMemory()
