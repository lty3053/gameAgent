import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Sparkles, LogIn } from 'lucide-react';
import { createGuest, login, register } from '../api/api';
import { setUserKey, setUserInfo } from '../utils/auth';
import { message } from 'antd';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';

function LoginPage() {
  const [mode, setMode] = useState('choice'); // 'choice', 'login', 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGuestLogin = async () => {
    setLoading(true);
    try {
      const response = await createGuest();
      setUserKey(response.user.user_key);
      setUserInfo(response.user);
      navigate('/chat');
    } catch (error) {
      console.error('Guest login failed:', error);
      message.error('游客登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      message.warning('请输入邮箱和密码');
      return;
    }

    setLoading(true);
    try {
      const response = await login(email, password);
      setUserKey(response.user.user_key);
      setUserInfo(response.user);
      message.success('登录成功！');
      navigate('/chat');
    } catch (error) {
      console.error('Login failed:', error);
      message.error(error.response?.data?.error || '登录失败，请检查邮箱和密码');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      message.warning('请输入邮箱和密码');
      return;
    }

    if (password.length < 6) {
      message.warning('密码至少需要6个字符');
      return;
    }

    setLoading(true);
    try {
      const response = await register(email, password);
      setUserKey(response.user.user_key);
      setUserInfo(response.user);
      message.success('注册成功！');
      navigate('/chat');
    } catch (error) {
      console.error('Register failed:', error);
      message.error(error.response?.data?.error || '注册失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  if (mode === 'choice') {
    return (
      <div className="login-page">
        <motion.div 
          className="login-container"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="login-header">
            <Sparkles size={48} className="login-icon" />
            <h1 className="login-title">Game Agent</h1>
            <p className="login-subtitle">Your Personal Game Assistant</p>
          </div>

          <div className="login-options">
            <motion.button
              className="option-card guest-card"
              onClick={handleGuestLogin}
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <User size={32} />
              <h3>游客登录</h3>
              <p>快速开始，无需注册</p>
            </motion.button>

            <motion.button
              className="option-card account-card"
              onClick={() => setMode('login')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <LogIn size={32} />
              <h3>账号登录</h3>
              <p>使用邮箱登录或注册</p>
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <motion.div 
        className="login-container auth-form"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="login-header">
          <Sparkles size={48} className="login-icon" />
          <h1 className="login-title">{mode === 'login' ? '登录' : '注册'}</h1>
          <p className="login-subtitle">使用邮箱{mode === 'login' ? '登录' : '注册'}账号</p>
        </div>

        <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="auth-form-content">
          <div className="form-group">
            <Mail size={20} className="form-icon" />
            <input
              type="email"
              placeholder="邮箱地址"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
              autoComplete="off"
            />
          </div>

          <div className="form-group">
            <Lock size={20} className="form-icon" />
            <input
              type="password"
              placeholder="密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              autoComplete="off"
            />
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? '处理中...' : (mode === 'login' ? '登录' : '注册')}
          </button>

          <div className="form-footer">
            <button 
              type="button" 
              className="link-btn"
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            >
              {mode === 'login' ? '没有账号？立即注册' : '已有账号？立即登录'}
            </button>
            <button 
              type="button" 
              className="link-btn"
              onClick={() => setMode('choice')}
            >
              返回
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default LoginPage;
