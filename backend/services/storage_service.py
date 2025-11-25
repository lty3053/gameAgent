import oss2
from oss2.models import PartInfo
from config import Config
import os
import sys
from datetime import datetime

class StorageService:
    def __init__(self):
        """初始化阿里云 OSS 客户端"""
        # 创建 OSS 认证对象
        self.auth = oss2.Auth(
            Config.OSS_ACCESS_KEY_ID,
            Config.OSS_ACCESS_KEY_SECRET
        )
        
        # 从 endpoint 中提取纯域名（去掉 https://）
        endpoint = Config.OSS_ENDPOINT.replace('https://', '').replace('http://', '')
        
        # 创建 Bucket 对象
        self.bucket = oss2.Bucket(
            self.auth,
            f'https://{endpoint}',
            Config.OSS_BUCKET
        )
        
        self.bucket_name = Config.OSS_BUCKET
        self.base_path = Config.OSS_BASE_PATH  # test 目录
        
        print(f"✅ Aliyun OSS Client initialized")
        print(f"   - Endpoint: {Config.OSS_ENDPOINT}")
        print(f"   - Bucket: {self.bucket_name}")
        print(f"   - Base Path: {self.base_path}")
    
    def upload_file(self, file, folder='games', progress_callback=None):
        """
        上传文件到阿里云 OSS，支持进度回调
        
        Args:
            file: Flask FileStorage 对象
            folder: 目标文件夹 (games 或 images)
            progress_callback: 进度回调函数 callback(bytes_uploaded, total_bytes, percent)
            
        Returns:
            dict: {'success': bool, 'url': str, 'key': str, 'error': str}
        """
        try:
            # 生成文件名
            timestamp = int(datetime.now().timestamp() * 1000)
            original_filename = file.filename
            # 处理文件名中的特殊字符
            safe_filename = original_filename.replace(' ', '_')
            # 路径格式: test/games/xxx 或 test/images/xxx
            key = f"{self.base_path}/{folder}/{timestamp}-{safe_filename}"
            
            # 获取文件大小
            file.seek(0, 2)  # 移动到文件末尾
            file_size = file.tell()
            file.seek(0)  # 重置到开头
            
            print(f"📤 Uploading to OSS: {self.bucket_name}/{key}", flush=True)
            print(f"📦 File size: {file_size:,} bytes ({file_size/1024/1024:.2f} MB)", flush=True)
            
            # 创建进度回调
            uploaded_bytes = [0]  # 使用列表以便在闭包中修改
            last_percent = [0]
            
            def oss_progress_callback(consumed_bytes, total_bytes):
                percent = int((consumed_bytes / total_bytes) * 100) if total_bytes > 0 else 0
                if percent != last_percent[0]:
                    print(f"📊 Upload progress: {percent}% ({consumed_bytes:,}/{total_bytes:,} bytes)", flush=True)
                    sys.stdout.flush()
                    if progress_callback:
                        progress_callback(consumed_bytes, total_bytes, percent)
                    last_percent[0] = percent
            
            print(f"🚀 Starting OSS upload with progress tracking...", flush=True)
            
            # 读取文件内容
            file_content = file.read()
            
            # 上传文件到 OSS
            # 使用 put_object 上传，支持进度回调
            result = self.bucket.put_object(
                key,
                file_content,
                headers={
                    'Content-Type': file.content_type or 'application/octet-stream'
                },
                progress_callback=oss_progress_callback
            )
            
            # 生成公网访问 URL
            url = Config.get_oss_public_url(key)
            
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
        """删除 OSS 文件"""
        try:
            self.bucket.delete_object(key)
            print(f"✅ Deleted: {key}")
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
            # OSS 签名 URL
            url = self.bucket.sign_url('GET', key, expiration)
            return {'success': True, 'url': url}
        except Exception as e:
            print(f"❌ Generate presigned URL failed: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def upload_image(self, file, progress_callback=None):
        """
        上传图片到 OSS images 目录
        
        Args:
            file: Flask FileStorage 对象
            progress_callback: 进度回调函数
            
        Returns:
            dict: {'success': bool, 'url': str, 'key': str, 'error': str}
        """
        return self.upload_file(file, folder='images', progress_callback=progress_callback)
    
    def upload_game(self, file, progress_callback=None):
        """
        上传游戏文件到 OSS games 目录
        
        Args:
            file: Flask FileStorage 对象
            progress_callback: 进度回调函数
            
        Returns:
            dict: {'success': bool, 'url': str, 'key': str, 'error': str}
        """
        return self.upload_file(file, folder='games', progress_callback=progress_callback)
