# tcm-ai-platform

本仓库包含一个“中医 AI 平台”的前端、后端与 AI 服务原型：

- 前端：Vue 3 + Vite + Element Plus（含问诊、舌诊、药材识别、科普/经络 3D 等页面）
- 后端：Spring Boot + JPA + MySQL（目前主要支撑“问诊记录”读写）
- AI 服务：Flask + RAG（Chroma + Embeddings）+ DeepSeek（用于生成问诊回复）

## 架构分析

详细的前后端逻辑、模块职责、接口链路与风险点已整理在：

- docs/ARCHITECTURE.md
