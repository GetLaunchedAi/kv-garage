# KV Garage - Source Directory

This is the **source directory** for the KV Garage B2B wholesale marketplace. This folder contains all the source files that get built into the `public/` directory.

## Quick Start

### Development
```bash
# From the project root
npm run dev
```

### Build
```bash
# From the project root
npm run build
```

### Verify Build
```bash
# From the project root (not from src/ directory)
npm run verify
```

## Directory Structure

```
src/
├── _data/              # JSON data files (packs, manifests, etc.)
├── _layouts/           # Page templates (base.html)
├── _includes/          # Reusable components (header, footer)
├── assets/             # Static assets
│   ├── js/            # JavaScript files
│   ├── css/           # Stylesheets
│   ├── images/        # Images and graphics
│   └── fonts/         # Web fonts
├── pages/              # Page content (HTML files)
│   └── admin/         # Admin pages
├── images/             # Source images
└── products/           # Product data
```

## Key Files

### JavaScript Files
- `assets/js/admin-dashboard.js` - Admin dashboard functionality
- `assets/js/shared-admin-auth.js` - Authentication system
- `assets/js/auth-service.js` - Auth service utilities
- `assets/js/nav.js` - Navigation functionality

### Data Files
- `_data/packs.json` - Wholesale pack definitions
- `_data/manifests.json` - Pack manifest data
- `_data/products.json` - Product catalog
- `_data/client.json` - Site configuration

### Templates
- `_layouts/base.html` - Base page template
- `_includes/header.html` - Site header
- `_includes/footer.html` - Site footer

## Admin System

**Demo Login Credentials:**
- Email: `admin@kvgarage.com`
- Password: `admin123`

### Admin Pages
- `/admin/dashboard/` - Main admin dashboard
- `/admin/packs/` - Pack management
- `/admin/orders/` - Order management

## Deployment Issues

If you encounter **export syntax errors** in production:

1. **Quick Fix**: See `QUICK-FIX.md`
2. **Detailed Guide**: See `DEPLOYMENT.md`
3. **Verify Build**: Run `npm run verify`

### Common Issues
- **Cached JavaScript files** on Netlify
- **Missing image references** (logo-light.png, shop_banner_img.png)
- **JavaScript syntax errors** in nav.js

## Development Workflow

1. **Edit files** in this `src/` directory
2. **Run build** with `npm run build` (from project root)
3. **Verify build** with `npm run verify`
4. **Test locally** with `npm run dev`
5. **Deploy** to production

## Build Process

The build process (Eleventy) copies files from `src/` to `public/`:
- HTML templates → `public/`
- Assets → `public/assets/`
- Data files → `public/data/`
- Images → `public/images/`

## Troubleshooting

### Build Verification
```bash
# Check for common build issues
npm run verify
```

### Common Fixes
1. **Missing images**: Update references to use existing files
2. **Export errors**: Clear Netlify cache
3. **Syntax errors**: Check JavaScript files for syntax issues

## Related Files

- `../README.md` - Main project documentation
- `../QUICK-FIX.md` - Quick deployment fixes
- `../DEPLOYMENT.md` - Detailed deployment guide
- `../verify-build.js` - Build verification script
- `../netlify.toml` - Netlify configuration
