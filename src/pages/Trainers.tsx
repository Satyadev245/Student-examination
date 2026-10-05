import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import { Trainer, Course } from '../types';
import { StatusBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { useToast } from '../components/common/Toast';
import {
  Users2,
  Plus,
  Search,
  KeyRound,
  Edit2,
  Mail,
  Phone,
  BookOpen,
  Layers,
  FileText,
  UserCheck
} from 'lucide-react';
import trainerPortrait from '../assets/images/datapro_trainer_portrait_1791190526244.jpg';

export const Trainers: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [selectedCourseIds, setSelectedCourseIds] = useState<number[]>([]);
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [newPassword, setNewPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canManage = ['SUPER_ADMIN', 'ADMIN'].includes(user?.role || '');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tRes, cRes] = await Promise.all([
        apiService.getTrainers(),
        apiService.getCourses(),
      ]);
      setTrainers(tRes.trainers);
      setCourses(cRes.courses);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setName('');
    setUsername('');
    setEmail('');
    setMobile('');
    setPassword('');
    setSelectedCourseIds([]);
    setIsCreateOpen(true);
  };

  const openEditModal = (t: Trainer) => {
    setSelectedTrainer(t);
    setName(t.name);
    setEmail(t.email);
    setMobile(t.mobile || '');
    setStatus(t.status);
    setSelectedCourseIds(t.assignedCourses?.map((c) => c.id) || []);
    setIsEditOpen(true);
  };

  const openResetPasswordModal = (t: Trainer) => {
    setSelectedTrainer(t);
    setNewPassword('');
    setIsResetPasswordOpen(true);
  };

  const toggleCourseSelect = (cId: number) => {
    setSelectedCourseIds((prev) =>
      prev.includes(cId) ? prev.filter((id) => id !== cId) : [...prev, cId]
    );
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !username.trim() || !email.trim() || !password) {
      showToast('Name, username, email, and password are required.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await apiService.createTrainer({
        name: name.trim(),
        username: username.trim(),
        email: email.trim(),
        mobile: mobile.trim(),
        password,
        course_ids: selectedCourseIds,
      });
      showToast('Trainer registered successfully.', 'success');
      setIsCreateOpen(false);
      fetchData();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrainer) return;

    setSubmitting(true);
    try {
      await apiService.updateTrainer(selectedTrainer.id, {
        name: name.trim(),
        email: email.trim(),
        mobile: mobile.trim(),
        status,
        course_ids: selectedCourseIds,
      });
      showToast('Trainer profile updated successfully.', 'success');
      setIsEditOpen(false);
      fetchData();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrainer || !newPassword || newPassword.length < 6) {
      showToast('Password must be at least 6 characters.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await apiService.resetTrainerPassword(selectedTrainer.id, newPassword);
      showToast(`Password reset for ${selectedTrainer.name}.`, 'success');
      setIsResetPasswordOpen(false);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = trainers.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.username.toLowerCase().includes(search.toLowerCase()) ||
    t.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Certified Trainers Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Faculty credentials, course specializations, active batches, and examination upload records.
          </p>
        </div>

        {canManage && (
          <button
            onClick={openCreateModal}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Trainer</span>
          </button>
        )}
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
          placeholder="Search trainers by name, username, email..."
          className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600"
        />
      </div>

      {/* Grid of Trainers */}
      {loading ? (
        <div className="py-16 text-center text-slate-500">
          <div className="w-8 h-8 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs">Loading faculty roster...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
          <Users2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-800">No trainers found</p>
          <p className="text-xs text-slate-500 mt-1">Adjust search filter or register a new instructor.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((t) => (
            <div
              key={t.id}
              className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between hover:border-slate-300 transition-colors shadow-xs"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden">
                      {t.name.includes('Srinivas') || t.name === 'Raj Kumar' ? (
                        <img
                          src={trainerPortrait}
                          alt={t.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        t.name.charAt(0)
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 leading-tight">{t.name}</h3>
                      <span className="text-[11px] font-mono text-slate-500 block">@{t.username}</span>
                    </div>
                  </div>
                  <StatusBadge status={t.status} />
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600 space-y-1.5">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{t.email}</span>
                  </div>
                  {t.mobile && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="tabular-nums">{t.mobile}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-1">
                    <span className="text-slate-500">Active Batches:</span>
                    <span className="font-semibold text-slate-800 tabular-nums">
                      {t.active_batches_count || 0} Batches
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Exams Uploaded:</span>
                    <span className="font-semibold text-slate-800 tabular-nums">
                      {t.exam_uploads_count || 0} Papers
                    </span>
                  </div>
                </div>

                {/* Assigned Courses */}
                <div className="mt-3">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                    Specialized Curriculum Tracks:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {t.assignedCourses && t.assignedCourses.length > 0 ? (
                      t.assignedCourses.map((c) => (
                        <span
                          key={c.id}
                          className="bg-slate-100 text-slate-700 text-[10px] font-medium px-2 py-0.5 rounded"
                        >
                          {c.course_name}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 italic">No courses assigned yet.</span>
                    )}
                  </div>
                </div>
              </div>

              {canManage && (
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <button
                    onClick={() => openResetPasswordModal(t)}
                    className="inline-flex items-center gap-1 text-slate-600 hover:text-amber-600 font-medium transition-colors"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Reset Pass</span>
                  </button>

                  <button
                    onClick={() => openEditModal(t)}
                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Profile</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Trainer Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add Certified Trainer"
        subtitle="Create instructor login credentials and assign courses."
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Trainer Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. S. Naresh Babu"
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
                placeholder="e.g. naresh.trainer"
                required
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Official Email <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="trainer@datapro.in"
                required
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white"
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
              Assign Course Specializations
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 border border-slate-200 rounded-lg bg-slate-50">
              {courses.map((c) => (
                <label key={c.id} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedCourseIds.includes(c.id)}
                    onChange={() => toggleCourseSelect(c.id)}
                    className="w-3.5 h-3.5 rounded text-blue-600 border-slate-300"
                  />
                  <span className="truncate">{c.course_name}</span>
                </label>
              ))}
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
              {submitting ? 'Creating...' : 'Register Trainer'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Trainer Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Trainer Profile"
        subtitle={`Update details for ${selectedTrainer?.name}`}
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
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
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Mobile
              </label>
              <input
                type="text"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 tabular-nums focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Assigned Courses
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 border border-slate-200 rounded-lg bg-slate-50">
              {courses.map((c) => (
                <label key={c.id} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedCourseIds.includes(c.id)}
                    onChange={() => toggleCourseSelect(c.id)}
                    className="w-3.5 h-3.5 rounded text-blue-600 border-slate-300"
                  />
                  <span className="truncate">{c.course_name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        isOpen={isResetPasswordOpen}
        onClose={() => setIsResetPasswordOpen(false)}
        title="Reset Trainer Password"
        subtitle={`Set new password for ${selectedTrainer?.name} (@${selectedTrainer?.username})`}
      >
        <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
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
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsResetPasswordOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-xs disabled:opacity-50"
            >
              {submitting ? 'Resetting...' : 'Reset Password'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
