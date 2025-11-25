"""
创建用户和对话历史表
"""
import psycopg2
import os

def create_tables():
    conn = psycopg2.connect(
        host=os.getenv('DB_HOST', 'localhost'),
        port=os.getenv('DB_PORT', '5432'),
        user=os.getenv('DB_USER', 'postgres'),
        password=os.getenv('DB_PASSWORD', 'devpass'),
        database=os.getenv('DB_NAME', 'ltygames')
    )
    
    cursor = conn.cursor()
    
    try:
        # 创建 users 表
        print("📝 Creating users table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                user_key VARCHAR(100) UNIQUE NOT NULL,
                email VARCHAR(255) UNIQUE,
                password_hash VARCHAR(255),
                is_guest BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        
        # 创建索引
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_users_user_key ON users(user_key);
            CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
        """)
        
        print("✅ users table created")
        
        # 创建 chat_histories 表
        print("📝 Creating chat_histories table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS chat_histories (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                role VARCHAR(20) NOT NULL,
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        
        # 创建索引
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_chat_histories_user_id ON chat_histories(user_id);
        """)
        
        print("✅ chat_histories table created")
        
        conn.commit()
        print("\n🎉 All tables created successfully!")
        
    except Exception as e:
        conn.rollback()
        print(f"❌ Error: {e}")
        raise
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    create_tables()
