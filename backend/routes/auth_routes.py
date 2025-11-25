"""
用户认证路由
"""
from flask import Blueprint, request, jsonify
from database.models import User, SessionLocal
from werkzeug.security import generate_password_hash, check_password_hash
import uuid

bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@bp.route('/guest', methods=['POST'])
def create_guest():
    """创建游客账号"""
    try:
        db = SessionLocal()
        try:
            # 生成唯一的 user_key
            user_key = f"guest_{uuid.uuid4().hex[:16]}"
            
            # 创建游客用户
            user = User(
                user_key=user_key,
                is_guest=True
            )
            
            db.add(user)
            db.commit()
            db.refresh(user)
            
            return jsonify({
                'success': True,
                'user': user.to_dict()
            }), 200
        finally:
            db.close()
    except Exception as e:
        print(f"Error creating guest: {e}")
        return jsonify({'error': str(e)}), 500

@bp.route('/register', methods=['POST'])
def register():
    """注册新用户"""
    try:
        data = request.json
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({'error': '邮箱和密码不能为空'}), 400
        
        db = SessionLocal()
        try:
            # 检查邮箱是否已存在
            existing_user = db.query(User).filter(User.email == email).first()
            if existing_user:
                return jsonify({'error': '该邮箱已被注册'}), 400
            
            # 生成唯一的 user_key
            user_key = f"user_{uuid.uuid4().hex[:16]}"
            
            # 创建新用户
            user = User(
                user_key=user_key,
                email=email,
                password_hash=generate_password_hash(password),
                is_guest=False
            )
            
            db.add(user)
            db.commit()
            db.refresh(user)
            
            return jsonify({
                'success': True,
                'user': user.to_dict()
            }), 200
        finally:
            db.close()
    except Exception as e:
        print(f"Error registering user: {e}")
        return jsonify({'error': str(e)}), 500

@bp.route('/login', methods=['POST'])
def login():
    """用户登录"""
    try:
        data = request.json
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({'error': '邮箱和密码不能为空'}), 400
        
        db = SessionLocal()
        try:
            # 查找用户
            user = db.query(User).filter(User.email == email).first()
            
            if not user:
                return jsonify({'error': '用户不存在'}), 404
            
            # 验证密码
            if not check_password_hash(user.password_hash, password):
                return jsonify({'error': '密码错误'}), 401
            
            # 更新最后活跃时间
            from datetime import datetime
            user.last_active = datetime.utcnow()
            db.commit()
            db.refresh(user)
            
            return jsonify({
                'success': True,
                'user': user.to_dict()
            }), 200
        finally:
            db.close()
    except Exception as e:
        print(f"Error logging in: {e}")
        return jsonify({'error': str(e)}), 500

@bp.route('/verify', methods=['POST'])
def verify_user():
    """验证用户 key 是否有效"""
    try:
        data = request.json
        user_key = data.get('user_key')
        
        if not user_key:
            return jsonify({'error': 'user_key 不能为空'}), 400
        
        db = SessionLocal()
        try:
            user = db.query(User).filter(User.user_key == user_key).first()
            
            if not user:
                return jsonify({'error': '用户不存在'}), 404
            
            # 更新最后活跃时间
            from datetime import datetime
            user.last_active = datetime.utcnow()
            db.commit()
            db.refresh(user)
            
            return jsonify({
                'success': True,
                'user': user.to_dict()
            }), 200
        finally:
            db.close()
    except Exception as e:
        print(f"Error verifying user: {e}")
        return jsonify({'error': str(e)}), 500
