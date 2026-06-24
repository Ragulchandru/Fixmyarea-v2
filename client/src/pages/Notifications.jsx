import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Bell, Check, MessageSquare, AlertCircle, Award, CheckCircle2 } from 'lucide-react';

const Notifications = () => {
  const { t } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get('/api/issues/notifications');
      if (res.data.success) {
        setNotifications(res.data.notifications);
      }
    } catch (e) {
      console.error('Failed to load notifications', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id, issueId) => {
    try {
      const res = await axios.put(`/api/issues/notifications/${id}/read`);
      if (res.data.success) {
        // Update local list
        setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
        
        // Redirect to issue if ID is attached
        if (issueId) {
          navigate(`/issue-detail/${issueId}`);
        }
      }
    } catch (e) {
      console.error(e);
      if (issueId) navigate(`/issue-detail/${issueId}`);
    }
  };

  const handleMarkAllRead = async () => {
    const unread = notifications.filter(n => !n.isRead);
    if (unread.length === 0) return;

    try {
      const promises = unread.map(n => axios.put(`/api/issues/notifications/${n._id}/read`));
      await Promise.all(promises);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (e) {
      console.error(e);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'comment': return <MessageSquare className="h-5 w-5 text-indigo-500" />;
      case 'assignment': return <Award className="h-5 w-5 text-blue-500" />;
      case 'emergency': return <AlertCircle className="h-5 w-5 text-red-500 animate-pulse" />;
      default: return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-6 px-4 pb-12 animate-fade-in">
      
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2.5 m-0">
            <Bell className="h-6 w-6 text-primary" />
            <span>{t('notifications')}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1 pl-0.5">Stay updated on report verifications and comments</p>
        </div>

        {notifications.filter(n => !n.isRead).length > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="text-xs font-semibold text-primary dark:text-blue-400 hover:underline flex items-center space-x-1 cursor-pointer"
          >
            <Check className="h-3.5 w-3.5" />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {/* NOTIFICATIONS LIST */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(n => (
            <div key={n} className="bg-slate-100 dark:bg-slate-900 rounded-2xl h-20 animate-pulse border border-slate-200/20"></div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-12 rounded-3xl text-center text-slate-500 shadow-sm">
          <Bell className="h-10 w-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-850 dark:text-white m-0">No notifications</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">We'll alert you here when your report statuses change.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl overflow-hidden shadow-sm divide-y divide-slate-100 dark:divide-slate-850/80">
          {notifications.map((n) => (
            <div
              key={n._id}
              onClick={() => handleMarkAsRead(n._id, n.issueId)}
              className={`p-5 flex items-start space-x-4 cursor-pointer transition-colors relative hover:bg-slate-50 dark:hover:bg-slate-850/30 ${
                !n.isRead ? 'bg-primary/3 dark:bg-blue-500/2 font-semibold' : ''
              }`}
            >
              {/* Unread indicator */}
              {!n.isRead && (
                <div className="absolute top-1/2 left-3 w-1.5 h-1.5 bg-primary rounded-full -translate-y-1/2"></div>
              )}

              {/* Icon */}
              <div className="bg-slate-100 dark:bg-slate-950 p-2.5 rounded-xl shrink-0">
                {getIcon(n.type)}
              </div>

              {/* Body */}
              <div className="flex-1 space-y-0.5">
                <div className="flex justify-between items-center text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                  <span className="capitalize font-bold text-slate-500">{n.type} Alert</span>
                  <span>{new Date(n.createdAt).toLocaleDateString('en-IN')}</span>
                </div>
                <h4 className="text-sm text-slate-850 dark:text-white m-0 mt-0.5">{n.title}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 m-0 mt-1">{n.message}</p>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default Notifications;
