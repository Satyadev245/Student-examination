import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { User, Role } from '../types';
import { StatusBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { useToast } from '../components/common/Toast';
import { ShieldCheck, Plus, Search, UserX, UserCheck, Key } from 'lucide-react';

export const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [resetModalUser, setResetModalUser] = useState<User | null>(null);
  const [resetPasswordVal, setResetPasswordVal] = useState('');
  const [resetting, setResetting] = useState(false);
  const { showToast } = useToast();

  // Form Fields
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [roleId, setRoleId] = useState('3'); // Default to ADMIN
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [uRes, rRes] = await Promise.all([
        apiService.getUsers(),
        apiService.getRoles(),
      ]);
      setUsers(uRes.users);
      setRoles(rRes.roles as any);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleStatus = async (userItem: User) => {
    const newStatus = userItem.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await apiService.updateUserStatus(userItem.id, newStatus);
      showToast(`User ${userItem.name} set to ${newStatus}.`, 'success');
      setUsers((prev) =>
        prev.map((u) => (u.id === userItem.id ? { ...u, status: newStatus } : u))
      );
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalUser) return;
    if (!resetPasswordVal || resetPasswordVal.length < 6) {
      showToast('New password must be at least 6 characters long.', 'error');
      return;
    }

    setResetting(true);
    try {
      await apiService.resetUserPassword(resetModalUser.id, resetPasswordVal);
      showToast(`Password updated successfully for ${resetModalUser.name}.`, 'success');
      setResetModalUser(null);
      setResetPasswordVal('');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setResetting(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !username.trim() || !email.trim() || !password) {
      showToast('All fields marked * are required.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await apiService.createUser({
        name: name.trim(),
        username: username.trim(),
        email: email.trim(),
        mobile: mobile.trim() || null,
        password,
        role_id: parseInt(roleId, 10),
      });
      showToast('New user account created successfully.', 'success');
      setIsCreateOpen(false);
      setName('');
      setUsername('');
      setEmail('');
      setMobile('');
      fetchData();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            System User Management & Access Control
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Super Administrator console to manage roles, permissions, staff access, and account states.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add System User</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, username, email, role..."
          className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600"
        />
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-16 text-center text-slate-500">
            <div className="w-8 h-8 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs">Loading user repository...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-800">No users found</p>
            <p className="text-xs text-slate-500 mt-1">Adjust search parameters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200 text-[11px]">
                <tr>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Username</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Assigned Role</th>
                  <th className="py-3 px-4">Last Login</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Account Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                      {u.name}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                      @{u.username}
                    </td>
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                      {u.email}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-mono text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 tabular-nums text-slate-500 text-[11px] whitespace-nowrap">
                      {u.last_login || 'Never'}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <StatusBadge status={u.status} />
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => {
                          setResetModalUser(u);
                          setResetPasswordVal('');
                        }}
                        className="px-2.5 py-1 rounded text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors mr-2"
                        title="Change/Reset password"
                      >
                        Reset Password
                      </button>
                      {u.role !== 'SUPER_ADMIN' && (
                        <button
                          onClick={() => handleToggleStatus(u)}
                          className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                            u.status === 'ACTIVE'
                              ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          }`}
                        >
                          {u.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create New System User"
        subtitle="Provision an administrative, managerial, or trainer account."
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. S. Lakshmi"
                required
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Username <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                placeholder="e.g. lakshmi.admin"
                required
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@datapro.in"
                required
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Role Permission <span className="text-rose-500">*</span>
              </label>
              <select
                value={roleId}
                onChange={(e) => setRoleId(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white font-medium"
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.role_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Initial Password <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Mobile Number
              </label>
              <input
                type="text"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="+91 98480 12345"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 tabular-nums focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create User Account'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        isOpen={!!resetModalUser}
        onClose={() => setResetModalUser(null)}
        title="Reset User Password"
        subtitle={`Set a new access password for ${resetModalUser?.name} (@${resetModalUser?.username})`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              New Password <span className="text-rose-500">*</span>
            </label>
            <input
              type="password"
              value={resetPasswordVal}
              onChange={(e) => setResetPasswordVal(e.target.value)}
              placeholder="Minimum 6 characters"
              required
              minLength={6}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Enter the new password to assign to this user. It will be encrypted with bcrypt immediately.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setResetModalUser(null)}
              className="px-3.5 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={resetting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs disabled:opacity-50"
            >
              {resetting ? 'Updating...' : 'Set New Password'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
