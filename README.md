# 🎮 Game Agent

智能游戏推荐助手 - 基于 AI 的游戏搜索和管理平台

## 项目简介

Game Agent 是一个集成了 AI 对话、游戏管理和云存储的全栈应用。用户可以通过自然语言与 AI 对话，搜索和下载游戏，同时支持直接上传游戏文件到云端。

## 技术栈

### 后端
- **框架**: Flask 3.0
- **数据库**: PostgreSQL 17
- **迁移管理**: Alembic (类似 Flyway)
- **存储**: Tebi.io S3 (兼容AWS S3)
- **AI模型**: 阿里云千问 qwen3-max
- **AI 工作流**: LangGraph

### 前端
- **框架**: React 18
- **UI 库**: Ant Design 5
- **路由**: React Router v6
- **HTTP 客户端**: Axios
- **S3 上传**: AWS SDK v3

## 功能特性

✅ **AI 智能对话**
- 基于 LangGraph 的工作流引擎
- 自动意图识别和工具调用
- 上下文感知的对话历史

✅ **游戏管理**
- 游戏搜索（支持中英文名称）
- 游戏详情展示
- 下载链接管理

✅ **云端上传**
- 前端直传 S3（减轻服务器压力）
- 实时上传进度显示
- 支持大文件分片上传

✅ **现代化 UI**
- 响应式设计
- 流畅的动画效果
- 友好的用户体验

## 快速开始

### 前置要求

- Python 3.10+
- Node.js 18+
- PostgreSQL 17
- pnpm (推荐) 或 npm

### 1. 克隆项目

```bash
git clone <your-repo-url>
cd gameAgent
```

### 2. 后端设置

```bash
cd backend

# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 安装依赖
pip install -r requirements.txt

# 配置环境变量
cp .env.example .env
# 编辑 .env 填写你的配置

# 初始化数据库
alembic upgrade head

# 启动后端
python app.py
```

后端将在 http://localhost:5000 启动。

### 3. 前端设置

```bash
cd frontend

# 安装依赖
pnpm install

# 启动开发服务器
pnpm start
```

前端将在 http://localhost:3000 启动。

## 环境变量配置

### 后端 `.env`

```env
# 数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=devpass
DB_NAME=ltygames

# S3 存储配置
S3_ENDPOINT=https://s3.tebi.io
S3_ACCESS_KEY=your_access_key
S3_SECRET_KEY=your_secret_key
S3_BUCKET=ltygames2

# AI 模型配置
QWEN_API_KEY=your_qwen_api_key
QWEN_MODEL=qwen3-max
QWEN_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
```

### 前端 `.env.local`

```env
REACT_APP_API_URL=http://localhost:5000/api
```

## 项目结构

```
gameAgent/
├── backend/                 # 后端代码
│   ├── alembic/            # 数据库迁移
│   ├── database/           # 数据库模型
│   ├── middleware/         # 中间件
│   ├── routes/             # API 路由
│   ├── services/           # 业务服务
│   ├── app.py              # 应用入口
│   └── config.py           # 配置文件
├── frontend/               # 前端代码
│   ├── public/             # 静态资源
│   └── src/
│       ├── api/            # API 调用
│       ├── components/     # React 组件
│       ├── pages/          # 页面组件
│       └── services/       # 服务层（S3等）
└── docker-compose.yml      # Docker 编排
```

## Docker 部署

```bash
# 构建并启动
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

## API 文档

详见 `backend/README.md`

## 开发指南

### 数据库迁移

```bash
# 创建新迁移
alembic revision --autogenerate -m "描述"

# 应用迁移
alembic upgrade head

# 回滚迁移
alembic downgrade -1
```

### 添加新的 AI 工具

在 `backend/routes/chat_routes_langgraph.py` 中：

1. 定义工具函数
2. 在 `tools` 列表中添加工具定义
3. 在 `analyze_and_call_tools` 中处理工具调用

## 常见问题

**Q: 上传失败，提示 CORS 错误？**

A: 确保在 Tebi.io 控制台配置了正确的 CORS 规则，允许 PUT 和 DELETE 方法。

**Q: AI 不调用工具？**

A: 检查 `system_prompt` 是否明确指示 AI 使用工具，以及工具定义是否清晰。

**Q: 数据库连接失败？**

A: 检查 PostgreSQL 是否运行，以及 `.env` 中的数据库配置是否正确。

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License
