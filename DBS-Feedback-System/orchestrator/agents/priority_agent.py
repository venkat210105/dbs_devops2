from typing import Dict, Any, Optional


class PriorityAgent:
    """
    Computes a numeric priority score (0-100) and a discrete priority level
    (LOW/MED/HIGH/CRITICAL) using sentiment, urgency, customer tier, and
    detected reasons. Purely deterministic, no external calls.

    Expected inputs in state (all optional):
    - sentimentLabel: "positive" | "neutral" | "negative"
    - sentimentScore: float in [0, 1] (confidence)
    - urgency: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
    - customerTier or customerProfile.tier: "PLATINUM" | "GOLD" | "SILVER" | ...
    - detectedReason: str (keywords like security/billing/outage)

    Outputs:
    - priorityScore: int (0-100)
    - priorityLevel: str (LOW/MED/HIGH/CRITICAL)
    - priorityReasons: list[str] for observability
    - next: typically "triage"
    """

    def __init__(self):
        pass

    async def run(self, state: Dict[str, Any]) -> Dict[str, Any]:
        reasons: list[str] = []

        label = (state.get("sentimentLabel") or "").lower()
        score = state.get("sentimentScore")
        urgency = (state.get("urgency") or "LOW").upper()

        tier: Optional[str] = None
        if isinstance(state.get("customerProfile"), dict):
            tier = state["customerProfile"].get("tier")
        tier = (state.get("customerTier") or tier or "").upper()

        detected_reason = (state.get("detectedReason") or state.get("triageReason") or "").lower()

        # Sentiment base
        base = 30  # neutral default
        if label == "negative":
            # Higher confidence negative increases severity
            c = float(score) if isinstance(score, (int, float)) else 0.0
            base = 50 + int(round(min(max(c, 0.0), 1.0) * 30))  # 50..80
            reasons.append(f"sentiment:negative({c:.2f})")
        elif label == "positive":
            c = float(score) if isinstance(score, (int, float)) else 0.0
            base = max(0, 10 - int(round(min(max(c, 0.0), 1.0) * 5)))  # ~5..10
            reasons.append(f"sentiment:positive({c:.2f})")
        elif label:
            reasons.append(f"sentiment:{label}")
        else:
            reasons.append("sentiment:unknown")

        # Urgency weights
        urgency_bonus_map = {
            "CRITICAL": 30,
            "HIGH": 20,
            "MEDIUM": 10,
            "LOW": 0,
        }
        u_bonus = urgency_bonus_map.get(urgency, 0)
        if u_bonus:
            reasons.append(f"urgency:{urgency}+{u_bonus}")

        # Customer tier bonus
        tier_bonus_map = {
            "PLATINUM": 20,
            "GOLD": 10,
            "SILVER": 5,
        }
        t_bonus = tier_bonus_map.get(tier or "", 0)
        if t_bonus:
            reasons.append(f"tier:{tier}+{t_bonus}")

        # Sensitive topics bonus
        if any(k in detected_reason for k in ("security", "outage", "billing")):
            reasons.append("topic:sensitive+10")
            t_bonus += 10

        score_total = max(0, min(100, base + u_bonus + t_bonus))

        # Map to levels
        if score_total >= 80:
            level = "CRITICAL"
        elif score_total >= 60:
            level = "HIGH"
        elif score_total >= 30:
            level = "MEDIUM"
        else:
            level = "LOW"

        state["priorityScore"] = int(score_total)
        state["priorityLevel"] = level
        state["priorityReasons"] = reasons
        state["next"] = "triage"
        return state
