# 网易云音乐自动任务 - Web 前端

这是一个可视化的 Web 管理界面，用于配置和管理网易云音乐自动任务。

## 功能特性

- 👤 **多账号管理** - 支持配置多个网易云音乐账号
- ⚙️ **任务配置** - 可视化配置各项自动任务开关
- 📋 **执行日志** - 查看任务执行历史和状态
- 🔧 **配置导入导出** - 方便备份和迁移配置

## 快速开始

### 方式 1：同时启动前端和 API 服务（推荐）

```bash
npm install -g concurrently
npm run dev:all
```

### 方式 2：单独启动前端

```bash
cd frontend
npm run dev
```

启动后访问：http://localhost:3000

## 目录结构

```
├── frontend/              # Vue 3 前端项目
│   ├── src/
│   │   ├── views/        # 页面组件
│   │   ├── components/   # 通用组件
│   │   ├── stores/       # Pinia 状态管理
│   │   ├── router/       # 路由配置
│   │   └── assets/       # 静态资源
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── api-server.js         # 简单的 API 服务器
└── package.json
```

## 页面说明

### 首页
- 项目介绍和统计信息
- 快捷操作入口
- 功能特性展示

### 账号配置
- 添加/删除网易云音乐账号
- 配置导入导出
- Cookie 获取教程

### 任务管理
- 可视化切换任务开关
- VIP 高级配置
- 消息推送配置

### 执行日志
- 查看历史执行记录
- 导出/清空日志
- 详细执行结果展示

## 技术栈

- **Frontend**: Vue 3 + Vite + Pinia + Vue Router
- **Build Tool**: Vite 5
- **State Management**: Pinia
- **UI**: 自定义 CSS

## 开发

```bash
# 安装依赖
cd frontend
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## 注意事项

1. 前端配置目前保存在浏览器本地（LocalStorage），刷新页面不会丢失
2. 后续版本会添加后端配置持久化功能
3. 执行日志功能需要配合后端服务使用
