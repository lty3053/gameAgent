#!/bin/bash

set -e

echo "================================"
echo "🚀 启动 Game Agent 服务"
echo "================================"

# 添加 uv 到 PATH
export PATH="$HOME/.local/bin:$PATH"

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

echo ""
echo "启动后端服务..."
cd /usr/games/gameAgent/backend
nohup uv run python app.py > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > /tmp/backend.pid
echo "✓ 后端服务已启动 (PID: $BACKEND_PID)"

echo ""
echo "等待后端初始化..."
sleep 5

echo ""
echo "启动前端服务 (生产模式)..."
cd /usr/games/gameAgent/frontend
nohup serve -s build -l 3000 > /tmp/frontend.log 2>&1 &
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
echo "📝 查看日志:"
echo "  tail -f /tmp/backend.log"
echo "  tail -f /tmp/frontend.log"
echo ""
echo "🔍 查看状态:"
echo "  ./check_status.sh"
echo ""
echo "🛑 停止服务:"
echo "  ./stop_services.sh"
echo ""
