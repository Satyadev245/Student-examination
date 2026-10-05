import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import { Course } from '../types';
import { StatusBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { useToast } from '../components/common/Toast';
import { BookOpen, Plus, Search, Edit2, Layers, Users, FileText, CheckCircle2 } from 'lucide-react';

export const Courses: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  // Form states
  const [courseName, setCourseName] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [duration, setDuration] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [submitting, setSubmitting] = useState(false);

  const canManage = ['SUPER_ADMIN', 'ADMIN'].includes(user?.role || '');

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await apiService.getCourses();
      setCourses(res.courses);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const openCreateModal = () => {
    setEditingCourse(null);
    setCourseName('');
    setCourseCode('');
    setDuration('4 Months (90 Hours)');
    setDescription('');
    setStatus('ACTIVE');
    setIsModalOpen(true);
  };

  const openEditModal = (c: Course) => {
    setEditingCourse(c);
    setCourseName(c.course_name);
    setCourseCode(c.course_code);
    setDuration(c.duration);
    setDescription(c.description);
    setStatus(c.status);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseName.trim() || !courseCode.trim() || !duration.trim()) {
      showToast('Course name, code, and duration are required.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      if (editingCourse) {
        await apiService.updateCourse(editingCourse.id, {
          course_name: courseName.trim(),
          description: description.trim(),
          duration: duration.trim(),
          status,
        });
        showToast('Course updated successfully.', 'success');
      } else {
        await apiService.createCourse({
          course_name: courseName.trim(),
          course_code: courseCode.trim().toUpperCase(),
          duration: duration.trim(),
          description: description.trim(),
        });
        showToast('New course created successfully.', 'success');
      }
      setIsModalOpen(false);
      fetchCourses();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCourses = courses.filter((c) =>
    c.course_name.toLowerCase().includes(search.toLowerCase()) ||
    c.course_code.toLowerCase().includes(search.toLowerCase()) ||
    c.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Course Curriculum Catalog
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Software tracks, syllabus duration, and examination milestones offered at DataPro Gajuwaka.
          </p>
        </div>

        {canManage && (
          <button
            onClick={openCreateModal}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Course</span>
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
          placeholder="Search courses by title, code, description..."
          className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600"
        />
      </div>

      {/* Grid of Courses */}
      {loading ? (
        <div className="py-16 text-center text-slate-500">
          <div className="w-8 h-8 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs">Loading course directory...</p>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="py-16 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-800">No courses found</p>
          <p className="text-xs text-slate-500 mt-1">Try refining your search filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCourses.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between hover:border-slate-300 transition-colors shadow-xs"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                    {c.course_code}
                  </span>
                  <StatusBadge status={c.status} />
                </div>

                <h3 className="text-base font-bold text-slate-900 leading-snug">{c.course_name}</h3>
                <p className="text-xs text-slate-600 mt-2 line-clamp-3 leading-relaxed">
                  {c.description || 'Comprehensive curriculum covering practical implementation and real-world project development.'}
                </p>

                <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 space-y-1.5">
                  <div className="flex justify-between">
                    <span>Duration:</span>
                    <span className="font-semibold text-slate-800">{c.duration}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Batches:</span>
                    <span className="font-semibold text-slate-800 tabular-nums">{c.batch_count || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Enrolled Students:</span>
                    <span className="font-semibold text-slate-800 tabular-nums">{c.student_count || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Exam Papers Deposited:</span>
                    <span className="font-semibold text-slate-800 tabular-nums">{c.exam_count || 0}</span>
                  </div>
                </div>
              </div>

              {canManage && (
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end">
                  <button
                    onClick={() => openEditModal(c)}
                    className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-blue-600 font-semibold transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Curriculum</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Course Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCourse ? 'Edit Course Curriculum' : 'Add New Course'}
        subtitle="Manage software training track offered at DataPro Gajuwaka."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Course Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              placeholder="e.g. Python Full Stack Development"
              required
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Course Code <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value.toUpperCase())}
                placeholder="e.g. PFS"
                required
                disabled={!!editingCourse}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Duration <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="e.g. 6 Months (120 Hours)"
                required
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Course Syllabus / Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Outline modules, languages, frameworks and project targets..."
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white"
            />
          </div>

          {editingCourse && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Curriculum Status
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
              {submitting ? 'Saving...' : editingCourse ? 'Save Changes' : 'Create Course'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
