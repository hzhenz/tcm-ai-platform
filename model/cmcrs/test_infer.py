from engine.inferance import predict_single_image
from models.resnet import ResNetClassifier, build_model
from config.config import Config
import torch

config = Config()
img_path = '/17039/lvqi/4ccompetition/cmcrs/data/test/半夏.jpg'
pth_path = '/17039/lvqi/4ccompetition/cmcrs/checkpoints/exp_20260401_151034/best.pth'
model = build_model(config)
model.load_state_dict(torch.load(pth_path)["model_state_dict"])
predict_single_image(model,img_path, config.idx_to_class, config.DEVICE, config.IMAGE_SIZE)