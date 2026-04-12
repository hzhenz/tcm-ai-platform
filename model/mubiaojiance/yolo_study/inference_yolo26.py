from ultralytics import YOLO
import os

# 1. 加载刚刚训练出的 YOLO 26 模型
model_path = '/17039/lvqi/4ccompetition/mubiaojiance/yolo_study/runs/detect/runs/yolo26_tcm/weights/best.pt'
if not os.path.exists(model_path):
    print("未找到模型文件，请先运行训练脚本！")
    exit()

model = YOLO(model_path)

# 2. 执行推理
# source: 待测图片目录
# save: 核心参数，设为 True 会自动把画好框的图片存入磁盘
# conf: 置信度过滤（0.25 表示只显示 25% 以上把握的结果）
results = model.predict(
    source='/17039/lvqi/4ccompetition/mubiaojiance/yolo_study/test/images/', 
    save=True,           
    project='inference_results', 
    name='yolo26_visualization',
    conf=0.1,
    exist_ok=True,
    line_width=2         # 标注框的线条粗细
)

# 3. 打印详细信息到终端（供服务器排查）
print("\n--- 推理结果清单 ---")
for result in results:
    img_name = os.path.basename(result.path)
    obj_count = len(result.boxes)
    print(f"图片 {img_name}: 检测到 {obj_count} 个药材目标")
    
    # 遍历每个框，输出具体标签
    for box in result.boxes:
        cls_id = int(box.cls[0])
        label_name = model.names[cls_id]
        confidence = float(box.conf[0])
        print(f"   - [{label_name}] 置信度: {confidence:.2f}")

print(f"\n渲染后的图片已全部保存至: inference_results/yolo26_visualization")