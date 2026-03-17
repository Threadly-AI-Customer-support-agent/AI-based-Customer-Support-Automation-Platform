import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image
import io
import os
import torch.nn.functional as F

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Rebuild the model architecture
model = models.resnet18(weights=None)
num_ftrs = model.fc.in_features
model.fc = nn.Linear(num_ftrs, 2)
model = model.to(device)

# Load your weights
MODEL_PATH = "models/clothing_defect_model.pth"
if os.path.exists(MODEL_PATH):
    model.load_state_dict(torch.load(MODEL_PATH, map_location=device))
    model.eval()
    print("Vision Model loaded successfully.")
else:
    print(f"WARNING: {MODEL_PATH} missing. Vision endpoint will fail.")

# Preprocessing to match your training script
image_transforms = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

CLASS_NAMES = ["Defective", "Not Defective"]

def analyze_image(image_bytes: bytes) -> dict:
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    input_tensor = image_transforms(image).unsqueeze(0).to(device)
    
    with torch.no_grad():
        outputs = model(input_tensor)
        probabilities = F.softmax(outputs, dim=1)
        confidence_scores = probabilities[0].tolist()
        _, predicted_idx = torch.max(outputs, 1)
        
    defect_status = CLASS_NAMES[predicted_idx.item()]
    
    # Teammate wants { "defect": "...", "confidence": 0.0-1.0 }
    # Let's return the confidence of the chosen prediction
    chosen_confidence = round(confidence_scores[predicted_idx.item()], 2)
    
    return {
        "defect": defect_status,
        "confidence": chosen_confidence
    }