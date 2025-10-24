#!/bin/bash

# KV Garage API Setup Script
# Sets up the API server for localhost development

echo "🚀 Setting up KV Garage API Server..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Create API directory if it doesn't exist
if [ ! -d "api" ]; then
    echo "📁 Creating API directory..."
    mkdir -p api
fi

cd api

# Initialize package.json if it doesn't exist
if [ ! -f "package.json" ]; then
    echo "📦 Initializing package.json..."
    npm init -y
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install express cors multer jsonwebtoken csv-parser winston

# Install dev dependencies
echo "📦 Installing dev dependencies..."
npm install --save-dev nodemon

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p logs
mkdir -p uploads
mkdir -p backups
mkdir -p utils
mkdir -p middleware
mkdir -p routes

# Create .env file
echo "⚙️ Creating environment file..."
cat > .env << 'EOF'
# KV Garage API Environment Variables
NODE_ENV=development
PORT=3001
JWT_SECRET=kv-garage-admin-secret-key-change-in-production
JWT_EXPIRES_IN=24h

# File paths (relative to API directory)
DATA_DIR=../public/data
BACKUP_DIR=backups
UPLOAD_DIR=uploads
LOG_DIR=logs
EOF

# Create .gitignore
echo "📝 Creating .gitignore..."
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
npm-debug.log*

# Environment
.env
.env.local
.env.production

# Logs
logs/
*.log

# Uploads
uploads/
*.csv

# Backups
backups/

# OS
.DS_Store
Thumbs.db
EOF

# Create development script
echo "📝 Creating development script..."
cat > dev.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting KV Garage API Server in development mode..."
echo "📡 API will be available at: http://localhost:3001"
echo "🔍 Health check: http://localhost:3001/api/health"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the server with nodemon for auto-restart
npx nodemon server.js
EOF

chmod +x dev.sh

# Create production script
echo "📝 Creating production script..."
cat > start.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting KV Garage API Server in production mode..."
echo "📡 API will be available at: http://localhost:3001"
echo ""

# Start the server
node server.js
EOF

chmod +x start.sh

# Create test script
echo "📝 Creating test script..."
cat > test-api.sh << 'EOF'
#!/bin/bash

echo "🧪 Testing KV Garage API..."

# Test health endpoint
echo "1. Testing health endpoint..."
curl -s http://localhost:3001/api/health | jq . || echo "❌ Health check failed"

echo ""
echo "2. Testing admin login..."
curl -s -X POST http://localhost:3001/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@kvgarage.com","password":"admin123"}' | jq . || echo "❌ Login test failed"

echo ""
echo "3. Testing packs endpoint..."
curl -s http://localhost:3001/api/packs | jq . || echo "❌ Packs endpoint failed"

echo ""
echo "✅ API tests completed!"
EOF

chmod +x test-api.sh

echo ""
echo "✅ API setup completed!"
echo ""
echo "📋 Next steps:"
echo "1. Start the API server: cd api && ./dev.sh"
echo "2. In another terminal, start Eleventy: npm run dev"
echo "3. Visit: http://localhost:8080/admin/dashboard/"
echo "4. Login with: admin@kvgarage.com / admin123"
echo ""
echo "🔧 Development commands:"
echo "  Start API:     cd api && ./dev.sh"
echo "  Start Frontend: npm run dev"
echo "  Test API:       cd api && ./test-api.sh"
echo ""
echo "📁 API structure:"
echo "  api/"
echo "  ├── server.js          # Main server file"
echo "  ├── package.json       # Dependencies"
echo "  ├── .env              # Environment variables"
echo "  ├── routes/            # API routes"
echo "  ├── middleware/        # Auth middleware"
echo "  ├── utils/            # Utilities"
echo "  ├── logs/             # Log files"
echo "  ├── uploads/          # CSV uploads"
echo "  └── backups/          # JSON backups"
echo ""
echo "🎉 Ready to develop!"
