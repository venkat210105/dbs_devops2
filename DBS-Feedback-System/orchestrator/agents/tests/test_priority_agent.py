import asyncio
import pytest

from orchestrator.agents.priority_agent import PriorityAgent


@pytest.mark.asyncio
async def test_priority_negative_critical():
    agent = PriorityAgent()
    state = {
        "sentimentLabel": "negative",
        "sentimentScore": 0.9,
        "urgency": "CRITICAL",
        "customerTier": "PLATINUM",
    }
    out = await agent.run(state)
    assert out["priorityLevel"] in ("CRITICAL", "HIGH")
    assert 70 <= out["priorityScore"] <= 100


@pytest.mark.asyncio
async def test_priority_missing_defaults():
    agent = PriorityAgent()
    state = {}
    out = await agent.run(state)
    assert out["priorityLevel"] in ("LOW", "MEDIUM")
    assert 0 <= out["priorityScore"] <= 100
