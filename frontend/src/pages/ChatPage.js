import React, { useState, useEffect, useRef } from 'react';
import { Layout, Button, Input, List, Avatar, Typography, Card, Space, Spin, message } from 'antd';
import { User, Bot, Send, Upload, Sparkles, MessageSquare, Trash2, Gamepad2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { sendMessage, clearChatHistory, getChatHistory } from '../api/api';
import { useNavigate } from 'react-router-dom';
import { getUserKey } from '../utils/auth';
import GameCard from '../components/GameCard';
import ReactMarkdown from 'react-markdown';
import './ChatPage.css';

const { Header, Content, Footer } = Layout;
const { TextArea } = Input;

function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [userKey, setUserKeyState] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  // 加载对话历史
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const key = getUserKey();
        
        if (!key) {
          console.error('❌ No user key found');
          message.error('用户未登录，请重新登录');
          setLoadingHistory(false);
          return;
        }
        
        setUserKeyState(key);
        
        // 加载对话历史
        console.log('📚 Loading chat history...');
        const historyResponse = await getChatHistory(key);
        const histories = historyResponse.histories || [];
        
        // 转换为消息格式
        const loadedMessages = histories.map(h => ({
          role: h.role,
          content: h.content,
          timestamp: h.created_at,
          games: [] // 历史消息不包含游戏卡片
        }));
        
        setMessages(loadedMessages);
        console.log(`✅ Loaded ${loadedMessages.length} messages`);
      } catch (error) {
        console.error('❌ Failed to load history:', error);
        message.error('加载历史失败');
      } finally {
        setLoadingHistory(false);
      }
    };
    
    loadHistory();
  }, []);

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

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);

    try {
      const response = await sendMessage(inputValue, userKey);
      
      const botMessage = {
        role: 'assistant',
        content: response.response,
        games: response.games || [],
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error('Failed to send message:', error);
      message.error('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!userKey) return;
    
    try {
      await clearChatHistory(userKey);
      setMessages([]);
      message.success('对话历史已清空');
    } catch (error) {
      console.error('Failed to clear history:', error);
      message.error('清空失败');
    }
  };

  if (loadingHistory) {
    return (
      <Layout className="chat-page">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <Spin size="large" tip="加载中..." />
        </div>
      </Layout>
    );
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 欢迎界面的建议问题
  const suggestions = [
    { icon: <Gamepad2 size={20} />, text: "Recommend an action game", desc: "High pace, intense combat" },
    { icon: <Sparkles size={20} />, text: "Any new RPGs?", desc: "Story rich adventures" },
    { icon: <Upload size={20} />, text: "How to upload games?", desc: "Learn about the process" },
    { icon: <Bot size={20} />, text: "What can you do?", desc: "Discover AI capabilities" },
  ];

  return (
    <Layout className="chat-page">
      <Header className="chat-header">
        <div className="header-content">
          <div className="header-title">
            <Bot className="header-icon" size={24} />
            <span>GAME AGENT</span>
          </div>
          <div className="header-actions">
            {messages.length > 0 && (
              <button onClick={handleClearHistory} className="glass-btn">
                <Trash2 size={16} />
                <span>Clear</span>
              </button>
            )}
            <button onClick={() => navigate('/upload')} className="glass-btn upload-btn-primary">
              <Upload size={16} />
              <span>Upload Game</span>
            </button>
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
                <h2 className="welcome-title">How can I help you?</h2>
                <p className="welcome-subtitle">
                  I'm your personal game assistant. Ask me for recommendations, search for games, or manage your library.
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
                      gap: '12px',
                      flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                      maxWidth: '80%'
                    }}>
                      <Avatar 
                        size={40} 
                        icon={msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
                        style={{ 
                          backgroundColor: msg.role === 'user' ? 'var(--user-msg-bg)' : 'transparent',
                          border: msg.role === 'assistant' ? '1px solid var(--glass-border)' : 'none',
                          flexShrink: 0
                        }} 
                      />
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                        {/* 消息气泡 */}
                        <div style={{
                          padding: '16px 24px',
                          borderRadius: msg.role === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                          background: msg.role === 'user' ? 'var(--user-msg-bg)' : 'var(--ai-msg-bg)',
                          border: msg.role === 'assistant' ? '1px solid var(--glass-border)' : 'none',
                          color: 'var(--text-primary)',
                          lineHeight: '1.6',
                          boxShadow: msg.role === 'user' ? '0 4px 15px rgba(99, 102, 241, 0.3)' : 'none'
                        }}>
                          {msg.role === 'assistant' ? (
                            <ReactMarkdown 
                              components={{
                                p: ({node, ...props}) => <p style={{margin: 0}} {...props} />
                              }}
                            >
                              {msg.content}
                            </ReactMarkdown>
                          ) : msg.content}
                        </div>

                        {/* 游戏卡片展示区域 */}
                        {msg.games && msg.games.length > 0 && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            transition={{ delay: 0.2 }}
                            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', marginTop: '8px' }}
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
                {loading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{ display: 'flex', gap: '12px', padding: '0 12px' }}
                  >
                    <Avatar 
                      size={40} 
                      icon={<Bot size={20} />} 
                      style={{ 
                        backgroundColor: 'transparent',
                        border: '1px solid var(--glass-border)' 
                      }} 
                    />
                    <div style={{ 
                      padding: '12px 20px',
                      background: 'var(--ai-msg-bg)',
                      borderRadius: '20px 20px 20px 4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 1 }}
                        style={{ width: 6, height: 6, background: 'white', borderRadius: '50%' }}
                      />
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                        style={{ width: 6, height: 6, background: 'white', borderRadius: '50%' }}
                      />
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                        style={{ width: 6, height: 6, background: 'white', borderRadius: '50%' }}
                      />
                    </div>
                  </motion.div>
                )}
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
            placeholder="Ask anything about games..."
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
