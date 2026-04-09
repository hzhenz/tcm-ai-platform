from io import BytesIO
from pathlib import Path
import os
import sys
from typing import Any, Dict, List, Optional

import torch
from PIL import Image
import torchvision.transforms as transforms


DETECTOR_LABEL_TO_HERB = {
    "BanXia": "半夏",
    "Cangshu": "苍术",
    "ChuanQiong": "川芎",
    "DuZhong": "杜仲",
    "FuLing": "茯苓",
    "HuangLian": "黄连",
    "HuangQi": "黄芪",
    "HuoXiang": "藿香",
    "JinYingZi": "金樱子",
    "JueMingZi": "决明子",
    "LianZiXin": "莲子心",
    "MaiDong": "麦冬",
    "QingHao": "青蒿",
    "SangShenGan": "桑椹干",
    "SangYe": "桑叶",
    "ShanYaoGan": "山药干",
    "ShiHu": "石斛",
    "XiXin": "细辛",
    "XiaKuCao": "夏枯草",
    "YiMi": "薏米",
}


def _resolve_cmcrs_root() -> Path:
    expert_root = Path(__file__).resolve().parents[2]
    repo_root = expert_root.parent
    cmcrs_root = repo_root / "model" / "cmcrs"
    if not cmcrs_root.exists():
        raise RuntimeError(f"cmcrs 模型目录不存在: {cmcrs_root}")
    return cmcrs_root


def _resolve_yolo_root() -> Path:
    expert_root = Path(__file__).resolve().parents[2]
    repo_root = expert_root.parent
    yolo_root = repo_root / "model" / "mubiaojiance" / "yolo_study"
    return yolo_root


def _find_yolo_weights(yolo_root: Path) -> Optional[Path]:
    env_path = os.getenv("TCM_YOLO_WEIGHTS", "").strip()
    if env_path:
        env_weight = Path(env_path)
        if env_weight.exists():
            return env_weight

    direct_candidates = [
        yolo_root.parent / "best.pt",
        yolo_root / "best.pt",
        yolo_root / "weights" / "best.pt",
        yolo_root / "runs" / "detect" / "best.pt",
    ]
    for candidate in direct_candidates:
        if candidate.exists():
            return candidate

    detect_root = yolo_root / "runs" / "detect"
    if not detect_root.exists():
        return None

    best_weights = list(detect_root.glob("**/weights/best.pt"))
    if not best_weights:
        return None

    best_weights.sort(key=lambda path: path.stat().st_mtime, reverse=True)
    return best_weights[0]


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

    def _predict_from_image(self, image: Image.Image, top_k: int = 3) -> Dict[str, Any]:
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

    def predict(self, image_bytes: bytes, top_k: int = 3) -> Dict[str, Any]:
        image = Image.open(BytesIO(image_bytes)).convert("RGB")
        return self._predict_from_image(image=image, top_k=top_k)

    def predict_image(self, image: Image.Image, top_k: int = 3) -> Dict[str, Any]:
        return self._predict_from_image(image=image.convert("RGB"), top_k=top_k)


class HerbDetectionRuntime:
    def __init__(self):
        self.yolo_root = _resolve_yolo_root()
        self.weights_path = _find_yolo_weights(self.yolo_root)
        self.enabled = False
        self.error_message: str = ""
        self.model = None
        self.conf = float(os.getenv("TCM_YOLO_CONF", "0.15"))
        self.iou = float(os.getenv("TCM_YOLO_IOU", "0.45"))
        self.max_det = int(os.getenv("TCM_YOLO_MAX_DET", "20"))

        if not self.yolo_root.exists():
            self.error_message = f"YOLO 模型目录不存在: {self.yolo_root}"
            return
        if not self.weights_path:
            self.error_message = f"未找到 YOLO 权重(best.pt): {self.yolo_root}"
            return

        try:
            from ultralytics import YOLO
        except Exception as exc:
            self.error_message = f"未安装 ultralytics 或导入失败: {exc}"
            return

        try:
            self.model = YOLO(str(self.weights_path))
            self.enabled = True
        except Exception as exc:
            self.error_message = f"YOLO 权重加载失败: {exc}"

    def _resolve_label(self, cls_id: int) -> str:
        names = getattr(self.model, "names", None)
        if isinstance(names, dict):
            return str(names.get(cls_id, cls_id))
        if isinstance(names, list) and 0 <= cls_id < len(names):
            return str(names[cls_id])
        return str(cls_id)

    def detect(self, image: Image.Image) -> List[Dict[str, Any]]:
        if not self.enabled or self.model is None:
            return []

        import numpy as np

        image_rgb = image.convert("RGB")
        image_np = np.array(image_rgb)

        results = self.model.predict(
            source=image_np,
            conf=self.conf,
            iou=self.iou,
            max_det=self.max_det,
            verbose=False,
        )
        if not results:
            return []

        width, height = image_rgb.size
        first_result = results[0]
        boxes = getattr(first_result, "boxes", None)
        if boxes is None:
            return []

        detections: List[Dict[str, Any]] = []
        for idx, box in enumerate(boxes):
            xyxy = box.xyxy[0].tolist()
            cls_id = int(box.cls[0].item())
            det_conf = float(box.conf[0].item())

            x1 = int(max(0, min(width - 1, round(xyxy[0]))))
            y1 = int(max(0, min(height - 1, round(xyxy[1]))))
            x2 = int(max(0, min(width, round(xyxy[2]))))
            y2 = int(max(0, min(height, round(xyxy[3]))))
            if x2 <= x1 or y2 <= y1:
                continue

            detections.append({
                "id": f"det-{idx}",
                "bbox": [x1, y1, x2, y2],
                "detectorClassId": cls_id,
                "detectorLabel": self._resolve_label(cls_id),
                "detectorConfidence": det_conf,
            })

        detections.sort(key=lambda item: item["detectorConfidence"], reverse=True)
        return detections


class HerbFusionRuntime:
    def __init__(self):
        self.classifier = HerbModelRuntime()
        self.detector = HerbDetectionRuntime()
        self.use_detector_name = os.getenv("TCM_USE_DETECTOR_NAME", "1") != "0"
        self.classifier_name_min_conf = float(os.getenv("TCM_CLASSIFIER_NAME_MIN_CONF", "0.72"))

    def _detector_name(self, detector_label: str) -> str:
        mapped = DETECTOR_LABEL_TO_HERB.get(detector_label, "")
        if mapped:
            return mapped
        return detector_label or ""

    def _merge_topk(
        self,
        cls_topk: List[Dict[str, Any]],
        detector_name: str,
        detector_conf: float,
        top_k: int,
    ) -> List[Dict[str, Any]]:
        merged = list(cls_topk)
        if detector_name and all(item.get("name") != detector_name for item in merged):
            merged.insert(0, {
                "name": detector_name,
                "confidence": float(detector_conf),
                "isToxic": detector_name.endswith("_TOX"),
                "source": "detector",
            })
        return merged[:max(1, top_k)]

    def _classify_crop(self, image: Image.Image, bbox: List[int], top_k: int) -> Dict[str, Any]:
        x1, y1, x2, y2 = bbox
        crop = image.crop((x1, y1, x2, y2))
        return self.classifier.predict_image(crop, top_k=top_k)

    def predict(self, image_bytes: bytes, filename: Optional[str] = None, top_k: int = 3) -> Dict[str, Any]:
        image = Image.open(BytesIO(image_bytes)).convert("RGB")

        detections = self.detector.detect(image=image)
        if detections:
            enriched: List[Dict[str, Any]] = []
            for det in detections:
                cls_result = self._classify_crop(image=image, bbox=det["bbox"], top_k=top_k)

                detector_name = self._detector_name(det["detectorLabel"])
                classifier_name = cls_result["herbName"]
                classifier_confidence = float(cls_result["confidence"])
                detector_confidence = float(det["detectorConfidence"])

                prefer_detector_name = (
                    self.use_detector_name
                    and bool(detector_name)
                    and classifier_confidence < self.classifier_name_min_conf
                )

                final_name = detector_name if prefer_detector_name else classifier_name
                final_confidence = detector_confidence if prefer_detector_name else classifier_confidence
                final_is_toxic = final_name.endswith("_TOX") if prefer_detector_name else cls_result["isToxic"]
                merged_topk = self._merge_topk(
                    cls_topk=cls_result["topk"],
                    detector_name=detector_name,
                    detector_conf=detector_confidence,
                    top_k=top_k,
                )

                enriched.append({
                    "id": det["id"],
                    "bbox": det["bbox"],
                    "detectorClassId": det["detectorClassId"],
                    "detectorLabel": det["detectorLabel"],
                    "detectorConfidence": det["detectorConfidence"],
                    "name": final_name,
                    "confidence": final_confidence,
                    "isToxic": final_is_toxic,
                    "topk": merged_topk,
                    "classifierName": classifier_name,
                    "classifierConfidence": classifier_confidence,
                    "fusedBy": "detector" if prefer_detector_name else "classifier",
                })

            enriched.sort(key=lambda item: item["confidence"], reverse=True)
            top1 = enriched[0]

            result: Dict[str, Any] = {
                "herbName": top1["name"],
                "confidence": top1["confidence"],
                "isToxic": top1["isToxic"],
                "topk": top1["topk"],
                "detections": enriched,
                "model": self.classifier.config.MODEL_NAME,
                "classifierModel": self.classifier.config.MODEL_NAME,
                "detectorModel": "yolo",
                "detectorWeight": str(self.detector.weights_path) if self.detector.weights_path else "",
                "imageSize": self.classifier.config.IMAGE_SIZE,
                "fusionMode": "detect+classify",
                "detectorEnabled": True,
                "detectionCount": len(enriched),
                "detectorConfig": {
                    "conf": self.detector.conf,
                    "iou": self.detector.iou,
                    "maxDet": self.detector.max_det,
                },
            }
            if filename:
                result["filename"] = filename
            return result

        fallback = self.classifier.predict_image(image=image, top_k=top_k)
        fallback["fusionMode"] = "classify-only"
        fallback["detectorEnabled"] = self.detector.enabled
        fallback["detectionCount"] = 0
        fallback["detections"] = []
        fallback["detectorWeight"] = str(self.detector.weights_path) if self.detector.weights_path else ""
        fallback["detectorConfig"] = {
            "conf": self.detector.conf,
            "iou": self.detector.iou,
            "maxDet": self.detector.max_det,
        }
        if self.detector.error_message:
            fallback["detectorMessage"] = self.detector.error_message
        if filename:
            fallback["filename"] = filename
        return fallback


_runtime = None
_fusion_runtime = None


def get_runtime() -> HerbModelRuntime:
    global _runtime
    if _runtime is None:
        _runtime = HerbModelRuntime()
    return _runtime


def get_fusion_runtime() -> HerbFusionRuntime:
    global _fusion_runtime
    if _fusion_runtime is None:
        _fusion_runtime = HerbFusionRuntime()
    return _fusion_runtime
