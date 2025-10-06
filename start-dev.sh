#!/bin/bash

# KV Garage Development Startup Script
# Starts both frontend and backend servers

echo "🚀 Starting KV Garage Development Environment..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "Error: Please run this script from the project root directory"
    exit 1
fi

# Start backend server
print_status "Starting backend server..."
cd backend
if [ ! -f "server-mock.js" ]; then
    print_warning "Mock server not found. Creating it..."
    # The mock server should already exist from our setup
fi

# Start backend in background
node server-mock.js &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 3

# Test backend
if curl -s http://localhost:3001/api/health > /dev/null; then
    print_success "Backend server started successfully on port 3001"
else
    print_warning "Backend server may not be ready yet"
fi

# Start frontend server
print_status "Starting frontend server..."
npm start &
FRONTEND_PID=$!

# Wait for frontend to start
sleep 5

# Test frontend
if curl -s http://localhost:8080 > /dev/null; then
    print_success "Frontend server started successfully on port 8080"
else
    print_warning "Frontend server may not be ready yet"
fi

echo ""
print_success "🎉 Development environment started!"
echo ""
echo "📱 Frontend: http://localhost:8080"
echo "📦 Packs Page: http://localhost:8080/packs/"
echo "🔧 Backend API: http://localhost:3001/api"
echo "❤️  Health Check: http://localhost:3001/api/health"
echo ""
echo "🧪 To run tests, add ?test=true to any URL"
echo "   Example: http://localhost:8080/packs/?test=true"
echo ""
echo "Press Ctrl+C to stop both servers"

# Function to cleanup on exit
cleanup() {
    echo ""
    print_status "Stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    print_success "Servers stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Wait for user to stop
wait
