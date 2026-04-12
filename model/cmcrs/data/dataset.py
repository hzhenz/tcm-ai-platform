# -*- coding:utf-8 -*-
"""
@file name  : dataset.py
@author     : LQ
@date       : 2026/03/28
@brief      : 数据加载模块 - 处理数据预处理和DataLoader创建
"""

import torch
from torch.utils.data import DataLoader
from torchvision import datasets, transforms
from typing import Dict, Tuple, Optional
from pathlib import Path
import os
from torch.utils.data import Dataset
from PIL import Image
from config.config import Config


class DataTransforms:
    """数据预处理类"""
    
    def __init__(self, config: Config):
        self.config = config
        self.image_size = config.IMAGE_SIZE

    
    def get_train_transforms(self) -> transforms.Compose:
        """训练集数据增强"""
        transform_list = [
            transforms.Resize((self.image_size, self.image_size)),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225]
            )
        ]

        return transforms.Compose(transform_list)
    
    def get_val_transforms(self) -> transforms.Compose:
        """验证/测试集预处理（无增强）"""
        return transforms.Compose([
            transforms.Resize((self.image_size, self.image_size)),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225]
            )
        ])




class ChineseMedicineImageDataset(Dataset):
    def __init__(self, root_dir, transform=None):
        self.root_dir = root_dir
        self.transform = transform
        self.images = [f for f in os.listdir(root_dir) if f.endswith(('.jpg', '.jpeg', '.png'))]
        self.classes = sorted(set([os.path.splitext(f)[0] for f in self.images]))
        self.class_to_idx = {cls: i for i, cls in enumerate(self.classes)}
        self.idx_to_class = {v: k for k, v in self.class_to_idx.items()} 

    def __len__(self):
        return len(self.images)

    def __getitem__(self, idx):
        img_name = self.images[idx]
        img_path = os.path.join(self.root_dir, img_name)
        image = Image.open(img_path).convert('RGB')
        label = self.class_to_idx[os.path.splitext(img_name)[0]]

        if self.transform:
            image = self.transform(image)

        return image, label

train_ds = ChineseMedicineImageDataset(Config().USING_DATA_DIR, DataTransforms(Config()).get_train_transforms())
train_dataloader = DataLoader(train_ds,batch_size=Config().BATCH_SIZE,shuffle=True)