const { spawn } = require('child_process');
const path = require('path');

const PORT = process.env.PORT || 8080;

console.log('Starting production server...');
console.log(`Environment: ${process.env.NODE_ENV || 'production'}`);
console.log(`Port: ${PORT}`);

// Start backend server
const backend = spawn('node', ['server/server.js'], {
  stdio: 'inherit',
  env: { ...process.env }
});

// Start frontend server using serve
const frontend = spawn('npx', ['serve', '-s', 'build', '-l', PORT], {
  stdio: 'inherit'
});

backend.on('error', (err) => {
  console.error('Backend failed to start:', err);
  process.exit(1);
});

frontend.on('error', (err) => {
  console.error('Frontend failed to start:', err);
  process.exit(1);
});

backend.on('exit', (code) => {
  console.log(`Backend exited with code ${code}`);
  frontend.kill();
  process.exit(code);
});

frontend.on('exit', (code) => {
  console.log(`Frontend exited with code ${code}`);
  backend.kill();
  process.exit(code);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  backend.kill('SIGTERM');
  frontend.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  backend.kill('SIGINT');
  frontend.kill('SIGINT');
});

