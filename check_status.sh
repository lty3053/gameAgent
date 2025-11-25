#!/bin/bash

echo "================================"
echo "📊 Game Agent 服务状态"
echo "================================"
echo ""

# 检查后端
echo "🔍 后端服务:"
if [ -f /tmp/backend.pid ]; then
    BACKEND_PID=$(cat /tmp/backend.pid)
    if kill -0 $BACKEND_PID 2>/dev/null; then
        echo "  ✅ 运行中 (PID: $BACKEND_PID)"
        echo "  📍 http://localhost:5000"
    else
        echo "  ❌ 未运行 (PID 文件存在但进程不存在)"
    fi
else
    echo "  ❌ 未运行 (未找到 PID 文件)"
fi

# 检查前端
echo ""
echo "🔍 前端服务:"
if [ -f /tmp/frontend.pid ]; then
    FRONTEND_PID=$(cat /tmp/frontend.pid)
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        echo "  ✅ 运行中 (PID: $FRONTEND_PID)"
        echo "  📍 http://localhost:3000"
    else
        echo "  ❌ 未运行 (PID 文件存在但进程不存在)"
    fi
else
    echo "  ❌ 未运行 (未找到 PID 文件)"
fi

# 检查 PostgreSQL
echo ""
echo "🔍 PostgreSQL:"
if service postgresql status >/dev/null 2>&1; then
    echo "  ✅ 运行中"
else
    echo "  ❌ 未运行"
fi

# 检查端口占用
echo ""
echo "🔍 端口占用:"
if ss -tuln 2>/dev/null | grep -q ":5000 "; then
    echo "  ✅ 端口 5000 (后端) 已占用"
else
    echo "  ⚠️  端口 5000 (后端) 未占用"
fi

if ss -tuln 2>/dev/null | grep -q ":3000 "; then
    echo "  ✅ 端口 3000 (前端) 已占用"
else
    echo "  ⚠️  端口 3000 (前端) 未占用"
fi

echo ""
echo "================================"
echo "📝 查看日志:"
echo "  后端: tail -f /tmp/backend.log"
echo "  前端: tail -f /tmp/frontend.log"
echo "================================"
