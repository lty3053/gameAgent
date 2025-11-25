#!/bin/bash

set -e

echo "================================"
echo "📦 安装 Python 3.11"
echo "================================"

# 添加 deadsnakes PPA (提供新版本 Python)
echo "添加 Python PPA..."
apt-get install -y software-properties-common
add-apt-repository -y ppa:deadsnakes/ppa
apt-get update

# 安装 Python 3.11 及相关工具
echo "安装 Python 3.11..."
apt-get install -y python3.11 python3.11-venv python3.11-dev python3.11-distutils

# 安装 pip for Python 3.11
echo "安装 pip for Python 3.11..."
curl -sS https://bootstrap.pypa.io/get-pip.py | python3.11

# 验证安装
echo ""
echo "================================"
echo "✅ Python 3.11 安装完成"
echo "================================"
python3.11 --version
python3.11 -m pip --version

echo ""
echo "现在可以重新创建虚拟环境了"
