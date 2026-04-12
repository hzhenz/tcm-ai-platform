import json
import os
import threading
from io import BytesIO
from typing import Any, Dict, Optional

from PIL import Image


DEFAULT_SYSTEM_PROMPT = """你是一位资深的中医舌诊专家，拥有20年临床经验。你的任务是通过分析用户上传的舌头图片，进行专业的舌象辨证分析。

【分析维度】
1. 舌色：淡红、淡白、红、绛、紫、青等
2. 舌形：老嫩、胖大、瘦薄、点刺、裂纹、齿痕等
3. 苔质：薄厚、润燥、腻腐、剥脱等
4. 苔色：白、黄、灰黑等
5. 舌神：荣枯、灵动、僵硬等

【输出规范】
- 必须基于图片实际观察，客观描述
- 每项特征给出置信度（0-100%）
- 最后给出中医辨证结论和健康建议
- 输出格式为结构化JSON

【安全约束】
- 仅提供中医舌诊分析，不做西医诊断
- 建议用户症状严重时就医检查"""

DEFAULT_USER_PROMPT = """请对这张舌头图片进行详细分析：

【要求】
1. 识别舌象特征（舌色、舌形、苔质、苔色、舌神）
2. 标记异常区域位置（如有齿痕、裂纹、斑点，请描述大致位置）
3. 给出中医辨证结论（如湿热内蕴、气血两虚等）
4. 提供调理建议（饮食、作息、穴位按摩等）

【输出格式】
请以JSON格式输出，包含以下字段：
- tongue_color: {value: "舌色", confidence: 置信度, description: "描述"}
- tongue_shape: {features: [{name: "特征名", present: true/false, location: "位置", confidence: 置信度}]}
- coating_quality: {value: "苔质", confidence: 置信度}
- coating_color: {value: "苔色", confidence: 置信度}
- vitality: {value: "舌神", confidence: 置信度}
- syndrome: {conclusion: "辨证结论", confidence: 置信度}
- suggestions: [{type: "饮食/作息/穴位", content: "具体建议"}]
- warning: "如有严重异常，提示就医"""

SIMPLE_PROMPT = "请分析这张舌头图片的舌象特征，简要说明舌色、舌苔情况以及可能的健康问题。用中文回答。"


class QwenTongueDiagnosis:
    def __init__(self):
        try:
            import torch  # pylint: disable=import-outside-toplevel
            from transformers import AutoModelForImageTextToText, AutoProcessor  # pylint: disable=import-outside-toplevel
            from qwen_vl_utils import process_vision_info  # pylint: disable=import-outside-toplevel
        except Exception as exc:
            raise RuntimeError(
                "缺少舌诊依赖，请先安装 requirements.txt 中依赖（transformers/qwen-vl-utils/accelerate）"
            ) from exc

        self.torch = torch
        self.process_vision_info = process_vision_info

        model_name = os.getenv("TCM_TONGUE_MODEL_NAME", "Qwen/Qwen3-VL-2B-Instruct")
        cache_dir = os.getenv("TCM_TONGUE_MODEL_CACHE_DIR") or None
        local_files_only = os.getenv("TCM_TONGUE_LOCAL_FILES_ONLY", "false").lower() in {"1", "true", "yes"}
        if local_files_only:
            os.environ.setdefault("HF_HUB_OFFLINE", "1")
            os.environ.setdefault("TRANSFORMERS_OFFLINE", "1")

        use_cuda = self.torch.cuda.is_available()

        self.processor = AutoProcessor.from_pretrained(
            model_name,
            cache_dir=cache_dir,
            trust_remote_code=True,
            local_files_only=local_files_only,
        )
        self.model = AutoModelForImageTextToText.from_pretrained(
            model_name,
            cache_dir=cache_dir,
            trust_remote_code=True,
            torch_dtype=self.torch.float16 if use_cuda else self.torch.float32,
            device_map="auto" if use_cuda else None,
            low_cpu_mem_usage=False,
            local_files_only=local_files_only,
        )
        if not use_cuda:
            self.model.to("cpu")
        self.device = next(self.model.parameters()).device

    def _build_messages(self, image_input: Image.Image, custom_prompt: Optional[str], simple: bool) -> list:
        user_prompt = SIMPLE_PROMPT if simple else (custom_prompt or DEFAULT_USER_PROMPT)
        return [
            {"role": "system", "content": DEFAULT_SYSTEM_PROMPT},
            {
                "role": "user",
                "content": [
                    {"type": "image", "image": image_input},
                    {"type": "text", "text": user_prompt},
                ],
            },
        ]

    def analyze(self, image: Image.Image, custom_prompt: Optional[str] = None, simple: bool = False, max_new_tokens: int = 512) -> Dict[str, Any]:
        messages = self._build_messages(image, custom_prompt, simple)
        text = self.processor.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
        image_inputs, video_inputs = self.process_vision_info(messages)

        inputs = self.processor(
            text=[text],
            images=image_inputs,
            videos=video_inputs,
            padding=True,
            return_tensors="pt",
        )
        inputs = inputs.to(self.device)

        with self.torch.no_grad():
            generated_ids = self.model.generate(
                **inputs,
                max_new_tokens=max_new_tokens,
                do_sample=False,
            )

        generated_ids_trimmed = [
            out_ids[len(in_ids):] for in_ids, out_ids in zip(inputs["input_ids"], generated_ids)
        ]
        output_text = self.processor.batch_decode(
            generated_ids_trimmed,
            skip_special_tokens=True,
            clean_up_tokenization_spaces=False,
        )[0]

        parsed = self._parse_json(output_text)
        if parsed is None:
            return {
                "parsed": False,
                "raw_output": output_text,
                "syndrome": {"conclusion": output_text[:120], "confidence": None},
                "suggestions": [],
            }

        parsed["parsed"] = True
        parsed["raw_output"] = output_text
        return parsed

    def _parse_json(self, text: str) -> Optional[Dict[str, Any]]:
        json_start = text.find("{")
        json_end = text.rfind("}") + 1
        if json_start == -1 or json_end <= json_start:
            return None
        json_str = text[json_start:json_end]
        try:
            loaded = json.loads(json_str)
            if isinstance(loaded, dict):
                return loaded
            return None
        except json.JSONDecodeError:
            return None


_runtime: Optional[QwenTongueDiagnosis] = None
_runtime_lock = threading.Lock()


def get_runtime() -> QwenTongueDiagnosis:
    global _runtime
    if _runtime is None:
        with _runtime_lock:
            if _runtime is None:
                _runtime = QwenTongueDiagnosis()
    return _runtime


def analyze_tongue_from_bytes(image_bytes: bytes, filename: str, custom_prompt: Optional[str], simple: bool) -> Dict[str, Any]:
    runtime = get_runtime()
    image = Image.open(BytesIO(image_bytes)).convert("RGB")
    default_tokens = int(os.getenv("TCM_TONGUE_MAX_NEW_TOKENS", "512"))
    simple_tokens = int(os.getenv("TCM_TONGUE_SIMPLE_MAX_NEW_TOKENS", "420"))
    max_new_tokens = simple_tokens if simple else default_tokens

    result = runtime.analyze(
        image=image,
        custom_prompt=custom_prompt,
        simple=simple,
        max_new_tokens=max_new_tokens,
    )
    result["filename"] = filename
    return result
