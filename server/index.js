require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

// CORS for development
app.use(cors({
  origin: true,  // allow all origins in dev
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/members', require('./routes/members'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/admin', require('./routes/admin'));

// Health check endpoint (used by keep-alive ping)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Serve plans data
app.get('/api/plans', (req, res) => {
  const { SEVA_PLANS } = require('./utils/plans');
  res.json({ success: true, plans: SEVA_PLANS });
});

// Serve static files from React build in production
const publicPath = path.join(__dirname, 'public');
const fs = require('fs');
if (fs.existsSync(publicPath)) {
  app.use(express.static(publicPath));
}

// SPA fallback - serve index.html for any non-API routes
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    const indexPath = path.join(publicPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(200).send('Frontend not built yet. Use the Vite dev server (http://localhost:3001) during development.');
    }
  } else {
    res.status(404).json({ success: false, error: 'API endpoint not found.' });
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'An internal server error occurred.',
  });
});

app.listen(PORT, () => {
  console.log(`\n🙏 Shree Samrajyalakshmi Temple Seva Server`);
  console.log(`   Running on http://localhost:${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Admin: /admin\n`);

  // Keep-alive: ping self every 14 minutes to prevent Render free-tier spin-down
  if (process.env.RENDER_EXTERNAL_URL || process.env.NODE_ENV === 'production') {
    const KEEP_ALIVE_INTERVAL = 14 * 60 * 1000; // 14 minutes
    const serviceUrl = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
    setInterval(() => {
      const https = serviceUrl.startsWith('https') ? require('https') : require('http');
      https.get(`${serviceUrl}/api/health`, (res) => {
        console.log(`⏰ Keep-alive ping: ${res.statusCode}`);
      }).on('error', (err) => {
        console.log(`⏰ Keep-alive ping failed: ${err.message}`);
      });
    }, KEEP_ALIVE_INTERVAL);
    console.log(`   ⏰ Keep-alive enabled (every 14 min)\n`);
  }
});

module.exports = app;
