# TCM-AI 平台架构文档（概览版）

更新时间：2026-04-08（全项目增量复扫 + 文档一致性修订）

## 文档定位

本文件用于 5-10 分钟快速理解当前项目的真实架构、联调方式与主要风险。

1. 概览版：README.md（本文件）
2. 详细版：docs/ARCHITECTURE.md（完整扫描分析与证据）

---

## 1. 系统全景

当前仓库由 4 个核心子系统组成：

1. tcm-ai-frontend（Vue 3 前端）
2. tcm-ai-backend（Spring Boot 后端）
3. Traditional Chinese Medicine expert（Flask AI 服务）
4. model/cmcrs（PyTorch 模型与推理资产）

辅助内容：

- docs（架构与分析文档）
- 数据库.sql、数据库2.txt（数据库脚本）

---

## 2. 当前真实架构（2026-04-08 核验）

主调用链已稳定为“前端仅访问 Java 网关”：

1. 前端 -> Java 后端（8080）
2. Java 后端 -> Python AI 服务（5000）
3. Java 后端 -> MySQL（认证、问诊记录、Agent 任务）
4. Python AI 服务 -> Chroma + DeepSeek（问诊/工具规划）与 ResNet（药材识别）

网关与能力接口：

- POST /api/ai/chat
- POST /api/herb/identify
- POST /api/agent/brain/turn
- GET /api/agent/brain/progress
- POST /api/agent/tasks/create
- GET /api/agent/tasks
- GET /api/agent/tasks/{id}
- POST /api/agent/tasks/{id}/approve

---

## 3. 运行时拓扑与启动顺序

本地联调通常包含 4 个进程：

1. MySQL
2. Python AI 服务（5000）
3. Java 后端（8080）
4. 前端 Vite（5173）

推荐启动顺序：

1. MySQL
2. Python AI
3. Java 后端
4. 前端

---

## 4. 子系统现状

### 4.1 前端（tcm-ai-frontend）

已确认：

1. API 统一基于 VITE_JAVA_API_BASE_URL（chat/herb/agent）。
2. 根组件已挂载 <AgentButlerBubble />，Agent 入口全站常驻。
3. 问诊、药材识别、任务中心、Agent 大脑链路可在代码中定位。

待完善：

1. src/api/tongue.js 文件存在但为空，舌诊后端闭环仍缺失。

### 4.2 后端（tcm-ai-backend）

已确认：

1. Security 基线为“/api/auth/** 放行，其他鉴权”。
2. AiGatewayService 统一转发 chat/herb/tool-plan（HttpClient + JSON）。
3. AgentPythonAutomationBridge 已落地 ProcessBuilder 调用与 UTF-8/GBK 输出兼容解析。

待优化：

1. CORS 仍为 *，且 CSRF 关闭，生产边界需收紧。
2. application.properties 仍保留 MyBatis 遗留配置项。

### 4.3 Python AI 服务（Traditional Chinese Medicine expert）

已确认：

1. ai_server.py 为薄入口，能力由 server 分层承载。
2. 路由面包含 /api/ai/chat、/api/ai/tool-plan、/api/herb/identify。
3. chat_service.py 含 RAG + DeepSeek 调用逻辑。

风险：

1. chat_service.py 仍包含 API Key 默认值兜底。

### 4.4 模型模块（model/cmcrs）

已确认：

1. best.pth、config、models、engine 主链文件齐备。
2. 运行时通过 model_runtime.py 加载权重并返回 top-k 结果。

---

## 5. 本轮代码验真结论（2026-04-08）

1. 前端 src 范围未发现业务直连 http://localhost:5000，仍统一走 Java 网关。
2. Agent 任务中心与 Agent 大脑双链路共存，且由同一后端体系承接。
3. 自动挂号执行链为真实子进程桥接：Java ProcessBuilder -> Python 脚本 -> 单行 JSON 回读。
4. 对支付/拨号/短信类诉求，Agent 会明确拒绝，不伪造成功。
5. 服药提醒链路为“前端本地保存 + .ics 导出 + 低风险任务记录”，后端侧执行结果当前仍以模拟语义为主（非外部平台实接）。
6. 数据库脚本当前仅显式覆盖 app_user 与 consultation_log；agent_task 继续依赖 JPA ddl-auto=update 自动建表。

---

## 6. 主要风险优先级

### P0（立即处理）

1. 敏感信息明文/默认值：DB 密码、JWT 密钥、管理员密码、DeepSeek API Key 默认值。
2. 安全边界偏宽：CORS 允许 * 且 CSRF 禁用。

### P1（近期处理）

1. 舌诊后端接口闭环缺失（前端页面已存在）。
2. agent_task 缺少显式 SQL DDL，环境迁移依赖运行期自动建表。
3. 自动化脚本路径依赖相对路径与运行目录，部署环境需额外校验。

### P2（持续治理）

1. Python 依赖未锁定精确版本。
2. 可观测性不足（缺少跨层 trace 与结构化日志）。

---

## 7. 快速联调建议

1. 准备 Python 环境并安装 Traditional Chinese Medicine expert/requirements.txt。
2. 启动 Python 服务：运行 ai_server.py（默认 5000）。
3. 启动 Java 后端：tcm-ai-backend（默认 8080）。
4. 启动前端：tcm-ai-frontend（默认 5173）。
5. 登录后执行冒烟测试：
   - 问诊发送消息（/api/ai/chat）
   - 药材图片识别（/api/herb/identify）
   - Agent 大脑对话与任务中心审批流（/api/agent/brain/* + /api/agent/tasks/*）

---

## 8. 模块规模快照（2026-04-08）

统计口径：基于仓库当前文件系统实测。

1. tcm-ai-frontend/src：60 个文件（其中常用前端代码文件约 49 个）。
2. tcm-ai-backend/src/main/java：41 个 Java 文件。
3. Traditional Chinese Medicine expert/server：29 个文件（其中 Python 文件 7 个）。
4. model/cmcrs：20 个文件（其中 Python 文件 14 个）。

说明：此前文档中的“model/cmcrs 约 388 文件”与当前仓库实态不一致，已修正。

---

## 9. 关键文件导航

前端：

- tcm-ai-frontend/src/App.vue
- tcm-ai-frontend/src/api/chat.js
- tcm-ai-frontend/src/api/herb.js
- tcm-ai-frontend/src/api/agent.js
- tcm-ai-frontend/src/api/tongue.js
- tcm-ai-frontend/src/components/AgentButlerBubble.vue
- tcm-ai-frontend/src/components/agent-butler/composables/useAgentReminder.js

后端：

- tcm-ai-backend/src/main/java/com/example/tcm_ai_backend/config/SecurityConfig.java
- tcm-ai-backend/src/main/java/com/example/tcm_ai_backend/controller/AiGatewayController.java
- tcm-ai-backend/src/main/java/com/example/tcm_ai_backend/controller/AgentTaskController.java
- tcm-ai-backend/src/main/java/com/example/tcm_ai_backend/controller/AgentBrainController.java
- tcm-ai-backend/src/main/java/com/example/tcm_ai_backend/service/AiGatewayService.java
- tcm-ai-backend/src/main/java/com/example/tcm_ai_backend/service/AgentBrainService.java
- tcm-ai-backend/src/main/java/com/example/tcm_ai_backend/service/AgentPythonAutomationBridge.java
- tcm-ai-backend/src/main/resources/application.properties

Python AI 与模型：

- Traditional Chinese Medicine expert/ai_server.py
- Traditional Chinese Medicine expert/server/__init__.py
- Traditional Chinese Medicine expert/server/routes/chat.py
- Traditional Chinese Medicine expert/server/routes/herb.py
- Traditional Chinese Medicine expert/server/services/chat_service.py
- Traditional Chinese Medicine expert/server/services/herb_service.py
- Traditional Chinese Medicine expert/server/services/model_runtime.py
- model/cmcrs/best.pth
- model/cmcrs/config/config.py

---

## 10. 变更记录

1. 2026-04-08：完成全项目增量复扫；修正模块规模统计口径与过期数字；同步 Agent 大脑/任务链路现状。
2. 2026-04-08：补充可证据化风险项（明文配置、安全边界、舌诊闭环、数据库演进）。
3. 2026-04-06：完成“前端 -> Java 网关 -> Python AI”架构升级后的首轮文档归档。
