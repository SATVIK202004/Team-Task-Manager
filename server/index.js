const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const connectDB = require('./config/db');
const seedAdmin = require('./seed');

const app = express();

// connect to MongoDB and seed admin
connectDB().then(() => {
  seedAdmin();
});

// middleware
app.use(cors());
app.use(express.json());

// api routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/tasks', require('./routes/tasks'));

// health check for debugging deployment
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    env: {
      NODE_ENV: process.env.NODE_ENV || 'not set',
      MONGO_URI: process.env.MONGO_URI ? 'set' : 'MISSING',
      JWT_SECRET: process.env.JWT_SECRET ? 'set' : 'MISSING',
      SMTP_HOST: process.env.SMTP_HOST || 'MISSING',
      SMTP_USER: process.env.SMTP_USER ? 'set' : 'MISSING',
      SMTP_PASS: process.env.SMTP_PASS ? 'set' : 'MISSING'
    }
  });
});

// serve frontend build in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
