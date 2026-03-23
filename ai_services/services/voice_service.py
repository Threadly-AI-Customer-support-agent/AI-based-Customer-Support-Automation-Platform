import whisper
import tempfile
import os

print("Loading Whisper Model (Base)...")
# "base" is a good balance of speed and accuracy. You can change to "tiny" for speed.
whisper_model = whisper.load_model("base")

def transcribe_audio(audio_bytes: bytes, filename: str) -> dict:
    """
    Whisper expects a file path, so we temporarily save the uploaded bytes to disk,
    transcribe it, and then delete the temp file.
    """
    # Create a temporary file to hold the audio
    extension = os.path.splitext(filename)[1] or ".wav"
    
    with tempfile.NamedTemporaryFile(delete=False, suffix=extension) as temp_audio:
        temp_audio.write(audio_bytes)
        temp_audio_path = temp_audio.name

    try:
        # Transcribe the audio file
        result = whisper_model.transcribe(temp_audio_path)
        transcribed_text = result["text"].strip()
        
        return {"text": transcribed_text}
    finally:
        # Clean up the temporary file immediately after
        if os.path.exists(temp_audio_path):
            os.remove(temp_audio_path)