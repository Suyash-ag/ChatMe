import React from 'react';
import UserAvatar from './UserAvatar';
import './ChatHeader.css';

function ChatHeader({ room, currentUser, onLogout }) {
  return (
    <div className="chat-header">
      <div className="chat-header-left">
        <div className="room-info">
          <div className="room-icon">#</div>
          <div>
            <div className="room-name">{room}</div>
            <div className="room-subtitle">Chat Room</div>
          </div>
        </div>
      </div>
      <div className="chat-header-right">
        <div className="user-info">
          <UserAvatar username={currentUser} />
          <span className="username">{currentUser}</span>
        </div>
        <button className="logout-button" onClick={onLogout} title="Logout">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
        </button>
      </div>
    </div>
  );
}

export default ChatHeader;

