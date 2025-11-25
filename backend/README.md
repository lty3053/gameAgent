# Game Agent Backend

基于 Flask 的游戏推荐助手后端 API。

## 技术栈

- Flask 3.0
- SQLAlchemy 2.0
- PostgreSQL 17
- Alembic (数据库迁移)
- Boto3 (S3 存储)
- LangGraph (AI 工作流)
- OpenAI SDK (千问 AI)

## 安装

```bash
# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 安装依赖
pip install -r requirements.txt
```

## 配置

复制 `.env.example` 为 `.env` 并填写配置：

```bash
cp .env.example .env
```

## 数据库初始化

```bash
# 方式1: 使用 Alembic 迁移
alembic upgrade head

# 方式2: 直接创建表
python -c "from database.models import init_db; init_db()"
```

## 运行

```bash
python app.py
```

服务将在 http://localhost:5000 启动。

## API 端点

### 聊天
- `POST /api/chat/message` - 发送消息
- `POST /api/chat/clear` - 清空历史

### 游戏
- `GET /api/games` - 获取所有游戏
- `GET /api/games/<id>` - 获取单个游戏
- `GET /api/games/search?q=<query>` - 搜索游戏
- `POST /api/games` - 创建游戏
- `PUT /api/games/<id>` - 更新游戏
- `DELETE /api/games/<id>` - 删除游戏

### 上传
- `POST /api/upload/save` - 保存上传记录
- `POST /api/upload/file` - 上传文件（备用）
- `POST /api/upload/image` - 上传图片
- `POST /api/upload/video` - 上传视频
