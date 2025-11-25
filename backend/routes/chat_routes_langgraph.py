from flask import Blueprint, request, jsonify, Response, stream_with_context
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
    all_games_list: List[Dict[str, Any]]  # 所有游戏列表（用于 AI 参考）
    intent: str
    final_response: str

# 游戏类型映射（用于 AI 识别用户意图）
CATEGORY_KEYWORDS = {
    'action': ['动作', '冒险', 'action', 'adventure'],
    'turn_based': ['回合', '战棋', 'turn-based', 'tactical', 'srpg'],
    'wuxia': ['国风', '仙侠', '武侠', '修仙', 'wuxia', 'chinese'],
    'retro': ['复古', '经典', '怀旧', 'retro', 'classic'],
    'female_lead': ['女性', '女主', 'female', 'heroine'],
    'utility': ['工具', '实用', 'utility', 'tool'],
    'horror': ['恐怖', '惊悚', 'horror', 'thriller', 'scary'],
    'shooter': ['射击', '枪战', 'fps', 'shooter', 'gun'],
    'fighting': ['格斗', '对战', 'fighting', 'versus'],
    'simulation': ['模拟', '经营', 'simulation', 'management', 'tycoon'],
    'puzzle': ['益智', '休闲', 'puzzle', 'casual'],
    'interactive': ['真人', '互动', 'interactive', 'fmv'],
    'racing': ['竞速', '体育', '赛车', 'racing', 'sports'],
    'strategy': ['策略', '战略', 'strategy', 'rts'],
    'roguelike': ['肉鸽', 'roguelike', 'roguelite', 'rogue'],
    'vr': ['vr', '虚拟现实', 'virtual reality'],
    'visual_novel': ['视觉小说', 'galgame', 'visual novel', 'avg'],
    'rpg': ['rpg', '角色扮演', 'role-playing']
}

def detect_category(query: str) -> str:
    """从用户查询中检测游戏类型"""
    query_lower = query.lower()
    for category, keywords in CATEGORY_KEYWORDS.items():
        for keyword in keywords:
            if keyword in query_lower:
                return category
    return None

# 计算字符串相似度（简单的编辑距离）
def similarity_score(s1: str, s2: str) -> float:
    """计算两个字符串的相似度（0-1）"""
    s1, s2 = s1.lower(), s2.lower()
    if s1 == s2:
        return 1.0
    if not s1 or not s2:
        return 0.0
    
    # 检查是否包含
    if s1 in s2 or s2 in s1:
        return 0.8
    
    # 计算共同字符比例
    common = sum(1 for c in s1 if c in s2)
    return common / max(len(s1), len(s2))

# 工具定义
def search_games_tool(query: str) -> List[Dict[str, Any]]:
    """搜索游戏数据库（支持模糊匹配）"""
    db = SessionLocal()
    try:
        # 检测是否按类型搜索
        detected_category = detect_category(query)
        
        # 处理通用查询，返回最近的游戏
        generic_terms = ['游戏', '游戏库', '推荐', '所有', '列表', '有什么']
        
        if detected_category:
            # 按类型搜索
            games = db.query(Game).filter(
                Game.category == detected_category
            ).order_by(Game.created_at.desc()).limit(5).all()
            
            if not games:
                return []
        elif not query or query in generic_terms or '游戏库' in query:
            games = db.query(Game).order_by(Game.created_at.desc()).limit(5).all()
        else:
            # 先尝试精确模糊搜索
            games = db.query(Game).filter(
                or_(
                    Game.name.ilike(f'%{query}%'),
                    Game.name_en.ilike(f'%{query}%'),
                    Game.description.ilike(f'%{query}%')
                )
            ).limit(5).all()
            
            # 如果没找到，尝试相似度匹配
            if not games:
                all_games = db.query(Game).all()
                scored_games = []
                for game in all_games:
                    # 计算与游戏名的相似度
                    name_score = similarity_score(query, game.name)
                    name_en_score = similarity_score(query, game.name_en or '')
                    max_score = max(name_score, name_en_score)
                    if max_score >= 0.5:  # 相似度阈值
                        scored_games.append((game, max_score))
                
                # 按相似度排序
                scored_games.sort(key=lambda x: x[1], reverse=True)
                games = [g[0] for g in scored_games[:5]]
        
        return [game.to_dict() for game in games]
    finally:
        db.close()

def list_all_games_tool() -> List[Dict[str, Any]]:
    """列出游戏库中所有游戏的名称"""
    db = SessionLocal()
    try:
        games = db.query(Game).order_by(Game.created_at.desc()).all()
        return [{'id': g.id, 'name': g.name, 'name_en': g.name_en} for g in games]
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
                "description": "搜索游戏数据库，支持模糊匹配。即使用户输入的名称有错别字或不完整，也能找到相似的游戏。",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "query": {
                            "type": "string",
                            "description": "搜索关键词，可以是游戏名称（支持模糊匹配）、英文名或相关描述"
                        }
                    },
                    "required": ["query"]
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "list_all_games",
                "description": "列出游戏库中所有游戏的名称列表，用于查看库中有哪些游戏，或者当搜索失败时查找相似名称",
                "parameters": {
                    "type": "object",
                    "properties": {},
                    "required": []
                }
            }
        }
    ]
    
    # 构建消息
    system_prompt = """你是一个私人游戏库管理助手。

你的任务：
1. 分析用户的意图
2. 如果用户想要搜索或了解游戏，使用 search_games 工具（支持模糊匹配）
3. 如果搜索没有结果，可以用 list_all_games 查看库中所有游戏，找到名称相似的
4. 如果用户只是闲聊，直接回复即可

重要提示：
- 用户提到的游戏名可能有错别字或不完整，search_games 支持模糊匹配
- 例如用户说"康斯坦斯"，可能是指"康斯坦丝"，工具会自动匹配
- 如果第一次搜索没结果，尝试用不同的关键词再搜索一次
- 用户询问"有什么游戏"、"推荐游戏"时，调用 search_games
- 游戏库是实时更新的，每次搜索都会获取最新数据
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
        function_args = json.loads(tool_call.function.arguments) if tool_call.function.arguments else {}
        
        print(f"🔧 Tool called: {function_name} with args: {function_args}")
        
        if function_name == "search_games":
            search_results = search_games_tool(function_args.get("query", ""))
            state["search_results"] = search_results
            state["intent"] = "search"
            print(f"✅ Found {len(search_results)} games")
            
            # 关键：如果搜索没有结果，自动获取所有游戏供 AI 参考
            # 这样 AI 就不会编造不存在的游戏
            if not search_results:
                all_games = list_all_games_tool()
                state["all_games_list"] = all_games
                print(f"📋 No search results, loaded {len(all_games)} games for reference")
        elif function_name == "list_all_games":
            all_games = list_all_games_tool()
            state["search_results"] = []
            state["intent"] = "list"
            state["all_games_list"] = all_games
            print(f"📋 Listed {len(all_games)} games in library")
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
            f"- {g['name']}: {g.get('description', '暂无描述')[:100]}"
            for g in search_results[:5]
        ])
        
        system_prompt = f"""你是一个私人游戏库管理助手。这是用户自己上传的游戏资源库。

用户询问："{user_query}"

已从用户的游戏库中找到以下游戏：
{games_info}

回复要求：
1. 直接告诉用户"已找到XXX"，引导用户点击下方卡片下载
2. 可以简单介绍游戏特点（1-2句话）
3. 不要提及版权、购买、正版等话题，这是用户自己的私人资源库
4. 保持简洁友好，不要说教"""
    else:
        # 没有搜索结果或纯聊天
        system_prompt = f"""你是一个私人游戏库管理助手。用户说："{user_query}"

请友好地回应用户。如果游戏库中没有找到相关游戏，告诉用户可以点击右上角"上传游戏"按钮添加。
不要提及版权、购买等话题。"""
    
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
                "all_games_list": [],
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
                'games': search_results[:2],  # 卡片最多显示2个
                'intent': final_state.get("intent", "chat")
            }), 200
        finally:
            db.close()
        
    except Exception as e:
        print(f"❌ Error in chat: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@bp.route('/stream', methods=['POST'])
def stream_chat():
    """流式发送消息到AI"""
    try:
        data = request.json
        user_message = data.get('message', '')
        user_key = data.get('user_key')
        
        if not user_message or not user_key:
            return jsonify({'error': 'Missing required fields'}), 400
            
        def generate():
            db = SessionLocal()
            try:
                user = db.query(User).filter(User.user_key == user_key).first()
                if not user:
                    yield f"data: {json.dumps({'error': 'User not found'})}\n\n"
                    return

                # 1. 加载历史
                histories = db.query(ChatHistory)\
                    .filter(ChatHistory.user_id == user.id)\
                    .order_by(ChatHistory.created_at.desc())\
                    .limit(20)\
                    .all()
                history = [{'role': h.role, 'content': h.content} for h in reversed(histories)]
                
                # 2. 构建状态并分析意图
                initial_state = {
                    "messages": history + [{"role": "user", "content": user_message}],
                    "user_query": user_message,
                    "search_results": [],
                    "all_games_list": [],
                    "intent": "",
                    "final_response": ""
                }
                
                # 发送"正在分析"状态
                yield f"data: {json.dumps({'type': 'status', 'data': 'analyzing'})}\n\n"
                
                # 调用分析函数（复用现有的逻辑）
                analyzed_state = analyze_and_call_tools(initial_state)
                search_results = analyzed_state.get("search_results", [])
                intent = analyzed_state.get("intent", "chat")
                
                # 3. 构建最终提示词
                all_games_list = analyzed_state.get("all_games_list", [])
                
                # 如果有游戏结果，先发送搜索状态，再发送结果（卡片最多显示2个）
                if search_results:
                    yield f"data: {json.dumps({'type': 'status', 'data': 'searching'})}\n\n"
                    yield f"data: {json.dumps({'type': 'games', 'data': search_results[:2]})}\n\n"
                elif all_games_list and intent == "search":
                    # 搜索没结果但有游戏库，获取所有游戏的完整信息供 AI 选择
                    all_full_games = db.query(Game).all()
                    all_games_dict = {g.name: g.to_dict() for g in all_full_games}
                    # 先不发送卡片，等 AI 回复后再处理
                
                if intent == "search" and search_results:
                    games_info = "\n".join([
                        f"- {g['name']}: {g.get('description', '暂无描述')[:100]}"
                        for g in search_results[:5]
                    ])
                    system_prompt = f"""你是一个私人游戏库管理助手。这是用户自己上传的游戏资源库。

用户询问："{user_message}"

已从用户的游戏库中找到以下游戏：
{games_info}

回复要求：
1. 直接告诉用户"已找到XXX"，引导用户点击下方卡片下载
2. 可以简单介绍游戏特点（1-2句话）
3. 不要提及版权、购买、正版等话题，这是用户自己的私人资源库
4. 保持简洁友好，不要说教"""
                elif all_games_list:
                    # 搜索没有精确结果，但有游戏库列表，让 AI 从中选择推荐
                    # 获取完整游戏信息（包含描述）供 AI 参考
                    all_full_games = db.query(Game).all()
                    games_with_desc = "\n".join([
                        f"- 《{g.name}》: {(g.description or '暂无描述')[:80]}"
                        for g in all_full_games
                    ])
                    system_prompt = f"""你是一个私人游戏库管理助手。这是用户自己上传的游戏资源库。

用户询问："{user_message}"

搜索没有找到精确匹配的游戏。以下是用户游戏库中的所有游戏及简介：
{games_with_desc}

重要规则：
1. 你只能推荐上面列表中存在的游戏，绝对不能编造或推荐列表中没有的游戏！
2. 根据用户的需求，从列表中选择最合适的1-2款游戏推荐
3. 推荐时请使用书名号《》包裹游戏名称，如《神之天平》
4. 简单介绍为什么推荐这款游戏
5. 如果列表中确实没有符合用户需求的游戏，诚实告诉用户"游戏库中暂时没有这类游戏"
6. 建议用户点击右上角"上传游戏"按钮添加想要的游戏
7. 不要提及版权、购买等话题"""
                    
                    # 将完整游戏信息存储，用于后续匹配
                    all_games_dict = {g.name: g.to_dict() for g in all_full_games}
                else:
                    system_prompt = f"""你是一个私人游戏库管理助手。用户说："{user_message}"
                    
请友好地回应用户。如果游戏库中没有找到相关游戏，告诉用户可以点击右上角"上传游戏"按钮添加。
不要提及版权、购买等话题。绝对不要编造或推荐游戏库中不存在的游戏。"""

                messages = [{"role": "system", "content": system_prompt}] + analyzed_state["messages"]
                
                # 4. 流式调用 OpenAI
                client = get_openai_client()
                stream = client.chat.completions.create(
                    model=os.getenv('QWEN_MODEL', 'qwen3-max'),
                    messages=messages,
                    temperature=0.7,
                    stream=True
                )
                
                full_response = ""
                for chunk in stream:
                    if chunk.choices[0].delta.content:
                        content = chunk.choices[0].delta.content
                        full_response += content
                        yield f"data: {json.dumps({'type': 'content', 'data': content})}\n\n"
                
                # 如果之前没有搜索结果但有游戏库，尝试从 AI 回复中提取推荐的游戏
                if not search_results and all_games_list:
                    import re
                    # 提取书名号中的游戏名
                    mentioned_games = re.findall(r'《([^》]+)》', full_response)
                    if mentioned_games:
                        # 查找匹配的游戏
                        matched_games = []
                        for game_name in mentioned_games[:2]:  # 最多2个
                            game = db.query(Game).filter(Game.name == game_name).first()
                            if game:
                                matched_games.append(game.to_dict())
                        
                        if matched_games:
                            search_results = matched_games
                            yield f"data: {json.dumps({'type': 'games', 'data': matched_games})}\n\n"
                            print(f"📎 Extracted {len(matched_games)} games from AI response")
                
                # 5. 保存到数据库
                # 保存用户消息
                user_history = ChatHistory(
                    user_id=user.id,
                    role='user',
                    content=user_message
                )
                db.add(user_history)
                
                # 保存 AI 响应（包含关联的游戏 ID）
                game_ids_json = None
                if search_results:
                    game_ids_json = json.dumps([g['id'] for g in search_results[:2]])
                
                assistant_history = ChatHistory(
                    user_id=user.id,
                    role='assistant',
                    content=full_response,
                    game_ids=game_ids_json
                )
                db.add(assistant_history)
                db.commit()
                
                # 发送结束信号
                yield f"data: {json.dumps({'type': 'done'})}\n\n"
                
            except Exception as e:
                print(f"Error in stream: {e}")
                import traceback
                traceback.print_exc()
                yield f"data: {json.dumps({'error': str(e)})}\n\n"
            finally:
                db.close()

        return Response(stream_with_context(generate()), mimetype='text/event-stream')
        
    except Exception as e:
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
