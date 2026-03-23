from transformers import pipeline

# Load the Hugging Face sentiment model (downloads automatically on first run)
print("Loading Sentiment Model...")
sentiment_pipeline = pipeline("sentiment-analysis", model="distilbert-base-uncased-finetuned-sst-2-english")

def analyze_text_sentiment(text: str) -> dict:
    """Analyzes text and returns sentiment label and score."""
    result = sentiment_pipeline(text)[0]
    
    # Format the output to match what your teammate requested
    label = result['label'] # Usually "POSITIVE" or "NEGATIVE"
    score = round(result['score'], 2)
    
    return {"label": label, "score": score}