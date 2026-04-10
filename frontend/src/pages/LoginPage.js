import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { Video, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="h-12 w-12 bg-primary rounded-xl flex items-center justify-center">
                <Video className="h-7 w-7 text-white" />
              </div>
              <h1 className="text-3xl font-heading font-bold text-primary">JioGen AI</h1>
            </div>
            <p className="text-slate-600 mt-2">AI Avatar Video Generation Platform</p>
          </div>

          <Card data-testid="login-card" className="border-slate-200 shadow-lg">
            <CardHeader>
              <CardTitle data-testid="login-title" className="text-2xl font-heading">Sign In</CardTitle>
              <CardDescription>Enter your credentials to access your account</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    data-testid="login-email-input"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    data-testid="login-password-input"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>
                <Button
                  data-testid="login-submit-button"
                  type="submit"
                  className="w-full h-11 font-semibold"
                  disabled={loading}
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm">
                <span className="text-slate-600">Don't have an account? </span>
                <Link to="/signup" className="text-primary font-semibold hover:underline">
                  Sign Up
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right Side - Hero */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary via-primary to-blue-700 items-center justify-center p-12">
        <div className="max-w-lg text-white space-y-6">
          <div className="flex items-center gap-3">
            <Sparkles className="h-10 w-10" />
            <h2 className="text-4xl font-heading font-bold">Create AI Avatar Videos</h2>
          </div>
          <p className="text-xl text-blue-100 leading-relaxed">
            Transform your ideas into professional AI avatar videos in minutes. Perfect for marketing, training, and communication.
          </p>
          <div className="space-y-3 pt-4">
            <div className="flex items-start gap-3">
              <div className="mt-1 h-2 w-2 rounded-full bg-blue-200"></div>
              <p className="text-blue-50">Select from professional Jio-approved avatars</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 h-2 w-2 rounded-full bg-blue-200"></div>
              <p className="text-blue-50">AI-powered script generation and enhancement</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 h-2 w-2 rounded-full bg-blue-200"></div>
              <p className="text-blue-50">Preview voice and generate videos instantly</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}