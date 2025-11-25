import os
from sqlalchemy import create_engine, text
from config import Config

def fix_database():
    engine = create_engine(Config.DATABASE_URL)
    
    with engine.connect() as conn:
        try:
            # 检查 download_url 列是否存在
            result = conn.execute(text(
                "SELECT column_name FROM information_schema.columns WHERE table_name='games' AND column_name='download_url'"
            ))
            
            if not result.fetchone():
                print("⚠️ 'download_url' column missing. Adding it...")
                conn.execute(text("ALTER TABLE games ADD COLUMN download_url VARCHAR(500)"))
                conn.commit()
                print("✅ Added 'download_url' column")
            else:
                print("✅ 'download_url' column already exists")
                
            # 检查其他可能缺失的列
            columns_to_check = [
                ('name_en', 'VARCHAR(200)'),
                ('cover_image', 'VARCHAR(500)'),
                ('video_url', 'VARCHAR(500)'),
                ('file_size', 'INTEGER'),
                ('tags', 'TEXT')
            ]
            
            for col_name, col_type in columns_to_check:
                result = conn.execute(text(
                    f"SELECT column_name FROM information_schema.columns WHERE table_name='games' AND column_name='{col_name}'"
                ))
                if not result.fetchone():
                    print(f"⚠️ '{col_name}' column missing. Adding it...")
                    conn.execute(text(f"ALTER TABLE games ADD COLUMN {col_name} {col_type}"))
                    conn.commit()
                    print(f"✅ Added '{col_name}' column")

        except Exception as e:
            print(f"❌ Error updating database: {e}")

if __name__ == "__main__":
    fix_database()
