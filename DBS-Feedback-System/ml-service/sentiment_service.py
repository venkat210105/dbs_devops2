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

@app.post("/analyze", response_model=SentimentResponse)
def analyze_sentiment(request: SentimentRequest):
    text = request.text.strip()
    if not text:
        return SentimentResponse(label="UNKNOWN", score=0.0)

    result = sentiment_analyzer(text)[0]
    label = LABEL_MAPPING.get(result["label"], result["label"])
    score = float(result["score"])

    return SentimentResponse(label=label, score=score)
