import React, { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { toast } from "sonner";
import { Users, Video as VideoIcon, BarChart2, RefreshCw, AlertCircle } from "lucide-react";
import { format } from "date-fns";

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [videos, setVideos] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      const [usersRes, videosRes, statsRes] = await Promise.all([
        axios.get(`${API_URL}/admin/users`, { headers }),
        axios.get(`${API_URL}/admin/videos`, { headers }),
        axios.get(`${API_URL}/admin/stats`, { headers }),
      ]);
      setUsers(usersRes.data);
      setVideos(videosRes.data);
      setStats(statsRes.data);
    } catch (error) {
      toast.error("Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPool = async () => {
    setResetting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${API_URL}/admin/users/reset-usage`,
        { user_id: "company" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(res.data.message || "Company pool reset successfully");
      setShowResetDialog(false);
      fetchData();
    } catch (error) {
      toast.error("Failed to reset pool");
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const poolUsed = stats?.company_pool_used || 0;
  const poolLimit = stats?.company_pool_limit || 30;
  const poolRemaining = stats?.company_pool_remaining || 30;
  const poolPct = Math.round((poolUsed / poolLimit) * 100);

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8 lg:p-12">
      <div className="max-w-7xl mx-auto space-y-8">

        <div>
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-slate-900 mb-3">Admin Dashboard</h1>
          <p className="text-lg text-slate-600">Manage users and monitor company video usage — {stats?.month || ""}</p>
        </div>

        {/* Company Pool Card */}
        <Card className="bg-gradient-to-br from-primary to-blue-700 border-0 text-white shadow-2xl">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-blue-100 text-sm font-medium uppercase tracking-wide mb-1">Company Monthly Pool</p>
                <div className="flex items-baseline gap-2">
                  <h2 className="text-6xl font-heading font-bold">{poolUsed}</h2>
                  <span className="text-2xl text-blue-100">/ {poolLimit} videos</span>
                </div>
                <p className="text-blue-200 mt-1 text-sm">{poolRemaining} videos remaining — shared across all users</p>
              </div>
              <div className="text-right">
                <Button
                  variant="outline"
                  className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                  onClick={() => setShowResetDialog(true)}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Clear Stuck Videos
                </Button>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm text-blue-100 mb-2">
                <span>{poolPct}% used</span>
                <span>{poolRemaining} left</span>
              </div>
              <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                <div
                  style={{
                    width: `${Math.min(poolPct, 100)}%`,
                    backgroundColor: poolPct >= 90 ? "#fca5a5" : poolPct >= 70 ? "#fcd34d" : "#ffffff",
                    transition: "width 0.5s ease"
                  }}
                  className="h-full rounded-full"
                />
              </div>
            </div>
            {poolPct >= 90 && (
              <div className="flex items-center gap-2 bg-red-500/20 border border-red-300/30 rounded-lg px-4 py-2 mt-4">
                <AlertCircle className="h-4 w-4 text-red-200 flex-shrink-0" />
                <span className="text-sm text-red-100">Company pool almost full! Consider resetting or increasing the limit.</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <VideoIcon className="h-5 w-5 text-primary" />
                Total Videos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-heading font-bold text-slate-900">{videos.length}</p>
              <p className="text-sm text-slate-500 mt-1">{stats?.completed_videos || 0} completed · {stats?.failed_videos || 0} failed</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart2 className="h-5 w-5 text-amber-600" />
                This Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-heading font-bold text-slate-900">{stats?.monthly_videos || 0}</p>
              <p className="text-sm text-slate-500 mt-1">videos generated</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="users">
          <TabsList>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="videos">Videos</TabsTrigger>
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
                        <th className="text-left p-4 text-sm font-semibold text-slate-700">Videos This Month</th>
                        <th className="text-left p-4 text-sm font-semibold text-slate-700">Total Videos</th>
                        <th className="text-left p-4 text-sm font-semibold text-slate-700">Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="p-4 text-sm text-slate-900">{user.email}</td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.role === "admin" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="p-4 text-sm font-semibold text-slate-900">{user.monthly_videos_used || 0}</td>
                          <td className="p-4 text-sm text-slate-600">{user.total_videos || 0}</td>
                          <td className="p-4 text-sm text-slate-600">{format(new Date(user.created_at), "MMM d, yyyy")}</td>
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
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${video.status === "completed" ? "bg-green-100 text-green-700" : video.status === "failed" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}`}>
                              {video.status}
                            </span>
                          </td>
                          <td className="p-4 text-sm text-slate-600">{video.duration}s</td>
                          <td className="p-4 text-sm text-slate-600">{format(new Date(video.created_at), "MMM d, yyyy")}</td>
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

      {/* Clear Stuck Videos Dialog */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear Stuck Videos</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-800 text-sm">Clear stuck videos?</p>
                  <p className="text-amber-600 text-xs mt-2">
                    This finds videos stuck on "generating" for 2+ hours and frees those pool slots.
                    Only use this for genuine system errors — not to give extra videos.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm text-slate-600 bg-slate-50 rounded-lg p-3">
              <span>Current pool usage</span>
              <span className="font-semibold">{poolUsed} / {poolLimit} videos</span>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowResetDialog(false)}>Cancel</Button>
              <Button className="flex-1 gap-2" onClick={handleResetPool} disabled={resetting}>
                <RefreshCw className={`h-4 w-4 ${resetting ? "animate-spin" : ""}`} />
                {resetting ? "Resetting..." : "Confirm Reset"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}