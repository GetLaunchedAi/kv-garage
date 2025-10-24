#!/bin/bash
echo "🚀 Starting KV Garage API Server in development mode..."
echo "📡 API will be available at: http://localhost:3001"
echo "🔍 Health check: http://localhost:3001/api/health"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the server with nodemon for auto-restart
npx nodemon server.js
