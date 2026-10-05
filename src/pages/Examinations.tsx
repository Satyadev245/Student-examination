import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import { Examination, Course, Batch, Trainer } from '../types';
import { StatusBadge } from '../components/common/Badge';
import { useToast } from '../components/common/Toast';
import {
  Search,
  Filter,
  Download,
  Eye,
  FileUp,
  FileText,
  RotateCw,
  Calendar,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';

interface ExaminationsProps {
  onNavigate: (route: string) => void;
  onPreviewExam: (id: number) => void;
}

export const Examinations: React.FC<ExaminationsProps> = ({ onNavigate, onPreviewExam }) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [examinations, setExaminations] = useState<Examination[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [search, setSearch] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedTrainer, setSelectedTrainer] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedType, setSelectedType] = useState('');

  const canUpload = ['TRAINER', 'ADMIN', 'SUPER_ADMIN'].includes(user?.role || '');
  const canReview = ['SUPER_ADMIN', 'ADMIN', 'CENTER_MANAGER', 'TEAM_LEAD'].includes(user?.role || '');

  const fetchFiltersData = async () => {
    try {
      const [cRes, bRes, tRes] = await Promise.all([
        apiService.getCourses(),
        apiService.getBatches(),
        user?.role !== 'TRAINER' ? apiService.getTrainers() : Promise.resolve({ trainers: [] }),
      ]);
      setCourses(cRes.courses);
      setBatches(bRes.batches);
      setTrainers(tRes.trainers);
    } catch (err: any) {
      console.error('Error fetching filters data:', err);
    }
  };

  const fetchExams = async () => {
    setLoading(true);
    try {
      const res = await apiService.getExaminations({
        search,
        course_id: selectedCourse || undefined,
        batch_id: selectedBatch || undefined,
        trainer_id: selectedTrainer || undefined,
        status: selectedStatus || undefined,
        exam_type: selectedType || undefined,
      });
      setExaminations(res.examinations);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiltersData();
  }, []);

  useEffect(() => {
    fetchExams();
  }, [search, selectedCourse, selectedBatch, selectedTrainer, selectedStatus, selectedType]);

  const handleDownload = async (exam: Examination) => {
    try {
      showToast(`Downloading ${exam.file_name}...`, 'info');
      await apiService.downloadExamPaper(exam.id, exam.file_name);
      showToast('Examination paper downloaded.', 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleStatusChange = async (examId: number, newStatus: string) => {
    try {
      await apiService.updateExamStatus(examId, newStatus);
      showToast(`Status updated to ${newStatus}`, 'success');
      setExaminations((prev) =>
        prev.map((e) => (e.id === examId ? { ...e, status: newStatus as any } : e))
      );
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedCourse('');
    setSelectedBatch('');
    setSelectedTrainer('');
    setSelectedStatus('');
    setSelectedType('');
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            {user?.role === 'TRAINER' ? 'My Examination Papers' : 'Examination Papers Registry'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {user?.role === 'TRAINER'
              ? 'View question papers uploaded for your assigned courses and batches.'
              : 'Repository of all question papers submitted by trainers across batches.'}
          </p>
        </div>

        {canUpload && (
          <button
            onClick={() => onNavigate('upload-exam')}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors shrink-0"
          >
            <FileUp className="w-4 h-4" />
            <span>Upload New Paper</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Search Input */}
          <div className="lg:col-span-2 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, exam ID, subject..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white transition-all"
            />
          </div>

          {/* Course filter */}
          <div>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full py-2 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
            >
              <option value="">All Courses</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.course_name}
                </option>
              ))}
            </select>
          </div>

          {/* Batch filter */}
          <div>
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="w-full py-2 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
            >
              <option value="">All Batches</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.batch_code} ({b.batch_name})
                </option>
              ))}
            </select>
          </div>

          {/* Trainer filter (if admin) */}
          {user?.role !== 'TRAINER' && (
            <div>
              <select
                value={selectedTrainer}
                onChange={(e) => setSelectedTrainer(e.target.value)}
                className="w-full py-2 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
              >
                <option value="">All Trainers</option>
                {trainers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Status filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full py-2 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
            >
              <option value="">All Statuses</option>
              <option value="SUBMITTED">SUBMITTED</option>
              <option value="REVIEWED">REVIEWED</option>
              <option value="APPROVED">APPROVED</option>
              <option value="PUBLISHED">PUBLISHED</option>
              <option value="ARCHIVED">ARCHIVED</option>
            </select>
          </div>
        </div>

        {/* Secondary row with active filter indicators and reset */}
        {(search || selectedCourse || selectedBatch || selectedTrainer || selectedStatus || selectedType) && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
            <span>Filtered results active</span>
            <button
              onClick={clearFilters}
              className="text-blue-600 hover:text-blue-800 font-semibold"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Main Examinations Table (Section 12 specification) */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-16 text-center text-slate-500">
            <div className="w-8 h-8 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs">Loading examination repository...</p>
          </div>
        ) : examinations.length === 0 ? (
          <div className="py-16 text-center text-slate-500 px-4">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-700">No examination papers found</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              There are no examinations matching your active search or filter criteria.
            </p>
            {canUpload && (
              <button
                onClick={() => onNavigate('upload-exam')}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold"
              >
                Upload Examination Paper
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200 text-[11px]">
                <tr>
                  <th className="py-3 px-4">Exam ID</th>
                  <th className="py-3 px-4">Exam Title</th>
                  <th className="py-3 px-4">Course</th>
                  <th className="py-3 px-4">Batch</th>
                  <th className="py-3 px-4">Trainer</th>
                  <th className="py-3 px-4">Exam Date</th>
                  <th className="py-3 px-4 text-right">Marks</th>
                  <th className="py-3 px-4">Uploaded Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {examinations.map((exam) => (
                  <tr key={exam.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Exam ID */}
                    <td className="py-3 px-4 font-mono font-medium text-blue-700 whitespace-nowrap">
                      {exam.exam_id}
                    </td>

                    {/* Title & Subject */}
                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-semibold text-slate-900 truncate" title={exam.title}>
                        {exam.title}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate mt-0.5">
                        {exam.subject} · <span className="italic">{exam.exam_type}</span>
                      </div>
                    </td>

                    {/* Course */}
                    <td className="py-3 px-4 whitespace-nowrap text-slate-800">
                      <span title={exam.course_name}>{exam.course_code || exam.course_name}</span>
                    </td>

                    {/* Batch */}
                    <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-700">
                      {exam.batch_code}
                    </td>

                    {/* Trainer */}
                    <td className="py-3 px-4 whitespace-nowrap text-slate-700 font-medium">
                      {exam.trainer_name}
                    </td>

                    {/* Exam Date */}
                    <td className="py-3 px-4 whitespace-nowrap tabular-nums text-slate-700">
                      {exam.exam_date}
                    </td>

                    {/* Marks */}
                    <td className="py-3 px-4 whitespace-nowrap text-right tabular-nums font-semibold text-slate-900">
                      {exam.total_marks}
                    </td>

                    {/* Uploaded Date */}
                    <td className="py-3 px-4 whitespace-nowrap tabular-nums text-slate-500 text-[11px]">
                      {exam.created_at.substring(0, 16)}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {canReview ? (
                        <select
                          value={exam.status}
                          onChange={(e) => handleStatusChange(exam.id, e.target.value)}
                          className="text-[11px] font-medium border border-slate-200 rounded px-1.5 py-1 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
                        >
                          <option value="SUBMITTED">SUBMITTED</option>
                          <option value="REVIEWED">REVIEWED</option>
                          <option value="APPROVED">APPROVED</option>
                          <option value="PUBLISHED">PUBLISHED</option>
                          <option value="ARCHIVED">ARCHIVED</option>
                        </select>
                      ) : (
                        <StatusBadge status={exam.status} />
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onPreviewExam(exam.id)}
                          className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded transition-colors"
                          title="Preview Exam Paper & Questions"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDownload(exam)}
                          className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded transition-colors"
                          title="Download Exam Document"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
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
