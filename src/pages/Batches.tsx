import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import { Batch, Course, Trainer } from '../types';
import { StatusBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { useToast } from '../components/common/Toast';
import { Layers, Plus, Search, Edit2, Clock, Calendar, Users, BookOpen } from 'lucide-react';

export const Batches: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);

  // Form fields
  const [batchName, setBatchName] = useState('');
  const [batchCode, setBatchCode] = useState('');
  const [courseId, setCourseId] = useState('');
  const [trainerId, setTrainerId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [timing, setTiming] = useState('10:00 AM – 12:00 PM');
  const [status, setStatus] = useState<'ACTIVE' | 'COMPLETED' | 'INACTIVE'>('ACTIVE');
  const [submitting, setSubmitting] = useState(false);

  const canManage = ['SUPER_ADMIN', 'ADMIN', 'CENTER_MANAGER'].includes(user?.role || '');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bRes, cRes, tRes] = await Promise.all([
        apiService.getBatches(),
        apiService.getCourses(),
        canManage ? apiService.getTrainers() : Promise.resolve({ trainers: [] }),
      ]);
      setBatches(bRes.batches);
      setCourses(cRes.courses);
      setTrainers(tRes.trainers);
      if (cRes.courses.length > 0 && !courseId) {
        setCourseId(String(cRes.courses[0].id));
      }
      if (tRes.trainers.length > 0 && !trainerId) {
        setTrainerId(String(tRes.trainers[0].id));
      }
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
    setEditingBatch(null);
    setBatchName('');
    setBatchCode('');
    setStartDate(new Date().toISOString().substring(0, 10));
    setEndDate('');
    setTiming('10:00 AM – 12:00 PM');
    setStatus('ACTIVE');
    setIsModalOpen(true);
  };

  const openEditModal = (b: Batch) => {
    setEditingBatch(b);
    setBatchName(b.batch_name);
    setBatchCode(b.batch_code);
    setCourseId(String(b.course_id));
    setTrainerId(String(b.trainer_id));
    setStartDate(b.start_date);
    setEndDate(b.end_date || '');
    setTiming(b.timing);
    setStatus(b.status as any);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchName.trim() || !batchCode.trim() || !courseId || !trainerId || !startDate || !timing.trim()) {
      showToast('All fields marked * are required.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      if (editingBatch) {
        await apiService.updateBatch(editingBatch.id, {
          batch_name: batchName.trim(),
          course_id: parseInt(courseId, 10),
          trainer_id: parseInt(trainerId, 10),
          start_date: startDate,
          end_date: endDate || undefined,
          timing: timing.trim(),
          status,
        });
        showToast('Batch updated successfully.', 'success');
      } else {
        await apiService.createBatch({
          batch_name: batchName.trim(),
          batch_code: batchCode.trim().toUpperCase(),
          course_id: parseInt(courseId, 10),
          trainer_id: parseInt(trainerId, 10),
          start_date: startDate,
          end_date: endDate || undefined,
          timing: timing.trim(),
        });
        showToast('New batch created successfully.', 'success');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = batches.filter((b) =>
    b.batch_name.toLowerCase().includes(search.toLowerCase()) ||
    b.batch_code.toLowerCase().includes(search.toLowerCase()) ||
    b.course_name?.toLowerCase().includes(search.toLowerCase()) ||
    b.trainer_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            {user?.role === 'TRAINER' ? 'My Assigned Batches' : 'Batch Schedule & Management'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Class schedules, assigned faculty, enrolled student capacity, and examination timelines.
          </p>
        </div>

        {canManage && (
          <button
            onClick={openCreateModal}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Batch</span>
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
          placeholder="Search batches by code, course, trainer, timing..."
          className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-16 text-center text-slate-500">
            <div className="w-8 h-8 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs">Loading batch roster...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <Layers className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-800">No batches found</p>
            <p className="text-xs text-slate-500 mt-1">Check search terms or create a new batch.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200 text-[11px]">
                <tr>
                  <th className="py-3 px-4">Batch Code</th>
                  <th className="py-3 px-4">Batch Name</th>
                  <th className="py-3 px-4">Course Track</th>
                  <th className="py-3 px-4">Trainer</th>
                  <th className="py-3 px-4">Timings</th>
                  <th className="py-3 px-4">Start / End</th>
                  <th className="py-3 px-4 text-right">Students</th>
                  <th className="py-3 px-4">Status</th>
                  {canManage && <th className="py-3 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-blue-700 whitespace-nowrap">
                      {b.batch_code}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                      {b.batch_name}
                    </td>
                    <td className="py-3 px-4 text-slate-700 whitespace-nowrap">
                      {b.course_name}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800 whitespace-nowrap">
                      {b.trainer_name}
                    </td>
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                      {b.timing}
                    </td>
                    <td className="py-3 px-4 tabular-nums text-slate-500 text-[11px] whitespace-nowrap">
                      {b.start_date} {b.end_date ? `to ${b.end_date}` : ''}
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums font-semibold text-slate-900 whitespace-nowrap">
                      {b.student_count || 0}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <StatusBadge status={b.status} />
                    </td>
                    {canManage && (
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => openEditModal(b)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded transition-colors"
                          title="Edit Batch"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Batch Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBatch ? 'Edit Batch Details' : 'Create New Batch'}
        subtitle="Schedule a course cohort and assign certified trainer."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Batch Code <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={batchCode}
                onChange={(e) => setBatchCode(e.target.value.toUpperCase())}
                placeholder="e.g. PFS-03"
                required
                disabled={!!editingBatch}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Batch Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={batchName}
                onChange={(e) => setBatchName(e.target.value)}
                placeholder="e.g. Morning Regular Batch"
                required
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Course <span className="text-rose-500">*</span>
              </label>
              <select
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.course_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Assigned Trainer <span className="text-rose-500">*</span>
              </label>
              <select
                value={trainerId}
                onChange={(e) => setTrainerId(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white"
              >
                {trainers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Start Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 tabular-nums focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Estimated End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 tabular-nums focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Class Timing <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={timing}
              onChange={(e) => setTiming(e.target.value)}
              placeholder="e.g. 10:00 AM – 12:00 PM"
              required
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white"
            />
          </div>

          {editingBatch && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Batch Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs disabled:opacity-50"
            >
              {submitting ? 'Saving...' : editingBatch ? 'Save Changes' : 'Create Batch'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
