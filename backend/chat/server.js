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
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'chat' });
});

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

// Connect Redis clients with error handling
Promise.all([
  redisPublisher.connect(),
  redisSubscriber.connect()
]).then(() => {
  console.log('Redis clients connected');
}).catch(err => {
  console.error('Redis connection error:', err);
  process.exit(1);
});

// Handle Redis errors and reconnections
redisPublisher.on('error', (err) => {
  console.error('Redis publisher error:', err);
});

redisSubscriber.on('error', (err) => {
  console.error('Redis subscriber error:', err);
});

redisPublisher.on('connect', () => {
  console.log('Redis publisher connected');
});

redisSubscriber.on('connect', () => {
  console.log('Redis subscriber connected');
});

// Track subscribed rooms
const subscribedRooms = new Set();

// Set up Redis message handler (this handles messages from other instances)
redisSubscriber.on('message', (channel, message) => {
  try {
    const data = JSON.parse(message);
    // Only broadcast if this message didn't originate from this instance
    // (We'll add an instanceId to prevent duplicates)
    if (!data.instanceId || data.instanceId !== process.env.INSTANCE_ID) {
      io.to(channel).emit('chatMessage', { 
        user: data.user, 
        message: data.message, 
        timestamp: data.timestamp 
      });
    }
  } catch (err) {
    console.error('Error parsing Redis message:', err);
  }
});

// Function to subscribe to a room channel
const subscribeToRoom = async (room) => {
  if (!subscribedRooms.has(room)) {
    subscribedRooms.add(room);
    await redisSubscriber.subscribe(room);
    console.log(`Subscribed to Redis channel: ${room}`);
  }
};

// Generate unique instance ID if not set
if (!process.env.INSTANCE_ID) {
  process.env.INSTANCE_ID = `instance-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Subscribe to default room
subscribeToRoom('general');

const mongoOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true
};
mongoose.connect(MONGO_URI, mongoOptions)
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
  let currentRoom = 'general'; // Track current room

  socket.on('joinRoom', async (room) => {
    // Leave previous room if different
    if (currentRoom && currentRoom !== room) {
      socket.leave(currentRoom);
      console.log(`${socket.username} left room: ${currentRoom}`);
    }
    // Join new room
    socket.join(room);
    currentRoom = room;
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
        timestamp: messageDoc.timestamp,
        instanceId: process.env.INSTANCE_ID // Add instance ID to prevent duplicates
      };

      // Publish to Redis for other instances
      await redisPublisher.publish(room, JSON.stringify(messageData));
      
      // Emit to clients in this instance (excluding sender to prevent duplicate)
      socket.to(room).emit('chatMessage', {
        user: messageData.user,
        message: messageData.message,
        timestamp: messageData.timestamp
      });
      
      // Also emit to sender (so they see their own message)
      socket.emit('chatMessage', {
        user: messageData.user,
        message: messageData.message,
        timestamp: messageData.timestamp
      });
    } catch (err) {
      console.error('Error handling chat message:', err);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.username}`);
  });
});
