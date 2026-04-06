from flask import Blueprint, jsonify, request

from ..services.chat_service import generate_chat_reply

chat_bp = Blueprint("chat", __name__)


@chat_bp.route("/api/ai/chat", methods=["POST"])
def chat():
    data = request.get_json(silent=True) or {}
    user_input = (data.get("content") or "").strip()
    history = data.get("history") or []

    if not user_input:
        return jsonify({"code": 500, "msg": "content 不能为空"}), 400

    try:
        ai_reply = generate_chat_reply(user_input=user_input, history=history)
        return jsonify({"code": 200, "data": ai_reply})
    except Exception as exc:
        return jsonify({"code": 500, "msg": str(exc)}), 500
