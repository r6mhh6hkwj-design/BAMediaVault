# 北京中学媒体库

基于 React + TypeScript + Tailwind CSS + Vite 的媒体文件管理系统，支持视频和图片的存储、预览、批量操作及细粒度权限控制。

## 技术栈

- **前端**: React 18 + TypeScript + Tailwind CSS + Vite
- **后端**: Express 4 + TypeScript + multer + archiver
- **状态管理**: Zustand
- **认证**: JWT + bcryptjs
- **存储**: 文件系统 + JSON 元数据

## 功能特性

### 文件管理
- 支持上传视频（MP4, WebM, MOV, AVI, MKV）和图片（JPG, PNG, GIF, WebP, SVG, BMP）
- 批量上传（支持队列管理和逐个命名）
- 图片预览：缩放、拖拽、旋转、前后切换、键盘快捷键
- 单个下载与批量下载（ZIP 打包）
- 单个删除与批量删除
- 文件重命名

### 文件夹管理
- 创建文件夹
- 文件夹重命名（创建者可重命名自己的文件夹）
- 文件夹删除（创建者可删除自己的文件夹，管理员可删除任意文件夹）
- 文件夹密码保护（仅管理员可设置/修改密码）
- 面包屑导航
- 点击 Logo 返回根目录

### 用户与权限系统
- 注册/登录（身份码区分管理员/普通用户）
- JWT 认证，权限实时从数据库读取
- 细粒度权限（9 种权限）：
  - `view` — 查看文件
  - `upload` — 上传文件
  - `edit_own` — 编辑自己的文件
  - `edit_all` — 编辑所有文件
  - `delete_own` — 删除自己的文件
  - `delete_all` — 删除所有文件
  - `folder_create` — 创建文件夹
  - `folder_manage_all` — 管理所有文件夹（删除/加密）
  - `manage_users` — 管理用户账号
- 管理员账号管理：查看所有用户、逐项开关权限、注销用户账号
- 用户可注销自己的账号

### UI 设计
- 毛玻璃（Glassmorphism）视觉效果
- 网格/列表双视图
- 搜索与类型筛选
- 响应式布局

## 快速开始

### 安装依赖
```bash
npm install
```

### 启动开发服务器
```bash
# 启动后端 API（端口 3001）
npx tsx api/server.ts

# 启动前端 Vite（端口 5173）
npx vite
```

### 构建生产版本
```bash
npm run build
```

## 项目结构

```
.
├── api/                    # Express 后端
│   ├── app.ts             # Express 应用入口
│   ├── server.ts          # 服务器启动
│   ├── middleware/
│   │   └── auth.ts        # JWT 认证 + 权限中间件
│   ├── routes/
│   │   ├── auth.ts        # 认证路由（注册/登录/用户管理）
│   │   ├── files.ts       # 文件路由（上传/下载/删除/批量）
│   │   └── folders.ts     # 文件夹路由（CRUD/密码）
│   └── services/
│       ├── permissions.ts # 权限常量与标签
│       ├── userService.ts # 用户数据服务
│       ├── fileService.ts # 文件数据服务
│       └── folderService.ts # 文件夹数据服务
├── src/
│   ├── components/        # React 组件
│   ├── pages/             # 页面组件
│   ├── store/             # Zustand 状态管理
│   ├── types/             # TypeScript 类型
│   └── lib/               # 工具函数
├── public/                # 静态资源
├── data/                  # JSON 数据存储（运行时生成）
└── uploads/               # 上传文件存储（运行时生成）
```

## 数据存储

项目使用 JSON 文件作为数据存储（无数据库依赖）：
- `data/users.json` — 用户数据
- `data/files.json` — 文件元数据
- `data/folders.json` — 文件夹数据

上传的文件存储在 `uploads/` 目录下。
