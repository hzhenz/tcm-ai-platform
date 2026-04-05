# tcm-ai-platform 架构与功能分析（扫描结果）

> 扫描日期：2026-04-05

## 1. 仓库结构总览

- `tcm-ai-frontend/`：前端（Vue 3 + Vite + Element Plus + Three.js）
- `tcm-ai-backend/`：后端（Spring Boot + Spring MVC + Spring Data JPA + MySQL）
- `Traditional Chinese Medicine expert/`：Python AI 服务（Flask + RAG：Chroma + Embeddings + DeepSeek）
- `test-api/`：独立的实验/测试 API 工程（Spring Boot + DeepSeek）
- `数据库.sql`、`数据库2.txt`：数据库初始化脚本/草稿

## 2. 运行时逻辑拓扑（服务与端口）

典型本地联调时，涉及 3 个进程：

1) 前端开发服务器：Vite（默认 `5173`，以实际为准）
2) Java 后端：Spring Boot（`http://localhost:8080`）
3) Python AI：Flask（`http://localhost:5000`）

其中“问诊”链路是贯通的：

- 浏览器（问诊页）
  - 读写历史问诊：调用 Java 后端（8080）
  - AI 对话生成：调用 Python AI（5000）
- Java 后端
  - MySQL 持久化：保存/读取问诊记录
- Python AI
  - 本地向量库检索（Chroma）
  - 调用 DeepSeek 的 OpenAI 兼容接口生成回复

## 3. 后端（tcm-ai-backend）架构与功能

### 3.1 技术栈与配置

- Spring Boot：`4.0.5`
- Java：`17`
- Web：`spring-boot-starter-webmvc`
- ORM：`spring-boot-starter-data-jpa`
- DB：MySQL（见 `application.properties`）

配置文件：`tcm-ai-backend/src/main/resources/application.properties`

- 端口：`server.port=8080`
- 数据源：`jdbc:mysql://localhost:3306/tcm_ai...`
- JPA：`spring.jpa.hibernate.ddl-auto=update`（会自动根据实体更新表结构）

注意：配置里出现了 `mybatis.configuration.map-underscore-to-camel-case=true`，但当前后端依赖与代码实际使用的是 JPA（未看到 MyBatis 相关依赖/Mapper）。这更像是遗留配置。

### 3.2 代码分层（按当前实现）

当前后端已完成首轮工程化分层：

- Controller：对外提供 REST API
- Service：承载业务逻辑与事务边界
- DTO：请求入参与校验边界
- Entity：JPA 实体映射
- Repository：Spring Data JPA 仓储接口
- Utils：统一返回体 `Result<T>`
- Exception Handler：统一异常处理

当前已接入 JWT 鉴权与用户上下文注入。

### 3.3 核心实体：ConsultationLog

文件：`tcm-ai-backend/src/main/java/com/example/tcm_ai_backend/entity/ConsultationLog.java`

字段（概念）：

- `id`：主键
- `userId`：用户 ID（由 JWT 登录态注入）
- `title`：问诊主题
- `messages`：聊天内容（以 JSON 字符串形式存储）
- `createTime`：创建时间（返回给前端时按 `yyyy-MM-dd HH:mm` 格式序列化）

### 3.4 数据访问：ConsultationLogRepository

文件：`tcm-ai-backend/src/main/java/com/example/tcm_ai_backend/mapper/ConsultationLogRepository.java`

- 继承 `JpaRepository<ConsultationLog, Long>`
- 自定义查询：`findByUserIdOrderByCreateTimeDesc(Long userId)`

> 目录名叫 `mapper/`，但实际是 JPA Repository（命名上略误导）。

### 3.5 API：ConsultationController

文件：`tcm-ai-backend/src/main/java/com/example/tcm_ai_backend/controller/ConsultationController.java`

基础路径：`/api/consultation`

- `GET /history`
  - 功能：读取历史问诊（按时间倒序）
  - 现状：从登录态读取 `currentUserId`
  - 返回：`Result<List<ConsultationLog>>`

- `POST /save`
  - 功能：保存/更新问诊记录
  - 现状：按登录用户自动绑定 `userId`，并在后端补 `createTime=new Date()`
  - 入参：`SaveConsultationRequest`（DTO + 校验）
  - 返回：`Result<ConsultationLog>`

- `DELETE /delete/{id}`
  - 功能：删除一条历史记录
  - 返回：`Result<String>`

- `POST /api/auth/register`
  - 功能：用户注册并返回 JWT
  - 入参：`RegisterRequest`
  - 返回：`Result<AuthResponse>`（含 `token`、`userId`、`username`）

- `POST /api/auth/login`
  - 功能：用户登录并返回 JWT
  - 入参：`LoginRequest`
  - 返回：`Result<AuthResponse>`（含 `token`、`userId`、`username`）

说明：`/api/auth/**` 免鉴权；问诊接口需携带 `Authorization: Bearer <token>`。

跨域：Controller 上使用 `@CrossOrigin` 允许 Vue 跨域。

### 3.6 后端返回体：Result<T>

文件：`tcm-ai-backend/src/main/java/com/example/tcm_ai_backend/utils/Result.java`

- `code`：`200` 成功 / `500` 失败
- `msg`：消息
- `data`：数据

这决定了前端解析逻辑通常是 `if (result.code === 200) { ... }`。

## 4. 前端（tcm-ai-frontend）架构与功能

### 4.1 技术栈

- Vue：`3.x`
- 构建：Vite
- UI：Element Plus + Icons
- 数据请求：axios 依赖已装，但问诊页实际使用的是原生 `fetch`
- 动画：AOS
- 3D：Three.js（`HumanBody3D.vue`）
- 富文本：marked（Markdown 渲染）
- 导出：html2canvas + jsPDF（问诊报告导出 PDF）

### 4.2 应用入口与路由

入口：`tcm-ai-frontend/src/main.js`

- 注册 Element Plus
- 注册 router
- 挂载到 `#app`

路由：`tcm-ai-frontend/src/router/index.js`

- `/`：首页 HomeView
- `/tongue`：舌诊（望）
- `/consultation`：问诊（问）
- `/herb`：药材识别
- `/map`：地图（当前为占位）
- `/science`：科学/经络科普（含 3D）

### 4.3 网络访问与代理

Vite 代理配置：`tcm-ai-frontend/vite.config.js`

- 将前端的 `/api/*` 代理到 `http://localhost:8080`

当前问诊页已改为环境变量配置地址：

- `VITE_JAVA_API_BASE_URL`（默认 `http://localhost:8080`）
- `VITE_PYTHON_AI_BASE_URL`（默认 `http://localhost:5000`）

其中 AI 链路采用前端直连 Python（5000），部署时通过 `.env` 注入地址即可。

### 4.4 核心贯通页面：ConsultationView（问诊）

文件：`tcm-ai-frontend/src/views/Consultation/ConsultationView.vue`

功能链路（非常关键）：

1) 页面加载时 `fetchHistory()` 调 Java 后端
  - `GET ${VITE_JAVA_API_BASE_URL}/api/consultation/history`

2) 用户发送消息 `sendMsg()`
   - 将用户消息 push 到 `chatMessages`
   - 调 `syncToDb()` 保存当前对话
     - `POST ${VITE_JAVA_API_BASE_URL}/api/consultation/save`
     - body：`{ id, title, messages: JSON.stringify(chatMessages) }`
   - 再请求 Python AI
     - `POST ${VITE_PYTHON_AI_BASE_URL}/api/ai/chat`
     - body：`{ content, history: [{role, content}, ...] }`
   - AI 回复后覆盖“思考中”消息，并再次 `syncToDb()` 做持久化

3) 历史记录 CRUD
   - 点击左侧历史：反序列化 `messages` JSON 回填聊天窗口
  - 删除：`DELETE ${VITE_JAVA_API_BASE_URL}/api/consultation/delete/{id}`

4) 结束问诊生成报告
   - 取最后一条 AI 回复作为 `reportAdvice`
   - 弹出卷轴风格报告弹层
   - 支持复制文本、导出 PDF

补充：已统一为前端直接调用 Python AI 的 `/api/ai/chat`，后端仅负责问诊记录持久化。

### 4.5 其他页面现状（以当前代码为准）

- 舌诊页：`tcm-ai-frontend/src/views/Tongue/TongueView.vue`
  - 摄像头采集 + 本地展示 + “模拟 AI 结果”
  - 7 日打卡：使用 `localStorage`
  - 未接入后端/模型推理

- 药材识别页：`tcm-ai-frontend/src/views/HerbIdentify/HerbIdentifyView.vue`
  - 上传图片并本地 `fakeIdentify()` 模拟识别
  - 价格表为前端静态 mock

- 科学页：`tcm-ai-frontend/src/views/Science/ScienceView.vue`
  - 经络科普内容 + 3D 经络明堂图（Three.js）

- 地图页：`tcm-ai-frontend/src/views/Map/MapView.vue`
  - 当前是占位文本

- `src/api/chat.js`、`src/api/herb.js`、`src/api/tongue.js`、`src/store/index.js`、多组件文件目前为空，属于“预留/未完成”的工程骨架。

## 5. Python AI 服务（Traditional Chinese Medicine expert）架构与功能

文件：`Traditional Chinese Medicine expert/ai_server.py`

### 5.1 技术栈

- Flask + flask-cors：HTTP API + 跨域
- langchain + chroma：向量检索
- HuggingFaceEmbeddings：中文向量模型（`shibing624/text2vec-base-chinese`）
- OpenAI SDK：用于调用 DeepSeek 的 OpenAI 兼容接口（`base_url=https://api.deepseek.com`）

### 5.2 核心接口：POST /api/ai/chat

请求 JSON：

- `content`：用户当前输入
- `history`：历史对话（数组，元素包含 `role`/`content`）

处理流程（RAG）：

1) `similarity_search(user_input, k=2)` 从本地 Chroma 库检索相关“古籍资料片段”
2) 将检索结果拼入 `rag_prompt`（system prompt），对模型输出格式、问诊策略、免责声明等做强约束
3) 合并 `history` + 当前 user message，调用 DeepSeek `deepseek-chat`
4) 返回：`{ code: 200, data: ai_reply }` 或 `{ code: 500, msg: error }`

向量库目录：`Traditional Chinese Medicine expert/tcm_chroma_db/`（持久化到 `chroma.sqlite3`）

知识源：可见到 `super_tcm_db.json`、`tcm_knowledge_db.json` 等文件（用于构建/补充知识库）。

## 6. test-api 子项目（实验工程）

目录：`test-api/`

目标：封装 DeepSeek Chat 调用并对外提供一个简单接口。

当前扫描发现多个“包名/路径不一致”的问题，导致工程大概率无法编译运行：

- `DeepSeekService.java` 的 `package` 声明为 `edu.hunn.cisc.testapi.service`，但文件实际放在 `edu/hunn/cisc/testapi/` 目录下（缺少 `service/` 目录层级）。
- `ChatController.java` 的 import 写成了 `edu.hunn.fisc.testapi.service.DeepSeekService`（`fisc` 似乎是笔误，应为 `cisc`）。

如果你希望我顺手把 test-api 修到可运行，我可以在下一步直接改正包路径与 import。

## 7. 数据库脚本与表结构一致性

- `数据库.sql`：全新初始化脚本（`app_user` + `consultation_log(messages)` + 索引/外键）
- `数据库2.txt`：旧库迁移脚本（`user` -> `app_user`，并补齐 `messages` 等字段）

与当前后端实体的差异：

- 当前脚本已与实体对齐：`consultation_log` 包含 `messages`，并补充了按用户查询的联合索引。
- 用户表已统一为 `app_user`（对应后端实体 `AppUser`）。

## 8. 风险点与改进建议（按影响优先级）

1) **密钥泄漏风险**
   - Python `ai_server.py` 与 `test-api/application.properties` 中包含明文 `deepseek api key`。
   - 建议改为环境变量/本地私有配置（并加入 `.gitignore`），避免提交到仓库。

2) **接口调用链不统一**
  - 已决策并落地：前端问诊页直连 Python（5000），后端不再提供 AI 代理。
  - 已补充前端环境变量配置，区分 Java 持久化地址与 Python AI 地址。

3) **用户体系（已完成首版）**
  - 后端已接入 JWT 登录注册与鉴权过滤器，问诊记录按登录用户隔离；
  - 前端已增加登录/注册页面，并在问诊请求中自动携带 Bearer Token；
  - 路由策略已调整为：除首页/登录/注册外，其余页面均需登录后访问；
  - 后端启动会自动初始化默认管理员账号（可通过配置覆盖）。

4) **前端请求地址硬编码**
  - 已完成：问诊页请求地址已改为环境变量注入，不再硬编码在业务请求中；
  - 当前使用 `VITE_JAVA_API_BASE_URL` 与 `VITE_PYTHON_AI_BASE_URL`，并提供 `.env.example` 作为配置模板。

5) **后端工程化分层（已完成首轮改造）**
  - 已引入 DTO + `@Valid` 参数校验，避免实体直接暴露为入参；
  - 已新增 Service 层承载业务逻辑，Controller 仅保留路由编排；
  - 已新增全局异常处理（`@RestControllerAdvice`），统一返回业务错误消息。
---

## 9. 后端架构优化（已实施）

本次已按工程项目实践，完成后端第一阶段结构升级：

1) Controller 瘦身
  - `ConsultationController` 改为仅负责路由与入参校验，核心逻辑下沉到 Service。

2) DTO 边界收敛
  - 新增 `SaveConsultationRequest`：约束标题与聊天记录必填；
  - `POST /save` 改为 DTO 入参，避免实体直接暴露。

3) Service 层承载业务
  - 新增 `ConsultationService`，统一处理历史查询、保存、删除；
  - 在 Service 中集中处理“当前用户”判定与记录归属校验（已由 SecurityContext 注入用户）。

4) 异常统一处理
  - 新增 `GlobalExceptionHandler`：统一处理参数校验错误、请求体解析错误、业务状态错误与兜底异常。

5) 依赖补齐
  - `pom.xml` 新增 `spring-boot-starter-validation`，支持 `jakarta validation` 注解校验；
  - 新增 `spring-boot-starter-security` 与 `jjwt` 依赖，支持 JWT 鉴权。

### 下一阶段建议

- 增加 `response code` 细分（400/401/403/404/500）与错误码枚举；
- 为 Service/Controller 补齐单元测试与接口测试。
