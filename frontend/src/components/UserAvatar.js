import React from 'react';
import './UserAvatar.css';

function UserAvatar({ username }) {
  const getInitials = (name) => {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  };

  const getColor = (name) => {
    if (!name) return '#666';
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
      '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52BE80'
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div 
      className="user-avatar"
      style={{ backgroundColor: getColor(username) }}
      title={username}
    >
      {getInitials(username)}
    </div>
  );
}

export default UserAvatar;

