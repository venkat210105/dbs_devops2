from fastapi import FastAPI
from pydantic import BaseModel
from transformers import pipeline

app = FastAPI(title="Sentiment Analysis Service")

# Load sentiment-analysis pipeline
sentiment_analyzer = pipeline(
    "sentiment-analysis",
    model="cardiffnlp/twitter-roberta-base-sentiment-latest"
)

# Map model labels to readable names
LABEL_MAPPING = {
    "LABEL_0": "NEGATIVE",
    "LABEL_1": "NEUTRAL",
    "LABEL_2": "POSITIVE"
}

# Request model
class SentimentRequest(BaseModel):
    text: str

# Response model
class SentimentResponse(BaseModel):
    label: str
    score: float
    topic: str

@app.get("/health")
def health():
    return {"status": "healthy", "service": "ml-service"}

@app.post("/analyze", response_model=SentimentResponse)
def analyze_sentiment(request: SentimentRequest):
    text = request.text.strip()
    if not text:
        return SentimentResponse(label="UNKNOWN", score=0.0, topic="general")

    result = sentiment_analyzer(text)[0]
    label = LABEL_MAPPING.get(result["label"], result["label"])
    score = float(result["score"])

    # Simple topic extraction
    topic_keywords = {
        "billing": ["invoice", "bill", "payment", "charge", "refund"],
        "support": ["help", "support", "agent", "customer", "service"],
        "app": ["app", "mobile", "website", "login", "crash", "slow"],
        "delivery": ["delivery", "ship", "order", "tracking", "delay"],
        "technical": ["error", "bug", "issue", "problem", "fix"]
    }
    detected_topic = "general"
    lowered = text.lower()
    for topic, keywords in topic_keywords.items():
        if any(word in lowered for word in keywords):
            detected_topic = topic
            break

    return SentimentResponse(label=label, score=score, topic=detected_topic)
