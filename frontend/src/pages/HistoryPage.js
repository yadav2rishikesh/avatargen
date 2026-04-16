import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { toast } from 'sonner';
import { Folder, FolderPlus, Play, Download, Loader2, Clock, CheckCircle, XCircle, Search, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;


function ProgressBar({ videoId, createdAt }) {
  const [pct, setPct] = React.useState(5);
  React.useEffect(() => {
    const start = createdAt ? new Date(createdAt).getTime() : Date.now();
    const tick = () => {
      const elapsed = (Date.now() - start) / 1000;
      // Simulate: reaches ~87% in 180s
      const p = Math.min(87, Math.round(5 + (elapsed / 180) * 82));
      setPct(p);
    };
    tick();
    const interval = setInterval(tick, 3000);
    return () => clearInterval(interval);
  }, [videoId, createdAt]);
  return (
    <div style={{ marginBottom:10 }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
        <span style={{ fontSize:10, fontWeight:700, color:'rgba(96,165,250,0.8)', letterSpacing:'0.5px' }}>PROCESSING</span>
        <span style={{ fontSize:11, fontWeight:700, color:'#60a5fa' }}>{pct}% Ready</span>
      </div>
      <div style={{ height:3, background:'rgba(96,165,250,0.08)', borderRadius:50, overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${pct}%`, borderRadius:50, background:'linear-gradient(90deg,#3b82f6,#60a5fa,#93c5fd)', boxShadow:'0 0 6px rgba(96,165,250,0.5)', transition:'width 1s ease' }} />
      </div>
    </div>
  );
}

export default function HistoryPage() {
  const [videos,            setVideos]            = useState([]);
  const [folders,           setFolders]           = useState([]);
  const [loading,           setLoading]           = useState(true);
  const [selectedVideo,     setSelectedVideo]     = useState(null);
  const [showCreateFolder,  setShowCreateFolder]  = useState(false);
  const [newFolderName,     setNewFolderName]     = useState('');
  const [selectedFolder,    setSelectedFolder]    = useState(null);
  const [searchTerm,        setSearchTerm]        = useState('');
  const [statusFilter,      setStatusFilter]      = useState('all');

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const [videosRes, foldersRes] = await Promise.all([
        axios.get(`${API_URL}/videos`),
        axios.get(`${API_URL}/folders`),
      ]);
      setVideos(videosRes.data);
      setFolders(foldersRes.data);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) { toast.error('Please enter a folder name'); return; }
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/folders`,
        { name: newFolderName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setFolders([response.data, ...folders]);
      setNewFolderName('');
      setShowCreateFolder(false);
      toast.success('Folder created!');
    } catch (error) {
      toast.error('Failed to create folder');
    }
  };

  const filteredVideos = videos
    .filter(v => selectedFolder ? v.folder_id === selectedFolder : true)
    .filter(v => statusFilter === 'all' ? true : v.status === statusFilter)
    .filter(v => searchTerm === '' ? true :
      v.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.avatar_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.script?.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const counts = {
    all:        videos.length,
    completed:  videos.filter(v => v.status === 'completed').length,
    generating: videos.filter(v => v.status === 'generating').length,
    failed:     videos.filter(v => v.status === 'failed').length,
  };

  const getStatusConfig = (status) => ({
    completed:  { label: 'Done',       bg: 'rgba(34,197,94,0.12)',  border: 'rgba(34,197,94,0.3)',  color: '#4ade80' },
    failed:     { label: 'Failed',     bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.3)',  color: '#f87171' },
    generating: { label: 'Processing', bg: 'rgba(96,165,250,0.12)', border: 'rgba(96,165,250,0.3)', color: '#60a5fa' },
    queued:     { label: 'Queued',     bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.3)', color: '#fbbf24' },
  }[status] || { label: status, bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' });

  const getStatusIcon = (status) => {
    const size = 16;
    switch (status) {
      case 'completed':  return <CheckCircle size={size} color="#4ade80" />;
      case 'failed':     return <XCircle     size={size} color="#f87171" />;
      case 'generating': return <Loader2     size={size} color="#60a5fa" style={{ animation: 'hp-spin 1s linear infinite' }} />;
      default:           return <Clock       size={size} color="#fbbf24" />;
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: 'calc(100vh - 65px)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#05050e' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', border: '2px solid rgba(224,160,57,0.1)', borderTopColor: '#e0a039', animation: 'hp-spin 0.8s linear infinite', margin: '0 auto 14px' }} />
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', fontWeight: 300, letterSpacing: '0.5px' }}>Loading...</p>
        </div>
        <style>{`@keyframes hp-spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 65px)', background: '#05050e', display: 'flex', fontFamily: '-apple-system,BlinkMacSystemFont,sans-serif', position: 'relative' }}>

      {/* Background */}
      <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse 60% 40% at 20% 50%, rgba(224,160,57,0.04), transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <style>{`
        @keyframes hp-spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }
        @keyframes hp-ping  { 0%,100%{transform:scale(1);opacity:0.8} 50%{transform:scale(1.5);opacity:0} }
        @keyframes hp-fadein{ from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }

        .hp-folder-btn { transition: all 0.18s; cursor: pointer; border: none; width: 100%; text-align: left; font-family: inherit; }
        .hp-folder-btn:hover { background: rgba(255,255,255,0.06) !important; }

        .hp-filter-btn { transition: all 0.18s; cursor: pointer; border: none; font-family: inherit; white-space: nowrap; }
        .hp-filter-btn:hover { border-color: rgba(255,255,255,0.18) !important; }

        .hp-card { transition: transform 0.28s cubic-bezier(0.4,0,0.2,1), box-shadow 0.28s; cursor: pointer; animation: hp-fadein 0.35s ease both; }
        .hp-card:hover { transform: translateY(-5px) scale(1.01) !important; box-shadow: 0 20px 56px rgba(0,0,0,0.55), 0 0 0 1px rgba(224,160,57,0.12) !important; }
        .hp-card:hover .hp-thumb-img { transform: scale(1.06) !important; }
        .hp-card:hover .hp-play-overlay { opacity: 1 !important; }

        .hp-thumb-img { transition: transform 0.5s cubic-bezier(0.4,0,0.2,1) !important; }

        .hp-icon-btn { transition: all 0.18s; cursor: pointer; border: none; background: transparent; padding: 6px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-family: inherit; }
        .hp-icon-btn:hover { background: rgba(255,255,255,0.08) !important; }

        .hp-search:focus { border-color: rgba(224,160,57,0.4) !important; box-shadow: 0 0 0 3px rgba(224,160,57,0.08) !important; background: rgba(255,255,255,0.07) !important; outline: none !important; }

        .hp-refresh:hover { border-color: rgba(224,160,57,0.35) !important; color: #e0a039 !important; transform: rotate(30deg) !important; }

        [role="dialog"] { background: #0d0d1c !important; border: 1px solid rgba(255,255,255,0.08) !important; }
        [role="dialog"] * { color: inherit !important; }
        .hp-dialog-input { background: rgba(255,255,255,0.05) !important; border: 1px solid rgba(255,255,255,0.08) !important; color: #fff !important; border-radius: 10px !important; }
        .hp-dialog-input:focus { border-color: rgba(224,160,57,0.4) !important; outline: none !important; }
        .hp-dialog-input::placeholder { color: rgba(255,255,255,0.2) !important; }
      `}</style>

      {/* ── Left Sidebar ── */}
      <aside style={{
        width: 220,
        background: 'rgba(255,255,255,0.03)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        padding: '24px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        position: 'relative',
        zIndex: 1,
        flexShrink: 0,
      }}>
        {/* Sidebar header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, padding: '0 6px' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '1.2px', textTransform: 'uppercase' }}>
            Folders
          </span>
          <button
            onClick={() => setShowCreateFolder(true)}
            className="hp-icon-btn"
            style={{ color: 'rgba(255,255,255,0.3)', padding: 4 }}
          >
            <FolderPlus size={14} />
          </button>
        </div>

        {/* All Videos */}
        <button
          className="hp-folder-btn"
          onClick={() => setSelectedFolder(null)}
          style={{
            display: 'flex', alignItems: 'center', gap: 9,
            padding: '9px 12px', borderRadius: 10,
            background: !selectedFolder ? 'rgba(224,160,57,0.1)' : 'transparent',
            border: !selectedFolder ? '1px solid rgba(224,160,57,0.2)' : '1px solid transparent',
          }}
        >
          <Folder size={14} color={!selectedFolder ? '#e0a039' : 'rgba(255,255,255,0.4)'} />
          <span style={{ fontSize: 13, fontWeight: !selectedFolder ? 700 : 400, color: !selectedFolder ? '#e0a039' : 'rgba(255,255,255,0.55)', flex: 1 }}>
            All Videos
          </span>
          <span style={{ fontSize: 11, color: !selectedFolder ? 'rgba(224,160,57,0.7)' : 'rgba(255,255,255,0.25)', fontWeight: 600 }}>
            {videos.length}
          </span>
        </button>

        {/* Folder list */}
        {folders.map(folder => (
          <button
            key={folder.id}
            className="hp-folder-btn"
            onClick={() => setSelectedFolder(folder.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 9,
              padding: '9px 12px', borderRadius: 10,
              background: selectedFolder === folder.id ? 'rgba(224,160,57,0.1)' : 'transparent',
              border: selectedFolder === folder.id ? '1px solid rgba(224,160,57,0.2)' : '1px solid transparent',
            }}
          >
            <Folder size={14} color={selectedFolder === folder.id ? '#e0a039' : 'rgba(255,255,255,0.4)'} />
            <span style={{ fontSize: 13, fontWeight: selectedFolder === folder.id ? 700 : 400, color: selectedFolder === folder.id ? '#e0a039' : 'rgba(255,255,255,0.55)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {folder.name}
            </span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', fontWeight: 600 }}>
              {videos.filter(v => v.folder_id === folder.id).length}
            </span>
          </button>
        ))}

        {/* New folder button */}
        <button
          className="hp-folder-btn"
          onClick={() => setShowCreateFolder(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 12px', borderRadius: 10, border: '1px dashed rgba(255,255,255,0.1)', marginTop: 8, background: 'transparent' }}
        >
          <FolderPlus size={14} color="rgba(255,255,255,0.25)" />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>New Folder</span>
        </button>
      </aside>

      {/* ── Main Content ── */}
      <main style={{ flex: 1, padding: '28px 36px', overflowY: 'auto', position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 30, fontWeight: 800, color: '#fff', letterSpacing: '-0.8px', margin: '0 0 4px' }}>
            Your{' '}
            <span style={{ background: 'linear-gradient(135deg,#f5d880,#e0a039,#c07818)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Creations
            </span>
          </h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)', margin: 0, fontWeight: 300 }}>
            {counts.all} videos · {counts.completed} completed · {counts.generating} processing
          </p>
        </div>

        {/* Search + Filter Row */}
        <div style={{ display: 'flex', gap: 14, marginBottom: 24, alignItems: 'center', flexWrap: 'wrap' }}>

          {/* Search */}
          <div style={{ position: 'relative', flex: 1, maxWidth: 380 }}>
            <Search size={14} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.25)', pointerEvents: 'none' }} />
            <input
              type="text"
              className="hp-search"
              placeholder="Search by name, script or avatar..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ width: '100%', paddingLeft: 36, paddingRight: 14, paddingTop: 9, paddingBottom: 9, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 50, fontSize: 13, color: '#fff', fontFamily: 'inherit', boxSizing: 'border-box' }}
            />
          </div>

          {/* Status Filter Pills */}
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', alignItems: 'center' }}>
            {[
              { key: 'all',        label: 'All',        count: counts.all,        activeColor: '#e0a039',  activeBg: 'rgba(224,160,57,0.12)',  activeBorder: 'rgba(224,160,57,0.35)' },
              { key: 'completed',  label: 'Completed',  count: counts.completed,  activeColor: '#4ade80',  activeBg: 'rgba(34,197,94,0.1)',    activeBorder: 'rgba(34,197,94,0.3)' },
              { key: 'generating', label: 'Processing', count: counts.generating, activeColor: '#60a5fa',  activeBg: 'rgba(96,165,250,0.1)',   activeBorder: 'rgba(96,165,250,0.3)' },
              { key: 'failed',     label: 'Failed',     count: counts.failed,     activeColor: '#f87171',  activeBg: 'rgba(239,68,68,0.1)',    activeBorder: 'rgba(239,68,68,0.3)' },
            ].map(tab => {
              const isActive = statusFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  className="hp-filter-btn"
                  onClick={() => setStatusFilter(tab.key)}
                  style={{
                    padding: '7px 16px', borderRadius: 50, fontSize: 12, fontWeight: isActive ? 700 : 500,
                    color:       isActive ? tab.activeColor : 'rgba(255,255,255,0.4)',
                    background:  isActive ? tab.activeBg    : 'rgba(255,255,255,0.04)',
                    border:      `1px solid ${isActive ? tab.activeBorder : 'rgba(255,255,255,0.08)'}`,
                  }}
                >
                  {tab.label} ({tab.count})
                </button>
              );
            })}

            {/* Refresh */}
            <button
              className="hp-filter-btn hp-refresh"
              onClick={fetchData}
              style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)', transition: 'all 0.22s' }}
            >
              <RefreshCw size={13} />
            </button>
          </div>
        </div>

        {/* ── Video Grid ── */}
        {filteredVideos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ width: 60, height: 60, borderRadius: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Play size={24} color="rgba(255,255,255,0.15)" />
            </div>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.3)', margin: '0 0 6px', fontWeight: 500 }}>No videos found</p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.15)', margin: 0, fontWeight: 300 }}>Try a different filter or create a new video</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
            {filteredVideos.map((video, i) => {
              const sc = getStatusConfig(video.status);
              return (
                <div
                  key={video.id}
                  className="hp-card"
                  onClick={() => setSelectedVideo(video)}
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 18,
                    overflow: 'hidden',
                    boxShadow: '0 4px 24px rgba(0,0,0,0.35)',
                    animationDelay: `${i * 0.04}s`,
                  }}
                >
                  {/* Thumbnail */}
                  <div style={{ aspectRatio: '16/9', position: 'relative', overflow: 'hidden', background: '#0a0a14' }}>
                    {video.thumbnail_url ? (
                      <img
                        className="hp-thumb-img"
                        src={video.thumbnail_url}
                        alt={video.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,rgba(224,160,57,0.12),rgba(96,165,250,0.08))' }}>
                        <Play size={32} color="rgba(255,255,255,0.18)" />
                      </div>
                    )}

                    {/* Bottom gradient */}
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 60%)', pointerEvents: 'none' }} />

                    {/* Status badge */}
                    <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 50, background: sc.bg, border: `1px solid ${sc.border}`, backdropFilter: 'blur(8px)' }}>
                      {video.status === 'generating' && (
                        <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#60a5fa', animation: 'hp-ping 1.2s ease-in-out infinite' }} />
                      )}
                      <span style={{ fontSize: 10, fontWeight: 700, color: sc.color, letterSpacing: '0.3px' }}>{sc.label}</span>
                    </div>

                    {/* Play hover overlay */}
                    {video.status === 'completed' && (
                      <div
                        className="hp-play-overlay"
                        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', opacity: 0, transition: 'opacity 0.25s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.4)' }}>
                          <Play size={18} color="#1a0e00" fill="#1a0e00" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card body */}
                  <div style={{ padding: '14px 16px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                      {/* Avatar initial */}
                      <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(224,160,57,0.1)', border: '1px solid rgba(224,160,57,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: '#e0a039' }}>
                          {video.avatar_name?.charAt(0)?.toUpperCase() || 'A'}
                        </span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '-0.1px' }}>
                          {video.title}
                        </p>
                        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: '2px 0 0' }}>
                          {video.avatar_name}
                        </p>
                      </div>
                    </div>

                    {/* Progress bar */}
                    {video.status === 'generating' && (
                      <ProgressBar videoId={video.id} createdAt={video.created_at} />
                    )}
                    {/* Script preview */}
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', margin: '0 0 12px', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {video.script?.substring(0, 90)}...
                    </p>

                    {/* Bottom row */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>
                        {video.created_at ? format(new Date(video.created_at), 'dd MMM yyyy') : 'N/A'}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        {video.status === 'completed' && (
                          <>
                            <button
                              className="hp-icon-btn"
                              onClick={e => { e.stopPropagation(); setSelectedVideo(video); }}
                              title="Play"
                              style={{ color: '#e0a039' }}
                            >
                              <Play size={13} />
                            </button>
                            <button
                              className="hp-icon-btn"
                              onClick={e => { e.stopPropagation(); window.open(video.video_url, '_blank'); }}
                              title="Download"
                              style={{ color: '#4ade80' }}
                            >
                              <Download size={13} />
                            </button>
                          </>
                        )}
                        {video.status === 'generating' && (
                          <Loader2 size={13} color="#60a5fa" style={{ animation: 'hp-spin 1s linear infinite' }} />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ── Video Detail Dialog ── */}
      <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
        <DialogContent style={{ maxWidth: 840, background: '#0d0d1c', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 20, color: '#fff', padding: 28 }}>
          <DialogHeader>
            <DialogTitle style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-0.6px' }}>
              {selectedVideo?.title}
            </DialogTitle>
          </DialogHeader>

          {selectedVideo && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: 4 }}>

              {/* Status row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {getStatusIcon(selectedVideo.status)}
                <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)', textTransform: 'capitalize' }}>
                  {selectedVideo.status}
                </span>
              </div>

              {/* Video player */}
              {selectedVideo.video_url && selectedVideo.status === 'completed' ? (
                <>
                  <video
                    controls
                    style={{ width: '100%', borderRadius: 14, background: '#000', maxHeight: 360 }}
                    src={selectedVideo.video_url}
                  />
                  <button
                    onClick={() => window.open(selectedVideo.video_url, '_blank')}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '13px', background: 'linear-gradient(135deg,#c07818,#f5d070,#c07818)', color: '#1a0e00', border: 'none', borderRadius: 50, fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    <Download size={15} />
                    Download Video
                  </button>
                </>
              ) : (
                <div style={{ aspectRatio: '16/9', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)', fontWeight: 300 }}>
                    {selectedVideo.status === 'generating'
                      ? '⏳ Video is being generated...'
                      : selectedVideo.status === 'failed'
                      ? '❌ Video generation failed'
                      : 'Video is queued for generation'}
                  </p>
                </div>
              )}

              {/* Meta grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: '16px 0', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                {[
                  { label: 'Avatar',   value: selectedVideo.avatar_name },
                  { label: 'Language', value: selectedVideo.language },
                  { label: 'Duration', value: `${selectedVideo.duration} seconds` },
                  { label: 'Created',  value: selectedVideo.created_at ? format(new Date(selectedVideo.created_at), 'PPP') : 'N/A' },
                ].map(m => (
                  <div key={m.label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: '12px 14px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '1px', textTransform: 'uppercase', margin: '0 0 4px' }}>{m.label}</p>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#fff', margin: 0 }}>{m.value}</p>
                  </div>
                ))}
              </div>

              {/* Script */}
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '1px', textTransform: 'uppercase', margin: '0 0 8px' }}>Script</p>
                <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '14px 16px', maxHeight: 160, overflowY: 'auto' }}>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', whiteSpace: 'pre-wrap', margin: 0, lineHeight: 1.6, fontFamily: 'monospace' }}>
                    {selectedVideo.script}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Create Folder Dialog ── */}
      <Dialog open={showCreateFolder} onOpenChange={setShowCreateFolder}>
        <DialogContent style={{ maxWidth: 400, background: '#0d0d1c', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 20, color: '#fff', padding: 28 }}>
          <DialogHeader>
            <DialogTitle style={{ fontSize: 18, fontWeight: 700, color: '#fff', letterSpacing: '-0.4px' }}>
              Create New Folder
            </DialogTitle>
          </DialogHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 8 }}>
            <input
              className="hp-dialog-input"
              placeholder="Folder name..."
              value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleCreateFolder()}
              style={{ padding: '11px 14px', fontSize: 14, width: '100%', boxSizing: 'border-box', fontFamily: 'inherit' }}
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={handleCreateFolder}
                style={{ flex: 1, padding: '12px', background: 'linear-gradient(135deg,#c07818,#f5d070,#c07818)', color: '#1a0e00', border: 'none', borderRadius: 50, fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Create Folder
              </button>
              <button
                onClick={() => setShowCreateFolder(false)}
                style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 50, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}