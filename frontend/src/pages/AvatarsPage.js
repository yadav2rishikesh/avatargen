import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { Check, ArrowRight, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AvatarsPage() {
  const [avatars,        setAvatars]        = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [hovered,        setHovered]        = useState(null);
  const navigate = useNavigate();

  useEffect(() => { fetchAvatars(); }, []);

  const fetchAvatars = async () => {
    try {
      const res = await axios.get(`${API_URL}/avatars`);
      setAvatars(res.data.avatars);
    } catch { toast.error('Failed to load avatars'); }
    finally  { setLoading(false); }
  };

  const handleNext = () => {
    if (!selectedAvatar) { toast.error('Please select an avatar'); return; }
    localStorage.setItem('selectedAvatarId', selectedAvatar.avatar_id);
    window.dispatchEvent(new Event('avatarSelected'));
    navigate('/dashboard/create', { state: { avatar: selectedAvatar } });
  };

  if (loading) {
    return (
      <div style={{ minHeight: 'calc(100vh - 65px)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#05050e' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid rgba(224,160,57,0.1)', borderTopColor: '#e0a039', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', fontWeight: 300, letterSpacing: '0.5px' }}>LOADING</p>
        </div>
        <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <div style={{ background: '#05050e', minHeight: 'calc(100vh - 65px)', fontFamily: '-apple-system,BlinkMacSystemFont,sans-serif', position: 'relative' }}>
      <style>{`
        @keyframes spin   { from{transform:rotate(0)} to{transform:rotate(360deg)} }
        @keyframes fadein { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer{ 0%,100%{opacity:0.5} 50%{opacity:1} }

        /* Avatar card */
        .av { cursor:pointer; border-radius:20px; overflow:hidden; position:relative; transition:transform 0.32s cubic-bezier(0.4,0,0.2,1); }
        .av:hover { transform: translateY(-8px) scale(1.02); }
        .av:hover .av-img { transform: scale(1.08); }
        .av-img { width:100%; height:100%; object-fit:cover; display:block; transition:transform 0.5s cubic-bezier(0.4,0,0.2,1); }

        /* Gold ring on selected */
        .av-sel { outline: 2px solid #e0a039; outline-offset: 4px; box-shadow: 0 0 0 1px rgba(224,160,57,0.1), 0 24px 64px rgba(0,0,0,0.7), 0 0 40px rgba(224,160,57,0.15) !important; }

        /* CTA button */
        .av-cta:hover { box-shadow: 0 16px 48px rgba(224,160,57,0.55) !important; transform: translateY(-2px) scale(1.02) !important; }
        .av-cta:active { transform: scale(0.97) !important; }
      `}</style>

      {/* ── Background ── */}
      <div style={{ position:'fixed', inset:0, background:'radial-gradient(ellipse 65% 45% at 50% 35%,rgba(224,160,57,0.06),transparent 70%)', pointerEvents:'none', zIndex:0 }} />
      <div style={{ position:'fixed', inset:0, backgroundImage:'linear-gradient(rgba(255,255,255,0.01) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.01) 1px,transparent 1px)', backgroundSize:'64px 64px', maskImage:'radial-gradient(ellipse 90% 90% at 50% 30%,black,transparent)', pointerEvents:'none', zIndex:0 }} />

      <div style={{ position:'relative', zIndex:1, padding:'32px 44px 40px' }} onClick={() => setSelectedAvatar(null)}>

        {/* ── Header ── */}
        <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.35 }}
          style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:36, flexWrap:'wrap', gap:12 }}>
          <div>
            <p style={{ fontSize:10, fontWeight:700, color:'rgba(224,160,57,0.6)', letterSpacing:'2.5px', textTransform:'uppercase', margin:'0 0 8px' }}>
              STEP 1 OF 3
            </p>
            <h1 style={{ fontSize:32, fontWeight:800, color:'#fff', letterSpacing:'-0.8px', margin:0, lineHeight:1 }}>
              Choose Your{' '}
              <span style={{ background:'linear-gradient(135deg,#f5d880,#e0a039,#c07818)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
                AI Host
              </span>
            </h1>
            <p style={{ fontSize:13, color:'rgba(255,255,255,0.22)', margin:'8px 0 0', fontWeight:300 }}>
              Select a presenter to create your video
            </p>
          </div>

          {/* Avatar count badge */}
          <div style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:50, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ width:6, height:6, borderRadius:'50%', background:'#e0a039', boxShadow:'0 0 8px #e0a039', animation:'shimmer 2s ease-in-out infinite' }} />
            <span style={{ fontSize:12, color:'rgba(255,255,255,0.4)', fontWeight:500 }}>
              {avatars.length} presenters available
            </span>
          </div>
        </motion.div>

        {/* ── Avatar Grid ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${Math.min(avatars.length, 5)}, 1fr)`,
          gap: 16,
          marginBottom: 32,
        }}>
          {avatars.map((avatar, i) => {
            const isSel  = selectedAvatar?.avatar_id === avatar.avatar_id;
            const isHov  = hovered === avatar.avatar_id;

            return (
              <motion.div
                key={avatar.avatar_id}
                initial={{ opacity:0, y:20 }}
                animate={{ opacity:1, y:0 }}
                transition={{ delay: i * 0.07, duration:0.4 }}
              >
                <div
                  data-testid={`avatar-card-${avatar.avatar_id}`}
                  className={`av${isSel ? ' av-sel' : ''}`}
                  onClick={(e) => { e.stopPropagation(); setSelectedAvatar(avatar); }}
                  onMouseEnter={() => setHovered(avatar.avatar_id)}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    background: '#0d0d1a',
                    boxShadow: isSel
                      ? '0 0 0 0 transparent'
                      : '0 4px 24px rgba(0,0,0,0.5)',
                    border: isSel
                      ? 'none'
                      : '1px solid rgba(255,255,255,0.07)',
                  }}
                >
                  {/* Image */}
                  <div style={{ aspectRatio:'2/3', position:'relative', overflow:'hidden' }}>
                    <img
                      className="av-img"
                      src={avatar.preview_image_url || avatar.image_url}
                      alt={avatar.display_name || avatar.avatar_name}
                    />

                    {/* Persistent bottom fade for name */}
                    <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top,rgba(0,0,0,0.88) 0%,rgba(0,0,0,0.3) 35%,transparent 60%)', pointerEvents:'none' }} />

                    {/* Hover shimmer */}
                    <AnimatePresence>
                      {isHov && !isSel && (
                        <motion.div
                          initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                          style={{ position:'absolute', inset:0, background:'linear-gradient(135deg,rgba(255,255,255,0.04),transparent 60%)', pointerEvents:'none' }}
                        />
                      )}
                    </AnimatePresence>

                    {/* Selected gold overlay */}
                    <AnimatePresence>
                      {isSel && (
                        <motion.div
                          initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                          style={{ position:'absolute', inset:0, background:'linear-gradient(to top,rgba(224,160,57,0.18),transparent 50%)', pointerEvents:'none' }}
                        />
                      )}
                    </AnimatePresence>

                    {/* Checkmark */}
                    <AnimatePresence>
                      {isSel && (
                        <motion.div
                          initial={{ scale:0.3, opacity:0 }}
                          animate={{ scale:1, opacity:1 }}
                          exit={{ scale:0.3, opacity:0 }}
                          transition={{ type:'spring', stiffness:400, damping:22 }}
                          style={{ position:'absolute', top:10, right:10, width:30, height:30, borderRadius:'50%', background:'linear-gradient(135deg,#e0a039,#c07818)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 16px rgba(224,160,57,0.6)', zIndex:3 }}
                        >
                          <Check size={15} color="#1a0e00" strokeWidth={3} />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Name overlay at bottom */}
                    <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'12px 14px', zIndex:2 }}>
                      <p style={{ fontSize:14, fontWeight:700, color: isSel ? '#f5d070' : '#fff', margin:'0 0 3px', letterSpacing:'-0.2px', transition:'color 0.2s', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', textShadow:'0 1px 8px rgba(0,0,0,0.8)' }}>
                        {avatar.display_name || avatar.avatar_name}
                      </p>
                      {isSel ? (
                        <div style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:9, fontWeight:800, color:'#1a0e00', background:'linear-gradient(135deg,#e0a039,#f5d070)', borderRadius:50, padding:'2px 8px', letterSpacing:'0.3px' }}>
                          <Check size={8} strokeWidth={3} />
                          SELECTED
                        </div>
                      ) : (
                        <p style={{ fontSize:10, color:'rgba(255,255,255,0.3)', margin:0, letterSpacing:'0.2px' }}>
                          {isHov ? 'Click to select' : (avatar.gender && avatar.gender !== 'unknown' ? avatar.gender : 'Presenter')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* ── Bottom bar ── */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', position:'fixed', bottom:24, left:0, right:0, zIndex:100, pointerEvents:'none' }}>
          <AnimatePresence mode="wait">
            {selectedAvatar ? (
              <motion.div
                key="selected"
                initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:6 }}
                transition={{ duration:0.22 }}
                style={{ display:'flex', alignItems:'center', gap:16, padding:'10px 12px', background:'rgba(255,255,255,0.04)', pointerEvents:'auto', backdropFilter:'blur(24px)', border:'1px solid rgba(224,160,57,0.2)', borderRadius:50, boxShadow:'0 8px 40px rgba(0,0,0,0.5)' }}
              >
                {/* Avatar thumb */}
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <img
                    src={selectedAvatar.preview_image_url || selectedAvatar.image_url}
                    alt=""
                    style={{ width:36, height:36, borderRadius:'50%', objectFit:'cover', border:'2px solid rgba(224,160,57,0.5)', flexShrink:0 }}
                  />
                  <div>
                    <p style={{ fontSize:9, color:'rgba(224,160,57,0.55)', margin:0, fontWeight:800, letterSpacing:'0.7px' }}>SELECTED HOST</p>
                    <p style={{ fontSize:14, color:'#fff', margin:0, fontWeight:700, letterSpacing:'-0.2px' }}>
                      {selectedAvatar.display_name || selectedAvatar.avatar_name}
                    </p>
                  </div>
                </div>

                {/* Divider */}
                <div style={{ width:1, height:32, background:'rgba(255,255,255,0.08)' }} />

                {/* CTA */}
                <button
                  data-testid="next-step-button"
                  className="av-cta"
                  onClick={handleNext}
                  style={{ display:'flex', alignItems:'center', gap:8, padding:'12px 28px', background:'linear-gradient(135deg,#c07818,#f5d070,#c07818)', backgroundSize:'200% 100%', color:'#1a0e00', border:'none', borderRadius:50, fontSize:14, fontWeight:800, cursor:'pointer', boxShadow:'0 4px 22px rgba(224,160,57,0.35)', transition:'all 0.3s cubic-bezier(0.4,0,0.2,1)', fontFamily:'inherit', letterSpacing:'-0.1px' }}
                >
                  <Sparkles size={14} />
                  Continue to Create
                  <ArrowRight size={14} />
                </button>
              </motion.div>
            ) : (
              <motion.p
                key="hint"
                initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                style={{ fontSize:12, color:'rgba(255,255,255,0.1)', margin:0, letterSpacing:'0.4px', textAlign:'center', pointerEvents:'auto' }}
              >
                Click any avatar above to select your host
              </motion.p>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}