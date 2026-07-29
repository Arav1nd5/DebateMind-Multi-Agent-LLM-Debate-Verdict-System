# DebateMind

A multi-agent AI debate system that pits two competing technologies, architectures, or algorithms against each other across three structured rounds, then delivers a final verdict with a scored breakdown.

---

## How it works

1. You enter a comparative query (e.g. *"Python vs Java for backend"*)
2. Two AI agents argue their assigned sides across **3 rounds** — foundational arguments, direct rebuttals, and deep-dive counter-points
3. A judge agent critiques each round and produces a final verdict with a scoreboard

---

## Prerequisites

- Python **3.10+**
- A **Groq API key** — get one free at [console.groq.com](https://console.groq.com)

---

## Setup

### 1. Clone the repo

```bash
git clone <repo-url>
cd debate-main
```

### 2. Create a virtual environment

```bash
python -m venv venv
```

Activate it:

- **Windows:** `venv\Scripts\activate`
- **Mac / Linux:** `source venv/bin/activate`

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure environment variables

Create a `.env` file in the project root (same folder as `run.py`):

```env
GROQ_API_KEY=your_groq_api_key_here
PORT=5000
FLASK_DEBUG=True
```

| Variable | Required | Description |
|---|---|---|
| `GROQ_API_KEY` | ✅ Yes | Your Groq API key |
| `PORT` | No | Port to run the server on (default: `5000`) |
| `FLASK_DEBUG` | No | Enable debug mode (default: `True`) |

### 5. Run the server

```bash
python run.py
```

Then open your browser at **http://localhost:5000**

---

## Usage

1. Type a comparative question in the **Case Query** field
   - Good: *"Which is better for microservices: Go or Node.js?"*
   - Good: *"React vs Vue for large-scale SPAs"*
   - Not valid: open-ended questions without two competing sides
2. Optionally attach a **context file** (PDF, DOCX, code file, or image) — the agents will factor it into their arguments
3. Click **Start Debate** and watch the rounds populate in real time
4. Once all three rounds complete, the **Final Verdict** panel appears with a winner and scoreboard
5. Click **Download PDF Report** to export the full debate transcript

---

## Error notifications

The app maintains a live WebSocket connection to the server. If a backend error occurs mid-debate (invalid API key, rate limit hit, etc.) a toast notification will appear at the bottom of the screen describing the issue — no page refresh needed.

---

## Models used

| Role | Model |
|---|---|
| Debater agents | `llama-3.1-8b-instant` |
| Judge agent | `llama-3.3-70b-versatile` |
| Vision (image context) | `llama-3.2-11b-vision-instruct` |

All models run via the [Groq](https://groq.com) inference API.

---

## Project structure

```
debate-main/
├── app/
│   ├── __init__.py       # App factory, WebSocket init
│   ├── agents.py         # LLM client setup
│   ├── config.py         # Environment config
│   ├── file_parser.py    # PDF / DOCX / image parsing
│   ├── memory.py         # In-memory session store
│   ├── prompts.py        # All LLM prompt templates
│   └── services.py       # Debate round logic
├── templates/
│   ├── index.html        # Frontend UI
│   ├── index.js          # Frontend logic + WebSocket monitor
│   └── index.css         # Styles
├── routes.py             # Flask API routes + WebSocket endpoint
├── run.py                # Entry point
├── requirements.txt
└── .env                  # Your local secrets (not committed)
```

---

## Troubleshooting

**Debate fails immediately**
- Check that `GROQ_API_KEY` is set correctly in `.env`
- Make sure the venv is activated before running `python run.py`

**Rate limit toast appears**
- Groq free-tier accounts have per-minute token limits. Wait a few seconds and try again, or upgrade your Groq plan.

**Port already in use**
- Change `PORT=5000` to another port in `.env` (e.g. `PORT=8080`)
