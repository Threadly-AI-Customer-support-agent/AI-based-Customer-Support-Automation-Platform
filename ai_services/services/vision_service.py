import torch
import torch.nn as nn
from torchvision import models, transforms
from torchvision.transforms import functional as TF
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

# --- Normalization constants (ImageNet) ---
IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD  = [0.229, 0.224, 0.225]

# Base transform — resize to 256 then center-crop to 224 for better feature extraction
base_transform = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize(IMAGENET_MEAN, IMAGENET_STD)
])

CLASS_NAMES = ["Defective", "Not Defective"]


def _build_tta_batch(image: Image.Image) -> torch.Tensor:
    """
    Test-Time Augmentation: create multiple augmented views of the same image.
    Returns a batch tensor of shape (N, 3, 224, 224).
    """
    augmented = []

    # 1. Original (resize 256 → center crop 224)
    augmented.append(base_transform(image))

    # 2. Horizontal flip
    augmented.append(base_transform(TF.hflip(image)))

    # 3. Vertical flip
    augmented.append(base_transform(TF.vflip(image)))

    # 4. Slight rotation (+15°)
    augmented.append(base_transform(TF.rotate(image, 15)))

    # 5. Slight rotation (-15°)
    augmented.append(base_transform(TF.rotate(image, -15)))

    # 6. Zoomed-in center crop (tighter crop to focus on defect area)
    zoomed = transforms.Compose([
        transforms.Resize(300),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize(IMAGENET_MEAN, IMAGENET_STD)
    ])
    augmented.append(zoomed(image))

    # 7. Horizontal flip + slight rotation
    augmented.append(base_transform(TF.rotate(TF.hflip(image), 10)))

    return torch.stack(augmented)  # (7, 3, 224, 224)


def analyze_image(image_bytes: bytes) -> dict:
    """
    Analyze an image for clothing defects using Test-Time Augmentation (TTA).
    Runs 7 augmented views through the model and averages predictions
    for higher confidence on genuine defects.
    """
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

    # Build augmented batch
    tta_batch = _build_tta_batch(image).to(device)

    with torch.no_grad():
        # Forward pass on all augmented views at once
        outputs = model(tta_batch)                    # (7, 2)
        probabilities = F.softmax(outputs, dim=1)     # (7, 2)

        # Average predictions across all augmented views
        avg_probs = probabilities.mean(dim=0)         # (2,)
        predicted_idx = torch.argmax(avg_probs).item()

    defect_status = CLASS_NAMES[predicted_idx]
    chosen_confidence = round(avg_probs[predicted_idx].item(), 2)

    print(f"[TTA Vision] {defect_status} | confidence={chosen_confidence} | per-view={[round(p[predicted_idx].item(),2) for p in probabilities]}")

    return {
        "defect": defect_status,
        "confidence": chosen_confidence
    }