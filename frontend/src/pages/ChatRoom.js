import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import '../App.css';
import { useNavigate } from 'react-router-dom';

const SOCKET_URL = process.env.REACT_APP_CHAT_API_URL;

function ChatRoom() {
  const [room, setRoom] = useState('general');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [user, setUser] = useState('');
  const [socket, setSocket] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const username = localStorage.getItem('username');
    const token = localStorage.getItem('token');
    if (!username || !token) {
      navigate('/login');
      return;
    }
    setUser(username);
    const newSocket = io(SOCKET_URL, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling']
    });
    
    newSocket.on('connect', () => {
      console.log('Socket connected');
      newSocket.emit('joinRoom', room);
    });
    
    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      if (error.message.includes('Authentication')) {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        navigate('/login');
      }
    });
    
    newSocket.on('chatMessage', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });
    
    setSocket(newSocket);
    return () => newSocket.disconnect();
  }, [room, navigate]);

  const sendMessage = () => {
    if (message && socket) {
      socket.emit('chatMessage', { room, message, user });
      setMessage('');
    }
  };

  return (
    <div className="page-container">
      <div className="chatroom-container">
        <div className="chatroom-header">Chat Room: <span>{room}</span></div>
        <input
          type="text"
          placeholder="Room"
          value={room}
          onChange={e => setRoom(e.target.value)}
          className="chatroom-room-input input"
        />
        <div className="chatroom-messages">
          {messages.map((msg, idx) => (
            <div key={idx} className="chatroom-message">
              <span className="chatroom-message-user">{msg.user}:</span> {msg.message}
            </div>
          ))}
        </div>
        <div className="chatroom-input-row">
          <input
            type="text"
            placeholder="Message"
            value={message}
            onChange={e => setMessage(e.target.value)}
            className="chatroom-input"
          />
          <button onClick={sendMessage} className="chatroom-send-btn">Send</button>
        </div>
      </div>
    </div>
  );
}

export default ChatRoom;