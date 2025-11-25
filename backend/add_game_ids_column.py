"""
添加 game_ids 字段到 chat_histories 表
"""
from sqlalchemy import text
from database.models import SessionLocal

def add_column():
    db = SessionLocal()
    try:
        # 检查列是否已存在
        result = db.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'chat_histories' AND column_name = 'game_ids'
        """))
        
        if result.fetchone():
            print("✅ game_ids 列已存在")
            return
        
        # 添加列
        db.execute(text("""
            ALTER TABLE chat_histories 
            ADD COLUMN game_ids TEXT
        """))
        db.commit()
        print("✅ 成功添加 game_ids 列")
        
    except Exception as e:
        print(f"❌ 错误: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == '__main__':
    add_column()
