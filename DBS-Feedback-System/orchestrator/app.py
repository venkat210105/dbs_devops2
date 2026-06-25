import os
import asyncio
import logging
from typing import Dict, Any, List, Optional
import re
from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel
import httpx

# LangGraph imports
from langgraph.graph import StateGraph, END
from agents import IntakeAgent, EnrichmentAgent, TriageAgent, TaskAgent, ImplicitAgent, PriorityAgent

BACKEND_URL = os.environ.get("BACKEND_URL", "http://backend:8085")
ML_URL = os.environ.get("ML_URL", "http://ml-service:5000")

class Message(BaseModel):
    role: str
    content: str

class OrchestrateRequest(BaseModel):
    sessionId: str
    messages: List[Message]

class OrchestrateResponse(BaseModel):
    reply: str
    state: Dict[str, Any]

class OrchestratorState(Dict[str, Any]):
    pass

app = FastAPI(title="Universal Orchestrator", version="0.1.0")
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("orchestrator")

# Tools
async def call_ml_analyze(text: str) -> Dict[str, Any]:
    async with httpx.AsyncClient(timeout=10) as client:
        try:
            r = await client.post(f"{ML_URL}/analyze", json={"text": text})
            r.raise_for_status()
            return r.json()
        except Exception as e:
            return {"error": str(e)}

async def persist_feedback(feedback: Dict[str, Any]) -> Dict[str, Any]:
    async with httpx.AsyncClient(timeout=10) as client:
        try:
            r = await client.post(f"{BACKEND_URL}/feedback/submit", json=feedback)
            r.raise_for_status()
            return r.json()
        except Exception as e:
            return {"error": str(e)}

"""Nodes implemented via agent classes for clarity and testability."""
_intake_agent = IntakeAgent()
_enrichment_agent = EnrichmentAgent()
_triage_agent = TriageAgent()
_task_agent = TaskAgent(backend_url=BACKEND_URL)
_implicit_agent = ImplicitAgent()
_priority_agent = PriorityAgent()

async def intake_node(state: OrchestratorState) -> OrchestratorState:
    return await _intake_agent.run(state)

async def enrich_node(state: OrchestratorState) -> OrchestratorState:
    return await _enrichment_agent.run(state)

async def triage_node(state: OrchestratorState) -> OrchestratorState:
    return await _triage_agent.run(state)

async def priority_node(state: OrchestratorState) -> OrchestratorState:
    return await _priority_agent.run(state)

async def persist_node(state: OrchestratorState) -> OrchestratorState:
    # Map to backend Feedback JSON
    payload = {
        "userName": state.get("customerName"),
        "userEmail": state.get("userEmail"),
        "productId": state.get("productId") or 1,
        "rating": state.get("rating") or 5,
        "comment": None,
        "customerName": state.get("customerName"),
        "feedback": state.get("feedback"),
        "email": state.get("userEmail"),
        "serviceCategory": state.get("serviceCategory") or state.get("topic"),
        "serviceChannel": state.get("serviceChannel") or "Chatbot",
        "customerType": state.get("customerType") or "Individual",
        "businessUnit": state.get("businessUnit") or "Retail Banking",
        "sentimentLabel": state.get("sentimentLabel"),
        "sentimentScore": state.get("sentimentScore"),
        "topic": state.get("topic")
    }
    resp = await persist_feedback(payload)
    state["persistResult"] = resp
    fid = resp.get("id") if isinstance(resp, dict) else None
    state["reply"] = (
        f"Thank you! Your feedback has been submitted. ID: #{fid}." if fid else
        "Thanks! Your feedback has been submitted."
    )
    state["next"] = "done"
    return state

async def task_node(state: OrchestratorState) -> OrchestratorState:
    return await _task_agent.run(state)

# Build graph
workflow = StateGraph(OrchestratorState)
workflow.add_node("intake", intake_node)
workflow.add_node("enrich", enrich_node)
workflow.add_node("triage", triage_node)
workflow.add_node("priority", priority_node)
workflow.add_node("persist", persist_node)
workflow.add_node("task", task_node)

workflow.set_entry_point("intake")
workflow.add_edge("intake", "enrich")
workflow.add_edge("enrich", "priority")
workflow.add_edge("priority", "triage")
workflow.add_edge("triage", "persist")
workflow.add_edge("persist", "task")
workflow.add_edge("task", END)

compiled = workflow.compile()

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "orchestrator"}

@app.post("/orchestrate", response_model=OrchestrateResponse)
async def orchestrate(req: OrchestrateRequest):
    # Extract across full user message history
    user_msgs = [m.content.strip() for m in req.messages if m.role == "user" and m.content]

    def extract_email(texts: List[str]) -> Optional[str]:
        email_re = re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b")
        for t in reversed(texts):
            m = email_re.search(t)
            if m:
                return m.group(0)
        return None

    def extract_rating(texts: List[str]) -> Optional[int]:
        # Prefer explicit 1-5 numbers possibly followed by 'star(s)'
        for t in reversed(texts):
            m = re.search(r"\b([1-5])\b(?:\s*stars?)?", t)
            if m:
                try:
                    return int(m.group(1))
                except Exception:
                    pass
        return None

    def extract_name(texts: List[str]) -> Optional[str]:
        # Look for patterns like "my name is X", "I am X", "I'm X"
        patterns = [
            r"my name is\s+([A-Za-z][A-Za-z\-']+(?:\s+[A-Za-z][A-Za-z\-']+)*)",
            r"i am\s+([A-Za-z][A-Za-z\-']+(?:\s+[A-Za-z][A-Za-z\-']+)*)",
            r"i'm\s+([A-Za-z][A-Za-z\-']+(?:\s+[A-Za-z][A-Za-z\-']+)*)",
        ]
        for t in reversed(texts):
            tl = t.lower()
            for p in patterns:
                m = re.search(p, tl)
                if m:
                    # Return original-cased slice from the text based on match span
                    span = m.span(1)
                    return t[span[0]:span[1]].strip()
        # Fallback: choose a line with 2+ capitalized tokens, not an email
        for t in reversed(texts):
            if "@" in t:
                continue
            tokens = [w for w in re.split(r"\s+", t) if w]
            caps = [w for w in tokens if re.match(r"^[A-Z][a-zA-Z\-']+$", w)]
            if len(caps) >= 2 and len(tokens) <= 6:
                return " ".join(caps[:3])
        return None

    def extract_feedback(texts: List[str]) -> Optional[str]:
        # Choose the last substantial message (20+ chars) that isn't just an email or rating
        for t in reversed(texts):
            if len(t) < 20:
                continue
            if re.search(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b", t):
                continue
            if re.search(r"\b([1-5])\b(?:\s*stars?)?", t):
                continue
            return t
        return None

    state: OrchestratorState = {
        "customerName": extract_name(user_msgs),
        "userEmail": extract_email(user_msgs),
        "rating": extract_rating(user_msgs),
        "feedback": extract_feedback(user_msgs),
    }

    # Run graph
    result = await compiled.ainvoke(state)
    reply = result.get("reply") or "How can I help you with your feedback?"
    return OrchestrateResponse(reply=reply, state=result)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5050)

# -------- Implicit feedback import path ---------
class SessionEvent(BaseModel):
    userId: str | None = None
    pageUrl: str
    pageTitle: str | None = None
    timeSpentSeconds: int
    clickCount: int | None = 0
    scrollDepthPercent: float | None = 0.0
    timestamp: str | None = None
    deviceType: str | None = None
    browser: str | None = None
    sessionId: str | None = None
    additionalNotes: str | None = None

class ImportSessionsRequest(BaseModel):
    sessions: List[SessionEvent]

def _coerce_session(d: Dict[str, Any]) -> SessionEvent:
    # Allow alternative keys and type coercion
    key_map = {
        "userId": ["userId", "user_id", "user"],
        "pageUrl": ["pageUrl", "page_url", "url", "page"],
        "pageTitle": ["pageTitle", "page_title", "title"],
        "timeSpentSeconds": ["timeSpentSeconds", "time_spent_seconds", "dwell", "timeSpent", "seconds"],
        "clickCount": ["clickCount", "click_count", "clicks"],
        "scrollDepthPercent": ["scrollDepthPercent", "scroll_depth_percent", "scroll", "scrollPercent"],
        "timestamp": ["timestamp", "time", "ts"],
        "deviceType": ["deviceType", "device_type", "device"],
        "browser": ["browser"],
        "sessionId": ["sessionId", "session_id", "sid"],
        "additionalNotes": ["additionalNotes", "notes", "note"],
    }

    def pick(keys, default=None):
        for k in keys:
            if k in d and d[k] is not None and d[k] != "":
                return d[k]
        return default

    def to_int(v, default=0):
        try:
            return int(float(v))
        except Exception:
            return default

    def to_float(v, default=0.0):
        try:
            return float(v)
        except Exception:
            return default

    payload = {
        "userId": pick(key_map["userId"]),
        "pageUrl": pick(key_map["pageUrl"], ""),
        "pageTitle": pick(key_map["pageTitle"]),
        "timeSpentSeconds": to_int(pick(key_map["timeSpentSeconds"], 0)),
        "clickCount": to_int(pick(key_map["clickCount"], 0)),
        "scrollDepthPercent": to_float(pick(key_map["scrollDepthPercent"], 0.0)),
        "timestamp": pick(key_map["timestamp"]),
        "deviceType": pick(key_map["deviceType"]),
        "browser": pick(key_map["browser"]),
        "sessionId": pick(key_map["sessionId"]),
        "additionalNotes": pick(key_map["additionalNotes"]),
    }
    return SessionEvent(**payload)

@app.post("/implicit/import")
async def import_implicit(request: Request):
    try:
        # Accept either {"sessions": [...]} or a bare JSON array [...]
        body = await request.json()
        if isinstance(body, list):
            raw_sessions = body
        elif isinstance(body, dict) and "sessions" in body:
            raw_sessions = body.get("sessions") or []
        else:
            raise HTTPException(status_code=400, detail="Body must be an array of sessions or an object with 'sessions' array")

        sessions: List[SessionEvent] = []
        for item in raw_sessions:
            if not isinstance(item, dict):
                # Skip invalid entries instead of failing the whole batch
                continue
            try:
                sessions.append(_coerce_session(item))
            except Exception:
                # Skip rows that still can't be coerced
                continue

        if not sessions:
            return {"created": [], "processed": 0}

        created = []
        async with httpx.AsyncClient(timeout=10) as client:
            for s in sessions:
                try:
                    # Classify per session with defensive guard
                    try:
                        classification = await _implicit_agent.run(s.dict())
                    except Exception as ce:
                        logger.exception("Classification failed for session: %s", s.dict())
                        created.append({"error": f"classification_failed: {ce}", "session": s.dict()})
                        continue

                    urgency = classification.get("urgency", "MEDIUM")
                    reason = classification.get("detectedReason") or ""
                    team = classification.get("team") or "General"
                    summary = classification.get("summary") or (s.pageTitle or s.pageUrl)

                    # Build implicit feedback payload for backend
                    feedback = {
                        "userName": s.userId or "Implicit",
                        "userEmail": "implicit@system.local",
                        "productId": 1,
                        "rating": 3,
                        "comment": s.additionalNotes or reason,
                        "customerName": s.userId or "Implicit",
                        "feedback": f"[IMPLICIT] {summary} | clicks={s.clickCount} scroll={s.scrollDepthPercent}%",
                        "email": None,
                        "serviceCategory": team,
                        "serviceChannel": "Web",
                        "customerType": "Individual",
                        "businessUnit": "Digital Banking",
                        "sentimentLabel": None,
                        "sentimentScore": None,
                        "topic": s.pageTitle or s.pageUrl,
                    }

                    r = await client.post(f"{BACKEND_URL}/feedback/submit", json=feedback)
                    r.raise_for_status()
                    fb = r.json()
                    fid = fb.get("id")

                    # Create admin task with urgency mapping
                    priority = "HIGH" if urgency in ("HIGH", "CRITICAL") else "MEDIUM"
                    if urgency == "CRITICAL":
                        priority = "CRITICAL"
                    task_payload = {
                        "feedbackId": fid,
                        "title": f"Implicit: {summary}",
                        "description": f"Auto-generated from session on {s.pageUrl}. Reason: {reason}. Device: {s.deviceType}. Browser: {s.browser}",
                        "assignedTo": None
                    }
                    tr = await client.post(f"{BACKEND_URL}/admin/tasks", json=task_payload)
                    tr.raise_for_status()

                    # Optional: notify routed team when urgency is HIGH/CRITICAL (best-effort)
                    if urgency in ("HIGH", "CRITICAL"):
                        try:
                            await client.post(f"{BACKEND_URL}/admin/notify", json={
                                "to": "team-notify@universal.com",
                                "subject": f"{urgency} implicit alert: {summary}",
                                "body": f"Feedback #{fid} created for {s.pageUrl}. Reason: {reason}."
                            })
                        except Exception:
                            logger.warning("Notify call failed for feedback %s", fid)

                    created.append({"feedbackId": fid, "task": tr.json(), "priority": priority})
                except Exception as ex:
                    logger.exception("Session processing failed")
                    created.append({"error": str(ex), "session": s.dict()})
        return {"created": created, "processed": len(sessions)}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("/implicit/import failed")
        raise HTTPException(status_code=500, detail=f"import_failed: {e}")
