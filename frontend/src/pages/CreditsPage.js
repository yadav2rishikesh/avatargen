import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Video, Calendar, RefreshCw, Mail, CheckCircle, AlertCircle } from 'lucide-react';
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

  return (
    <div className="min-h-[calc(100vh-73px)] p-6 md:p-8 lg:p-12">
      <div className="max-w-4xl mx-auto space-y-8">

        <div>
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-slate-900 mb-3">Usage</h1>
          <p className="text-lg text-slate-600">Company monthly video pool — shared across all users</p>
        </div>

        <Card className="bg-gradient-to-br from-primary to-blue-700 border-0 text-white shadow-2xl">
          <CardContent className="p-8">
            {loading ? (
              <div className="flex items-center gap-3">
                <RefreshCw className="h-5 w-5 animate-spin text-blue-200" />
                <span className="text-blue-100">Loading usage...</span>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 mb-1 text-sm font-medium uppercase tracking-wide">{month} Usage</p>
                    <div className="flex items-baseline gap-2">
                      <h2 className="text-6xl font-heading font-bold">{used}</h2>
                      <span className="text-2xl text-blue-100">/ {limit} videos</span>
                    </div>
                    <p className="text-blue-200 mt-1 text-sm">{remaining} videos remaining this month</p>
                  </div>
                  <div className="h-24 w-24 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <Video className="h-12 w-12 text-white" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm text-blue-100 mb-2">
                    <span>{percent}% used</span>
                    <span>{remaining} left</span>
                  </div>
                  <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                    <div
                      style={{
                        width: `${Math.min(percent, 100)}%`,
                        backgroundColor: percent >= 90 ? "#fca5a5" : percent >= 70 ? "#fcd34d" : "#ffffff",
                        transition: "width 0.5s ease"
                      }}
                      className="h-full rounded-full"
                    />
                  </div>
                </div>
                {percent >= 90 && (
                  <div className="flex items-center gap-2 bg-red-500/20 border border-red-300/30 rounded-lg px-4 py-2">
                    <AlertCircle className="h-4 w-4 text-red-200 flex-shrink-0" />
                    <span className="text-sm text-red-100">You are almost at your monthly limit! Contact admin if you need more.</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                Monthly Reset
              </CardTitle>
              <CardDescription>When your limit refreshes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-slate-600">Current Month</span>
                <span className="font-semibold text-slate-900">{month}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-slate-600">Next Reset</span>
                <span className="font-semibold text-slate-900">{nextReset}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-600">Monthly Limit</span>
                <span className="font-semibold text-slate-900">{limit} videos</span>
              </div>
              <p className="text-xs text-slate-400 mt-2">Limit resets automatically on the 1st of every month.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                {"What's Included"}
              </CardTitle>
              <CardDescription>Features available to you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-slate-600">Video Generation</span>
                <span className="font-semibold text-slate-900">1 per attempt</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-slate-600">AI Script Generation</span>
                <span className="font-semibold text-green-600">Unlimited</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-slate-600">Voice Preview</span>
                <span className="font-semibold text-green-600">Unlimited</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-600">Failed Videos</span>
                <span className="font-semibold text-green-600">Do not count</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex gap-4">
              <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                <Mail className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-heading font-semibold text-slate-900 mb-1">Need More Videos?</h3>
                <p className="text-sm text-slate-600 mb-3">Contact your administrator to request a limit increase.</p>
                <button
                  onClick={() => window.location.href = 'mailto:eipimediaai@gmail.com'}
                  className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  Contact Admin
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}