#!/bin/bash

set -e

echo "================================"
echo "Game Agent 服务器初始化脚本"
echo "================================"

# 更新包管理器
echo "📦 更新包管理器..."
apt-get update -y

# 安装 Node.js 和 npm
echo "📦 安装 Node.js 和 npm..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# 安装 pnpm
echo "📦 安装 pnpm..."
npm install -g pnpm

# 安装 PostgreSQL
echo "📦 安装 PostgreSQL..."
apt-get install -y postgresql postgresql-contrib

# 启动 PostgreSQL 服务
echo "🚀 启动 PostgreSQL 服务..."
service postgresql start

# 等待 PostgreSQL 启动
sleep 3

# 创建数据库和用户
echo "🗄️ 配置数据库..."
sudo -u postgres psql -c "CREATE DATABASE ltygames;" 2>/dev/null || echo "数据库已存在"
sudo -u postgres psql -c "CREATE USER postgres WITH PASSWORD 'devpass';" 2>/dev/null || echo "用户已存在"
sudo -u postgres psql -c "ALTER USER postgres WITH SUPERUSER;" 2>/dev/null || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ltygames TO postgres;" 2>/dev/null || true

# 安装 Python 虚拟环境
echo "📦 安装 Python 虚拟环境工具..."
apt-get install -y python3-venv python3-pip

# 后端设置
echo ""
echo "================================"
echo "🔧 配置后端服务"
echo "================================"

cd /usr/games/gameAgent/backend

# 创建虚拟环境
if [ ! -d "venv" ]; then
    echo "创建 Python 虚拟环境..."
    python3 -m venv venv
fi

# 激活虚拟环境并安装依赖
echo "安装后端依赖..."
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# 创建 .env 文件
if [ ! -f ".env" ]; then
    echo "创建后端 .env 配置文件..."
    cp .env.example .env
    echo "⚠️  请编辑 /usr/games/gameAgent/backend/.env 填写正确的配置"
fi

# 初始化数据库
echo "初始化数据库..."
alembic upgrade head 2>/dev/null || echo "数据库迁移完成或已是最新"

# 前端设置
echo ""
echo "================================"
echo "🔧 配置前端服务"
echo "================================"

cd /usr/games/gameAgent/frontend

# 安装前端依赖
echo "安装前端依赖（这可能需要几分钟）..."
pnpm install

# 创建前端环境变量文件
if [ ! -f ".env.local" ]; then
    echo "创建前端 .env.local 配置文件..."
    echo "REACT_APP_API_URL=http://localhost:5000/api" > .env.local
fi

# 启动服务
echo ""
echo "================================"
echo "🚀 启动服务"
echo "================================"

# 启动后端
echo "启动后端服务..."
cd /usr/games/gameAgent/backend
source venv/bin/activate
nohup python app.py > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
echo "后端服务已启动 (PID: $BACKEND_PID)"
echo "日志文件: /tmp/backend.log"

# 等待后端启动
sleep 5

# 启动前端
echo "启动前端服务..."
cd /usr/games/gameAgent/frontend
nohup pnpm start > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "前端服务已启动 (PID: $FRONTEND_PID)"
echo "日志文件: /tmp/frontend.log"

# 保存 PID
echo $BACKEND_PID > /tmp/backend.pid
echo $FRONTEND_PID > /tmp/frontend.pid

echo ""
echo "================================"
echo "✅ 服务启动完成！"
echo "================================"
echo ""
echo "📊 服务信息:"
echo "  后端: http://localhost:5000"
echo "  前端: http://localhost:3000"
echo ""
echo "📝 日志文件:"
echo "  后端: /tmp/backend.log"
echo "  前端: /tmp/frontend.log"
echo ""
echo "🔍 查看日志:"
echo "  tail -f /tmp/backend.log"
echo "  tail -f /tmp/frontend.log"
echo ""
echo "🛑 停止服务:"
echo "  kill \$(cat /tmp/backend.pid)"
echo "  kill \$(cat /tmp/frontend.pid)"
echo ""
