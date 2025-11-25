from flask import Blueprint, request, jsonify
from sqlalchemy import or_
from database.models import Game, SessionLocal

bp = Blueprint('games', __name__)

@bp.route('', methods=['GET'])
def get_games():
    """获取所有游戏"""
    try:
        db = SessionLocal()
        try:
            games = db.query(Game).all()
            return jsonify([game.to_dict() for game in games]), 200
        finally:
            db.close()
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/<int:game_id>', methods=['GET'])
def get_game(game_id):
    """获取单个游戏"""
    try:
        db = SessionLocal()
        try:
            game = db.query(Game).filter(Game.id == game_id).first()
            if not game:
                return jsonify({'error': 'Game not found'}), 404
            return jsonify(game.to_dict()), 200
        finally:
            db.close()
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/search', methods=['GET'])
def search_games():
    """搜索游戏"""
    try:
        query = request.args.get('q', '')
        if not query:
            return jsonify({'error': 'Query parameter required'}), 400
        
        db = SessionLocal()
        try:
            games = db.query(Game).filter(
                or_(
                    Game.name.ilike(f'%{query}%'),
                    Game.name_en.ilike(f'%{query}%'),
                    Game.description.ilike(f'%{query}%')
                )
            ).all()
            
            return jsonify([game.to_dict() for game in games]), 200
        finally:
            db.close()
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('', methods=['POST'])
def create_game():
    """创建游戏"""
    try:
        data = request.json
        
        db = SessionLocal()
        try:
            game = Game(
                name=data.get('name'),
                name_en=data.get('name_en'),
                description=data.get('description'),
                download_url=data.get('download_url'),
                cover_image=data.get('cover_image'),
                video_url=data.get('video_url'),
                file_size=data.get('file_size'),
                tags=data.get('tags')
            )
            
            db.add(game)
            db.commit()
            db.refresh(game)
            
            return jsonify(game.to_dict()), 201
        finally:
            db.close()
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/<int:game_id>', methods=['PUT'])
def update_game(game_id):
    """更新游戏"""
    try:
        data = request.json
        
        db = SessionLocal()
        try:
            game = db.query(Game).filter(Game.id == game_id).first()
            if not game:
                return jsonify({'error': 'Game not found'}), 404
            
            for key, value in data.items():
                if hasattr(game, key):
                    setattr(game, key, value)
            
            db.commit()
            db.refresh(game)
            
            return jsonify(game.to_dict()), 200
        finally:
            db.close()
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/<int:game_id>', methods=['DELETE'])
def delete_game(game_id):
    """删除游戏"""
    try:
        db = SessionLocal()
        try:
            game = db.query(Game).filter(Game.id == game_id).first()
            if not game:
                return jsonify({'error': 'Game not found'}), 404
            
            db.delete(game)
            db.commit()
            
            return jsonify({'message': 'Game deleted'}), 200
        finally:
            db.close()
    except Exception as e:
        return jsonify({'error': str(e)}), 500
