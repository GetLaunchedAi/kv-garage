# KV Garage - B2B Wholesale Marketplace

A modern B2B wholesale marketplace for tech liquidation packs, built with Eleventy and deployed on Netlify.

## Features

- **Static Site Generation** with Eleventy
- **JSON-based data** for packs and manifests
- **Admin dashboard** with persistent authentication
- **Shopping cart** integration with Snipcart
- **Responsive design** with dark mode support
- **Performance optimized** with image optimization

## Tech Stack

- **Eleventy** - Static site generator
- **Snipcart** - Shopping cart and checkout
- **JSON files** - Data storage (no database required)
- **Netlify** - Hosting and deployment

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

4. Open http://localhost:8080 in your browser

### Build for Production

```bash
npm run build
```

## Project Structure

```
src/
├── _data/           # JSON data files
├── _layouts/        # Page templates
├── _includes/       # Reusable components
├── assets/          # Static assets (JS, CSS, images)
├── pages/           # Page content
└── admin/           # Admin pages

public/              # Built site (auto-generated)
├── data/            # JSON data files
└── ...
```

## Data Management

The site uses JSON files for data storage:

- **Packs**: `/public/data/packs.json`
- **Manifests**: `/public/data/manifests.json`

## Admin System

Access admin features at `/admin/`:

- **Dashboard**: `/admin/dashboard/`
- **Pack Management**: `/admin/packs/`
- **Order Management**: `/admin/orders/`

**Demo Login Credentials:**
- Email: `admin@kvgarage.com`
- Password: `admin123`

## Deployment

The site is configured for Netlify deployment:

1. Connect your repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `public`
4. Deploy!

### Troubleshooting Production Issues

If you encounter issues in production (especially "Unexpected token 'export'" errors):

- See **[QUICK-FIX.md](./QUICK-FIX.md)** for immediate solutions
- See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for detailed troubleshooting

The most common issue is **cached JavaScript files** on Netlify. Solution: Clear Netlify cache and redeploy.

## Configuration

### Snipcart Setup

1. Get your API key from [Snipcart Dashboard](https://app.snipcart.com/dashboard/account/credentials)
2. Replace the test API key in `src/_layouts/base.html`

### Environment Variables

No environment variables required - everything runs on static JSON data.

## Development

### Adding New Packs

1. Edit `/public/data/packs.json`
2. Add manifest data to `/public/data/manifests.json`
3. Rebuild the site

### Customizing Admin

Admin functionality is handled by:
- `src/assets/js/shared-admin-auth.js` - Authentication system
- `src/assets/js/admin-*.js` - Admin page functionality

## License

MIT License