# Deployment Guide for Twitter Bot

This guide will help you deploy your Twitter bot application to production.

## Project Structure

- **Frontend**: React + Vite (deploy to Vercel)
- **Backend**: FastAPI (deploy to Railway/Render)

## Frontend Deployment (Vercel)

### 1. Prepare for Deployment

The frontend is already configured for Vercel deployment with:

- `vercel.json` configuration file
- Proper build settings
- Environment variable setup

### 2. Deploy to Vercel

1. **Install Vercel CLI** (if not already installed):

   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:

   ```bash
   vercel login
   ```

3. **Deploy the frontend**:

   ```bash
   vercel --prod
   ```

4. **Set Environment Variables**:
   - Go to your Vercel dashboard
   - Navigate to your project settings
   - Add the environment variable:
     - `VITE_API_URL`: Your backend API URL (e.g., `https://your-backend.railway.app/`)

### 3. Environment Variables Required

- `VITE_API_URL`: The URL of your deployed backend API

## Backend Deployment (Railway/Render)

### Option 1: Railway (Recommended)

1. **Create Railway Account**: Sign up at [railway.app](https://railway.app)

2. **Connect Repository**: Connect your GitHub repository

3. **Deploy Backend**:

   - Railway will auto-detect the Python backend
   - Set the working directory to `backend/`
   - Set the start command to: `uvicorn main:app --host 0.0.0.0 --port $PORT`

4. **Environment Variables**:
   ```
   TWITTER_CLIENT_ID=your_twitter_client_id
   TWITTER_CLIENT_SECRET=your_twitter_client_secret
   TWITTER_API_KEY=your_twitter_api_key
   TWITTER_API_SECRET=your_twitter_api_secret
   SESSION_SECRET=your_session_secret
   ```

### Option 2: Render

1. **Create Render Account**: Sign up at [render.com](https://render.com)

2. **Create Web Service**:

   - Connect your GitHub repository
   - Set build command: `pip install -r backend/requirements.txt`
   - Set start command: `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT`

3. **Environment Variables**: Same as Railway above

## Post-Deployment Steps

1. **Update Frontend API URL**: After deploying the backend, update the `VITE_API_URL` in Vercel to point to your backend URL

2. **Test the Application**:

   - Test the URL analysis feature
   - Test Twitter authentication
   - Test posting tweets

3. **Monitor Logs**: Check both frontend and backend logs for any issues

## Troubleshooting

### Common Issues

1. **CORS Errors**: The backend is configured to allow CORS from localhost:8080. Update the CORS settings in `backend/main.py` to include your Vercel domain.

2. **Environment Variables**: Make sure all required environment variables are set in both frontend and backend.

3. **Port Issues**: Railway/Render will provide a `$PORT` environment variable. The backend is configured to use this.

### Updating CORS Settings

If you encounter CORS issues, update the CORS middleware in `backend/main.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080",
        "https://your-vercel-domain.vercel.app"  # Add your Vercel domain
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Security Notes

- Never commit `.env` files to version control
- Use strong, unique session secrets
- Keep your Twitter API credentials secure
- Consider using environment-specific configurations

## Cost Considerations

- **Vercel**: Free tier available for frontend
- **Railway**: Free tier available for backend
- **Render**: Free tier available for backend

All platforms offer paid plans for production use with better performance and features.
