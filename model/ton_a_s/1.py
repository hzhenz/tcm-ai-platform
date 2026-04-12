import os
import torch
from transformers import AutoProcessor, AutoModelForImageTextToText
from qwen_vl_utils import process_vision_info
import json
from PIL import Image


class QwenTongueDiagnosis:
    def __init__(self, model, processor):
        self.model = model
        self.processor = processor
        # 获取模型实际所在设备（兼容 device_map="auto"）
        self.device = next(model.parameters()).device
        print(f"模型已加载至设备: {self.device}")

        
    def _build_messages(self, image_input, custom_prompt=None):
        """
        image_input: 可以是图片路径字符串，也可以是 PIL.Image 对象
        """
        """构建对话消息"""
        system_prompt = """你是一位资深的中医舌诊专家，拥有20年临床经验。你的任务是通过分析用户上传的舌头图片，进行专业的舌象辨证分析。

【分析维度】
1. 舌色：淡红、淡白、红、绛、紫、青等
2. 舌形：老嫩、胖大、瘦薄、点刺、裂纹、齿痕等  
3. 苔质：薄厚、润燥、腻腐、剥脱等
4. 苔色：白、黄、灰黑等
5. 舌神：荣枯、灵动、僵硬等

【输出规范】
- 必须基于图片实际观察，客观描述
- 每项特征给出置信度（0-100%）
- 最后给出中医辨证结论和健康建议
- 输出格式为结构化JSON

【安全约束】
- 仅提供中医舌诊分析，不做西医诊断
- 建议用户症状严重时就医检查"""

        user_prompt = custom_prompt or """请对这张舌头图片进行详细分析：

【要求】
1. 识别舌象特征（舌色、舌形、苔质、苔色、舌神）
2. 标记异常区域位置（如有齿痕、裂纹、斑点，请描述大致位置）
3. 给出中医辨证结论（如湿热内蕴、气血两虚等）
4. 提供调理建议（饮食、作息、穴位按摩等）

【输出格式】
请以JSON格式输出，包含以下字段：
- tongue_color: {value: "舌色", confidence: 置信度, description: "描述"}
- tongue_shape: {features: [{name: "特征名", present: true/false, location: "位置", confidence: 置信度}]}
- coating_quality: {value: "苔质", confidence: 置信度}
- coating_color: {value: "苔色", confidence: 置信度}
- vitality: {value: "舌神", confidence: 置信度}
- syndrome: {conclusion: "辨证结论", confidence: 置信度}
- suggestions: [{type: "饮食/作息/穴位", content: "具体建议"}]
- warning: "如有严重异常，提示就医" """

        messages = [
            {"role": "system", "content": system_prompt},
            {
                "role": "user",
                "content": [
                    {"type": "image", "image": image_input}, # 直接传递路径或PIL
                    {"type": "text", "text": user_prompt}
                ]
            }
        ]
        return messages


    def analyze(self, image_path_or_pil, custom_prompt=None, max_new_tokens=4096):
        # 1. 直接构建消息（不再手动转 base64）
        messages = self._build_messages(image_path_or_pil, custom_prompt)
        
        # 2. 准备输入
        text = self.processor.apply_chat_template(
            messages, tokenize=False, add_generation_prompt=True
        )
        
        # qwen_vl_utils 会自动处理 PIL 或 路径
        image_inputs, video_inputs = process_vision_info(messages)
        
        inputs = self.processor(
            text=[text],
            images=image_inputs,
            videos=video_inputs,
            padding=True,
            return_tensors="pt",
        )
        
        # 3. 移动输入到模型相同设备
        inputs = inputs.to(self.device)
        
        # 4. 生成 (建议添加更多的生成参数控制)
        with torch.no_grad():
            generated_ids = self.model.generate(
                **inputs,
                max_new_tokens=max_new_tokens,
                do_sample=False, # 舌诊建议关闭采样，追求结论一致性
            )
        
        # 解码输出
        generated_ids_trimmed = [
            out_ids[len(in_ids):] for in_ids, out_ids in zip(inputs['input_ids'], generated_ids)
        ]
        output_text = self.processor.batch_decode(
            generated_ids_trimmed, skip_special_tokens=True, clean_up_tokenization_spaces=False
        )[0]
        
        print("推理完成")
        
        # 尝试解析JSON
        try:
            # 提取JSON部分
            json_start = output_text.find('{')
            json_end = output_text.rfind('}') + 1
            if json_start != -1 and json_end != -1:
                json_str = output_text[json_start:json_end]
                result = json.loads(json_str)
                result['raw_output'] = output_text
                return result
            else:
                return {"raw_output": output_text, "parsed": False}
        except json.JSONDecodeError:
            return {"raw_output": output_text, "parsed": False, "error": "JSON解析失败"}

    def analyze_simple(self, image_path_or_pil):
        """简化版分析，返回纯文本结果"""
        simple_prompt = "请分析这张舌头图片的舌象特征，简要说明舌色、舌苔情况以及可能的健康问题。用中文回答。"
        return self.analyze(image_path_or_pil, custom_prompt=simple_prompt, max_new_tokens=512)

    def batch_analyze(self, image_paths, batch_size=1):
        """批量分析（边缘设备建议单张处理）"""
        results = []
        for i, path in enumerate(image_paths):
            print(f"处理第 {i+1}/{len(image_paths)} 张图片...")
            result = self.analyze(path)
            results.append(result)
        return results


# ==================== 使用示例 ====================

def main():
    """使用示例"""
    model_name = 'Qwen/Qwen3-VL-2B-Instruct'
    cache_dir = '/17039/lvqi/00_steering-vector-project-ing/models'
    processor = AutoProcessor.from_pretrained(model_name,cache_dir = cache_dir,trust_remote_code=True,local_files_only=True)
    model = AutoModelForImageTextToText.from_pretrained(model_name,
                                                        cache_dir = cache_dir,
                                                        trust_remote_code=True,
                                                        torch_dtype=torch.float16,
                                                        device_map="auto",local_files_only=True)
        
    # 1. 标准版本
    analyzer = QwenTongueDiagnosis(model, processor)
    
    # 2. 边缘优化版本（树莓派/Jetson/嵌入式设备）
    # analyzer = EdgeOptimizedQwenTongueDiagnosis(model_size="0.5B", use_quantization=True)
    
    # 分析单张图片
    image_path = "/17039/lvqi/4ccompetition/ton_a_s/tongue_sample.jpg"
    
    # 完整分析
    result = analyzer.analyze(image_path)
    print(json.dumps(result, ensure_ascii=False, indent=2))
    
    # 简化分析（更快）
    # simple_result = analyzer.analyze_simple(image_path)
    # print(simple_result['raw_output'])

if __name__ == "__main__":
    main()

