import React from 'react';
import { motion } from 'framer-motion';
import './CyberAvatar.css';

function CyberAvatar({ type = 'bot', size = 44 }) {
  const isBot = type === 'bot';
  
  return (
    <div 
      className={`cyber-avatar ${isBot ? 'bot' : 'user'}`}
      style={{ width: size, height: size }}
    >
      {/* 外层光环 */}
      <div className="avatar-ring" />
      
      {/* 扫描线效果 */}
      {isBot && <div className="avatar-scan" />}
      
      {/* 头像主体 */}
      <div className="avatar-core">
        {isBot ? (
          // 机器人 - 赛博朋克风格
          <svg viewBox="0 0 24 24" fill="none" className="avatar-icon">
            {/* 头部外框 */}
            <motion.path
              d="M4 8C4 5.79086 5.79086 4 8 4H16C18.2091 4 20 5.79086 20 8V14C20 17.3137 17.3137 20 14 20H10C6.68629 20 4 17.3137 4 14V8Z"
              stroke="currentColor"
              strokeWidth="1.5"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
            />
            {/* 左眼 */}
            <motion.circle
              cx="9"
              cy="11"
              r="1.5"
              fill="currentColor"
              animate={{ 
                opacity: [1, 0.3, 1],
                scale: [1, 0.8, 1]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            {/* 右眼 */}
            <motion.circle
              cx="15"
              cy="11"
              r="1.5"
              fill="currentColor"
              animate={{ 
                opacity: [1, 0.3, 1],
                scale: [1, 0.8, 1]
              }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.1 }}
            />
            {/* 嘴巴/扬声器 */}
            <motion.rect
              x="8"
              y="15"
              width="8"
              height="2"
              rx="1"
              fill="currentColor"
              animate={{ scaleX: [1, 1.2, 0.8, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            {/* 天线 */}
            <motion.path
              d="M12 4V1M12 1L10 3M12 1L14 3"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              animate={{ y: [0, -1, 0] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          </svg>
        ) : (
          // 用户 - 简约人形
          <svg viewBox="0 0 24 24" fill="none" className="avatar-icon user-icon">
            <circle cx="12" cy="8" r="4" fill="currentColor" />
            <path
              d="M4 20C4 16.6863 7.58172 14 12 14C16.4183 14 20 16.6863 20 20"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        )}
      </div>
      
      {/* 状态指示灯 */}
      <motion.div 
        className="avatar-status"
        animate={{ 
          opacity: [1, 0.4, 1],
          boxShadow: [
            '0 0 4px currentColor',
            '0 0 8px currentColor',
            '0 0 4px currentColor'
          ]
        }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
    </div>
  );
}

export default CyberAvatar;
