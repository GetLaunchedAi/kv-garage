# KV Garage API Server

This is the backend API server for the KV Garage admin system, implementing the **Direct File Updates** approach for localhost development.

## 🚀 Quick Start

### 1. Setup API Server
```bash
# Run the setup script
./setup-api.sh

# Or manually:
cd api
npm install
```

### 2. Start Development
```bash
# Terminal 1: Start API server
cd api
./dev.sh

# Terminal 2: Start frontend
npm run dev
```

### 3. Access Admin
- **Frontend**: http://localhost:8080/admin/dashboard/
- **API**: http://localhost:3001/api/health
- **Login**: admin@kvgarage.com / admin123

## 📁 Directory Structure

```
api/
├── server.js              # Main server file
├── package.json           # Dependencies
├── .env                   # Environment variables
├── dev.sh                 # Development script
├── routes/                # API routes
│   ├── admin.js          # Authentication
│   ├── manifests.js      # Manifest upload
│   ├── packs.js          # Pack management
│   └── orders.js         # Order management
├── middleware/            # Authentication middleware
│   └── auth.js
├── utils/                 # Utilities
│   ├── file-manager.js   # JSON file operations
│   └── csv-parser.js     # CSV parsing
├── logs/                  # Log files
├── uploads/               # CSV uploads (temp)
└── backups/               # JSON backups
```

## 🔧 API Endpoints

### Authentication
- `POST /api/admin/login` - Admin login
- `GET /api/admin/verify` - Verify token
- `GET /api/admin/profile` - Get user profile
- `GET /api/admin/stats` - Dashboard statistics

### Manifests
- `POST /api/manifests/upload` - Upload CSV manifest
- `GET /api/manifests/:pack_id` - Get manifest for pack
- `GET /api/manifests` - Get all manifests
- `DELETE /api/manifests/:pack_id` - Delete manifest
- `GET /api/manifests/template` - Get CSV template
- `POST /api/manifests/validate` - Validate CSV without upload

### Packs
- `GET /api/packs` - Get all packs
- `GET /api/packs/:id` - Get specific pack
- `POST /api/packs` - Create new pack
- `PUT /api/packs/:id` - Update pack
- `DELETE /api/packs/:id` - Delete pack
- `GET /api/packs/categories` - Get categories
- `POST /api/packs/:id/duplicate` - Duplicate pack

### Orders
- `GET /api/orders` - Get all orders
- `GET /api/orders/:id` - Get specific order
- `PUT /api/orders/:id/status` - Update order status
- `PUT /api/orders/:id` - Update order
- `GET /api/orders/stats/summary` - Get order statistics

## 📊 How It Works

### Data Flow
1. **Admin uploads CSV** → Frontend sends to API
2. **API processes CSV** → Validates and parses data
3. **API updates JSON** → Writes to `public/data/manifests.json`
4. **Frontend refreshes** → Shows updated data immediately

### File Operations
- **Read**: Direct JSON file reads
- **Write**: Atomic writes with backup
- **Backup**: Automatic backup before changes
- **Recovery**: Restore from backup on failure

### Security
- **JWT Authentication** for all admin endpoints
- **File validation** for CSV uploads
- **Input sanitization** for all data
- **Error handling** with proper responses

## 🧪 Testing

### Test API Endpoints
```bash
cd api
./test-api.sh
```

### Manual Testing
```bash
# Health check
curl http://localhost:3001/api/health

# Login
curl -X POST http://localhost:3001/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@kvgarage.com","password":"admin123"}'

# Get packs
curl http://localhost:3001/api/packs
```

## 🔍 Troubleshooting

### Common Issues

1. **API not starting**
   ```bash
   # Check if port 3001 is in use
   lsof -i :3001
   
   # Kill process if needed
   kill -9 <PID>
   ```

2. **File permission errors**
   ```bash
   # Ensure API can write to data directory
   chmod -R 755 ../public/data/
   ```

3. **CSV upload fails**
   - Check file size (max 10MB)
   - Ensure CSV has required columns
   - Check file format (CSV only)

4. **Authentication fails**
   - Verify JWT secret in .env
   - Check token expiry
   - Clear browser localStorage

### Logs
- **API logs**: `api/logs/api.log`
- **Console logs**: Check terminal output
- **Browser logs**: Check browser console

## 🚀 Production Deployment

### For Cloudways Deployment
1. **Upload API files** to `/var/www/api/`
2. **Install dependencies**: `npm install --production`
3. **Set up PM2**: `pm2 start server.js`
4. **Configure Nginx** proxy to port 3001
5. **Set file permissions** for data directory
6. **Update API_BASE_URL** in frontend

### Environment Variables
```bash
NODE_ENV=production
PORT=3001
JWT_SECRET=your-production-secret-key
```

## 📝 Development Notes

### Adding New Endpoints
1. Create route in `routes/`
2. Add middleware for auth if needed
3. Update frontend to call new endpoint
4. Test with curl or Postman

### Modifying Data Structure
1. Update JSON schema in file-manager.js
2. Add migration logic if needed
3. Test with existing data
4. Update frontend accordingly

### CSV Format Requirements
```csv
sku,item_name,quantity,condition,notes,estimated_value,category,brand
CASE-001,iPhone Case,25,new,Clear case,12.00,Phone Cases,Generic
```

## 🎯 Next Steps

1. **Test manifest upload** functionality
2. **Verify data persistence** in JSON files
3. **Test all admin features** end-to-end
4. **Prepare for production** deployment
5. **Document any issues** found during testing

---

**Ready to test!** 🚀

Start both servers and visit http://localhost:8080/admin/dashboard/ to test the complete admin system.
