import React from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Video, Image, PlusCircle, History, Coins, LogOut, LayoutDashboard } from 'lucide-react';
import ChatbotPanel from '../components/ChatbotPanel';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard/avatars', label: 'Avatars', icon: Image },
    { path: '/dashboard/create', label: 'Create', icon: PlusCircle },
    { path: '/dashboard/history', label: 'History', icon: History },
    { path: '/dashboard/credits', label: 'Credits', icon: Coins },
  ];

  if (user?.role === 'admin') {
    navItems.push({ path: '/admin', label: 'Admin', icon: LayoutDashboard });
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-white/90 border-b border-slate-200 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center">
                <Video className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-heading font-bold text-primary">Jio Finance</h1>
                <p className="text-xs text-slate-500">Avatars</p>
              </div>
            </Link>

            {/* Navigation Tabs */}
            <div className="hidden md:flex items-center gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link key={item.path} to={item.path}>
                    <Button
                      data-testid={`nav-${item.label.toLowerCase()}`}
                      variant={isActive ? 'default' : 'ghost'}
                      className={`gap-2 ${
                        isActive
                          ? 'bg-primary text-white shadow-md'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}
            </div>

            {/* User Info & Logout */}
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-lg">
                <Coins className="h-5 w-5 text-amber-600" />
                <span data-testid="user-credits" className="font-semibold text-slate-900">
                  {user?.credits || 0}
                </span>
                <span className="text-sm text-slate-600">credits</span>
              </div>
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-slate-900">{user?.email}</p>
                <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
              </div>
              <Button
                data-testid="logout-button"
                variant="outline"
                size="icon"
                onClick={handleLogout}
                className="border-slate-300"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <div className="md:hidden sticky top-[73px] z-40 bg-white border-b border-slate-200 px-4 py-2">
        <div className="flex items-center gap-2 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path}>
                <Button
                  variant={isActive ? 'default' : 'ghost'}
                  size="sm"
                  className={`gap-2 whitespace-nowrap ${
                    isActive ? 'bg-primary text-white' : 'text-slate-600'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <main className="relative">
        <Outlet />
      </main>

      {/* Chatbot Panel */}
      <ChatbotPanel />
    </div>
  );
}