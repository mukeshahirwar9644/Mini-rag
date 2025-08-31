# 🚀 Deployment Guide - Mini RAG Application

This guide provides step-by-step instructions for deploying the Mini RAG application on various free hosting platforms.

## 🌐 Free Hosting Options

### 1. Render (Recommended)
- **Free Tier**: 750 hours/month
- **Pros**: Easy deployment, automatic builds, environment variables
- **Cons**: Sleeps after 15 minutes of inactivity

### 2. Railway
- **Free Tier**: $5 credit monthly
- **Pros**: Simple deployment, good performance
- **Cons**: Limited free tier

### 3. Fly.io
- **Free Tier**: Generous limits
- **Pros**: Global edge deployment, Docker support
- **Cons**: More complex setup

### 4. Netlify Functions
- **Free Tier**: 125K requests/month
- **Pros**: Great for frontend, serverless functions
- **Cons**: Limited backend capabilities

## 🚀 Render Deployment (Step-by-Step)

### Step 1: Prepare Your Repository
1. Push your code to GitHub
2. Ensure your repository is public (or connect a private repo to Render)

### Step 2: Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up with GitHub account
3. Verify your email

### Step 3: Deploy the Application
1. Click "New +" button
2. Select "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `mini-rag-app`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

### Step 4: Set Environment Variables
In your Render service dashboard, go to "Environment" tab and add:
```
QDRANT_URL=https://your-cluster.qdrant.io
QDRANT_API_KEY=your_qdrant_api_key
COHERE_API_KEY=your_cohere_api_key
GROQ_API_KEY=your_groq_api_key
PORT=10000
```

**Note**: Render uses port 10000 by default for free tier

### Step 5: Deploy
1. Click "Create Web Service"
2. Wait for build to complete (5-10 minutes)
3. Your app will be available at `https://your-app-name.onrender.com`

## 🚂 Railway Deployment

### Step 1: Setup
1. Go to [railway.app](https://railway.app)
2. Sign in with GitHub
3. Click "New Project"

### Step 2: Deploy
1. Select "Deploy from GitHub repo"
2. Choose your repository
3. Railway will auto-detect Node.js
4. Add environment variables in the Variables tab

### Step 3: Configure
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Port**: Railway auto-assigns

## 🪰 Fly.io Deployment

### Step 1: Install Fly CLI
```bash
# macOS
brew install flyctl

# Windows
iwr https://fly.io/install.ps1 -useb | iex

# Linux
curl -L https://fly.io/install.sh | sh
```

### Step 2: Login
```bash
fly auth login
```

### Step 3: Create App
```bash
fly launch
# Follow the prompts
# Choose app name
# Select region
# Don't deploy yet
```

### Step 4: Configure
Edit `fly.toml`:
```toml
[env]
  PORT = "8080"

[[services]]
  internal_port = 8080
  protocol = "tcp"
  [services.ports]
    port = 80
    handlers = ["http"]
```

### Step 5: Deploy
```bash
fly deploy
```

## 🔧 Environment Variables Setup

### Required Variables
```env
QDRANT_URL=https://your-cluster.qdrant.io
QDRANT_API_KEY=your_qdrant_api_key
COHERE_API_KEY=your_cohere_api_key
GROQ_API_KEY=your_groq_api_key
PORT=3000
```

### Getting API Keys

#### Qdrant Cloud
1. Go to [cloud.qdrant.io](https://cloud.qdrant.io)
2. Create account and cluster
3. Get URL and API key from dashboard

#### Cohere AI
1. Go to [cohere.ai](https://cohere.ai)
2. Sign up and get API key
3. Free tier: 100 requests/month

#### Groq Cloud
1. Go to [console.groq.com](https://console.groq.com)
2. Create account and get API key
3. Free tier: 100 requests/minute

## 📁 Repository Structure for Deployment

Ensure your repository has this structure:
```
mini-rag2/
├── package.json
├── server.js
├── public/
│   └── index.html
├── env.example
├── README.md
└── .gitignore
```

## 🚫 Common Deployment Issues

### Port Configuration
- **Render**: Use `PORT=10000` or let Render assign
- **Railway**: Auto-assigned, no changes needed
- **Fly.io**: Use `PORT=8080` in fly.toml

### Build Failures
- Ensure `package.json` has correct scripts
- Check Node.js version compatibility
- Verify all dependencies are in `dependencies` (not `devDependencies`)

### Environment Variables
- Double-check API keys are correct
- Ensure variable names match exactly
- Restart service after adding variables

### CORS Issues
- Frontend and backend must be on same domain
- Or configure CORS properly for cross-origin

## 🔍 Post-Deployment Testing

### 1. Health Check
```bash
curl https://your-app.onrender.com/api/health
```

### 2. Test Upload
```bash
curl -X POST https://your-app.onrender.com/api/upload \
  -F "text=This is a test document for the Mini RAG system."
```

### 3. Test Query
```bash
curl -X POST https://your-app.onrender.com/api/query \
  -H "Content-Type: application/json" \
  -d '{"query":"What is this system about?"}'
```

## 📊 Monitoring and Maintenance

### Render Dashboard
- View logs in real-time
- Monitor resource usage
- Set up alerts for failures

### Health Monitoring
- Use `/api/health` endpoint
- Monitor response times
- Check error rates

### Cost Management
- Monitor API usage
- Set up usage alerts
- Optimize chunk sizes if needed

## 🔄 Continuous Deployment

### GitHub Actions (Optional)
Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Render
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Render
        uses: johnbeynon/render-deploy-action@v1.0.0
        with:
          service-id: ${{ secrets.RENDER_SERVICE_ID }}
          api-key: ${{ secrets.RENDER_API_KEY }}
```

## 🆘 Troubleshooting

### Service Won't Start
1. Check build logs
2. Verify environment variables
3. Check port configuration
4. Review package.json scripts

### API Errors
1. Verify API keys are valid
2. Check service quotas
3. Review CORS settings
4. Test endpoints individually

### Performance Issues
1. Monitor response times
2. Check API rate limits
3. Optimize chunk sizes
4. Review database performance

## 📞 Support Resources

- **Render**: [docs.render.com](https://docs.render.com)
- **Railway**: [docs.railway.app](https://docs.railway.app)
- **Fly.io**: [fly.io/docs](https://fly.io/docs)
- **GitHub Issues**: Create issue in your repository

---

**Happy Deploying! 🚀**
