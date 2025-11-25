"""
添加 storage_type 和 netdisk_type 列到 games 表
"""
import psycopg2
from config import Config

def add_columns():
    # 从 DATABASE_URL 解析连接参数
    # 格式: postgresql://user:password@host:port/dbname
    import os
    
    conn = psycopg2.connect(
        host=os.getenv('DB_HOST', 'localhost'),
        port=os.getenv('DB_PORT', '5432'),
        user=os.getenv('DB_USER', 'postgres'),
        password=os.getenv('DB_PASSWORD', 'devpass'),
        database=os.getenv('DB_NAME', 'ltygames')
    )
    
    cursor = conn.cursor()
    
    try:
        # 检查列是否已存在
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='games' AND column_name='storage_type';
        """)
        
        if cursor.fetchone() is None:
            print("📝 Adding storage_type column...")
            cursor.execute("""
                ALTER TABLE games 
                ADD COLUMN storage_type VARCHAR(20) DEFAULT 's3';
            """)
            print("✅ storage_type column added")
        else:
            print("ℹ️  storage_type column already exists")
        
        # 检查 netdisk_type 列
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='games' AND column_name='netdisk_type';
        """)
        
        if cursor.fetchone() is None:
            print("📝 Adding netdisk_type column...")
            cursor.execute("""
                ALTER TABLE games 
                ADD COLUMN netdisk_type VARCHAR(50);
            """)
            print("✅ netdisk_type column added")
        else:
            print("ℹ️  netdisk_type column already exists")
        
        conn.commit()
        print("\n🎉 Database schema updated successfully!")
        
    except Exception as e:
        conn.rollback()
        print(f"❌ Error: {e}")
        raise
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    add_columns()
