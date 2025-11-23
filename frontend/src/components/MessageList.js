import React, { useEffect, useRef } from 'react';
import MessageItem from './MessageItem';
import './MessageList.css';

function MessageList({ messages, currentUser }) {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="message-list">
      {messages.length === 0 ? (
        <div className="empty-messages">
          <div className="empty-icon">💬</div>
          <p>No messages yet. Start the conversation!</p>
        </div>
      ) : (
        <>
          {messages.map((msg, idx) => (
            <MessageItem
              key={idx}
              message={msg}
              isOwn={msg.user === currentUser}
            />
          ))}
          <div ref={messagesEndRef} />
        </>
      )}
    </div>
  );
}

export default MessageList;

