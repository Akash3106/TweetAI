#!/usr/bin/env python3
"""
Test script to verify Twitter API configuration
"""
import os
import requests
from dotenv import load_dotenv

load_dotenv()

def test_twitter_config():
    """Test Twitter API configuration"""
    print("=== Twitter API Configuration Test ===\n")
    
    # Check environment variables
    client_id = os.getenv('TWITTER_CLIENT_ID')
    client_secret = os.getenv('TWITTER_CLIENT_SECRET')
    bearer_token = os.getenv('TWITTER_BEARER_TOKEN')
    
    print("1. Environment Variables:")
    print(f"   TWITTER_CLIENT_ID: {'✓ Set' if client_id else '✗ Missing'}")
    print(f"   TWITTER_CLIENT_SECRET: {'✓ Set' if client_secret else '✗ Missing'}")
    print(f"   TWITTER_BEARER_TOKEN: {'✓ Set' if bearer_token else '✗ Missing'}")
    
    if not all([client_id, client_secret, bearer_token]):
        print("\n❌ Missing required environment variables!")
        return False
    
    # Test Bearer Token (App-only access)
    print("\n2. Testing Bearer Token (App-only access):")
    try:
        headers = {"Authorization": f"Bearer {bearer_token}"}
        response = requests.get(
            "https://api.twitter.com/2/tweets/search/recent?query=test",
            headers=headers
        )
        
        if response.status_code == 200:
            print("   ✓ Bearer token is valid")
        else:
            print(f"   ✗ Bearer token error: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"   ✗ Bearer token test failed: {e}")
        return False
    
    # Test OAuth 2.0 configuration
    print("\n3. Testing OAuth 2.0 Configuration:")
    print("   This will test if your app is properly configured for OAuth 2.0")
    
    # Generate a test authorization URL
    import secrets
    import hashlib
    import base64
    
    def generate_code_verifier():
        return secrets.token_urlsafe(32)
    
    def generate_code_challenge(code_verifier):
        sha256_hash = hashlib.sha256(code_verifier.encode('utf-8')).digest()
        return base64.urlsafe_b64encode(sha256_hash).decode('utf-8').rstrip('=')
    
    state = secrets.token_urlsafe(32)
    code_verifier = generate_code_verifier()
    code_challenge = generate_code_challenge(code_verifier)
    
    auth_url = (
        f"https://twitter.com/i/oauth2/authorize?"
        f"response_type=code&"
        f"client_id={client_id}&"
        f"redirect_uri=http://localhost:8000/api/twitter/callback&"
        f"scope=tweet.read%20users.read%20offline.access&"
        f"state={state}&"
        f"code_challenge_method=S256&"
        f"code_challenge={code_challenge}"
    )
    
    print(f"   Authorization URL: {auth_url}")
    print("\n   To test OAuth 2.0:")
    print("   1. Open the URL above in your browser")
    print("   2. If you see a Twitter login page, your app is configured correctly")
    print("   3. If you see an error, check your Twitter app settings")
    
    print("\n4. Common Issues to Check:")
    print("   - App Type: Should be 'Web App' or 'Native App'")
    print("   - Callback URL: Should be exactly 'http://localhost:8000/api/twitter/callback'")
    print("   - App Permissions: Should include 'Read' permissions")
    print("   - OAuth 2.0: Should be enabled in your app settings")
    
    return True

if __name__ == "__main__":
    test_twitter_config() 