import os
from sqlalchemy import create_engine, text
from config import Config

def inspect_db():
    engine = create_engine(Config.DATABASE_URL)
    
    with engine.connect() as conn:
        print("🔍 Inspecting 'games' table structure...")
        
        # 获取列信息
        result = conn.execute(text(
            """
            SELECT column_name, data_type, character_maximum_length, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'games'
            ORDER BY ordinal_position
            """
        ))
        
        columns = result.fetchall()
        
        print(f"{'Column Name':<20} {'Data Type':<15} {'Max Length':<12} {'Nullable'}")
        print("-" * 60)
        
        for col in columns:
            col_name, data_type, max_len, nullable = col
            max_len_str = str(max_len) if max_len else "-"
            print(f"{col_name:<20} {data_type:<15} {max_len_str:<12} {nullable}")

if __name__ == "__main__":
    inspect_db()
