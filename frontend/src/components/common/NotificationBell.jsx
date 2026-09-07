import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { io } from 'socket.io-client';
import apiClient from '../../services/apiClient';
import { useAuth } from '../../contexts/AuthContext';
import { Bell, CheckCheck, X, CheckCircle2, AlertCircle, Clock } from 'lucide-react';

const rawSocketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001';
const SOCKET_URL = rawSocketUrl.trim().replace(/\/+$/, '').replace(/\/api$/, '');

export const NotificationBell = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const res = await apiClient.get('/notifications');
      if (res.success) {
        setNotifications(res.data || []);
        setUnreadCount(res.unreadCount || 0);
      }
    } catch (err) {
      // Handled silently
    }
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Initial fetch and 15s poll backup
  useEffect(() => {
    setNotifications([]);
    setUnreadCount(0);
    fetchNotifications();

    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [user?.id || user?._id]);

  // Real-Time Socket.IO event listener for instant push notifications
  useEffect(() => {
    const userId = user?.id || user?._id;
    const token = localStorage.getItem('token');
    if (!userId || !token) return;

    let socket;
    try {
      socket = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5,
        reconnectionDelay: 2000
      });

      socket.on('connect', () => {
        socket.emit('join_farmer', userId);
      });

      socket.on('notification:new', (newNotif) => {
        setNotifications((prev) => {
          const exists = prev.some((n) => (n._id || n.id) === (newNotif._id || newNotif.id));
          if (exists) return prev;
          return [newNotif, ...prev];
        });
        setUnreadCount((prev) => prev + 1);
      });
    } catch (err) {
      // Ignore socket setup failures
    }

    return () => {
      if (socket) socket.disconnect();
    };
  }, [user?.id || user?._id]);

  const handleMarkAsRead = async (id) => {
    try {
      await apiClient.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => ((n._id || n.id) === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      // Silent
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await apiClient.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      // Silent
    }
  };

  const handleNotificationClick = (n) => {
    if (!n.isRead) {
      handleMarkAsRead(n._id || n.id);
    }
    setIsOpen(false);

    const targetUrl = n.link || n.data?.link;
    const bookingId = n.bookingId || n.data?.bookingId;

    if (targetUrl) {
      navigate(targetUrl);
    } else if (bookingId) {
      navigate(`/farmer/procurement/${bookingId}`);
    } else if (user?.role === 'FARMER') {
      navigate('/farmer/bookings');
    }
  };

  const isHindi = i18n.language === 'hi';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xs border-2 border-dark-neutral bg-warm-ivory text-dark-neutral shadow-[2px_2px_0px_#22252A] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none transition-all focus:outline-none cursor-pointer"
        aria-label={t('nav.view_notifications', 'View notifications')}
      >
        <Bell className="w-4 h-4 text-forest-green" />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-red-600 text-white text-[10px] font-black rounded-xs border border-dark-neutral flex items-center justify-center animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-md shadow-brutal-lg border-2 border-dark-neutral z-50 overflow-hidden max-w-[calc(100vw-1.5rem)]">
          <div className="p-3 bg-warm-ivory border-b-2 border-dark-neutral flex items-center justify-between">
            <span className="text-xs font-black font-heading text-dark-neutral uppercase tracking-wider flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-forest-green" /> {t('nav.notifications', 'Notifications')}
              {unreadCount > 0 && (
                <span className="text-[10px] font-mono font-black bg-red-100 text-red-700 px-1.5 py-0.2 rounded border border-red-300">
                  {unreadCount} {isHindi ? 'नई' : 'new'}
                </span>
              )}
            </span>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="text-[11px] font-bold text-forest-green hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <CheckCheck className="w-3.5 h-3.5" /> {t('nav.mark_all_read', 'Mark all read')}
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded border border-dark-neutral bg-white hover:bg-gray-100 cursor-pointer"
                aria-label="Close notifications"
              >
                <X className="w-3.5 h-3.5 text-dark-neutral" />
              </button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y-2 divide-dark-neutral/10">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-dark-neutral-muted font-medium space-y-1">
                <Bell className="w-6 h-6 text-dark-neutral-muted/40 mx-auto" />
                <p>{t('nav.no_notifications', 'No notifications found.')}</p>
                <p className="text-[10px] text-gray-400">
                  {isHindi ? 'जैसे ही आपकी फसल यात्रा में कोई बदलाव होगा, यहाँ सूचना दिखेगी।' : 'Live updates about your slot, queue, and DBT transfer will appear here.'}
                </p>
              </div>
            ) : (
              notifications.map((n) => {
                const id = n._id || n.id;
                return (
                  <div
                    key={id}
                    onClick={() => handleNotificationClick(n)}
                    className={`p-3 text-xs transition-colors flex items-start justify-between gap-2 cursor-pointer hover:bg-emerald-50/70 ${
                      n.isRead
                        ? 'bg-white text-dark-neutral-muted'
                        : 'bg-emerald-50 font-semibold text-dark-neutral border-l-4 border-forest-green'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${n.isRead ? 'bg-gray-300' : 'bg-forest-green animate-pulse'}`} />
                        <h5 className="font-bold text-dark-neutral text-xs truncate">{n.title}</h5>
                      </div>
                      <p className="leading-snug text-dark-neutral-muted font-medium text-[11px] break-words">
                        {n.message}
                      </p>
                      <span className="text-[10px] text-gray-500 font-bold block mt-1.5">
                        {n.createdAt ? new Date(n.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                      </span>
                    </div>

                    {!n.isRead && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(id);
                        }}
                        className="px-2 py-0.5 rounded border border-dark-neutral bg-forest-green text-white text-[10px] font-black shrink-0 mt-1 shadow-[1px_1px_0px_#22252A] hover:bg-forest-green-dark cursor-pointer"
                      >
                        {t('nav.read', 'Read')}
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
