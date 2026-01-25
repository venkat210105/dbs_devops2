from typing import Dict, Any
import httpx
import os

BACKEND_URL = os.environ.get("BACKEND_URL", "http://backend:8085")

class NotifierAgent:
    """Optionally sends notification emails to user/admin based on triage."""

    async def run(self, state: Dict[str, Any]) -> Dict[str, Any]:
        notify_admin = bool(state.get("needsEscalation"))
        payload = {
            "to": state.get("email"),
            "subject": "Thanks for your feedback",
            "body": "We received your feedback and will act on it.",
        }
        async with httpx.AsyncClient(timeout=10) as client:
            try:
                # Hypothetical endpoints; adjust to your backend routes if different
                await client.post(f"{BACKEND_URL}/api/notify/user", json=payload)
                if notify_admin:
                    await client.post(
                        f"{BACKEND_URL}/api/notify/admin",
                        json={
                            "subject": "Escalated feedback",
                            "body": state.get("feedback"),
                        },
                    )
            except Exception as e:
                state["notifyError"] = str(e)
        state["next"] = "persist"
        return state
