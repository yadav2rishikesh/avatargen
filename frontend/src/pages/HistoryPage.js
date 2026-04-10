import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { Folder, FolderPlus, Play, Download, Loader2, Clock, CheckCircle, XCircle } from 'lucide-react';
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

  useEffect(() => {
    fetchData();
    const interval = setInterval(checkVideoStatuses, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
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

  const checkVideoStatuses = async () => {
    const generatingVideos = videos.filter((v) => v.status === 'generating');
    for (const video of generatingVideos) {
      try {
        const response = await axios.get(`${API_URL}/videos/status/${video.id}`);
        if (response.data.status !== video.status) {
          setVideos((prev) =>
            prev.map((v) => (v.id === video.id ? response.data : v))
          );
          if (response.data.status === 'completed') {
            toast.success(`Video "${video.title}" is ready!`);
          }
        }
      } catch (error) {
        console.error('Error checking video status:', error);
      }
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      toast.error('Please enter a folder name');
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/folders`, { name: newFolderName });
      setFolders([response.data, ...folders]);
      setNewFolderName('');
      setShowCreateFolder(false);
      toast.success('Folder created successfully');
    } catch (error) {
      toast.error('Failed to create folder');
    }
  };

  const filteredVideos = selectedFolder
    ? videos.filter((v) => v.folder_id === selectedFolder)
    : videos;

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'generating':
        return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />;
      default:
        return <Clock className="h-5 w-5 text-amber-600" />;
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      completed: 'bg-green-100 text-green-700 border-green-200',
      failed: 'bg-red-100 text-red-700 border-red-200',
      generating: 'bg-blue-100 text-blue-700 border-blue-200 animate-pulse',
      queued: 'bg-amber-100 text-amber-700 border-amber-200',
    };
    return styles[status] || styles.queued;
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-73px)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-73px)] flex">
      {/* Folders Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading font-semibold text-slate-900">Folders</h2>
          <Button
            data-testid="create-folder-button"
            size="icon"
            variant="ghost"
            onClick={() => setShowCreateFolder(true)}
          >
            <FolderPlus className="h-5 w-5" />
          </Button>
        </div>

        <div className="space-y-1">
          <Button
            data-testid="all-videos-button"
            variant={!selectedFolder ? 'secondary' : 'ghost'}
            className="w-full justify-start gap-2"
            onClick={() => setSelectedFolder(null)}
          >
            <Folder className="h-4 w-4" />
            All Videos ({videos.length})
          </Button>
          {folders.map((folder) => (
            <Button
              key={folder.id}
              data-testid={`folder-${folder.id}`}
              variant={selectedFolder === folder.id ? 'secondary' : 'ghost'}
              className="w-full justify-start gap-2"
              onClick={() => setSelectedFolder(folder.id)}
            >
              <Folder className="h-4 w-4" />
              {folder.name} ({videos.filter((v) => v.folder_id === folder.id).length})
            </Button>
          ))}
        </div>
      </aside>

      {/* Videos Grid */}
      <main className="flex-1 p-6 md:p-8 lg:p-12">
        <div className="mb-8">
          <h1 className="text-4xl font-heading font-bold text-slate-900 mb-2">
            Video History
          </h1>
          <p className="text-slate-600">
            {filteredVideos.length} video{filteredVideos.length !== 1 ? 's' : ''}
          </p>
        </div>

        {filteredVideos.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-500">No videos found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVideos.map((video) => (
              <Card
                key={video.id}
                data-testid={`video-card-${video.id}`}
                className="group cursor-pointer transition-all hover:shadow-xl overflow-hidden"
                onClick={() => setSelectedVideo(video)}
              >
                <div className="aspect-video bg-slate-100 relative overflow-hidden">
                  {video.thumbnail_url ? (
                    <img
                      src={video.thumbnail_url}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary to-blue-700">
                      <Play className="h-12 w-12 text-white opacity-50" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(video.status)}`}>
                      {video.status}
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-heading font-semibold text-slate-900 mb-2 line-clamp-1">
                    {video.title}
                  </h3>
                  <p className="text-sm text-slate-600 mb-2">{video.avatar_name}</p>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{video.duration}s</span>
                    <span>{format(new Date(video.created_at), 'MMM d, yyyy')}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Video Detail Dialog */}
      <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
        <DialogContent data-testid="video-detail-dialog" className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-heading">{selectedVideo?.title}</DialogTitle>
          </DialogHeader>
          {selectedVideo && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {getStatusIcon(selectedVideo.status)}
                <span className="font-medium capitalize">{selectedVideo.status}</span>
              </div>

              {selectedVideo.video_url && selectedVideo.status === 'completed' ? (
                <>
                  <video
                    data-testid="video-player"
                    controls
                    className="w-full rounded-lg"
                    src={selectedVideo.video_url}
                  />
                  <Button
                    data-testid="download-video-button"
                    onClick={() => window.open(selectedVideo.video_url, '_blank')}
                    className="w-full gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download Video
                  </Button>
                </>
              ) : (
                <div className="aspect-video bg-slate-100 rounded-lg flex items-center justify-center">
                  <p className="text-slate-500">
                    {selectedVideo.status === 'generating'
                      ? 'Video is being generated...'
                      : selectedVideo.status === 'failed'
                      ? 'Video generation failed'
                      : 'Video is queued for generation'}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                <div>
                  <p className="text-sm text-slate-500">Avatar</p>
                  <p className="font-medium">{selectedVideo.avatar_name}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Language</p>
                  <p className="font-medium">{selectedVideo.language}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Duration</p>
                  <p className="font-medium">{selectedVideo.duration} seconds</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Created</p>
                  <p className="font-medium">
                    {format(new Date(selectedVideo.created_at), 'PPP')}
                  </p>
                </div>
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
              data-testid="folder-name-input"
              placeholder="Folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
            />
            <div className="flex gap-2">
              <Button
                data-testid="create-folder-submit"
                onClick={handleCreateFolder}
                className="flex-1"
              >
                Create
              </Button>
              <Button variant="outline" onClick={() => setShowCreateFolder(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}