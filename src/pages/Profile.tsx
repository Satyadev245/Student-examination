import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import { useToast } from '../components/common/Toast';
import { User, Lock, Mail, Phone, ShieldCheck, KeyRound, CheckCircle2 } from 'lucide-react';

export const Profile: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [mobile, setMobile] = useState(user?.mobile || '');
  const [profileSaving, setProfileSaving] = useState(false);

  // Change password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      showToast('Name and email are required.', 'error');
      return;
    }
    setProfileSaving(true);
    try {
      await apiService.updateProfile({ name: name.trim(), email: email.trim(), mobile: mobile.trim() });
      await refreshUser();
      showToast('Profile updated successfully.', 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      showToast('Current and new password are required.', 'error');
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
    setPasswordSaving(true);
    try {
      await apiService.changePassword(currentPassword, newPassword);
      showToast('Password changed successfully.', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          Account Profile & Security
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Manage your official instructor/staff contact information and access credentials.
        </p>
      </div>

      {/* Role badge card */}
      <div className="p-5 bg-white rounded-xl border border-slate-200 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-lg">
            {user?.name.charAt(0)}
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">{user?.name}</h2>
            <p className="text-xs text-slate-500">@{user?.username} · {user?.email}</p>
          </div>
        </div>
        <div className="text-right">
          <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded">
            {user?.role}
          </span>
          <span className="block text-[11px] text-slate-400 mt-1">DataPro Gajuwaka</span>
        </div>
      </div>

      {/* Edit Profile Information */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-xs">
        <div className="border-b border-slate-100 pb-3 mb-5">
          <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <User className="w-4 h-4 text-slate-500" />
            Contact & Profile Details
          </h3>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Official Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Mobile Contact Number
            </label>
            <input
              type="text"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="+91 98480 12345"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 tabular-nums focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white"
            />
          </div>

          <div className="pt-2 text-right">
            <button
              type="submit"
              disabled={profileSaving}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs disabled:opacity-50"
            >
              {profileSaving ? 'Saving...' : 'Update Profile'}
            </button>
          </div>
        </form>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-xs">
        <div className="border-b border-slate-100 pb-3 mb-5">
          <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Lock className="w-4 h-4 text-slate-500" />
            Change Password
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Passwords must be at least 6 characters and will be securely hashed with bcrypt.
          </p>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                required
                minLength={6}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                required
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white"
              />
            </div>
          </div>

          <div className="pt-2 text-right">
            <button
              type="submit"
              disabled={passwordSaving}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs disabled:opacity-50"
            >
              {passwordSaving ? 'Updating...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
