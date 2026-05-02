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
      SENDGRID_API_KEY: process.env.SENDGRID_API_KEY ? 'set' : 'MISSING',
      SENDGRID_FROM_EMAIL: process.env.SENDGRID_FROM_EMAIL || 'MISSING'
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

  // Keep-alive: self-ping every 12 minutes to prevent Railway from sleeping
  if (process.env.NODE_ENV === 'production' && process.env.RAILWAY_PUBLIC_DOMAIN) {
    const PING_URL = `https://${process.env.RAILWAY_PUBLIC_DOMAIN}/api/health`;
    const INTERVAL = 12 * 60 * 1000; // 12 minutes

    setInterval(async () => {
      try {
        const res = await fetch(PING_URL);
        const data = await res.json();
        console.log(`[keep-alive] pinged ${PING_URL} — status: ${data.status}`);
      } catch (err) {
        console.error(`[keep-alive] ping failed: ${err.message}`);
      }
    }, INTERVAL);

    console.log(`[keep-alive] self-ping enabled — every 12 min → ${PING_URL}`);
  }
});
