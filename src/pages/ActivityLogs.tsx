import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { ActivityLog } from '../types';
import { useToast } from '../components/common/Toast';
import { History, Search, Filter, ShieldCheck, User } from 'lucide-react';

export const ActivityLogs: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedAction, setSelectedAction] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const { showToast } = useToast();

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await apiService.getActivityLogs({
        search,
        action: selectedAction || undefined,
        user_role: selectedRole || undefined,
        limit: 100,
      });
      setLogs(res.logs);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [search, selectedAction, selectedRole]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          Institutional Security & Activity Audit Log
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Tamper-evident system logs recording authentications, question paper uploads, downloads, and admissions.
        </p>
      </div>

      {/* Filter Row */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search description or user..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white"
          />
        </div>

        <div>
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="w-full py-2 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
          >
            <option value="">All Actions</option>
            <option value="LOGIN">LOGIN</option>
            <option value="LOGOUT">LOGOUT</option>
            <option value="EXAMINATION_UPLOAD">EXAMINATION_UPLOAD</option>
            <option value="EXAMINATION_DOWNLOAD">EXAMINATION_DOWNLOAD</option>
            <option value="STUDENT_CREATE">STUDENT_CREATE</option>
            <option value="TRAINER_CREATE">TRAINER_CREATE</option>
            <option value="COURSE_CREATE">COURSE_CREATE</option>
            <option value="BATCH_CREATE">BATCH_CREATE</option>
          </select>
        </div>

        <div>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="w-full py-2 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
          >
            <option value="">All Roles</option>
            <option value="SUPER_ADMIN">SUPER_ADMIN</option>
            <option value="CENTER_MANAGER">CENTER_MANAGER</option>
            <option value="ADMIN">ADMIN</option>
            <option value="TEAM_LEAD">TEAM_LEAD</option>
            <option value="COUNSELLOR">COUNSELLOR</option>
            <option value="TRAINER">TRAINER</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-16 text-center text-slate-500">
            <div className="w-8 h-8 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs">Loading audit trail...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <History className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-800">No activity logs recorded</p>
            <p className="text-xs text-slate-500 mt-1">Actions performed across the portal will be logged here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200 text-[11px]">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Action Event</th>
                  <th className="py-3 px-4">Audit Description</th>
                  <th className="py-3 px-4 text-right">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 tabular-nums text-slate-500 whitespace-nowrap">
                      {log.created_at}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                      {log.user_name || 'System'}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-mono text-[11px] font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                        {log.user_role}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-blue-700 whitespace-nowrap">
                      {log.action}
                    </td>
                    <td className="py-3 px-4 text-slate-700 leading-relaxed max-w-md">
                      {log.description}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-[11px] text-slate-400 tabular-nums whitespace-nowrap">
                      {log.ip_address || '127.0.0.1'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
