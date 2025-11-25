#!/bin/bash

set -e

echo "================================"
echo "🚀 Game Agent 快速启动脚本"
echo "================================"

# 配置数据库
echo "🗄️ 配置数据库..."
sudo -u postgres psql -c "CREATE DATABASE ltygames;" 2>/dev/null || echo "✓ 数据库已存在"
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'devpass';" 2>/dev/null || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ltygames TO postgres;" 2>/dev/null || true

# 后端设置
echo ""
echo "================================"
echo "🔧 配置后端服务"
echo "================================"

cd /usr/games/gameAgent/backend

# 安装后端依赖
echo "安装后端依赖..."
source venv/bin/activate
pip install --upgrade pip -q
pip install -r requirements.txt -q

# 创建 .env 文件
if [ ! -f ".env" ]; then
    echo "创建后端 .env 配置文件..."
    cp .env.example .env
    echo "⚠️  请编辑 /usr/games/gameAgent/backend/.env 填写正确的配置"
else
    echo "✓ .env 文件已存在"
fi

# 初始化数据库
echo "初始化数据库..."
alembic upgrade head 2>/dev/null || echo "✓ 数据库已是最新"

# 前端设置
echo ""
echo "================================"
echo "🔧 配置前端服务"
echo "================================"

cd /usr/games/gameAgent/frontend

# 安装前端依赖
if [ ! -d "node_modules" ]; then
    echo "安装前端依赖（这可能需要几分钟）..."
    pnpm install
else
    echo "✓ 前端依赖已安装"
fi

# 创建前端环境变量文件
if [ ! -f ".env.local" ]; then
    echo "创建前端 .env.local 配置文件..."
    echo "REACT_APP_API_URL=http://localhost:5000/api" > .env.local
else
    echo "✓ .env.local 文件已存在"
fi

# 启动服务
echo ""
echo "================================"
echo "🚀 启动服务"
echo "================================"

# 检查并停止旧进程
if [ -f /tmp/backend.pid ]; then
    OLD_PID=$(cat /tmp/backend.pid)
    kill $OLD_PID 2>/dev/null || true
    rm /tmp/backend.pid
fi

if [ -f /tmp/frontend.pid ]; then
    OLD_PID=$(cat /tmp/frontend.pid)
    kill $OLD_PID 2>/dev/null || true
    rm /tmp/frontend.pid
fi

# 启动后端
echo "启动后端服务..."
cd /usr/games/gameAgent/backend
source venv/bin/activate
nohup python app.py > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > /tmp/backend.pid
echo "✓ 后端服务已启动 (PID: $BACKEND_PID)"

# 等待后端启动
sleep 3

# 启动前端
echo "启动前端服务..."
cd /usr/games/gameAgent/frontend
nohup pnpm start > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > /tmp/frontend.pid
echo "✓ 前端服务已启动 (PID: $FRONTEND_PID)"

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
echo "  后端: tail -f /tmp/backend.log"
echo "  前端: tail -f /tmp/frontend.log"
echo ""
echo "🔍 查看状态:"
echo "  ./check_status.sh"
echo ""
echo "🛑 停止服务:"
echo "  ./stop_services.sh"
echo ""
