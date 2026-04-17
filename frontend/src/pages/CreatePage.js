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
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { Sparkles, RefreshCw, Play, Video as VideoIcon, Loader2, Mic, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;
const EL_API_KEY = 'sk_cfa652388dad22ed13e0d36de0a31b235e34a91a2dbd21c8';

/* ── Custom Toggle — replaces shadcn Switch ── */
function Toggle({ checked, onChange }) {
  return (
    <div
      onClick={() => onChange(!checked)}
      style={{
        width: 40,
        height: 22,
        borderRadius: 50,
        flexShrink: 0,
        background: checked
          ? 'linear-gradient(135deg,#c07818,#f5d070)'
          : 'rgba(255,255,255,0.1)',
        border: `1px solid ${checked ? 'rgba(224,160,57,0.4)' : 'rgba(255,255,255,0.08)'}`,
        position: 'relative',
        transition: 'all 0.25s',
        cursor: 'pointer',
        boxShadow: checked ? '0 0 12px rgba(224,160,57,0.28)' : 'none',
        display: 'inline-block',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 2,
          left: checked ? 20 : 2,
          width: 16,
          height: 16,
          borderRadius: '50%',
          background: '#fff',
          transition: 'left 0.22s cubic-bezier(0.4,0,0.2,1)',
          boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
        }}
      />
    </div>
  );
}

export default function CreatePage() {
  const location  = useLocation();
  const navigate  = useNavigate();
  const { user, updateUserCredits } = useAuth();
  const [avatar, setAvatar] = useState(location.state?.avatar || null);

  /* ── Script states ── */
  const [scriptMode,     setScriptMode]     = useState('ai-generate');
  const [prompt,         setPrompt]         = useState('');
  const [script,         setScript]         = useState('');
  const [enhanceScript,  setEnhanceScript]  = useState(false);
  const [tone,           setTone]           = useState('Professional');
  const [duration,       setDuration]       = useState('30');
  const [language,       setLanguage]       = useState('Hindi');

  /* Auto-detect duration from script length */
  useEffect(() => {
    const chars = script.trim().length;
    if      (chars <= 150)  setDuration('10');
    else if (chars <= 300)  setDuration('20');
    else if (chars <= 450)  setDuration('30');
    else if (chars <= 800)  setDuration('60');
    else if (chars <= 1200) setDuration('90');
    else if (chars <= 1800) setDuration('120');
    else if (chars <= 2800) setDuration('180');
    else if (chars <= 4000) setDuration('240');
    else                    setDuration('300');
  }, [script]);

  /* ── Video states ── */
  const [title,      setTitle]      = useState('');
  const [loading,    setLoading]    = useState(false);
  const [audioPreview, setAudioPreview] = useState(null);
  const [generating, setGenerating] = useState(false);

  /* ── Voice states ── */
  const [voiceTab,           setVoiceTab]           = useState('heygen');
  const [heygenVoices,       setHeygenVoices]       = useState([]);
  const [heygenGenderFilter, setHeygenGenderFilter] = useState('all');
  const [heygenSearchTerm,   setHeygenSearchTerm]   = useState('');
  const [selectedHGVoice,    setSelectedHGVoice]    = useState(null);
  const [loadingHGVoices,    setLoadingHGVoices]    = useState(false);
  const [isELInHG,           setIsELInHG]           = useState(false);
  const [elHGModel,          setElHGModel]          = useState('eleven_multilingual_v2');
  const [elHGStability,      setElHGStability]      = useState(0.5);
  const [elApiKey,           setElApiKey]           = useState('');
  const [elKeyVerified,      setElKeyVerified]      = useState(false);
  const [elVoices,           setElVoices]           = useState([]);
  const [elLangFilter,       setElLangFilter]       = useState('all');
  const [elSearchTerm,       setElSearchTerm]       = useState('');
  const [selectedELVoice,    setSelectedELVoice]    = useState(null);
  const [elModel,            setElModel]            = useState('eleven_multilingual_v2');
  const [elStability,        setElStability]        = useState(0.5);
  const [elSimilarity,       setElSimilarity]       = useState(0.75);
  const [loadingELVoices,    setLoadingELVoices]    = useState(false);

  /* ── Advanced states ── */
  const [avatarEngine,        setAvatarEngine]        = useState('avatar_iv');
  const [showAdvanced,        setShowAdvanced]        = useState(false);
  const [resolution,          setResolution]          = useState('1080p');
  const [enableCaptions,      setEnableCaptions]      = useState(false);
  const [generatingAdvanced,  setGeneratingAdvanced]  = useState(false);

  useEffect(() => {
    if (!avatar) {
      navigate('/dashboard/avatars');
    }
  }, [avatar, navigate]);

  /* ── Handlers ── */
  const handleGenerateScript = async () => {
    if (!prompt.trim()) { toast.error('Please enter a prompt'); return; }
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
    if (!script.trim()) { toast.error('Please enter a script first'); return; }
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
    if (!script.trim()) { toast.error('Please enter a script first'); return; }
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
    if (!script.trim()) { toast.error('Please enter your script first'); return; }

    /* ElevenLabs preview */
    if (voiceTab === 'elevenlabs') {
      if (!selectedELVoice) { toast.error('Please select an ElevenLabs voice first'); return; }
      setLoading(true);
      try {
        const res = await axios.post(`${API_URL}/elevenlabs/preview`, {
          elevenlabs_api_key: EL_API_KEY,
          elevenlabs_voice_id: selectedELVoice.voice_id,
          script,
          model_id: elModel,
          stability: elStability,
          similarity_boost: elSimilarity,
        });
        if (res.data.audio_base64) {
          setAudioPreview(res.data.audio_base64);
          toast.success(`Playing script with ElevenLabs voice: ${selectedELVoice.name}`);
        }
      } catch (err) {
        toast.error(err.response?.data?.detail || 'Preview failed');
      } finally {
        setLoading(false);
      }
      return;
    }

    /* HeyGen preview */
    if (!selectedHGVoice) { toast.error('Please select a voice first'); return; }
    setLoading(true);
    try {
      if (isELInHG && selectedHGVoice?.name) {
        const res = await axios.post(`${API_URL}/voice/script-preview`, {
          heygen_voice_name: selectedHGVoice.name,
          script,
          model_id: elHGModel || 'eleven_multilingual_v2',
        });
        if (res.data.audio_base64) {
          setAudioPreview(res.data.audio_base64);
          toast.success(`Playing script with ElevenLabs voice: ${res.data.matched_voice_name || selectedHGVoice.name}`);
        }
      } else {
        const res = await axios.post(`${API_URL}/heygen/tts-preview`, {
          voice_id: selectedHGVoice.voice_id,
          script,
        });
        if (res.data.audio_url) {
          const audio = new Audio(res.data.audio_url);
          audio.play();
          toast.success('Playing your script in selected voice!');
        } else if (res.data.audio_base64) {
          setAudioPreview(res.data.audio_base64);
          toast.success('Preview ready!');
        }
      }
    } catch (err) {
      if (selectedHGVoice?.preview_audio) {
        const audio = new Audio(selectedHGVoice.preview_audio);
        audio.play();
        toast.success('Playing voice sample for selected voice');
      } else {
        toast.error(err.response?.data?.detail || 'Preview failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateVideo = async () => {
    if (!script.trim()) { toast.error('Please enter a script'); return; }
    if (!title.trim())  { toast.error('Please enter a title for your video'); return; }
    if (user.credits < 1) { toast.error('Insufficient credits'); return; }
    setGenerating(true);
    try {
      await axios.post(`${API_URL}/videos/generate`, {
        avatar_id:   avatar.avatar_id,
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
    setLoadingELVoices(true);
    try {
      const res = await axios.post(`${API_URL}/elevenlabs/voices`, {
        elevenlabs_api_key: EL_API_KEY,
      });
      setElVoices(res.data.voices);
      setElKeyVerified(true);
      toast.success(`${res.data.count} ElevenLabs voices loaded!`);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to load ElevenLabs voices');
      setElKeyVerified(false);
    } finally {
      setLoadingELVoices(false);
    }
  };

  const handleGenerateAdvanced = async () => {
    if (!script.trim()) { toast.error('Please enter a script'); return; }
    if (!title.trim())  { toast.error('Please enter a title'); return; }
    if (user.credits < 1) { toast.error('Insufficient credits'); return; }
    if (voiceTab === 'elevenlabs' && !selectedELVoice) {
      toast.error('Please select an ElevenLabs voice');
      return;
    }
    const [w, h] = resolution === '1080p' ? [1920, 1080] : [1280, 720];
    setGeneratingAdvanced(true);
    try {
      let payload = {
        avatar_id:       avatar.avatar_id,
        avatar_name:     avatar.display_name || avatar.avatar_name,
        title,
        script,
        language,
        duration:        parseInt(duration),
        folder_id:       null,
        avatar_engine:   avatarEngine,
        width:           w,
        height:          h,
        enable_captions: enableCaptions,
      };
      if (voiceTab === 'elevenlabs') {
        payload = {
          ...payload,
          voice_mode:           'elevenlabs',
          elevenlabs_api_key:   EL_API_KEY,
          elevenlabs_voice_id:  selectedELVoice.voice_id,
          elevenlabs_model_id:  elModel,
          el_stability:         elStability,
          el_similarity_boost:  elSimilarity,
        };
      } else {
        payload = {
          ...payload,
          voice_mode:          'heygen',
          heygen_voice_id:     selectedHGVoice?.voice_id || null,
          heygen_voice_name:   selectedHGVoice?.name || null,
          use_el_in_heygen:    isELInHG,
          el_heygen_model:     elHGModel,
          el_heygen_stability: elHGStability,
        };
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

  /* ── Filtered EL voices ── */
  const filteredELVoices = elVoices.filter(v => {
    const matchSearch =
      elSearchTerm === '' ? true :
        v.name?.toLowerCase().includes(elSearchTerm.toLowerCase()) ||
        v.labels?.accent?.toLowerCase().includes(elSearchTerm.toLowerCase());
    const matchLang =
      elLangFilter === 'all' ? true :
        v.labels?.accent?.toLowerCase().includes(elLangFilter) ||
        v.labels?.language?.toLowerCase().includes(elLangFilter) ||
        v.name?.toLowerCase().includes(elLangFilter);
    return matchSearch && matchLang;
  });

  if (!avatar) return null;

  /* ─── Style tokens ─── */
  const card = {
    background:           'rgba(255,255,255,0.042)',
    border:               '1px solid rgba(255,255,255,0.09)',
    borderRadius:         20,
    backdropFilter:       'blur(32px) saturate(180%)',
    WebkitBackdropFilter: 'blur(32px) saturate(180%)',
    boxShadow:            '0 0 0 1px rgba(255,255,255,0.04), 0 24px 64px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.08)',
    position:             'relative',
    overflow:             'hidden',
  };

  const cardTopAccent = {
    position:    'absolute',
    top:         0,
    left:        0,
    right:       0,
    height:      1,
    background:  'linear-gradient(90deg,transparent,rgba(224,160,57,0.35),transparent)',
    pointerEvents: 'none',
    zIndex:      1,
  };

  const lbl = {
    fontSize:      10,
    fontWeight:    700,
    color:         'rgba(255,255,255,0.35)',
    letterSpacing: '1.2px',
    textTransform: 'uppercase',
    marginBottom:  6,
    display:       'block',
  };

  const goldBtn = {
    background:    'linear-gradient(135deg,#c07818,#f5d070,#c07818)',
    backgroundSize:'200% 100%',
    color:         '#1a0e00',
    border:        'none',
    borderRadius:  50,
    fontWeight:    800,
    cursor:        'pointer',
    fontFamily:    'inherit',
    display:       'flex',
    alignItems:    'center',
    justifyContent:'center',
    gap:           8,
    padding:       '13px 22px',
    fontSize:      13,
    width:         '100%',
    transition:    'all 0.25s',
  };

  const ghostBtn = {
    background:    'rgba(255,255,255,0.04)',
    border:        '1px solid rgba(255,255,255,0.09)',
    borderRadius:  12,
    color:         'rgba(255,255,255,0.5)',
    cursor:        'pointer',
    fontFamily:    'inherit',
    display:       'flex',
    alignItems:    'center',
    justifyContent:'center',
    gap:           7,
    padding:       '10px 16px',
    fontSize:      13,
    width:         '100%',
    transition:    'all 0.2s',
  };

  const sectionTitle = {
    fontSize:    15,
    fontWeight:  700,
    color:       '#fff',
    letterSpacing: '-0.2px',
    margin:      0,
  };

  const sectionSub = {
    fontSize:  11,
    color:     'rgba(255,255,255,0.25)',
    margin:    '2px 0 0',
    fontWeight:300,
  };

  const divider = {
    height:     1,
    background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.06),transparent)',
    margin:     '18px 0',
  };

  const iconBox = (color) => ({
    width:          34,
    height:         34,
    borderRadius:   10,
    background:     `rgba(${color},0.1)`,
    border:         `1px solid rgba(${color},0.22)`,
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
  });

  return (
    <div style={{ minHeight: 'calc(100vh - 65px)', background: '#05050e', fontFamily: '-apple-system,BlinkMacSystemFont,sans-serif', position: 'relative' }}>

      {/* ── Background layers ── */}
      <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse 65% 45% at 50% 0%, rgba(224,160,57,0.055), transparent 65%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px)', backgroundSize: '72px 72px', maskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, black, transparent)', pointerEvents: 'none', zIndex: 0 }} />

      <style>{`
        .cp-inp:focus { border-color: rgba(224,160,57,0.45) !important; box-shadow: 0 0 0 3px rgba(224,160,57,0.09) !important; background: rgba(255,255,255,0.07) !important; }
        .cp-gbtn:hover { box-shadow: 0 10px 32px rgba(224,160,57,0.45) !important; transform: translateY(-1px) !important; background-position: 100% 0 !important; }
        .cp-gbtn:active { transform: scale(0.98) !important; }
        .cp-ghost:hover { background: rgba(255,255,255,0.08) !important; border-color: rgba(255,255,255,0.16) !important; color: rgba(255,255,255,0.85) !important; }
        .cp-engine:hover { border-color: rgba(224,160,57,0.35) !important; background: rgba(224,160,57,0.05) !important; }
        .cp-tab-btn { flex:1; padding:8px 0; border:none; background:transparent; color:rgba(255,255,255,0.3); font-size:12px; font-weight:500; cursor:pointer; border-radius:8px; transition:all 0.2s; font-family:inherit; }
        .cp-tab-btn.active { background:rgba(255,255,255,0.1); color:#fff; font-weight:700; }
        .cp-tab-btn:hover:not(.active) { color:rgba(255,255,255,0.6); }
        .cp-filter-btn { flex:1; padding:6px 4px; border:1px solid rgba(255,255,255,0.07); background:transparent; color:rgba(255,255,255,0.35); font-size:11px; border-radius:8px; cursor:pointer; transition:all 0.18s; font-family:inherit; text-transform:capitalize; }
        .cp-filter-btn.active { border-color:rgba(224,160,57,0.4); background:rgba(224,160,57,0.08); color:#e0a039; font-weight:600; }
        .cp-filter-btn:hover:not(.active) { border-color:rgba(255,255,255,0.14); color:rgba(255,255,255,0.6); }
        .cp-voice-tab { flex:1; padding:13px 14px; border-radius:14px; border:1px solid rgba(255,255,255,0.07); background:rgba(255,255,255,0.02); cursor:pointer; text-align:left; transition:all 0.2s; }
        .cp-voice-tab.active-hg { border-color:rgba(224,160,57,0.45); background:rgba(224,160,57,0.07); box-shadow:0 0 20px rgba(224,160,57,0.08); }
        .cp-voice-tab.active-el { border-color:rgba(251,191,36,0.5); background:rgba(251,191,36,0.07); box-shadow:0 0 20px rgba(251,191,36,0.08); }
        .cp-voice-tab:hover { border-color:rgba(255,255,255,0.14); }
        .cp-res-btn { flex:1; padding:12px; border-radius:12px; border:1px solid rgba(255,255,255,0.07); background:rgba(255,255,255,0.02); cursor:pointer; text-align:center; transition:all 0.2s; }
        .cp-res-btn.active { border-color:rgba(224,160,57,0.45); background:rgba(224,160,57,0.07); }
        .cp-adv-toggle { width:100%; padding:15px 20px; display:flex; align-items:center; justify-content:space-between; background:transparent; border:none; cursor:pointer; font-family:inherit; }
        .cp-adv-toggle:hover { background:rgba(255,255,255,0.02) !important; }
        [data-radix-select-trigger] { background:rgba(255,255,255,0.05) !important; border:1px solid rgba(255,255,255,0.08) !important; color:#fff !important; border-radius:10px !important; transition:all 0.2s !important; }
        [data-radix-select-trigger]:focus { border-color:rgba(224,160,57,0.4) !important; box-shadow:0 0 0 3px rgba(224,160,57,0.08) !important; }
        [data-radix-select-content] { background:#0d0d1c !important; border:1px solid rgba(255,255,255,0.09) !important; color:#fff !important; backdrop-filter:blur(24px) !important; }
        [data-radix-select-item]:hover { background:rgba(224,160,57,0.1) !important; }
        [data-radix-select-item] { color:rgba(255,255,255,0.75) !important; }
        [role="tablist"] { background:rgba(255,255,255,0.05) !important; border-radius:12px !important; padding:3px !important; }
        [role="tab"] { color:rgba(255,255,255,0.35) !important; border-radius:10px !important; transition:all 0.2s !important; }
        [role="tab"][data-state="active"] { background:rgba(255,255,255,0.1) !important; color:#fff !important; font-weight:700 !important; }
        textarea, input[type="text"], input[type="password"], input[type="email"] { background:rgba(255,255,255,0.05) !important; border:1px solid rgba(255,255,255,0.08) !important; color:#fff !important; border-radius:10px !important; transition:all 0.2s !important; }
        textarea::placeholder, input::placeholder { color:rgba(255,255,255,0.18) !important; }
        textarea:focus, input:focus { border-color:rgba(224,160,57,0.4) !important; box-shadow:0 0 0 3px rgba(224,160,57,0.08) !important; outline:none !important; background:rgba(255,255,255,0.07) !important; }
        input[type="range"] { accent-color:#e0a039; }
        audio { filter: invert(0.85) hue-rotate(180deg) brightness(1.1); width:100%; }
        @keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }
      `}</style>

      <div style={{ padding: '32px 48px', maxWidth: 1440, margin: '0 auto', position: 'relative', zIndex: 1 }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>

            {/* Step breadcrumb */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {[{ n: 1, label: 'Avatar' }, { n: 2, label: 'Create' }, { n: 3, label: 'Done' }].map((s, i) => (
                <React.Fragment key={s.n}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: s.n === 2 ? 'linear-gradient(135deg,#c07818,#e0a039)' : s.n < 2 ? 'rgba(224,160,57,0.3)' : 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: s.n <= 2 ? '#1a0e00' : 'rgba(255,255,255,0.3)' }}>
                      {s.n}
                    </div>
                    <span style={{ fontSize: 11, fontWeight: s.n === 2 ? 700 : 400, color: s.n === 2 ? '#e0a039' : s.n < 2 ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.2)' }}>
                      {s.label}
                    </span>
                  </div>
                  {i < 2 && <div style={{ width: 20, height: 1, background: 'rgba(255,255,255,0.1)' }} />}
                </React.Fragment>
              ))}
            </div>

            <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.08)' }} />

            {/* Avatar info */}
            <img
              src={avatar.preview_image_url || avatar.image_url}
              alt={avatar.display_name}
              style={{ width: 48, height: 48, borderRadius: 13, objectFit: 'cover', border: '1.5px solid rgba(224,160,57,0.35)', boxShadow: '0 4px 16px rgba(0,0,0,0.4)' }}
            />
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', letterSpacing: '-0.7px', margin: 0 }}>
                {avatar.display_name || avatar.avatar_name}
              </h1>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', margin: '2px 0 0', fontWeight: 300 }}>
                Create your AI avatar video
              </p>
            </div>
          </div>

          {/* Credits badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 50, background: 'rgba(224,160,57,0.07)', border: '1px solid rgba(224,160,57,0.18)' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#e0a039', boxShadow: '0 0 6px #e0a039' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(224,160,57,0.85)' }}>
              {user?.credits ?? 0} Credits
            </span>
          </div>
        </div>

        {/* ── Two-column grid ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22 }}>

          {/* ════════════════════════════════
              LEFT — Script Creation
          ════════════════════════════════ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Script Card */}
            <div data-testid="script-creation-card" style={{ ...card, padding: '26px' }}>
              <div style={cardTopAccent} />

              {/* Card header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <div style={iconBox('224,160,57')}>
                  <Sparkles size={16} color="#e0a039" />
                </div>
                <div>
                  <p style={sectionTitle}>Script Creation</p>
                  <p style={sectionSub}>Generate or paste your script</p>
                </div>
              </div>

              {/* Script Mode Tabs */}
              <Tabs value={scriptMode} onValueChange={setScriptMode}>
                <TabsList style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}>
                  <TabsTrigger value="ai-generate" data-testid="tab-ai-generate">AI Generate</TabsTrigger>
                  <TabsTrigger value="paste"       data-testid="tab-paste">Paste Script</TabsTrigger>
                  <TabsTrigger value="ai-rewrite"  data-testid="tab-ai-rewrite">AI Rewrite</TabsTrigger>
                </TabsList>

                {/* ── AI Generate tab ── */}
                <TabsContent value="ai-generate" style={{ marginTop: 16 }}>
                  <div style={{ marginBottom: 12 }}>
                    <label style={lbl}>Enter Your Idea</label>
                    <Textarea
                      id="prompt"
                      data-testid="ai-prompt-input"
                      placeholder="E.g., Explain Jio 5G benefits to young users"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      rows={4}
                      style={{ resize: 'none' }}
                    />
                  </div>
                  <button
                    data-testid="generate-script-button"
                    onClick={handleGenerateScript}
                    disabled={loading}
                    className="cp-gbtn"
                    style={{ ...goldBtn, opacity: loading ? 0.7 : 1 }}
                  >
                    {loading
                      ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />Generating...</>
                      : <><Sparkles size={14} />Generate Script</>}
                  </button>
                </TabsContent>

                {/* ── Paste tab ── */}
                <TabsContent value="paste" style={{ marginTop: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', marginBottom: 12 }}>
                    <div>
                      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', margin: 0, fontWeight: 500 }}>Enhance with AI</p>
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', margin: '2px 0 0' }}>Polish your pasted script</p>
                    </div>
                    <Toggle checked={enhanceScript} onChange={setEnhanceScript} />
                  </div>
                  {enhanceScript && (
                    <button
                      onClick={handleEnhanceScript}
                      disabled={loading}
                      className="cp-ghost"
                      style={{ ...ghostBtn, opacity: loading ? 0.7 : 1 }}
                    >
                      {loading
                        ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />Enhancing...</>
                        : <><RefreshCw size={13} />Enhance Script</>}
                    </button>
                  )}
                </TabsContent>

                {/* ── AI Rewrite tab ── */}
                <TabsContent value="ai-rewrite" style={{ marginTop: 16 }}>
                  <div style={{ marginBottom: 12 }}>
                    <label style={lbl}>Tone</label>
                    <Select value={tone} onValueChange={setTone}>
                      <SelectTrigger data-testid="tone-select"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Emotional">Emotional</SelectItem>
                        <SelectItem value="Energetic">Energetic</SelectItem>
                        <SelectItem value="Slow delivery">Slow Delivery</SelectItem>
                        <SelectItem value="Fast delivery">Fast Delivery</SelectItem>
                        <SelectItem value="Professional">Professional</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <button
                    data-testid="rewrite-script-button"
                    onClick={handleRewriteScript}
                    disabled={loading}
                    className="cp-gbtn"
                    style={{ ...goldBtn, opacity: loading ? 0.7 : 1 }}
                  >
                    {loading
                      ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />Rewriting...</>
                      : <><RefreshCw size={14} />Rewrite Script</>}
                  </button>
                </TabsContent>
              </Tabs>

              <div style={divider} />

              {/* Script textarea */}
              <div>
                <label style={lbl}>Script</label>
                <Textarea
                  id="script"
                  data-testid="script-textarea"
                  placeholder="Your script will appear here..."
                  value={script}
                  onChange={(e) => setScript(e.target.value)}
                  rows={10}
                  style={{ resize: 'none', fontFamily: 'monospace', fontSize: 13 }}
                />

                {/* Character progress bar */}
                {(() => {
                  const charLimits = { '10': 150, '20': 270, '30': 400, '60': 800, '90': 1200, '120': 1800, '180': 2800, '240': 4000, '300': 5000 };
                  const limit  = charLimits[duration] || 400;
                  const count  = script.length;
                  const isOver = count > limit;
                  const pct    = Math.min(100, Math.round((count / limit) * 100));
                  return (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ height: 2, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: isOver ? '#fca5a5' : 'linear-gradient(90deg,#c07818,#e0a039)', borderRadius: 2, transition: 'width 0.3s' }} />
                      </div>
                      <p style={{ fontSize: 11, marginTop: 5, color: isOver ? '#fca5a5' : 'rgba(255,255,255,0.25)', fontWeight: isOver ? 600 : 400 }}>
                        {count} / {limit} characters · approx {duration}s
                        {isOver && ' — Script too long!'}
                      </p>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* ════════════════════════════════
              RIGHT — Video Config
          ════════════════════════════════ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* ── Video Config Card ── */}
            <div data-testid="video-config-card" style={{ ...card, padding: '26px' }}>
              <div style={{ ...cardTopAccent, background: 'linear-gradient(90deg,transparent,rgba(96,165,250,0.3),transparent)' }} />

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <div style={iconBox('96,165,250')}>
                  <VideoIcon size={16} color="#60a5fa" />
                </div>
                <div>
                  <p style={sectionTitle}>Video Configuration</p>
                  <p style={sectionSub}>Title, duration and language</p>
                </div>
              </div>

              {/* Title */}
              <div style={{ marginBottom: 14 }}>
                <label style={lbl}>Video Title</label>
                <Input
                  id="title"
                  data-testid="video-title-input"
                  placeholder="Enter video title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              {/* Duration + Language side by side */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={lbl}>Duration</label>
                  <Select value={duration} onValueChange={setDuration}>
                    <SelectTrigger data-testid="duration-select"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 seconds</SelectItem>
                      <SelectItem value="20">20 seconds</SelectItem>
                      <SelectItem value="30">30 seconds</SelectItem>
                      <SelectItem value="60">60 seconds</SelectItem>
                      <SelectItem value="90">90 seconds</SelectItem>
                      <SelectItem value="120">2 minutes</SelectItem>
                      <SelectItem value="180">3 minutes</SelectItem>
                      <SelectItem value="240">4 minutes</SelectItem>
                      <SelectItem value="300">5 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label style={lbl}>Language</label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger data-testid="language-select"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="English">English</SelectItem>
                      <SelectItem value="Hindi">Hindi</SelectItem>
                      <SelectItem value="Gujarati">Gujarati</SelectItem>
                      <SelectItem value="Tamil">Tamil</SelectItem>
                      <SelectItem value="Telugu">Telugu</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Voice Preview */}
              <div style={{ marginBottom: 14 }}>
                <label style={lbl}>Voice Preview</label>
                <button
                  data-testid="voice-preview-button"
                  onClick={handleVoicePreview}
                  disabled={loading || !script}
                  className="cp-ghost"
                  style={{ ...ghostBtn, opacity: loading || !script ? 0.45 : 1 }}
                >
                  {loading
                    ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />Generating Preview...</>
                    : <><Play size={14} />Preview Voice</>}
                </button>
                {audioPreview && (
                  <div style={{ marginTop: 12, padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
                    <audio
                      data-testid="audio-player"
                      controls
                      src={`data:audio/mp3;base64,${audioPreview}`}
                    />
                  </div>
                )}
              </div>

              <div style={divider} />

              {/* Generate Video */}
              <button
                data-testid="generate-video-button"
                onClick={handleGenerateVideo}
                disabled={generating || !script || !title}
                className="cp-gbtn"
                style={{ ...goldBtn, padding: '14px 22px', fontSize: 15, fontWeight: 800, opacity: generating || !script || !title ? 0.45 : 1 }}
              >
                {generating
                  ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />Generating Video...</>
                  : <><VideoIcon size={16} />Generate Video (1 Credit)</>}
              </button>
            </div>

            {/* ── Voice Engine Card ── */}
            <div style={{ ...card, padding: '26px' }}>
              <div style={cardTopAccent} />

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <div style={iconBox('224,160,57')}>
                  <Mic size={16} color="#e0a039" />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={sectionTitle}>Voice Engine</p>
                  <p style={sectionSub}>Choose your voice source</p>
                </div>
                <span style={{ fontSize: 9, fontWeight: 800, color: '#e0a039', background: 'rgba(224,160,57,0.1)', border: '1px solid rgba(224,160,57,0.22)', borderRadius: 50, padding: '3px 9px', letterSpacing: '0.6px' }}>NEW</span>
              </div>

              {/* Voice Tab Selector */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                <button
                  className={`cp-voice-tab ${voiceTab === 'heygen' ? 'active-hg' : ''}`}
                  onClick={() => setVoiceTab('heygen')}
                >
                  <p style={{ fontSize: 13, fontWeight: 700, color: voiceTab === 'heygen' ? '#e0a039' : 'rgba(255,255,255,0.7)', margin: '0 0 2px' }}>HeyGen Voice</p>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', margin: 0 }}>Built-in AI voices</p>
                </button>
                <button
                  className={`cp-voice-tab ${voiceTab === 'elevenlabs' ? 'active-el' : ''}`}
                  onClick={() => setVoiceTab('elevenlabs')}
                >
                  <p style={{ fontSize: 13, fontWeight: 700, color: voiceTab === 'elevenlabs' ? '#fbbf24' : 'rgba(255,255,255,0.7)', margin: '0 0 2px' }}>ElevenLabs 🎙</p>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', margin: 0 }}>Indian & Premium voices</p>
                </button>
              </div>

              {/* ── HeyGen Voice Tab ── */}
              {voiceTab === 'heygen' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <button
                    onClick={handleLoadHGVoices}
                    disabled={loadingHGVoices}
                    className="cp-ghost"
                    style={{ ...ghostBtn, opacity: loadingHGVoices ? 0.6 : 1 }}
                  >
                    {loadingHGVoices
                      ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />Loading...</>
                      : 'Load HeyGen Voices'}
                  </button>

                  {heygenVoices.length > 0 && (
                    <>
                      {/* Gender Filter */}
                      <div>
                        <label style={lbl}>Filter by Gender</label>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {['all', 'male', 'female'].map(g => (
                            <button
                              key={g}
                              className={`cp-filter-btn ${heygenGenderFilter === g ? 'active' : ''}`}
                              onClick={() => { setHeygenGenderFilter(g); setSelectedHGVoice(null); }}
                            >{g}</button>
                          ))}
                        </div>
                      </div>

                      {/* Search */}
                      <div>
                        <label style={lbl}>Search by Name</label>
                        <Input
                          type="text"
                          placeholder="Type to search voices..."
                          value={heygenSearchTerm}
                          onChange={(e) => { setHeygenSearchTerm(e.target.value); setSelectedHGVoice(null); }}
                        />
                      </div>

                      {/* HeyGen Voice Dropdown */}
                      <Select
                        value={selectedHGVoice?.voice_id || ''}
                        onValueChange={(id) => {
                          const filtered = heygenVoices
                            .filter(v => heygenGenderFilter === 'all' ? true : v.gender === heygenGenderFilter)
                            .filter(v => heygenSearchTerm === '' ? true :
                              v.name?.toLowerCase().includes(heygenSearchTerm.toLowerCase()) ||
                              v.language?.toLowerCase().includes(heygenSearchTerm.toLowerCase())
                            );
                          setSelectedHGVoice(filtered.find(v => v.voice_id === id) || null);
                        }}
                      >
                        <SelectTrigger style={{ fontSize: 13 }}>
                          <SelectValue placeholder="Select a HeyGen voice..." />
                        </SelectTrigger>
                        <SelectContent style={{ maxHeight: 200, overflowY: 'auto' }}>
                          {(() => {
                            const filtered = heygenVoices
                              .filter(v => heygenGenderFilter === 'all' ? true : v.gender === heygenGenderFilter)
                              .filter(v => heygenSearchTerm === '' ? true :
                                v.name?.toLowerCase().includes(heygenSearchTerm.toLowerCase()) ||
                                v.language?.toLowerCase().includes(heygenSearchTerm.toLowerCase())
                              );
                            return filtered.map(v => (
                              <SelectItem key={v.voice_id} value={v.voice_id}>
                                {v.name}{v.language ? ` · ${v.language}` : ''}
                              </SelectItem>
                            ));
                          })()}
                        </SelectContent>
                      </Select>

                      {/* HeyGen Voice Sample */}
                      {selectedHGVoice?.preview_audio && (
                        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: '10px 12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 6 }}>Voice sample:</p>
                          <audio controls src={selectedHGVoice.preview_audio} />
                        </div>
                      )}

                      {/* ElevenLabs-in-HeyGen toggle */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)', margin: 0 }}>This is an ElevenLabs voice</p>
                          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', margin: '2px 0 0' }}>Enable if imported from ElevenLabs</p>
                        </div>
                        <Toggle checked={isELInHG} onChange={setIsELInHG} />
                      </div>

                      {isELInHG && (
                        <div style={{ paddingLeft: 12, borderLeft: '2px solid rgba(251,191,36,0.25)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                          <div>
                            <label style={lbl}>ElevenLabs Model</label>
                            <Select value={elHGModel} onValueChange={setElHGModel}>
                              <SelectTrigger style={{ fontSize: 13 }}><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="eleven_multilingual_v2">eleven_multilingual_v2</SelectItem>
                                <SelectItem value="eleven_v3">eleven_v3</SelectItem>
                                <SelectItem value="eleven_turbo_v2_5">eleven_turbo_v2_5</SelectItem>
                                <SelectItem value="eleven_turbo_v2">eleven_turbo_v2</SelectItem>
                                <SelectItem value="eleven_monolingual_v1">eleven_monolingual_v1</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label style={lbl}>Stability</label>
                            <div style={{ display: 'flex', gap: 6 }}>
                              {[0, 0.5, 1.0].map(v => (
                                <button
                                  key={v}
                                  className={`cp-filter-btn ${elHGStability === v ? 'active' : ''}`}
                                  onClick={() => setElHGStability(v)}
                                >{v}</button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* ── ElevenLabs Direct Tab ── */}
              {voiceTab === 'elevenlabs' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <button
                    onClick={handleLoadELVoices}
                    disabled={loadingELVoices}
                    className="cp-ghost"
                    style={{ ...ghostBtn, borderColor: 'rgba(251,191,36,0.2)', color: 'rgba(251,191,36,0.8)', opacity: loadingELVoices ? 0.6 : 1 }}
                  >
                    {loadingELVoices
                      ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />Loading...</>
                      : elKeyVerified
                        ? `✓ ${elVoices.length} voices loaded — Reload`
                        : 'Load ElevenLabs Voices'}
                  </button>

                  {elVoices.length > 0 && (
                    <>
                      {/* Language Filter */}
                      <div>
                        <label style={lbl}>Filter by Language</label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 5 }}>
                          {['all', 'hindi', 'indian', 'tamil', 'telugu', 'english'].map(l => (
                            <button
                              key={l}
                              className={`cp-filter-btn ${elLangFilter === l ? 'active' : ''}`}
                              onClick={() => { setElLangFilter(l); setSelectedELVoice(null); }}
                            >{l}</button>
                          ))}
                        </div>
                      </div>

                      {/* Search */}
                      <div>
                        <label style={lbl}>Search by Name</label>
                        <Input
                          type="text"
                          placeholder="Search voices..."
                          value={elSearchTerm}
                          onChange={(e) => { setElSearchTerm(e.target.value); setSelectedELVoice(null); }}
                        />
                      </div>

                      {/* EL Voice Dropdown */}
                      <Select
                        value={selectedELVoice?.voice_id || ''}
                        onValueChange={(id) => setSelectedELVoice(filteredELVoices.find(v => v.voice_id === id) || null)}
                      >
                        <SelectTrigger style={{ fontSize: 13 }}>
                          <SelectValue placeholder="Select an ElevenLabs voice..." />
                        </SelectTrigger>
                        <SelectContent style={{ maxHeight: 200, overflowY: 'auto' }}>
                          {filteredELVoices.length === 0
                            ? <SelectItem value="none" disabled>No voices found</SelectItem>
                            : filteredELVoices.map(v => (
                              <SelectItem key={v.voice_id} value={v.voice_id}>
                                {v.name}{v.labels?.accent ? ` · ${v.labels.accent}` : ''}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>

                      {/* EL Voice Sample */}
                      {selectedELVoice?.preview_url && (
                        <div style={{ background: 'rgba(251,191,36,0.05)', borderRadius: 12, padding: '10px 12px', border: '1px solid rgba(251,191,36,0.12)' }}>
                          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 6 }}>Voice sample:</p>
                          <audio controls src={selectedELVoice.preview_url} />
                        </div>
                      )}

                      {/* Model */}
                      <div>
                        <label style={lbl}>Model</label>
                        <Select value={elModel} onValueChange={setElModel}>
                          <SelectTrigger style={{ fontSize: 13 }}><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="eleven_multilingual_v2">eleven_multilingual_v2 — Best quality</SelectItem>
                            <SelectItem value="eleven_v3">eleven_v3 — Latest</SelectItem>
                            <SelectItem value="eleven_turbo_v2_5">eleven_turbo_v2_5 — Fastest</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Stability & Similarity sliders */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                        <div>
                          <label style={lbl}>Stability: {elStability.toFixed(2)}</label>
                          <input
                            type="range" min="0" max="1" step="0.05"
                            value={elStability}
                            onChange={(e) => setElStability(parseFloat(e.target.value))}
                            style={{ width: '100%' }}
                          />
                        </div>
                        <div>
                          <label style={lbl}>Clarity: {elSimilarity.toFixed(2)}</label>
                          <input
                            type="range" min="0" max="1" step="0.05"
                            value={elSimilarity}
                            onChange={(e) => setElSimilarity(parseFloat(e.target.value))}
                            style={{ width: '100%' }}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* ── Avatar Engine Card ── */}
            <div style={{ ...card, padding: '26px' }}>
              <div style={{ ...cardTopAccent, background: 'linear-gradient(90deg,transparent,rgba(251,191,36,0.3),transparent)' }} />

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <div style={iconBox('251,191,36')}>
                  <Zap size={16} color="#fbbf24" />
                </div>
                <div>
                  <p style={sectionTitle}>Avatar Engine</p>
                  <p style={sectionSub}>Select rendering quality</p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {/* Avatar IV */}
                <button
                  className="cp-engine"
                  onClick={() => setAvatarEngine('avatar_iv')}
                  style={{
                    padding:       '13px 16px',
                    borderRadius:  14,
                    border:        `1px solid ${avatarEngine === 'avatar_iv' ? 'rgba(96,165,250,0.45)' : 'rgba(255,255,255,0.07)'}`,
                    background:    avatarEngine === 'avatar_iv' ? 'rgba(96,165,250,0.07)' : 'rgba(255,255,255,0.02)',
                    cursor:        'pointer',
                    textAlign:     'left',
                    transition:    'all 0.2s',
                    width:         '100%',
                    display:       'flex',
                    alignItems:    'center',
                    justifyContent:'space-between',
                  }}
                >
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', margin: '0 0 2px' }}>Avatar IV ⚡</p>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', margin: 0 }}>Expressive motion · Natural gestures</p>
                  </div>
                  {avatarEngine === 'avatar_iv' && (
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#60a5fa', flexShrink: 0, boxShadow: '0 0 8px #60a5fa' }} />
                  )}
                </button>

                {/* Avatar V */}
                <button
                  className="cp-engine"
                  onClick={() => setAvatarEngine('avatar_v')}
                  style={{
                    padding:       '13px 16px',
                    borderRadius:  14,
                    border:        `1px solid ${avatarEngine === 'avatar_v' ? 'rgba(251,191,36,0.5)' : 'rgba(255,255,255,0.07)'}`,
                    background:    avatarEngine === 'avatar_v' ? 'rgba(251,191,36,0.07)' : 'rgba(255,255,255,0.02)',
                    cursor:        'pointer',
                    textAlign:     'left',
                    transition:    'all 0.2s',
                    width:         '100%',
                    display:       'flex',
                    alignItems:    'center',
                    justifyContent:'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 2 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', margin: 0 }}>Avatar V</p>
                      <span style={{ fontSize: 9, fontWeight: 800, color: '#fbbf24', background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.25)', borderRadius: 50, padding: '1px 7px' }}>✨ NEW</span>
                    </div>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', margin: 0 }}>Identity consistent · Multi-angle · Long-form</p>
                  </div>
                  {avatarEngine === 'avatar_v' && (
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#fbbf24', flexShrink: 0, boxShadow: '0 0 8px #fbbf24' }} />
                  )}
                </button>

                {avatarEngine === 'avatar_v' && (
                  <div style={{ background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.15)', borderRadius: 12, padding: '10px 14px', marginTop: 4 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(251,191,36,0.85)', margin: '0 0 3px' }}>Using Avatar V engine (launched April 8, 2026)</p>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', margin: 0 }}>Make sure your avatar was created with Avatar V in HeyGen.</p>
                  </div>
                )}
              </div>
            </div>

            {/* ── Advanced Options Card ── */}
            <div style={{ ...card, overflow: 'hidden' }}>
              <div style={cardTopAccent} />
              <button
                className="cp-adv-toggle"
                onClick={() => setShowAdvanced(p => !p)}
              >
                <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.55)' }}>Advanced Options</span>
                {showAdvanced
                  ? <ChevronUp size={15} color="rgba(255,255,255,0.3)" />
                  : <ChevronDown size={15} color="rgba(255,255,255,0.3)" />}
              </button>

              {showAdvanced && (
                <div style={{ padding: '0 20px 20px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>

                  {/* Resolution */}
                  <div>
                    <label style={lbl}>Output Resolution</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {[
                        { value: '720p',  sub: '1280 × 720' },
                        { value: '1080p', sub: '1920 × 1080 · Recommended' },
                      ].map(r => (
                        <button
                          key={r.value}
                          className={`cp-res-btn ${resolution === r.value ? 'active' : ''}`}
                          onClick={() => setResolution(r.value)}
                        >
                          <p style={{ fontSize: 13, fontWeight: 700, color: resolution === r.value ? '#e0a039' : '#fff', margin: '0 0 2px' }}>{r.value}</p>
                          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', margin: 0 }}>{r.sub}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Auto Captions */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)', margin: 0 }}>Auto Captions</p>
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', margin: '2px 0 0' }}>Burn subtitles into the video</p>
                    </div>
                    <Toggle checked={enableCaptions} onChange={setEnableCaptions} />
                  </div>
                </div>
              )}
            </div>

            {/* ── Advanced Generate Card ── */}
            <div style={{ ...card, border: '1.5px solid rgba(224,160,57,0.25)', padding: '26px', boxShadow: '0 0 0 1px rgba(224,160,57,0.06), 0 24px 64px rgba(0,0,0,0.45), inset 0 1px 0 rgba(224,160,57,0.08)' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,transparent,rgba(224,160,57,0.55),transparent)', pointerEvents: 'none' }} />

              {/* Summary badges */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 18 }}>
                <span style={{ fontSize: 11, padding: '4px 11px', borderRadius: 50, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.55)' }}>
                  {voiceTab === 'elevenlabs' && selectedELVoice
                    ? `🎙 EL: ${selectedELVoice.name}`
                    : selectedHGVoice
                    ? `🔊 ${selectedHGVoice.name}`
                    : '🔊 HeyGen Default'}
                </span>
                {avatarEngine === 'avatar_v' && (
                  <span style={{ fontSize: 11, padding: '4px 11px', borderRadius: 50, background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', color: 'rgba(251,191,36,0.85)' }}>✨ Avatar V</span>
                )}
                {avatarEngine === 'avatar_iv' && (
                  <span style={{ fontSize: 11, padding: '4px 11px', borderRadius: 50, background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.2)', color: 'rgba(96,165,250,0.85)' }}>⚡ Avatar IV</span>
                )}
                <span style={{ fontSize: 11, padding: '4px 11px', borderRadius: 50, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.55)' }}>📐 {resolution}</span>
                {enableCaptions && (
                  <span style={{ fontSize: 11, padding: '4px 11px', borderRadius: 50, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.55)' }}>📝 Captions ON</span>
                )}
              </div>

              {/* Advanced Generate Button */}
              <button
                onClick={handleGenerateAdvanced}
                disabled={generatingAdvanced || !script || !title}
                className="cp-gbtn"
                style={{ ...goldBtn, padding: '15px 22px', fontSize: 14, fontWeight: 800, opacity: generatingAdvanced || !script || !title ? 0.45 : 1 }}
              >
                {generatingAdvanced
                  ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />Generating Advanced Video...</>
                  : <><VideoIcon size={15} />Generate with Advanced Settings (1 Credit)</>}
              </button>

              {/* OR divider */}
              <div style={{ position: 'relative', marginTop: 18 }}>
                <div style={{ height: 1, background: 'rgba(255,255,255,0.05)' }} />
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: '#05050e', padding: '0 10px' }}>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.18)' }}>or use standard generation above</span>
                </div>
              </div>
            </div>

          </div>{/* end right col */}
        </div>{/* end grid */}
      </div>
    </div>
  );
}