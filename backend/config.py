import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Database Configuration
    DB_HOST = os.getenv('DB_HOST', 'localhost')
    DB_PORT = os.getenv('DB_PORT', '5432')
    DB_USER = os.getenv('DB_USER', 'postgres')
    DB_PASSWORD = os.getenv('DB_PASSWORD', 'devpass')
    DB_NAME = os.getenv('DB_NAME', 'ltygames')
    
    DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    
    # 阿里云 OSS Configuration
    OSS_ENDPOINT = os.getenv('OSS_ENDPOINT', 'https://oss-cn-hangzhou.aliyuncs.com')
    OSS_ACCESS_KEY_ID = os.getenv('OSS_ACCESS_KEY_ID', '')
    OSS_ACCESS_KEY_SECRET = os.getenv('OSS_ACCESS_KEY_SECRET', '')
    OSS_BUCKET = os.getenv('OSS_BUCKET', 'hyperhit-video-dev')
    OSS_BASE_PATH = os.getenv('OSS_BASE_PATH', 'test')  # 存储根目录
    
    # OSS 公网访问域名
    @staticmethod
    def get_oss_public_url(key):
        """生成 OSS 公网访问 URL"""
        return f"https://{Config.OSS_BUCKET}.oss-cn-hangzhou.aliyuncs.com/{key}"
    
    # AI Model Configuration
    QWEN_API_KEY = os.getenv('QWEN_API_KEY', '')
    QWEN_MODEL = os.getenv('QWEN_MODEL', 'qwen3-max')
    QWEN_BASE_URL = os.getenv('QWEN_BASE_URL', 'https://dashscope.aliyuncs.com/compatible-mode/v1')
    
    # Flask Configuration
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    MAX_CONTENT_LENGTH = 500 * 1024 * 1024  # 500MB
