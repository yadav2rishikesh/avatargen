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
import { Badge } from '../components/ui/badge';
import { Slider } from '../components/ui/slider';
import { toast } from 'sonner';
import { Sparkles, Upload, RefreshCw, Play, Video as VideoIcon, Loader2, Mic, Zap, ChevronDown, ChevronUp } from 'lucide-react';
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

  // Voice section
  const [voiceTab, setVoiceTab] = useState('heygen');
  // HeyGen voices
  const [heygenVoices, setHeygenVoices] = useState([]);
  const [heygenGenderFilter, setHeygenGenderFilter] = useState('all');
  const [heygenSearchTerm, setHeygenSearchTerm] = useState('');
  const [selectedHGVoice, setSelectedHGVoice] = useState(null);
  const [loadingHGVoices, setLoadingHGVoices] = useState(false);
  const [isELInHG, setIsELInHG] = useState(false);
  const [elHGModel, setElHGModel] = useState('eleven_multilingual_v2');
  const [elHGStability, setElHGStability] = useState(0.5);
  // ElevenLabs direct
  const [elApiKey, setElApiKey] = useState('');
  const [elKeyVerified, setElKeyVerified] = useState(false);
  const [elVoices, setElVoices] = useState([]);
  const [elLangFilter, setElLangFilter] = useState('all');
  const [selectedELVoice, setSelectedELVoice] = useState(null);
  const [elModel, setElModel] = useState('eleven_multilingual_v2');
  const [elStability, setElStability] = useState(0.5);
  const [elSimilarity, setElSimilarity] = useState(0.75);
  const [loadingELVoices, setLoadingELVoices] = useState(false);
  // Avatar engine
  const [avatarEngine, setAvatarEngine] = useState('standard');
  // Advanced options
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [resolution, setResolution] = useState('1080p');
  const [enableCaptions, setEnableCaptions] = useState(false);
  // Advanced generate
  const [generatingAdvanced, setGeneratingAdvanced] = useState(false);

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
    if (!script.trim()) { toast.error('Please enter a script first'); return; }
    
    if (voiceTab === 'elevenlabs') {
      if (!selectedELVoice) { toast.error('Select an ElevenLabs voice first'); return; }
      setLoading(true);
      try {
        const res = await axios.post(`${API_URL}/elevenlabs/preview`, {
          elevenlabs_api_key: elApiKey,
          elevenlabs_voice_id: selectedELVoice.voice_id,
          script,
          model_id: elModel,
          stability: elStability,
          similarity_boost: elSimilarity,
        });
        setAudioPreview(res.data.audio_base64);
        toast.success('ElevenLabs preview ready!');
      } catch (err) {
        toast.error(err.response?.data?.detail || 'Preview failed');
      } finally {
        setLoading(false);
      }
      return;
    }

    // Original HeyGen preview
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

  const handleLoadHGVoices = async () => {
    setLoadingHGVoices(true);
    try {
      const res = await axios.get(`${API_URL}/heygen/voices`);
      setHeygenVoices(res.data.voices);
      toast.success(`${res.data.count} HeyGen voices loaded`);
    } catch {
      toast.error('Failed to load HeyGen voices');
    } finally {
      setLoadingHGVoices(false);
    }
  };

  const handleLoadELVoices = async () => {
    if (!elApiKey.trim()) {
      toast.error('Enter your ElevenLabs API key');
      return;
    }
    setLoadingELVoices(true);
    try {
      const res = await axios.post(`${API_URL}/elevenlabs/voices`, {
        elevenlabs_api_key: elApiKey
      });
      setElVoices(res.data.voices);
      setElKeyVerified(true);
      toast.success(`${res.data.count} ElevenLabs voices loaded!`);
    } catch (err) {
      if (err.response?.status === 400) {
        toast.error('Invalid ElevenLabs API key');
      } else {
        toast.error(err.response?.data?.detail || 'Failed to load voices');
      }
      setElKeyVerified(false);
    } finally {
      setLoadingELVoices(false);
    }
  };

  const handleGenerateAdvanced = async () => {
    if (!script.trim()) { toast.error('Please enter a script'); return; }
    if (!title.trim()) { toast.error('Please enter a title'); return; }
    if (user.credits < 1) { toast.error('Insufficient credits'); return; }
    
    if (voiceTab === 'elevenlabs' && !selectedELVoice) {
      toast.error('Please select an ElevenLabs voice');
      return;
    }
    
    const [w, h] = resolution === '1080p' ? [1920, 1080] : [1280, 720];
    setGeneratingAdvanced(true);
    try {
      const payload = {
        avatar_id: avatar.avatar_id,
        avatar_name: avatar.display_name || avatar.avatar_name,
        title,
        script,
        language,
        duration: parseInt(duration),
        folder_id: null,
        avatar_engine: avatarEngine,
        width: w,
        height: h,
        enable_captions: enableCaptions,
      };

      if (voiceTab === 'elevenlabs') {
        payload.voice_mode = 'elevenlabs';
        payload.elevenlabs_api_key = elApiKey;
        payload.elevenlabs_voice_id = selectedELVoice.voice_id;
        payload.elevenlabs_model_id = elModel;
        payload.el_stability = elStability;
        payload.el_similarity_boost = elSimilarity;
      } else {
        payload.voice_mode = 'heygen';
        payload.heygen_voice_id = selectedHGVoice?.voice_id || null;
        payload.use_el_in_heygen = isELInHG;
        payload.el_heygen_model = elHGModel;
        payload.el_heygen_stability = elHGStability;
      }

      await axios.post(`${API_URL}/videos/generate-advanced`, payload);
      updateUserCredits(user.credits - 1);
      toast.success('Advanced video generation started! Check History for status.');
      navigate('/dashboard/history');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Video generation failed');
    } finally {
      setGeneratingAdvanced(false);
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

            {/* NEW: Voice Engine Card */}
            <Card className="border-2 border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Mic className="h-4 w-4 text-primary" />
                  Voice Engine
                  <Badge variant="outline" className="ml-auto text-xs">NEW</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Two tabs */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setVoiceTab('heygen')}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      voiceTab === 'heygen'
                        ? 'border-primary bg-primary/5'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <p className="text-sm font-semibold text-slate-900">HeyGen Voice</p>
                    <p className="text-xs text-slate-500 mt-0.5">Built-in AI voices</p>
                  </button>
                  <button
                    onClick={() => setVoiceTab('elevenlabs')}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      voiceTab === 'elevenlabs'
                        ? 'border-amber-500 bg-amber-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <p className="text-sm font-semibold text-slate-900">ElevenLabs 🎙</p>
                    <p className="text-xs text-slate-500 mt-0.5">Premium realistic voices</p>
                  </button>
                </div>

                {/* HeyGen Voice tab */}
                {voiceTab === 'heygen' && (
                  <div className="space-y-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleLoadHGVoices}
                      disabled={loadingHGVoices}
                      className="w-full gap-2"
                    >
                      {loadingHGVoices
                        ? <><Loader2 className="h-3 w-3 animate-spin" />Loading...</>
                        : 'Load HeyGen Voices'}
                    </Button>

                    {heygenVoices.length > 0 && (
                      <>
                        {/* Gender filter */}
                        <div className="space-y-1">
                          <Label className="text-xs text-slate-600">Filter by Gender</Label>
                          <div className="flex gap-2">
                            {['all', 'male', 'female'].map(g => (
                              <button
                                key={g}
                                onClick={() => {
                                  setHeygenGenderFilter(g);
                                  setSelectedHGVoice(null);
                                }}
                                className={`flex-1 py-1.5 text-xs rounded border transition-all capitalize ${
                                  heygenGenderFilter === g
                                    ? 'border-primary bg-primary/5 text-primary font-semibold'
                                    : 'border-slate-200 text-slate-600'
                                }`}
                              >
                                {g}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Search input */}
                        <div className="space-y-1">
                          <Label className="text-xs text-slate-600">Search by Name</Label>
                          <Input
                            type="text"
                            placeholder="Type to search voices..."
                            value={heygenSearchTerm}
                            onChange={(e) => {
                              setHeygenSearchTerm(e.target.value);
                              setSelectedHGVoice(null);
                            }}
                            className="h-9 text-sm"
                          />
                        </div>

                        <Select
                          value={selectedHGVoice?.voice_id || ''}
                          onValueChange={(id) => {
                            const filteredHGVoices = heygenVoices
                              .filter(v => heygenGenderFilter === 'all' || v.gender === heygenGenderFilter)
                              .filter(v => v.name.toLowerCase().includes(heygenSearchTerm.toLowerCase()));
                            setSelectedHGVoice(filteredHGVoices.find(v => v.voice_id === id) || null);
                          }}
                        >
                          <SelectTrigger className="h-9 text-sm">
                            <SelectValue placeholder="Select a HeyGen voice..." />
                          </SelectTrigger>
                          <SelectContent className="max-h-52">
                            {(() => {
                              const filteredHGVoices = heygenVoices
                                .filter(v => heygenGenderFilter === 'all' || v.gender === heygenGenderFilter)
                                .filter(v => v.name.toLowerCase().includes(heygenSearchTerm.toLowerCase()));
                              return filteredHGVoices.map(v => (
                                <SelectItem key={v.voice_id} value={v.voice_id}>
                                  {v.name}
                                  {v.language ? <span className="text-xs text-slate-400 ml-1">· {v.language}</span> : null}
                                </SelectItem>
                              ));
                            })()}
                          </SelectContent>
                        </Select>

                        {selectedHGVoice?.preview_audio && (
                          <div className="bg-slate-50 rounded-lg p-2">
                            <p className="text-xs text-slate-500 mb-1">Voice sample:</p>
                            <audio controls src={selectedHGVoice.preview_audio} className="w-full h-8" />
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-1">
                          <div>
                            <p className="text-sm font-medium text-slate-900">This is an ElevenLabs voice</p>
                            <p className="text-xs text-slate-500">Enable if this voice was imported from ElevenLabs</p>
                          </div>
                          <Switch checked={isELInHG} onCheckedChange={setIsELInHG} />
                        </div>

                        {isELInHG && (
                          <div className="space-y-3 pl-2 border-l-2 border-amber-200">
                            <div className="space-y-1">
                              <Label className="text-xs text-slate-600">ElevenLabs Model</Label>
                              <Select value={elHGModel} onValueChange={setElHGModel}>
                                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="eleven_multilingual_v2">eleven_multilingual_v2</SelectItem>
                                  <SelectItem value="eleven_v3">eleven_v3</SelectItem>
                                  <SelectItem value="eleven_turbo_v2_5">eleven_turbo_v2_5</SelectItem>
                                  <SelectItem value="eleven_turbo_v2">eleven_turbo_v2</SelectItem>
                                  <SelectItem value="eleven_monolingual_v1">eleven_monolingual_v1</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs text-slate-600">
                                Stability: {elHGStability === 0 ? '0' : elHGStability === 1.0 ? '1.0' : '0.5'}
                              </Label>
                              <div className="flex gap-2">
                                {[0, 0.5, 1.0].map(v => (
                                  <button
                                    key={v}
                                    onClick={() => setElHGStability(v)}
                                    className={`flex-1 py-1.5 text-xs rounded border transition-all ${
                                      elHGStability === v
                                        ? 'border-primary bg-primary/5 text-primary font-semibold'
                                        : 'border-slate-200 text-slate-600'
                                    }`}
                                  >
                                    {v}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* ElevenLabs tab */}
                {voiceTab === 'elevenlabs' && (
                  <div className="space-y-3">
                    {!elKeyVerified ? (
                      <div className="space-y-2">
                        <Label className="text-xs text-slate-600">Your ElevenLabs API Key</Label>
                        <div className="flex gap-2">
                          <Input
                            type="password"
                            placeholder="sk_..."
                            value={elApiKey}
                            onChange={e => setElApiKey(e.target.value)}
                            className="h-9 text-sm flex-1"
                            onKeyDown={e => e.key === 'Enter' && handleLoadELVoices()}
                          />
                          <Button
                            size="sm"
                            onClick={handleLoadELVoices}
                            disabled={loadingELVoices || !elApiKey.trim()}
                          >
                            {loadingELVoices ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Load'}
                          </Button>
                        </div>
                        <p className="text-xs text-slate-400">
                          Get key: elevenlabs.io → Profile → API Keys
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-green-600 font-medium">✓ {elVoices.length} voices loaded</span>
                          <button
                            onClick={() => {
                              setElKeyVerified(false);
                              setElVoices([]);
                              setSelectedELVoice(null);
                            }}
                            className="text-xs text-primary underline"
                          >
                            Change key
                          </button>
                        </div>

                        {/* Language filter */}
                        <div className="space-y-1">
                          <Label className="text-xs text-slate-600">Filter by Language</Label>
                          <div className="grid grid-cols-3 gap-1">
                            {['all', 'hindi', 'tamil', 'telugu', 'english-indian'].map(lang => (
                              <button
                                key={lang}
                                onClick={() => {
                                  setElLangFilter(lang);
                                  setSelectedELVoice(null);
                                }}
                                className={`py-1.5 px-2 text-xs rounded border transition-all capitalize ${
                                  elLangFilter === lang
                                    ? 'border-amber-500 bg-amber-50 text-amber-700 font-semibold'
                                    : 'border-slate-200 text-slate-600'
                                }`}
                              >
                                {lang === 'english-indian' ? 'En-Indian' : lang}
                              </button>
                            ))}
                          </div>
                        </div>

                        <Select
                          value={selectedELVoice?.voice_id || ''}
                          onValueChange={id => {
                            const filteredELVoices = (() => {
                              if (elLangFilter === 'all') return elVoices;
                              return elVoices.filter(v => {
                                const accent = (v.labels?.accent || '').toLowerCase();
                                const language = (v.labels?.language || '').toLowerCase();
                                if (elLangFilter === 'hindi') return accent.includes('hindi') || language.includes('hindi');
                                if (elLangFilter === 'tamil') return accent.includes('tamil') || language.includes('tamil');
                                if (elLangFilter === 'telugu') return accent.includes('telugu') || language.includes('telugu');
                                if (elLangFilter === 'english-indian') return accent.includes('indian');
                                return true;
                              });
                            })();
                            setSelectedELVoice(filteredELVoices.find(v => v.voice_id === id) || null);
                          }}
                        >
                          <SelectTrigger className="h-9 text-sm">
                            <SelectValue placeholder="Select an ElevenLabs voice..." />
                          </SelectTrigger>
                          <SelectContent className="max-h-52">
                            {(() => {
                              const filteredELVoices = (() => {
                                if (elLangFilter === 'all') return elVoices;
                                return elVoices.filter(v => {
                                  const accent = (v.labels?.accent || '').toLowerCase();
                                  const language = (v.labels?.language || '').toLowerCase();
                                  if (elLangFilter === 'hindi') return accent.includes('hindi') || language.includes('hindi');
                                  if (elLangFilter === 'tamil') return accent.includes('tamil') || language.includes('tamil');
                                  if (elLangFilter === 'telugu') return accent.includes('telugu') || language.includes('telugu');
                                  if (elLangFilter === 'english-indian') return accent.includes('indian');
                                  return true;
                                });
                              })();
                              return filteredELVoices.map(v => (
                                <SelectItem key={v.voice_id} value={v.voice_id}>
                                  <span className="font-medium">{v.name}</span>
                                  {v.labels?.accent ? <span className="text-xs text-slate-400 ml-1">· {v.labels.accent}</span> : null}
                                </SelectItem>
                              ));
                            })()}
                          </SelectContent>
                        </Select>

                        {selectedELVoice?.preview_url && (
                          <div className="bg-slate-50 rounded-lg p-2">
                            <p className="text-xs text-slate-500 mb-1">Voice sample:</p>
                            <audio controls src={selectedELVoice.preview_url} className="w-full h-8" />
                          </div>
                        )}

                        <div className="space-y-1">
                          <Label className="text-xs text-slate-600">Model</Label>
                          <Select value={elModel} onValueChange={setElModel}>
                            <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="eleven_multilingual_v2">eleven_multilingual_v2 — Best quality</SelectItem>
                              <SelectItem value="eleven_v3">eleven_v3 — Latest</SelectItem>
                              <SelectItem value="eleven_turbo_v2_5">eleven_turbo_v2_5 — Fastest</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs text-slate-600">Stability: {elStability.toFixed(2)}</Label>
                            <Slider
                              min={0} max={1} step={0.05}
                              value={[elStability]}
                              onValueChange={([v]) => setElStability(v)}
                            />
                            <p className="text-xs text-slate-400">Higher = more consistent</p>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-slate-600">Similarity: {elSimilarity.toFixed(2)}</Label>
                            <Slider
                              min={0} max={1} step={0.05}
                              value={[elSimilarity]}
                              onValueChange={([v]) => setElSimilarity(v)}
                            />
                            <p className="text-xs text-slate-400">Higher = closer to original</p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* NEW: Avatar Engine Card */}
            <Card className="border-2 border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-500" />
                  Avatar Engine
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {['standard', 'avatar_iv', 'avatar_v'].map(engine => (
                  <button
                    key={engine}
                    onClick={() => setAvatarEngine(engine)}
                    className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                      avatarEngine === engine
                        ? engine === 'avatar_v'
                          ? 'border-amber-500 bg-amber-50'
                          : engine === 'avatar_iv'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-primary bg-primary/5'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        {engine === 'standard' && (
                          <>
                            <p className="text-sm font-semibold text-slate-900">Standard</p>
                            <p className="text-xs text-slate-500">HeyGen default engine</p>
                          </>
                        )}
                        {engine === 'avatar_iv' && (
                          <>
                            <p className="text-sm font-semibold text-slate-900">Avatar IV ⚡</p>
                            <p className="text-xs text-slate-500">Expressive motion · Natural gestures</p>
                          </>
                        )}
                        {engine === 'avatar_v' && (
                          <div className="flex items-start gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold text-slate-900">Avatar V</p>
                                <Badge className="text-xs bg-amber-100 text-amber-700 border-amber-200 px-1.5">
                                  ✨ NEW
                                </Badge>
                              </div>
                              <p className="text-xs text-slate-500">
                                Identity consistent · Multi-angle · Multi-look · Long-form
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                      {avatarEngine === engine && (
                        <div className={`h-4 w-4 rounded-full flex-shrink-0 ${
                          engine === 'avatar_v' ? 'bg-amber-500'
                          : engine === 'avatar_iv' ? 'bg-blue-500'
                          : 'bg-primary'
                        }`} />
                      )}
                    </div>
                  </button>
                ))}

                {avatarEngine === 'avatar_v' && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 space-y-1 mt-2">
                    <p className="font-semibold">Using Avatar V engine (launched April 8, 2026)</p>
                    <p>
                      Your Avatar V digital twin was created from a 15-second recording in
                      your HeyGen account. It maintains perfect identity consistency across
                      any angle, outfit change, and video length. Make sure the selected
                      avatar was created with Avatar V (look for the V badge in HeyGen).
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* NEW: Advanced Options Card */}
            <Card className="border border-slate-200">
              <button
                className="w-full px-4 py-3 flex items-center justify-between"
                onClick={() => setShowAdvanced(p => !p)}
              >
                <span className="text-sm font-medium text-slate-700">Advanced Options</span>
                {showAdvanced
                  ? <ChevronUp className="h-4 w-4 text-slate-400" />
                  : <ChevronDown className="h-4 w-4 text-slate-400" />}
              </button>

              {showAdvanced && (
                <CardContent className="pt-0 space-y-4 border-t border-slate-100">
                  <div className="space-y-2">
                    <Label className="text-xs text-slate-600">Output Resolution</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: '720p', sub: '1280 × 720' },
                        { value: '1080p', sub: '1920 × 1080 · Recommended' }
                      ].map(r => (
                        <button
                          key={r.value}
                          onClick={() => setResolution(r.value)}
                          className={`p-2.5 rounded-lg border-2 text-center transition-all ${
                            resolution === r.value
                              ? 'border-primary bg-primary/5'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <p className="text-sm font-semibold text-slate-900">{r.value}</p>
                          <p className="text-xs text-slate-400">{r.sub}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-900">Auto Captions</p>
                      <p className="text-xs text-slate-500">Burn subtitles into the video</p>
                    </div>
                    <Switch checked={enableCaptions} onCheckedChange={setEnableCaptions} />
                  </div>
                </CardContent>
              )}
            </Card>

            {/* NEW: Advanced Generate Section */}
            <Card className="border-2 border-primary">
              <CardContent className="pt-6 space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-xs">
                    {voiceTab === 'elevenlabs' && selectedELVoice
                      ? `🎙 ElevenLabs: ${selectedELVoice.name}`
                      : selectedHGVoice
                      ? `🔊 ${selectedHGVoice.name}`
                      : '🔊 HeyGen Default'}
                  </Badge>
                  {avatarEngine === 'avatar_v' && (
                    <Badge variant="outline" className="text-xs text-amber-700 border-amber-300">
                      ✨ Avatar V
                    </Badge>
                  )}
                  {avatarEngine === 'avatar_iv' && (
                    <Badge variant="outline" className="text-xs text-blue-700 border-blue-300">
                      ⚡ Avatar IV
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs">📐 {resolution}</Badge>
                  {enableCaptions && (
                    <Badge variant="outline" className="text-xs">📝 Captions ON</Badge>
                  )}
                </div>

                <Button
                  onClick={handleGenerateAdvanced}
                  disabled={generatingAdvanced || !script || !title}
                  className="w-full h-12 font-semibold bg-gradient-to-r from-primary to-blue-600 hover:opacity-90 text-white shadow-md gap-2"
                >
                  {generatingAdvanced ? (
                    <><Loader2 className="h-4 w-4 animate-spin" />Generating Advanced Video...</>
                  ) : (
                    <><VideoIcon className="h-4 w-4" />Generate with Advanced Settings (1 Credit)</>
                  )}
                </Button>

                <div className="relative my-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-2 bg-white text-slate-400">or use standard generation</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
