import sys
import os

# 添加当前目录到 python path
sys.path.append(os.getcwd())

from database.models import Game, SessionLocal

def clear_games():
    """清空游戏表中的所有数据"""
    try:
        db = SessionLocal()
        
        # 查询当前游戏数量
        count = db.query(Game).count()
        print(f"📊 当前游戏表中有 {count} 条记录")
        
        if count == 0:
            print("✅ 游戏表已经是空的")
            return
        
        # 删除所有游戏记录
        print("🗑️  正在删除所有游戏记录...")
        deleted = db.query(Game).delete()
        db.commit()
        
        print(f"✅ 成功删除 {deleted} 条游戏记录")
        
        # 验证删除结果
        remaining = db.query(Game).count()
        print(f"📊 删除后剩余记录: {remaining}")
        
    except Exception as e:
        print(f"❌ 删除失败: {e}")
        import traceback
        traceback.print_exc()
        if 'db' in locals():
            db.rollback()
    finally:
        if 'db' in locals():
            db.close()

if __name__ == "__main__":
    print("\n" + "="*50)
    print("⚠️  警告: 此操作将删除游戏表中的所有数据！")
    print("="*50 + "\n")
    
    confirm = input("确认删除所有游戏记录吗？(输入 'yes' 确认): ")
    
    if confirm.lower() == 'yes':
        clear_games()
    else:
        print("❌ 操作已取消")
