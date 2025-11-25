from flask import Blueprint, request, jsonify
from sqlalchemy import or_
from database.models import Game, User, ChatHistory, SessionLocal
from langgraph.graph import StateGraph, END
from typing import TypedDict, List, Dict, Any
import os
import json
from openai import OpenAI
from dotenv import load_dotenv
import httpx

# 加载环境变量
load_dotenv()

bp = Blueprint('chat_langgraph', __name__)

# 全局变量存储对话历史
conversation_store = {}

# 全局 LangGraph 实例
graph_app = None

def get_openai_client():
    """获取 OpenAI 客户端（禁用代理以避免兼容性问题）"""
    # 创建一个不使用代理的 httpx 客户端
    http_client = httpx.Client(
        timeout=60.0,
        limits=httpx.Limits(max_keepalive_connections=5, max_connections=10)
    )
    
    return OpenAI(
        api_key=os.getenv('QWEN_API_KEY'),
        base_url=os.getenv('QWEN_BASE_URL', 'https://dashscope.aliyuncs.com/compatible-mode/v1'),
        http_client=http_client
    )

# 定义状态类型
class AgentState(TypedDict):
    messages: List[Dict[str, str]]
    user_query: str
    search_results: List[Dict[str, Any]]
    intent: str
    final_response: str

# 工具定义
def search_games_tool(query: str) -> List[Dict[str, Any]]:
    """搜索游戏数据库"""
    db = SessionLocal()
    try:
        # 处理通用查询，返回最近的游戏
        generic_terms = ['游戏', '游戏库', '推荐', '所有', '列表', '有什么']
        if not query or query in generic_terms or '游戏库' in query:
            games = db.query(Game).order_by(Game.created_at.desc()).limit(5).all()
        else:
            # 模糊搜索
            games = db.query(Game).filter(
                or_(
                    Game.name.ilike(f'%{query}%'),
                    Game.name_en.ilike(f'%{query}%'),
                    Game.description.ilike(f'%{query}%')
                )
            ).limit(5).all()
        
        return [game.to_dict() for game in games]
    finally:
        db.close()

# Agent 节点
def analyze_and_call_tools(state: AgentState) -> AgentState:
    """分析用户意图并调用工具"""
    user_query = state["user_query"]
    
    # 定义工具
    tools = [
        {
            "type": "function",
            "function": {
                "name": "search_games",
                "description": "搜索游戏数据库，根据游戏名称、英文名或描述查找游戏",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "query": {
                            "type": "string",
                            "description": "搜索关键词，可以是游戏名称或相关描述"
                        }
                    },
                    "required": ["query"]
                }
            }
        }
    ]
    
    # 构建消息
    system_prompt = """你是一个专业的游戏推荐助手。
    
你的任务：
1. 分析用户的意图
2. 如果用户想要搜索或了解游戏，使用 search_games 工具
3. 如果用户只是闲聊，直接回复即可

注意：
- 用户提到具体游戏名时，务必调用 search_games
- 用户询问"有什么游戏"、"推荐游戏"时，也要调用 search_games
- 保持友好、专业的语气"""
    
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_query}
    ]
    
    client = get_openai_client()
    
    # 调用 OpenAI with tools
    response = client.chat.completions.create(
        model=os.getenv('QWEN_MODEL', 'qwen3-max'),
        messages=messages,
        tools=tools,
        temperature=0.7
    )
    
    message = response.choices[0].message
    
    # 检查是否需要调用工具
    if message.tool_calls:
        tool_call = message.tool_calls[0]
        function_name = tool_call.function.name
        function_args = json.loads(tool_call.function.arguments)
        
        print(f"🔧 Tool called: {function_name} with args: {function_args}")
        
        if function_name == "search_games":
            search_results = search_games_tool(function_args["query"])
            state["search_results"] = search_results
            state["intent"] = "search"
            print(f"✅ Found {len(search_results)} games")
        else:
            state["search_results"] = []
            state["intent"] = "chat"
    else:
        state["search_results"] = []
        state["intent"] = "chat"
        print("💬 No tool call needed, direct chat")
    
    # 保存 AI 的响应消息
    state["messages"].append({
        "role": "assistant",
        "content": message.content or ""
    })
    
    return state

def generate_final_response(state: AgentState) -> AgentState:
    """生成最终响应"""
    user_query = state["user_query"]
    search_results = state.get("search_results", [])
    intent = state.get("intent", "chat")
    
    client = get_openai_client()
    
    if intent == "search" and search_results:
        # 有搜索结果时，让 AI 介绍游戏
        games_info = "\n".join([
            f"- {g['name']}: {g.get('description', '暂无描述')[:100]} "
            f"[存储方式: {'网盘(' + g.get('netdisk_type', '未知') + ')' if g.get('storage_type') == 'netdisk' else 'S3直传'}]"
            for g in search_results[:5]
        ])
        
        system_prompt = f"""你是一个专业的游戏推荐助手。用户询问："{user_query}"

找到以下游戏：
{games_info}

请用友好、专业的语气介绍这些游戏，突出它们的特点。保持简洁，每个游戏2-3句话。
如果游戏是通过网盘分享的，请在介绍时说明网盘类型（如"夸克网盘"、"百度网盘"等）。
如果用户明确想要下载链接，告诉他们可以点击游戏卡片查看详情和下载。"""
    else:
        # 没有搜索结果或纯聊天
        system_prompt = f"""你是一个专业的游戏推荐助手。用户说："{user_query}"

请友好地回应用户。如果数据库中没有相关游戏，提示他们可以通过"上传游戏"按钮添加游戏。保持对话自然、友好。"""
    
    messages = [{"role": "system", "content": system_prompt}] + state["messages"]
    
    response = client.chat.completions.create(
        model=os.getenv('QWEN_MODEL', 'qwen3-max'),
        messages=messages,
        temperature=0.7
    )
    
    final_text = response.choices[0].message.content
    state["final_response"] = final_text
    
    return state

def create_graph():
    """创建 LangGraph 工作流"""
    workflow = StateGraph(AgentState)
    
    # 添加节点
    workflow.add_node("analyze", analyze_and_call_tools)
    workflow.add_node("respond", generate_final_response)
    
    # 设置入口
    workflow.set_entry_point("analyze")
    
    # 添加边
    workflow.add_edge("analyze", "respond")
    workflow.add_edge("respond", END)
    
    return workflow.compile()

# 初始化 LangGraph
try:
    print("🔧 Initializing LangGraph...")
    graph_app = create_graph()
    print("✅ LangGraph initialized successfully")
except Exception as e:
    print(f"❌ Failed to initialize LangGraph: {e}")
    import traceback
    traceback.print_exc()

@bp.route('/message', methods=['POST'])
def send_message():
    """发送消息到AI"""
    global graph_app
    
    if graph_app is None:
        return jsonify({'error': 'LangGraph not initialized'}), 500
    
    try:
        data = request.json
        user_message = data.get('message', '')
        user_key = data.get('user_key')  # 用户标识
        
        if not user_message:
            return jsonify({'error': 'Message is required'}), 400
        
        if not user_key:
            return jsonify({'error': 'user_key is required'}), 400
        
        print(f"\n{'='*50}")
        print(f"📨 New message from user {user_key}: {user_message}")
        
        # 从数据库加载对话历史
        db = SessionLocal()
        try:
            user = db.query(User).filter(User.user_key == user_key).first()
            if not user:
                return jsonify({'error': '用户不存在'}), 404
            
            # 获取最近的对话历史（最多20条）
            histories = db.query(ChatHistory)\
                .filter(ChatHistory.user_id == user.id)\
                .order_by(ChatHistory.created_at.desc())\
                .limit(20)\
                .all()
            
            # 反转顺序（从旧到新）
            history = [{'role': h.role, 'content': h.content} for h in reversed(histories)]
            
            # 构建初始状态
            initial_state = {
                "messages": history + [{"role": "user", "content": user_message}],
                "user_query": user_message,
                "search_results": [],
                "intent": "",
                "final_response": ""
            }
            
            # 运行 LangGraph
            print("🤖 Running LangGraph workflow...")
            final_state = graph_app.invoke(initial_state)
            
            response_text = final_state["final_response"]
            search_results = final_state.get("search_results", [])
            
            print(f"✅ Response generated: {response_text[:100]}...")
            print(f"📊 Games found: {len(search_results)}")
            
            # 保存用户消息到数据库
            user_history = ChatHistory(
                user_id=user.id,
                role='user',
                content=user_message
            )
            db.add(user_history)
            
            # 保存 AI 响应到数据库
            assistant_history = ChatHistory(
                user_id=user.id,
                role='assistant',
                content=response_text
            )
            db.add(assistant_history)
            db.commit()
            
            print(f"💾 Conversation saved to database for user {user_key}")
            
            return jsonify({
                'response': response_text,
                'games': search_results,
                'intent': final_state.get("intent", "chat")
            }), 200
        finally:
            db.close()
        
    except Exception as e:
        print(f"❌ Error in chat: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@bp.route('/clear', methods=['POST'])
def clear_history():
    """清空对话历史"""
    try:
        data = request.json
        session_id = data.get('session_id', 'default')
        
        if session_id in conversation_store:
            del conversation_store[session_id]
        
        return jsonify({'message': 'History cleared'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
