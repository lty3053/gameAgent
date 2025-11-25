from flask import Blueprint, request, jsonify
from services.storage_service import StorageService
from database.models import Game, SessionLocal
import os

bp = Blueprint('upload', __name__)
storage_service = StorageService()

@bp.route('/save', methods=['POST'])
def save_upload():
    """保存上传记录到数据库"""
    try:
        data = request.json
        
        db = SessionLocal()
        try:
            game = Game(
                name=data.get('filename', 'Unknown'),
                name_en=data.get('name_en'),
                description=data.get('description'),
                game_file_url=data.get('url'),
                file_size=str(data.get('size', 0))  # 转换为字符串
            )
            
            db.add(game)
            db.commit()
            db.refresh(game)
            
            return jsonify({
                'message': 'Upload saved successfully',
                'game': game.to_dict()
            }), 201
        finally:
            db.close()
    except Exception as e:
        print(f"Error saving upload: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

# 内存中存储上传进度
upload_progress_store = {}

@bp.route('/progress/<upload_id>', methods=['GET'])
def get_progress(upload_id):
    """获取上传进度"""
    progress = upload_progress_store.get(upload_id, {'percent': 0, 'status': 'unknown'})
    return jsonify(progress)

@bp.route('/file', methods=['POST'])
def upload_file():
    """上传游戏文件到 S3（后端上传，支持轮询进度）"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # 获取表单数据
        game_name = request.form.get('name', file.filename)
        description = request.form.get('description')
        upload_id = request.form.get('upload_id', 'default')
        cover_image_file = request.files.get('cover_image')  # 封面图片
        
        # 初始化进度
        upload_progress_store[upload_id] = {
            'percent': 0, 
            'status': 'uploading',
            'uploaded': 0,
            'total': 0
        }
        
        # 定义进度回调
        def progress_callback(uploaded, total, percent):
            # 更新内存进度
            upload_progress_store[upload_id] = {
                'percent': percent,
                'status': 'uploading',
                'uploaded': uploaded,
                'total': total
            }
            
            # 打印进度日志
            print(f"🔔 Progress: {percent}% for {upload_id}", flush=True)
        
        # 上传到 S3
        result = storage_service.upload_file(file, 'games', progress_callback)
        
        if not result['success']:
            upload_progress_store[upload_id] = {'percent': 0, 'status': 'error', 'error': result.get('error')}
            return jsonify({'error': result.get('error', 'Upload failed')}), 500
        
        # 如果有封面图片，也上传到 S3
        cover_image_url = None
        if cover_image_file and cover_image_file.filename:
            cover_result = storage_service.upload_file(cover_image_file, 'covers')
            if cover_result['success']:
                cover_image_url = cover_result['url']
        
        # 上传成功，更新进度
        upload_progress_store[upload_id] = {'percent': 100, 'status': 'processing'}
        
        # 保存到数据库
        db = SessionLocal()
        try:
            game = Game(
                name=game_name,
                description=description,
                game_file_url=result['url'],
                cover_image_url=cover_image_url,
                storage_type='s3',
                file_size=str(request.content_length or 0)
            )
            
            db.add(game)
            db.commit()
            db.refresh(game)
            
            # 最终完成状态
            upload_progress_store[upload_id] = {
                'percent': 100, 
                'status': 'completed', 
                'game': game.to_dict()
            }
            
            return jsonify({
                'message': 'File uploaded successfully',
                'url': result['url'],
                'game': game.to_dict()
            }), 200
        finally:
            db.close()
            
    except Exception as e:
        print(f"Error uploading file: {e}")
        import traceback
        traceback.print_exc()
        upload_progress_store[request.form.get('upload_id', 'default')] = {
            'percent': 0, 
            'status': 'error', 
            'error': str(e)
        }
        return jsonify({'error': str(e)}), 500

@bp.route('/netdisk', methods=['POST'])
def upload_netdisk():
    """保存网盘分享链接（不上传文件）"""
    try:
        # 从 form data 获取数据（因为可能包含文件）
        game_name = request.form.get('name')
        description = request.form.get('description')
        netdisk_url = request.form.get('netdisk_url')
        netdisk_type = request.form.get('netdisk_type')
        file_size = request.form.get('file_size', '未知')
        upload_id = request.form.get('upload_id', 'default')
        cover_image_file = request.files.get('cover_image')
        
        # 验证必填字段
        if not game_name:
            return jsonify({'error': '游戏名称不能为空'}), 400
        if not netdisk_url:
            return jsonify({'error': '网盘链接不能为空'}), 400
        if not netdisk_type:
            return jsonify({'error': '网盘类型不能为空'}), 400
        
        # 如果有封面图片，上传到 S3
        cover_image_url = None
        if cover_image_file and cover_image_file.filename:
            cover_result = storage_service.upload_file(cover_image_file, 'covers')
            if cover_result['success']:
                cover_image_url = cover_result['url']
        
        # 初始化进度（网盘链接模式无需上传，直接完成）
        upload_progress_store[upload_id] = {
            'percent': 100, 
            'status': 'processing'
        }
        
        # 保存到数据库
        db = SessionLocal()
        try:
            game = Game(
                name=game_name,
                description=description,
                game_file_url=netdisk_url,
                cover_image_url=cover_image_url,
                storage_type='netdisk',
                netdisk_type=netdisk_type,  # 'quark', 'baidu', etc.
                file_size=file_size
            )
            
            db.add(game)
            db.commit()
            db.refresh(game)
            
            # 最终完成状态
            upload_progress_store[upload_id] = {
                'percent': 100, 
                'status': 'completed', 
                'game': game.to_dict()
            }
            
            print(f"✅ Netdisk link saved: {netdisk_type} - {game_name}", flush=True)
            
            return jsonify({
                'message': '网盘链接保存成功',
                'game': game.to_dict()
            }), 200
        finally:
            db.close()
            
    except Exception as e:
        print(f"Error saving netdisk link: {e}")
        import traceback
        traceback.print_exc()
        upload_progress_store[upload_id] = {
            'percent': 0, 
            'status': 'error', 
            'error': str(e)
        }
        return jsonify({'error': str(e)}), 500

@bp.route('/image', methods=['POST'])
def upload_image():
    """上传图片"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        result = storage_service.upload_file(file, 'images')
        
        if not result['success']:
            return jsonify({'error': result.get('error', 'Upload failed')}), 500
        
        return jsonify({
            'message': 'Image uploaded successfully',
            'url': result['url']
        }), 200
        
    except Exception as e:
        print(f"Error uploading image: {e}")
        return jsonify({'error': str(e)}), 500

@bp.route('/video', methods=['POST'])
def upload_video():
    """上传视频"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        result = storage_service.upload_file(file, 'videos')
        
        if not result['success']:
            return jsonify({'error': result.get('error', 'Upload failed')}), 500
        
        return jsonify({
            'message': 'Video uploaded successfully',
            'url': result['url']
        }), 200
        
    except Exception as e:
        print(f"Error uploading video: {e}")
        return jsonify({'error': str(e)}), 500
