import React from 'react';
import { X, Bell, BellRing, CheckCheck, Sparkles, ExternalLink } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { ActiveTab } from './Navbar';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: ActiveTab) => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  isOpen,
  onClose,
  onNavigateTab
}) => {
  const {
    notifications,
    unreadCount,
    browserPermission,
    requestPermission,
    markAllAsRead,
    markAsRead,
    simulatePushNotification
  } = useNotifications();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-xs">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-sky-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-white font-mono">
              Notifications & Alerts
            </h3>
            {unreadCount > 0 && (
              <span className="text-[10px] font-mono bg-blue-600 text-white px-2 py-0.5 rounded-full">
                {unreadCount} new
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Push Notification Permission Box */}
        <div className="p-3 bg-slate-950/50 border-b border-slate-800">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <BellRing className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <span className="font-semibold block">Browser Push Notifications</span>
                <span className="text-[11px] text-slate-400">
                  {browserPermission === 'granted' 
                    ? 'Active · You will receive estimate & status alerts' 
                    : 'Get real-time alerts when repair quotes arrive'}
                </span>
              </div>
            </div>

            {browserPermission !== 'granted' ? (
              <button
                type="button"
                onClick={requestPermission}
                className="px-2.5 py-1 text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-slate-950 rounded whitespace-nowrap"
              >
                Enable
              </button>
            ) : (
              <span className="text-[10px] font-mono text-emerald-400 border border-emerald-500/30 bg-emerald-950/40 px-2 py-0.5 rounded">
                ENABLED
              </span>
            )}
          </div>
        </div>

        {/* Action bar: simulate & mark read */}
        <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={simulatePushNotification}
            className="flex items-center gap-1.5 text-sky-400 hover:text-sky-300 font-medium"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Simulate Push Alert</span>
          </button>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllAsRead}
              className="flex items-center gap-1 text-slate-400 hover:text-slate-200"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark all read</span>
            </button>
          )}
        </div>

        {/* Notification list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 divide-y divide-slate-800/40">
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              No notifications yet. Try clicking "Simulate Push Alert" above to test real-time updates.
            </div>
          ) : (
            notifications.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  if (!item.read) markAsRead(item.id);
                  if (item.linkTab) {
                    onNavigateTab(item.linkTab as ActiveTab);
                    onClose();
                  }
                }}
                className={`pt-2.5 pb-1 px-3 rounded cursor-pointer transition-colors ${
                  item.read
                    ? 'bg-slate-900/40 hover:bg-slate-800/60'
                    : 'bg-blue-950/30 border border-blue-900/40 hover:bg-blue-900/40'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className={`text-xs font-semibold ${item.read ? 'text-slate-300' : 'text-blue-300'}`}>
                    {item.title}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 shrink-0">
                    {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {item.message}
                </p>
                {item.linkTab && (
                  <div className="mt-1.5 flex items-center gap-1 text-[11px] text-sky-400 font-medium">
                    <span>View in {item.linkTab}</span>
                    <ExternalLink className="w-3 h-3" />
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-500 text-center font-mono">
          Push alerts powered by Web Notifications API
        </div>

      </div>
    </div>
  );
};
