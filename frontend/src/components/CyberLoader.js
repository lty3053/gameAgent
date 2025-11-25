import React from 'react';
import { motion } from 'framer-motion';
import './CyberLoader.css';

function CyberLoader({ text = 'INITIALIZING' }) {
  return (
    <div className="cyber-loader-container">
      {/* 背景网格 */}
      <div className="cyber-grid" />
      
      {/* 扫描线 */}
      <div className="scan-line" />
      
      {/* 主加载区域 */}
      <div className="cyber-loader-content">
        {/* 外圈旋转环 */}
        <div className="cyber-ring outer">
          <svg viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" />
          </svg>
        </div>
        
        {/* 中圈反向旋转 */}
        <div className="cyber-ring middle">
          <svg viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="35" />
          </svg>
        </div>
        
        {/* 内圈脉冲 */}
        <div className="cyber-ring inner">
          <svg viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="25" />
          </svg>
        </div>
        
        {/* 中心图标 */}
        <motion.div 
          className="cyber-core"
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.8, 1, 0.8]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <div className="core-icon">⬡</div>
        </motion.div>
      </div>
      
      {/* 加载文字 */}
      <div className="cyber-text-container">
        <motion.div 
          className="cyber-text"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          {text.split('').map((char, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.05 }}
              className="cyber-char"
            >
              {char}
            </motion.span>
          ))}
          <span className="cyber-cursor">_</span>
        </motion.div>
        
        {/* 进度条 */}
        <div className="cyber-progress">
          <motion.div 
            className="cyber-progress-bar"
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        </div>
        
        {/* 状态指示器 */}
        <div className="cyber-status">
          <span className="status-dot" />
          <span className="status-text">SYSTEM ONLINE</span>
        </div>
      </div>
    </div>
  );
}

export default CyberLoader;
