"""
ResNet模型定义 - 从torchvision导入并修改分类头
"""

import torch
import torch.nn as nn
from torchvision import models
from typing import Optional
import os
import sys

# sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config.config import Config


class ResNetClassifier(nn.Module):
    """
    ResNet分类器
    支持resnet18/34/50/101/152，不使用预训练权重
    """
    
    def __init__(self, config: Config):
        super(ResNetClassifier, self).__init__()
        
        self.config = config
        self.model_name = config.MODEL_NAME
        self.num_classes = config.NUM_CLASSES
        
        # 获取基础模型（无预训练权重）
        model_func = getattr(models, self.model_name)
        self.resnet_model = model_func(weights=None)
        
        # 获取原始特征维度
        if self.model_name in ['resnet18', 'resnet34']:
            in_features = self.resnet_model.fc.in_features  # 512
        else:  # resnet50/101/152
            in_features = self.resnet_model.fc.in_features  # 2048
        
        # 替换分类头
        self.resnet_model.fc = nn.Linear(in_features, self.num_classes)
        
        # 初始化权重
        self._initialize_weights()
    
    def _initialize_weights(self):
        """初始化模型权重"""
        for m in self.modules():
            if isinstance(m, nn.Conv2d):
                nn.init.kaiming_normal_(m.weight, mode='fan_out', nonlinearity='relu')
                if m.bias is not None:
                    nn.init.constant_(m.bias, 0)
            elif isinstance(m, nn.BatchNorm2d):
                nn.init.constant_(m.weight, 1)
                nn.init.constant_(m.bias, 0)
            elif isinstance(m, nn.Linear):
                nn.init.normal_(m.weight, 0, 0.01)
                nn.init.constant_(m.bias, 0)
    
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.resnet_model(x)
    
    def get_model_info(self) -> dict:
        """获取模型信息"""
        total_params = sum(p.numel() for p in self.parameters())
        trainable_params = sum(p.numel() for p in self.parameters() if p.requires_grad)
        
        return {
            "model_name": self.model_name,
            "num_classes": self.num_classes,
            "total_params": f"{total_params/1e6:.2f}M",
            "trainable_params": f"{trainable_params/1e6:.2f}M"
        }


def build_model(config: Config) -> ResNetClassifier:
    """构建模型并移至设备"""
    model = ResNetClassifier(config)
    device = torch.device(config.DEVICE if torch.cuda.is_available() else "cpu")
    model = model.to(device)
    
    # 打印模型信息
    info = model.get_model_info()
    print(f"Model: {info['model_name']}")
    print(f"Parameters: {info['total_params']} (trainable: {info['trainable_params']})")
    
    return model


def load_checkpoint(model: nn.Module, checkpoint_path: str, device: str = "cuda") -> dict:
    """
    加载模型检查点
    Returns:
        checkpoint信息字典
    """
    device = torch.device(device if torch.cuda.is_available() else "cpu")
    checkpoint = torch.load(checkpoint_path, map_location=device)
    
    if 'model_state_dict' in checkpoint:
        model.load_state_dict(checkpoint['model_state_dict'])
        return {
            'epoch': checkpoint.get('epoch', 0),
            'best_acc': checkpoint.get('best_acc', 0.0),
            'config': checkpoint.get('config', {})
        }
    else:
        # 纯权重文件
        model.load_state_dict(checkpoint)
        return {'epoch': 0, 'best_acc': 0.0, 'config': {}}

if __name__ == '__main__':
    co = Config()
    model = build_model(co)
    print(model)