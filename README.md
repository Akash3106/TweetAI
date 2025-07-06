# Twitter Bot Setup Guide

## 1. Get Twitter API Credentials

### Step 1: Create a Twitter Developer Account

1. Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Sign in with your Twitter account
3. Apply for a developer account if you haven't already

### Step 2: Create a Twitter App

1. In the developer portal, click "Create App"
2. Fill in the required information:
   - App name: "Twitter Bot" (or your preferred name)
   - App description: "A bot for analyzing Twitter URLs"
   - Website URL: `http://localhost:8080` (for development)
   - Callback URL: `http://localhost:8000/api/twitter/callback`

### Step 3: Get Your Credentials

1. In your app dashboard, go to "Keys and Tokens"
2. Copy the following:
   - **API Key** (this is your `TWITTER_CLIENT_ID`)
   - **API Secret** (this is your `TWITTER_CLIENT_SECRET`)
   - **Bearer Token** (this is your `TWITTER_BEARER_TOKEN`)

### Step 4: Configure App Permissions

1. Go to "App Permissions" in your app dashboard
2. Set permissions to "Read" (for reading tweets and user info)
3. Save the changes

## 2. Configure Environment Variables

Edit the `.env` file in the backend directory and replace the placeholder values:

```env
# Twitter API v2 OAuth 2.0 Credentials
TWITTER_CLIENT_ID=your_actual_client_id_here
TWITTER_CLIENT_SECRET=your_actual_client_secret_here

# Session secret for FastAPI (generate a random string)
SESSION_SECRET=your_random_session_secret_here

# Frontend URL
VITE_BASE_URL=http://localhost:8080

# Twitter API v2 Bearer Token
TWITTER_BEARER_TOKEN=your_actual_bearer_token_here
```

## 3. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

## 4. Run the Backend

```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## 5. Test the Setup

1. Start your frontend (if not already running):

   ```bash
   cd ../
   npm run dev
   ```

2. Visit `http://localhost:8080` in your browser

3. Click the "Login with Twitter" button to test the OAuth flow

## Troubleshooting

### Common Issues:

1. **"Invalid client_id" error**: Make sure your `TWITTER_CLIENT_ID` is correct
2. **"Invalid redirect_uri" error**: Ensure your callback URL matches exactly what you set in the Twitter app
3. **CORS errors**: The backend is configured to allow requests from `http://localhost:8080`
4. **Session errors**: Make sure `SESSION_SECRET` is set to a random string

### Important Notes:

- The Twitter API v2 uses OAuth 2.0, which is different from the old OAuth 1.0a
- Your app needs to be approved for OAuth 2.0 access in the Twitter developer portal
- For production, you'll need to update the callback URLs to your actual domain
- The Bearer Token is for app-only access (reading public tweets)
- The OAuth 2.0 flow is for user-specific access (reading user's tweets, posting, etc.)

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/twitter/login` - Start Twitter OAuth flow
- `GET /api/twitter/callback` - Handle OAuth callback
- `GET /api/twitter/user` - Get current user info
- `GET /api/twitter/logout` - Logout user
- `GET /api/url-analysis?url=<tweet_url>` - Analyze a tweet URL
