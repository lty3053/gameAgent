"""
初始化数据库脚本
运行此脚本来创建数据库表
"""
from models import init_db

if __name__ == '__main__':
    print("🔧 Initializing database...")
    init_db()
    print("✅ Database initialization complete!")
