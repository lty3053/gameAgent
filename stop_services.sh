#!/bin/bash

echo "🛑 停止 Game Agent 服务..."

# 停止后端
if [ -f /tmp/backend.pid ]; then
    BACKEND_PID=$(cat /tmp/backend.pid)
    if kill -0 $BACKEND_PID 2>/dev/null; then
        kill $BACKEND_PID
        echo "✅ 后端服务已停止 (PID: $BACKEND_PID)"
    else
        echo "⚠️  后端服务未运行"
    fi
    rm /tmp/backend.pid
else
    echo "⚠️  未找到后端 PID 文件"
fi

# 停止前端
if [ -f /tmp/frontend.pid ]; then
    FRONTEND_PID=$(cat /tmp/frontend.pid)
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        kill $FRONTEND_PID
        echo "✅ 前端服务已停止 (PID: $FRONTEND_PID)"
    else
        echo "⚠️  前端服务未运行"
    fi
    rm /tmp/frontend.pid
else
    echo "⚠️  未找到前端 PID 文件"
fi

# 额外清理：查找并停止可能的残留进程
pkill -f "python.*app.py" 2>/dev/null && echo "✅ 清理残留的后端进程"
pkill -f "serve -s build" 2>/dev/null && echo "✅ 清理残留的前端进程"

echo ""
echo "✅ 所有服务已停止"
