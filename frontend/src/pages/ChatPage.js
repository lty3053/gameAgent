import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Layout, Button, Input, List, Typography, Card, Space, message } from 'antd';
import { User, Bot, Send, Upload, Sparkles, MessageSquare, Trash2, Gamepad2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { sendMessage, sendStreamMessage, clearChatHistory, getChatHistory, createGuest, getGames } from '../api/api';
import { useNavigate } from 'react-router-dom';
import { getUserKey, setUserKey, setUserInfo } from '../utils/auth';
import GameCard from '../components/GameCard';
import CyberLoader from '../components/CyberLoader';
import CyberAvatar from '../components/CyberAvatar';
import LanguageSwitcher from '../components/LanguageSwitcher';
import ReactMarkdown from 'react-markdown';
import './ChatPage.css';

const { Header, Content, Footer } = Layout;
const { TextArea } = Input;

function ChatPage() {
  const { t, i18n } = useTranslation();
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [userKey, setUserKeyState] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [randomGameName, setRandomGameName] = useState('');
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  
  // 随机 placeholder 模板
  const getRandomPlaceholder = (gameName) => {
    const isZh = i18n.language?.startsWith('zh');
    const templates = isZh ? [
      `我想下载《${gameName}》`,
      `有没有类似《${gameName}》的游戏？`,
      `介绍一下《${gameName}》`,
      `推荐一款动作游戏`,
      `我的游戏库里有什么？`,
      `帮我找一款RPG游戏`,
      `最近有什么新游戏？`,
      `《${gameName}》好玩吗？`,
      `帮我推荐一款女性主角的游戏`,
      `有没有恐怖惊悚类的游戏？`,
      `推荐一款肉鸽游戏`,
      `有什么好玩的战棋游戏吗？`,
      `帮我找一款模拟经营游戏`,
      `有没有国风仙侠类的？`,
    ] : [
      `I want to download "${gameName}"`,
      `Any games like "${gameName}"?`,
      `Tell me about "${gameName}"`,
      `Recommend an action game`,
      `What's in my library?`,
      `Find me an RPG`,
      `Any new games recently?`,
      `Is "${gameName}" good?`,
      `Recommend a game with female protagonist`,
      `Any horror games?`,
      `Find me a roguelike`,
      `Any good strategy games?`,
      `Recommend a simulation game`,
    ];
    return templates[Math.floor(Math.random() * templates.length)];
  };

  // 加载对话历史，如果用户不存在则静默创建游客账号
  useEffect(() => {
    const initializeUser = async () => {
      const startTime = Date.now();
      const MIN_LOADING_TIME = 1000; // 最少显示 1 秒加载动画
      
      try {
        let key = getUserKey();
        
        // 如果没有 key，静默创建游客账号
        if (!key) {
          console.log('📝 No user key found, creating guest account...');
          const response = await createGuest();
          key = response.user.user_key;
          setUserKey(key);
          setUserInfo(response.user);
          console.log('✅ Guest account created:', key);
        }
        
        setUserKeyState(key);
        
        // 尝试加载对话历史
        try {
          console.log('📚 Loading chat history...');
          const historyResponse = await getChatHistory(key);
          const histories = historyResponse.histories || [];
          
          // 转换为消息格式（包含关联的游戏卡片）
          const loadedMessages = histories.map(h => ({
            role: h.role,
            content: h.content,
            timestamp: h.created_at,
            games: h.games || [] // 从历史记录中加载游戏卡片
          }));
          
          setMessages(loadedMessages);
          console.log(`✅ Loaded ${loadedMessages.length} messages`);
        } catch (historyError) {
          // 用户可能不存在（数据库被清空），静默创建新游客账号
          if (historyError.response?.data?.error === 'user_not_found') {
            console.log('📝 User not found, creating new guest account...');
            const response = await createGuest();
            key = response.user.user_key;
            setUserKey(key);
            setUserInfo(response.user);
            setUserKeyState(key);
            console.log('✅ New guest account created:', key);
          } else {
            // 其他错误，静默处理，从空对话开始
            console.log('📝 No history found, starting fresh conversation');
          }
        }
      } catch (error) {
        console.error('❌ Failed to initialize:', error);
        // 最后的兜底：尝试创建游客账号
        try {
          const response = await createGuest();
          const key = response.user.user_key;
          setUserKey(key);
          setUserInfo(response.user);
          setUserKeyState(key);
          console.log('✅ Fallback guest account created:', key);
        } catch (e) {
          console.error('❌ Failed to create guest account:', e);
        }
      } finally {
        // 确保加载动画至少显示 1 秒
        const elapsed = Date.now() - startTime;
        const remaining = MIN_LOADING_TIME - elapsed;
        if (remaining > 0) {
          setTimeout(() => setLoadingHistory(false), remaining);
        } else {
          setLoadingHistory(false);
        }
      }
      
      // 获取游戏列表用于随机 placeholder
      try {
        const gamesResponse = await getGames();
        const games = gamesResponse.games || [];
        if (games.length > 0) {
          const randomGame = games[Math.floor(Math.random() * games.length)];
          setRandomGameName(randomGame.name);
        }
      } catch (e) {
        console.log('Failed to load games for placeholder');
      }
    };
    
    initializeUser();
  }, []);

  // 生成随机 placeholder（每次页面加载时随机）
  const placeholder = useMemo(() => {
    const fallbackName = i18n.language?.startsWith('zh') ? '杀戮尖塔' : 'Slay the Spire';
    return getRandomPlaceholder(randomGameName || fallbackName);
  }, [randomGameName, i18n.language]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !userKey) return;

    const userMessage = {
      role: 'user',
      content: inputValue,
      timestamp: new Date().toISOString(),
    };

    // 添加用户消息
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);

    // 创建一个空的 AI 消息占位
    const botMessageId = Date.now();
    const initialBotMessage = {
      id: botMessageId,
      role: 'assistant',
      content: '',
      games: [],
      status: '', // 添加状态字段
      timestamp: new Date().toISOString(),
      isStreaming: true
    };
    setMessages((prev) => [...prev, initialBotMessage]);

    try {
      await sendStreamMessage(inputValue, userKey, (chunk) => {
        setMessages((prev) => {
          const newMessages = [...prev];
          const msgIndex = newMessages.findIndex(m => m.id === botMessageId);
          if (msgIndex === -1) return prev;

          const msg = { ...newMessages[msgIndex] };

          if (chunk.type === 'status') {
            // 更新状态提示
            msg.status = chunk.data;
          } else if (chunk.type === 'content') {
            msg.content += chunk.data;
            msg.status = ''; // 清除状态
            // 一旦开始接收内容，停止加载动画
            setLoading(false);
          } else if (chunk.type === 'games') {
            msg.games = chunk.data;
            msg.status = ''; // 清除状态
            setLoading(false);
          } else if (chunk.type === 'done') {
            msg.isStreaming = false;
            msg.status = '';
          } else if (chunk.error) {
            message.error('Error: ' + chunk.error);
            msg.isStreaming = false;
            msg.status = '';
          }

          newMessages[msgIndex] = msg;
          return newMessages;
        });
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      message.error('Failed to send message. Please try again.');
      // Remove the bot message if failed completely or mark as error
      setMessages((prev) => prev.filter(m => m.id !== botMessageId));
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!userKey) return;
    
    try {
      await clearChatHistory(userKey);
      setMessages([]);
      message.success(t('chat.historyCleared'));
    } catch (error) {
      console.error('Failed to clear history:', error);
      message.error(t('chat.clearFailed'));
    }
  };

  if (loadingHistory) {
    return <CyberLoader text="LOADING" />;
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 欢迎界面的建议问题
  const suggestions = [
    { icon: <Gamepad2 size={20} />, text: t('chat.suggestions.action.text'), desc: t('chat.suggestions.action.desc') },
    { icon: <Sparkles size={20} />, text: t('chat.suggestions.rpg.text'), desc: t('chat.suggestions.rpg.desc') },
    { icon: <Upload size={20} />, text: t('chat.suggestions.upload.text'), desc: t('chat.suggestions.upload.desc') },
    { icon: <Bot size={20} />, text: t('chat.suggestions.capabilities.text'), desc: t('chat.suggestions.capabilities.desc') },
  ];

  return (
    <Layout className="chat-page">
      <Header className="chat-header">
        <div className="header-content">
          <div className="header-title cyber-title">
            <span className="title-main">Game</span>
            <span className="title-dot">.</span>
            <span className="title-sub">Agent</span>
          </div>
          <div className="header-actions">
            {messages.length > 0 && (
              <button onClick={handleClearHistory} className="glass-btn">
                <Trash2 size={16} />
                <span>{t('header.clear')}</span>
              </button>
            )}
            <button onClick={() => navigate('/upload')} className="glass-btn upload-btn-primary">
              <Upload size={16} />
              <span>{t('header.uploadGame')}</span>
            </button>
            <LanguageSwitcher />
          </div>
        </div>
      </Header>

      <Content className="chat-content">
        <div className="messages-container">
          <div className="messages-inner">
            {messages.length === 0 ? (
              <motion.div 
                className="welcome-container"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <h2 className="welcome-title">{t('chat.welcomeTitle')}</h2>
                <p className="welcome-subtitle">
                  {t('chat.welcomeSubtitle')}
                </p>
                
                <div className="suggestion-grid">
                  {suggestions.map((item, index) => (
                    <motion.div 
                      key={index}
                      className="suggestion-card"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setInputValue(item.text);
                        // Optional: Auto send
                      }}
                    >
                      <div className="suggestion-icon">{item.icon}</div>
                      <div className="suggestion-text">{item.text}</div>
                      <div className="suggestion-desc">{item.desc}</div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <AnimatePresence>
                {messages.map((msg, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                      marginBottom: '24px' 
                    }}
                  >
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'flex-start', 
                      gap: '16px',
                      flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                      maxWidth: '80%'
                    }}>
                      <CyberAvatar 
                        type={msg.role === 'user' ? 'user' : 'bot'} 
                        size={44} 
                      />
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                        {/* 状态提示 */}
                        {msg.status && (
                          <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="ai-status-hint"
                          >
                            <span className="status-dot"></span>
                            {msg.status === 'analyzing' && t('chat.status.analyzing')}
                            {msg.status === 'searching' && t('chat.status.searching')}
                          </motion.div>
                        )}
                        
                        {/* 消息气泡 */}
                        <div className={msg.role === 'user' ? 'cyber-bubble-user' : 'cyber-bubble-ai'}>
                          {msg.role === 'assistant' ? (
                            msg.content ? (
                              <ReactMarkdown 
                                components={{
                                  p: ({node, ...props}) => <p style={{margin: 0}} {...props} />
                                }}
                              >
                                {msg.content}
                              </ReactMarkdown>
                            ) : !msg.status && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <motion.div
                                  animate={{ scale: [1, 1.2, 1] }}
                                  transition={{ repeat: Infinity, duration: 1 }}
                                  style={{ width: 6, height: 6, background: 'rgba(255,255,255,0.6)', borderRadius: '50%' }}
                                />
                                <motion.div
                                  animate={{ scale: [1, 1.2, 1] }}
                                  transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                                  style={{ width: 6, height: 6, background: 'rgba(255,255,255,0.6)', borderRadius: '50%' }}
                                />
                                <motion.div
                                  animate={{ scale: [1, 1.2, 1] }}
                                  transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                                  style={{ width: 6, height: 6, background: 'rgba(255,255,255,0.6)', borderRadius: '50%' }}
                                />
                              </div>
                            )
                          ) : msg.content}
                        </div>

                        {/* 游戏卡片展示区域 - 只在流式输出完成后显示 */}
                        {msg.games && msg.games.length > 0 && !msg.isStreaming && (
                          <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', marginTop: '16px' }}
                          >
                            {msg.games.map(game => (
                              <GameCard key={game.id} game={game} />
                            ))}
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </Content>

      <div className="chat-footer">
        <div className="input-wrapper">
          <TextArea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            autoSize={{ minRows: 1, maxRows: 4 }}
            className="chat-input"
            autoComplete="off"
          />
          <button 
            onClick={handleSendMessage} 
            disabled={!inputValue.trim() || loading}
            className="send-btn"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </Layout>
  );
}

export default ChatPage;
