import sys
import os

# 禁用 Python 输出缓冲，确保 print 语句立即显示
sys.stdout.reconfigure(line_buffering=True) if hasattr(sys.stdout, 'reconfigure') else None
os.environ['PYTHONUNBUFFERED'] = '1'

from flask import Flask
from flask_cors import CORS
from routes.chat_routes_langgraph import bp as chat_bp
from routes.game_routes import bp as game_bp
from routes.upload_routes import bp as upload_bp
from routes.auth_routes import bp as auth_bp
from routes.chat_history_routes import bp as chat_history_bp
from middleware.logging_middleware import setup_logging

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# 配置
app.config['MAX_CONTENT_LENGTH'] = 500 * 1024 * 1024  # 500MB
app.config['SECRET_KEY'] = 'your-secret-key-here'

# 设置日志
setup_logging(app)

# 注册蓝图
app.register_blueprint(chat_bp, url_prefix='/api/chat')
app.register_blueprint(game_bp, url_prefix='/api/games')
app.register_blueprint(upload_bp, url_prefix='/api/upload')
app.register_blueprint(auth_bp)
app.register_blueprint(chat_history_bp)

@app.route('/')
def index():
    return {'message': 'Game Agent API is running'}

@app.route('/health')
def health():
    return {'status': 'healthy'}

if __name__ == '__main__':
    # 使用标准的 app.run 代替 socketio.run
    app.run(debug=True, host='0.0.0.0', port=5000)
