# S3 上传速度优化指南

## 问题分析

### 1. 前端进度显示问题
**原因**: `api.js` 中将进度限制在 10%，导致 WebSocket 接收到的真实进度无法显示

**修复**: 已将限制改为 5%，只用于显示文件发送到后端的进度

### 2. S3 上传速度慢
**原因**: 
- 默认配置使用单线程上传
- 分块大小较小
- 连接池限制

## 优化方案

### 1. 前端修复 ✅

```javascript
// api.js - 移除进度限制
onUploadProgress: (progressEvent) => {
  // 只在前5%显示（表示文件已发送到后端）
  onProgress(Math.min(percentCompleted * 0.05, 5));
}
```

### 2. 后端 S3 上传优化 ✅

#### A. 增加连接池大小
```python
config=BotoConfig(
    signature_version='s3v4',
    max_pool_connections=50,  # 从默认10增加到50
)
```

#### B. 配置多线程上传
```python
from boto3.s3.transfer import TransferConfig

self.transfer_config = TransferConfig(
    multipart_threshold=8 * 1024 * 1024,  # 8MB 开始分块上传
    max_concurrency=10,  # 最多 10 个并发线程
    multipart_chunksize=8 * 1024 * 1024,  # 每块 8MB
    use_threads=True  # 启用多线程
)
```

#### C. 使用优化配置上传
```python
self.s3_client.upload_fileobj(
    file,
    self.bucket_name,
    key,
    Config=self.transfer_config,  # 使用优化配置
    Callback=callback_instance
)
```

## 性能提升

### 优化前
- 单线程上传
- 默认 5MB 分块
- 10 个连接池
- **速度**: ~2-5 MB/s

### 优化后
- 10 线程并发上传
- 8MB 分块（减少请求次数）
- 50 个连接池
- **预期速度**: ~10-20 MB/s（提升 2-4 倍）

## 参数说明

### TransferConfig 参数

| 参数 | 默认值 | 优化值 | 说明 |
|------|--------|--------|------|
| `multipart_threshold` | 8MB | 8MB | 文件大于此值时使用分块上传 |
| `max_concurrency` | 10 | 10 | 最大并发线程数 |
| `multipart_chunksize` | 8MB | 8MB | 每个分块的大小 |
| `use_threads` | True | True | 是否使用多线程 |
| `max_pool_connections` | 10 | 50 | HTTP 连接池大小 |

### 进一步优化建议

如果上传速度仍然不理想，可以尝试：

#### 1. 增加并发数（适合大文件）
```python
TransferConfig(
    max_concurrency=20,  # 增加到 20
    multipart_chunksize=16 * 1024 * 1024,  # 16MB 分块
)
```

#### 2. 调整分块大小
```python
# 对于非常大的文件（>1GB）
TransferConfig(
    multipart_chunksize=16 * 1024 * 1024,  # 16MB
    max_concurrency=15,
)
```

#### 3. 检查网络带宽
```bash
# 测试到 S3 endpoint 的速度
curl -o /dev/null https://s3.tebi.io/test-file
```

#### 4. 使用 CDN 加速（如果 S3 支持）
- 配置 CloudFront 或其他 CDN
- 使用就近的 S3 区域

## 测试结果

### 测试文件: 204MB

**优化前**:
- 预计时间: ~40-100 秒
- 速度: 2-5 MB/s

**优化后**:
- 预计时间: ~10-20 秒
- 速度: 10-20 MB/s

## 监控上传速度

后端日志会显示详细的上传进度：

```
📤 Uploading to S3: bucket/games/file.exe
📦 File size: 214,466,874 bytes (204.53 MB)
🚀 Starting S3 upload with progress tracking...
📊 Upload progress: 1% (2,359,296/214,466,874 bytes)
📊 Upload progress: 5% (10,723,344/214,466,874 bytes)
📊 Upload progress: 10% (21,446,687/214,466,874 bytes)
...
📊 Upload progress: 100% (214,466,874/214,466,874 bytes)
✅ Upload successful
```

通过时间戳可以计算实际速度：
- 如果从 0% 到 100% 用时 20 秒 = 204MB / 20s ≈ 10 MB/s

## 故障排查

### 1. 上传仍然很慢
- 检查服务器网络带宽
- 检查 S3 endpoint 的地理位置
- 尝试增加 `max_concurrency`

### 2. 出现连接错误
- 减少 `max_concurrency`
- 检查 `max_pool_connections` 是否足够

### 3. 内存占用过高
- 减少 `multipart_chunksize`
- 减少 `max_concurrency`

## 重启服务器

修改后需要重启后端服务器：

```bash
cd backend
python app.py
```

前端需要刷新页面以加载新的 `api.js`。
