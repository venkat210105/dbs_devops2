from typing import Dict, Any

class IntakeAgent:
    """Collects required fields (name, email, rating, feedback)."""

    async def run(self, state: Dict[str, Any]) -> Dict[str, Any]:
        missing = []
        if not state.get("customerName"): missing.append("name")
        if not state.get("userEmail"): missing.append("email")
        if not state.get("rating"): missing.append("rating")
        if not state.get("feedback"): missing.append("feedback")

        if missing:
            field = missing[0]
            prompts = {
                "name": "To get started, could you please tell me your full name?",
                "email": "Thanks! Please share your email address.",
                "rating": "On a scale of 1-5, how would you rate your experience?",
                "feedback": "Please describe your experience in a few sentences so we can help.",
            }
            state["reply"] = prompts[field]
            state["next"] = "intake"
            return state

        state["next"] = "enrich"
        return state
