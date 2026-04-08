# TCM-AI 平台架构文档（概览版）

更新时间：2026-04-06（最终复扫 + 代码验真增补）

## 文档定位

本文件用于 5-10 分钟快速理解当前项目的真实架构与联调状态。

1. 概览版：README.md（本文件）
2. 详细版：docs/ARCHITECTURE.md（完整扫描分析）

---

## 1. 系统全景

当前仓库由 4 个核心子系统组成：

1. tcm-ai-frontend（Vue 3 前端）
2. tcm-ai-backend（Spring Boot 后端）
3. Traditional Chinese Medicine expert（Flask AI 服务）
4. model/cmcrs（PyTorch 模型训练与推理）

此外包含：

- docs（文档）
- 数据库.sql、数据库2.txt（数据库脚本）

---

## 2. 当前真实架构（已更新）

当前已完成调用链升级：前端仅访问 Java 后端网关，不再直连 Python。

调用拓扑：

1. 前端 -> Java 后端（8080）
2. Java 后端 -> Python AI 服务（5000）
3. Java 后端 -> MySQL（用户与问诊记录）
4. Python AI 服务 -> Chroma + DeepSeek（问诊）/ ResNet（药材识别）

网关接口：

- POST /api/ai/chat
- POST /api/herb/identify

---

## 3. 运行时拓扑

本地联调通常包含 4 个进程：

1. MySQL
2. Java 后端（默认 8080）
3. Python AI 服务（默认 5000）
4. 前端 Vite（默认 5173）

推荐启动顺序：

1. MySQL
2. Python AI
3. Java 后端
4. 前端

---

## 4. 子系统职责

### 4.1 前端（tcm-ai-frontend）

主要职责：

- 页面交互（问诊、舌诊、药材识别、个人中心）
- 会话展示与历史管理
- 上传图片并展示识别结果（置信度、Top3）

关键入口：

- src/main.js
- src/router/index.js
- src/views/Consultation/ConsultationView.vue
- src/views/HerbIdentify/HerbIdentifyView.vue

关键特征：

- 统一通过 VITE_JAVA_API_BASE_URL 调用后端
- API 封装模块已启用：src/api/chat.js、src/api/herb.js

### 4.2 后端（tcm-ai-backend）

主要职责：

- 用户注册/登录与 JWT 鉴权
- 问诊历史持久化
- AI 网关转发（问诊 + 药材识别）

关键入口：

- src/main/java/com/example/tcm_ai_backend/controller/AiGatewayController.java
- src/main/java/com/example/tcm_ai_backend/service/AiGatewayService.java
- src/main/java/com/example/tcm_ai_backend/controller/AuthController.java
- src/main/java/com/example/tcm_ai_backend/controller/ConsultationController.java

### 4.3 AI 服务（Traditional Chinese Medicine expert）

主要职责：

- /api/ai/chat：RAG 检索增强问诊
- /api/herb/identify：药材图像识别

关键入口：

- ai_server.py（薄入口）
- server/routes/chat.py
- server/routes/herb.py
- server/services/model_runtime.py

### 4.4 模型模块（model/cmcrs）

主要职责：

- ResNet 训练与推理
- 提供 best.pth 权重与类别映射（365类）

关键入口：

- config/config.py
- models/resnet.py
- engine/inferance.py
- best.pth

---

## 5. 当前能力状态

1. 问诊链路：可用（前端 -> Java -> Python -> LLM）
2. 用户认证：可用（JWT）
3. 问诊历史 CRUD：可用
4. 药材识别链路：已接入并可返回模型结果
5. 舌诊链路：页面存在，后端闭环仍待完善

---

## 6. 主要风险（需优先处理）

1. 敏感信息硬编码风险
   - Python 中存在 API Key 默认值
   - 后端存在数据库密码/JWT 密钥明文配置
2. 安全配置风险
   - CORS 策略仍较宽松
3. 工程债务
   - application.properties 仍有 MyBatis 遗留配置
   - Python 依赖与模型部署需进一步规范（版本锁定、环境隔离）
4. 编码显示问题
   - Windows 终端存在中文输出乱码风险（接口结构不受影响）

---

## 7. 快速联调

示例流程：

1. 启动 Python 服务（建议使用 ai_env）
2. 启动 Java 后端
3. 启动前端
4. 登录后测试：
   - 问诊发送消息
   - 上传药材图片识别

Python 依赖清单：

- Traditional Chinese Medicine expert/requirements.txt

---

## 8. 关键文件导航

前端：

- tcm-ai-frontend/src/api/chat.js
- tcm-ai-frontend/src/api/herb.js
- tcm-ai-frontend/src/views/Consultation/ConsultationView.vue
- tcm-ai-frontend/src/views/HerbIdentify/HerbIdentifyView.vue
- tcm-ai-frontend/src/views/apps/personal-center/useSyndromeAnalysis.js

后端：

- tcm-ai-backend/src/main/java/com/example/tcm_ai_backend/controller/AiGatewayController.java
- tcm-ai-backend/src/main/java/com/example/tcm_ai_backend/service/AiGatewayService.java
- tcm-ai-backend/src/main/java/com/example/tcm_ai_backend/config/JacksonConfig.java
- tcm-ai-backend/src/main/resources/application.properties

AI 服务与模型：

- Traditional Chinese Medicine expert/ai_server.py
- Traditional Chinese Medicine expert/server/routes/chat.py
- Traditional Chinese Medicine expert/server/routes/herb.py
- Traditional Chinese Medicine expert/server/services/model_runtime.py
- model/cmcrs/best.pth
- model/cmcrs/config/config.py

---

## 9. 变更记录

- 2026-04-06：最终复扫完成，文档更新为“前端 -> Java 网关 -> Python AI”真实架构；补充药材识别闭环接入现状与风险项。
- 2026-04-06：新增代码验真增补，补充 Agent 当前执行模式、数据库脚本覆盖范围、舌诊接口现状与模块规模统计。

---

## 10. Agent 代理服务（V1 骨架已落地）

在不改变主链路的前提下，新增 Agent 任务中心，当前仍保持：前端仅访问 Java 后端网关。

V1 已落地能力：

1. 任务创建（含风险等级）
2. 我的任务列表/详情查询
3. 中高风险任务审批（APPROVE/REJECT）
4. 低风险任务自动执行（当前为模拟执行结果，待接真实供应商）

后端新增接口：

- POST /api/agent/tasks/create
- GET /api/agent/tasks
- GET /api/agent/tasks/{id}
- POST /api/agent/tasks/{id}/approve

任务状态（V1）：

- PENDING_APPROVAL（待审批）
- APPROVED（已审批）
- RUNNING（执行中）
- SUCCESS（执行成功）
- FAILED（执行失败）
- CANCELLED（已取消/拒绝）

后续接入方向：

1. 微信适配器（公众号/企业微信）
2. 挂号平台适配器（如小龙虾等）
3. 审计日志、异步队列、重试与幂等机制

---

## 11. Agent 统一大脑（V2 路线二已落地）

在 Agent V1 任务中心基础上，新增统一大脑入口，由后端返回结构化动作，前端按动作执行。

新增接口：

- POST /api/agent/brain/turn
- GET /api/agent/brain/progress
- POST /api/ai/tool-plan（Python 侧工具规划）

核心流程（路线二）：

1. 前端发送自然语言到 `/api/agent/brain/turn`
2. Java 优先调用工具规划器（Function Calling 风格 JSON 协议）生成工具指令；失败时回退本地规则
3. 对“自动挂号”场景，Java 通过 `ProcessBuilder` 唤醒 Python 执行脚本
4. Python 以单行 JSON 输出执行结果，Java 解析后返回给前端
5. 前端轮询 `/api/agent/brain/progress` 展示“Agent 思考流”过程状态

默认配置（`application.properties`）：

- app.agent.python.exec=python
- app.agent.python.booking-script=../Traditional Chinese Medicine expert/server/automation/mock_booking_executor.py
- app.agent.python.booking-mode=selenium-visible
- app.agent.python.booking-url=https://www.cs4hospital.cn/
- app.agent.python.booking-browser-timeout-sec=25
- app.agent.python.timeout-ms=90000
- python.ai.tool-plan-path=/api/ai/tool-plan

机械臂执行模式说明：

- `app.agent.python.booking-mode=mock`：本地模拟提交
- `app.agent.python.booking-mode=selenium-headless`：无头浏览器自动化
- `app.agent.python.booking-mode=selenium-visible`：可见浏览器自动化（当前配置，适合答辩现场演示）

Selenium 依赖：

- Python 环境需安装 `selenium`（见 `Traditional Chinese Medicine expert/requirements.txt`）
- 机器需安装 Chrome 或 Edge 浏览器；若无法自动拉取驱动，请先联网并允许 Selenium Manager 下载对应 WebDriver
- 目标站点若存在登录/验证码/实名校验，脚本会明确返回失败原因，不会伪造“挂号成功”

当前行为约束：

- 不支持的能力（支付/拨号/短信）必须明确拒绝，不伪造成功
- 服药提醒仍走前端本地真实创建流程（本地落库 + `.ics` 导出），避免回归
- 挂号任务执行链已统一：审批后的 `HOSPITAL_BOOKING` 同样走 Java -> Python 自动化桥接

---

## 12. 本轮代码验真增补（2026-04-06）

本轮基于代码级扫描补充了以下事实：

1. 前端 `src` 未发现直连 `http://localhost:5000` 的业务调用，当前统一通过 `VITE_JAVA_API_BASE_URL` 访问 Java 网关。
2. 全站管家组件已在根组件挂载（`src/App.vue` 中 `<AgentButlerBubble />`）。
3. `数据库.sql` 与 `数据库2.txt` 目前覆盖 `app_user` 和 `consultation_log`，`agent_task` 主要依赖 JPA `ddl-auto=update` 自动建表。
4. `tcm-ai-frontend/src/api/tongue.js` 文件存在但仍为空，舌诊接口闭环仍待完善。
5. 模块规模（按当前仓库文件统计）：前端 `src` 约 44 个文件、后端 Java 约 41 个文件、Python `server` 约 13 个文件、`model/cmcrs` 约 388 个文件（含测试样本）。
