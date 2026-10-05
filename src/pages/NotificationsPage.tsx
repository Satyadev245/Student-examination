import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { NotificationItem } from '../types';
import { useToast } from '../components/common/Toast';
import { Bell, CheckCheck, FileText, ArrowRight } from 'lucide-react';

interface NotificationsPageProps {
  onPreviewExam: (id: number) => void;
}

export const NotificationsPage: React.FC<NotificationsPageProps> = ({ onPreviewExam }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const fetchNotifs = async () => {
    setLoading(true);
    try {
      const res = await apiService.getNotifications();
      setNotifications(res.notifications);
      setUnreadCount(res.unreadCount);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await apiService.markAllNotificationsRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
      showToast('All notifications marked as read.', 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleNotificationClick = async (item: NotificationItem) => {
    if (!item.is_read) {
      try {
        await apiService.markNotificationRead(item.id);
        setUnreadCount((c) => Math.max(0, c - 1));
        setNotifications((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, is_read: 1 } : n))
        );
      } catch (e) {
        console.error(e);
      }
    }
    if (item.examination_id) {
      onPreviewExam(item.examination_id);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Notification Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time examination upload alerts and academic schedule broadcasts.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-blue-700 border border-slate-200 rounded-lg text-xs font-semibold shadow-xs transition-colors shrink-0"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Mark All As Read</span>
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-16 text-center text-slate-500">
            <div className="w-8 h-8 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <Bell className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-800">No notifications found</p>
            <p className="text-xs text-slate-500 mt-1">
              New examination submissions and faculty activities will trigger alerts here.
            </p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => handleNotificationClick(n)}
              className={`p-4 sm:p-5 flex items-start justify-between gap-4 hover:bg-slate-50/80 cursor-pointer transition-colors ${
                !n.is_read ? 'bg-blue-50/30' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    !n.is_read ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900">{n.title}</h3>
                    {!n.is_read && (
                      <span className="w-2 h-2 rounded-full bg-blue-600" aria-label="Unread" />
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                  {n.examination_id && (
                    <span className="text-xs font-semibold text-blue-600 hover:text-blue-800 mt-2 inline-flex items-center gap-1">
                      <span>Inspect Examination Paper</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>
              </div>
              <span className="text-[11px] text-slate-400 tabular-nums shrink-0 whitespace-nowrap">
                {n.created_at.substring(0, 16)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
