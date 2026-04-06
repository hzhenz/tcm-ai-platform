# TCM-AI 平台架构文档（概览版）

更新时间：2026-04-06

## 文档定位

本文件用于快速理解项目架构，面向 5-10 分钟阅读。

1. 概览版：README.md（本文件）
2. 详细版：docs/ARCHITECTURE.md（全项目扫描与分析报告）

---

## 1. 系统全景

仓库由 4 个核心子系统组成：

1. tcm-ai-frontend（Vue 3 前端）
2. tcm-ai-backend（Spring Boot 后端）
3. Traditional Chinese Medicine expert（Flask AI 服务）
4. model/cmcrs（PyTorch 模型训练与推理）

此外包含：

- docs（文档）
- 数据库.sql、数据库2.txt（数据库脚本）

---

## 2. 运行时拓扑

本地联调通常包含 4 个进程：

1. MySQL（数据持久化）
2. Java 后端（默认 8080）
3. Python AI 服务（默认 5000）
4. 前端 Vite 开发服务（默认 5173）

典型调用关系：

- 前端 -> Java 后端：认证、问诊历史读写
- 前端 -> Python AI：问诊回复生成
- Java 后端 -> MySQL：用户与问诊记录存储
- Python AI -> Chroma + 大模型：检索增强与生成

说明：当前是“前端双直连”模式（同时连 Java 与 Python）。

---

## 3. 子系统职责

### 3.1 前端（tcm-ai-frontend）

主要职责：

- 用户交互与页面流程
- 问诊会话、历史展示、报告导出
- 舌诊与药材识别页面承载
- 科普与 3D 可视化展示

关键入口：

- src/main.js
- src/router/index.js
- src/views/Consultation/ConsultationView.vue

关键特征：

- 支持 VITE_JAVA_API_BASE_URL / VITE_PYTHON_AI_BASE_URL
- 路由覆盖首页、问诊、舌诊、药材识别、科普、认证、个人中心

### 3.2 后端（tcm-ai-backend）

主要职责：

- 用户注册/登录与 JWT 鉴权
- 问诊记录的保存、查询、删除
- 统一业务返回体与异常处理

关键入口：

- src/main/java/com/example/tcm_ai_backend/TcmAiBackendApplication.java
- src/main/java/com/example/tcm_ai_backend/controller/AuthController.java
- src/main/java/com/example/tcm_ai_backend/controller/ConsultationController.java

关键特征：

- 分层清晰：controller/service/entity/mapper/security
- 持久化采用 JPA
- SecurityContext 注入当前登录用户上下文

### 3.3 AI 服务（Traditional Chinese Medicine expert）

主要职责：

- 提供问诊回复 API
- 结合本地知识库检索结果增强大模型回答

关键入口：

- ai_server.py

关键特征：

- 对外接口：POST /api/ai/chat
- 本地向量库：tcm_chroma_db
- 知识源：super_tcm_db.json、tcm_knowledge_db.json

### 3.4 模型模块（model/cmcrs）

主要职责：

- 图像分类训练（ResNet 系列）
- 模型推理能力验证

关键入口：

- engine/trainer.py
- engine/inferance.py
- config/config.py

当前状态：

- 训练与推理代码独立存在
- 与主业务在线推理链路尚未完全打通

---

## 4. 核心业务链路

### 4.1 问诊链路（已确认）

1. 用户在前端发送症状文本
2. 前端调用 Python AI 获取回复
3. 前端调用 Java 后端写入/读取问诊记录
4. Java 后端将记录落库到 MySQL

### 4.2 认证链路（已确认）

1. 前端调用 /api/auth/register 或 /api/auth/login
2. 后端返回 JWT
3. 前端携带 Bearer Token 访问受保护接口

### 4.3 舌诊/药材识别链路（部分推断）

1. 前端页面与交互框架已存在
2. API 封装与后端集成仍待补全
3. 模型侧能力已具备，但线上编排未完成

---

## 5. 架构现状评估

优势：

1. 前后端职责边界基本清晰
2. 认证、问诊存储、AI 生成三条主能力已成型
3. 模块拆分具备后续扩展基础

主要风险：

1. 安全风险
   - 存在敏感信息硬编码风险（需迁移到环境变量）
2. 一致性风险
   - 前端双直连导致鉴权、审计、限流策略不统一
3. 完整性风险
   - 舌诊与药材识别未完成闭环
4. 维护性风险
   - 部分命名与空实现文件增加理解成本

---

## 6. 推荐演进路线

短期（1-2 周）：

1. 密钥与密码全部改为环境变量
2. 修复明显命名问题与空实现文件
3. 增强 AI 接口异常处理与日志
4. 清理遗留配置项，降低认知负担

中期（1-2 月）：

1. 建立统一网关策略（前端仅访问 Java）
2. Java 聚合转发 Python AI 请求
3. 定义消息协议（DTO 或 JSON Schema）
4. 打通舌诊/药材识别端到端闭环

长期（2-3 月）：

1. 引入 CI/CD 与自动化测试体系
2. 推进容器化与分环境配置
3. 加强可观测性（日志、链路、告警）

---

## 7. 联调与排障建议

启动顺序建议：

1. MySQL
2. Java 后端
3. Python AI 服务
4. 前端 Vite

联调检查项：

1. JWT 是否在问诊相关请求中正确附带
2. AI 异常时是否有可见的前端降级提示
3. 问诊 messages 序列化结构是否稳定
4. 跨服务地址是否全部由环境变量控制

---

## 8. 关键文件导航

前端：

- tcm-ai-frontend/src/main.js
- tcm-ai-frontend/src/router/index.js
- tcm-ai-frontend/src/views/Consultation/ConsultationView.vue
- tcm-ai-frontend/src/views/Tongue/TongueView.vue

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

数据库：

- 数据库.sql
- 数据库2.txt

---

## 9. 变更记录

- 2026-04-06：概览版文档迁移至 README.md，与详细版（docs/ARCHITECTURE.md）完成位置交换。
