import json
from langchain_core.prompts import ChatPromptTemplate
from app.agents import get_debater_llm, get_judge_llm
from app.prompts import (
    ROUND1_DEBATER_PROMPT,
    JUDGE_R1_PROMPT,
    ROUND2_DEBATER_PROMPT,
    JUDGE_R2_PROMPT,
    ROUND3_DEBATER_PROMPT,
    JUDGE_FINAL_PROMPT
)
from app.memory import memory_manager

QUERY_SPLITTER_PROMPT = ChatPromptTemplate.from_messages([
    ("system", "You are an analytical parser. Your job is to extract two fully-formed, balanced, and parallel competing technical stances from a comparison query.\n\n"
               "CRITICAL RULES:\n"
               "1. Formulate both topics as complete parallel comparison topics that retain the full query context. Do not output simple single words for the second topic (e.g. do not just output 'ml' or 'java'). Instead, balance them to have identical framing.\n"
               "   Example query: 'who is brighter future ai or ml'\n"
               "   Topic A: 'who is brighter future ai'\n"
               "   Topic B: 'who is brighter future ml'\n"
               "   Example query: 'which is better for gaming c++ or java'\n"
               "   Topic A: 'c++ for gaming'\n"
               "   Topic B: 'java for gaming'\n"
               "2. Output a JSON object with exactly two keys: 'topic_a' and 'topic_b'.\n"
               "3. Return ONLY valid JSON. Do not include markdown code block syntax (like ```json).\n"
               "4. If the prompt is NOT a comparison, or does not contain two competing technical options to compare, or is invalid, you must output exactly the text: not_possible (with no JSON, no markdown, no other characters)."),
    ("user", "Extract topics from: {query}")
])

import threading
import requests

def trigger_webhook(webhook_url: str, session: dict):
    """Sends the session state JSON payload to the user's webhook_url in a background thread."""
    if not webhook_url:
        return
    
    def post_request():
        try:
            # Send the entire session dict as JSON payload
            response = requests.post(webhook_url, json=session, timeout=8)
            print(f"[Webhook] Sent successfully to {webhook_url}. Status code: {response.status_code}")
        except Exception as e:
            print(f"[Webhook Error] Failed sending payload to {webhook_url}: {str(e)}")

    # Start execution in background so the user API response is not blocked
    threading.Thread(target=post_request, daemon=True).start()

def split_debate_query(query: str) -> tuple[str, str]:
    """
    Parses a single comparative user prompt into two distinct debate topics.
    Returns ("not_possible", "not_possible") if splitting is not possible.
    """
    try:
        judge_llm = get_judge_llm()
        chain = QUERY_SPLITTER_PROMPT | judge_llm 
        response = chain.invoke({"query": query}).content.strip()
        if "not_possible" in response.lower() or "not possible" in response.lower():
            return "not_possible", "not_possible"
        if response.startswith("```"):
            response = response.replace("```json", "").replace("```", "").strip()
        data = json.loads(response)
        return data.get("topic_a", "Topic A"), data.get("topic_b", "Topic B")
    except Exception as e:
        print(f"Error splitting query: {str(e)}")
        raise ValueError("Could not parse comparative topics from the query.")


def parse_llm_json(response_text: str) -> dict:
    """Parses raw text response into JSON dictionary, handling potential markdown wrappers."""
    response_text = response_text.strip()
    if response_text.startswith("```"):
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        else:
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
    response_text = response_text.strip()
    return json.loads(response_text)

def run_round1(session_id: str, file_context: str = "", image_context: str = "") -> dict:
    """Runs Round 1 and Critique 1 for the given session."""
    session = memory_manager.get_session(session_id)
    if not session:
        raise ValueError("Invalid session_id")
        
    topic_a = session["topics"]["A"]
    topic_b = session["topics"]["B"]
    
    background_context = ""
    if file_context:
        background_context += f"Uploaded Document Content:\n{file_context}\n"
    if image_context:
        background_context += f"\nUploaded Image Description:\n{image_context}\n"
    if not background_context:
        background_context = "No additional files or images uploaded."

    # Cache background context in memory
    memory_manager.set_background_context(session_id, background_context)

    debater_llm = get_debater_llm()
    judge_llm = get_judge_llm()

    # Agent A -> Topic A
    chain1_a = ROUND1_DEBATER_PROMPT | debater_llm
    r1_a_raw = chain1_a.invoke({
        "assigned_topic": topic_a,
        "opposing_topic": topic_b,
        "background_context": background_context
    }).content
    try:
        r1_a = parse_llm_json(r1_a_raw)
    except Exception as e:
        print(f"Error parsing Agent A Round 1 JSON: {e}")
        r1_a = {
            "1": r1_a_raw[:150],
            "2": "Error parsing JSON", "3": "Error parsing JSON", "4": "Error parsing JSON", "5": "Error parsing JSON"
        }
    memory_manager.update_agent_round(session_id, "A", "round1", r1_a)

    # Agent B -> Topic B
    chain1_b = ROUND1_DEBATER_PROMPT | debater_llm
    r1_b_raw = chain1_b.invoke({
        "assigned_topic": topic_b,
        "opposing_topic": topic_a,
        "background_context": background_context
    }).content
    try:
        r1_b = parse_llm_json(r1_b_raw)
    except Exception as e:
        print(f"Error parsing Agent B Round 1 JSON: {e}")
        r1_b = {
            "1": r1_b_raw[:150],
            "2": "Error parsing JSON", "3": "Error parsing JSON", "4": "Error parsing JSON", "5": "Error parsing JSON"
        }
    memory_manager.update_agent_round(session_id, "B", "round1", r1_b)

    # Judge Critique 1
    judge_chain1 = JUDGE_R1_PROMPT | judge_llm
    judge_r1_raw = judge_chain1.invoke({
        "topic_a": topic_a,
        "topic_b": topic_b,
        "r1_a": json.dumps(r1_a, indent=2),
        "r1_b": json.dumps(r1_b, indent=2)
    }).content
    try:
        judge_r1 = parse_llm_json(judge_r1_raw)
    except Exception as e:
        print(f"Error parsing Judge Critique 1 JSON: {e}")
        judge_r1 = {
            "strengths_a": "Error parsing JSON",
            "weaknesses_a": "Error parsing JSON",
            "strengths_b": "Error parsing JSON",
            "weaknesses_b": "Error parsing JSON",
            "deciding_lead": judge_r1_raw[:150]
        }
    memory_manager.update_judge_analysis(session_id, "analysis_r1", judge_r1)

    return session

def run_round2(session_id: str) -> dict:
    """Runs Round 2 and Critique 2 for the given session."""
    session = memory_manager.get_session(session_id)
    if not session:
        raise ValueError("Invalid session_id")

    topic_a = session["topics"]["A"]
    topic_b = session["topics"]["B"]
    r1_a = session["agent_a"]["round1"]
    r1_b = session["agent_b"]["round1"]
    judge_r1 = session["judge"]["analysis_r1"]
    background_context = session.get("background_context", "No additional files or images uploaded.")

    debater_llm = get_debater_llm()
    judge_llm = get_judge_llm()

    # Agent A -> Refute B's Round 1 points
    chain2_a = ROUND2_DEBATER_PROMPT | debater_llm
    r2_a_raw = chain2_a.invoke({
        "assigned_topic": topic_a,
        "opposing_topic": topic_b,
        "own_round1_output": json.dumps(r1_a, indent=2),
        "opponent_round1_output": json.dumps(r1_b, indent=2),
        "judge_analysis1": json.dumps(judge_r1, indent=2),
        "background_context": background_context
    }).content
    try:
        r2_a = parse_llm_json(r2_a_raw)
    except Exception as e:
        print(f"Error parsing Agent A Round 2 JSON: {e}")
        r2_a = {
            "1": r2_a_raw[:150],
            "2": "Error parsing JSON", "3": "Error parsing JSON", "4": "Error parsing JSON", "5": "Error parsing JSON"
        }
    memory_manager.update_agent_round(session_id, "A", "round2", r2_a)

    # Agent B -> Refute A's Round 1 points
    chain2_b = ROUND2_DEBATER_PROMPT | debater_llm
    r2_b_raw = chain2_b.invoke({
        "assigned_topic": topic_b,
        "opposing_topic": topic_a,
        "own_round1_output": json.dumps(r1_b, indent=2),
        "opponent_round1_output": json.dumps(r1_a, indent=2),
        "judge_analysis1": json.dumps(judge_r1, indent=2),
        "background_context": background_context
    }).content
    try:
        r2_b = parse_llm_json(r2_b_raw)
    except Exception as e:
        print(f"Error parsing Agent B Round 2 JSON: {e}")
        r2_b = {
            "1": r2_b_raw[:150],
            "2": "Error parsing JSON", "3": "Error parsing JSON", "4": "Error parsing JSON", "5": "Error parsing JSON"
        }
    memory_manager.update_agent_round(session_id, "B", "round2", r2_b)

    # Judge Critique 2
    judge_chain2 = JUDGE_R2_PROMPT | judge_llm
    judge_r2_raw = judge_chain2.invoke({
        "topic_a": topic_a,
        "topic_b": topic_b,
        "r1_a": json.dumps(r1_a, indent=2),
        "r1_b": json.dumps(r1_b, indent=2),
        "judge_analysis1": json.dumps(judge_r1, indent=2),
        "r2_a": json.dumps(r2_a, indent=2),
        "r2_b": json.dumps(r2_b, indent=2)
    }).content
    try:
        judge_r2 = parse_llm_json(judge_r2_raw)
    except Exception as e:
        print(f"Error parsing Judge Critique 2 JSON: {e}")
        judge_r2 = {
            "strengths_a": "Error parsing JSON",
            "weaknesses_a": "Error parsing JSON",
            "strengths_b": "Error parsing JSON",
            "weaknesses_b": "Error parsing JSON",
            "deciding_lead": judge_r2_raw[:150]
        }
    memory_manager.update_judge_analysis(session_id, "analysis_r2", judge_r2)

    return session

def run_round3(session_id: str) -> dict:
    """Runs Round 3 and the final Judge verdict for the given session."""
    session = memory_manager.get_session(session_id)
    if not session:
        raise ValueError("Invalid session_id")

    topic_a = session["topics"]["A"]
    topic_b = session["topics"]["B"]
    r1_a = session["agent_a"]["round1"]
    r1_b = session["agent_b"]["round1"]
    r2_a = session["agent_a"]["round2"]
    r2_b = session["agent_b"]["round2"]
    judge_r1 = session["judge"]["analysis_r1"]
    judge_r2 = session["judge"]["analysis_r2"]
    background_context = session.get("background_context", "No additional files or images uploaded.")

    debater_llm = get_debater_llm()
    judge_llm = get_judge_llm()

    # Agent A -> Final Synthesis & Defend Topic A
    chain3_a = ROUND3_DEBATER_PROMPT | debater_llm
    r3_a_raw = chain3_a.invoke({
        "assigned_topic": topic_a,
        "opposing_topic": topic_b,
        "own_r1": json.dumps(r1_a, indent=2),
        "own_r2": json.dumps(r2_a, indent=2),
        "opp_r1": json.dumps(r1_b, indent=2),
        "opp_r2": json.dumps(r2_b, indent=2),
        "judge_analysis1": json.dumps(judge_r1, indent=2),
        "judge_analysis2": json.dumps(judge_r2, indent=2),
        "background_context": background_context
    }).content
    try:
        r3_a = parse_llm_json(r3_a_raw)
    except Exception as e:
        print(f"Error parsing Agent A Round 3 JSON: {e}")
        r3_a = {
            "1": r3_a_raw[:150],
            "2": "Error parsing JSON", "3": "Error parsing JSON", "4": "Error parsing JSON", "5": "Error parsing JSON"
        }
    memory_manager.update_agent_round(session_id, "A", "round3", r3_a)

    # Agent B -> Final Synthesis & Defend Topic B
    chain3_b = ROUND3_DEBATER_PROMPT | debater_llm
    r3_b_raw = chain3_b.invoke({
        "assigned_topic": topic_b,
        "opposing_topic": topic_a,
        "own_r1": json.dumps(r1_b, indent=2),
        "own_r2": json.dumps(r2_b, indent=2),
        "opp_r1": json.dumps(r1_a, indent=2),
        "opp_r2": json.dumps(r2_a, indent=2),
        "judge_analysis1": json.dumps(judge_r1, indent=2),
        "judge_analysis2": json.dumps(judge_r2, indent=2),
        "background_context": background_context
    }).content
    try:
        r3_b = parse_llm_json(r3_b_raw)
    except Exception as e:
        print(f"Error parsing Agent B Round 3 JSON: {e}")
        r3_b = {
            "1": r3_b_raw[:150],
            "2": "Error parsing JSON", "3": "Error parsing JSON", "4": "Error parsing JSON", "5": "Error parsing JSON"
        }
    memory_manager.update_agent_round(session_id, "B", "round3", r3_b)

    # Final Judge Verdict
    judge_final_chain = JUDGE_FINAL_PROMPT | judge_llm
    verdict_raw = judge_final_chain.invoke({
        "topic_a": topic_a,
        "topic_b": topic_b,
        "r1_a": json.dumps(r1_a, indent=2),
        "r1_b": json.dumps(r1_b, indent=2),
        "judge_analysis1": json.dumps(judge_r1, indent=2),
        "r2_a": json.dumps(r2_a, indent=2),
        "r2_b": json.dumps(r2_b, indent=2),
        "judge_analysis2": json.dumps(judge_r2, indent=2),
        "r3_a": json.dumps(r3_a, indent=2),
        "r3_b": json.dumps(r3_b, indent=2)
    }).content
    try:
        verdict = parse_llm_json(verdict_raw)
    except Exception as e:
        print(f"Error parsing Judge Final Verdict JSON: {e}")
        verdict = {
            "winner": "Error parsing JSON",
            "summary": "Error parsing JSON",
            "round_1_winner": "Error parsing JSON",
            "round_2_winner": "Error parsing JSON",
            "round_3_winner": "Error parsing JSON",
            "factor_1": "Error parsing JSON",
            "factor_2": "Error parsing JSON",
            "factor_3": verdict_raw[:150]
        }
    memory_manager.update_judge_analysis(session_id, "final_verdict", verdict)

    return session


