from typing import Dict, Any
import httpx
import os

ML_URL = os.environ.get("ML_URL", "http://ml-service:5000")

class EnrichmentAgent:
    """Calls ML service to analyze sentiment/topic."""

    async def run(self, state: Dict[str, Any]) -> Dict[str, Any]:
        text = state.get("feedback", "")
        if not text:
            state["next"] = "persist"
            return state
        async with httpx.AsyncClient(timeout=10) as client:
            try:
                r = await client.post(f"{ML_URL}/analyze", json={"text": text})
                r.raise_for_status()
                ml = r.json()
            except Exception as e:
                ml = {"error": str(e)}
        state["ml"] = ml
        state["sentimentLabel"] = ml.get("label")
        state["sentimentScore"] = ml.get("score")
        state["topic"] = ml.get("topic")
        state["next"] = "triage"
        return state
