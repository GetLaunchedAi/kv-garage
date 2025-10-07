# Quick Fix: Export Syntax Errors in Production

## TL;DR

Your production site is serving **cached JavaScript files** with old `export` statements. The local files are correct.

## Fix (Choose One):

### Option 1: Netlify Dashboard (Easiest)

1. Go to [app.netlify.com](https://app.netlify.com)
2. Open your site
3. **Deploys** → **Deploy settings** → **Clear cache and retry deploy**

### Option 2: Force New Deployment

```bash
git commit --allow-empty -m "Clear Netlify cache"
git push origin main
```

### Option 3: Netlify CLI

```bash
netlify build --clear-cache
netlify deploy --prod
```

## After Deploying:

1. **Hard refresh** your browser:
   - Chrome/Firefox: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
   - Safari: `Cmd + Option + R`

2. **Test** the admin dashboard login

3. If still broken, check browser console for new errors

## What Changed:

✅ Fixed JavaScript cache headers (1 hour instead of 1 year)  
✅ Added `must-revalidate` directive  
✅ Added build verification script  
✅ Updated Netlify configuration  

## Verify Everything Works:

```bash
npm run verify
```

This will check your build for common issues.

## Need Help?

See `DEPLOYMENT.md` for detailed troubleshooting.
