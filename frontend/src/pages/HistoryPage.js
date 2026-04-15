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

export default function HistoryPage() {
  const [videos, setVideos] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

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
    if (!newFolderName.trim()) {
      toast.error('Please enter a folder name');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/folders`, { name: newFolderName }, { headers: { Authorization: `Bearer ${token}` } });
      setFolders([response.data, ...folders]);
      setNewFolderName('');
      setShowCreateFolder(false);
      toast.success('Folder created!');
    } catch (error) {
      toast.error('Failed to create folder');
    }
  };

  // Filter videos
  const filteredVideos = videos
    .filter(v => selectedFolder ? v.folder_id === selectedFolder : true)
    .filter(v => statusFilter === 'all' ? true : v.status === statusFilter)
    .filter(v => searchTerm === '' ? true :
      v.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.avatar_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.script?.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const counts = {
    all: videos.length,
    completed: videos.filter(v => v.status === 'completed').length,
    generating: videos.filter(v => v.status === 'generating').length,
    failed: videos.filter(v => v.status === 'failed').length,
  };

  const getStatusBadge = (status) => {
    const styles = {
      completed: 'bg-green-100 text-green-700',
      failed: 'bg-red-100 text-red-700',
      generating: 'bg-blue-100 text-blue-700',
      queued: 'bg-amber-100 text-amber-700',
    };
    const labels = {
      completed: 'Done',
      failed: 'Failed',
      generating: 'Processing',
      queued: 'Queued',
    };
    return { style: styles[status] || styles.queued, label: labels[status] || status };
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'failed': return <XCircle className="h-5 w-5 text-red-600" />;
      case 'generating': return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />;
      default: return <Clock className="h-5 w-5 text-amber-600" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-73px)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-73px)] flex bg-slate-50">

      {/* Left Sidebar — Folders */}
      <aside className="w-56 bg-white border-r border-slate-200 p-4 flex flex-col gap-2">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-slate-800 text-sm">Folders</h2>
          <button onClick={() => setShowCreateFolder(true)} className="text-slate-400 hover:text-primary">
            <FolderPlus className="h-4 w-4" />
          </button>
        </div>

        <button
          onClick={() => setSelectedFolder(null)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            !selectedFolder ? 'bg-primary text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Folder className="h-4 w-4" />
          All Videos ({videos.length})
        </button>

        {folders.map(folder => (
          <button
            key={folder.id}
            onClick={() => setSelectedFolder(folder.id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              selectedFolder === folder.id ? 'bg-primary text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Folder className="h-4 w-4" />
            {folder.name} ({videos.filter(v => v.folder_id === folder.id).length})
          </button>
        ))}

        <button
          onClick={() => setShowCreateFolder(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-primary mt-1"
        >
          <FolderPlus className="h-4 w-4" />
          New Folder
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-8 overflow-auto">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 mb-1">
            Your <span className="text-primary">Creations</span>
          </h1>
        </div>

        {/* Search + Status Filter Row */}
        <div className="flex flex-col md:flex-row gap-4 mb-6 items-start md:items-center justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, script or avatar..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
            />
          </div>

          {/* Status Filter Tabs */}
          <div className="flex gap-2 flex-wrap">
            {[
              { key: 'all', label: 'All', count: counts.all },
              { key: 'completed', label: 'Completed', count: counts.completed },
              { key: 'generating', label: 'Processing', count: counts.generating },
              { key: 'failed', label: 'Failed', count: counts.failed },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
                  statusFilter === tab.key
                    ? tab.key === 'completed' ? 'bg-green-100 text-green-700 border-green-300'
                      : tab.key === 'generating' ? 'bg-blue-100 text-blue-700 border-blue-300'
                      : tab.key === 'failed' ? 'bg-red-100 text-red-700 border-red-300'
                      : 'bg-primary text-white border-primary'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}

            <button
              onClick={fetchData}
              className="px-3 py-1.5 rounded-full text-sm font-medium border border-slate-200 bg-white text-slate-600 hover:border-primary hover:text-primary transition-all"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Videos Grid */}
        {filteredVideos.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-slate-400 text-lg">No videos found</p>
            <p className="text-slate-300 text-sm mt-1">Try a different filter or create a new video</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredVideos.map(video => {
              const { style, label } = getStatusBadge(video.status);
              return (
                <div
                  key={video.id}
                  onClick={() => setSelectedVideo(video)}
                  className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer border border-slate-100 group"
                >
                  {/* Thumbnail */}
                  <div className="aspect-video bg-slate-100 relative overflow-hidden">
                    {video.thumbnail_url ? (
                      <img
                        src={video.thumbnail_url}
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary to-blue-700">
                        <Play className="h-10 w-10 text-white opacity-50" />
                      </div>
                    )}
                    {/* Status Badge */}
                    <div className={`absolute top-2 right-2 px-2.5 py-1 rounded-full text-xs font-semibold ${style}`}>
                      {video.status === 'generating' && <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping mr-1" />}
                      {label}
                    </div>
                    {/* Play overlay */}
                    {video.status === 'completed' && (
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="bg-white rounded-full p-3 shadow-lg">
                          <Play className="h-5 w-5 text-primary fill-primary" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Info */}
                  <div className="p-4">
                    <div className="flex items-start gap-2 mb-2">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-primary">
                          {video.avatar_name?.charAt(0) || 'A'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-900 text-sm truncate">{video.title}</h3>
                        <p className="text-xs text-slate-500">{video.avatar_name}</p>
                      </div>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                      {video.script?.substring(0, 80)}...
                    </p>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">
                        {video.created_at ? format(new Date(video.created_at), 'dd MMM yyyy') : 'N/A'}
                      </span>
                      <div className="flex items-center gap-2">
                        {video.status === 'completed' && (
                          <>
                            <button
                              onClick={e => { e.stopPropagation(); setSelectedVideo(video); }}
                              className="p-1.5 rounded-lg hover:bg-primary/10 text-primary transition-colors"
                              title="Play"
                            >
                              <Play className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={e => { e.stopPropagation(); window.open(video.video_url, '_blank'); }}
                              className="p-1.5 rounded-lg hover:bg-green-50 text-green-600 transition-colors"
                              title="Download"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                        {video.status === 'generating' && (
                          <Loader2 className="h-3.5 w-3.5 text-blue-500 animate-spin" />
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

      {/* Video Detail Dialog */}
      <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">{selectedVideo?.title}</DialogTitle>
          </DialogHeader>
          {selectedVideo && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {getStatusIcon(selectedVideo.status)}
                <span className="font-medium capitalize">{selectedVideo.status}</span>
              </div>

              {selectedVideo.video_url && selectedVideo.status === 'completed' ? (
                <>
                  <video controls className="w-full rounded-lg" src={selectedVideo.video_url} />
                  <Button onClick={() => window.open(selectedVideo.video_url, '_blank')} className="w-full gap-2">
                    <Download className="h-4 w-4" />
                    Download Video
                  </Button>
                </>
              ) : (
                <div className="aspect-video bg-slate-100 rounded-lg flex items-center justify-center">
                  <p className="text-slate-500">
                    {selectedVideo.status === 'generating' ? '⏳ Video is being generated...'
                      : selectedVideo.status === 'failed' ? '❌ Video generation failed'
                      : 'Video is queued for generation'}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                <div><p className="text-sm text-slate-500">Avatar</p><p className="font-medium">{selectedVideo.avatar_name}</p></div>
                <div><p className="text-sm text-slate-500">Language</p><p className="font-medium">{selectedVideo.language}</p></div>
                <div><p className="text-sm text-slate-500">Duration</p><p className="font-medium">{selectedVideo.duration} seconds</p></div>
                <div><p className="text-sm text-slate-500">Created</p><p className="font-medium">{selectedVideo.created_at ? format(new Date(selectedVideo.created_at), 'PPP') : 'N/A'}</p></div>
              </div>

              <div>
                <p className="text-sm text-slate-500 mb-2">Script</p>
                <div className="bg-slate-50 p-4 rounded-lg max-h-48 overflow-y-auto">
                  <p className="text-sm whitespace-pre-wrap">{selectedVideo.script}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Folder Dialog */}
      <Dialog open={showCreateFolder} onOpenChange={setShowCreateFolder}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Folder name"
              value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleCreateFolder()}
            />
            <div className="flex gap-2">
              <Button onClick={handleCreateFolder} className="flex-1">Create</Button>
              <Button variant="outline" onClick={() => setShowCreateFolder(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}