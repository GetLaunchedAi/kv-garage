# Deployment Guide for KV Garage

## Issue: Export Syntax Errors in Production

If you're seeing errors like `Uncaught SyntaxError: Unexpected token 'export'` in production but not locally, this is likely a **caching issue**.

### Root Cause

Netlify may be serving cached versions of your JavaScript files that contain old `export` statements. The local files have been updated, but the production cache hasn't been cleared.

## Solution: Clear Netlify Cache and Redeploy

### Option 1: Clear Cache via Netlify Dashboard (Recommended)

1. Go to your Netlify dashboard
2. Navigate to your site
3. Go to **Deploys** tab
4. Click **Deploy settings**
5. Scroll down to **Build & deploy**
6. Click **Clear cache and retry deploy**

### Option 2: Clear Cache via Command Line

```bash
# Install Netlify CLI if you haven't already
npm install -g netlify-cli

# Login to Netlify
netlify login

# Link your local repository to the Netlify site
netlify link

# Clear cache and trigger a new build
netlify build --clear-cache
netlify deploy --prod
```

### Option 3: Force New Deployment

1. Make a small change to trigger a new deployment (e.g., add a comment to a file)
2. Commit and push to your repository
3. Netlify will automatically rebuild

```bash
# Example: Update a comment in netlify.toml
git commit --allow-empty -m "Force rebuild to clear cache"
git push origin main
```

## Prevention: Updated Configuration

The following changes have been made to prevent future caching issues:

### 1. Updated `netlify.toml`

- JavaScript files now have a shorter cache time (1 hour instead of 1 year)
- `must-revalidate` directive ensures browser checks for updates
- Explicit `Content-Type` header for JavaScript files

### 2. Build Verification Script

A new `verify-build.js` script runs after each build to check for:
- Export statements in JavaScript files
- Missing required files
- Build integrity issues

Run manually with:
```bash
npm run verify
```

### 3. Updated Build Commands

- `npm run build` - Standard build with verification
- `npm run build:prod` - Production build with verification
- `npm run verify` - Run verification without rebuilding

## Troubleshooting

### If the error persists after clearing cache:

1. **Check browser cache**: Clear your browser cache or use incognito mode
2. **Check Netlify logs**: Review build logs in Netlify dashboard for errors
3. **Verify build output**: Run `npm run verify` locally to check for issues
4. **Check file timestamps**: Ensure updated files are in the `public/` directory

### Hard refresh in browser:

- **Chrome/Edge**: Ctrl + Shift + R (Windows) or Cmd + Shift + R (Mac)
- **Firefox**: Ctrl + Shift + R (Windows) or Cmd + Shift + R (Mac)
- **Safari**: Cmd + Option + R

## Configuration Files Modified

1. `.nvmrc` - Specifies Node.js version for Netlify
2. `netlify.toml` - Updated cache headers for JavaScript files
3. `package.json` - Added verification scripts
4. `verify-build.js` - New build verification script

## Next Steps

1. Clear Netlify cache using one of the methods above
2. Verify the deployment succeeded
3. Test the admin dashboard in production
4. If issues persist, check the browser console for specific errors

## Support

If you continue to experience issues after following these steps:

1. Check the Netlify build logs for errors
2. Verify all JavaScript files are being copied to `public/assets/js/`
3. Ensure the build completes successfully with `npm run build`
4. Run `npm run verify` to check for build issues

