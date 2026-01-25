# Netlify Deployment Guide for DBS Feedback System Frontend

## Prerequisites

1. A [Netlify](https://www.netlify.com/) account (free tier is sufficient)
2. Your GitHub/GitLab repository connected to Netlify (or use Netlify CLI)
3. Backend API deployed and accessible via HTTPS

## Deployment Steps

### Option 1: Deploy via Netlify UI (Recommended)

1. **Login to Netlify**
   - Go to [https://app.netlify.com](https://app.netlify.com)
   - Login with your account

2. **Create New Site**
   - Click "Add new site" → "Import an existing project"
   - Connect your Git repository (GitHub/GitLab/Bitbucket)
   - Select the DBS-Feedback-System repository

3. **Configure Build Settings**
   - **Base directory**: `frontend/feedback-frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `build`
   - **Node version**: 18.0.0 (set in netlify.toml)

4. **Set Environment Variables**
   - Go to Site settings → Environment variables
   - Add the following variables:
     ```
     REACT_APP_API_URL=https://your-backend-url.com
     REACT_APP_CHATBOT_URL=https://your-chatbot-url.com
     ```
   - Replace the URLs with your actual deployed backend and chatbot endpoints

5. **Deploy**
   - Click "Deploy site"
   - Netlify will automatically build and deploy your frontend
   - You'll get a URL like: `https://random-name-12345.netlify.app`

6. **Custom Domain (Optional)**
   - Go to Site settings → Domain management
   - Add your custom domain
   - Follow Netlify's DNS configuration instructions

### Option 2: Deploy via Netlify CLI

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify**
   ```bash
   netlify login
   ```

3. **Navigate to Frontend Directory**
   ```bash
   cd frontend/feedback-frontend
   ```

4. **Create .env.production file**
   ```bash
   # Create the file and add your environment variables
   REACT_APP_API_URL=https://your-backend-url.com
   REACT_APP_CHATBOT_URL=https://your-chatbot-url.com
   ```

5. **Build the Project**
   ```bash
   npm install
   npm run build
   ```

6. **Deploy to Netlify**
   ```bash
   # For first-time deployment
   netlify deploy --prod

   # Or use the init command
   netlify init
   ```

7. **Follow the prompts**
   - Select "Create & configure a new site"
   - Choose your team
   - Enter a site name (optional)
   - Set publish directory to: `build`

### Option 3: Drag & Drop Deploy

1. **Build Locally**
   ```bash
   cd frontend/feedback-frontend
   
   # Create .env.production with your backend URLs
   echo "REACT_APP_API_URL=https://your-backend-url.com" > .env.production
   echo "REACT_APP_CHATBOT_URL=https://your-chatbot-url.com" >> .env.production
   
   # Install and build
   npm install
   npm run build
   ```

2. **Deploy**
   - Go to [https://app.netlify.com/drop](https://app.netlify.com/drop)
   - Drag and drop the `build` folder to the upload area
   - Your site will be deployed instantly

## Configuration Files

### netlify.toml
The `netlify.toml` file in the frontend directory configures:
- Build settings (command, publish directory)
- Node version
- Redirect rules for React Router (SPA)
- Security headers

### Environment Variables

Create a `.env.production` file in the frontend directory:

```env
REACT_APP_API_URL=https://your-backend-url.com
REACT_APP_CHATBOT_URL=https://your-chatbot-url.com
```

⚠️ **Important**: Never commit `.env.production` to Git. Add it to `.gitignore`.

## Post-Deployment Configuration

### Update API Calls

Make sure your React app uses the environment variables:

```javascript
// Example: In your API service files
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8085';
const CHATBOT_URL = process.env.REACT_APP_CHATBOT_URL || 'http://localhost:3001';
```

### CORS Configuration

Ensure your backend allows requests from your Netlify domain:

```java
// In your Spring Boot backend
@CrossOrigin(origins = {
    "http://localhost:3000",
    "https://your-netlify-app.netlify.app"
})
```

## Automatic Deployments

Once connected to Git, Netlify will automatically deploy when you:
- Push to your main/master branch
- Merge a pull request
- Create a new tag

### Branch Deployments

- **Production**: Deploys from `main` or `master` branch
- **Preview**: Automatic deploy previews for pull requests
- **Branch deploys**: Deploy other branches for testing

## Monitoring and Logs

1. **Build Logs**
   - View build logs in Netlify dashboard
   - Check for any build errors or warnings

2. **Function Logs** (if using Netlify Functions)
   - Real-time function logs available in dashboard

3. **Analytics** (Optional paid feature)
   - Track page views, performance metrics

## Rollback

If a deployment breaks your site:
1. Go to Deploys tab in Netlify dashboard
2. Find the last working deployment
3. Click "Publish deploy" to rollback

## Custom Domain Setup

1. **Add Custom Domain**
   - Site settings → Domain management → Add custom domain
   - Enter your domain name

2. **Configure DNS**
   - Option A: Use Netlify DNS (recommended)
   - Option B: Point your domain's A record to Netlify's load balancer

3. **Enable HTTPS**
   - Netlify automatically provisions SSL certificate
   - Force HTTPS in domain settings

## Troubleshooting

### Build Fails

- Check Node version matches (18.0.0)
- Verify all dependencies are in package.json
- Check build logs for specific errors

### Blank Page After Deploy

- Check browser console for errors
- Verify environment variables are set
- Check that API URLs are correct and accessible

### 404 on Refresh

- Ensure `netlify.toml` redirect rules are present
- Check that the file is in the correct location

### CORS Errors

- Verify backend CORS configuration includes Netlify domain
- Check that API endpoints are accessible

## Performance Optimization

1. **Enable Asset Optimization** (in Netlify settings)
   - Bundle CSS
   - Minify CSS
   - Minify JS
   - Compress images

2. **Use Netlify CDN**
   - Automatic global CDN distribution
   - Fast load times worldwide

3. **Enable HTTP/2**
   - Automatically enabled on Netlify

## Cost Considerations

**Free Tier Includes:**
- 100 GB bandwidth per month
- 300 build minutes per month
- Unlimited sites
- Automatic HTTPS
- Continuous deployment

**Paid Plans** (if needed):
- More bandwidth and build minutes
- Analytics
- Role-based access control
- Priority support

## Security

1. **Environment Variables**
   - Never commit sensitive data to Git
   - Use Netlify environment variables for secrets

2. **Headers**
   - Security headers configured in netlify.toml
   - Additional headers can be added as needed

3. **HTTPS**
   - Always enforce HTTPS
   - Free SSL certificates via Let's Encrypt

## Next Steps

After deploying to Netlify:

1. ✅ Update backend CORS configuration with Netlify URL
2. ✅ Test all frontend functionality
3. ✅ Set up custom domain (optional)
4. ✅ Enable automatic deployments from Git
5. ✅ Monitor build logs and performance
6. ✅ Update documentation with live URLs

## Support

- [Netlify Documentation](https://docs.netlify.com/)
- [Netlify Community](https://answers.netlify.com/)
- [Netlify Status](https://www.netlifystatus.com/)
