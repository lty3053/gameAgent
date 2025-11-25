"""
手动修复游戏类型分类
"""

from database.models import Game, SessionLocal

# 手动指定游戏类型
MANUAL_CATEGORIES = {
    '神之天平': 'rpg',
    '晶石战记': 'turn_based',
    '最终幻想7: 重生': 'rpg',  # 修正为 RPG
    'Slay.the.Spire': 'roguelike',
    '我在地府打麻将': 'puzzle'
}

def fix_categories():
    """手动修复游戏类型"""
    db = SessionLocal()
    try:
        games = db.query(Game).all()
        
        for game in games:
            for keyword, category in MANUAL_CATEGORIES.items():
                if keyword.lower() in game.name.lower():
                    old_category = game.category
                    game.category = category
                    print(f"✅ {game.name}: {old_category} -> {category}")
                    break
        
        db.commit()
        print("\n修复完成！")
        
        # 显示所有游戏的当前分类
        print("\n当前所有游戏分类：")
        for game in db.query(Game).all():
            print(f"  - {game.name}: {game.category or '未分类'}")
        
    finally:
        db.close()

if __name__ == '__main__':
    fix_categories()
