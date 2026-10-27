import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';
import EmptyState from '../../components/common/EmptyState';
import {
  Bell,
  CheckCircle2,
  Clock,
  Wrench,
  Check,
  RotateCcw,
  MessageSquare,
} from 'lucide-react';

export default function NotificationsPage() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, fetchNotifications } = useNotifications();
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'resolved':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'reopened':
        return <RotateCcw className="w-5 h-5 text-amber-500" />;
      case 'assignment':
        return <Wrench className="w-5 h-5 text-indigo-500" />;
      case 'comment':
        return <MessageSquare className="w-5 h-5 text-sky-500" />;
      default:
        return <Clock className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          <p className="text-sm text-slate-500">
            Real-time alerts for issue assignments, status transitions, and progress updates
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllAsRead}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition self-start sm:self-auto border border-indigo-200"
          >
            <Check className="w-4 h-4" /> Mark All as Read
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={Bell}
              title="No notifications"
              description="You're all caught up! You will be notified when tickets are assigned or progress is updated."
            />
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map((notif) => (
              <div
                key={notif._id}
                onClick={() => {
                  if (!notif.isRead) markAsRead(notif._id);
                  if (notif.issue?._id) {
                    navigate(`/issues/${notif.issue._id}`);
                  }
                }}
                className={`p-4 sm:p-5 hover:bg-slate-50 cursor-pointer transition flex items-start gap-4 ${
                  !notif.isRead ? 'bg-indigo-50/40' : ''
                }`}
              >
                <div className="p-2 rounded-xl bg-white border border-slate-100 shadow-sm mt-0.5">
                  {getNotificationIcon(notif.type)}
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-indigo-600 capitalize">
                      {notif.type} Alert
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(notif.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <p className="text-sm text-slate-800 font-medium leading-relaxed">
                    {notif.message}
                  </p>

                  {notif.issue && (
                    <span className="text-xs text-slate-500 font-mono block">
                      Ticket #{notif.issue.ticketNumber} • {notif.issue.title}
                    </span>
                  )}
                </div>

                {!notif.isRead && (
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 flex-shrink-0 mt-2" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
