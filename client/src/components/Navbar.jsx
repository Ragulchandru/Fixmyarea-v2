import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Home, 
  PlusCircle, 
  Map, 
  ListCollapse, 
  Bell, 
  User, 
  ShieldAlert, 
  Briefcase, 
  LogOut, 
  LogIn, 
  Globe, 
  Sun, 
  Moon, 
  Menu, 
  X,
  FileText
} from 'lucide-react';

const Navbar = ({ toggleDarkMode, isDarkMode }) => {
  const { user, logout, lang, changeLanguage, t } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsCount, setNotificationsCount] = useState(0);

  // Poll for notifications count if user is logged in
  useEffect(() => {
    if (!user) return;
    const fetchCount = async () => {
      try {
        const res = await fetch('/api/issues/notifications');
        const data = await res.json();
        if (data.success) {
          const unread = data.notifications.filter(n => !n.isRead).length;
          setNotificationsCount(unread);
        }
      } catch (e) {
        // Silent error
      }
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000); // every 30s
    return () => clearInterval(interval);
  }, [user]);

  const isActive = (path) => {
    return location.pathname === path;
  };

  const navItems = [
    { label: t('home'), path: '/', icon: Home, show: true },
    { label: t('reportIssue'), path: '/report', icon: PlusCircle, show: true },
    { label: t('feed'), path: '/feed', icon: ListCollapse, show: true },
    { label: t('map'), path: '/map-view', icon: Map, show: true },
    { label: t('myReports'), path: '/my-reports', icon: FileText, show: !!user && user.role === 'citizen' },
    { label: t('notifications'), path: '/notifications', icon: Bell, show: !!user, badge: notificationsCount },
    { label: t('profile'), path: '/profile', icon: User, show: !!user },
    { label: t('admin'), path: '/admin-dashboard', icon: ShieldAlert, show: !!user && user.role === 'admin' },
    { label: t('employee'), path: '/employee-dashboard', icon: Briefcase, show: !!user && user.role === 'employee' },
  ];

  const handleNavClick = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  const getRoleBadgeColor = (role) => {
    if (role === 'admin') return 'bg-red-500/10 text-red-500 border border-red-500/30';
    if (role === 'employee') return 'bg-amber-500/10 text-amber-500 border border-amber-500/30';
    return 'bg-blue-500/10 text-blue-500 border border-blue-500/30';
  };

  return (
    <>
      {/* 1. TOP HEADER (Desktop & Mobile) */}
      <header className="sticky top-0 z-40 w-full glass border-b border-slate-200/50 dark:border-slate-800/50 py-3 px-4 md:px-6 flex items-center justify-between">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}>
          <div className="bg-primary flex items-center justify-center p-2 rounded-lg text-white shadow-md shadow-primary/20">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-white leading-none m-0">
              {t('appName')}
            </h1>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium tracking-wide uppercase mt-0.5">
              Tamil Nadu State Portal
            </p>
          </div>
        </div>

        {/* Action controls (Theme + Lang + Desktop Login) */}
        <div className="flex items-center space-x-2 md:space-x-3">
          {/* Language Toggle */}
          <button 
            onClick={() => changeLanguage(lang === 'en' ? 'ta' : 'en')}
            className="p-2 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-350 transition-colors flex items-center space-x-1 text-sm font-medium"
            title="Switch Language / மொழியை மாற்ற"
          >
            <Globe className="h-4.5 w-4.5" />
            <span className="text-xs">{lang === 'en' ? 'தமிழ்' : 'English'}</span>
          </button>

          {/* Dark Mode Toggle */}
          <button 
            onClick={toggleDarkMode}
            className="p-2 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-350 transition-colors"
            title="Toggle theme"
          >
            {isDarkMode ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
          </button>

          {/* Desktop Auth Status */}
          <div className="hidden md:flex items-center space-x-3">
            {user ? (
              <div className="flex items-center space-x-3 bg-slate-100/50 dark:bg-slate-900/50 pl-3 pr-2 py-1 rounded-full border border-slate-200/30 dark:border-slate-800/30">
                <div className="text-right">
                  <div className="text-xs font-semibold text-slate-700 dark:text-slate-200 leading-none">{user.name}</div>
                  <span className={`text-[9px] font-bold uppercase rounded px-1.5 py-0.5 inline-block mt-1 ${getRoleBadgeColor(user.role)}`}>
                    {user.role}
                  </span>
                </div>
                <button
                  onClick={() => { logout(); navigate('/'); }}
                  className="p-2 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-all"
                  title={t('logout')}
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="bg-primary hover:bg-primary/95 text-white px-4 py-1.5 rounded-lg text-sm font-medium flex items-center space-x-1.5 transition-all shadow-md shadow-primary/10"
              >
                <LogIn className="h-4 w-4" />
                <span>{t('login')}</span>
              </button>
            )}
          </div>

          {/* Mobile Drawer Trigger (Hamburger) */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-300 transition-colors"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* 2. DESKTOP LEFT SIDEBAR NAVIGATION */}
      <aside className="hidden md:flex flex-col fixed left-0 top-[60px] bottom-0 w-[240px] bg-white dark:bg-slate-900 border-r border-slate-200/50 dark:border-slate-800/50 p-4 justify-between z-30">
        <nav className="space-y-1.5">
          {navItems.filter(item => item.show).map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => handleNavClick(item.path)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active 
                    ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`h-4.5 w-4.5 ${active ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge > 0 && (
                  <span className={`text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center ${active ? 'bg-white text-primary' : 'bg-red-500 text-white animate-pulse'}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {user && (
          <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
            <button
              onClick={() => { logout(); navigate('/'); }}
              className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50/50 dark:hover:bg-red-950/20 transition-colors"
            >
              <LogOut className="h-4.5 w-4.5" />
              <span>{t('logout')}</span>
            </button>
          </div>
        )}
      </aside>

      {/* 3. MOBILE SLIDE-OUT DRAWER (HAMBURGER MENU) */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}>
          <div 
            className="absolute top-0 right-0 w-[260px] h-full bg-white dark:bg-slate-900 p-6 flex flex-col justify-between shadow-2xl transition-transform duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div className="flex justify-between items-center mb-6">
                <span className="font-bold text-slate-800 dark:text-slate-200">{t('appName')} Menu</span>
                <button onClick={() => setMobileMenuOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* User profile inside menu */}
              {user ? (
                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl mb-4 border border-slate-200/50 dark:border-slate-800/50">
                  <div className="font-semibold text-slate-800 dark:text-slate-200">{user.name}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{user.email}</div>
                  <span className={`text-[9px] font-bold uppercase rounded px-1.5 py-0.5 inline-block mt-2 ${getRoleBadgeColor(user.role)}`}>
                    {user.role}
                  </span>
                </div>
              ) : (
                <button
                  onClick={() => handleNavClick('/login')}
                  className="w-full bg-primary text-white py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center space-x-2 mb-4"
                >
                  <LogIn className="h-4.5 w-4.5" />
                  <span>{t('login')}</span>
                </button>
              )}

              <nav className="space-y-1">
                {navItems.filter(item => item.show).map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  return (
                    <button
                      key={item.path}
                      onClick={() => handleNavClick(item.path)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium ${
                        active 
                          ? 'bg-slate-100 dark:bg-slate-800 text-primary dark:text-blue-400' 
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className="h-4.5 w-4.5" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge > 0 && (
                        <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            {user && (
              <button
                onClick={() => { logout(); navigate('/'); setMobileMenuOpen(false); }}
                className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50/50 dark:hover:bg-red-950/20 transition-colors"
              >
                <LogOut className="h-4.5 w-4.5" />
                <span>{t('logout')}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 4. MOBILE BOTTOM TAB BAR */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200/50 dark:border-slate-800/50 py-1.5 px-3 flex items-center justify-around">
        {navItems.filter(item => item.show && ['/', '/report', '/feed', '/map-view', '/profile'].includes(item.path) || (item.path === '/profile' && !user && item.show)).map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              onClick={() => handleNavClick(item.path)}
              className={`flex flex-col items-center p-1.5 transition-colors relative ${
                active ? 'text-primary dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[9px] font-medium mt-0.5 leading-none">{item.label}</span>
              {item.badge > 0 && (
                <span className="absolute top-0 right-1 bg-red-500 text-white text-[8px] font-bold h-3.5 w-3.5 rounded-full flex items-center justify-center animate-bounce">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
        {/* If no user, show login as bottom tab icon */}
        {!user && (
          <button
            onClick={() => handleNavClick('/login')}
            className={`flex flex-col items-center p-1.5 transition-colors text-slate-400 dark:text-slate-500`}
          >
            <LogIn className="h-5 w-5" />
            <span className="text-[9px] font-medium mt-0.5 leading-none">{t('login')}</span>
          </button>
        )}
      </nav>
    </>
  );
};

export default Navbar;
