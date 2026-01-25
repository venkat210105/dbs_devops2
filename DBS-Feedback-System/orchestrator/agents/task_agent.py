from typing import Dict, Any, Optional
import os
import httpx


class TaskAgent:
    """Creates an admin task in the backend for the given persisted feedback."""

    def __init__(self, backend_url: Optional[str] = None):
        self.backend_url = backend_url or os.environ.get("BACKEND_URL", "http://backend:8085")

    async def run(self, state: Dict[str, Any]) -> Dict[str, Any]:
        # Expect state['persistResult'] to contain saved feedback with id
        persist = state.get("persistResult") or {}
        fid = persist.get("id") if isinstance(persist, dict) else None
        if not fid:
            state["taskCreate"] = {"skipped": True, "reason": "No feedback id"}
            state["next"] = "done"
            return state

        # Compute a basic title/description from state
        topic = state.get("topic") or state.get("serviceCategory") or "General"
        sentiment = state.get("sentimentLabel") or "NEUTRAL"
        title = f"{topic} issue - {sentiment}"
        description = state.get("feedback") or state.get("comment") or "Auto-created by TaskAgent"

        try:
            async with httpx.AsyncClient(timeout=10) as client:
                r = await client.post(f"{self.backend_url}/admin/tasks", json={
                    "feedbackId": fid,
                    "title": title,
                    "description": description,
                })
                if r.status_code >= 400:
                    state["taskCreate"] = {"error": r.text, "status": r.status_code}
                else:
                    state["taskCreate"] = r.json()
        except Exception as e:
            state["taskCreate"] = {"error": str(e)}

        state["next"] = "done"
        return state
