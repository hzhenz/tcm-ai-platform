# TCM-AI 平台全项目扫描与分析报告（详细版）

扫描日期：2026-04-09（增量复扫）  
扫描范围：仓库全量代码、配置、数据库脚本、前后端与 Python 联调路径、文档一致性

## 文档导航

1. 概览版：README.md
2. 详细版：docs/ARCHITECTURE.md（本文件）

---

## 1. 扫描方法与口径

### 1.1 本轮扫描方式

1. 代码检索：前端 API 基址、后端 Controller/Service、Python 路由、敏感配置键。
2. 关键文件核读：Security、AI 网关、Agent 大脑、Agent 自动化桥接、chat_service、数据库脚本。
3. 规模统计：按目录文件总数 + 代码文件子口径双重统计。

### 1.2 统计口径说明

1. 目录文件数采用文件系统实时计数。
2. Python server 同时给出“全部文件数”和“仅 .py 文件数”。
3. 与历史文档不一致时，以本轮代码实测为准。

---

## 2. 扫描结论摘要

### 2.1 一体化结论

1. 主架构稳定：前端对服务端仅访问 Java 网关，Java 统一转发 Python AI 服务；另有可选 OpenClaw 本地代理链路用于本地自动化演示。
2. Agent 能力稳定：任务中心（V1）+ 统一大脑（V2）并存。
3. 自动挂号链路真实：Java ProcessBuilder 启动 Python 脚本，解析单行 JSON 结果。
4. 舌诊仍未闭环：前端页面存在且可演示（本地存储/报告生成），但后端/API 未形成同构链路，当前未接入 Java/Python。
5. 安全与配置仍是首要治理点：明文/默认密钥、宽 CORS、CSRF 禁用。

### 2.2 本轮确认事实

1. 前端 src 范围未发现业务直连 http://localhost:5000。
2. src/App.vue 已全局挂载 AgentButlerBubble。
3. 数据库.sql 与 数据库2.txt 仅显式维护 app_user、consultation_log。
4. app.agent.python.booking-mode 当前值为 selenium-visible。
5. src/api/tongue.js 仍为空文件。
6. AgentButlerBubble 存在 OpenClaw 本地代理接入：默认健康检查 http://127.0.0.1:18789/health，WebSocket ws://127.0.0.1:18789/tcm。

---

## 3. 当前真实架构

### 3.1 逻辑拓扑

1. 前端（Vue） -> Java 后端（8080）。
2. Java 后端 -> Python AI 服务（5000）与 MySQL。
3. Python AI 服务 -> Chroma 向量库 + DeepSeek + ResNet 推理。

补充（可选本地链路，不经过服务端）：

4. 前端 -> OpenClaw 本地代理（127.0.0.1:18789）-> 用户本地浏览器（用于挂号自动化演示；失败回退服务端任务中心）。

### 3.2 网关与转发关系

1. POST /api/ai/chat -> Java AiGatewayController -> Python /api/ai/chat。
2. POST /api/herb/identify -> Java AiGatewayController -> Python /api/herb/identify。
3. POST /api/agent/brain/turn -> Java AgentBrainService -> Python /api/ai/tool-plan（工具规划，可回退本地规则）。
4. 任务中心相关接口由 Java 本地持久化与执行调度承接。

补充：Java 后端还承接用户业务接口（非 AI 网关）。

1. POST /api/auth/register、POST /api/auth/login（放行）。
2. GET /api/consultation/history、POST /api/consultation/save、DELETE /api/consultation/delete/{id}（鉴权）。

---

## 4. 子系统详细分析

### 4.1 前端（tcm-ai-frontend）

#### 已落地

1. API 封装模块：src/api/chat.js、src/api/herb.js、src/api/agent.js。
2. 问诊、药材识别均通过 VITE_JAVA_API_BASE_URL 访问 Java。
3. Agent 入口常驻：src/App.vue 挂载 <AgentButlerBubble />。
4. 服药提醒链路可执行：站内本地存储 + .ics 导出 + 低风险任务写入。
5. 可选 OpenClaw 本地代理：当本地代理就绪时，挂号可优先走本地浏览器自动化；失败回退服务端任务中心。

#### 待完善

1. 舌诊当前为前端本地页面演示（TongueView.vue 内固定示例结果 + 本地存储），src/api/tongue.js 为空文件；后端链路未接通。

### 4.2 后端（tcm-ai-backend）

#### 已落地

1. 控制器分组清晰：Auth、Consultation、AiGateway、AgentTask、AgentBrain。
2. AiGatewayService 统一承接 chat/herb/tool-plan 的 Python 转发。
3. AgentTaskService 实现风险分级审批：LOW 自动执行，MEDIUM/HIGH 需审批。
4. AgentPythonAutomationBridge 支持：
   - python -X utf8 调用
   - 超时终止
   - UTF-8/GBK 输出兼容解码
   - 末行 JSON 扫描回读

#### 安全基线现状

1. /api/auth/** 放行，其余接口要求鉴权。
2. CORS 为允许 *，CSRF 禁用，属于演示友好配置。

### 4.3 Python AI 服务（Traditional Chinese Medicine expert）

#### 已落地

1. 薄入口：ai_server.py 仅做 create_app 启动。
2. 路由分层：
   - /api/ai/chat
   - /api/ai/tool-plan
   - /api/herb/identify
3. 服务分层：chat_service.py、herb_service.py、model_runtime.py。

#### 风险点

1. chat_service.py 中 OpenAI 客户端仍包含 DEEPSEEK_API_KEY 默认值兜底。

### 4.4 模型（model/cmcrs）

1. 权重与主链文件齐备：best.pth、config、models、engine。
2. model_runtime.py 已接入权重加载和 top-k 推理输出。

---

## 5. Agent 专题核验

### 5.1 任务中心（V1）

接口：

1. POST /api/agent/tasks/create
2. GET /api/agent/tasks
3. GET /api/agent/tasks/{id}
4. POST /api/agent/tasks/{id}/approve

状态机：

1. PENDING_APPROVAL
2. APPROVED
3. RUNNING
4. SUCCESS
5. FAILED
6. CANCELLED

执行语义：

1. HOSPITAL_BOOKING：真实调用 Python 自动化桥接。
2. 其他 taskType（如 MEDICATION_REMINDER/FOLLOWUP_REMINDER）：当前以后端模拟执行语义为主。

### 5.2 统一大脑（V2）

接口：

1. POST /api/agent/brain/turn
2. GET /api/agent/brain/progress

核心流程：

1. Java 优先调用 /api/ai/tool-plan 进行工具规划。
2. 规划失败或置信不足时回退本地规则。
3. 自动挂号可走“直接自动执行”或“创建高风险任务待审批”。
4. 支付/拨号/短信类诉求明确拒绝，不伪造成功。

---

## 6. 联调状态与差距

### 6.1 已打通链路

1. 登录鉴权（JWT）。
2. 问诊网关链路（/api/ai/chat）。
3. 药材识别网关链路（/api/herb/identify）。
4. Agent 任务中心与统一大脑主流程。

### 6.2 未闭环链路

1. 舌诊：前端页面完备且可演示，但缺少 Java Controller/Service 与 Python Route 对应实现（目前不产生服务端数据闭环）。

---

## 7. 风险证据快照（代码级）

### 7.1 P0 风险

1. 明文/默认敏感配置：
   - spring.datasource.password
   - jwt.secret
   - app.admin.password
   - DEEPSEEK_API_KEY 默认值兜底
2. 安全边界偏宽：
   - SecurityConfig 中 setAllowedOriginPatterns("*")
   - csrf.disable()

### 7.2 P1 风险

1. 舌诊后端链路缺失（src/api/tongue.js 为空）。
2. agent_task 无显式 SQL DDL（依赖 ddl-auto=update）。
3. 自动化脚本路径依赖运行目录与相对路径（部署敏感）。

### 7.3 P2 风险

1. Python requirements 未锁定精确版本。
2. 缺少跨层链路追踪与结构化日志。

---

## 8. 模块规模快照（2026-04-09）

### 8.1 全文件口径

1. tcm-ai-frontend/src：68
2. tcm-ai-backend/src/main/java：41
3. Traditional Chinese Medicine expert/server：29
4. model/cmcrs：20

### 8.2 代码文件口径

1. 前端常用代码文件（.js/.vue/.css/.md）：57
2. 后端 Java（.java）：41
3. Python server（.py）：7
4. model/cmcrs（.py）：14

说明：历史文档中“model/cmcrs 约 388 文件”与当前仓库不一致，已在本轮修正。

---

## 9. 推荐动作（按优先级）

### 9.1 短期（1-2 周）

1. P0：敏感配置环境变量化，移除默认密钥兜底。
2. P0：收紧 CORS 白名单并评估 CSRF 策略。
3. P1：补齐舌诊后端接口与网关路径。
4. P1：数据库脚本新增 agent_task 显式 DDL。

### 9.2 中期（1-2 月）

1. 为 AI 网关增加重试/熔断/降级策略。
2. 为 auth/chat/herb/agent 增加集成测试。
3. 增加结构化日志与基础监控。

### 9.3 长期（2-3 月）

1. 容器化与分环境部署（dev/test/prod）。
2. 密钥托管与轮换（Vault/云密管）。
3. 模型服务化标准能力（健康检查、版本管理、灰度发布）。

---

## 10. 关键文件索引

前端：

- tcm-ai-frontend/src/App.vue
- tcm-ai-frontend/src/api/chat.js
- tcm-ai-frontend/src/api/herb.js
- tcm-ai-frontend/src/api/agent.js
- tcm-ai-frontend/src/api/openclaw-protocol.js
- tcm-ai-frontend/src/api/tongue.js
- tcm-ai-frontend/src/components/AgentButlerBubble.vue
- tcm-ai-frontend/src/components/agent-butler/composables/useOpenClaw.js
- tcm-ai-frontend/src/views/Tongue/TongueView.vue
- tcm-ai-frontend/src/components/agent-butler/composables/useAgentReminder.js

后端：

- tcm-ai-backend/src/main/java/com/example/tcm_ai_backend/config/SecurityConfig.java
- tcm-ai-backend/src/main/java/com/example/tcm_ai_backend/controller/AiGatewayController.java
- tcm-ai-backend/src/main/java/com/example/tcm_ai_backend/controller/AgentTaskController.java
- tcm-ai-backend/src/main/java/com/example/tcm_ai_backend/controller/AgentBrainController.java
- tcm-ai-backend/src/main/java/com/example/tcm_ai_backend/service/AiGatewayService.java
- tcm-ai-backend/src/main/java/com/example/tcm_ai_backend/service/AgentTaskService.java
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
- model/cmcrs/models/resnet.py

数据库脚本：

- 数据库.sql
- 数据库2.txt

---

## 11. 结论

项目已具备“前端 -> Java 网关 -> Python AI”的统一入口架构与可演示的 Agent 双链路形态。当前主要瓶颈已从“功能可用性”转向“安全治理、配置治理与闭环补齐（舌诊/DDL）”。

---

## 12. 变更记录

1. 2026-04-09：补充 OpenClaw 本地代理可选链路与关键文件；补齐 auth/consultation 接口范围；更新规模统计与舌诊现状表述。

2. 2026-04-08：完成增量复扫，统一并修正文档中的规模统计与风险描述。
3. 2026-04-08：补充 Agent 执行语义说明（真实自动化 vs 模拟执行）。
4. 2026-04-06：首次完成三层网关架构文档化归档。
