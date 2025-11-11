# Deployment Guide - Kimi Cyber

This guide will help you deploy Kimi Cyber to production.

---

## 🚀 Quick Deploy to Vercel (Recommended)

### Option 1: Deploy via Vercel Dashboard (Easiest)

1. **Go to Vercel:**
   - Visit https://vercel.com
   - Sign in with your GitHub account

2. **Import Repository:**
   - Click "Add New..." → "Project"
   - Select "Import Git Repository"
   - Choose `vanek-nutic/KymaCyber`

3. **Configure Project:**
   - Framework Preset: **Vite**
   - Build Command: `pnpm run build`
   - Output Directory: `dist`
   - Install Command: `pnpm install`

4. **Add Environment Variables:**
   - Click "Environment Variables"
   - Add:
     - `VITE_MOONSHOT_API_KEY` = `sk-UousIBehzfnqFSVL3UHD7vr1uesytwg9P2vop9x53LNmJsyW`
     - `VITE_TAVILY_API_KEY` = `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`

5. **Deploy:**
   - Click "Deploy"
   - Wait 2-3 minutes
   - Your app will be live at `https://kyma-cyber.vercel.app` (or similar)

### Option 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
cd /path/to/kimi-cyber
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - Project name? KymaCyber
# - Directory? ./
# - Override settings? No

# Add environment variables
vercel env add VITE_MOONSHOT_API_KEY
vercel env add VITE_TAVILY_API_KEY

# Deploy to production
vercel --prod
```

---

## 🌐 Alternative Deployment Options

### Netlify

1. Go to https://netlify.com
2. Click "Add new site" → "Import an existing project"
3. Connect to GitHub and select `KymaCyber`
4. Build settings:
   - Build command: `pnpm run build`
   - Publish directory: `dist`
5. Add environment variables in Site settings
6. Deploy

### GitHub Pages (Static Only)

```bash
# Install gh-pages
pnpm add -D gh-pages

# Add to package.json scripts:
"predeploy": "pnpm run build",
"deploy": "gh-pages -d dist"

# Deploy
pnpm run deploy
```

Then enable GitHub Pages in repository settings.

### Cloudflare Pages

1. Go to https://pages.cloudflare.com
2. Connect GitHub repository
3. Build settings:
   - Framework: Vite
   - Build command: `pnpm run build`
   - Output directory: `dist`
4. Add environment variables
5. Deploy

---

## 🔐 Environment Variables

Required for production:

```env
VITE_MOONSHOT_API_KEY=your_moonshot_api_key
VITE_TAVILY_API_KEY=your_tavily_api_key
```

**⚠️ Security Note:**
- Never commit `.env` files to Git
- Always use platform environment variable settings
- Rotate API keys if exposed

---

## 📦 Build for Production

```bash
# Install dependencies
pnpm install

# Build
pnpm run build

# Preview build locally
pnpm run preview
```

The build output will be in the `dist/` directory.

---

## ✅ Post-Deployment Checklist

- [ ] App loads without errors
- [ ] All features working (streaming, file upload, history)
- [ ] Mobile responsive (no horizontal scroll)
- [ ] API keys configured correctly
- [ ] HTTPS enabled
- [ ] Custom domain configured (optional)

---

## 🔧 Troubleshooting

### Build Fails

- Check Node.js version (requires 18+)
- Ensure all dependencies installed: `pnpm install`
- Check build logs for errors

### API Not Working

- Verify environment variables are set correctly
- Check API key validity
- Ensure VITE_ prefix on all env vars

### White Screen

- Check browser console for errors
- Verify build completed successfully
- Clear browser cache

---

## 🌟 Recommended: Vercel Deployment

**Why Vercel?**
- ✅ Optimized for Vite/React
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Zero configuration
- ✅ Free tier generous
- ✅ Automatic deployments from GitHub
- ✅ Preview deployments for PRs

**Your app will be live at:**
`https://kyma-cyber.vercel.app` or custom domain

---

## 📞 Support

If you encounter issues:
1. Check Vercel/Netlify deployment logs
2. Review browser console errors
3. Verify environment variables
4. Check API key permissions

---

**Happy Deploying! 🚀**
