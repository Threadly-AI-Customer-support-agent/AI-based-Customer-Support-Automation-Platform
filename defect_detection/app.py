from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image
import io
import os

app = FastAPI(title="Clothing Defect Detection API", version="1.0")

# --- 1. AI Model Setup ---
# We must recreate the exact "empty brain" structure before loading our saved weights
device = torch.device("cpu") # Force CPU since free cloud tiers don't have GPUs

try:
    # Load base ResNet18
    model = models.resnet18(weights=None) 
    
    # Modify the final layer to output 2 classes (Defective vs Not Defective)
    num_ftrs = model.fc.in_features
    model.fc = nn.Linear(num_ftrs, 2)
    
    # Load your trained weights (Make sure you downloaded this from Colab!)
    model_path = "clothing_defect_model.pth"
    if not os.path.exists(model_path):
        print(f"WARNING: '{model_path}' not found. Endpoint will fail until you add it.")
    else:
        model.load_state_dict(torch.load(model_path, map_location=device))
        model.eval() # Set to evaluation mode (turns off training features)
        print("AI Model loaded successfully!")
except Exception as e:
    print(f"Error loading model: {e}")

# --- 2. Image Preprocessing ---
# The AI expects the image to be formatted exactly how it was during training
image_transforms = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

# Map the AI's numerical output (0 or 1) to human-readable text
# NOTE: Ensure this matches the alphabetical folder order from your Colab training!
# Usually, 'defective' comes before 'not_defective' alphabetically.
CLASS_NAMES = ["Defective", "Not Defective"] 

# --- 3. The API Endpoint ---
@app.post("/api/detect-defect")
async def detect_defect(file: UploadFile = File(...)):
    """
    Receives an image file, passes it through the CNN, and returns the defect status.
    """
    # 1. Validate the file is an image
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File uploaded is not an image.")
    
    try:
        # 2. Read the image from the incoming HTTP request
        image_bytes = await file.read()
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        
        # 3. Preprocess the image (resize, normalize) and add a batch dimension
        input_tensor = image_transforms(image).unsqueeze(0).to(device)
        
        # 4. Pass the image through the AI model
        with torch.no_grad(): # Don't calculate gradients (saves memory)
            outputs = model(input_tensor)
            _, predicted_idx = torch.max(outputs, 1)
            
        # 5. Get the final text result
        result_class = CLASS_NAMES[predicted_idx.item()]
        
        return JSONResponse(content={
            "filename": file.filename,
            "prediction": result_class,
            "confidence_scores": outputs.tolist()[0] # Optional: raw math scores
        })

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")

# --- 4. Health Check Endpoint ---
@app.get("/")
def health_check():
    return {"status": "online", "service": "Defect Detection CNN"}