from flask import Flask
from flask_cors import CORS


def create_app() -> Flask:
    app = Flask(__name__)
    CORS(app)

    # Lazy import to avoid app crash if optional route dependencies are missing.
    from .routes.chat import chat_bp
    from .routes.herb import herb_bp

    app.register_blueprint(chat_bp)
    app.register_blueprint(herb_bp)

    try:
        from .routes.tongue import tongue_bp
        app.register_blueprint(tongue_bp)
    except Exception as exc:  # pragma: no cover - startup guard
        app.logger.warning("tongue route load failed: %s", exc)

    return app
