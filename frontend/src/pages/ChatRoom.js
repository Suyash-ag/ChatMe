import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import MessageList from '../components/MessageList';
import MessageInput from '../components/MessageInput';
import ChatHeader from '../components/ChatHeader';
import RoomSelector from '../components/RoomSelector';
import ConnectionStatus from '../components/ConnectionStatus';
import './ChatRoom.css';

const SOCKET_URL = process.env.REACT_APP_CHAT_API_URL;

function ChatRoom() {
  const [room, setRoom] = useState('general');
  const [messages, setMessages] = useState([]);
  const [user, setUser] = useState('');
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const username = localStorage.getItem('username');
    const token = localStorage.getItem('token');
    if (!username || !token) {
      navigate('/login');
      return;
    }
    setUser(username);
    
    const newSocket = io(SOCKET_URL || 'http://localhost:5001', {
      auth: { token },
      transports: ['websocket', 'polling']
    });
    
    newSocket.on('connect', () => {
      console.log('Socket connected');
      setConnected(true);
      newSocket.emit('joinRoom', room);
    });
    
    newSocket.on('disconnect', () => {
      setConnected(false);
    });
    
    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setConnected(false);
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
    return () => {
      newSocket.disconnect();
    };
  }, [navigate]);

  // Handle room changes
  useEffect(() => {
    if (socket && socket.connected) {
      socket.emit('joinRoom', room);
      setMessages([]);
    }
  }, [room, socket]);

  const handleSendMessage = (messageText) => {
    if (socket && socket.connected) {
      socket.emit('chatMessage', { room, message: messageText, user });
    }
  };

  const handleRoomChange = (newRoom) => {
    setRoom(newRoom);
  };

  const handleLogout = () => {
    if (socket) {
      socket.disconnect();
    }
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    navigate('/login');
  };

  return (
    <div className="chatroom-page">
      <div className="chatroom-container">
        <ChatHeader 
          room={room} 
          currentUser={user}
          onLogout={handleLogout}
        />
        <RoomSelector 
          currentRoom={room}
          onRoomChange={handleRoomChange}
        />
        <div className="chatroom-content">
          <MessageList messages={messages} currentUser={user} />
        </div>
        <div className="chatroom-footer">
          <ConnectionStatus connected={connected} />
          <MessageInput 
            onSend={handleSendMessage}
            disabled={!connected}
          />
        </div>
      </div>
    </div>
  );
}

export default ChatRoom;
