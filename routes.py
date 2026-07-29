from flask import Blueprint, request, jsonify, render_template, send_from_directory
from flask_sock import Sock
from app.file_parser import parse_uploaded_file, analyze_image_with_vision
from app.services import split_debate_query, run_round1, run_round2, run_round3, trigger_webhook
from app.memory import memory_manager
import os
import json
import threading

# ---------------------------------------------------------------------------
# WebSocket – connected client registry
# ---------------------------------------------------------------------------
_ws_clients: list = []
_ws_lock = threading.Lock()


def _ws_broadcast_error(error_type: str, message: str, step: str = ""):
    """
    Push a structured error event to every connected WebSocket client.
    Silently drops stale / closed connections.
    """
    payload = json.dumps({
        "event": "backend_error",
        "error_type": error_type,   # e.g. "api_key_error" | "rate_limit" | "general"
        "message": message,
        "step": step                # e.g. "round1", "split", …
    })
    dead = []
    with _ws_lock:
        for ws in _ws_clients:
            try:
                ws.send(payload)
            except Exception:
                dead.append(ws)
        for ws in dead:
            _ws_clients.remove(ws)

api_blueprint = Blueprint('api', __name__)

# Import the Sock instance created in app/__init__.py so we can register
# the WebSocket route against the real app (Sock requires the app, not a blueprint).
# The actual @sock.route decorator is applied at the bottom of this file after import.
from app import sock  # noqa: E402 – imported after Blueprint to avoid circular issues

@api_blueprint.route('/')
def home():
    """Renders the debate dashboard UI."""
    return render_template('index.html')

@api_blueprint.route('/index.css')
def serve_css():
    """Serves the CSS file."""
    return send_from_directory(os.path.join(os.path.dirname(__file__), 'templates'), 'index.css')

@api_blueprint.route('/index.js')
def serve_js():
    """Serves the JS file."""
    return send_from_directory(os.path.join(os.path.dirname(__file__), 'templates'), 'index.js')

@api_blueprint.route('/api/split', methods=['POST'])
def handle_split():
    """
    Step 1: Splits the comparative query.
    Inputs: query (form), webhook_url (form).
    If query cannot be split, returns not_possible.
    Otherwise, creates session and returns session_id.
    """
    query = request.form.get('query')
    webhook_url = request.form.get('webhook_url')

    if not query:
        return jsonify({"status": "error", "error": "The debate query is required."}), 400

    try:
        topic_a, topic_b = split_debate_query(query)
        if topic_a == "not_possible" or topic_b == "not_possible":
            return jsonify({
                "status": "not_possible",
                "error": "The query is not a comparative technical debate topic."
            }), 200

        # Create session store mapping
        session_id = memory_manager.create_session(topic_a, topic_b)
        session = memory_manager.get_session(session_id)

        # Trigger Webhook
        trigger_webhook(webhook_url, {
            "step": "split",
            "session_id": session_id,
            "topic_a": topic_a,
            "topic_b": topic_b
        })

        return jsonify({
            "status": "success",
            "session_id": session_id,
            "topic_a": topic_a,
            "topic_b": topic_b
        }), 200

    except Exception as e:
        _ws_broadcast_error(_classify_error(e), str(e), step="split")
        return jsonify({"status": "error", "error": str(e)}), 500


@api_blueprint.route('/api/round1', methods=['POST'])
def handle_round1():
    """
    Step 2: Executes Round 1 (Initial pitches + critique 1).
    Inputs: session_id, webhook_url, file (optional).
    """
    session_id = request.form.get('session_id')
    webhook_url = request.form.get('webhook_url')
    uploaded_file = request.files.get('file')

    if not session_id:
        return jsonify({"status": "error", "error": "session_id is required."}), 400

    session = memory_manager.get_session(session_id)
    if not session:
        return jsonify({"status": "error", "error": "Session not found."}), 404

    topic_a = session["topics"]["A"]
    topic_b = session["topics"]["B"]

    file_context = ""
    image_context = ""

    # Check and parse uploaded files
    if uploaded_file and uploaded_file.filename:
        filename = uploaded_file.filename.lower()
        image_extensions = ('.png', '.jpg', '.jpeg', '.webp', '.gif')
        
        if filename.endswith(image_extensions):
            image_context = analyze_image_with_vision(uploaded_file)
        else:
            file_context = parse_uploaded_file(uploaded_file)

    try:
        updated_session = run_round1(
            session_id=session_id,
            file_context=file_context,
            image_context=image_context
        )

        response_payload = {
            "session_id": session_id,
            "status": "success",
            "topic_a": topic_a,
            "topic_b": topic_b,
            "round_1": {
                "agent_a": updated_session["agent_a"]["round1"],
                "agent_b": updated_session["agent_b"]["round1"],
                "judge": updated_session["judge"]["analysis_r1"]
            }
        }

        # Trigger Webhook with round 1 state
        trigger_webhook(webhook_url, response_payload)
        return jsonify(response_payload), 200

    except Exception as e:
        error_payload = {
            "session_id": session_id,
            "status": "error",
            "topic_a": topic_a,
            "topic_b": topic_b,
            "round_1": {
                "agent_a": None,
                "agent_b": None,
                "judge": f"API / Execution Error: {str(e)}"
            }
        }
        _ws_broadcast_error(_classify_error(e), str(e), step="round1")
        trigger_webhook(webhook_url, error_payload)
        return jsonify(error_payload), 200


@api_blueprint.route('/api/round2', methods=['POST'])
def handle_round2():
    """
    Step 3: Executes Round 2 (Rebuttal + critique 2).
    Inputs: session_id, webhook_url.
    """
    session_id = request.form.get('session_id')
    webhook_url = request.form.get('webhook_url')

    if not session_id:
        return jsonify({"status": "error", "error": "session_id is required."}), 400

    session = memory_manager.get_session(session_id)
    if not session:
        return jsonify({"status": "error", "error": "Session not found."}), 404

    topic_a = session["topics"]["A"]
    topic_b = session["topics"]["B"]

    try:
        updated_session = run_round2(session_id=session_id)

        response_payload = {
            "session_id": session_id,
            "status": "success",
            "topic_a": topic_a,
            "topic_b": topic_b,
            "round_2": {
                "agent_a": updated_session["agent_a"]["round2"],
                "agent_b": updated_session["agent_b"]["round2"],
                "judge": updated_session["judge"]["analysis_r2"]
            }
        }

        # Trigger Webhook with round 2 state
        trigger_webhook(webhook_url, response_payload)
        return jsonify(response_payload), 200

    except Exception as e:
        error_payload = {
            "session_id": session_id,
            "status": "error",
            "topic_a": topic_a,
            "topic_b": topic_b,
            "round_2": {
                "agent_a": None,
                "agent_b": None,
                "judge": f"API / Execution Error: {str(e)}"
            }
        }
        _ws_broadcast_error(_classify_error(e), str(e), step="round2")
        trigger_webhook(webhook_url, error_payload)
        return jsonify(error_payload), 200


@api_blueprint.route('/api/round3', methods=['POST'])
def handle_round3():
    """
    Step 4: Executes Round 3 (Synthesis + Final Verdict).
    Inputs: session_id, webhook_url.
    """
    session_id = request.form.get('session_id')
    webhook_url = request.form.get('webhook_url')

    if not session_id:
        return jsonify({"status": "error", "error": "session_id is required."}), 400

    session = memory_manager.get_session(session_id)
    if not session:
        return jsonify({"status": "error", "error": "Session not found."}), 404

    topic_a = session["topics"]["A"]
    topic_b = session["topics"]["B"]

    try:
        updated_session = run_round3(session_id=session_id)

        response_payload = {
            "session_id": session_id,
            "status": "success",
            "topic_a": topic_a,
            "topic_b": topic_b,
            "round_3": {
                "agent_a": updated_session["agent_a"]["round3"],
                "agent_b": updated_session["agent_b"]["round3"],
                "judge": updated_session["judge"]["final_verdict"]
            }
        }

        # Trigger Webhook with final round 3 state
        trigger_webhook(webhook_url, response_payload)
        return jsonify(response_payload), 200

    except Exception as e:
        error_payload = {
            "session_id": session_id,
            "status": "error",
            "topic_a": topic_a,
            "topic_b": topic_b,
            "round_3": {
                "agent_a": None,
                "agent_b": None,
                "judge": f"API / Execution Error: {str(e)}"
            }
        }
        _ws_broadcast_error(_classify_error(e), str(e), step="round3")
        trigger_webhook(webhook_url, error_payload)
        return jsonify(error_payload), 200





# ---------------------------------------------------------------------------
# Error classifier – maps exception messages to user-friendly error types
# ---------------------------------------------------------------------------
def _classify_error(exc: Exception) -> str:
    """Return a short error_type string based on the exception message."""
    msg = str(exc).lower()
    if "api key" in msg or "authentication" in msg or "invalid_api_key" in msg or "401" in msg:
        return "api_key_error"
    if "rate limit" in msg or "429" in msg or "quota" in msg or "too many requests" in msg:
        return "rate_limit"
    return "general"


# ---------------------------------------------------------------------------
# WebSocket endpoint – /ws
# Clients connect once on page load; the server pushes error events to them.
# ---------------------------------------------------------------------------
@sock.route('/ws')
def ws_monitor(ws):
    """
    Persistent WebSocket connection for real-time backend error monitoring.
    The client connects once; we register it and keep the socket alive until
    the browser disconnects or the debate finishes.
    """
    with _ws_lock:
        _ws_clients.append(ws)
    try:
        # Keep connection open by waiting for messages (client sends a ping
        # or just keeps the socket alive).  recv() blocks until the client
        # disconnects or sends data – either way we loop back.
        while True:
            msg = ws.receive(timeout=30)   # 30 s heartbeat window
            if msg is None:
                # Client closed the connection
                break
            # Optional: respond to client pings
            if msg == "ping":
                ws.send(json.dumps({"event": "pong"}))
    except Exception:
        pass
    finally:
        with _ws_lock:
            if ws in _ws_clients:
                _ws_clients.remove(ws)
