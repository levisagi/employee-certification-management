// Production server that runs both backend and frontend
const { spawn } = require('child_process');
const express = require('express');
const path = require('path');

const PORT = process.env.PORT || 8080;
const BACKEND_PORT = process.env.BACKEND_PORT || 5001;

console.log('🚀 Starting production server...');
console.log(`📍 Port: ${PORT}`);
console.log(`🗄️ Backend Port: ${BACKEND_PORT}`);

// Start the Express backend
console.log('Starting backend server...');
process.env.PORT = BACKEND_PORT;
const backend = spawn('node', ['server/server.js'], {
  env: { ...process.env, PORT: BACKEND_PORT },
  stdio: 'inherit'
});

backend.on('error', (err) => {
  console.error('❌ Backend failed to start:', err);
  process.exit(1);
});

// Wait a bit for backend to start
setTimeout(() => {
  console.log('Starting frontend server...');
  
  // Create Express server for frontend
  const app = express();
  
  // Serve static files
  app.use(express.static(path.join(__dirname, 'build')));
  
  // API proxy to backend
  app.use('/api', (req, res) => {
    const proxyReq = require('http').request(
      {
        hostname: 'localhost',
        port: BACKEND_PORT,
        path: req.url,
        method: req.method,
        headers: req.headers,
      },
      (proxyRes) => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res);
      }
    );
    
    proxyReq.on('error', (err) => {
      console.error('Proxy error:', err);
      res.status(500).send('Backend error');
    });
    
    if (req.body) {
      proxyReq.write(JSON.stringify(req.body));
    }
    proxyReq.end();
  });
  
  // All other routes serve React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
  });
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Frontend server running on port ${PORT}`);
    console.log(`✅ Backend server running on port ${BACKEND_PORT}`);
    console.log(`🌐 Open http://localhost:${PORT} in your browser`);
  });
}, 3000);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...');
  backend.kill('SIGTERM');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down...');
  backend.kill('SIGINT');
  process.exit(0);
});

