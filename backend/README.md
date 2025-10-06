# KV Garage Backend API

Backend API for the KV Garage Wholesale Platform - a B2B marketplace for tech liquidation packs.

## Features

- **Pack Management**: Create and manage wholesale packs (Starter, Reseller, Pro)
- **Manifest System**: Detailed inventory tracking with CSV/PDF export
- **Order Processing**: Full payment and deposit payment options
- **Stripe Integration**: Secure payment processing
- **Real-time Inventory**: Live stock tracking to prevent overselling
- **Admin Panel**: Complete admin interface for pack and order management
- **Custom Pack Requests**: Handle custom pack requests from customers

## Tech Stack

- **Node.js** with Express.js
- **PostgreSQL** database
- **Stripe** for payments
- **JWT** for authentication
- **Winston** for logging
- **PDF-lib** for manifest generation

## Quick Start

### Prerequisites

- Node.js 18+ 
- PostgreSQL 12+
- Stripe account

### Installation

1. **Clone and setup**
   ```bash
   cd backend
   npm install
   ```

2. **Environment setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Database setup**
   ```bash
   # Create database
   createdb kv_garage_wholesale
   
   # Run schema
   psql kv_garage_wholesale < database/schema.sql
   
   # Seed with sample data
   npm run seed
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:3001`

## API Endpoints

### Packs
- `GET /api/packs` - List all packs
- `GET /api/packs/:id` - Get pack details with manifest
- `GET /api/packs/:id/inventory` - Get real-time inventory
- `POST /api/packs/:id/reserve` - Reserve inventory
- `POST /api/packs/:id/release` - Release inventory

### Orders
- `POST /api/orders` - Create new order
- `POST /api/orders/:id/checkout` - Initialize Stripe checkout
- `GET /api/orders/:id` - Get order details
- `PUT /api/orders/:id/status` - Update order status

### Manifests
- `GET /api/manifests/:packId` - Get manifest (JSON/CSV/PDF)
- `GET /api/manifests/:packId?format=csv` - Download CSV
- `GET /api/manifests/:packId?format=pdf` - Download PDF

### Admin
- `POST /api/admin/login` - Admin login
- `GET /api/admin/dashboard` - Dashboard statistics
- `POST /api/admin/packs` - Create pack
- `PUT /api/admin/packs/:id` - Update pack
- `POST /api/admin/manifests/upload` - Upload manifest CSV
- `GET /api/admin/orders` - List orders
- `GET /api/admin/analytics` - Sales analytics

### Custom Packs
- `POST /api/custom-packs/request` - Submit custom pack request
- `GET /api/custom-packs/requests` - List requests (admin)
- `PUT /api/custom-packs/requests/:id/status` - Update request status

### Webhooks
- `POST /api/webhooks/stripe` - Stripe webhook handler

## Database Schema

### Core Tables
- **packs**: Pack information and inventory
- **manifests**: Individual items within packs
- **orders**: Customer orders and payments
- **inventory_log**: Inventory change tracking
- **admin_users**: Admin authentication
- **custom_pack_requests**: Custom pack requests

## Environment Variables

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=kv_garage_wholesale
DB_USER=your_db_user
DB_PASSWORD=your_db_password

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# JWT
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=24h

# Server
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:8080

# Admin
ADMIN_EMAIL=admin@kvgarage.com
ADMIN_PASSWORD=your_password
```

## Development

### Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests
- `npm run seed` - Seed database with sample data

### Database Migrations
```bash
# Run schema
psql kv_garage_wholesale < database/schema.sql

# Seed data
npm run seed
```

### Testing
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage
```

## Deployment

### Production Setup
1. Set `NODE_ENV=production`
2. Configure production database
3. Set up Stripe webhook endpoints
4. Configure SSL certificates
5. Set up monitoring and logging

### Docker Deployment
```bash
# Build image
docker build -t kv-garage-backend .

# Run container
docker run -p 3001:3001 --env-file .env kv-garage-backend
```

## Security

- **Helmet.js** for security headers
- **Rate limiting** on API endpoints
- **Input validation** with express-validator
- **JWT authentication** for admin routes
- **CORS** configuration
- **SQL injection** prevention with parameterized queries

## Monitoring

- **Winston** logging with file rotation
- **Error tracking** with detailed stack traces
- **Performance monitoring** for database queries
- **Health check** endpoint at `/health`

## Support

For issues and questions:
- Check the logs in `logs/` directory
- Review API documentation
- Contact the development team

## License

ISC License - see LICENSE file for details
