"""
可视化工具 - 训练曲线绘制
"""

import matplotlib.pyplot as plt
from pathlib import Path
from typing import Dict

def plot_loss_curve(losses:list,title:str,save_path:str = None):
    """
    功能：绘制并可选保存损失曲线图

    参数:
        losses (list): 每个 epoch 的平均损失
        title (str): 图像标题
        save_path (str or None): 如果提供路径，则保存图像
    """
    plt.figure(figsize=(8,5))
    plt.plot(range(1,len(losses) + 1), losses,marker = 'o')
    plt.title(title)
    plt.xlabel('Epoch')
    plt.ylabel('Loss')
    plt.grid(True)
    plt.tight_layout()
    if save_path:
        plt.savefig(save_path)
        print(f'损失图像已保存至{save_path}')
    plt.close()

def plot_training_curves(history: Dict, save_path: Path = None, show: bool = False):
    """
    绘制训练曲线
    Args:
        history: 包含train_loss, val_loss, train_acc, val_acc的字典
        save_path: 保存路径
        show: 是否显示图像
    """
    epochs = range(1, len(history['train_loss']) + 1)
    
    fig, axes = plt.subplots(2, 2, figsize=(15, 10))
    
    # 损失曲线
    axes[0, 0].plot(epochs, history['train_loss'], 'b-', label='Train Loss', linewidth=2)
    axes[0, 0].plot(epochs, history['val_loss'], 'r-', label='Val Loss', linewidth=2)
    axes[0, 0].set_title('Training & Validation Loss', fontsize=12, fontweight='bold')
    axes[0, 0].set_xlabel('Epoch')
    axes[0, 0].set_ylabel('Loss')
    axes[0, 0].legend()
    axes[0, 0].grid(True, alpha=0.3)
    
    # 准确率曲线
    axes[0, 1].plot(epochs, history['train_acc'], 'b-', label='Train Acc', linewidth=2)
    axes[0, 1].plot(epochs, history['val_acc'], 'r-', label='Val Acc', linewidth=2)
    axes[0, 1].set_title('Training & Validation Accuracy', fontsize=12, fontweight='bold')
    axes[0, 1].set_xlabel('Epoch')
    axes[0, 1].set_ylabel('Accuracy')
    axes[0, 1].legend()
    axes[0, 1].grid(True, alpha=0.3)
    
    # 学习率变化
    if 'lr' in history and history['lr']:
        axes[1, 0].plot(epochs, history['lr'], 'g-', linewidth=2)
        axes[1, 0].set_title('Learning Rate Schedule', fontsize=12, fontweight='bold')
        axes[1, 0].set_xlabel('Epoch')
        axes[1, 0].set_ylabel('Learning Rate')
        axes[1, 0].set_yscale('log')
        axes[1, 0].grid(True, alpha=0.3)
    
    # 综合对比
    ax2 = axes[1, 1]
    ax3 = ax2.twinx()
    
    line1 = ax2.plot(epochs, history['val_loss'], 'b-', label='Val Loss', linewidth=2)
    line2 = ax3.plot(epochs, history['val_acc'], 'r-', label='Val Acc', linewidth=2)
    
    ax2.set_xlabel('Epoch')
    ax2.set_ylabel('Loss', color='b')
    ax3.set_ylabel('Accuracy', color='r')
    ax2.set_title('Validation Loss vs Accuracy', fontsize=12, fontweight='bold')
    ax2.grid(True, alpha=0.3)
    
    lines = line1 + line2
    labels = [l.get_label() for l in lines]
    ax2.legend(lines, labels, loc='center right')
    
    plt.tight_layout()
    
    if save_path:
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        print(f"Training curves saved to {save_path}")
    
    if show:
        plt.show()
    
    plt.close()
