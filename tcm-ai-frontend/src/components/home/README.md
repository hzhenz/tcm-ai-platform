# 首页（HomeView）模块化结构说明

## 📁 新文件结构

```
src/
├── components/
│   └── home/                          # 首页相关组件
│       ├── ScrollOpeningAnimation.vue  # 卷轴开场动画
│       ├── HomeHeader.vue              # 导航栏
│       ├── InfoBar.vue                 # 资讯跑马灯
│       ├── HeroBanner.vue              # 英雄区（含粒子效果）
│       ├── FunctionGrid.vue            # 核心功能网格区
│       ├── LocalService.vue            # 本地服务区
│       ├── UserEcosystem.vue           # 用户生态区
│       └── HomeFooter.vue              # 页脚
├── styles/
│   └── home.css                        # 首页共享样式
└── views/
    └── apps/
        └── home/
            └── HomeView.vue            # 首页容器（已优化）
```

## 🏗️ 组件说明

### ScrollOpeningAnimation.vue
- **职责**：管理开场卷轴展开动画
- **功能**：
  - 检测是否为首次访问
  - 控制动画序列（展开 → 消退 → 显示页面）
  - 触发 `animation-complete` 事件

**Props**: 无
**Emits**: 
- `animation-complete` - 动画完成时触发

---

### HomeHeader.vue
- **职责**：顶部导航栏和导航菜单
- **功能**：
  - 毛玻璃效果（滚动时显示）
  - 导航菜单高亮
  - 平滑滚动到各区块
  - 登录按钮处理

**Emits**:
- `section-change(sectionId)` - 滚动到指定区块
- `nav-action({ type, path })` - 导航或操作事件

---

### InfoBar.vue
- **职责**：资讯跑马灯（最小化）
- **功能**：展示实时药材价格、医馆活动、节气养生信息

**Props**: 无

---

### HeroBanner.vue
- **职责**：英雄区（主视觉）
- **功能**：
  - Canvas 粒子背景动画
  - 标题和描述文案
  - 行动按钮（舌诊、中药识别）

**Emits**:
- `navigate(path)` - 路由导航

---

### FunctionGrid.vue
- **职责**：核心功能卡片网格
- **功能**：
  - 4 个功能卡片：舌诊、问诊、识药、科普
  - 卡片悬停效果
  - 动态延迟动画

**Emits**:
- `navigate(path)` - 路由导航

---

### LocalService.vue
- **职责**：本地服务展示区
- **功能**：
  - 长沙中医资源介绍
  - 模拟地图展示（脉冲点动画）
  - 响应式布局

**Emits**:
- `navigate(path)` - 路由导航

---

### UserEcosystem.vue
- **职责**：用户生态区
- **功能**：
  - 志愿者计划宣传
  - 号召行动按钮

**Emits**:
- `action({ type })` - 用户操作事件

---

### HomeFooter.vue
- **职责**：页脚（可复用于其他页面）
- **功能**：
  - Logo 和品牌信息
  - 快速链接
  - 联系方式

**Props**: 无

---

### HomeView.vue（容器）
- **职责**：首页容器，组合所有子组件
- **功能**：
  - 引入所有子组件
  - 集中管理事件处理
  - 路由导航
  - 页面状态管理

**主要方法**：
- `onAnimationComplete()` - 动画完成回调
- `goTo(path)` - 路由导航
- `scrollToSection(sectionId)` - 平滑滚动
- `showMessage(message)` - 显示提示消息

---

## 🎨 样式管理

### home.css
统一管理首页的共享样式：
- CSS 变量定义（颜色、字体、阴影）
- 通用类（`.btn`, `.container` 等）
- 全局动画规则

### 各组件内样式
每个组件使用 `<style scoped>` 来隔离样式，确保不相互干扰

---

## 📡 事件流

```
用户操作
   ↓
HomeHeader/组件 发出事件
   ↓
HomeView 容器 处理事件
   ↓
调用相应方法 (路由/滚动/消息)
```

**常见事件链**：
1. 用户点击导航 → `section-change` → `scrollToSection()`
2. 用户点击功能卡片 → `navigate()` → `router.push(path)`
3. 用户点击登录 → `nav-action` → `showMessage()`

---

## ✅ 优化收益

| 方面 | 改进 |
|------|------|
| **代码量** | 原 1500+ 行 → 多文件总和约 1200 行 |
| **单文件大小** | 原 HomeView 200KB+ → 各文件 15-40KB |
| **可维护性** | ⬆️ 每个文件职责单一 |
| **复用性** | ⬆️ 组件可独立导入到其他页面 |
| **开发效率** | ⬆️ 多人协作时冲突减少 |
| **性能** | ➜ 代码分割，优化加载 |
| **测试** | ⬆️ 组件独立，单元测试容易 |

---

## 🚀 未来优化方向

1. **提取 Composables**
   - `useScroll.js` - 滚动相关逻辑
   - `useNavigation.js` - 导航相关逻辑
   - `useMessage.js` - 消息提示相关逻辑

2. **提取工具函数**
   - `animationUtils.js` - 动画辅助
   - `formatters.js` - 数据格式化

3. **配置化**
   - 导航菜单项配置抽离
   - 功能卡片数据配置化

4. **国际化**
   - i18n 支持文案多语言
   - 准备 i18n 框架集成

---

## 📝 使用示例

### 导入并使用 HomeView
```vue
<!-- 在路由中 -->
import HomeView from '@/views/apps/home/HomeView.vue'

// 在路由配置中
{
  path: '/',
  component: HomeView
}
```

### 在其他页面复用子组件
```vue
<script setup>
import HomeFooter from '@/components/home/HomeFooter.vue'
</script>

<template>
  <!-- 页面内容 -->
  <HomeFooter />
</template>
```

---

## 🔗 相关文件修改

- ✅ `src/components/home/` - 新建 8 个组件
- ✅ `src/styles/home.css` - 新建共享样式
- ✅ `src/views/apps/home/HomeView.vue` - 完全重构
- ⚠️ `src/main.js` - 可选：导入全局样式

---

## 💡 最佳实践

1. **组件通信**
   - 父组件通过 Props 传递数据
   - 子组件通过 Emits 发出事件
   - 避免深层嵌套的 Props drilling

2. **样式组织**
   - CSS 变量集中管理
   - 使用 scoped 样式避免冲突
   - 共享样式放在 home.css

3. **性能优化**
   - Canvas 动画只在首屏初始化
   - 使用 `v-show` 替代 `v-if` 避免重排
   - 事件防抖处理

---

**更新时间**: 2026-04-04
**维护者**: 前端团队
