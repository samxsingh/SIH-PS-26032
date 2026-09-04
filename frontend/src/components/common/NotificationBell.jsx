import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import apiClient from '../../services/apiClient';
import { Bell, CheckCheck, X } from 'lucide-react';

export const NotificationBell = () => {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

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

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000); // 10s poll
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await apiClient.patch(`/notifications/${id}/read`);
      fetchNotifications();
    } catch (err) {
      // Silent
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await apiClient.patch('/notifications/read-all');
      fetchNotifications();
    } catch (err) {
      // Silent
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xs border-2 border-dark-neutral bg-warm-ivory text-dark-neutral shadow-[2px_2px_0px_#22252A] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none transition-all focus:outline-none"
        aria-label={t('nav.view_notifications')}
      >
        <Bell className="w-4 h-4 text-forest-green" />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-600 text-white text-[10px] font-black rounded-xs border border-dark-neutral flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-md shadow-brutal-lg border-2 border-dark-neutral z-50 overflow-hidden">
          <div className="p-3 bg-warm-ivory border-b-2 border-dark-neutral flex items-center justify-between">
            <span className="text-xs font-black font-heading text-dark-neutral uppercase tracking-wider flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-forest-green" /> {t('nav.notifications')}
            </span>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-[11px] font-bold text-forest-green hover:underline flex items-center gap-1"
                >
                  <CheckCheck className="w-3.5 h-3.5" /> {t('nav.mark_all_read')}
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded border border-dark-neutral bg-white hover:bg-gray-100"
              >
                <X className="w-3.5 h-3.5 text-dark-neutral" />
              </button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y-2 divide-dark-neutral/10">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-dark-neutral-muted font-medium">
                {t('nav.no_notifications')}
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id || n.id}
                  className={`p-3 text-xs transition-colors flex items-start justify-between gap-2 ${
                    n.isRead ? 'bg-white text-dark-neutral-muted' : 'bg-forest-green-light font-semibold text-dark-neutral'
                  }`}
                >
                  <div>
                    <h5 className="font-bold text-dark-neutral text-xs mb-0.5">{n.title}</h5>
                    <p className="leading-snug text-dark-neutral-muted font-medium">{n.message}</p>
                    <span className="text-[10px] text-gray-500 font-bold block mt-1">
                      {new Date(n.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {!n.isRead && (
                    <button
                      onClick={() => handleMarkAsRead(n._id || n.id)}
                      className="px-2 py-0.5 rounded border border-dark-neutral bg-forest-green text-white text-[10px] font-black shrink-0 mt-1 shadow-[1px_1px_0px_#22252A]"
                    >
                      {t('nav.read')}
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
