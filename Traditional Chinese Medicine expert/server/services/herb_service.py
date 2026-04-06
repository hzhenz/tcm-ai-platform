from .model_runtime import get_runtime


def predict_herb_from_bytes(image_bytes: bytes, filename: str):
    runtime = get_runtime()
    prediction = runtime.predict(image_bytes=image_bytes, top_k=3)
    prediction["filename"] = filename
    return prediction
