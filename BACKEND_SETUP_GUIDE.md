# Backend Setup Guide
## KV Garage Wholesale Platform

This guide will help you set up the backend infrastructure for the KV Garage wholesale platform.

---

## 🚀 Quick Setup

### 1. Prerequisites
- Node.js 18+ installed
- PostgreSQL 12+ installed
- Stripe account with API keys

### 2. Installation Steps

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
nano .env
```

### 3. Database Setup

```bash
# Create PostgreSQL database
createdb kv_garage_wholesale

# Run database schema
psql kv_garage_wholesale < database/schema.sql

# Seed with sample data
npm run seed
```

### 4. Start Development Server

```bash
# Start with nodemon for development
npm run dev

# Or start production server
npm start
```

The API will be available at `http://localhost:3001`

---

## 🔧 Environment Configuration

### Required Environment Variables

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=kv_garage_wholesale
DB_USER=your_db_user
DB_PASSWORD=your_db_password

# Stripe Configuration (Get from Stripe Dashboard)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:8080

# Admin Configuration
ADMIN_EMAIL=admin@kvgarage.com
ADMIN_PASSWORD=your_admin_password
```

---

## 📊 Sample Data

The seed script creates:

### 3 Sample Packs
- **Starter Pack**: $500, ~250 units, Est. $1,200
- **Reseller Pack**: $1,000, ~500 units, Est. $3,000  
- **Pro Pack**: $2,000, ~1,000 units, Est. $5,000

### Admin User
- **Email**: admin@kvgarage.com (or your ADMIN_EMAIL)
- **Password**: admin123 (or your ADMIN_PASSWORD)

### Sample Manifests
Each pack includes detailed manifests with:
- iPhone cases (various models)
- USB-C and Lightning cables
- Screen protectors
- Watch accessories
- Phone accessories (PopSockets, stands)

---

## 🧪 Testing the API

### Health Check
```bash
curl http://localhost:3001/health
```

### Get All Packs
```bash
curl http://localhost:3001/api/packs
```

### Get Pack Details
```bash
curl http://localhost:3001/api/packs/1
```

### Download Manifest as CSV
```bash
curl http://localhost:3001/api/manifests/1?format=csv
```

### Admin Login
```bash
curl -X POST http://localhost:3001/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@kvgarage.com","password":"admin123"}'
```

---

## 🔗 Stripe Setup

### 1. Get Stripe Keys
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to Developers > API Keys
3. Copy your test keys to `.env` file

### 2. Set Up Webhooks
1. Go to Developers > Webhooks
2. Add endpoint: `http://localhost:3001/api/webhooks/stripe`
3. Select events: `checkout.session.completed`, `payment_intent.succeeded`
4. Copy webhook secret to `.env` file

### 3. Test Payments
Use Stripe test card numbers:
- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002

---

## 📁 Project Structure

```
backend/
├── config/
│   └── database.js          # Database configuration
├── database/
│   └── schema.sql           # Database schema
├── middleware/
│   └── errorHandler.js      # Error handling middleware
├── routes/
│   ├── packs.js            # Pack management endpoints
│   ├── orders.js           # Order processing endpoints
│   ├── manifests.js        # Manifest generation endpoints
│   ├── admin.js            # Admin panel endpoints
│   ├── customPacks.js      # Custom pack request endpoints
│   └── webhooks.js         # Stripe webhook handlers
├── scripts/
│   └── seed.js             # Database seeding script
├── utils/
│   └── logger.js           # Logging configuration
├── server.js               # Main server file
├── package.json            # Dependencies and scripts
└── README.md               # Detailed documentation
```

---

## 🚨 Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL is running
sudo service postgresql status

# Test connection
psql -h localhost -U your_user -d kv_garage_wholesale
```

### Port Already in Use
```bash
# Find process using port 3001
lsof -i :3001

# Kill process
kill -9 <PID>
```

### Stripe Webhook Issues
- Ensure webhook endpoint is accessible
- Check webhook secret matches environment variable
- Verify webhook events are selected correctly

### Permission Issues
```bash
# Fix file permissions
chmod +x scripts/seed.js
chmod 755 logs/
```

---

## 📈 Production Deployment

### Environment Setup
```env
NODE_ENV=production
DB_HOST=your_production_db_host
STRIPE_SECRET_KEY=sk_live_your_live_key
```

### Security Checklist
- [ ] Change default admin password
- [ ] Use strong JWT secret
- [ ] Enable SSL/HTTPS
- [ ] Set up proper CORS origins
- [ ] Configure rate limiting
- [ ] Set up monitoring and logging

### Performance Optimization
- [ ] Enable database connection pooling
- [ ] Set up Redis for caching
- [ ] Configure CDN for static assets
- [ ] Set up load balancing
- [ ] Monitor API response times

---

## 🎯 Next Steps

With the backend infrastructure complete, you're ready for:

1. **Phase 3**: Frontend pack catalog integration
2. **Phase 4**: Checkout flow implementation
3. **Phase 5**: Trust features and social proof
4. **Phase 6**: Admin tools and custom pack requests
5. **Phase 7**: Testing and optimization

The backend provides all necessary APIs to support the complete B2B wholesale platform functionality.

---

*Backend infrastructure is now complete and ready for frontend integration!*
