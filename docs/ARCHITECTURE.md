# TCM-AI 平台全项目扫描与分析报告（详细版）

扫描日期：2026 年 4 月 6 日  
扫描范围：当前仓库全量代码与文档（仅读取）

## 文档导航

1. 概览版架构文档：README.md
2. 详细版全量分析：docs/ARCHITECTURE.md（本文件）

---

## 1. 项目概览

本仓库是一个中医智能平台原型，采用前后端分离，并引入独立 Python AI 服务与视觉模型模块。当前可识别的子系统如下：

1. tcm-ai-frontend：Vue 3 前端应用，承载问诊、舌诊、药材识别、科普等页面。
2. tcm-ai-backend：Spring Boot 后端，当前重点实现用户认证与问诊记录管理。
3. Traditional Chinese Medicine expert：Flask AI 服务，负责问诊回复生成（RAG + 大模型）。
4. model/cmcrs：PyTorch 模型训练与推理代码（ResNet 体系）。
5. docs：架构文档。
6. 数据库.sql、数据库2.txt：数据库初始化与迁移脚本。

---

## 2. 顶层结构与职责

### 2.1 目录职责映射

- tcm-ai-frontend
  - 技术栈：Vue 3、Vite、Element Plus、Three.js。
  - 主要职责：Web UI、问诊交互、舌象上传、3D 科普展示。
  - 核心入口：src/main.js、src/router/index.js。

- tcm-ai-backend
  - 技术栈：Spring Boot、Spring Security、JPA、MySQL、JWT。
  - 主要职责：认证授权、问诊记录持久化、基础业务 API。
  - 核心入口：src/main/java/com/example/tcm_ai_backend/TcmAiBackendApplication.java。

- Traditional Chinese Medicine expert
  - 技术栈：Flask、Chroma、LangChain、OpenAI SDK（对接 DeepSeek）。
  - 主要职责：智能问诊文本生成与知识检索增强。
  - 核心入口：ai_server.py。

- model/cmcrs
  - 技术栈：PyTorch、TorchVision。
  - 主要职责：图像分类模型训练、验证与推理。
  - 核心入口：engine/trainer.py、engine/inferance.py。

---

## 3. 技术栈与关键实现

### 3.1 前端（tcm-ai-frontend）

已确认要点：

1. 依赖覆盖了页面交互、动效、3D 与导出能力（例如 Element Plus、Three.js、AOS、jsPDF、html2canvas）。
2. 路由已覆盖首页、问诊、舌诊、药材识别、科普、登录注册、个人中心等核心页面。
3. Vite 代理将 /api 代理到本地 Java 服务（默认 8080）。
4. 同时存在 Java API 与 Python AI 服务双地址配置，前端存在直接访问 Python 服务的调用路径。

### 3.2 后端（tcm-ai-backend）

已确认要点：

1. 采用标准分层：controller、service、entity、security 等。
2. 提供注册/登录与 JWT 认证链路。
3. 问诊记录接口支持保存、历史查询、删除。
4. 数据层以 JPA 为主，但配置中存在 MyBatis 遗留项。

### 3.3 AI 服务（Traditional Chinese Medicine expert）

已确认要点：

1. 提供 /api/ai/chat 接口。
2. 调用流程为：接收用户输入 -> 检索 Chroma 知识 -> 组织提示词 -> 请求大模型生成回复。
3. 数据来源包含 tcm_knowledge_db.json 与 super_tcm_db.json。

### 3.4 视觉模型（model/cmcrs）

已确认要点：

1. 支持 ResNet18/34/50/101/152。
2. 训练与推理脚本齐备，具备数据集加载、训练、学习率调度、早停等基础能力。
3. 命名上存在 inferance.py（拼写问题），但不影响理解。

---

## 4. 系统调用链分析

### 4.1 问诊主链路（已确认）

1. 用户在前端输入症状与问题。
2. 前端向 AI 服务发送聊天请求，获得回复。
3. 前端通过 Java 后端保存与查询问诊记录。
4. Java 后端将记录存入 MySQL。

当前形态属于“前端双直连”：

- 一条链路连 Java（业务与存储）。
- 一条链路连 Python（生成式 AI）。

### 4.2 用户认证链路（已确认）

1. 注册/登录请求进入 Java 后端。
2. 后端验证凭证并生成 JWT。
3. 前端携带 Bearer Token 调用受保护接口。

### 4.3 舌诊/药材识别链路（部分推断）

1. 页面入口与交互壳已存在。
2. 识别 API 封装文件存在未完成项（chat.js、herb.js 为空）。
3. 模型侧有独立训练/推理代码，但与主业务的线上调用闭环尚不完整。

---

## 5. 主要问题与风险清单

### 5.1 高风险（优先处理）

1. 敏感信息硬编码风险
   - AI 服务代码中存在明文 API Key。
   - 后端配置中存在明文数据库密码与固定 JWT 密钥。
2. 安全边界不一致
   - 前端直接访问 Python AI 服务，不利于统一鉴权、审计、限流与密钥保护。

### 5.2 中风险

1. 功能完整性不足
   - 舌诊与药材识别主流程尚未形成稳定闭环。
   - 前端部分 API 模块为空实现。
2. 可维护性问题
   - 部分命名与目录语义不一致（例如 mapper 实际承载 JPA repository 角色）。
   - Python 包初始化文件存在拼写问题（__init_.py）。
3. 工程一致性问题
   - 配置包含未使用的历史项（MyBatis 配置残留）。
   - 依赖存在可能未使用项，后续可做依赖清理。

### 5.3 低风险

1. 文档深度不足
   - 目前缺少完整部署文档、环境矩阵、接口契约文档。
2. 自动化与测试不足
   - 缺少统一单测/集成测试覆盖目标与 CI 流水线描述。

---

## 6. 现阶段完成度评估

1. 架构形态：已具备“前端 + Java 后端 + Python AI + 模型代码”四层雏形。
2. 核心可用能力：问诊对话与问诊记录管理基本成型。
3. 关键短板：安全治理、功能闭环、统一网关、测试体系。

综合判断：当前项目处于“可演示原型 -> 可交付系统”的过渡阶段。

---

## 7. 分阶段改进建议

### 7.1 短期（1-2 周）

1. 立即移除所有硬编码密钥，改用环境变量。
2. 修复明显命名与空实现问题（__init_.py、chat.js、herb.js）。
3. 补齐 AI 接口错误处理与日志。
4. 清理后端遗留配置，保证技术栈表达一致。

### 7.2 中期（1-2 月）

1. 建立统一 API 网关策略
   - 前端只访问 Java 后端。
   - Java 后端转发/聚合 Python AI 服务。
2. 规范消息协议
   - 为问诊消息结构定义稳定 DTO 或 JSON Schema。
3. 完成舌诊与药材识别业务闭环
   - 上传、推理、结果解释、记录入库、历史追踪。

### 7.3 长期（2-3 月）

1. 引入 CI/CD 与自动化测试（单测、集成测试、接口测试）。
2. 推进容器化部署与配置分环境管理。
3. 完善可观测性（日志聚合、调用链追踪、告警）。

---

## 8. 运行与联调建议

建议采用四进程本地联调：

1. MySQL：初始化数据库脚本。
2. Java 后端：端口 8080。
3. Python AI：端口 5000。
4. 前端 Vite：默认开发端口。

联调重点：

1. 登录后 JWT 是否正确附带到问诊记录接口。
2. AI 回复失败时前端是否有降级提示。
3. 问诊记录序列化结构是否稳定。

---

## 9. 关键文件索引

前端：

- tcm-ai-frontend/src/main.js
- tcm-ai-frontend/src/router/index.js
- tcm-ai-frontend/src/views/Consultation/ConsultationView.vue
- tcm-ai-frontend/src/views/Tongue/TongueView.vue
- tcm-ai-frontend/src/api/chat.js
- tcm-ai-frontend/src/api/herb.js

后端：

- tcm-ai-backend/src/main/java/com/example/tcm_ai_backend/TcmAiBackendApplication.java
- tcm-ai-backend/src/main/java/com/example/tcm_ai_backend/controller/AuthController.java
- tcm-ai-backend/src/main/java/com/example/tcm_ai_backend/controller/ConsultationController.java
- tcm-ai-backend/src/main/resources/application.properties

AI 服务：

- Traditional Chinese Medicine expert/ai_server.py
- Traditional Chinese Medicine expert/super_tcm_db.json
- Traditional Chinese Medicine expert/tcm_knowledge_db.json

模型：

- model/cmcrs/config/config.py
- model/cmcrs/engine/trainer.py
- model/cmcrs/engine/inferance.py
- model/cmcrs/data/dataset.py

文档：

- docs/ARCHITECTURE.md
- README.md
- 数据库.sql
- 数据库2.txt

---

## 10. 结论

该项目已具备较完整的中医 AI 平台原型轮廓，前后端与 AI 服务边界清晰，核心问诊能力可运行。但距离生产级系统仍有关键差距，尤其集中在安全治理、功能闭环与工程化规范。若按本报告中的短中长期路线推进，可较平滑地从“演示型原型”升级到“可运维、可扩展、可审计”的业务系统。
