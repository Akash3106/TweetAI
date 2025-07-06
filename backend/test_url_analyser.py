#!/usr/bin/env python3
"""
Test script for url_analyser.py to verify the ChatOpenAI fix
"""

import os
from dotenv import load_dotenv
from tools.url_analyser import tweet_from_url

# Load environment variables
load_dotenv()

def test_url_analysis():
    """Test the URL analysis functionality"""
    try:
        # Test with a simple URL
        test_url = "https://techcrunch.com/2024/01/15/ai-startup-funding/"
        
        print("🧪 Testing URL analysis...")
        print(f"URL: {test_url}")
        
        # Test the tweet generation
        result = tweet_from_url(test_url, "Make this tweet engaging and technical")
        
        if result is None:
            print("❌ URL analysis returned None - likely no content found")
        elif result.get("success"):
            print("✅ URL analysis successful!")
            print(f"📝 Generated tweet: {result.get('tweet', 'No tweet generated')}")
            print(f"🧵 Thread tweets: {len(result.get('thread_tweets', []))}")
        else:
            print("❌ URL analysis failed!")
            print(f"Error: {result.get('error', 'Unknown error')}")
            
    except Exception as e:
        print(f"❌ Test failed with exception: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_url_analysis() 