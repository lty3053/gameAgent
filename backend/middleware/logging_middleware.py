import logging
import sys
from flask import request, g
import time
import traceback

def setup_logging(app):
    """设置 Flask 应用的日志系统"""
    
    # 配置根日志记录器
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s [%(levelname)s] %(message)s',
        datefmt='%H:%M:%S',
        handlers=[
            logging.StreamHandler(sys.stdout)
        ]
    )
    
    logger = logging.getLogger(__name__)
    
    @app.before_request
    def before_request():
        """请求前记录"""
        g.start_time = time.time()
        
        # 记录请求信息
        logger.info(f"📨 {request.method} {request.path}")
        
        # 记录查询参数
        if request.args:
            logger.info(f"   Query: {dict(request.args)}")
        
        # 记录 JSON body (如果有)
        if request.is_json:
            try:
                data = request.get_json()
                # 隐藏敏感信息
                safe_data = {k: v if k not in ['password', 'token', 'secret'] else '***' 
                           for k, v in data.items()}
                logger.info(f"   Body: {safe_data}")
            except:
                pass
        
        # 记录文件上传
        if request.files:
            files_info = {name: file.filename for name, file in request.files.items()}
            logger.info(f"   Files: {files_info}")
    
    @app.after_request
    def after_request(response):
        """请求后记录"""
        if hasattr(g, 'start_time'):
            elapsed = time.time() - g.start_time
            logger.info(f"✅ {request.method} {request.path} - {response.status_code} ({elapsed:.3f}s)")
        return response
    
    @app.errorhandler(Exception)
    def handle_exception(e):
        """捕获所有未处理的异常"""
        logger.error(f"❌ Unhandled Exception: {type(e).__name__}: {str(e)}")
        logger.error(traceback.format_exc())
        
        return {
            'error': str(e),
            'type': type(e).__name__
        }, 500
    
    logger.info("✅ Logging system initialized successfully!")
    
    return app
