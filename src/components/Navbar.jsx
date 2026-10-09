import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, ChevronDown, LayoutGrid, LifeBuoy, UserCircle, Pencil, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../lib/api.js';

const NAV_LINKS = [
  { to: '/frilanserler', label: 'Freelancerlər' },
  { to: '/tapsiriqlar', label: 'Tapşırıqlar' },
  { to: '/layiheler', label: 'Layihələr' },
  { to: '/klub', label: 'Klub' },
];

const ACCOUNT_MENU_ITEMS = [
  { to: '/kabinet?tab=dashboard', label: 'Kabinet', icon: LayoutGrid },
  { to: '/destek', label: 'Dəstək', icon: LifeBuoy },
  { to: '/profil', label: 'Profil', icon: UserCircle },
  { to: '/kabinet?tab=personal_info', label: 'Redaktə et', icon: Pencil },
];

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationToasts, setNotificationToasts] = useState([]);
  const closeTimer = useRef(null);
  const knownNotificationIds = useRef(new Set());
  const { user, profileData, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === '/';

  const openAccountMenu = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setAccountMenuOpen(true);
  };
  const scheduleCloseAccountMenu = () => {
    closeTimer.current = setTimeout(() => setAccountMenuOpen(false), 150);
  };

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setNotificationToasts([]);
      knownNotificationIds.current = new Set();
      return undefined;
    }

    let initialized = false;
    let active = true;
    const refreshNotifications = async () => {
      try {
        const items = await api.getNotifications();
        if (!active) return;
        const newItems = items.filter((item) => !knownNotificationIds.current.has(item.id));
        if (initialized && newItems.length) {
          setNotificationToasts((current) => [...newItems, ...current].slice(0, 3));
        } else if (!initialized) {
          setNotificationToasts(items.filter((item) => !item.isRead).slice(0, 3));
          initialized = true;
        }
        knownNotificationIds.current = new Set(items.map((item) => item.id));
        setNotifications(items);
      } catch {
        // Keep the last known notification state when the server is temporarily unavailable.
      }
    };

    const onNotificationsRead = () => {
      setNotificationToasts([]);
      refreshNotifications();
    };
    refreshNotifications();
    const interval = window.setInterval(refreshNotifications, 30000);
    window.addEventListener('notifications-read', onNotificationsRead);
    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener('notifications-read', onNotificationsRead);
    };
  }, [user]);

  useEffect(() => {
    if (location.pathname === '/bildirimler') setNotificationOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const unreadCount = notifications.filter((item) => !item.isRead).length;
  const unreadMessageCount = notifications.filter((item) => item.type === 'message' && !item.isRead).length;
  const getNotificationPath = (item) => item.type === 'message'
    ? `/mesajlar?to=${item.referenceId}`
    : '/bildirimler';
  const markMessageNotificationRead = (item) => {
    if (item.type !== 'message') return;
    api.markNotificationRead(item.id)
      .then(() => window.dispatchEvent(new Event('notifications-read')))
      .catch(() => {});
  };
  const dismissNotification = (id) => {
    setNotificationToasts((current) => current.filter((item) => item.id !== id));
  };

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled || !isHome
          ? 'bg-white/80 backdrop-blur-xl border-b border-slate-200 shadow-sm py-4'
          : 'bg-transparent py-6'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2 cursor-pointer group">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-sky-400 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/30 group-hover:rotate-12 transition-transform">
            A
          </div>
          <span className="text-2xl font-black tracking-tight text-slate-900">
            Ailancer
          </span>
        </Link>

        <div className="hidden lg:flex items-center gap-8 font-semibold text-slate-600">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `hover:text-blue-600 transition-colors ${isActive ? 'text-blue-600' : ''}`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>

        <div className="hidden lg:flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              <Link to="/mesajlar" className="flex items-center gap-2 hover:text-blue-600 font-semibold text-slate-600 transition-colors">
                <span>Mesajlar</span>
                {unreadMessageCount > 0 && <span className="min-w-5 h-5 px-1 rounded-full bg-red-600 text-white text-xs font-bold flex items-center justify-center">{unreadMessageCount > 99 ? '99+' : unreadMessageCount}</span>}
              </Link>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setNotificationOpen((open) => !open)}
                  className="relative flex items-center gap-2 hover:text-blue-600 font-semibold text-slate-600 transition-colors"
                  title="Bildirişlər"
                  aria-label={`Bildirişlər${unreadCount ? `, ${unreadCount} oxunmamış` : ''}`}
                  aria-expanded={notificationOpen}
                >
                  <Bell className="w-[18px] h-[18px]" />
                  <span>Bildirişlər</span>
                  {unreadCount > 0 && <span className="min-w-5 h-5 px-1 rounded-full bg-red-600 text-white text-xs font-bold flex items-center justify-center">{unreadCount > 99 ? '99+' : unreadCount}</span>}
                </button>
                {notificationOpen && (
                  <div className="absolute right-0 top-full mt-4 w-80 max-h-[70vh] overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-2xl z-[60]">
                    <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                      <h2 className="font-bold text-slate-900">Bildirişlər</h2>
                      {unreadCount > 0 && <span className="text-xs font-semibold text-red-600">{unreadCount} oxunmamış</span>}
                    </div>
                    {notifications.length ? notifications.slice(0, 8).map((item) => (
                      <Link
                        key={item.id}
                        to={getNotificationPath(item)}
                        onClick={() => {
                          setNotificationOpen(false);
                          markMessageNotificationRead(item);
                        }}
                        className={`block px-4 py-3 border-b border-slate-100 hover:bg-slate-50 ${item.isRead ? '' : 'bg-blue-50/70'}`}
                      >
                        <p className="text-sm font-bold text-slate-900">{item.title}</p>
                        <p className="text-xs text-slate-600 mt-1 line-clamp-2">{item.description}</p>
                      </Link>
                    )) : <p className="px-4 py-6 text-sm text-slate-500 text-center">Hələ bildiriş yoxdur.</p>}
                    <Link to="/bildirimler" onClick={() => setNotificationOpen(false)} className="block px-4 py-3 text-center text-sm font-bold text-blue-700 hover:bg-blue-50">Bütün bildirişlərə bax</Link>
                  </div>
                )}
              </div>

              {/* Account dropdown — "curtain" reveal on hover */}
              <div
                className="relative"
                onMouseEnter={openAccountMenu}
                onMouseLeave={scheduleCloseAccountMenu}
              >
                <button
                  onClick={() => setAccountMenuOpen((v) => !v)}
                  className="flex items-center gap-2 hover:bg-slate-100 px-3 py-2 rounded-lg transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                    {profileData.fullName ? profileData.fullName.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className="font-bold text-sm text-slate-700">Kabinetim</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${accountMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Invisible bridge so the curtain doesn't close on the gap between trigger & panel */}
                <div className="absolute left-0 top-full w-full h-3" />

                <div
                  className={`account-curtain absolute right-0 top-full mt-3 w-64 origin-top ${
                    accountMenuOpen ? 'account-curtain-open' : 'account-curtain-closed'
                  }`}
                >
                  <div className="bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-2xl shadow-slate-900/10 overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100">
                      <p className="font-bold text-slate-900 truncate">{profileData.fullName || 'İstifadəçi'}</p>
                      <p className="text-xs text-slate-400 truncate">{user.email}</p>
                    </div>
                    <div className="py-2">
                      {ACCOUNT_MENU_ITEMS.map((item) => (
                        <Link
                          key={item.label}
                          to={item.to}
                          className="flex items-center gap-3 px-5 py-3 text-slate-600 font-semibold hover:bg-blue-50 hover:text-blue-600 transition-colors"
                        >
                          <item.icon className="w-[18px] h-[18px]" />
                          {item.label}
                        </Link>
                      ))}
                    </div>
                    <div className="py-2 border-t border-slate-100">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-5 py-3 text-red-500 font-semibold hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-[18px] h-[18px]" />
                        Çıxış et
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              <Link to="/giris" className="text-slate-600 hover:text-slate-900 font-bold px-4 py-2 transition-colors">
                Daxil ol
              </Link>
              <Link
                to="/giris?mode=register"
                className="bg-slate-900 text-white px-6 py-2.5 rounded-full font-bold hover:bg-blue-600 transition-all shadow-lg hover:shadow-blue-600/30 hover:-translate-y-0.5"
              >
                Qeydiyyat
              </Link>
            </>
          )}
        </div>

        <button
          className="lg:hidden text-slate-900 bg-white/50 p-2 rounded-lg backdrop-blur-md border border-slate-200"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? 'Menyunu bağla' : 'Menyunu aç'}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="absolute top-full left-0 w-full bg-white/95 backdrop-blur-xl border-b border-slate-200 shadow-2xl py-6 px-6 flex flex-col gap-4 lg:hidden">
          {NAV_LINKS.map((link) => (
            <Link key={link.to} to={link.to} className="text-left py-2 text-lg font-bold text-slate-800 hover:text-blue-600">
              {link.label}
            </Link>
          ))}
          <div className="h-px bg-slate-100 my-2" />
          {user ? (
            <>
              <Link to="/mesajlar" className="flex items-center justify-between text-left py-2 text-lg font-bold text-slate-800">
                <span>Mesajlar</span>
                {unreadMessageCount > 0 && <span className="min-w-6 h-6 px-1 rounded-full bg-red-600 text-white text-xs flex items-center justify-center">{unreadMessageCount > 99 ? '99+' : unreadMessageCount}</span>}
              </Link>
              <Link to="/bildirimler" className="flex items-center justify-between text-left py-2 text-lg font-bold text-slate-800">
                <span>Bildirişlər</span>
                {unreadCount > 0 && <span className="min-w-6 h-6 px-1 rounded-full bg-red-600 text-white text-xs flex items-center justify-center">{unreadCount > 99 ? '99+' : unreadCount}</span>}
              </Link>
              {ACCOUNT_MENU_ITEMS.map((item) => (
                <Link key={item.label} to={item.to} className="flex items-center gap-3 text-left py-2 text-lg font-bold text-slate-800">
                  <item.icon className="w-5 h-5 text-slate-400" />
                  {item.label}
                </Link>
              ))}
              <button onClick={handleLogout} className="flex items-center gap-3 text-left py-2 text-lg font-bold text-red-500">
                <LogOut className="w-5 h-5" />
                Çıxış et
              </button>
            </>
          ) : (
            <>
              <Link to="/giris" className="text-left py-2 text-lg font-bold text-slate-800">Daxil ol</Link>
              <Link to="/giris?mode=register" className="bg-blue-600 text-white text-center py-4 rounded-xl font-bold mt-2 shadow-lg shadow-blue-600/30">
                Qeydiyyatdan Keç
              </Link>
            </>
          )}
        </div>
      )}

      {notificationToasts.length > 0 && (
        <aside aria-live="polite" className="fixed right-4 top-24 z-[60] w-[min(24rem,calc(100vw-2rem))] space-y-3">
          {notificationToasts.map((item) => (
            <div key={item.id} className="flex gap-3 rounded-xl border border-blue-200 bg-white p-4 shadow-xl">
              <Bell className="w-5 h-5 shrink-0 text-blue-600 mt-0.5" />
              <Link to={getNotificationPath(item)} className="min-w-0 flex-1" onClick={() => {
                dismissNotification(item.id);
                markMessageNotificationRead(item);
              }}>
                <p className="font-bold text-slate-900">{item.title}</p>
                <p className="mt-1 text-sm text-slate-600 line-clamp-2">{item.description}</p>
                <span className="mt-2 block text-xs font-semibold text-blue-700">Bildirişlərə bax</span>
              </Link>
              <button type="button" onClick={() => dismissNotification(item.id)} className="h-7 w-7 shrink-0 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Bildirişi bağla">
                <X className="w-4 h-4 mx-auto" />
              </button>
            </div>
          ))}
        </aside>
      )}
    </nav>
  );
}
