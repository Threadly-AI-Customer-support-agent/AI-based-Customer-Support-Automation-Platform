import whisper
import os
import torch

# Check if NVIDIA GPU is available, otherwise use CPU
device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"Loading Whisper Model on {device}...")

# Load model once. "base" is best for dev; use "small" for better accuracy later.
model = whisper.load_model("base", device=device)
print("Whisper Model Loaded.")

def transcribe_file(file_path):
    if not os.path.exists(file_path):
        return "Error: File not found."

    try:
        # The actual AI inference
        result = model.transcribe(file_path, fp16=False)
        return result["text"].strip()
    except Exception as e:
        return f"Error: {str(e)}"