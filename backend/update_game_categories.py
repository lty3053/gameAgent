"""
更新现有游戏的类型分类
根据游戏名称和描述自动分析并设置 category 字段
"""

from database.models import Game, SessionLocal

# 游戏类型映射规则
GAME_CATEGORIES = {
    # 动作冒险
    'action': [
        '龙之信条', "Dragon's Dogma", '刺客信条', 'Assassin', '战神', 'God of War',
        '鬼泣', 'Devil May Cry', '只狼', 'Sekiro', '艾尔登法环', 'Elden Ring',
        '黑暗之魂', 'Dark Souls', '血源', 'Bloodborne', '仁王', 'Nioh',
        '怪物猎人', 'Monster Hunter', '生化危机', 'Resident Evil',
        '古墓丽影', 'Tomb Raider', '神秘海域', 'Uncharted', '蝙蝠侠', 'Batman',
        '蜘蛛侠', 'Spider-Man', '对马岛', 'Ghost of Tsushima'
    ],
    # 回合战棋
    'turn_based': [
        '火焰纹章', 'Fire Emblem', '三国志', 'Romance of Three Kingdoms',
        '超级机器人大战', 'Super Robot Wars', '皇家骑士团', 'Tactics Ogre',
        '最终幻想战略版', 'FFT', 'XCOM', '文明', 'Civilization',
        '英雄无敌', 'Heroes of Might', '战锤', 'Warhammer'
    ],
    # 国风仙侠
    'wuxia': [
        '仙剑', '古剑', '轩辕剑', '天涯明月刀', '剑网', '逆水寒',
        '武林群侠传', '侠客风云传', '太吾绘卷', '鬼谷八荒', '觅长生',
        '了不起的修仙模拟器', '修仙', '仙侠', '武侠'
    ],
    # 复古经典
    'retro': [
        '红白机', 'NES', 'FC', '超任', 'SNES', 'SFC', '世嘉', 'SEGA',
        'MD', 'GBA', 'PS1', 'PS2', '街机', 'Arcade', '魂斗罗', '超级玛丽',
        '洛克人', 'Mega Man', '恶魔城', 'Castlevania'
    ],
    # 女性主角
    'female_lead': [
        '古墓丽影', 'Tomb Raider', '地平线', 'Horizon', '贝优妮塔', 'Bayonetta',
        '尼尔', 'NieR', '艾莉', 'Ellie', '最后生还者', 'Last of Us'
    ],
    # 恐怖惊悚
    'horror': [
        '生化危机', 'Resident Evil', '寂静岭', 'Silent Hill', '逃生', 'Outlast',
        '死亡空间', 'Dead Space', '恶灵附身', 'Evil Within', '失忆症', 'Amnesia',
        '港诡实录', '纸人', '烟火', '恐怖', 'Horror'
    ],
    # 枪战射击
    'shooter': [
        '使命召唤', 'Call of Duty', 'COD', '战地', 'Battlefield',
        '反恐精英', 'CS', 'Counter-Strike', 'DOOM', '毁灭战士',
        '光环', 'Halo', '命运', 'Destiny', '无主之地', 'Borderlands',
        '彩虹六号', 'Rainbow Six', '守望先锋', 'Overwatch'
    ],
    # 格斗对战
    'fighting': [
        '街霸', 'Street Fighter', '拳皇', 'King of Fighters', 'KOF',
        '铁拳', 'Tekken', '真人快打', 'Mortal Kombat', '罪恶装备', 'Guilty Gear',
        '龙珠', 'Dragon Ball', '任天堂明星大乱斗', 'Smash Bros'
    ],
    # 模拟经营
    'simulation': [
        '模拟城市', 'SimCity', '城市天际线', 'Cities Skylines',
        '过山车', 'RollerCoaster', '动物园', 'Zoo', '牧场物语', 'Story of Seasons',
        '星露谷', 'Stardew Valley', '双点医院', 'Two Point', '监狱建筑师'
    ],
    # 益智休闲
    'puzzle': [
        '俄罗斯方块', 'Tetris', '宝石迷阵', 'Bejeweled', '植物大战僵尸',
        '传送门', 'Portal', '见证者', 'Witness', '塔罗斯法则', 'Talos'
    ],
    # 真人互动
    'interactive': [
        '底特律', 'Detroit', '暴雨', 'Heavy Rain', '超凡双生', 'Beyond Two Souls',
        '隐形守护者', '晚班', 'Late Shift', 'FMV'
    ],
    # 竞速体育
    'racing': [
        '极限竞速', 'Forza', '极品飞车', 'Need for Speed', 'NFS',
        'GT赛车', 'Gran Turismo', 'F1', 'FIFA', 'NBA', 'PES', '实况足球',
        '马里奥赛车', 'Mario Kart'
    ],
    # 策略战略
    'strategy': [
        '星际争霸', 'StarCraft', '魔兽争霸', 'Warcraft', '红色警戒', 'Red Alert',
        '帝国时代', 'Age of Empires', '全面战争', 'Total War',
        '钢铁雄心', 'Hearts of Iron', '十字军之王', 'Crusader Kings',
        '欧陆风云', 'Europa Universalis'
    ],
    # 肉鸽游戏
    'roguelike': [
        '杀戮尖塔', 'Slay the Spire', '哈迪斯', 'Hades', '以撒', 'Isaac',
        '死亡细胞', 'Dead Cells', '挺进地牢', 'Enter the Gungeon',
        '暗黑地牢', 'Darkest Dungeon', '盗贼遗产', 'Rogue Legacy'
    ],
    # 虚拟现实
    'vr': [
        'VR', '虚拟现实', 'Beat Saber', 'Half-Life Alyx', 'Oculus', 'Quest'
    ],
    # 视觉小说
    'visual_novel': [
        'Galgame', 'AVG', '视觉小说', '命运石之门', 'Steins Gate',
        'CLANNAD', 'Fate', '月姬', 'Tsukihime', '白色相簿', 'White Album',
        '秋之回忆', 'Memories Off', '恋爱', '美少女'
    ],
    # 角色扮演
    'rpg': [
        '最终幻想', 'Final Fantasy', 'FF', '勇者斗恶龙', 'Dragon Quest',
        '女神异闻录', 'Persona', '传说', 'Tales of', '八方旅人', 'Octopath',
        '巫师', 'Witcher', '上古卷轴', 'Elder Scrolls', 'Skyrim',
        '辐射', 'Fallout', '博德之门', "Baldur's Gate", '神界原罪', 'Divinity',
        '暗黑破坏神', 'Diablo', '流放之路', 'Path of Exile'
    ]
}

def categorize_game(name: str, description: str = '') -> str:
    """根据游戏名称和描述判断类型"""
    text = f"{name} {description}".lower()
    
    for category, keywords in GAME_CATEGORIES.items():
        for keyword in keywords:
            if keyword.lower() in text:
                return category
    
    return None

def update_all_games():
    """更新所有游戏的类型"""
    db = SessionLocal()
    try:
        games = db.query(Game).all()
        print(f"找到 {len(games)} 个游戏")
        
        updated = 0
        for game in games:
            category = categorize_game(game.name, game.description or '')
            if category:
                old_category = game.category
                game.category = category
                print(f"✅ {game.name}: {old_category} -> {category}")
                updated += 1
            else:
                print(f"⚠️ {game.name}: 无法自动分类")
        
        db.commit()
        print(f"\n更新完成！共更新 {updated} 个游戏")
        
    finally:
        db.close()

if __name__ == '__main__':
    update_all_games()
