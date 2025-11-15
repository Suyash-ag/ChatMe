const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const mongoose = require('mongoose');
const redis = require('redis');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const Message = require('./models/Message');
const cors = require('cors');
dotenv.config();

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000', credentials: true }));

const server = http.createServer(app);
const io = socketio(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongo:27017/chat';
const REDIS_URL = process.env.REDIS_URL || 'redis://redis:6379';
const PORT = process.env.PORT || 5001;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

// Redis clients - one for publishing, one for subscribing
const redisPublisher = redis.createClient({ url: REDIS_URL });
const redisSubscriber = redis.createClient({ url: REDIS_URL });

// Connect Redis clients
Promise.all([
  redisPublisher.connect(),
  redisSubscriber.connect()
]).then(() => {
  console.log('Redis clients connected');
}).catch(err => {
  console.error('Redis connection error:', err);
});

// Track subscribed rooms
const subscribedRooms = new Set();

// Function to subscribe to a room channel
const subscribeToRoom = async (room) => {
  if (!subscribedRooms.has(room)) {
    subscribedRooms.add(room);
    await redisSubscriber.subscribe(room, (message) => {
      try {
        const data = JSON.parse(message);
        // Broadcast to all clients in this instance (excluding sender)
        io.to(room).emit('chatMessage', { user: data.user, message: data.message, timestamp: data.timestamp });
      } catch (err) {
        console.error('Error parsing Redis message:', err);
      }
    });
    console.log(`Subscribed to Redis channel: ${room}`);
  }
};

// Subscribe to default room
subscribeToRoom('general');

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('MongoDB connected');
    server.listen(PORT, () => console.log(`Chat service running on port ${PORT}`));
  })
  .catch(err => console.error('MongoDB connection error:', err));

// JWT authentication middleware for Socket.io
io.use((socket, next) => {
  const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
  if (!token) {
    return next(new Error('Authentication error: No token provided'));
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.userId = decoded.id;
    socket.username = decoded.username || 'Anonymous';
    next();
  } catch (err) {
    next(new Error('Authentication error: Invalid token'));
  }
});

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.username}`);

  socket.on('joinRoom', async (room) => {
    socket.join(room);
    await subscribeToRoom(room);
    console.log(`${socket.username} joined room: ${room}`);
  });

  socket.on('chatMessage', async ({ room, message, user }) => {
    try {
      // Save message to MongoDB
      const messageDoc = new Message({
        room,
        user: user || socket.username,
        message,
        timestamp: new Date()
      });
      await messageDoc.save();

      const messageData = {
        user: user || socket.username,
        message,
        timestamp: messageDoc.timestamp
      };

      // Publish to Redis for other instances
      await redisPublisher.publish(room, JSON.stringify(messageData));
      
      // Emit to clients in this instance (Redis subscriber will handle other instances)
      io.to(room).emit('chatMessage', messageData);
    } catch (err) {
      console.error('Error handling chat message:', err);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.username}`);
  });
});
