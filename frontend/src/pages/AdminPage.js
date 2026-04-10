import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import { Users, Video as VideoIcon, Coins, Save } from 'lucide-react';
import { format } from 'date-fns';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newCredits, setNewCredits] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes, videosRes] = await Promise.all([
        axios.get(`${API_URL}/admin/users`),
        axios.get(`${API_URL}/admin/videos`),
      ]);
      setUsers(usersRes.data);
      setVideos(videosRes.data);
    } catch (error) {
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCredits = async () => {
    if (!selectedUser || !newCredits) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      await axios.put(`${API_URL}/admin/users/${selectedUser.id}/credits`, {
        credits: parseInt(newCredits),
      });
      setUsers(users.map((u) =>
        u.id === selectedUser.id ? { ...u, credits: parseInt(newCredits) } : u
      ));
      setSelectedUser(null);
      setNewCredits('');
      toast.success('Credits updated successfully');
    } catch (error) {
      toast.error('Failed to update credits');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8 lg:p-12">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-slate-900 mb-3">
            Admin Dashboard
          </h1>
          <p className="text-lg text-slate-600">
            Manage users, videos, and credits
          </p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card data-testid="admin-users-stat">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5 text-primary" />
                Total Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-heading font-bold text-slate-900">{users.length}</p>
            </CardContent>
          </Card>

          <Card data-testid="admin-videos-stat">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <VideoIcon className="h-5 w-5 text-primary" />
                Total Videos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-heading font-bold text-slate-900">{videos.length}</p>
            </CardContent>
          </Card>

          <Card data-testid="admin-credits-stat">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Coins className="h-5 w-5 text-amber-600" />
                Total Credits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-heading font-bold text-slate-900">
                {users.reduce((sum, u) => sum + u.credits, 0)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="users">
          <TabsList>
            <TabsTrigger value="users" data-testid="admin-users-tab">Users</TabsTrigger>
            <TabsTrigger value="videos" data-testid="admin-videos-tab">Videos</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-6">
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="text-left p-4 text-sm font-semibold text-slate-700">Email</th>
                        <th className="text-left p-4 text-sm font-semibold text-slate-700">Role</th>
                        <th className="text-left p-4 text-sm font-semibold text-slate-700">Credits</th>
                        <th className="text-left p-4 text-sm font-semibold text-slate-700">Joined</th>
                        <th className="text-left p-4 text-sm font-semibold text-slate-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="p-4 text-sm text-slate-900">{user.email}</td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              user.role === 'admin'
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="font-semibold text-slate-900">{user.credits}</span>
                          </td>
                          <td className="p-4 text-sm text-slate-600">
                            {format(new Date(user.created_at), 'MMM d, yyyy')}
                          </td>
                          <td className="p-4">
                            <Button
                              data-testid={`manage-credits-${user.id}`}
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedUser(user);
                                setNewCredits(user.credits.toString());
                              }}
                            >
                              Manage Credits
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="videos" className="mt-6">
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="text-left p-4 text-sm font-semibold text-slate-700">Title</th>
                        <th className="text-left p-4 text-sm font-semibold text-slate-700">Avatar</th>
                        <th className="text-left p-4 text-sm font-semibold text-slate-700">Status</th>
                        <th className="text-left p-4 text-sm font-semibold text-slate-700">Duration</th>
                        <th className="text-left p-4 text-sm font-semibold text-slate-700">Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {videos.map((video) => (
                        <tr key={video.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="p-4 text-sm text-slate-900">{video.title}</td>
                          <td className="p-4 text-sm text-slate-600">{video.avatar_name}</td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              video.status === 'completed'
                                ? 'bg-green-100 text-green-700'
                                : video.status === 'failed'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {video.status}
                            </span>
                          </td>
                          <td className="p-4 text-sm text-slate-600">{video.duration}s</td>
                          <td className="p-4 text-sm text-slate-600">
                            {format(new Date(video.created_at), 'MMM d, yyyy')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Update Credits Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent data-testid="update-credits-dialog">
          <DialogHeader>
            <DialogTitle>Manage Credits</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-600 mb-1">User</p>
                <p className="font-semibold text-slate-900">{selectedUser.email}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-2">New Credit Balance</p>
                <Input
                  data-testid="credits-input"
                  type="number"
                  value={newCredits}
                  onChange={(e) => setNewCredits(e.target.value)}
                  placeholder="Enter new credit amount"
                />
              </div>
              <Button
                data-testid="save-credits-button"
                onClick={handleUpdateCredits}
                className="w-full gap-2"
              >
                <Save className="h-4 w-4" />
                Update Credits
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}