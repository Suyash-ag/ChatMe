
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const authRoutes = require('./routes/auth');
dotenv.config();

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000', credentials: true }));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'auth' });
});

app.use('/auth', authRoutes);

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongo:27017/auth';
// Support MongoDB with or without authentication
const mongoOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true
};

mongoose.connect(MONGO_URI, mongoOptions)
  .then(() => {
    app.listen(PORT, () => console.log(`Auth service running on port ${PORT}`));
  })
  .catch(err => console.error('MongoDB connection error:', err));
