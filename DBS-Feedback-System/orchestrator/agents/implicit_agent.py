import re
from typing import Dict, Any

class ImplicitAgent:
    """
    Classifies a page session (time, clicks, scroll) into implicit feedback signals and composes
    a feedback payload: detected reason, urgency, and suggested team routing.
    """

    def __init__(self):
        pass

    async def run(self, session: Dict[str, Any]) -> Dict[str, Any]:
        time_spent = int(session.get("timeSpentSeconds") or 0)
        click_count = int(session.get("clickCount") or 0)
        scroll = float(session.get("scrollDepthPercent") or 0.0)
        url = session.get("pageUrl") or ""
        title = session.get("pageTitle") or url

        # Heuristics
        reason = []
        urgency = "LOW"

        if time_spent >= 900:  # >= 15 min
            urgency = "CRITICAL"
            reason.append("Extremely long time on page")
        elif time_spent >= 420:  # >= 7 min
            urgency = "HIGH"
            reason.append("Unusually long time on page")
        elif time_spent >= 180:  # >= 3 min
            urgency = "MEDIUM"
            reason.append("Longer than typical dwell time")

        if click_count <= 2 and time_spent >= 240:
            reason.append("Low interaction while lingering")
        if scroll < 30 and time_spent >= 180:
            reason.append("Low scroll depth indicates confusion above the fold")
        if scroll >= 95 and click_count <= 1:
            reason.append("Scrolled to end but did not complete action")

        # Simple routing inference
        team = self.route_team(url, title)
        if not reason:
            reason.append("Potential navigation confusion")

        summary = f"{'; '.join(reason)} on {title}"
        return {
            "detectedReason": "; ".join(reason),
            "urgency": urgency,
            "team": team,
            "summary": summary,
        }

    def route_team(self, url: str, title: str) -> str:
        t = (title + " " + url).lower()
        if any(k in t for k in ["transfer", "payment", "payee", "upi"]):
            return "Payments"
        if any(k in t for k in ["loan", "apply", "emi"]):
            return "Loans"
        if any(k in t for k in ["card", "credit", "debit"]):
            return "Cards"
        if any(k in t for k in ["account", "saving", "current", "kyc"]):
            return "Accounts"
        if any(k in t for k in ["login", "signin", "otp", "password"]):
            return "Digital Banking"
        return "Customer Experience"
