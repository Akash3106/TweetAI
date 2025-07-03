import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Bot, Twitter, Globe, Sparkles, CheckCircle, Clock, AlertCircle, Upload, Image, Trash2, Plus } from "lucide-react";

const Index = () => {
  const [blogUrl, setBlogUrl] = useState("");
  const [generatedTweet, setGeneratedTweet] = useState("");
  const [threadImages, setThreadImages] = useState<{ [key: number]: { file: File; previewUrl: string } }>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [currentStep, setCurrentStep] = useState<"input" | "preview" | "posted">("input");
  const { toast } = useToast();

  const TWEET_LIMIT = 280;

  // Split text into thread tweets
  const createThread = (text: string): string[] => {
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

  const threadTweets = createThread(generatedTweet);
  const isThread = threadTweets.length > 1;

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
    
    // Simulate AI processing
    setTimeout(() => {
      const sampleTweet = `🐍 Just discovered an amazing Python optimization technique that can boost your code performance by 40%! 

Using list comprehensions with conditional logic is a game-changer for data processing tasks. Here's what I learned from this comprehensive guide:

✅ Memory efficiency improved significantly
✅ Code readability enhanced
✅ Processing speed increased dramatically

The key is understanding when to use list comprehensions vs traditional loops. The performance gains are particularly noticeable when working with large datasets.

Perfect timing as I'm working on optimizing our data pipeline at work. These techniques will definitely come in handy!

#Python #CodeOptimization #DataScience #Programming #TechTips

Read the full article: ${blogUrl}`;
      
      setGeneratedTweet(sampleTweet);
      setCurrentStep("preview");
      setIsGenerating(false);
      
      toast({
        title: "Tweet Generated!",
        description: isThread ? "Your Python thread is ready for review" : "Your Python tweet is ready for review",
      });
    }, 2000);
  };

  const handlePostTweet = async () => {
    setIsPosting(true);
    
    // Simulate posting to Twitter with different images for each tweet
    setTimeout(() => {
      setCurrentStep("posted");
      setIsPosting(false);
      
      const imagesCount = Object.keys(threadImages).length;
      const imageMessage = imagesCount > 0 ? ` with ${imagesCount} different images attached` : "";
      
      toast({
        title: isThread ? "Thread Posted Successfully!" : "Tweet Posted Successfully!",
        description: isThread 
          ? `Your Python thread with ${threadTweets.length} tweets is now live on Twitter${imageMessage}`
          : `Your Python content is now live on Twitter${imageMessage}`,
      });
    }, 1500);
  };

  const handleStartOver = () => {
    setBlogUrl("");
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <div className="bg-white/5 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-2 rounded-lg">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">PythonTweetAI</h1>
                <p className="text-sm text-blue-200">Automated Python Content Generation</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="bg-green-500/20 text-green-300 border-green-500/30">
                <CheckCircle className="w-3 h-3 mr-1" />
                Ready
              </Badge>
              <Button variant="outline" size="sm" className="border-white/20 text-black hover:bg-white/10">
                <Twitter className="w-4 h-4 mr-2" />
                Connect Twitter
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Step Indicator */}
            <div className="flex items-center justify-center space-x-4 mb-8">
              <div className={`flex items-center space-x-2 ${currentStep === "input" ? "text-blue-400" : "text-green-400"}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === "input" ? "bg-blue-500" : "bg-green-500"}`}>
                  <Globe className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium">Input URL</span>
              </div>
              <div className="w-8 h-px bg-white/20"></div>
              <div className={`flex items-center space-x-2 ${currentStep === "preview" ? "text-blue-400" : currentStep === "posted" ? "text-green-400" : "text-gray-500"}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === "preview" ? "bg-blue-500" : currentStep === "posted" ? "bg-green-500" : "bg-gray-600"}`}>
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium">Review Tweet</span>
              </div>
              <div className="w-8 h-px bg-white/20"></div>
              <div className={`flex items-center space-x-2 ${currentStep === "posted" ? "text-green-400" : "text-gray-500"}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === "posted" ? "bg-green-500" : "bg-gray-600"}`}>
                  <Twitter className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium">Published</span>
              </div>
            </div>

            {/* Input Section */}
            {currentStep === "input" && (
              <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Globe className="w-5 h-5 mr-2 text-blue-400" />
                    Generate Python Tweet from Blog
                  </CardTitle>
                  <CardDescription className="text-blue-200">
                    Enter a Python-related blog URL and let AI create an engaging tweet for your audience
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-blue-200 mb-2 block">Blog URL</label>
                    <Input
                      type="url"
                      placeholder="https://realpython.com/python-optimization-techniques/"
                      value={blogUrl}
                      onChange={(e) => setBlogUrl(e.target.value)}
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                    />
                  </div>
                  <Button 
                    onClick={handleGenerateTweet}
                    disabled={isGenerating}
                    className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
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
              <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Sparkles className="w-5 h-5 mr-2 text-blue-400" />
                    Review Generated {isThread ? "Thread" : "Tweet"}
                  </CardTitle>
                  <CardDescription className="text-blue-200">
                    {isThread 
                      ? `Your AI-generated Python thread with ${threadTweets.length} tweets is ready. You can attach different images to each tweet.`
                      : "Your AI-generated Python tweet is ready. Review and approve to post to Twitter."
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
                          Total characters: {generatedTweet.length}
                        </span>
                      </div>
                      
                      {threadTweets.map((tweet, index) => (
                        <div key={index} className="border border-white/20 rounded-lg p-4 bg-white/5">
                          <div className="flex items-start justify-between mb-2">
                            <Badge variant="outline" className="text-xs">
                              Tweet {index + 1}/{threadTweets.length}
                            </Badge>
                            <span className="text-xs text-gray-400">
                              {tweet.length}/{TWEET_LIMIT}
                            </span>
                          </div>
                          <p className="text-white text-sm whitespace-pre-wrap mb-3">{tweet}</p>
                          
                          {/* Image upload section for each tweet */}
                          <div className="mt-4 space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-medium text-blue-200">
                                Image for Tweet {index + 1}
                              </label>
                            </div>
                            
                            {!threadImages[index] ? (
                              <div className="border border-dashed border-white/20 rounded p-3 text-center hover:border-white/40 transition-colors relative">
                                <Upload className="w-4 h-4 text-gray-400 mx-auto mb-1" />
                                <p className="text-xs text-gray-400">Click to add image</p>
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
                                  className="w-10 h-10 object-cover rounded"
                                />
                                <div className="flex-1">
                                  <p className="text-xs text-white">{threadImages[index].file.name}</p>
                                  <p className="text-xs text-gray-400">
                                    {(threadImages[index].file.size / 1024 / 1024).toFixed(2)} MB
                                  </p>
                                </div>
                                <Button
                                  onClick={() => removeImage(index)}
                                  variant="outline"
                                  size="sm"
                                  className="border-red-500/50 text-red-400 hover:bg-red-500/10 h-8 w-8 p-0"
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
                        className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 min-h-[120px]"
                        placeholder="Your generated tweet will appear here..."
                      />
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-gray-400">
                          Characters: {generatedTweet.length}/{TWEET_LIMIT}
                        </span>
                        <Badge variant={generatedTweet.length > TWEET_LIMIT ? "destructive" : "secondary"}>
                          {generatedTweet.length > TWEET_LIMIT ? "Will create thread" : "Single tweet"}
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
                            <div className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center hover:border-white/40 transition-colors">
                              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                              <p className="text-sm text-gray-400 mb-2">Click to upload an image</p>
                              <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                              <Input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleImageUpload(e, 0)}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              />
                            </div>
                          ) : (
                            <div className="relative border border-white/20 rounded-lg p-4 bg-white/5">
                              <div className="flex items-start space-x-4">
                                <img 
                                  src={threadImages[0].previewUrl} 
                                  alt="Upload preview" 
                                  className="w-20 h-20 object-cover rounded-lg"
                                />
                                <div className="flex-1">
                                  <p className="text-white text-sm font-medium">{threadImages[0].file.name}</p>
                                  <p className="text-gray-400 text-xs">{(threadImages[0].file.size / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                                <Button
                                  onClick={() => removeImage(0)}
                                  variant="outline"
                                  size="sm"
                                  className="border-red-500/50 text-red-400 hover:bg-red-500/10"
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

                  <div className="flex space-x-3">
                    <Button 
                      onClick={handlePostTweet}
                      disabled={isPosting}
                      className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                    >
                      {isPosting ? (
                        <>
                          <Clock className="w-4 h-4 mr-2 animate-spin" />
                          Posting...
                        </>
                      ) : (
                        <>
                          <Twitter className="w-4 h-4 mr-2" />
                          Post {isThread ? `Thread (${threadTweets.length} tweets)` : "Tweet"} to Twitter
                          {Object.keys(threadImages).length > 0 && (
                            <span className="ml-1 text-xs opacity-75">
                              with {Object.keys(threadImages).length} images
                            </span>
                          )}
                        </>
                      )}
                    </Button>
                    <Button 
                      onClick={handleStartOver}
                      variant="outline"
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      Start Over
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Success Section */}
            {currentStep === "posted" && (
              <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                <CardContent className="pt-6">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-white">
                      {isThread ? "Thread Posted Successfully!" : "Tweet Posted Successfully!"}
                    </h3>
                    <p className="text-blue-200">
                      Your Python content is now live and engaging your audience on Twitter.
                      {Object.keys(threadImages).length > 0 && isThread && 
                        ` Each of your ${threadTweets.length} tweets has its own unique image attached.`
                      }
                      {Object.keys(threadImages).length > 0 && !isThread && " Your image was included with the post."}
                    </p>
                    <Button 
                      onClick={handleStartOver}
                      className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                    >
                      Generate Another Tweet
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stats Card */}
            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardHeader>
                <CardTitle className="text-white text-lg">Today's Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-blue-200">Tweets Generated</span>
                  <Badge className="bg-blue-500/20 text-blue-300">12</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-blue-200">Tweets Posted</span>
                  <Badge className="bg-green-500/20 text-green-300">8</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-blue-200">Approval Rate</span>
                  <Badge className="bg-purple-500/20 text-purple-300">67%</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Tips Card */}
            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardHeader>
                <CardTitle className="text-white text-lg flex items-center">
                  <AlertCircle className="w-5 h-5 mr-2 text-yellow-400" />
                  Pro Tips
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-blue-200">
                  • Use recent Python blog posts for trending topics
                </div>
                <div className="text-sm text-blue-200">
                  • Add relevant hashtags to increase reach
                </div>
                <div className="text-sm text-blue-200">
                  • Include code snippets when possible
                </div>
                <div className="text-sm text-blue-200">
                  • Tag the original author for better engagement
                </div>
                <div className="text-sm text-blue-200">
                  • Different images for each thread tweet boost engagement
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardHeader>
                <CardTitle className="text-white text-lg">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm text-white">Posted: Python decorators explained</p>
                    <p className="text-xs text-gray-400">2 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm text-white">Generated: FastAPI performance tips</p>
                    <p className="text-xs text-gray-400">15 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm text-white">Posted: Machine learning basics</p>
                    <p className="text-xs text-gray-400">1 hour ago</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;