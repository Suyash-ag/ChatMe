import React from 'react';
import UserAvatar from './UserAvatar';
import './MessageItem.css';

function MessageItem({ message, isOwn }) {
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className={`message-item ${isOwn ? 'own' : ''}`}>
      {!isOwn && <UserAvatar username={message.user} />}
      <div className="message-content">
        {!isOwn && <div className="message-username">{message.user}</div>}
        <div className="message-bubble">
          <span className="message-text">{message.message}</span>
          <span className="message-time">{formatTime(message.timestamp)}</span>
        </div>
      </div>
    </div>
  );
}

export default MessageItem;

