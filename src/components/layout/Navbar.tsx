import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Bell, LogOut, User, CheckCheck, Menu, Shield, KeyRound, Lock } from 'lucide-react';
import { apiService } from '../../services/api';
import { NotificationItem } from '../../types';
import { useToast } from '../common/Toast';
import { Modal } from '../common/Modal';

interface NavbarProps {
  onToggleMobileSidebar: () => void;
  onOpenExamPreview: (examId: number) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleMobileSidebar, onOpenExamPreview }) => {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [showUserMenu, setShowUserMenu] = useState<boolean>(false);
  const [showPasswordModal, setShowPasswordModal] = useState<boolean>(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      showToast('Both current and new password are required.', 'error');
      return;
    }
    if (newPassword.length < 6) {
      showToast('New password must be at least 6 characters.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match.', 'error');
      return;
    }

    setSavingPassword(true);
    try {
      await apiService.changePassword(currentPassword, newPassword);
      showToast('Password updated successfully.', 'success');
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      showToast(err.message || 'Failed to update password.', 'error');
    } finally {
      setSavingPassword(false);
    }
  };

  const fetchNotifs = async () => {
    try {
      const data = await apiService.getNotifications();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch {
      // quiet fail on background poll
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifs();
      const interval = setInterval(fetchNotifs, 15000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
      onOpenExamPreview(item.examination_id);
      setShowNotifications(false);
    }
  };

  const formatRoleLabel = (role: string) => {
    return role.replace(/_/g, ' ');
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Zone 1: Mobile toggle & Brand wordmark */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>
        <a href="#/dashboard" className="text-base sm:text-lg font-bold tracking-tight text-slate-900 truncate">
          DataPro Institute
        </a>
      </div>

      {/* Zone 2: Navigation / Contextual Breadcrumb */}
      <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 font-medium">
        <span>Gajuwaka Center</span>
        <span aria-hidden="true">·</span>
        <span className="text-slate-700">Examination Portal</span>
        <span aria-hidden="true">·</span>
        <span className="text-blue-700 font-semibold">{formatRoleLabel(user?.role || '')}</span>
      </div>

      {/* Zone 3: Actions (Notifications & User Menu) */}
      <div className="flex items-center gap-2.5">
        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-600 rounded-full ring-2 ring-white" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden z-50">
              <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Notifications</h4>
                  {unreadCount > 0 && (
                    <span className="text-xs text-rose-600 font-semibold">({unreadCount} new)</span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Mark all read</span>
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">No notifications at this time.</div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={`p-3 text-xs hover:bg-slate-50 cursor-pointer transition-colors ${
                        !n.is_read ? 'bg-blue-50/40 font-medium' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-slate-900 text-xs truncate">{n.title}</span>
                        <span className="text-[10px] text-slate-400 tabular-nums">
                          {n.created_at.substring(5, 16)}
                        </span>
                      </div>
                      <p className="text-slate-600 text-xs leading-relaxed">{n.message}</p>
                      {n.examination_id && (
                        <span className="text-[11px] text-blue-600 hover:underline mt-1 block">
                          Click to view exam paper →
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu */}
        <div className="relative" ref={userRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-left"
          >
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-semibold">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="hidden sm:block text-xs leading-tight">
              <span className="font-semibold text-slate-900 block truncate max-w-[120px]">{user?.name}</span>
              <span className="text-[11px] text-slate-500 block">{formatRoleLabel(user?.role || '')}</span>
            </div>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 text-xs">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="font-semibold text-slate-900 truncate">{user?.name}</p>
                <p className="text-slate-500 truncate">{user?.email}</p>
                <span className="inline-block mt-1 text-[10px] uppercase font-bold text-blue-700 tracking-wider">
                  {formatRoleLabel(user?.role || '')}
                </span>
              </div>

              <a
                href="#/profile"
                onClick={() => setShowUserMenu(false)}
                className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-slate-50"
              >
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>My Profile & Security</span>
              </a>

              <button
                type="button"
                onClick={() => {
                  setShowUserMenu(false);
                  setShowPasswordModal(true);
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-slate-50 text-left"
              >
                <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                <span>Change Password</span>
              </button>

              <button
                onClick={() => {
                  setShowUserMenu(false);
                  logout();
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-rose-600 hover:bg-rose-50 text-left border-t border-slate-100"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Quick Change Password Modal */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title="Change Your Account Password"
        subtitle={`Update login credentials for ${user?.name} (${user?.username})`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handlePasswordSubmit} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Current Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                required
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              New Password <span className="text-rose-500">*</span>
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              required
              minLength={6}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Confirm New Password <span className="text-rose-500">*</span>
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-type new password"
              required
              minLength={6}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white"
            />
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-500 flex items-start gap-2">
            <Shield className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
            <span>Passwords are immediately hashed using bcrypt with 10 salt rounds and verified against security policies.</span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowPasswordModal(false)}
              className="px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingPassword}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors"
            >
              {savingPassword ? 'Updating...' : 'Save New Password'}
            </button>
          </div>
        </form>
      </Modal>
    </header>
  );
};
