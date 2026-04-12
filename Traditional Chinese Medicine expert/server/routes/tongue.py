import base64

from flask import Blueprint, jsonify, request

from ..services.tongue_service import analyze_tongue_from_bytes


tongue_bp = Blueprint("tongue", __name__)


@tongue_bp.route("/api/tongue/health", methods=["GET"])
def tongue_health():
    return jsonify({"code": 200, "data": {"service": "tongue", "status": "ok"}})


@tongue_bp.route("/api/tongue/analyze", methods=["POST"])
def analyze_tongue():
    # Supports JSON(base64) and multipart upload for flexibility.
    custom_prompt = None
    simple = False

    if request.files and "image" in request.files:
        file_storage = request.files["image"]
        filename = file_storage.filename or "tongue.jpg"
        image_bytes = file_storage.read()
        custom_prompt = request.form.get("customPrompt")
        simple = str(request.form.get("simple", "false")).lower() in {"1", "true", "yes"}
    else:
        data = request.get_json(silent=True) or {}
        image_b64 = data.get("imageBase64")
        filename = data.get("filename") or "tongue.jpg"
        custom_prompt = data.get("customPrompt")
        simple = bool(data.get("simple", False))

        if not image_b64:
            return jsonify({"code": 500, "msg": "imageBase64 不能为空"}), 400

        try:
            image_bytes = base64.b64decode(image_b64)
        except Exception:
            return jsonify({"code": 500, "msg": "imageBase64 非法"}), 400

    if not image_bytes:
        return jsonify({"code": 500, "msg": "图片内容为空"}), 400

    try:
        result = analyze_tongue_from_bytes(
            image_bytes=image_bytes,
            filename=filename,
            custom_prompt=custom_prompt,
            simple=simple,
        )
        return jsonify({"code": 200, "data": result})
    except Exception as exc:
        return jsonify({"code": 500, "msg": str(exc)}), 500
