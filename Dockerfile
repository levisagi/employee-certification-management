# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY server/package*.json ./server/

# Install dependencies
RUN npm install
RUN cd server && npm install

# Copy source code
COPY . .

# Build React app
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install serve globally
RUN npm install -g serve

# Copy built files
COPY --from=builder /app/build ./build
COPY --from=builder /app/server ./server
COPY --from=builder /app/server/node_modules ./server/node_modules

# Expose ports
EXPOSE 3000 5001

# Set environment variables
ENV NODE_ENV=production

# Create startup script that runs both services
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'echo "Starting backend on port ${PORT:-5001}..."' >> /app/start.sh && \
    echo 'cd /app/server && node server.js &' >> /app/start.sh && \
    echo 'sleep 2' >> /app/start.sh && \
    echo 'echo "Starting frontend on port 3000..."' >> /app/start.sh && \
    echo 'serve -s /app/build -l 3000' >> /app/start.sh && \
    chmod +x /app/start.sh

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Start both frontend and backend
CMD ["/bin/sh", "/app/start.sh"]

