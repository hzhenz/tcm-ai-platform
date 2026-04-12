from ultralytics import YOLO

# 1. 加载 YOLO 26 预训练模型
model = YOLO('/17039/lvqi/4ccompetition/mubiaojiance/yolov8n.pt') 

# 2. 启动训练
results = model.train(
    data='data.yaml',       # 指向你之前创建的 yaml 文件
    epochs=1000,              # 初步学习建议 50 轮
    imgsz=1280,              # 虽然原图大，但 640 是权衡性能的最佳推理尺寸
    batch=1,                # 只有 5 张图，batch 设为 1
    device=0,               # 指定 GPU 编号，若无 GPU 可设为 'cpu'
    project='runs',    # 结果根目录
    name='yolo26_tcm',      # 本次实验名称
    exist_ok=True,          # 覆盖同名文件夹
    plots=True,              # 即使无界面，也会在后台生成 Loss 曲线图
# --- 核心过拟合修改项 ---
    mosaic=0.0,              # 关闭马赛克增强
    augment=False,           # 关闭基础图像增强
    mixup=0.0,               # 关闭混合增强
    copy_paste=0.0,          # 关闭复制粘贴增强
    hsv_h=0.0,               # 关闭色调变化
    hsv_s=0.0,               # 关闭饱和度变化
    hsv_v=0.0,               # 关闭明度变化
    degrees=0.0,             # 关闭旋转
    translate=0.0,           # 关闭平移
    scale=0.0,               # 关闭缩放
    shear=0.0,               # 关闭剪切
    perspective=0.0,         # 关闭透视变化
    flipud=0.0,              # 关闭上下翻转
    fliplr=0.0,              # 关闭左右翻转
    
    # --- 加速收敛参数 ---
    lr0=0.001,                # 保持一个相对积极的学习率
    warmup_epochs=0,         # 去掉预热阶段，直接开始记忆
)

print("训练完成！最佳权重已保存至: runs/train/yolo26_tcm/weights/best.pt")