from io import BytesIO
from pathlib import Path
import sys

import torch
from PIL import Image
import torchvision.transforms as transforms


def _resolve_cmcrs_root() -> Path:
    expert_root = Path(__file__).resolve().parents[2]
    repo_root = expert_root.parent
    cmcrs_root = repo_root / "model" / "cmcrs"
    if not cmcrs_root.exists():
        raise RuntimeError(f"cmcrs 模型目录不存在: {cmcrs_root}")
    return cmcrs_root


CMCRS_ROOT = _resolve_cmcrs_root()
if str(CMCRS_ROOT) not in sys.path:
    sys.path.insert(0, str(CMCRS_ROOT))

from config.config import Config  # noqa: E402
from models.resnet import build_model  # noqa: E402


class HerbModelRuntime:
    def __init__(self):
        self.config = Config()
        self.device = torch.device(self.config.DEVICE if torch.cuda.is_available() else "cpu")
        self.model = build_model(self.config)

        checkpoint_path = CMCRS_ROOT / "best.pth"
        if not checkpoint_path.exists():
            raise RuntimeError(f"未找到模型权重: {checkpoint_path}")

        checkpoint = torch.load(checkpoint_path, map_location=self.device)
        if isinstance(checkpoint, dict) and "model_state_dict" in checkpoint:
            self.model.load_state_dict(checkpoint["model_state_dict"])
        else:
            self.model.load_state_dict(checkpoint)

        self.model.eval()
        self.transform = transforms.Compose([
            transforms.Resize((self.config.IMAGE_SIZE, self.config.IMAGE_SIZE)),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225],
            ),
        ])

    def predict(self, image_bytes: bytes, top_k: int = 3):
        image = Image.open(BytesIO(image_bytes)).convert("RGB")
        input_tensor = self.transform(image).unsqueeze(0).to(self.device)

        with torch.no_grad():
            logits = self.model(input_tensor)
            probs = torch.softmax(logits, dim=1)
            top_probs, top_indices = torch.topk(probs, k=min(top_k, probs.shape[1]), dim=1)

        candidates = []
        for prob, index in zip(top_probs[0].tolist(), top_indices[0].tolist()):
            herb_name = self.config.idx_to_class.get(int(index), str(index))
            candidates.append({
                "name": herb_name,
                "confidence": float(prob),
                "isToxic": herb_name.endswith("_TOX"),
            })

        top1 = candidates[0]
        return {
            "herbName": top1["name"],
            "confidence": top1["confidence"],
            "isToxic": top1["isToxic"],
            "topk": candidates,
            "model": self.config.MODEL_NAME,
            "imageSize": self.config.IMAGE_SIZE,
        }


_runtime = None


def get_runtime() -> HerbModelRuntime:
    global _runtime
    if _runtime is None:
        _runtime = HerbModelRuntime()
    return _runtime
