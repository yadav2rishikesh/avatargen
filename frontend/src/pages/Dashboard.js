import React from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Image, PlusCircle, History, Coins, LogOut, LayoutDashboard } from 'lucide-react';
import ChatbotPanel from '../components/ChatbotPanel';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [hasSelectedAvatar, setHasSelectedAvatar] = React.useState(false);

  React.useEffect(() => {
    const checkAvatar = () => {
      setHasSelectedAvatar(!!localStorage.getItem('selectedAvatarId'));
    };
    window.addEventListener('storage', checkAvatar);
    window.addEventListener('avatarSelected', checkAvatar);
    return () => {
      window.removeEventListener('storage', checkAvatar);
      window.removeEventListener('avatarSelected', checkAvatar);
    };
  }, []);

  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('selectedAvatarId');
    setHasSelectedAvatar(false);
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard/avatars', label: 'Avatars', icon: Image },
    { path: '/dashboard/create', label: 'Create', icon: PlusCircle },
    { path: '/dashboard/history', label: 'History', icon: History },
    { path: '/dashboard/credits', label: 'Usage', icon: Coins },
  ];

  if (user?.role === 'admin') {
    navItems.push({ path: '/admin', label: 'Admin', icon: LayoutDashboard });
  }

  const userInitial = user?.email?.charAt(0).toUpperCase() || 'U';

  return (
    <div style={{ minHeight: '100vh', background: '#05050e', color: '#fff', fontFamily: '-apple-system,BlinkMacSystemFont,sans-serif' }}>
      <style>{`
        .jnav-item { transition: all 0.2s; cursor: pointer; text-decoration: none; }
        .jnav-item:hover .jnav-pill { background: rgba(255,255,255,0.06) !important; color: rgba(255,255,255,0.8) !important; }
        .jnav-active .jnav-pill { background: rgba(224,160,57,0.12) !important; border: 1px solid rgba(224,160,57,0.25) !important; color: #e0a039 !important; }
        .jlogout:hover { background: rgba(239,68,68,0.1) !important; border-color: rgba(239,68,68,0.2) !important; color: #fca5a5 !important; }
        .jmobile-nav { display: none; }
        @media(max-width: 768px) { .jdesktop-nav { display: none !important; } .jmobile-nav { display: flex !important; } .jnav-email { display: none !important; } }
      `}</style>

      {/* TOP NAV */}
      <nav style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 48px', background:'rgba(5,5,14,0.85)', backdropFilter:'blur(32px)', WebkitBackdropFilter:'blur(32px)', borderBottom:'1px solid rgba(255,255,255,0.06)', position:'sticky', top:0, zIndex:100, gap:12 }}>

        {/* Logo */}
        <Link to="/dashboard" style={{ display:'flex', alignItems:'center', gap:12, textDecoration:'none', flexShrink:0 }}>
          <div style={{ width:36, height:36, borderRadius:10, overflow:'hidden', flexShrink:0, boxShadow:'0 4px 16px rgba(224,160,57,0.3)' }}>
            <img src={require('../assets/jiofinance-app-icon-hd.png')} alt="Jio Finance" width={36} height={36} style={{ objectFit:'cover', display:'block' }} />
          </div>
          <div>
            <div style={{ fontSize:15, fontWeight:700, color:'#fff', letterSpacing:'-0.4px' }}>Jio Finance</div>
            <div style={{ fontSize:10, color:'rgba(255,255,255,0.3)' }}>Avatars Studio</div>
          </div>
        </Link>

        {/* Desktop Nav Items */}
        <div className="jdesktop-nav" style={{ display:'flex', alignItems:'center', gap:2 }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            const isCreateDisabled = item.label === 'Create' && !hasSelectedAvatar;
            return (
              <div key={item.path} title={isCreateDisabled ? 'Please select an avatar first' : ''}>
                {isCreateDisabled ? (
                  <div style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:50, fontSize:13, fontWeight:500, color:'rgba(255,255,255,0.2)', cursor:'not-allowed', opacity:0.5 }}>
                    <Icon size={14} />
                    {item.label}
                  </div>
                ) : (
                  <Link to={item.path} className={`jnav-item ${isActive ? 'jnav-active' : ''}`} style={{ textDecoration:'none' }}>
                    <div data-testid={`nav-${item.label.toLowerCase()}`} className="jnav-pill" style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:50, fontSize:13, fontWeight: isActive ? 600 : 400, color: isActive ? '#e0a039' : 'rgba(255,255,255,0.45)', border:'1px solid transparent', transition:'all 0.2s' }}>
                      <Icon size={14} />
                      {item.label}
                    </div>
                  </Link>
                )}
              </div>
            );
          })}
        </div>

        {/* User + Logout */}
        <div style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
          <div className="jnav-email" style={{ textAlign:'right' }}>
            <div style={{ fontSize:13, fontWeight:500, color:'rgba(255,255,255,0.7)' }}>{user?.email}</div>
            <div style={{ fontSize:10, color:'rgba(255,255,255,0.3)', textTransform:'capitalize', marginTop:1 }}>{user?.role}</div>
          </div>
          <div style={{ width:32, height:32, borderRadius:'50%', background:'linear-gradient(135deg,#e0a039,#c07818)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:'#1a0e00', flexShrink:0 }}>
            {userInitial}
          </div>
          <button data-testid="logout-button" className="jlogout" onClick={handleLogout} style={{ width:32, height:32, borderRadius:9, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'rgba(255,255,255,0.4)', transition:'all 0.2s', flexShrink:0 }}>
            <LogOut size={14} />
          </button>
        </div>
      </nav>

      {/* Mobile Nav */}
      <div className="jmobile-nav" style={{ padding:'8px 16px', background:'rgba(5,5,14,0.9)', borderBottom:'1px solid rgba(255,255,255,0.06)', overflowX:'auto', position:'sticky', top:65, zIndex:99 }}>
        <div style={{ display:'flex', gap:4 }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            const isCreateDisabled = item.label === 'Create' && !hasSelectedAvatar;
            return (
              <div key={item.path}>
                {isCreateDisabled ? (
                  <div style={{ display:'flex', alignItems:'center', gap:4, padding:'6px 12px', borderRadius:50, fontSize:12, color:'rgba(255,255,255,0.2)', whiteSpace:'nowrap', opacity:0.5 }}>
                    <Icon size={12} />{item.label}
                  </div>
                ) : (
                  <Link to={item.path} style={{ textDecoration:'none' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:4, padding:'6px 12px', borderRadius:50, fontSize:12, fontWeight: isActive ? 600 : 400, color: isActive ? '#e0a039' : 'rgba(255,255,255,0.45)', background: isActive ? 'rgba(224,160,57,0.1)' : 'transparent', border: isActive ? '1px solid rgba(224,160,57,0.2)' : '1px solid transparent', whiteSpace:'nowrap', transition:'all 0.2s' }}>
                      <Icon size={12} />{item.label}
                    </div>
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <main style={{ background:'#05050e', minHeight:'calc(100vh - 65px)', position:'relative' }}>
        <Outlet />
      </main>

      <ChatbotPanel />
    </div>
  );
}