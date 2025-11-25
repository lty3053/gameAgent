#!/bin/bash

set -e

echo "================================"
echo "📦 安装 uv"
echo "================================"

# 安装 uv
curl -LsSf https://astral.sh/uv/install.sh | sh

# 添加 uv 到当前会话的 PATH
export PATH="$HOME/.local/bin:$HOME/.cargo/bin:$PATH"

echo ""
echo "✅ uv 安装完成"
uv --version

echo ""
echo "================================"
echo "🗄️ 配置数据库"
echo "================================"

# 配置数据库
sudo -u postgres psql -c "CREATE DATABASE ltygames;" 2>/dev/null || echo "✓ 数据库已存在"
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'devpass';" 2>/dev/null || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ltygames TO postgres;" 2>/dev/null || true

echo ""
echo "================================"
echo "🔧 配置后端服务 (使用 uv)"
echo "================================"

cd /usr/games/gameAgent/backend

# 删除旧的虚拟环境
if [ -d "venv" ]; then
    echo "删除旧的虚拟环境..."
    rm -rf venv
fi

# 使用 uv 创建虚拟环境并安装依赖
echo "使用 uv 安装 Python 3.11 和依赖..."
uv venv --python 3.11

# 激活虚拟环境
source .venv/bin/activate

# 使用 uv 安装依赖
echo "安装后端依赖..."
uv pip install -r requirements.txt

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

# 清理可能的残留进程
pkill -f "python.*app.py" 2>/dev/null || true
pkill -f "react-scripts start" 2>/dev/null || true

# 启动后端 (使用 uv run)
echo "启动后端服务..."
cd /usr/games/gameAgent/backend
nohup uv run python app.py > /tmp/backend.log 2>&1 &
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
echo "💡 提示: uv 已安装在 ~/.cargo/bin/uv"
echo "   下次使用需要先运行: export PATH=\"\$HOME/.cargo/bin:\$PATH\""
echo ""
