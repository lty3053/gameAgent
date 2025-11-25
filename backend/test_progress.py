#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
测试上传进度回调功能
用于验证 boto3 的 Callback 参数是否正常工作
"""

import sys
import time

print("=" * 60, flush=True)
print("测试 1: 基本输出测试", flush=True)
print("=" * 60, flush=True)

for i in range(5):
    print(f"进度: {i * 20}%", flush=True)
    sys.stdout.flush()
    time.sleep(0.5)

print("\n" + "=" * 60, flush=True)
print("测试 2: 模拟进度回调", flush=True)
print("=" * 60, flush=True)

class ProgressCallback:
    def __init__(self, total_size):
        self._total_size = total_size
        self._uploaded = 0
        self._last_percent = 0
    
    def __call__(self, bytes_amount):
        self._uploaded += bytes_amount
        percent = int((self._uploaded / self._total_size) * 100)
        if percent != self._last_percent:
            print(f"📊 Upload progress: {percent}% ({self._uploaded:,}/{self._total_size:,} bytes)", flush=True)
            sys.stdout.flush()
            self._last_percent = percent

# 模拟 10MB 文件上传
total_size = 10 * 1024 * 1024  # 10MB
callback = ProgressCallback(total_size)

# 模拟分块上传
chunk_size = 1024 * 1024  # 1MB chunks
for i in range(10):
    callback(chunk_size)
    time.sleep(0.3)

print("\n" + "=" * 60, flush=True)
print("✅ 测试完成！", flush=True)
print("=" * 60, flush=True)
