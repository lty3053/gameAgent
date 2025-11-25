import React from 'react';
import { motion } from 'framer-motion';
import './CyberLogo.css';

function CyberLogo({ size = 32 }) {
  return (
    <div className="cyber-logo" style={{ width: size, height: size }}>
      {/* 外层六边形 */}
      <svg viewBox="0 0 100 100" className="logo-hex">
        <defs>
          <linearGradient id="hexGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="50%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* 外框六边形 */}
        <motion.polygon
          points="50,5 90,27.5 90,72.5 50,95 10,72.5 10,27.5"
          fill="none"
          stroke="url(#hexGradient)"
          strokeWidth="2"
          filter="url(#glow)"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        />
        
        {/* 内部电路线 */}
        <motion.path
          d="M50 20 L50 35 M35 30 L50 35 L65 30 M50 35 L50 50 M30 50 L70 50 M50 50 L50 65 M35 70 L50 65 L65 70 M50 65 L50 80"
          stroke="url(#hexGradient)"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
          opacity="0.6"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, delay: 0.5 }}
        />
        
        {/* 中心核心 */}
        <motion.circle
          cx="50"
          cy="50"
          r="8"
          fill="url(#hexGradient)"
          animate={{ 
            r: [8, 10, 8],
            opacity: [0.8, 1, 0.8]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        
        {/* 脉冲环 */}
        <motion.circle
          cx="50"
          cy="50"
          r="12"
          fill="none"
          stroke="url(#hexGradient)"
          strokeWidth="1"
          opacity="0.5"
          animate={{ 
            r: [12, 20, 12],
            opacity: [0.5, 0, 0.5]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        
        {/* 角落装饰点 */}
        {[
          { cx: 50, cy: 5 },
          { cx: 90, cy: 27.5 },
          { cx: 90, cy: 72.5 },
          { cx: 50, cy: 95 },
          { cx: 10, cy: 72.5 },
          { cx: 10, cy: 27.5 },
        ].map((point, i) => (
          <motion.circle
            key={i}
            cx={point.cx}
            cy={point.cy}
            r="3"
            fill="#6366f1"
            animate={{ 
              opacity: [0.3, 1, 0.3],
              r: [2, 3, 2]
            }}
            transition={{ 
              duration: 1.5, 
              repeat: Infinity,
              delay: i * 0.2
            }}
          />
        ))}
      </svg>
    </div>
  );
}

export default CyberLogo;
