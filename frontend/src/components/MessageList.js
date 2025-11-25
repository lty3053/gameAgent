import React from 'react';
import { Avatar } from 'antd';
import { UserOutlined, RobotOutlined } from '@ant-design/icons';
import GameCard from './GameCard';
import './MessageList.css';

function MessageList({ messages }) {
  return (
    <div className="message-list">
      {messages.map((msg, index) => (
        <div key={index} className={`message-item ${msg.role}`}>
          <Avatar 
            icon={msg.role === 'user' ? <UserOutlined /> : <RobotOutlined />}
            className={`message-avatar ${msg.role}`}
          />
          <div className="message-content">
            <div className="message-text">
              {msg.content}
            </div>
            {msg.games && msg.games.length > 0 && (
              <div className="games-grid">
                {msg.games.map((game) => (
                  <GameCard key={game.id} game={game} />
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default MessageList;
