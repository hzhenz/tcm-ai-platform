# TCM-AI 平台全项目扫描与分析报告（详细版）

扫描日期：2026 年 4 月 6 日（最终复扫）  
扫描范围：仓库全量代码、配置、联调路径与文档一致性

## 文档导航

1. 概览版：README.md
2. 详细版：docs/ARCHITECTURE.md（本文件）

---

## 1. 扫描结论摘要

本轮复扫结论：项目已从“前端双直连（Java + Python）”升级为“前端仅访问 Java 网关，后端统一转发 Python AI 服务”的三层结构。

已确认事项：

1. 前端问诊与个人中心 AI 调用已切到 Java `/api/ai/chat`。
2. 药材识别页面已接入真实上传接口 Java `/api/herb/identify`，不再使用占位 fakeIdentify。
3. Java 新增 AI 网关控制器与服务层，统一中转 chat/herb 请求。
4. Python 服务已完成分层（routes + services + model runtime），`ai_server.py` 仅保留薄入口。
5. `model/cmcrs/best.pth` 已接入推理运行时，支持 Top-K 返回。

---

## 2. 当前真实架构

### 2.1 逻辑拓扑

1. 前端（Vue）仅调用 Java 后端（8080）。
2. Java 后端：
   - 认证与业务接口
   - AI 网关接口（/api/ai/chat、/api/herb/identify）
   - 持久化问诊记录到 MySQL
3. Python AI 服务（5000）：
   - 问诊路由：RAG（Chroma）+ DeepSeek
   - 药材识别路由：加载 ResNet 权重并推理

### 2.2 接口转发表

1. 前端 `POST /api/ai/chat` -> Java `AiGatewayController` -> Python `/api/ai/chat`
2. 前端 `POST /api/herb/identify` -> Java `AiGatewayController` -> Python `/api/herb/identify`
3. 前端 `GET/POST/DELETE /api/consultation/*` -> Java 持久化接口
4. 前端 `POST /api/auth/*` -> Java 认证接口

---

## 3. 子系统详细分析

### 3.1 前端（tcm-ai-frontend）

关键变化：

1. API 模块化已落地：
   - `src/api/chat.js`
   - `src/api/herb.js`
2. 问诊页改造：
   - `src/views/Consultation/ConsultationView.vue` 使用 `postAiChat`，不再直接请求 5000。
3. 个人中心改造：
   - `src/views/apps/personal-center/useSyndromeAnalysis.js` 改为通过 Java AI 网关。
4. 药材页改造：
   - `src/views/HerbIdentify/HerbIdentifyView.vue` 使用真实上传识别，展示置信度与 Top3。

现状评估：

1. 问诊与药材识别链路前端侧已完成网关化。
2. 舌诊相关接口模块（如 `src/api/tongue.js`）仍待完善。

### 3.2 后端（tcm-ai-backend）

关键新增：

1. 网关控制器：
   - `controller/AiGatewayController.java`
2. 网关服务：
   - `service/AiGatewayService.java`
3. DTO：
   - `dto/ai/AiChatRequest.java`
   - `dto/ai/AiChatMessage.java`
4. Jackson 显式配置：
   - `config/JacksonConfig.java`（修复 ObjectMapper 注入问题）
5. 配置扩展：
   - `application.properties` 增加 `python.ai.*` 与上传限制。

设计说明：

1. 网关服务使用 Java HttpClient 转发到 Python。
2. 药材识别转发策略为“后端接收 multipart -> base64 JSON 转发给 Python”。
3. 后端对上传图片做了大小与 Content-Type 校验。

### 3.3 Python AI 服务（Traditional Chinese Medicine expert）

结构重构：

1. 启动入口：
   - `ai_server.py` -> `from server import create_app`
2. 路由层：
   - `server/routes/chat.py`
   - `server/routes/herb.py`
3. 服务层：
   - `server/services/chat_service.py`
   - `server/services/herb_service.py`
   - `server/services/model_runtime.py`

问诊能力：

1. `chat_service.py` 保留 RAG 检索与提示词策略。
2. 使用 Chroma 本地向量库 + DeepSeek Chat。

药材识别能力：

1. `model_runtime.py` 自动定位 `model/cmcrs`。
2. 加载 `best.pth`（支持 `model_state_dict` 与纯 state_dict）。
3. 输入为图片字节流，输出 top1 + topk + 置信度 + 毒性标记。

### 3.4 模型（model/cmcrs）

已复用资产：

1. 权重：`model/cmcrs/best.pth`
2. 架构：`models/resnet.py`
3. 预处理与尺寸：`config/config.py` + runtime transform
4. 类别映射：`config/config.py` 的 `idx_to_class`（365类）

---

## 4. 联调状态（本轮）

### 4.1 已验证

1. 后端可启动（8080）。
2. 认证接口可用（admin 登录获取 JWT）。
3. 问诊网关接口返回成功：`/api/ai/chat`。
4. 药材识别网关接口返回成功：`/api/herb/identify`。

### 4.2 关键修复记录

1. 修复 `ObjectMapper` 缺失导致的 Spring 启动失败。
2. 修复药材网关返回结构序列化问题（由 JsonNode 元信息改为 Map 数据）。
3. 修复 Python 运行缺失依赖：`Pillow`、`torchvision`。
4. 新增 Python 依赖文件：`Traditional Chinese Medicine expert/requirements.txt`。

### 4.3 说明

Windows 终端中中文出现乱码主要是控制台编码显示问题，不代表接口字段结构异常；接口数据字段已可用。

---

## 5. 主要风险与技术债

### 5.1 高优先级风险

1. 敏感信息硬编码
   - Python `chat_service.py` 仍存在 API Key 默认值兜底。
   - 后端 `application.properties` 存在明文数据库密码与 JWT 密钥。
2. 安全边界
   - CORS 仍偏宽松，生产环境应改白名单。

### 5.2 中优先级风险

1. 配置遗留
   - 后端仍保留 MyBatis 配置项（但实际使用 JPA）。
2. 依赖治理
   - Python requirements 未锁定精确版本。
3. 模块完整性
   - 舌诊链路仍未形成完整后端闭环。

### 5.3 低优先级风险

1. 可观测性不足
   - 缺少跨层请求追踪与结构化日志。
2. 文档维护成本
   - 架构演进较快，需持续保持文档与实现同步。

---

## 6. 推荐后续动作

### 6.1 短期（1-2 周）

1. 敏感配置环境变量化（DB/JWT/DeepSeek）。
2. 收紧 CORS 与鉴权策略。
3. 舌诊接口补齐并统一纳入网关风格。
4. 修复中文响应编码与终端展示一致性。

### 6.2 中期（1-2 月）

1. 为 AI 网关增加重试、熔断、降级策略。
2. 增加接口集成测试（auth/chat/herb）。
3. 引入结构化日志与基础监控。

### 6.3 长期（2-3 月）

1. 容器化与分环境部署（dev/test/prod）。
2. 统一密钥管理（Vault/云密管）。
3. 模型服务化标准化（健康检查、版本管理、A/B 发布）。

---

## 7. 关键文件索引（最终版）

前端：

- `tcm-ai-frontend/src/api/chat.js`
- `tcm-ai-frontend/src/api/herb.js`
- `tcm-ai-frontend/src/views/Consultation/ConsultationView.vue`
- `tcm-ai-frontend/src/views/HerbIdentify/HerbIdentifyView.vue`
- `tcm-ai-frontend/src/views/apps/personal-center/useSyndromeAnalysis.js`

后端：

- `tcm-ai-backend/src/main/java/com/example/tcm_ai_backend/controller/AiGatewayController.java`
- `tcm-ai-backend/src/main/java/com/example/tcm_ai_backend/service/AiGatewayService.java`
- `tcm-ai-backend/src/main/java/com/example/tcm_ai_backend/config/JacksonConfig.java`
- `tcm-ai-backend/src/main/java/com/example/tcm_ai_backend/controller/AuthController.java`
- `tcm-ai-backend/src/main/java/com/example/tcm_ai_backend/controller/ConsultationController.java`
- `tcm-ai-backend/src/main/resources/application.properties`

Python AI 与模型：

- `Traditional Chinese Medicine expert/ai_server.py`
- `Traditional Chinese Medicine expert/server/__init__.py`
- `Traditional Chinese Medicine expert/server/routes/chat.py`
- `Traditional Chinese Medicine expert/server/routes/herb.py`
- `Traditional Chinese Medicine expert/server/services/chat_service.py`
- `Traditional Chinese Medicine expert/server/services/herb_service.py`
- `Traditional Chinese Medicine expert/server/services/model_runtime.py`
- `Traditional Chinese Medicine expert/requirements.txt`
- `model/cmcrs/best.pth`
- `model/cmcrs/config/config.py`
- `model/cmcrs/models/resnet.py`

---

## 8. 结论

项目已完成关键架构升级：调用链从“前端直连多后端”演进为“前端 -> Java 网关 -> Python AI”统一入口模式，并已接入药材识别模型推理链路。当前系统已具备可联调、可扩展的基础形态。

后续重点应从“功能打通”转向“安全治理 + 稳定性 + 工程化”，尤其是密钥管理、异常治理、测试与可观测性建设。
