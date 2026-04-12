import torch
from PIL import Image
import torchvision.transforms as transforms

def predict_single_image(
    model,
    image_path,
    idx_to_class,
    device="cpu",
    image_size=224
):
    model.eval()
    model.to(device)

    # ===== 图像预处理（需与你训练一致）=====
    transform = transforms.Compose([
        transforms.Resize((image_size, image_size)),
        transforms.ToTensor(),
        transforms.Normalize(
            mean=[0.485, 0.456, 0.406],   # ImageNet 标准
            std=[0.229, 0.224, 0.225]
        )
    ])

    # ===== 读取图片 =====
    image = Image.open(image_path).convert("RGB")
    input_tensor = transform(image).unsqueeze(0).to(device)  # shape: [1, C, H, W]

    # ===== 推理 =====
    with torch.no_grad():
        outputs = model(input_tensor)
        probs = torch.softmax(outputs, dim=1)

        top_prob, top_idx = torch.max(probs, dim=1)

    # ===== 映射类别 =====
    pred_idx = top_idx.item()
    pred_class = idx_to_class[pred_idx]
    confidence = top_prob.item()

    print(pred_class)

    return pred_class, confidence