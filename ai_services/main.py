from fastapi import FastAPI, File, UploadFile, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv

# Import the logic from your services folder
from services.brain_service import generate_reply
from services.sentiment_service import analyze_text_sentiment
from services.vision_service import analyze_image
from services.voice_service import transcribe_audio

load_dotenv()

app = FastAPI(title="AI Customer Support Microservice")

# --- Pydantic Models for Input Validation ---
class ChatInput(BaseModel):
    message: str
    userId: str

class SentimentInput(BaseModel):
    text: str

# --- 1. The Brain Endpoint (Llama 3) ---
@app.post("/brain/respond")
async def brain_respond(data: ChatInput):
    try:
        reply = await generate_reply(data.message, data.userId)
        return {"reply": reply}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- 2. The Sentiment Endpoint (DistilBERT) ---
@app.post("/sentiment/analyze")
async def sentiment_analyze(data: SentimentInput):
    try:
        result = analyze_text_sentiment(data.text)
        return result # Returns { "label": "...", "score": ... }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- 3. The Vision Endpoint (ResNet18) ---
@app.post("/vision/analyze")
async def vision_analyze(image: UploadFile = File(...)):
    try:
        image_bytes = await image.read()
        result = analyze_image(image_bytes)  # <--- CHANGED HERE
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- 4. The Voice Endpoint (Whisper) ---
@app.post("/voice/transcribe")
async def voice_transcribe(audio: UploadFile = File(...)):
    try:
        audio_bytes = await audio.read()
        result = transcribe_audio(audio_bytes, audio.filename)
        return result # Returns { "text": "..." }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))