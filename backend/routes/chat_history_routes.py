"""
对话历史路由
"""
import json
from flask import Blueprint, request, jsonify
from database.models import User, ChatHistory, Game, SessionLocal

bp = Blueprint('chat_history', __name__, url_prefix='/api/chat/history')

@bp.route('/<user_key>', methods=['GET'])
def get_history(user_key):
    """获取用户的对话历史"""
    try:
        db = SessionLocal()
        try:
            # 查找用户
            user = db.query(User).filter(User.user_key == user_key).first()
            if not user:
                return jsonify({'error': '用户不存在'}), 404
            
            # 获取对话历史（按时间排序）
            histories = db.query(ChatHistory)\
                .filter(ChatHistory.user_id == user.id)\
                .order_by(ChatHistory.created_at.asc())\
                .all()
            
            # 构建返回数据，包含关联的游戏信息
            result = []
            for h in histories:
                history_dict = h.to_dict()
                
                # 如果有关联的游戏 ID，查询游戏信息
                if h.game_ids:
                    try:
                        game_ids = json.loads(h.game_ids)
                        games = db.query(Game).filter(Game.id.in_(game_ids)).all()
                        history_dict['games'] = [g.to_dict() for g in games]
                    except:
                        history_dict['games'] = []
                else:
                    history_dict['games'] = []
                
                result.append(history_dict)
            
            return jsonify({
                'success': True,
                'histories': result
            }), 200
        finally:
            db.close()
    except Exception as e:
        print(f"Error getting history: {e}")
        return jsonify({'error': str(e)}), 500

@bp.route('/<user_key>', methods=['POST'])
def save_message(user_key):
    """保存一条对话消息"""
    try:
        data = request.json
        role = data.get('role')  # 'user' or 'assistant'
        content = data.get('content')
        
        if not role or not content:
            return jsonify({'error': 'role 和 content 不能为空'}), 400
        
        db = SessionLocal()
        try:
            # 查找用户
            user = db.query(User).filter(User.user_key == user_key).first()
            if not user:
                return jsonify({'error': '用户不存在'}), 404
            
            # 保存消息
            history = ChatHistory(
                user_id=user.id,
                role=role,
                content=content
            )
            
            db.add(history)
            db.commit()
            db.refresh(history)
            
            return jsonify({
                'success': True,
                'history': history.to_dict()
            }), 200
        finally:
            db.close()
    except Exception as e:
        print(f"Error saving message: {e}")
        return jsonify({'error': str(e)}), 500

@bp.route('/<user_key>', methods=['DELETE'])
def clear_history(user_key):
    """清空用户的对话历史"""
    try:
        db = SessionLocal()
        try:
            # 查找用户
            user = db.query(User).filter(User.user_key == user_key).first()
            if not user:
                return jsonify({'error': '用户不存在'}), 404
            
            # 删除所有对话历史
            db.query(ChatHistory)\
                .filter(ChatHistory.user_id == user.id)\
                .delete()
            
            db.commit()
            
            return jsonify({
                'success': True,
                'message': '对话历史已清空'
            }), 200
        finally:
            db.close()
    except Exception as e:
        print(f"Error clearing history: {e}")
        return jsonify({'error': str(e)}), 500
