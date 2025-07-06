import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { Bot, XIcon, Globe, Sparkles, CheckCircle, Clock, AlertCircle, Upload, Image, Trash2, Plus, Menu, X } from "lucide-react";

const Index = () => {
  const [blogUrl, setBlogUrl] = useState("");
  const [additionalText, setAdditionalText] = useState("");
  const [generatedTweet, setGeneratedTweet] = useState("");
  const [threadTweets, setThreadTweets] = useState<string[]>([]);
  const [isThread, setIsThread] = useState(false);
  const [threadImages, setThreadImages] = useState<{ [key: number]: { file: File; previewUrl: string } }>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [currentStep, setCurrentStep] = useState<"input" | "preview" | "posted">("input");
  const [twitterUser, setTwitterUser] = useState<string | null>(null);
  const [currentSource, setCurrentSource] = useState<'techcrunch' | 'theverge' | 'wired' | 'hackernews' | 'devto' | 'medium'>('techcrunch');
  const [articles, setArticles] = useState<any[]>([]);
  const [loadingArticles, setLoadingArticles] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const TWEET_LIMIT = 280;
  const REASONABLE_EXTENDED_LIMIT = 500; // Allow up to 500 characters for valuable content

  // Animation effects
  useEffect(() => {
    setAnimateIn(true);
  }, []);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (isMobile && showSidebar) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobile, showSidebar]);

  // Split text into thread tweets
  const createThread = (text: string): string[] => {
    // If the tweet is within reasonable extended limit and provides value, keep it as a single tweet
    if (text.length <= REASONABLE_EXTENDED_LIMIT) {
      return [text];
    }
    
    // Only create threads for very long content
    if (text.length <= TWEET_LIMIT) return [text];
    
    const sentences = text.split(/[.!?]\s+/);
    const threads: string[] = [];
    let currentTweet = "";
    let threadNumber = 1;
    
    for (const sentence of sentences) {
      const threadPrefix = `${threadNumber}/${Math.ceil(text.length / (TWEET_LIMIT - 10))} `;
      const potentialTweet = threadNumber === 1 
        ? currentTweet + sentence + ". "
        : threadPrefix + currentTweet + sentence + ". ";
      
      if (potentialTweet.length > TWEET_LIMIT && currentTweet.length > 0) {
        threads.push(threadNumber === 1 ? currentTweet.trim() : threadPrefix + currentTweet.trim());
        currentTweet = sentence + ". ";
        threadNumber++;
      } else {
        currentTweet += sentence + ". ";
      }
    }
    
    if (currentTweet.trim()) {
      const threadPrefix = `${threadNumber}/${Math.ceil(text.length / (TWEET_LIMIT - 10))} `;
      threads.push(threadNumber === 1 ? currentTweet.trim() : threadPrefix + currentTweet.trim());
    }
    
    return threads;
  };

  // Update threadTweets when generatedTweet changes or on generation
  useEffect(() => {
    if (generatedTweet) {
      setThreadTweets(createThread(generatedTweet));
    } else {
      setThreadTweets([]);
    }
    // eslint-disable-next-line
  }, [generatedTweet]);

  // Check Twitter authentication status and handle redirect
  useEffect(() => {
    // Check if we have a Twitter user in URL params (after OAuth redirect)
    const urlParams = new URLSearchParams(window.location.search);
    const twitterUserParam = urlParams.get('twitter_user');
    
    if (twitterUserParam) {
      setTwitterUser(twitterUserParam);
      toast({
        title: "Twitter Connected!",
        description: `Successfully connected to @${twitterUserParam}`,
      });
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    // Check current authentication status
    const checkAuthStatus = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}api/twitter/user`, {
          credentials: 'include',
        });
        if (response.ok) {
          const userData = await response.json();
          setTwitterUser(userData.data?.username || 'Connected');
        }
      } catch (error) {
        // User not authenticated, that's fine
      }
    };
    
    checkAuthStatus();
  }, [toast]);

  // Fetch articles when source changes
  useEffect(() => {
    const fetchArticles = async () => {
      setLoadingArticles(true);
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}api/tech-articles?source=${currentSource}`);
        if (response.ok) {
          const data = await response.json();
          setArticles(data.articles || []);
        } else {
          console.error('Failed to fetch articles');
          setArticles([]);
        }
      } catch (error) {
        console.error('Error fetching articles:', error);
        setArticles([]);
      } finally {
        setLoadingArticles(false);
      }
    };

    fetchArticles();
  }, [currentSource]);


  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>, tweetIndex: number) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "File too large",
          description: "Please upload an image smaller than 5MB",
          variant: "destructive",
        });
        return;
      }

      const previewUrl = URL.createObjectURL(file);
      setThreadImages(prev => ({
        ...prev,
        [tweetIndex]: { file, previewUrl }
      }));
      
      toast({
        title: "Image uploaded",
        description: `Image added to tweet ${tweetIndex + 1}`,
      });
    }
  };

  const removeImage = (tweetIndex: number) => {
    const imageData = threadImages[tweetIndex];
    if (imageData?.previewUrl) {
      URL.revokeObjectURL(imageData.previewUrl);
    }
    
    setThreadImages(prev => {
      const newImages = { ...prev };
      delete newImages[tweetIndex];
      return newImages;
    });
    
    toast({
      title: "Image removed",
      description: `Image removed from tweet ${tweetIndex + 1}`,
    });
  };

  const handleGenerateTweet = async () => {
    if (!blogUrl.trim()) {
      toast({
        title: "URL Required",
        description: "Please enter a blog URL to generate a tweet",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      const params = new URLSearchParams({
        url: blogUrl,
        ...(additionalText.trim() && { additional_text: additionalText.trim() })
      });
      
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}api/url-analysis?${params}`
      );
      if (!response.ok) {
        throw new Error("Failed to generate tweet from API");
      }
      const data = await response.json();
      
      setGeneratedTweet(data.tweet || "");
      
      // Handle thread data from backend
      if (data.thread_tweets && data.thread_tweets.length > 0) {
        setThreadTweets(data.thread_tweets);
        setIsThread(data.is_thread || data.thread_tweets.length > 1);
      } else {
        // Fallback to frontend thread creation
        const frontendThreads = createThread(data.tweet || "");
        setThreadTweets(frontendThreads);
        setIsThread(frontendThreads.length > 1);
      }
      
      setCurrentStep("preview");
      
      const threadCount = data.thread_tweets ? data.thread_tweets.length : createThread(data.tweet || "").length;
      toast({
        title: "Tweet Generated!",
        description: threadCount > 1 
          ? `Your thread with ${threadCount} tweets is ready for review` 
          : data.tweet.length > TWEET_LIMIT 
            ? "Your extended tweet is ready for review" 
            : "Your tweet is ready for review",
      });
    } 
    catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate tweet. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePostTweet = async () => {
    setIsPosting(true);
    try {
      const formData = new FormData();
      threadTweets.forEach((tweet, i) => {
        formData.append('tweets', tweet);
        if (threadImages[i]) {
          formData.append(`image_${i}`, threadImages[i].file);
        }
      });
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}api/twitter/post`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (response.status === 401) {
        // User not authenticated, redirect to Twitter login
        const errorData = await response.json();
        toast({
          title: "Authentication Required",
          description: "Please connect your Twitter account to post tweets",
          variant: "destructive",
        });
        
        // Redirect to Twitter login
        window.location.href = errorData.auth_url;
        return;
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to post to Twitter');
      }
      
      const result = await response.json();
      setCurrentStep('posted');
      
      const imagesCount = Object.keys(threadImages).length;
      const imageMessage = imagesCount > 0 ? ` with ${imagesCount} different images attached` : "";
      
      toast({
        title: isThread ? "Thread Posted Successfully!" : "Tweet Posted Successfully!",
        description: result.simulated 
          ? "Tweet simulation successful! (Upgrade to Elevated access for real posting)"
          : isThread 
            ? `Your thread with ${threadTweets.length} tweets is now live on Twitter${imageMessage}`
            : `Your tweet is now live on Twitter${imageMessage}`,
      });
    } catch (error) {
      console.error('Error posting to Twitter:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to post to Twitter. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPosting(false);
    }
  };

  const handleStartOver = () => {
    setBlogUrl("");
    setAdditionalText("");
    setGeneratedTweet("");
    // Clean up all image URLs
    Object.values(threadImages).forEach(image => {
      if (image.previewUrl) {
        URL.revokeObjectURL(image.previewUrl);
      }
    });
    setThreadImages({});
    setCurrentStep("input");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 overflow-x-hidden">
      {/* Header */}
      <div className="bg-white/5 backdrop-blur-sm border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-2 rounded-lg animate-pulse">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-white">TweetAI</h1>
                <p className="text-xs sm:text-sm text-blue-200">Automated Content Generation</p>
              </div>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-2">
              <Badge variant="secondary" className="bg-green-500/20 text-green-300 border-green-500/30 hidden sm:flex">
                <CheckCircle className="w-3 h-3 mr-1" />
                Ready
              </Badge>
              {twitterUser ? (
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs hidden xs:flex">
                    <XIcon className="w-3 h-3 mr-1" />
                    @{twitterUser}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-red-500/20 text-red-400 hover:bg-red-500/10 text-xs"
                    onClick={async () => {
                      try {
                        await fetch(`${import.meta.env.VITE_API_URL}api/twitter/logout`, {
                          credentials: 'include',
                        });
                        setTwitterUser(null);
                        toast({
                          title: "Logged Out",
                          description: "Successfully disconnected from Twitter",
                        });
                      } catch (error) {
                        toast({
                          title: "Error",
                          description: "Failed to logout",
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    <span className="hidden xs:inline">Disconnect</span>
                    <span className="xs:hidden">X</span>
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/20 text-black hover:bg-white/10 text-xs"
                  onClick={() => {
                    window.location.href = `${import.meta.env.VITE_API_URL}api/twitter/login`;
                  }}
                >
                  <XIcon className="w-4 h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Connect Twitter</span>
                  <span className="sm:hidden">Connect</span>
                </Button>
              )}
              {/* Mobile menu button */}
              <Button
                variant="outline"
                size="sm"
                className="border-white/20 text-black hover:bg-white/10 sm:hidden"
                onClick={() => setShowSidebar(!showSidebar)}
              >
                {showSidebar ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className={`grid gap-6 sm:gap-8 ${isMobile ? 'grid-cols-1' : 'lg:grid-cols-3'}`}>
          {/* Main Content */}
          <div className={`${isMobile ? 'order-2' : 'lg:col-span-2'} space-y-6 transition-all duration-500 ${animateIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} relative z-10`}>
            {/* Step Indicator */}
            <div className="flex items-center justify-center space-x-2 sm:space-x-4 mb-6 sm:mb-8">
              <div className={`flex items-center space-x-1 sm:space-x-2 ${currentStep === "input" ? "text-blue-400" : "text-green-400"}`}>
                <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-300 ${currentStep === "input" ? "bg-blue-500 scale-110" : "bg-green-500"}`}>
                  <Globe className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                </div>
                <span className="text-xs sm:text-sm font-medium hidden sm:inline">Input URL</span>
              </div>
              <div className="w-4 sm:w-8 h-px bg-white/20"></div>
              <div className={`flex items-center space-x-1 sm:space-x-2 ${currentStep === "preview" ? "text-blue-400" : currentStep === "posted" ? "text-green-400" : "text-gray-500"}`}>
                <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-300 ${currentStep === "preview" ? "bg-blue-500 scale-110" : currentStep === "posted" ? "bg-green-500" : "bg-gray-600"}`}>
                  <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                </div>
                <span className="text-xs sm:text-sm font-medium hidden sm:inline">Review Tweet</span>
              </div>
              <div className="w-4 sm:w-8 h-px bg-white/20"></div>
              <div className={`flex items-center space-x-1 sm:space-x-2 ${currentStep === "posted" ? "text-green-400" : "text-gray-500"}`}>
                <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-300 ${currentStep === "posted" ? "bg-green-500 scale-110" : "bg-gray-600"}`}>
                  <XIcon className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                </div>
                <span className="text-xs sm:text-sm font-medium hidden sm:inline">Published</span>
              </div>
            </div>

            {/* Input Section */}
            {currentStep === "input" && (
              <Card className="bg-white/5 backdrop-blur-sm border-white/10 transition-all duration-500 hover:bg-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Globe className="w-5 h-5 mr-2 text-blue-400" />
                    Generate Tweet from Blog
                  </CardTitle>
                  <CardDescription className="text-blue-200">
                    Enter a blog URL and optionally add specific instructions to customize your tweet generation. 
                    The AI will create comprehensive, valuable tweets that may exceed 280 characters when the content warrants it.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-blue-200 mb-2 block">Blog URL</label>
                    <Input
                      type="url"
                      placeholder="https://real.com/-optimization-techniques/"
                      value={blogUrl}
                      onChange={(e) => setBlogUrl(e.target.value)}
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 transition-all duration-300 focus:bg-white/15 focus:border-blue-400"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-blue-200 mb-2 block">
                      Additional Instructions (Optional)
                    </label>
                    <Textarea
                      placeholder="Add specific instructions for tweet generation... (e.g., 'Focus on performance tips', 'Make it more casual', 'Include code examples')"
                      value={additionalText}
                      onChange={(e) => setAdditionalText(e.target.value)}
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 min-h-[80px] transition-all duration-300 focus:bg-white/15 focus:border-blue-400"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Use this to customize how the AI generates your tweet. Leave empty for default behavior.
                    </p>
                  </div>
                  <Button 
                    onClick={handleGenerateTweet}
                    disabled={isGenerating}
                    className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 transform hover:scale-105 disabled:scale-100"
                  >
                    {isGenerating ? (
                      <>
                        <Clock className="w-4 h-4 mr-2 animate-spin" />
                        Generating Tweet...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate Tweet with AI
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Preview Section */}
            {currentStep === "preview" && (
              <Card className="bg-white/5 backdrop-blur-sm border-white/10 transition-all duration-500 hover:bg-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Sparkles className="w-5 h-5 mr-2 text-blue-400" />
                    Review Generated {isThread ? "Thread" : "Tweet"}
                  </CardTitle>
                  <CardDescription className="text-blue-200">
                    {isThread 
                      ? `Your AI-generated thread with ${threadTweets.length} tweets is ready. You can edit each tweet and attach different images to each tweet.`
                      : "Your AI-generated tweet is ready. Review and approve to post to Twitter."
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Thread Preview */}
                  {isThread ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                          Thread ({threadTweets.length} tweets)
                        </Badge>
                        <span className="text-xs text-gray-400">
                          Total characters: {threadTweets.reduce((acc, t) => acc + t.length, 0)}
                        </span>
                      </div>
                      {threadTweets.map((tweet, index) => (
                        <div key={index} className="border border-white/20 rounded-lg p-3 sm:p-4 bg-white/5 transition-all duration-300 hover:bg-white/10">
                          <div className="flex items-start justify-between mb-2">
                            <Badge variant="outline" className="text-xs">
                              Tweet {index + 1}/{threadTweets.length}
                            </Badge>
                            <span className="text-xs text-gray-400">
                              {tweet.length}/{TWEET_LIMIT}
                            </span>
                          </div>
                          {/* Editable textarea for each tweet */}
                          <Textarea
                            value={tweet}
                            onChange={e => {
                              const newTweets = [...threadTweets];
                              newTweets[index] = e.target.value;
                              setThreadTweets(newTweets);
                            }}
                            className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 min-h-[80px] mb-3 transition-all duration-300 focus:bg-white/15 focus:border-blue-400"
                          />
                          {/* Image upload section for each tweet */}
                          <div className="mt-4 space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-medium text-blue-200">
                                <span className="hidden xs:inline">Image for Tweet {index + 1}</span>
                                <span className="xs:hidden">Image</span>
                                <span className="text-gray-400"> (Optional)</span>
                              </label>
                            </div>
                            {!threadImages[index] ? (
                              <div className="border border-dashed border-white/20 rounded p-2 sm:p-3 text-center hover:border-white/40 transition-colors relative group">
                                <Upload className="w-4 h-4 text-gray-400 mx-auto mb-1 group-hover:text-blue-400 transition-colors" />
                                <p className="text-xs text-gray-400 group-hover:text-blue-200 transition-colors">Click to add image (optional)</p>
                                <Input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleImageUpload(e, index)}
                                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                              </div>
                            ) : (
                              <div className="border border-white/20 rounded p-2 bg-white/5 flex items-center space-x-2">
                                <img 
                                  src={threadImages[index].previewUrl} 
                                  alt={`Tweet ${index + 1} image`}
                                  className="w-10 h-10 object-cover rounded flex-shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs text-white truncate">{threadImages[index].file.name}</p>
                                  <p className="text-xs text-gray-400">
                                    {(threadImages[index].file.size / 1024 / 1024).toFixed(2)} MB
                                  </p>
                                </div>
                                <Button
                                  onClick={() => removeImage(index)}
                                  variant="outline"
                                  size="sm"
                                  className="border-red-500/50 text-red-400 hover:bg-red-500/10 h-8 w-8 p-0 transition-all duration-300 hover:scale-110 flex-shrink-0"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div>
                      <label className="text-sm font-medium text-blue-200 mb-2 block">Generated Tweet</label>
                      <Textarea
                        value={generatedTweet}
                        onChange={(e) => setGeneratedTweet(e.target.value)}
                        className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 min-h-[120px] transition-all duration-300 focus:bg-white/15 focus:border-blue-400"
                        placeholder="Your generated tweet will appear here..."
                      />
                      <div className="flex justify-between items-center mt-2">
                        <span className={`text-xs ${
                          generatedTweet.length <= TWEET_LIMIT ? "text-gray-400" :
                          generatedTweet.length <= REASONABLE_EXTENDED_LIMIT ? "text-yellow-400" :
                          "text-red-400"
                        }`}>
                          Characters: {generatedTweet.length}/{TWEET_LIMIT}
                          {generatedTweet.length > TWEET_LIMIT && ` (${generatedTweet.length - TWEET_LIMIT} over)`}
                        </span>
                        <Badge variant={
                          generatedTweet.length <= TWEET_LIMIT ? "secondary" :
                          generatedTweet.length <= REASONABLE_EXTENDED_LIMIT ? "default" :
                          "destructive"
                        }>
                          {generatedTweet.length <= TWEET_LIMIT ? "Single tweet" :
                           generatedTweet.length <= REASONABLE_EXTENDED_LIMIT ? "Extended tweet (valuable content)" :
                           "Will create thread"}
                        </Badge>
                      </div>

                      {/* Single image upload for single tweet */}
                      <div className="mt-4 space-y-4">
                        <Separator className="bg-white/20" />
                        <div>
                          <label className="text-sm font-medium text-blue-200 mb-2 block">
                            Add Image (Optional)
                          </label>
                          {!threadImages[0] ? (
                            <div className="border-2 border-dashed border-white/20 rounded-lg p-4 sm:p-6 text-center hover:border-white/40 transition-colors group">
                              <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 mx-auto mb-2 group-hover:text-blue-400 transition-colors" />
                              <p className="text-sm text-gray-400 mb-2 group-hover:text-blue-200 transition-colors">Click to upload an image</p>
                              <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                              <Input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleImageUpload(e, 0)}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              />
                            </div>
                          ) : (
                            <div className="relative border border-white/20 rounded-lg p-3 sm:p-4 bg-white/5">
                              <div className="flex items-start space-x-3 sm:space-x-4">
                                <img 
                                  src={threadImages[0].previewUrl} 
                                  alt="Upload preview" 
                                  className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg flex-shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-white text-sm font-medium truncate">{threadImages[0].file.name}</p>
                                  <p className="text-gray-400 text-xs">{(threadImages[0].file.size / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                                <Button
                                  onClick={() => removeImage(0)}
                                  variant="outline"
                                  size="sm"
                                  className="border-red-500/50 text-red-400 hover:bg-red-500/10 transition-all duration-300 hover:scale-110 flex-shrink-0"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                    <Button 
                      onClick={handlePostTweet}
                      disabled={isPosting}
                      className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 transition-all duration-300 transform hover:scale-105 disabled:scale-100"
                    >
                      {isPosting ? (
                        <>
                          <Clock className="w-4 h-4 mr-2 animate-spin" />
                          Posting...
                        </>
                      ) : (
                        <>
                          <XIcon className="w-4 h-4 mr-2" />
                          <span className="hidden xs:inline">
                            {twitterUser 
                              ? `Post ${isThread ? `Thread (${threadTweets.length} tweets)` : "Tweet"} to Twitter`
                              : "Connect & Post to Twitter"
                            }
                          </span>
                          <span className="xs:hidden">
                            {twitterUser 
                              ? `Post ${isThread ? `Thread` : "Tweet"}`
                              : "Connect & Post"
                            }
                          </span>
                          {Object.keys(threadImages).length > 0 && (
                            <span className="ml-1 text-xs opacity-75 hidden xs:inline">
                              with {Object.keys(threadImages).length} images
                            </span>
                          )}
                        </>
                      )}
                    </Button>
                    <Button 
                      onClick={handleStartOver}
                      variant="outline"
                      className="border-white/20 text-black hover:bg-white/10 transition-all duration-300"
                    >
                      Start Over
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Success Section */}
            {currentStep === "posted" && (
              <Card className="bg-white/5 backdrop-blur-sm border-white/10 transition-all duration-500 hover:bg-white/10">
                <CardContent className="pt-6">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto animate-pulse">
                      <CheckCircle className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-white">
                      {isThread ? "Thread Posted Successfully!" : "Tweet Posted Successfully!"}
                    </h3>
                    <p className="text-blue-200">
                      Your content is now live and engaging your audience on Twitter.
                      {Object.keys(threadImages).length > 0 && isThread && 
                        ` Each of your ${threadTweets.length} tweets has its own unique image attached.`
                      }
                      {Object.keys(threadImages).length > 0 && !isThread && " Your image was included with the post."}
                    </p>
                    <Button 
                      onClick={handleStartOver}
                      className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 transform hover:scale-105"
                    >
                      Generate Another Tweet
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar (desktop only) */}
          {!isMobile && (
            <div className={`space-y-6 transition-all duration-500 ${animateIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} relative z-10`}>
              {/* Tech News Browser */}
              <Card className="bg-white/5 border-white/10 transition-all duration-500 hover:bg-white/10">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white text-lg flex items-center">
                      <Globe className="w-5 h-5 mr-2 text-blue-400" />
                      Trending Tech Browser
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-white/20 text-black hover:bg-white/10 sm:hidden"
                      onClick={() => setShowSidebar(false)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <CardDescription className="text-blue-200">
                    Browse recent trending tech articles and copy URLs to generate tweets
                  </CardDescription>
                </CardHeader>
                <CardContent className="overflow-hidden">
                  <div className="space-y-3 mb-4">
                    <div className="grid grid-cols-2 sm:flex sm:space-x-2 gap-1 sm:gap-2 mb-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex-1 border-white/20 text-black hover:bg-white/10 transition-all duration-300 hover:scale-105 text-xs sm:text-sm"
                        onClick={() => setCurrentSource('techcrunch')}
                      >
                        <span className="hidden xs:inline">TechCrunch</span>
                        <span className="xs:hidden">TC</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex-1 border-white/20 text-black hover:bg-white/10 transition-all duration-300 hover:scale-105 text-xs sm:text-sm"
                        onClick={() => setCurrentSource('theverge')}
                      >
                        <span className="hidden xs:inline">The Verge</span>
                        <span className="xs:hidden">TV</span>
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 sm:flex sm:space-x-2 gap-1 sm:gap-2 mb-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex-1 border-white/20 text-black hover:bg-white/10 transition-all duration-300 hover:scale-105 text-xs sm:text-sm"
                        onClick={() => setCurrentSource('wired')}
                      >
                        Wired
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex-1 border-white/20 text-black hover:bg-white/10 transition-all duration-300 hover:scale-105 text-xs sm:text-sm"
                        onClick={() => setCurrentSource('hackernews')}
                      >
                        <span className="hidden xs:inline">Hacker News</span>
                        <span className="xs:hidden">HN</span>
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 sm:flex sm:space-x-2 gap-1 sm:gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex-1 border-white/20 text-black hover:bg-white/10 transition-all duration-300 hover:scale-105 text-xs sm:text-sm"
                        onClick={() => setCurrentSource('devto')}
                      >
                        Dev.to
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex-1 border-white/20 text-black hover:bg-white/10 transition-all duration-300 hover:scale-105 text-xs sm:text-sm"
                        onClick={() => setCurrentSource('medium')}
                      >
                        Medium
                      </Button>
                    </div>
                  </div>              
                  <div className="relative">
                    <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                      <div className="p-4">
                        {loadingArticles ? (
                          <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
                            <span className="ml-2 text-white text-sm">Loading articles...</span>
                          </div>
                        ) : articles.length > 0 ? (
                          <div className="space-y-3">
                            {articles.map((article, index) => (
                              <div key={index} className="p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors cursor-pointer">
                                <div className="flex items-start justify-between space-x-2">
                                  <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-medium text-white mb-1 truncate">{article.title}</h4>
                                    <p className="text-xs text-gray-400 mb-2 line-clamp-2">{article.description}</p>
                                    <div className="flex items-center space-x-2">
                                      <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs">
                                        {article.category}
                                      </Badge>
                                      <span className="text-xs text-gray-400 hidden xs:inline">{article.published}</span>
                                    </div>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10 flex-shrink-0"
                                    onClick={() => setBlogUrl(article.url)}
                                  >
                                    <span className="hidden xs:inline">Use URL</span>
                                    <span className="xs:hidden">Use</span>
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <Globe className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                            <p className="text-sm text-gray-400">No articles found</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="absolute top-2 right-2">
                      <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs">
                        Live
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Sidebar Overlay and Drawer */}
      {isMobile && showSidebar && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-[60] sm:hidden"
            onClick={() => setShowSidebar(false)}
          />
          <div className="fixed right-0 top-0 h-full w-[85vw] max-w-[320px] z-[70] bg-slate-900/95 border-l border-white/10 transition-transform duration-500 transform translate-x-0 shadow-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-lg flex items-center">
                  <Globe className="w-5 h-5 mr-2 text-blue-400" />
                  Trending Tech Browser
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/20 text-black hover:bg-white/10 sm:hidden"
                  onClick={() => setShowSidebar(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <CardDescription className="text-blue-200">
                Browse recent trending tech articles and copy URLs to generate tweets
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-hidden">
              <div className="space-y-3 mb-4">
                <div className="grid grid-cols-2 sm:flex sm:space-x-2 gap-1 sm:gap-2 mb-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex-1 border-white/20 text-black hover:bg-white/10 transition-all duration-300 hover:scale-105 text-xs sm:text-sm"
                    onClick={() => setCurrentSource('techcrunch')}
                  >
                    <span className="hidden xs:inline">TechCrunch</span>
                    <span className="xs:hidden">TC</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex-1 border-white/20 text-black hover:bg-white/10 transition-all duration-300 hover:scale-105 text-xs sm:text-sm"
                    onClick={() => setCurrentSource('theverge')}
                  >
                    <span className="hidden xs:inline">The Verge</span>
                    <span className="xs:hidden">TV</span>
                  </Button>
                </div>
                <div className="grid grid-cols-2 sm:flex sm:space-x-2 gap-1 sm:gap-2 mb-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex-1 border-white/20 text-black hover:bg-white/10 transition-all duration-300 hover:scale-105 text-xs sm:text-sm"
                    onClick={() => setCurrentSource('wired')}
                  >
                    Wired
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex-1 border-white/20 text-black hover:bg-white/10 transition-all duration-300 hover:scale-105 text-xs sm:text-sm"
                    onClick={() => setCurrentSource('hackernews')}
                  >
                    <span className="hidden xs:inline">Hacker News</span>
                    <span className="xs:hidden">HN</span>
                  </Button>
                </div>
                <div className="grid grid-cols-2 sm:flex sm:space-x-2 gap-1 sm:gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex-1 border-white/20 text-black hover:bg-white/10 transition-all duration-300 hover:scale-105 text-xs sm:text-sm"
                    onClick={() => setCurrentSource('devto')}
                  >
                    Dev.to
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex-1 border-white/20 text-black hover:bg-white/10 transition-all duration-300 hover:scale-105 text-xs sm:text-sm"
                    onClick={() => setCurrentSource('medium')}
                  >
                    Medium
                  </Button>
                </div>
              </div>              
              <div className="relative">
                <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                  <div className="p-4">
                    {loadingArticles ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
                        <span className="ml-2 text-white text-sm">Loading articles...</span>
                      </div>
                    ) : articles.length > 0 ? (
                      <div className="space-y-3">
                        {articles.map((article, index) => (
                          <div key={index} className="p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors cursor-pointer">
                            <div className="flex items-start justify-between space-x-2">
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-medium text-white mb-1 truncate">{article.title}</h4>
                                <p className="text-xs text-gray-400 mb-2 line-clamp-2">{article.description}</p>
                                <div className="flex items-center space-x-2">
                                  <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs">
                                    {article.category}
                                  </Badge>
                                  <span className="text-xs text-gray-400 hidden xs:inline">{article.published}</span>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10 flex-shrink-0"
                                onClick={() => setBlogUrl(article.url)}
                              >
                                <span className="hidden xs:inline">Use URL</span>
                                <span className="xs:hidden">Use</span>
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Globe className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                        <p className="text-sm text-gray-400">No articles found</p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="absolute top-2 right-2">
                  <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs">
                    Live
                  </Badge>
                </div>
              </div>
            </CardContent>
          </div>
        </>
      )}
    </div>
  );
};

export default Index;