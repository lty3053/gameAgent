# Game Agent Frontend

基于 React 的游戏推荐助手前端应用。

## 技术栈

- React 18
- Ant Design 5
- React Router v6
- Axios
- AWS SDK v3 (S3 直传)

## 开发

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm start

# 构建生产版本
pnpm build
```

## 环境变量

创建 `.env.local` 文件：

```
REACT_APP_API_URL=http://localhost:5000/api
```

## 功能

- 💬 AI 聊天对话
- 🎮 游戏搜索和推荐
- 📤 直接上传到 S3（带进度条）
- 🎨 现代化 UI 设计
