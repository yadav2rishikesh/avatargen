import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Coins, Zap, TrendingUp } from 'lucide-react';

export default function CreditsPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-[calc(100vh-73px)] p-6 md:p-8 lg:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-slate-900 mb-3">
            Credits
          </h1>
          <p className="text-lg text-slate-600">
            Manage your video generation credits
          </p>
        </div>

        {/* Current Balance */}
        <Card data-testid="credits-balance-card" className="bg-gradient-to-br from-primary to-blue-700 border-0 text-white shadow-2xl">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 mb-2">Current Balance</p>
                <div className="flex items-baseline gap-2">
                  <h2 data-testid="credits-balance" className="text-6xl font-heading font-bold">
                    {user?.credits || 0}
                  </h2>
                  <span className="text-2xl text-blue-100">credits</span>
                </div>
              </div>
              <div className="h-24 w-24 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Coins className="h-12 w-12 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Usage Info */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card data-testid="credits-usage-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-600" />
                Credit Usage
              </CardTitle>
              <CardDescription>
                How credits are consumed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-slate-600">Video Generation</span>
                <span className="font-semibold text-slate-900">1 credit</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-600">Script Generation (AI)</span>
                <span className="font-semibold text-green-600">Free</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-600">Voice Preview</span>
                <span className="font-semibold text-green-600">Free</span>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="credits-tips-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Tips to Save Credits
              </CardTitle>
              <CardDescription>
                Make the most of your credits
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-3">
                <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                <p className="text-sm text-slate-600">
                  Use voice preview to ensure your script sounds perfect before generating the video
                </p>
              </div>
              <div className="flex gap-3">
                <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                <p className="text-sm text-slate-600">
                  Leverage AI script enhancement to refine your content without extra cost
                </p>
              </div>
              <div className="flex gap-3">
                <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                <p className="text-sm text-slate-600">
                  Keep scripts concise and focused for better video quality and engagement
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info Banner */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex gap-4">
              <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                <Coins className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-heading font-semibold text-slate-900 mb-1">
                  Need More Credits?
                </h3>
                <p className="text-sm text-slate-600">
                  Contact your administrator to request additional credits for your account.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}