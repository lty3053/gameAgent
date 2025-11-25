import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Sparkles, LogIn } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { createGuest, login, register } from '../api/api';
import { setUserKey, setUserInfo } from '../utils/auth';
import { message } from 'antd';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';

function LoginPage() {
  const { t } = useTranslation();
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
      message.error(t('login.guestFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      message.warning(t('login.fillRequired'));
      return;
    }

    setLoading(true);
    try {
      const response = await login(email, password);
      setUserKey(response.user.user_key);
      setUserInfo(response.user);
      message.success(t('login.loginSuccess'));
      navigate('/chat');
    } catch (error) {
      console.error('Login failed:', error);
      message.error(error.response?.data?.error || t('login.loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      message.warning(t('login.fillRequired'));
      return;
    }

    if (password.length < 6) {
      message.warning(t('login.passwordMinLength'));
      return;
    }

    setLoading(true);
    try {
      const response = await register(email, password);
      setUserKey(response.user.user_key);
      setUserInfo(response.user);
      message.success(t('login.registerSuccess'));
      navigate('/chat');
    } catch (error) {
      console.error('Register failed:', error);
      message.error(error.response?.data?.error || t('login.registerFailed'));
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
            <h1 className="login-title">Game.Agent</h1>
            <p className="login-subtitle">{t('login.subtitle')}</p>
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
              <h3>{t('login.guestBtn')}</h3>
              <p>{t('login.guestDesc')}</p>
            </motion.button>

            <motion.button
              className="option-card account-card"
              onClick={() => setMode('login')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <LogIn size={32} />
              <h3>{t('login.loginBtn')}</h3>
              <p>{t('login.subtitle')}</p>
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
          <h1 className="login-title">{mode === 'login' ? t('login.loginBtn') : t('login.registerBtn')}</h1>
          <p className="login-subtitle">{t('login.subtitle')}</p>
        </div>

        <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="auth-form-content">
          <div className="form-group">
            <Mail size={20} className="form-icon" />
            <input
              type="email"
              placeholder={t('login.emailPlaceholder')}
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
              placeholder={t('login.passwordPlaceholder')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              autoComplete="off"
            />
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? t('common.loading') : (mode === 'login' ? t('login.loginBtn') : t('login.registerBtn'))}
          </button>

          <div className="form-footer">
            <button 
              type="button" 
              className="link-btn"
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            >
              {mode === 'login' ? t('login.noAccount') : t('login.hasAccount')}
            </button>
            <button 
              type="button" 
              className="link-btn"
              onClick={() => setMode('choice')}
            >
              {t('login.backToChoice')}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default LoginPage;
