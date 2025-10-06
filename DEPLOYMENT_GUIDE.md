# 🚀 KV Garage Deployment Guide

## 📋 **Production Deployment Options**

### **Option 1: Netlify (Recommended)**

#### **Why Netlify?**
- ✅ **Static Site Hosting**: Perfect for Eleventy sites
- ✅ **Serverless Functions**: Handle API endpoints
- ✅ **Automatic Deployments**: Git-based CI/CD
- ✅ **Free Tier**: Generous limits for small businesses
- ✅ **CDN**: Global content delivery
- ✅ **SSL**: Automatic HTTPS

#### **Setup Steps:**

1. **Install Netlify CLI**:
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify**:
   ```bash
   netlify login
   ```

3. **Initialize Netlify**:
   ```bash
   netlify init
   ```

4. **Deploy**:
   ```bash
   netlify deploy --prod
   ```

#### **Environment Variables** (if needed):
```bash
netlify env:set STRIPE_PUBLISHABLE_KEY pk_live_...
netlify env:set STRIPE_SECRET_KEY sk_live_...
```

---

### **Option 2: Vercel**

#### **Setup Steps:**

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Deploy**:
   ```bash
   vercel --prod
   ```

---

### **Option 3: Traditional Hosting (VPS/Shared)**

#### **Requirements:**
- Node.js 18+ server
- PostgreSQL database
- SSL certificate
- Domain name

#### **Setup Steps:**

1. **Upload Files**:
   ```bash
   rsync -avz --exclude node_modules . user@server:/var/www/kv-garage/
   ```

2. **Install Dependencies**:
   ```bash
   cd /var/www/kv-garage
   npm install
   npm run build
   ```

3. **Setup Database**:
   ```bash
   psql -U postgres -d kv_garage < backend/database/schema.sql
   ```

4. **Configure Environment**:
   ```bash
   cp .env.example .env
   # Edit .env with production values
   ```

5. **Start Services**:
   ```bash
   # Using PM2
   pm2 start backend/server.js --name kv-garage-api
   pm2 start "npm run start" --name kv-garage-frontend
   ```

---

## 🔧 **Current Architecture**

### **Development Mode:**
```
Frontend (Eleventy) → http://localhost:8080
Backend (Mock)      → http://localhost:3001
```

### **Production Mode (Netlify):**
```
Frontend (Static)   → https://your-site.netlify.app
API (Functions)     → https://your-site.netlify.app/api/*
```

---

## 📁 **File Structure for Production**

```
kv-garage/
├── netlify/
│   └── functions/
│       ├── hero-catalog.js    # PDF generation
│       ├── packs.js           # Pack listing
│       └── pack-detail.js     # Individual pack details
├── netlify.toml               # Netlify configuration
├── public/                    # Built Eleventy site
├── src/                       # Source files
└── package.json               # Dependencies
```

---

## 🎯 **API Endpoints**

### **Production URLs:**
- `GET /api/packs` → List all packs
- `GET /api/packs/:id` → Get pack details
- `GET /api/catalogs/hero` → Download Hero Catalog PDF

### **Development URLs:**
- `GET http://localhost:3001/api/packs`
- `GET http://localhost:3001/api/packs/:id`
- `GET http://localhost:3001/api/catalogs/hero`

---

## 🔄 **Deployment Workflow**

### **Automatic (Git-based):**
1. Push to `main` branch
2. Netlify automatically builds and deploys
3. Functions are deployed to serverless environment

### **Manual:**
```bash
# Build the site
npm run build

# Deploy to Netlify
netlify deploy --prod

# Or deploy to Vercel
vercel --prod
```

---

## 🛠 **Environment Configuration**

### **Development:**
```javascript
// Automatically detected
const API_BASE_URL = 'http://localhost:3001/api';
```

### **Production:**
```javascript
// Automatically detected
const API_BASE_URL = '/api';
```

---

## 📊 **Performance Considerations**

### **Netlify Functions:**
- ⚡ **Cold Start**: ~100-200ms first request
- 🔥 **Warm**: ~10-50ms subsequent requests
- 📈 **Timeout**: 10 seconds max
- 💾 **Memory**: 1024MB max

### **Static Assets:**
- 🚀 **CDN**: Global edge caching
- 📦 **Compression**: Automatic gzip/brotli
- 🖼 **Images**: Optimized delivery

---

## 🔒 **Security Features**

### **Headers (netlify.toml):**
```toml
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
```

### **CORS:**
```javascript
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};
```

---

## 🚨 **Troubleshooting**

### **Common Issues:**

1. **Function Timeout**:
   - Optimize PDF generation
   - Use smaller images
   - Implement caching

2. **CORS Errors**:
   - Check function headers
   - Verify API URLs

3. **Build Failures**:
   - Check Node.js version
   - Verify dependencies
   - Review build logs

### **Debug Commands:**
```bash
# Test functions locally
netlify dev

# Check function logs
netlify functions:list
netlify functions:invoke hero-catalog

# View deployment logs
netlify logs
```

---

## 📈 **Scaling Considerations**

### **Current Limits:**
- **Netlify Free**: 100GB bandwidth/month
- **Functions**: 125,000 requests/month
- **Build Time**: 300 minutes/month

### **Upgrade Path:**
- **Pro Plan**: $19/month
- **Business Plan**: $99/month
- **Enterprise**: Custom pricing

---

## 🎉 **Ready to Deploy!**

Your KV Garage wholesale marketplace is now ready for production deployment on Netlify with:

✅ **Professional PDF Generation**  
✅ **Serverless API Functions**  
✅ **Automatic Environment Detection**  
✅ **Production-Ready Configuration**  
✅ **Security Headers**  
✅ **Performance Optimization**  

Choose your deployment method and go live! 🚀
