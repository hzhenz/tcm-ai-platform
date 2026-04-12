from config.config import Config
from models.resnet import build_model
from data.dataset import DataTransforms, ChineseMedicineImageDataset, train_ds,train_dataloader
from utils import logger

config = Config()

print(config.USING_DATA_DIR)

model = build_model(config)
# print(model)

# trans = DataTransforms(config)
# transform = trans.get_train_transforms()
# print(transform)

# ds = ChineseMedicineImageDataset(config.USING_DATA_DIR, transform)
# print(ds.idx_to_class)
# # print(ds.class_to_idx)
img, l = train_ds[0]
# l = ds.idx_to_class[l]
# print(img, l)

print(l)

logger = logger.setup_logger('test', '/17039/lvqi/4ccompetition/cmcrs/logs/log')
logger.info('Nihao')
# for idx, ds in enumerate(train_dataloader):
#     img,l = ds
#     print(img.shape)
#     print(l.shape)

from engine.trainer import Trainer

a = Trainer(model,train_dataloader,config)
a.train()