import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { NotificationItem } from '../types';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  browserPermission: NotificationPermission;
  requestPermission: () => Promise<boolean>;
  refreshNotifications: () => Promise<void>;
  markAllAsRead: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  simulatePushNotification: () => Promise<void>;
  activeToast: NotificationItem | null;
  dismissToast: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>(() => {
    return typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default';
  });
  const [activeToast, setActiveToast] = useState<NotificationItem | null>(null);

  const refreshNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      return;
    }
    try {
      const data = await api.getNotifications();
      setNotifications(data);
    } catch (err) {
      console.warn('Failed to fetch notifications', err);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      refreshNotifications();
      const interval = setInterval(refreshNotifications, 15000);
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
    }
  }, [user, refreshNotifications]);

  const requestPermission = async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }
    try {
      const permission = await Notification.requestPermission();
      setBrowserPermission(permission);
      return permission === 'granted';
    } catch {
      return false;
    }
  };

  const dispatchNativePush = (title: string, message: string) => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body: message,
          icon: '/favicon.ico'
        });
      } catch (e) {
        console.warn('Could not fire native notification:', e);
      }
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.markNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await api.markNotificationsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? ({ ...n, read: true }) : n));
    } catch (err) {
      console.error(err);
    }
  };

  const simulatePushNotification = async () => {
    try {
      const newNotif = await api.simulatePushNotification();
      setNotifications(prev => [newNotif, ...prev]);
      setActiveToast(newNotif);
      dispatchNativePush(newNotif.title, newNotif.message);
    } catch (err) {
      console.error(err);
    }
  };

  const dismissToast = () => {
    setActiveToast(null);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        browserPermission,
        requestPermission,
        refreshNotifications,
        markAllAsRead,
        markAsRead,
        simulatePushNotification,
        activeToast,
        dismissToast
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
