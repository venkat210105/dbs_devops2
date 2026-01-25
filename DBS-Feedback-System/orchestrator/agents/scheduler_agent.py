from typing import Dict, Any
import httpx
import os

BACKEND_URL = os.environ.get("BACKEND_URL", "http://backend:8085")

class SchedulerAgent:
    """Optionally schedules follow-up meetings for escalated items."""

    async def run(self, state: Dict[str, Any]) -> Dict[str, Any]:
        if not state.get("needsEscalation"):
            state["next"] = "notifier"
            return state
        payload = {
            "name": state.get("name"),
            "email": state.get("email"),
            "subject": "Follow-up on your feedback",
            "description": state.get("feedback"),
        }
        async with httpx.AsyncClient(timeout=10) as client:
            try:
                r = await client.post(f"{BACKEND_URL}/api/schedule", json=payload)
                r.raise_for_status()
                state["schedule"] = r.json()
            except Exception as e:
                state["scheduleError"] = str(e)
        state["next"] = "notifier"
        return state
