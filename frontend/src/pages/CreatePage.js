import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Switch } from '../components/ui/switch';
import { toast } from 'sonner';
import { Sparkles, Upload, RefreshCw, Play, Video as VideoIcon, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function CreatePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, updateUserCredits } = useAuth();
  const [avatar, setAvatar] = useState(location.state?.avatar || null);
  
  const [scriptMode, setScriptMode] = useState('ai-generate');
  const [prompt, setPrompt] = useState('');
  const [script, setScript] = useState('');
  const [enhanceScript, setEnhanceScript] = useState(false);
  const [tone, setTone] = useState('Professional');
  const [duration, setDuration] = useState('30');
  const [language, setLanguage] = useState('English');
  const [title, setTitle] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [audioPreview, setAudioPreview] = useState(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!avatar) {
      navigate('/dashboard/avatars');
    }
  }, [avatar, navigate]);

  const handleGenerateScript = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }
    
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/scripts/generate`, { prompt });
      setScript(response.data.script);
      toast.success('Script generated successfully!');
    } catch (error) {
      toast.error('Failed to generate script');
    } finally {
      setLoading(false);
    }
  };

  const handleEnhanceScript = async () => {
    if (!script.trim()) {
      toast.error('Please enter a script first');
      return;
    }
    
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/scripts/enhance`, { script });
      setScript(response.data.script);
      toast.success('Script enhanced successfully!');
    } catch (error) {
      toast.error('Failed to enhance script');
    } finally {
      setLoading(false);
    }
  };

  const handleRewriteScript = async () => {
    if (!script.trim()) {
      toast.error('Please enter a script first');
      return;
    }
    
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/scripts/rewrite`, { script, tone });
      setScript(response.data.script);
      toast.success(`Script rewritten with ${tone} tone!`);
    } catch (error) {
      toast.error('Failed to rewrite script');
    } finally {
      setLoading(false);
    }
  };

  const handleVoicePreview = async () => {
    if (!script.trim()) {
      toast.error('Please enter a script first');
      return;
    }
    
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/voice/preview`, { script, language });
      setAudioPreview(response.data.audio_base64);
      toast.success('Voice preview ready!');
    } catch (error) {
      toast.error('Failed to generate voice preview');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateVideo = async () => {
    if (!script.trim()) {
      toast.error('Please enter a script');
      return;
    }
    
    if (!title.trim()) {
      toast.error('Please enter a title for your video');
      return;
    }

    if (user.credits < 1) {
      toast.error('Insufficient credits');
      return;
    }
    
    setGenerating(true);
    try {
      const response = await axios.post(`${API_URL}/videos/generate`, {
        avatar_id: avatar.avatar_id,
        avatar_name: avatar.display_name || avatar.avatar_name,
        title,
        script,
        language,
        duration: parseInt(duration),
      });
      
      updateUserCredits(user.credits - 1);
      toast.success('Video generation started! Check History for status.');
      navigate('/dashboard/history');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to generate video');
    } finally {
      setGenerating(false);
    }
  };

  if (!avatar) return null;

  return (
    <div className="min-h-[calc(100vh-73px)] bg-slate-50">
      <div className="p-6 md:p-8 lg:p-12 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <img
              src={avatar.preview_image_url || avatar.image_url}
              alt={avatar.display_name}
              className="w-16 h-16 rounded-xl object-cover border-2 border-slate-200"
            />
            <div>
              <h1 className="text-3xl md:text-4xl font-heading font-bold text-slate-900">
                {avatar.display_name || avatar.avatar_name}
              </h1>
              <p className="text-slate-600">Create your AI avatar video</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Script Creation */}
          <div className="space-y-6">
            <Card data-testid="script-creation-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Script Creation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <Tabs value={scriptMode} onValueChange={setScriptMode}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="ai-generate" data-testid="tab-ai-generate">AI Generate</TabsTrigger>
                    <TabsTrigger value="paste" data-testid="tab-paste">Paste Script</TabsTrigger>
                    <TabsTrigger value="ai-rewrite" data-testid="tab-ai-rewrite">AI Rewrite</TabsTrigger>
                  </TabsList>

                  <TabsContent value="ai-generate" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="prompt">Enter Your Idea</Label>
                      <Textarea
                        id="prompt"
                        data-testid="ai-prompt-input"
                        placeholder="E.g., Explain Jio 5G benefits to young users"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        rows={4}
                        className="resize-none"
                      />
                    </div>
                    <Button
                      data-testid="generate-script-button"
                      onClick={handleGenerateScript}
                      disabled={loading}
                      className="w-full gap-2"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          Generate Script
                        </>
                      )}
                    </Button>
                  </TabsContent>

                  <TabsContent value="paste" className="space-y-4 mt-4">
                    <div className="flex items-center justify-between">
                      <Label>Enhance with AI</Label>
                      <Switch
                        checked={enhanceScript}
                        onCheckedChange={setEnhanceScript}
                      />
                    </div>
                    {enhanceScript && (
                      <Button
                        onClick={handleEnhanceScript}
                        disabled={loading}
                        variant="outline"
                        className="w-full gap-2"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Enhancing...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-4 w-4" />
                            Enhance Script
                          </>
                        )}
                      </Button>
                    )}
                  </TabsContent>

                  <TabsContent value="ai-rewrite" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label>Tone</Label>
                      <Select value={tone} onValueChange={setTone}>
                        <SelectTrigger data-testid="tone-select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Emotional">Emotional</SelectItem>
                          <SelectItem value="Energetic">Energetic</SelectItem>
                          <SelectItem value="Slow delivery">Slow Delivery</SelectItem>
                          <SelectItem value="Fast delivery">Fast Delivery</SelectItem>
                          <SelectItem value="Professional">Professional</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      data-testid="rewrite-script-button"
                      onClick={handleRewriteScript}
                      disabled={loading}
                      className="w-full gap-2"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Rewriting...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4" />
                          Rewrite Script
                        </>
                      )}
                    </Button>
                  </TabsContent>
                </Tabs>

                <div className="space-y-2">
                  <Label htmlFor="script">Script</Label>
                  <Textarea
                    id="script"
                    data-testid="script-textarea"
                    placeholder="Your script will appear here..."
                    value={script}
                    onChange={(e) => setScript(e.target.value)}
                    rows={10}
                    className="resize-none font-mono text-sm"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Video Configuration */}
          <div className="space-y-6">
            <Card data-testid="video-config-card">
              <CardHeader>
                <CardTitle>Video Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Video Title</Label>
                  <Input
                    id="title"
                    data-testid="video-title-input"
                    placeholder="Enter video title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Duration</Label>
                  <Select value={duration} onValueChange={setDuration}>
                    <SelectTrigger data-testid="duration-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 seconds</SelectItem>
                      <SelectItem value="20">20 seconds</SelectItem>
                      <SelectItem value="30">30 seconds</SelectItem>
                      <SelectItem value="60">60 seconds</SelectItem>
                      <SelectItem value="90">90 seconds</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Language</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger data-testid="language-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="English">English</SelectItem>
                      <SelectItem value="Hindi">Hindi</SelectItem>
                      <SelectItem value="Gujarati">Gujarati</SelectItem>
                      <SelectItem value="Tamil">Tamil</SelectItem>
                      <SelectItem value="Telugu">Telugu</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Voice Preview */}
                <div className="space-y-3">
                  <Label>Voice Preview</Label>
                  <Button
                    data-testid="voice-preview-button"
                    onClick={handleVoicePreview}
                    disabled={loading || !script}
                    variant="outline"
                    className="w-full gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generating Preview...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4" />
                        Preview Voice
                      </>
                    )}
                  </Button>
                  
                  {audioPreview && (
                    <div className="mt-4 p-4 bg-slate-100 rounded-lg">
                      <audio
                        data-testid="audio-player"
                        controls
                        className="w-full"
                        src={`data:audio/mp3;base64,${audioPreview}`}
                      />
                    </div>
                  )}
                </div>

                {/* Generate Video Button */}
                <div className="pt-4 border-t border-slate-200">
                  <Button
                    data-testid="generate-video-button"
                    onClick={handleGenerateVideo}
                    disabled={generating || !script || !title}
                    className="w-full h-14 text-lg font-semibold bg-secondary hover:bg-secondary/90 text-white shadow-lg shadow-red-900/20 gap-2"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Generating Video...
                      </>
                    ) : (
                      <>
                        <VideoIcon className="h-5 w-5" />
                        Generate Video (1 Credit)
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
