# 中医AI诊疗平台 - 前端设计文档
## 页面
- src/views (页面级组件 - 对应你的 HTML 文件)

    - HomeView.vue：对应 首页.html，作为导航入口和平台概览。

    - TongueView.vue：对应 舌诊.html。实现摄像头调用/图片上传，显示 AI 分析后的舌苔特征。

    - ConsultationView.vue：对应 问诊.html。实现流式对话界面，对接后端的大模型 API。

    - HerbIdentifyView.vue：对应 中药识别.html。实现拍照识别中药，并联动显示药材百科和价格。

    - ScienceView.vue：中医科普页面，可以采用卡片式布局展示中医知识。

    - MapView.vue：对应 地图.html，集成高德/百度地图 API，显示附近的医馆。

- src/components (通用零件)

    - NavBar.vue：顶部的古风导航栏。

    - ImageUploader.vue：核心组件。舌诊和中药识别都需要上传图片，可以封装一个带预览和压缩功能的通用上传组件。

    - ChatBox.vue：问诊页面的对话气泡组件。

- src/api (接口定义)

    - tongue.js：定义调用 Python 后端“舌苔识别”模型的接口。

    - herb.js：定义调用“中药识别”模型的接口。

    - chat.js：定义与 AI 医生对话的接口。

## 📁 项目目录结构与说明

### 一级目录（根目录）
```
tcm-ai-frontend/
├── index.html              # 应用入口 HTML 文件
├── package.json            # 项目依赖配置
├── vite.config.js          # Vite 构建工具配置
├── README.md               # 项目文档
├── public/                 # 公开静态资源
│   └── models/             # 3D 模型文件存储目录
├── src/                    # 源代码目录
└── node_modules/           # 依赖包目录（已安装）
```

### src 目录详解
- **src/api** （存放所有与后端交互的请求接口）
  - `chat.js`：AI 医生对话接口
  - `herb.js`：中药识别模型接口  
  - `tongue.js`：舌苔识别模型接口
  - ⚠️ 建议统一接口基础配置（如 HTTP 客户端、错误处理）

- **src/assets** （存放静态图片、全局 CSS 样式）
  - `vue.svg`：Vue 框架标志
  - ⚠️ **缺失**：应包含项目 Logo、图标、背景图等静态资源

- **src/components** （存放复用的通用组件）
  - `ChatBox.vue`：问诊页面的对话气泡组件
  - `ImageUploader.vue`：图片上传组件（核心组件，舌诊/中药识别共用）
  - `NavBar.vue`：顶部古风导航栏
  - `HumanBody3D.vue`：3D 人体模型组件（用于舌诊/穴位展示）
  - `template.vue`：模板/示例组件
  - ✅ 组件复用设计合理

- **src/mock** ⚠️ **缺失** 
  - 应创建此目录用于存放模拟数据脚本
  - 建议在开发初期使用 Mock 数据便于前端独立开发
  - 示例：`mockData.js`、`mockChatAPI.js`

- **src/router** （存放路由配置）
  - `index.js`：Vue Router 路由配置文件
  - 存在需求：应配置以下路由
    - `/` → HomeView（首页）
    - `/tongue` → TongueView（舌诊）
    - `/consultation` → ConsultationView（问诊）
    - `/herb` → HerbIdentifyView（中药识别）
    - `/science` → ScienceView（科普）
    - `/map` → MapView（地图）
    - `/auth/login` → LoginView（登录）
    - `/auth/register` → RegisterView（注册）

- **src/store** （存放全局状态数据）
  - `index.js`：Vuex/Pinia 状态管理配置
  - 建议管理的状态：用户信息、AI 对话记录、舌诊结果缓存

- **src/utils** ⚠️ **缺失**
  - 应创建此目录用于存放工具函数
  - 建议包含：
    - `axios.js` - HTTP 客户端二次封装（请求/响应拦截器）
    - `formatters.js` - 数据格式化函数
    - `validators.js` - 表单验证函数
    - `imageProcess.js` - 图片处理工具（压缩、质量调整）

- **src/views** （存放所有的页面级组件）
  按功能分类：
  ```
  views/
  ├── apps/                      # 身份认证相关页面
  │   ├── LoginView.vue          # 登录页面
  │   ├── RegisterView.vue       # 注册页面
  │   ├── home/
  │   │   ├── HomeView.vue       # 首页主视图
  │   │   ├── LayoutMenu.vue     # 首页菜单布局
  │   ├── science/               # 科普相关页面（预留目录）
  ├── Consultation/
  │   └── ConsultationView.vue   # 问诊页面（流式对话）
  ├── HerbIdentify/
  │   └── HerbIdentifyView.vue   # 中药识别页面
  ├── Map/
  │   └── MapView.vue            # 地图页面（高德/百度地图）
  ├── Science/
  │   └── ScienceView.vue        # 医学科普页面
  └── Tongue/
      └── TongueView.vue         # 舌诊页面（摄像头/图片上传）
  ```

- **src/style.css** （全局样式表）
  - 包含全局 CSS 样式、主题色变量等

- **src/App.vue** （根组件）
  - 应包含：导航栏、侧边栏、路由出口、全局样式

- **src/main.js** （应用入口脚本）
  - 初始化 Vue 应用、注册路由、状态管理、全局组件/指令