from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import shutil
import os
from transcriber import transcribe_file

app = FastAPI()

# --- 1. ENABLE CORS (Crucial for Frontend Integration) ---
# This allows your React/Vue app (usually on localhost:3000) 
# to send requests to this backend (on localhost:8000).
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all frontends. Change to ["http://localhost:3000"] for stricter security later.
    allow_credentials=True,
    allow_methods=["*"],  # Allows GET, POST, OPTIONS, etc.
    allow_headers=["*"],
)

# Configuration
UPLOAD_DIR = "temp_audio"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.post("/transcribe/")
async def api_transcribe(file: UploadFile = File(...)):
    """
    Universal Endpoint: Accepts an audio file from ANY frontend,
    transcribes it, and returns standard JSON.
    """
    try:
        # 1. Generate a safe file path
        safe_filename = file.filename.replace(" ", "_")
        file_location = os.path.join(UPLOAD_DIR, safe_filename)
        
        # 2. Save the incoming file locally
        with open(file_location, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # 3. Process with AI
        transcribed_text = transcribe_file(file_location)

        # 5. Return Standard JSON Response
        return {
            "status": "success",
            "filename": safe_filename,
            "transcription": transcribed_text
        }

    except Exception as e:
        # Returns a 500 error that the frontend can catch and display
        raise HTTPException(status_code=500, detail=str(e))

# Run with: c