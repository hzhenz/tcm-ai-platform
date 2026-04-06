import base64

from flask import Blueprint, jsonify, request

from ..services.herb_service import predict_herb_from_bytes

herb_bp = Blueprint("herb", __name__)


@herb_bp.route("/api/herb/identify", methods=["POST"])
def identify_herb():
    # Supports either JSON(base64) payload or direct multipart upload.
    if request.files and "image" in request.files:
        file_storage = request.files["image"]
        filename = file_storage.filename or "image.jpg"
        image_bytes = file_storage.read()
    else:
        data = request.get_json(silent=True) or {}
        image_b64 = data.get("imageBase64")
        filename = data.get("filename") or "image.jpg"
        if not image_b64:
            return jsonify({"code": 500, "msg": "imageBase64 不能为空"}), 400
        try:
            image_bytes = base64.b64decode(image_b64)
        except Exception:
            return jsonify({"code": 500, "msg": "imageBase64 非法"}), 400

    if not image_bytes:
        return jsonify({"code": 500, "msg": "图片内容为空"}), 400

    try:
        result = predict_herb_from_bytes(image_bytes=image_bytes, filename=filename)
        return jsonify({"code": 200, "data": result})
    except Exception as exc:
        return jsonify({"code": 500, "msg": str(exc)}), 500
