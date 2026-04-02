## 文件
- src/api（存放所有与后端交互的请求接口）

- src/assets（存放静态图片、全局 CSS 样式）

- src/components（存放复用的通用组件，如侧边栏、顶部导航）

- src/mock（存放模拟数据脚本）

- src/router（存放路由配置）

- src/store（存放全局状态数据）

- src/utils（存放工具函数，如 Axios 二次封装文件）

- src/views（存放所有的页面级组件，如 Login.vue、Home.vue）

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

