import os
from sqlalchemy import create_engine, text
from config import Config

def reset_alembic():
    engine = create_engine(Config.DATABASE_URL)
    
    with engine.connect() as conn:
        try:
            conn.execute(text("DROP TABLE IF EXISTS alembic_version"))
            conn.commit()
            print("✅ Dropped alembic_version table")
        except Exception as e:
            print(f"❌ Error: {e}")

if __name__ == "__main__":
    reset_alembic()
