import React from 'react';
import { Wrench, Bell, LogOut, User as UserIcon, ShieldCheck, Scale, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

export type ActiveTab = 'dashboard' | 'analyzer' | 'wizard' | 'estimates' | 'locator' | 'files';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenNotifications: () => void;
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenNotifications,
  onOpenAuth
}) => {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs text-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        
        {/* Zone 1: Mechanical Storefront Wordmark */}
        <div 
          onClick={() => setActiveTab('dashboard')}
          className="flex items-center gap-3 cursor-pointer shrink-0 select-none group"
        >
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 flex items-center justify-center text-white shadow-sm group-hover:scale-[1.02] transition-transform">
            <Wrench className="w-5 h-5 text-sky-400" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-tight text-lg text-slate-900 font-mech">
                FIXBEFOREBUY
              </span>
              <span className="text-[10px] font-mono font-bold tracking-wider px-1.5 py-0.5 rounded bg-slate-100 border border-slate-300 text-slate-700 uppercase">
                STOREFRONT
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-500 tracking-wider uppercase -mt-0.5">
              Precision Appliance Workshop & Decision Desk
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-1.5">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-md transition-all whitespace-nowrap font-mech ${
              activeTab === 'dashboard'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Dashboard
          </button>

          <button
            onClick={() => setActiveTab('analyzer')}
            className={`px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all whitespace-nowrap flex items-center gap-1.5 font-mech ${
              activeTab === 'analyzer'
                ? 'bg-blue-600 text-white shadow-xs ring-1 ring-blue-700'
                : 'text-blue-700 bg-blue-50/80 hover:bg-blue-100 border border-blue-200'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            Repair vs. Replace
          </button>

          <button
            onClick={() => setActiveTab('wizard')}
            className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-md transition-all whitespace-nowrap flex items-center gap-1.5 font-mech ${
              activeTab === 'wizard'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            Diagnostics
          </button>

          <button
            onClick={() => setActiveTab('estimates')}
            className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-md transition-all whitespace-nowrap font-mech ${
              activeTab === 'estimates'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Estimates
          </button>

          <button
            onClick={() => setActiveTab('locator')}
            className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-md transition-all whitespace-nowrap flex items-center gap-1.5 font-mech ${
              activeTab === 'locator'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            Service Centers
          </button>

          <button
            onClick={() => setActiveTab('files')}
            className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-md transition-all whitespace-nowrap font-mech ${
              activeTab === 'files'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            File Vault
          </button>
        </nav>

        {/* Zone 3: Primary Actions (Push Bell, Profile, Sign Out / Sign In) */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Push notification bell */}
          <button
            onClick={onOpenNotifications}
            title="Push Notifications"
            className="relative p-2 rounded-lg bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-700 hover:text-slate-900 transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 text-white font-mono font-bold text-[10px] rounded-full flex items-center justify-center animate-pulse shadow-xs">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {user ? (
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-bold text-slate-900 truncate max-w-[140px] leading-tight font-mech">
                  {user.name}
                </span>
                <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1 justify-end font-semibold">
                  <ShieldCheck className="w-3 h-3 text-blue-600" />
                  {user.role === 'technician' ? 'PRO TECH' : 'VERIFIED'}
                </span>
              </div>

              <button
                onClick={logout}
                title="Sign Out"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-red-700 bg-slate-100 hover:bg-red-50 border border-slate-200 hover:border-red-200 rounded-md transition-colors whitespace-nowrap"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-md transition-all whitespace-nowrap shadow-xs uppercase tracking-wider font-mech"
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>Sign In / Demo</span>
            </button>
          )}
        </div>

      </div>

      {/* Mobile subnavigation bar */}
      <div className="md:hidden flex items-center justify-around border-t border-slate-200 bg-white py-2 px-1 text-[11px] overflow-x-auto shadow-xs">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-2 py-1 rounded font-semibold whitespace-nowrap ${
            activeTab === 'dashboard' ? 'text-blue-700 font-bold bg-blue-50' : 'text-slate-600'
          }`}
        >
          Dashboard
        </button>
        <button
          onClick={() => setActiveTab('analyzer')}
          className={`px-2.5 py-1 rounded font-bold whitespace-nowrap ${
            activeTab === 'analyzer' ? 'text-white bg-blue-600' : 'text-blue-600 bg-blue-50'
          }`}
        >
          Repair vs Replace
        </button>
        <button
          onClick={() => setActiveTab('wizard')}
          className={`px-2 py-1 rounded font-semibold whitespace-nowrap ${
            activeTab === 'wizard' ? 'text-blue-700 font-bold bg-blue-50' : 'text-slate-600'
          }`}
        >
          Diagnose
        </button>
        <button
          onClick={() => setActiveTab('estimates')}
          className={`px-2 py-1 rounded font-semibold whitespace-nowrap ${
            activeTab === 'estimates' ? 'text-blue-700 font-bold bg-blue-50' : 'text-slate-600'
          }`}
        >
          Estimates
        </button>
        <button
          onClick={() => setActiveTab('locator')}
          className={`px-2 py-1 rounded font-semibold whitespace-nowrap ${
            activeTab === 'locator' ? 'text-blue-700 font-bold bg-blue-50' : 'text-slate-600'
          }`}
        >
          Centers
        </button>
        <button
          onClick={() => setActiveTab('files')}
          className={`px-2 py-1 rounded font-semibold whitespace-nowrap ${
            activeTab === 'files' ? 'text-blue-700 font-bold bg-blue-50' : 'text-slate-600'
          }`}
        >
          Vault
        </button>
      </div>
    </header>
  );
};
