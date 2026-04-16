import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Video, Calendar, RefreshCw, Mail, CheckCircle, AlertCircle, Sparkles, Mic } from 'lucide-react';
import axios from 'axios';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function CreditsPage() {
  const { user } = useAuth();
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_URL}/usage`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUsage(res.data);
      } catch (err) {
        console.error('Failed to fetch usage:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsage();
  }, []);

  const used = usage?.used || 0;
  const limit = usage?.limit || 30;
  const remaining = usage?.remaining || 30;
  const percent = Math.round((used / limit) * 100);
  const month = usage?.month || '';
  const nextReset = usage?.next_reset || '';

  const barColor = percent >= 90 ? '#fca5a5' : percent >= 70 ? '#fcd34d' : '#e0a039';

  return (
    <div style={{ minHeight: 'calc(100vh - 65px)', background: '#05050e', padding: '40px 48px', fontFamily: '-apple-system,BlinkMacSystemFont,sans-serif' }}>
      <style>{`
        .cu-row { display: flex; align-items: center; justify-content: space-between; padding: 13px 0; border-bottom: 1px solid rgba(255,255,255,0.055); }
        .cu-row:last-child { border-bottom: none; }
        .cu-row-label { font-size: 13px; color: rgba(255,255,255,0.45); }
        .cu-row-value { font-size: 13px; font-weight: 600; color: #fff; }
        .cu-row-value.gold { color: #e0a039; }
        .cu-row-value.green { color: #4ade80; }
        .cu-card { background: rgba(255,255,255,0.038); border: 1px solid rgba(255,255,255,0.07); border-radius: 20px; padding: 28px; backdrop-filter: blur(24px); }
        .cu-mail-btn:hover { background: linear-gradient(135deg,#b06a10,#e8c030) !important; box-shadow: 0 8px 28px rgba(224,160,57,0.4) !important; transform: translateY(-1px) !important; }
      `}</style>

      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{ width: 4, height: 32, background: 'linear-gradient(180deg,#e0a039,#c07818)', borderRadius: 2 }} />
            <h1 style={{ fontSize: 38, fontWeight: 800, color: '#fff', letterSpacing: '-1px', margin: 0 }}>Usage</h1>
          </div>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.38)', fontWeight: 300, marginLeft: 14 }}>
            Company monthly video pool — shared across all users
          </p>
        </div>

        {/* Main Usage Card */}
        <div style={{ background: 'linear-gradient(135deg,rgba(224,160,57,0.12) 0%,rgba(180,110,10,0.06) 100%)', border: '1.5px solid rgba(224,160,57,0.35)', borderRadius: 24, padding: '36px 40px', marginBottom: 24, boxShadow: '0 0 60px rgba(224,160,57,0.08), 0 20px 60px rgba(0,0,0,0.5)', position: 'relative', overflow: 'hidden' }}>

          {/* Glow blob */}
          <div style={{ position: 'absolute', width: 300, height: 300, background: 'radial-gradient(circle,rgba(224,160,57,0.12),transparent 70%)', top: -100, right: -60, pointerEvents: 'none', borderRadius: '50%' }} />

          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'rgba(255,255,255,0.5)' }}>
              <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} />
              <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
              Loading usage...
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(224,160,57,0.65)', letterSpacing: '1.2px', textTransform: 'uppercase', marginBottom: 8 }}>
                    {month} Usage
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6 }}>
                    <span style={{ fontSize: 72, fontWeight: 800, color: '#e0a039', lineHeight: 1, letterSpacing: '-3px' }}>{used}</span>
                    <span style={{ fontSize: 24, color: 'rgba(255,255,255,0.35)', fontWeight: 300 }}>/ {limit} videos</span>
                  </div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>{remaining} videos remaining this month</div>
                </div>

                <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(224,160,57,0.12)', border: '1.5px solid rgba(224,160,57,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Video size={30} color="#e0a039" />
                </div>
              </div>

              {/* Progress Bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'rgba(255,255,255,0.38)', marginBottom: 8 }}>
                  <span>{percent}% used</span>
                  <span>{remaining} left</span>
                </div>
                <div style={{ height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 50, overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(percent, 100)}%`, height: '100%', background: `linear-gradient(90deg,${barColor},${barColor}cc)`, borderRadius: 50, transition: 'width 0.6s ease', boxShadow: `0 0 12px ${barColor}66` }} />
                </div>
              </div>

              {percent >= 90 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16, background: 'rgba(252,165,165,0.08)', border: '1px solid rgba(252,165,165,0.2)', borderRadius: 12, padding: '10px 14px' }}>
                  <AlertCircle size={15} color="#fca5a5" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: '#fca5a5' }}>Almost at your monthly limit! Contact admin if you need more.</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Two cards row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>

          {/* Monthly Reset */}
          <div className="cu-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(224,160,57,0.1)', border: '1px solid rgba(224,160,57,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Calendar size={16} color="#e0a039" />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Monthly Reset</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>When your limit refreshes</div>
              </div>
            </div>
            <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '16px 0' }} />
            <div className="cu-row">
              <span className="cu-row-label">Current Month</span>
              <span className="cu-row-value gold">{month}</span>
            </div>
            <div className="cu-row">
              <span className="cu-row-label">Next Reset</span>
              <span className="cu-row-value">{nextReset}</span>
            </div>
            <div className="cu-row">
              <span className="cu-row-label">Monthly Limit</span>
              <span className="cu-row-value">{limit} videos</span>
            </div>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', marginTop: 12 }}>Resets automatically on the 1st of every month.</p>
          </div>

          {/* What's Included */}
          <div className="cu-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle size={16} color="#4ade80" />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>What's Included</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>Features available to you</div>
              </div>
            </div>
            <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '16px 0' }} />
            <div className="cu-row">
              <span className="cu-row-label">Video Generation</span>
              <span className="cu-row-value">1 per attempt</span>
            </div>
            <div className="cu-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={12} color="rgba(224,160,57,0.5)" />
                <span className="cu-row-label">AI Script</span>
              </div>
              <span className="cu-row-value green">Unlimited</span>
            </div>
            <div className="cu-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Mic size={12} color="rgba(224,160,57,0.5)" />
                <span className="cu-row-label">Voice Preview</span>
              </div>
              <span className="cu-row-value green">Unlimited</span>
            </div>
            <div className="cu-row">
              <span className="cu-row-label">Failed Videos</span>
              <span className="cu-row-value green">Don't count</span>
            </div>
          </div>
        </div>

        {/* Contact Admin */}
        <div style={{ background: 'rgba(224,160,57,0.05)', border: '1px solid rgba(224,160,57,0.15)', borderRadius: 20, padding: '24px 28px', display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg,#e0a039,#c07818)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 16px rgba(224,160,57,0.3)' }}>
            <Mail size={20} color="#1a0e00" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Need More Videos?</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.38)', marginBottom: 14 }}>Contact your administrator to request a limit increase.</div>
            <button
              className="cu-mail-btn"
              onClick={() => window.location.href = 'mailto:eipimediaai@gmail.com'}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: 'linear-gradient(135deg,#c07818,#f5d070,#c07818)', backgroundSize: '200% 100%', color: '#1a0e00', border: 'none', borderRadius: 50, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.25s', boxShadow: '0 4px 16px rgba(224,160,57,0.25)' }}
            >
              <Mail size={14} />
              Contact Admin
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}