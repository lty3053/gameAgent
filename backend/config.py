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
    
    # Tebi.io S3 Configuration
    S3_ENDPOINT = os.getenv('S3_ENDPOINT', 'https://s3.tebi.io')
    S3_ACCESS_KEY = os.getenv('S3_ACCESS_KEY', '0CWhNqI9sqxT8dh6')
    S3_SECRET_KEY = os.getenv('S3_SECRET_KEY', '88iUjwzMmTPIZWP4z9GLgE2k3YK19S8xYUtc0hUK')
    S3_BUCKET = os.getenv('S3_BUCKET', 'ltygames')
    S3_CUSTOM_DOMAIN = os.getenv('S3_CUSTOM_DOMAIN', 'https://ltygames.88mac.cn')  # 自定义域名用于访问
    
    # AI Model Configuration
    QWEN_API_KEY = os.getenv('QWEN_API_KEY', 'sk-6c61ee051fa54352947add304b957a49')
    QWEN_MODEL = os.getenv('QWEN_MODEL', 'qwen3-max')
    QWEN_BASE_URL = os.getenv('QWEN_BASE_URL', 'https://dashscope.aliyuncs.com/compatible-mode/v1')
    
    # Flask Configuration
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    MAX_CONTENT_LENGTH = 500 * 1024 * 1024  # 500MB
