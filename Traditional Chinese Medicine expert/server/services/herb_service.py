from .model_runtime import get_fusion_runtime


def predict_herb_from_bytes(image_bytes: bytes, filename: str):
    runtime = get_fusion_runtime()
    prediction = runtime.predict(image_bytes=image_bytes, filename=filename, top_k=3)
    return prediction
