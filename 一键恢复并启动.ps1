# 一键恢复并启动脚本
Write-Host "🔧 开始恢复文件..." -ForegroundColor Cyan

# 设置路径
$backendPath = "D:\code\gameAgent\backend"
$frontendPath = "D:\code\gameAgent\frontend"

# 创建后端 chat_routes_langgraph.py
Write-Host "📝 创建 chat_routes_langgraph.py..." -ForegroundColor Yellow
$chatRoutesContent = @'
from flask import Blueprint, request, jsonify
from sqlalchemy import or_
from database.models import Game, SessionLocal
from langgraph.graph import StateGraph, END
from typing import TypedDict, List, Dict, Any
import os
import json
from openai import OpenAI

bp = Blueprint('chat_langgraph', __name__)
conversation_store = {}
graph_app = None

def get_openai_client():
    return OpenAI(
        api_key=os.getenv('QWEN_API_KEY'),
        base_url=os.getenv('QWEN_BASE_URL', 'https://dashscope.aliyuncs.com/compatible-mode/v1')
    )

class AgentState(TypedDict):
    messages: List[Dict[str, str]]
    user_query: str
    search_results: List[Dict[str, Any]]
    intent: str
    final_response: str

def search_games_tool(query: str) -> List[Dict[str, Any]]:
    db = SessionLocal()
    try:
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

def analyze_and_call_tools(state: AgentState) -> AgentState:
    user_query = state["user_query"]
    tools = [{
        "type": "function",
        "function": {
            "name": "search_games",
            "description": "搜索游戏数据库",
            "parameters": {
                "type": "object",
                "properties": {"query": {"type": "string", "description": "搜索关键词"}},
                "required": ["query"]
            }
        }
    }]
    
    system_prompt = "你是一个专业的游戏推荐助手。"
    messages = [{"role": "system", "content": system_prompt}, {"role": "user", "content": user_query}]
    client = get_openai_client()
    response = client.chat.completions.create(model=os.getenv('QWEN_MODEL', 'qwen3-max'), messages=messages, tools=tools, temperature=0.7)
    message = response.choices[0].message
    
    if message.tool_calls:
        tool_call = message.tool_calls[0]
        function_args = json.loads(tool_call.function.arguments)
        search_results = search_games_tool(function_args["query"])
        state["search_results"] = search_results
        state["intent"] = "search"
    else:
        state["search_results"] = []
        state["intent"] = "chat"
    
    state["messages"].append({"role": "assistant", "content": message.content or ""})
    return state

def generate_final_response(state: AgentState) -> AgentState:
    client = get_openai_client()
    system_prompt = "你是一个专业的游戏推荐助手。"
    messages = [{"role": "system", "content": system_prompt}] + state["messages"]
    response = client.chat.completions.create(model=os.getenv('QWEN_MODEL', 'qwen3-max'), messages=messages, temperature=0.7)
    state["final_response"] = response.choices[0].message.content
    return state

def create_graph():
    workflow = StateGraph(AgentState)
    workflow.add_node("analyze", analyze_and_call_tools)
    workflow.add_node("respond", generate_final_response)
    workflow.set_entry_point("analyze")
    workflow.add_edge("analyze", "respond")
    workflow.add_edge("respond", END)
    return workflow.compile()

try:
    print("🔧 Initializing LangGraph...")
    graph_app = create_graph()
    print("✅ LangGraph initialized successfully")
except Exception as e:
    print(f"❌ Failed to initialize LangGraph: {e}")

@bp.route('/message', methods=['POST'])
def send_message():
    global graph_app
    if graph_app is None:
        return jsonify({'error': 'LangGraph not initialized'}), 500
    
    try:
        data = request.json
        user_message = data.get('message', '')
        session_id = data.get('session_id', 'default')
        
        if not user_message:
            return jsonify({'error': 'Message is required'}), 400
        
        history = conversation_store.get(session_id, [])
        initial_state = {
            "messages": history + [{"role": "user", "content": user_message}],
            "user_query": user_message,
            "search_results": [],
            "intent": "",
            "final_response": ""
        }
        
        final_state = graph_app.invoke(initial_state)
        response_text = final_state["final_response"]
        search_results = final_state.get("search_results", [])
        
        history.append({'role': 'user', 'content': user_message})
        history.append({'role': 'assistant', 'content': response_text})
        conversation_store[session_id] = history[-10:]
        
        return jsonify({
            'response': response_text,
            'games': search_results,
            'intent': final_state.get("intent", "chat")
        }), 200
    except Exception as e:
        print(f"❌ Error: {e}")
        return jsonify({'error': str(e)}), 500

@bp.route('/clear', methods=['POST'])
def clear_history():
    try:
        data = request.json
        session_id = data.get('session_id', 'default')
        if session_id in conversation_store:
            del conversation_store[session_id]
        return jsonify({'message': 'History cleared'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
'@

Set-Content -Path "$backendPath\routes\chat_routes_langgraph.py" -Value $chatRoutesContent -Encoding UTF8

Write-Host "✅ 文件恢复完成！" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 启动后端..." -ForegroundColor Cyan

# 启动后端
cd $backendPath
& ".\venv\Scripts\python.exe" app.py
