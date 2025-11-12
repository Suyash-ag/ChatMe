const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const mongoose = require('mongoose');
const redis = require('redis');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongo:27017/chat';
const REDIS_URL = process.env.REDIS_URL || 'redis://redis:6379';
const PORT = process.env.PORT || 5001;

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    server.listen(PORT, () => console.log(`Chat service running on port ${PORT}`));
  })
  .catch(err => console.error('MongoDB connection error:', err));

const redisClient = redis.createClient({ url: REDIS_URL });
redisClient.connect().catch(console.error);

io.on('connection', (socket) => {
  socket.on('joinRoom', (room) => {
    socket.join(room);
  });

  socket.on('chatMessage', async ({ room, message, user }) => {
    io.to(room).emit('chatMessage', { user, message });
    redisClient.publish(room, JSON.stringify({ user, message }));
    // Save to MongoDB (implement message model)
  });
});
