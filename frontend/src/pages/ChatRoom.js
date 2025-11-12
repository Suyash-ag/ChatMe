import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_CHAT_API_URL;

function ChatRoom() {
  const [room, setRoom] = useState('general');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [user, setUser] = useState('');
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    setUser(localStorage.getItem('username') || '');
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);
    newSocket.emit('joinRoom', room);
    newSocket.on('chatMessage', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });
    return () => newSocket.disconnect();
  }, [room]);

  const sendMessage = () => {
    if (message && socket) {
      socket.emit('chatMessage', { room, message, user });
      setMessage('');
    }
  };

  return (
    <div>
      <h2>Chat Room: {room}</h2>
      <input type="text" placeholder="Room" value={room} onChange={e => setRoom(e.target.value)} />
      <div style={{ border: '1px solid #ccc', height: '300px', overflowY: 'scroll', margin: '10px 0' }}>
        {messages.map((msg, idx) => (
          <div key={idx}><b>{msg.user}:</b> {msg.message}</div>
        ))}
      </div>
      <input type="text" placeholder="Message" value={message} onChange={e => setMessage(e.target.value)} />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}

export default ChatRoom;
