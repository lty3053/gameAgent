from database.models import Game, SessionLocal
from datetime import datetime

def insert_game():
    db = SessionLocal()
    try:
        game = Game(
            name="出将入相",
            description='这款《出将入相》简直是戏曲文化的"数字戏台"！🎭 虽然肉鸽玩法不算新颖（自动战斗+数值养成有点像复古QQ宠物对战），但京剧元素的融入真的惊艳——金钱变"戏票"、技能变"诗句"，连敌人都是经典剧目角色！水墨风格的戏台战场配上原汁原味的戏曲BGM，传统文化爱好者直接狂喜✨ 不过策略深度确实薄弱，基本就是堆数值，诗句组合缺乏化学反应。建议免安装版当成"戏曲科普模拟器"来玩，冲着玩法来的硬核玩家可能会小失望',
            game_file_url="https://s3.tebi.io/ltygames2/games/1763969182228-CJRX.v1.0.111622.exe",
            file_size="214466874",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        db.add(game)
        db.commit()
        db.refresh(game)
        
        print("✅ 游戏记录插入成功！")
        print(f"ID: {game.id}")
        print(f"名称: {game.name}")
        print(f"文件URL: {game.game_file_url}")
        print(f"文件大小: {game.file_size} bytes ({int(game.file_size) / 1024 / 1024:.2f} MB)")
        
    except Exception as e:
        print(f"❌ 插入失败: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    insert_game()
