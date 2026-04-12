"""
训练引擎 - 封装训练循环、优化器、学习率调度
"""

import torch
import torch.nn as nn
import torch.optim as optim
from tqdm import tqdm
from typing import Dict, Tuple
from pathlib import Path
import time
import matplotlib.pyplot as plt

from config.config import Config
from models.resnet import ResNetClassifier
from utils.logger import setup_logger


class Trainer:
    """训练管理器"""
    
    def __init__(self, 
                 model: ResNetClassifier, 
                 dataloader: torch.utils.data.DataLoader,
                 config: Config,
                 exp_name: str = None):
        
        self.model = model
        self.dataloader = dataloader
        # self.dataset_sizes = dataset_sizes
        self.config = config
        self.device = self.config.DEVICE
        self.model = model.to(self.device)
        # 实验目录
        timestamp = time.strftime("%Y%m%d_%H%M%S")
        self.exp_name = exp_name or f"exp_{timestamp}"
        self.exp_dir = config.CHECKPOINT_DIR / self.exp_name
        self.exp_dir.mkdir(parents=True, exist_ok=True)
        
        # 日志
        self.logger = setup_logger("trainer", self.exp_dir / "train.log")
        self.logger.info(f"Experiment: {self.exp_name}")
        self.logger.info(f"Config: {config.__dict__}")
        
        # 损失函数
        self.criterion = nn.CrossEntropyLoss()
        
        # 优化器
        self.optimizer = optim.SGD(
            model.parameters(),
            lr=config.LEARNING_RATE,
            momentum=config.MOMENTUM,
            weight_decay=config.WEIGHT_DECAY
        )
        
        # 学习率调度器
        self.scheduler = self._build_scheduler()
        
        # 训练状态
        self.current_epoch = 0
        self.best_acc = 0.0
        self.best_loss = float('inf')
        self.early_stop_counter = 0
        
        # 训练历史
        self.history = {
            'train_loss': [], 'train_acc': [],
            'lr': []
        }
        
        self.logger.info("Trainer initialized")
    
    def _build_scheduler(self):
        """构建学习率调度器"""
        if self.config.LR_SCHEDULER == "step":
            return optim.lr_scheduler.StepLR(
                self.optimizer, 
                step_size=self.config.LR_STEP_SIZE,
                gamma=self.config.LR_GAMMA
            )
        elif self.config.LR_SCHEDULER == "plateau":
            return optim.lr_scheduler.ReduceLROnPlateau(
                self.optimizer, mode='min', factor=0.1, patience=5
            )
        elif self.config.LR_SCHEDULER == "cosine":
            return optim.lr_scheduler.CosineAnnealingLR(
                self.optimizer, T_max=self.config.NUM_EPOCHS
            )
        else:
            return None
    
    def train_epoch(self) -> Tuple[float, float, list]:
        self.model.train()

        running_loss = 0.0
        running_corrects = 0
        processed_samples = 0

        all_losses = []

        pbar = tqdm(
            self.dataloader,
            desc=f"train Epoch {self.current_epoch+1}/{self.config.NUM_EPOCHS}",
            ncols=100
        )

        for batch_idx, (inputs, labels) in enumerate(pbar):
            inputs = inputs.to(self.device)
            labels = labels.to(self.device)

            batch_size = inputs.size(0)

            # 前向
            outputs = self.model(inputs)
            _, preds = torch.max(outputs, 1)
            loss = self.criterion(outputs, labels)

            # 反向
            self.optimizer.zero_grad()
            loss.backward()
            self.optimizer.step()

            # 统计
            running_loss += loss.item() * batch_size
            running_corrects += torch.sum(preds == labels)
            processed_samples += batch_size

            all_losses.append(loss.item())

            # 更新进度条
            if (batch_idx + 1) % self.config.PRINT_FREQ == 0:
                current_loss = running_loss / processed_samples
                current_acc = running_corrects.double() / processed_samples

                pbar.set_postfix({
                    'loss': f'{current_loss:.4f}',
                    'acc': f'{current_acc:.4f}'
                })

        dataset_size = len(self.dataloader.dataset)

        epoch_loss = running_loss / dataset_size
        epoch_acc = running_corrects.double() / dataset_size

        return epoch_loss, epoch_acc.item(), all_losses
    
    def train(self):
        """完整训练流程"""

        train_loss_history = []
        train_acc_history = []

        for epoch in range(self.config.NUM_EPOCHS):
            self.current_epoch = epoch

            # ====== 单轮训练 ======
            epoch_loss, epoch_acc, batch_losses = self.train_epoch()

            train_loss_history.append(epoch_loss)
            train_acc_history.append(epoch_acc)

            # ====== 打印日志 ======
            self.logger.info(
                f"[Epoch {epoch+1}/{self.config.NUM_EPOCHS}] "
                f"Loss: {epoch_loss:.4f} | Acc: {epoch_acc:.4f}"
            )

            # ====== 保存模型 ======
            save_path = f"{self.exp_dir}/best.pth"

            torch.save({
                "epoch": epoch + 1,
                "model_state_dict": self.model.state_dict(),
                "optimizer_state_dict": self.optimizer.state_dict(),
                "loss": epoch_loss,
                "acc": epoch_acc
            }, save_path)

        print("Training Finished!")

        # ====== 可视化 ======
        self.plot_training_curve(train_loss_history, train_acc_history)
                
    def plot_training_curve(self, loss_history, acc_history):
        epochs = range(1, len(loss_history) + 1)

        plt.figure(figsize=(12, 5))

        # ===== Loss =====
        plt.subplot(1, 2, 1)
        plt.plot(epochs, loss_history, marker='o')
        plt.title("Training Loss")
        plt.xlabel("Epoch")
        plt.ylabel("Loss")
        plt.grid()

        # ===== Accuracy =====
        plt.subplot(1, 2, 2)
        plt.plot(epochs, acc_history, marker='o')
        plt.title("Training Accuracy")
        plt.xlabel("Epoch")
        plt.ylabel("Accuracy")
        plt.grid()

        plt.tight_layout()
        plt.savefig(f'{self.exp_dir}/training_loss.png')            
    


