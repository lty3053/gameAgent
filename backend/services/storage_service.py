import boto3
from botocore.client import Config as BotoConfig
from boto3.s3.transfer import TransferConfig
from config import Config
import os
import sys
from datetime import datetime

class StorageService:
    def __init__(self):
        """初始化 S3 客户端"""
        # 配置连接池，提高并发性能
        self.s3_client = boto3.client(
            's3',
            endpoint_url=Config.S3_ENDPOINT,
            aws_access_key_id=Config.S3_ACCESS_KEY,
            aws_secret_access_key=Config.S3_SECRET_KEY,
            config=BotoConfig(
                signature_version='s3v4',
                max_pool_connections=50,  # 增加连接池大小
            ),
            region_name='us-east-1'
        )
        self.bucket_name = Config.S3_BUCKET
        
        # 配置传输参数，优化上传速度
        self.transfer_config = TransferConfig(
            multipart_threshold=16 * 1024 * 1024,  # 16MB 开始分块上传
            max_concurrency=20,  # 最多 20 个并发线程
            multipart_chunksize=16 * 1024 * 1024,  # 每块 16MB
            use_threads=True  # 启用多线程
        )
        
        print(f"✅ S3 Client initialized")
        print(f"   - Endpoint: {Config.S3_ENDPOINT}")
        print(f"   - Bucket: {self.bucket_name}")
        print(f"   - Transfer Config: 16MB chunks, 20 concurrent threads")
    
    def upload_file(self, file, folder='games', progress_callback=None):
        """
        上传文件到 S3，支持进度回调
        
        Args:
            file: Flask FileStorage 对象
            folder: 目标文件夹
            progress_callback: 进度回调函数 callback(bytes_uploaded, total_bytes)
            
        Returns:
            dict: {'success': bool, 'url': str, 'key': str, 'error': str}
        """
        try:
            # 生成文件名
            timestamp = int(datetime.now().timestamp() * 1000)
            original_filename = file.filename
            # 处理文件名中的特殊字符
            safe_filename = original_filename.replace(' ', '_')
            key = f"{folder}/{timestamp}-{safe_filename}"
            
            # 获取文件大小（必须在打印之前）
            file.seek(0, 2)  # 移动到文件末尾
            file_size = file.tell()
            file.seek(0)  # 重置到开头
            
            print(f"📤 Uploading to S3: {self.bucket_name}/{key}", flush=True)
            print(f"📦 File size: {file_size:,} bytes ({file_size/1024/1024:.2f} MB)", flush=True)
            
            # 创建进度回调类
            class ProgressCallback:
                def __init__(self, callback, total_size):
                    self._callback = callback
                    self._total_size = total_size
                    self._uploaded = 0
                    self._last_percent = 0
                
                def __call__(self, bytes_amount):
                    self._uploaded += bytes_amount
                    percent = int((self._uploaded / self._total_size) * 100)
                    # 只在百分比变化时调用回调，避免过于频繁
                    if percent != self._last_percent:
                        print(f"📊 Upload progress: {percent}% ({self._uploaded:,}/{self._total_size:,} bytes)", flush=True)
                        sys.stdout.flush()  # 强制刷新输出缓冲区
                        if self._callback:
                            self._callback(self._uploaded, self._total_size, percent)
                        self._last_percent = percent
            
            # 创建回调实例
            callback_instance = ProgressCallback(progress_callback, file_size) if progress_callback else None
            print(f"🚀 Starting S3 upload with progress tracking...", flush=True)
            
            # 上传文件（使用优化的传输配置）
            self.s3_client.upload_fileobj(
                file,
                self.bucket_name,
                key,
                ExtraArgs={
                    'ContentType': file.content_type or 'application/octet-stream',
                    'ACL': 'public-read'
                },
                Config=self.transfer_config,
                Callback=callback_instance
            )
            
            # 生成访问 URL - 使用标准 S3 URL
            url = f"{Config.S3_ENDPOINT}/{self.bucket_name}/{key}"
            
            print(f"✅ Upload successful: {url}", flush=True)
            
            return {
                'success': True,
                'url': url,
                'key': key,
                'filename': safe_filename
            }
            
        except Exception as e:
            print(f"❌ Upload failed: {e}", flush=True)
            import traceback
            traceback.print_exc()
            sys.stdout.flush()
            return {
                'success': False,
                'error': str(e)
            }
    
    def delete_file(self, key):
        """删除 S3 文件"""
        try:
            self.s3_client.delete_object(
                Bucket=self.bucket_name,
                Key=key
            )
            return {'success': True}
        except Exception as e:
            print(f"❌ Delete failed: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def generate_presigned_url(self, key, expiration=3600):
        """生成预签名下载 URL"""
        try:
            url = self.s3_client.generate_presigned_url(
                'get_object',
                Params={
                    'Bucket': self.bucket_name,
                    'Key': key
                },
                ExpiresIn=expiration
            )
            return {'success': True, 'url': url}
        except Exception as e:
            print(f"❌ Generate presigned URL failed: {e}")
            return {
                'success': False,
                'error': str(e)
            }
