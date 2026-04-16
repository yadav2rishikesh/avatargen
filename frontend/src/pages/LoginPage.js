import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const PROMPTS = [
  'जियो फाइनेंस के फायदे बताएं...',
  'Create a 30 sec promo for Jio Finance...',
  'Ek professional Hindi avatar video banao...',
  'Generate a script about mutual funds...',
  'जियो के नए ऑफर की जानकारी दें...',
  'Make a corporate video in Hindi...',
];

/* ── Typewriter ── */
function TypewriterPrompt() {
  const [text, setText] = useState('');
  const state = useRef({ pi: 0, ci: 0, del: false });
  const timer = useRef(null);

  useEffect(() => {
    function tick() {
      const { pi, ci, del } = state.current;
      const cur = PROMPTS[pi];
      if (!del) {
        setText(cur.slice(0, ci + 1));
        if (ci + 1 === cur.length) {
          state.current.ci = ci + 1;
          timer.current = setTimeout(() => { state.current.del = true; tick(); }, 2400);
        } else {
          state.current.ci = ci + 1;
          timer.current = setTimeout(tick, 48 + Math.random() * 28);
        }
      } else {
        setText(cur.slice(0, ci - 1));
        if (ci - 1 === 0) {
          state.current = { pi: (pi + 1) % PROMPTS.length, ci: 0, del: false };
          timer.current = setTimeout(tick, 500);
        } else {
          state.current.ci = ci - 1;
          timer.current = setTimeout(tick, 24);
        }
      }
    }
    timer.current = setTimeout(tick, 1000);
    return () => clearTimeout(timer.current);
  }, []);

  return (
    <div style={{ background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(224,160,57,0.22)', borderRadius: 18, padding: '16px 60px 16px 18px', position: 'relative', marginBottom: 16, backdropFilter: 'blur(20px)', boxShadow: '0 4px 32px rgba(0,0,0,0.35),0 0 0 1px rgba(224,160,57,0.04)' }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(224,160,57,0.55)', letterSpacing: '1.2px', textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 4, height: 4, background: '#e0a039', borderRadius: '50%', opacity: 0.7 }} />
        Try a prompt
      </div>
      <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.78)', minHeight: 22, fontWeight: 300, letterSpacing: '0.1px', display: 'flex', alignItems: 'center' }}>
        <span>{text}</span>
        <span style={{ display: 'inline-block', width: 2, height: 17, background: '#e0a039', borderRadius: 2, marginLeft: 2, animation: 'cblink 0.75s ease-in-out infinite', flexShrink: 0 }} />
      </div>
      <button style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg,#d48f18,#f5c842)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: 'none', boxShadow: '0 4px 14px rgba(224,160,57,0.28)', transition: 'all 0.2s' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="#1a0e00" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
    </div>
  );
}

/* ── Jio Logo SVG ── */
function JioLogo({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" style={{ position: 'relative', zIndex: 1 }}>
      <ellipse cx="50" cy="29" rx="15" ry="18" fill="white" />
      <path d="M13 74 Q13 53 50 53 Q87 53 87 74 L87 82 Q87 90 50 90 Q13 90 13 82 Z" fill="white" />
    </svg>
  );
}

export default function LoginPage() {
  const [tab, setTab] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMsg, setForgotMsg] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (tab === 'signup' && password !== confirm) { setError('Passwords do not match'); return; }
    setLoading(true);
    try {
      localStorage.removeItem('selectedAvatarId');
      if (tab === 'signin') {
        await login(email, password);
        toast.success('Welcome back!');
      } else {
        await signup(email, password);
        toast.success('Account created!');
      }
      navigate('/dashboard/avatars');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail.trim()) { setForgotMsg('error:Please enter your email'); return; }
    setForgotLoading(true);
    setForgotMsg('');
    try {
      await axios.post(`${API_URL}/auth/forgot-password`, { email: forgotEmail });
      setForgotMsg('success:Reset link sent! Check your email inbox.');
    } catch (err) {
      setForgotMsg('error:' + (err.response?.data?.detail || 'Email not found'));
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div style={{ width: '100%', minHeight: '100vh', background: '#05050e', fontFamily: "-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif", position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

      <style>{`
        @keyframes cblink{0%,100%{opacity:1}50%{opacity:0}}
        @keyframes apulse{0%,100%{opacity:0.5;transform:scale(0.88)}50%{opacity:1;transform:scale(1.12)}}
        @keyframes aspin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
        @keyframes afloat{0%,100%{transform:translateY(0)}40%{transform:translateY(-8px)}70%{transform:translateY(-5px)}}
        @keyframes afloat-s{0%,100%{transform:translateX(-50%) scaleX(1);opacity:0.8}40%{transform:translateX(-50%) scaleX(0.82);opacity:0.45}70%{transform:translateX(-50%) scaleX(0.88);opacity:0.55}}
        @keyframes asheen{0%,100%{opacity:0.7}50%{opacity:1}}
        @keyframes bpulse{0%,100%{opacity:1}50%{opacity:0.3}}
        @keyframes cfadein{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        .jlr1{position:absolute;inset:-20px;border-radius:50%;border:1px solid rgba(224,160,57,0.18);animation:aspin 14s linear infinite}
        .jlr2{position:absolute;inset:-36px;border-radius:50%;border:1px dashed rgba(224,160,57,0.08);animation:aspin 22s linear infinite reverse}
        .jlr3{position:absolute;inset:-52px;border-radius:50%;border:1px solid rgba(224,160,57,0.04);animation:aspin 32s linear infinite}
        .jlbox{position:absolute;inset:0;border-radius:40px;background:linear-gradient(145deg,#f0c038 0%,#d48f18 50%,#b87010 100%);box-shadow:0 24px 64px rgba(224,160,57,0.45),0 8px 24px rgba(224,160,57,0.25),inset 0 2px 0 rgba(255,255,255,0.28),inset 0 -2px 0 rgba(0,0,0,0.12);display:flex;align-items:center;justify-content:center;animation:afloat 7s ease-in-out infinite}
        .jlsheen{position:absolute;inset:0;border-radius:40px;background:linear-gradient(130deg,rgba(255,255,255,0.22) 0%,rgba(255,255,255,0.06) 40%,transparent 60%);animation:asheen 4s ease-in-out infinite}
        .jnl{font-size:13px;color:rgba(255,255,255,0.3);cursor:pointer;font-weight:400;letter-spacing:0.1px;transition:color 0.2s}
        .jnl:hover{color:rgba(255,255,255,0.65)}
        .jnl.on{color:rgba(255,255,255,0.7);font-weight:500}
        .jnpill{padding:7px 20px;border-radius:50px;background:rgba(224,160,57,0.09);border:1px solid rgba(224,160,57,0.18);font-size:12px;font-weight:600;color:rgba(224,160,57,0.85);cursor:pointer;letter-spacing:0.2px;transition:all 0.2s}
        .jnpill:hover{background:rgba(224,160,57,0.16);border-color:rgba(224,160,57,0.3)}
        .jchip{padding:7px 13px;border-radius:50px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);font-size:12px;color:rgba(255,255,255,0.38);cursor:pointer;transition:all 0.2s;display:flex;align-items:center;gap:7px;animation:cfadein 0.5s ease both}
        .jchip:hover{background:rgba(224,160,57,0.08);border-color:rgba(224,160,57,0.2);color:rgba(255,255,255,0.65)}
        .jtab{flex:1;padding:10px;border-radius:50px;font-size:13px;font-weight:600;text-align:center;cursor:pointer;transition:all 0.22s;letter-spacing:0.1px;border:none;font-family:inherit}
        .jtab.on{background:rgba(255,255,255,0.085);color:#fff;border:1px solid rgba(255,255,255,0.085)}
        .jtab.off{background:transparent;color:rgba(255,255,255,0.2)}
        .jinp{width:100%;padding:14px 14px 14px 42px;background:rgba(255,255,255,0.038);border:1px solid rgba(255,255,255,0.055);border-radius:14px;font-size:14px;color:#fff;outline:none;font-family:inherit;transition:all 0.22s;letter-spacing:0.1px}
        .jinp::placeholder{color:rgba(255,255,255,0.12)}
        .jinp:focus{background:rgba(255,255,255,0.07);border-color:rgba(224,160,57,0.38);box-shadow:0 0 0 3px rgba(224,160,57,0.08)}
        .jbtn{width:100%;padding:15px;background:linear-gradient(135deg,#c07818,#f5d070,#c07818);background-size:200% 100%;color:#1a0e00;border:none;border-radius:50px;font-size:15px;font-weight:800;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:8px;box-shadow:0 4px 24px rgba(224,160,57,0.22),inset 0 1px 0 rgba(255,255,255,0.12);transition:all 0.3s cubic-bezier(0.4,0,0.2,1);letter-spacing:-0.2px}
        .jbtn:hover:not(:disabled){background-position:100% 0;box-shadow:0 8px 36px rgba(224,160,57,0.38);transform:translateY(-1px)}
        .jbtn:active:not(:disabled){transform:scale(0.98)}
        .jbtn:disabled{opacity:0.6;cursor:not-allowed}
        .jflink{font-size:11px;color:rgba(255,255,255,0.12);cursor:pointer;transition:color 0.2s}
        .jflink:hover{color:rgba(255,255,255,0.35)}
        .card-border::before{content:'';position:absolute;inset:0;border-radius:30px;background:linear-gradient(135deg,rgba(224,160,57,0.12) 0%,transparent 35%,rgba(224,160,57,0.03) 100%);mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);mask-composite:exclude;-webkit-mask-composite:xor;padding:1px;pointer-events:none}
        @media(max-width:900px){.jmain{flex-direction:column!important;gap:40px!important;padding:24px 20px!important}.jleft{max-width:100%!important}.jcard{width:100%!important;max-width:480px!important;margin:0 auto!important}}
      `}</style>

      {/* BG blobs */}
      <div style={{ position: 'absolute', width: 900, height: 500, background: 'radial-gradient(ellipse,rgba(224,160,57,0.11) 0%,transparent 65%)', top: -150, left: -200, filter: 'blur(60px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', width: 700, height: 700, background: 'radial-gradient(ellipse,rgba(59,91,219,0.06) 0%,transparent 65%)', bottom: -200, right: -100, filter: 'blur(80px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', width: 600, height: 300, background: 'radial-gradient(ellipse,rgba(224,160,57,0.07) 0%,transparent 65%)', top: '45%', left: '50%', transform: 'translate(-50%,-50%)', filter: 'blur(50px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.014) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.014) 1px,transparent 1px)', backgroundSize: '80px 80px', maskImage: 'radial-gradient(ellipse 85% 85% at 50% 40%,black 20%,transparent 90%)', pointerEvents: 'none' }} />

      {/* NAV */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 56px', background: 'rgba(5,5,14,0.8)', backdropFilter: 'blur(32px)', borderBottom: '1px solid rgba(255,255,255,0.035)', position: 'relative', zIndex: 10, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(145deg,#f5c842,#d48f18)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(224,160,57,0.28),inset 0 1px 0 rgba(255,255,255,0.22)', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
            <JioLogo size={20} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,rgba(255,255,255,0.18),transparent 55%)', borderRadius: 10 }} />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', letterSpacing: '-0.4px' }}>Jio Finance</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.22)', letterSpacing: '0.2px' }}>Avatars Studio</div>
          </div>
        </div>

      </nav>

      {/* MAIN */}
      <div className="jmain" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '36px 56px', gap: 80, position: 'relative', zIndex: 1 }}>

        {/* LEFT */}
        <div className="jleft" style={{ flex: 1, maxWidth: 500 }}>

          {/* AI Powered badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 14px 5px 7px', borderRadius: 50, background: 'rgba(224,160,57,0.07)', border: '1px solid rgba(224,160,57,0.14)', marginBottom: 20 }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(224,160,57,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 6, height: 6, background: '#e0a039', borderRadius: '50%', boxShadow: '0 0 8px #e0a039', animation: 'bpulse 2s ease-in-out infinite' }} />
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(224,160,57,0.82)', letterSpacing: '0.3px' }}>AI Powered · Now Live</span>
          </div>

          {/* Animated Logo */}
          <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 180, height: 180, marginBottom: 32 }}>
            <div style={{ position: 'absolute', inset: -44, background: 'radial-gradient(circle,rgba(224,160,57,0.2),transparent 60%)', borderRadius: '50%', filter: 'blur(20px)', animation: 'apulse 5s ease-in-out infinite' }} />
            <div className="jlr3" />
            <div className="jlr2" />
            <div className="jlr1">
              <div style={{ position: 'absolute', width: 8, height: 8, background: '#e0a039', borderRadius: '50%', top: -4, left: '50%', transform: 'translateX(-50%)', boxShadow: '0 0 12px #e0a039,0 0 24px rgba(224,160,57,0.5)' }} />
              <div style={{ position: 'absolute', width: 5, height: 5, background: 'rgba(224,160,57,0.55)', borderRadius: '50%', bottom: '5%', right: '12%', boxShadow: '0 0 8px rgba(224,160,57,0.6)' }} />
            </div>
            <div className="jlbox">
              <div className="jlsheen" />
              <JioLogo size={96} />
            </div>
            <div style={{ position: 'absolute', bottom: -14, left: '50%', transform: 'translateX(-50%)', width: 110, height: 10, background: 'radial-gradient(ellipse,rgba(224,160,57,0.38),transparent 70%)', filter: 'blur(5px)', animation: 'afloat-s 7s ease-in-out infinite' }} />
          </div>

          {/* Headline */}
          <div style={{ fontSize: 52, fontWeight: 800, color: '#fff', lineHeight: 1.04, letterSpacing: '-2.5px', marginBottom: 14 }}>
            Create Videos<br />
            with <span style={{ fontStyle: 'normal', background: 'linear-gradient(135deg,#f5d880 0%,#e0a039 45%,#c07818 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>AI Avatars</span>
          </div>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.32)', lineHeight: 1.85, marginBottom: 28, fontWeight: 300, maxWidth: 400, letterSpacing: '0.1px' }}>
            Generate professional presenter videos in minutes. No camera. No studio. Just your script.
          </p>

          {/* Typewriter Prompt Bar */}
          <TypewriterPrompt />

          {/* Chips */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['Jio Finance benefits', 'Hindi promo 30 sec', 'Product launch video', 'Devanagari script'].map((c, i) => (
              <div key={c} className="jchip" style={{ animationDelay: `${(i + 1) * 0.1}s` }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(224,160,57,0.5)', flexShrink: 0 }} />
                {c}
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT CARD */}
        <div className="jcard card-border" style={{ width: 396, flexShrink: 0, background: 'rgba(255,255,255,0.038)', backdropFilter: 'blur(64px) saturate(180%)', WebkitBackdropFilter: 'blur(64px) saturate(180%)', borderRadius: 30, padding: 40, border: '1px solid rgba(255,255,255,0.065)', boxShadow: '0 0 0 1px rgba(255,255,255,0.018),0 40px 80px rgba(0,0,0,0.7),0 12px 32px rgba(0,0,0,0.4),inset 0 1px 0 rgba(255,255,255,0.08)', position: 'relative' }}>

          {/* Card logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <div style={{ width: 40, height: 40, borderRadius: 11, background: 'linear-gradient(145deg,#f0c038,#d48f18,#b87010)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(224,160,57,0.25),inset 0 1px 0 rgba(255,255,255,0.22)', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
              <JioLogo size={22} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,rgba(255,255,255,0.18),transparent 55%)', borderRadius: 11 }} />
            </div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 700, color: '#fff', letterSpacing: '-0.4px' }}>Jio Finance</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.24)', marginTop: 2 }}>Avatars Studio</div>
            </div>
          </div>

          <div style={{ height: 1, background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.055),transparent)', margin: '20px 0' }} />

          {/* Tabs */}
          <div style={{ display: 'flex', background: 'rgba(0,0,0,0.22)', borderRadius: 50, padding: 3, marginBottom: 26, border: '1px solid rgba(255,255,255,0.045)' }}>
            {['signin', 'signup'].map(t => (
              <button key={t} className={`jtab ${tab === t ? 'on' : 'off'}`}
                onClick={() => { setTab(t); setError(''); setShowForgot(false); setForgotMsg(''); }}>
                {t === 'signin' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          {/* Heading */}
          <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '-0.5px', marginBottom: 4 }}>
            {tab === 'signin' ? 'Welcome back' : 'Create account'}
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.26)', marginBottom: 26, fontWeight: 300 }}>
            {tab === 'signin' ? 'Sign in to start creating videos' : 'Join to start creating videos'}
          </div>

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.28)', marginBottom: 7, letterSpacing: '1px', textTransform: 'uppercase' }}>Email</div>
            <div style={{ position: 'relative', marginBottom: 14 }}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="2" y="4" width="20" height="16" rx="3" stroke="rgba(255,255,255,0.18)" strokeWidth="2" /><path d="M2 8l10 6 10-6" stroke="rgba(255,255,255,0.18)" strokeWidth="2" /></svg>
              </span>
              <input className="jinp" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
            </div>

            {/* Password */}
            <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.28)', marginBottom: 7, letterSpacing: '1px', textTransform: 'uppercase' }}>Password</div>
            <div style={{ position: 'relative', marginBottom: 14 }}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><rect x="5" y="11" width="14" height="10" rx="2" stroke="rgba(255,255,255,0.18)" strokeWidth="2" /><path d="M8 11V7a4 4 0 1 1 8 0v4" stroke="rgba(255,255,255,0.18)" strokeWidth="2" /></svg>
              </span>
              <input className="jinp" type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required style={{ paddingRight: 42 }} />
              <span onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', opacity: 0.25 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="white" strokeWidth="2" /><circle cx="12" cy="12" r="3" stroke="white" strokeWidth="2" /></svg>
              </span>
            </div>

            {/* Confirm Password (signup) */}
            {tab === 'signup' && (
              <>
                <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.28)', marginBottom: 7, letterSpacing: '1px', textTransform: 'uppercase' }}>Confirm Password</div>
                <div style={{ position: 'relative', marginBottom: 14 }}>
                  <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><rect x="5" y="11" width="14" height="10" rx="2" stroke="rgba(255,255,255,0.18)" strokeWidth="2" /><path d="M8 11V7a4 4 0 1 1 8 0v4" stroke="rgba(255,255,255,0.18)" strokeWidth="2" /></svg>
                  </span>
                  <input className="jinp" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="••••••••" required />
                </div>
              </>
            )}

            {/* Forgot Password link */}
            {tab === 'signin' && (
              <div style={{ textAlign: 'right', margin: '-5px 0 22px', fontSize: 12, color: 'rgba(224,160,57,0.65)', fontWeight: 500, cursor: 'pointer' }}
                onClick={() => { setShowForgot(!showForgot); setForgotMsg(''); setForgotEmail(''); }}>
                Forgot Password?
              </div>
            )}

            {/* Forgot Password panel */}
            {showForgot && tab === 'signin' && (
              <div style={{ background: 'rgba(224,160,57,0.05)', border: '1px solid rgba(224,160,57,0.14)', borderRadius: 16, padding: 16, marginBottom: 16 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.55)', marginBottom: 10 }}>Reset your password</p>
                <input type="email" placeholder="Enter your email address" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)}
                  style={{ width: '100%', padding: '11px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, fontSize: 13, color: '#fff', outline: 'none', fontFamily: 'inherit', marginBottom: 10, boxSizing: 'border-box' }} />
                <button type="button" onClick={handleForgotPassword} disabled={forgotLoading}
                  style={{ width: '100%', padding: 11, background: 'rgba(224,160,57,0.15)', border: '1px solid rgba(224,160,57,0.25)', borderRadius: 12, fontSize: 13, fontWeight: 600, color: 'rgba(224,160,57,0.9)', cursor: 'pointer', fontFamily: 'inherit', opacity: forgotLoading ? 0.6 : 1 }}>
                  {forgotLoading ? 'Sending...' : 'Send Reset Email'}
                </button>
                {forgotMsg && (
                  <p style={{ fontSize: 12, marginTop: 8, color: forgotMsg.startsWith('success:') ? '#86efac' : '#fca5a5' }}>
                    {forgotMsg.replace('success:', '').replace('error:', '')}
                  </p>
                )}
              </div>
            )}

            {/* Error */}
            {error && (
              <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: 12, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#fca5a5' }}>
                {error}
              </div>
            )}

            {/* Submit */}
            <button type="submit" disabled={loading} className="jbtn">
              {loading ? 'Please wait...' : (tab === 'signin' ? 'Sign In' : 'Create Account')}
              {!loading && (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="#1a0e00" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              )}
            </button>
          </form>

          {/* Switch tab link */}
          <div style={{ textAlign: 'center', marginTop: 18, fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>
            {tab === 'signin' ? "Don't have an account? " : 'Already have an account? '}
            <span onClick={() => { setTab(tab === 'signin' ? 'signup' : 'signin'); setError(''); setShowForgot(false); }}
              style={{ color: 'rgba(224,160,57,0.68)', fontWeight: 600, cursor: 'pointer' }}>
              {tab === 'signin' ? 'Sign up' : 'Sign in'}
            </span>
          </div>

          {/* Powered by */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 22, paddingTop: 18, borderTop: '1px solid rgba(255,255,255,0.038)' }}>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.13)', textTransform: 'uppercase', letterSpacing: '1px' }}>Powered by</span>
            <div style={{ width: 3, height: 3, background: 'rgba(224,160,57,0.22)', borderRadius: '50%' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(224,160,57,0.38)' }}>EiPi Media</span>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div style={{ padding: '14px 56px', borderTop: '1px solid rgba(255,255,255,0.028)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1, flexWrap: 'wrap', gap: 8 }}>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.1)' }}>© 2026 Jio Finance · EiPi Media Pvt. Ltd.</span>
        <div style={{ display: 'flex', gap: 24 }}>
          {['Privacy', 'Terms', 'Support'].map(l => (
            <span key={l} className="jflink">{l}</span>
          ))}
        </div>
      </div>
    </div>
  );
}