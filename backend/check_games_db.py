import sys
import os

# 添加当前目录到 python path
sys.path.append(os.getcwd())

from database.models import Game, SessionLocal, init_db

def check_games():
    try:
        db = SessionLocal()
        print("\n🔍 Checking database for games...")
        
        games = db.query(Game).all()
        
        if not games:
            print("❌ No games found in the database.")
        else:
            print(f"✅ Found {len(games)} games:")
            print("-" * 50)
            for game in games:
                print(f"ID: {game.id}")
                print(f"Name: {game.name}")
                print(f"File URL: {game.game_file_url}")
                print(f"Created At: {game.created_at}")
                print("-" * 50)
                
    except Exception as e:
        print(f"❌ Error checking database: {e}")
        import traceback
        traceback.print_exc()
    finally:
        if 'db' in locals():
            db.close()

if __name__ == "__main__":
    check_games()
