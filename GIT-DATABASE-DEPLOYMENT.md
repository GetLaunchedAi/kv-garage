# Git Database Deployment Guide

This guide shows you how to deploy your KV Garage admin system using Git as your database with Railway hosting.

## 🎯 **What You'll Get**

✅ **Complete Version Control** - Every admin action creates a Git commit
✅ **Automatic Backups** - Git provides natural backup and recovery
✅ **Audit Trail** - See who changed what and when
✅ **Zero Database Costs** - No hosting fees for database
✅ **Rollback Capability** - Undo any change with Git
✅ **Collaboration** - Multiple admins can work safely

## 📋 **Prerequisites**

- GitHub account
- Railway account
- Netlify account (for frontend)
- Your existing KV Garage codebase

## 🚀 **Step 1: Create GitHub Data Repository**

### 1.1 Create Repository
1. Go to [GitHub](https://github.com) and create a new repository
2. Name: `kv-garage-data`
3. Visibility: **Private** (important for security)
4. Initialize with README

### 1.2 Upload Initial Data
```bash
# Clone your new repository
git clone https://github.com/your-username/kv-garage-data.git
cd kv-garage-data

# Copy your existing JSON files
cp ../kv-garage/public/data/*.json ./

# Create manifests directory
mkdir manifests

# Commit and push initial data
git add .
git commit -m "Initial data import from KV Garage"
git push origin main
```

### 1.3 Create GitHub Personal Access Token
1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a name: "KV Garage API"
4. Select scopes:
   - ✅ `repo` (Full control of private repositories)
   - ✅ `workflow` (Update GitHub Action workflows)
5. Click "Generate token"
6. **Copy the token** - you'll need it for Railway

## 🚂 **Step 2: Deploy API to Railway**

### 2.1 Prepare API for Railway
Your API is already configured! The changes we made include:
- ✅ Git database service
- ✅ Updated routes for Git operations
- ✅ Railway configuration file
- ✅ Environment variables setup

### 2.2 Deploy to Railway
1. Go to [Railway.app](https://railway.app)
2. Sign up/login with GitHub
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Choose your `kv-garage` repository
6. Select the `api` folder as the root directory
7. Railway will automatically detect it's a Node.js project

### 2.3 Configure Environment Variables
In Railway dashboard, go to your project → Variables tab and add:

```bash
# Required Variables
NODE_ENV=production
PORT=3001
JWT_SECRET=your-super-secret-jwt-key-change-this
GITHUB_TOKEN=your-github-personal-access-token
GITHUB_OWNER=your-github-username
GITHUB_REPO=kv-garage-data
GITHUB_BRANCH=main

# Optional Variables
CORS_ORIGIN=https://your-site.netlify.app
ADMIN_EMAIL=admin@kvgarage.com
ADMIN_PASSWORD=admin123
```

### 2.4 Get Railway URL
After deployment, Railway will give you a URL like:
`https://your-app-name.railway.app`

**Save this URL** - you'll need it for the frontend!

## 🌐 **Step 3: Update Frontend Configuration**

### 3.1 Update API URLs
Replace `your-railway-app.railway.app` with your actual Railway URL in these files:

**File: `src/assets/js/shared-admin-auth.js`**
```javascript
window.API_BASE_URL = isLocalhost 
  ? 'http://localhost:3001/api' 
  : 'https://YOUR-ACTUAL-RAILWAY-URL.railway.app/api';
```

**File: `src/assets/js/pack-loader.js`**
```javascript
this.apiBaseUrl = window.location.hostname === 'localhost' 
  ? 'http://localhost:3001/api' 
  : 'https://YOUR-ACTUAL-RAILWAY-URL.railway.app/api';
```

### 3.2 Deploy Frontend to Netlify
1. Push your changes to GitHub
2. Connect your repository to Netlify
3. Set build command: `npm run build`
4. Set publish directory: `public`
5. Deploy!

## 🧪 **Step 4: Test Your Deployment**

### 4.1 Test API Endpoints
```bash
# Test health endpoint
curl https://your-railway-url.railway.app/api/health

# Test packs endpoint
curl https://your-railway-url.railway.app/api/packs

# Test admin login
curl -X POST https://your-railway-url.railway.app/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@kvgarage.com","password":"admin123"}'
```

### 4.2 Test Admin Dashboard
1. Go to your Netlify site: `https://your-site.netlify.app/admin/dashboard/`
2. Login with: `admin@kvgarage.com` / `admin123`
3. Test creating a new pack
4. Check your GitHub repository - you should see new commits!

### 4.3 Test Git Integration
1. Go to your `kv-garage-data` repository on GitHub
2. Check the **Commits** tab
3. You should see commits like:
   - "Add new pack: Starter Lot by admin@kvgarage.com"
   - "Update pack: Growth Lot by admin@kvgarage.com"
   - "Upload manifest for pack 123 by admin@kvgarage.com"

## 🔧 **Step 5: Production Optimization**

### 5.1 Security Improvements
1. **Change admin credentials** in Railway environment variables
2. **Use strong JWT secret** (generate with: `openssl rand -base64 32`)
3. **Update CORS_ORIGIN** to your actual Netlify domain

### 5.2 Monitoring Setup
1. **Railway Logs**: Check Railway dashboard for API logs
2. **GitHub Activity**: Monitor your data repository for commits
3. **Netlify Analytics**: Track frontend performance

### 5.3 Backup Strategy
Your data is automatically backed up in Git! But you can also:
1. **Export data**: Clone your `kv-garage-data` repository locally
2. **GitHub Actions**: Set up automated backups to other services
3. **Database migration**: Easy to migrate to traditional database later

## 🎉 **You're Done!**

Your KV Garage admin system is now running with:
- ✅ **Frontend** on Netlify (fast, global CDN)
- ✅ **API Server** on Railway (scalable, managed)
- ✅ **Database** in Git (versioned, free, auditable)

## 🔍 **How It Works**

### **Admin Creates Pack:**
1. Admin fills form in Netlify frontend
2. Frontend sends request to Railway API
3. API creates Git commit in GitHub repository
4. Pack data is stored in `packs.json`
5. Admin sees success message

### **Admin Views Activity:**
1. Admin opens dashboard
2. Frontend requests activity from Railway API
3. API fetches Git commit history from GitHub
4. Activity log shows all admin actions with timestamps

### **Data Recovery:**
1. Any admin action can be undone
2. Git history shows exactly what changed
3. Easy rollback to any previous state
4. Complete audit trail of all changes

## 🆘 **Troubleshooting**

### **API Not Working:**
- Check Railway logs in dashboard
- Verify environment variables are set
- Test API endpoints with curl

### **Git Commits Not Appearing:**
- Check GitHub token has correct permissions
- Verify repository name and owner
- Check Railway logs for Git errors

### **Frontend Can't Connect:**
- Verify Railway URL is correct in frontend files
- Check CORS settings in API
- Test API endpoints directly

## 📞 **Support**

If you need help:
1. Check Railway logs for API errors
2. Check GitHub repository for commit history
3. Test individual API endpoints
4. Verify environment variables are correct

**Your admin system now has enterprise-grade version control with zero database costs!** 🚀
