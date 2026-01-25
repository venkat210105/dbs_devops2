from typing import Dict, Any

class TriageAgent:
    """Simple rules to decide escalation or next steps."""

    async def run(self, state: Dict[str, Any]) -> Dict[str, Any]:
        label = (state.get("sentimentLabel") or "").lower()
        score = state.get("sentimentScore")
        topic = (state.get("topic") or "").lower()

        escalate = False
        reason = None

        if label == "negative" and (score is None or score >= 0.6):
            escalate = True
            reason = "High-confidence negative sentiment"
        if topic in {"outage", "billing", "security"}:
            escalate = True
            reason = f"Sensitive topic: {topic}"

        state["needsEscalation"] = escalate
        state["triageReason"] = reason
        # For now proceed to persist regardless; future: branch to scheduler/notifier
        state["next"] = "persist"
        return state
