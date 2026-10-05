import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import { Student, Course, Batch } from '../types';
import { StatusBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { useToast } from '../components/common/Toast';
import {
  GraduationCap,
  Plus,
  Search,
  Download,
  Edit2,
  Mail,
  Phone,
  Calendar,
  Layers,
  BookOpen
} from 'lucide-react';

export const Students: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [courseId, setCourseId] = useState('');
  const [batchId, setBatchId] = useState('');
  const [joiningDate, setJoiningDate] = useState('');
  const [address, setAddress] = useState('');
  const [registrationNo, setRegistrationNo] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'COMPLETED' | 'DISCONTINUED'>('ACTIVE');
  const [submitting, setSubmitting] = useState(false);

  const canManage = ['SUPER_ADMIN', 'ADMIN', 'CENTER_MANAGER', 'COUNSELLOR'].includes(user?.role || '');

  const fetchFilters = async () => {
    try {
      const [cRes, bRes] = await Promise.all([
        apiService.getCourses(),
        apiService.getBatches(),
      ]);
      setCourses(cRes.courses);
      setBatches(bRes.batches);
    } catch (err: any) {
      console.error(err);
    }
  };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await apiService.getStudents({
        search,
        course_id: selectedCourse || undefined,
        batch_id: selectedBatch || undefined,
        status: selectedStatus || undefined,
      });
      setStudents(res.students);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilters();
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [search, selectedCourse, selectedBatch, selectedStatus]);

  const openCreateModal = () => {
    setEditingStudent(null);
    setName('');
    setEmail('');
    setMobile('');
    setCourseId(courses.length > 0 ? String(courses[0].id) : '');
    setBatchId(batches.length > 0 ? String(batches[0].id) : '');
    setJoiningDate(new Date().toISOString().substring(0, 10));
    setAddress('Gajuwaka, Visakhapatnam');
    setRegistrationNo('');
    setStatus('ACTIVE');
    setIsModalOpen(true);
  };

  const openEditModal = (s: Student) => {
    setEditingStudent(s);
    setName(s.name);
    setEmail(s.email);
    setMobile(s.mobile);
    setCourseId(String(s.course_id));
    setBatchId(String(s.batch_id));
    setJoiningDate(s.joining_date);
    setAddress(s.address || '');
    setRegistrationNo(s.registration_no);
    setStatus(s.status);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !mobile.trim() || !courseId || !batchId || !joiningDate) {
      showToast('Please fill all mandatory fields.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      if (editingStudent) {
        await apiService.updateStudent(editingStudent.id, {
          name: name.trim(),
          email: email.trim(),
          mobile: mobile.trim(),
          course_id: parseInt(courseId, 10),
          batch_id: parseInt(batchId, 10),
          joining_date: joiningDate,
          address: address.trim(),
          registration_no: registrationNo.trim(),
          status,
        });
        showToast('Student record updated successfully.', 'success');
      } else {
        await apiService.createStudent({
          name: name.trim(),
          email: email.trim(),
          mobile: mobile.trim(),
          course_id: parseInt(courseId, 10),
          batch_id: parseInt(batchId, 10),
          joining_date: joiningDate,
          address: address.trim(),
          registration_no: registrationNo.trim(),
        });
        showToast('Student registered successfully.', 'success');
      }
      setIsModalOpen(false);
      fetchStudents();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const exportCSV = () => {
    if (students.length === 0) {
      showToast('No student data to export.', 'info');
      return;
    }

    const headers = ['Student ID', 'Registration No', 'Name', 'Email', 'Mobile', 'Course', 'Batch', 'Joining Date', 'Status'];
    const rows = students.map((s) => [
      s.student_id,
      s.registration_no,
      `"${s.name}"`,
      s.email,
      `"${s.mobile}"`,
      `"${s.course_name || ''}"`,
      `"${s.batch_code || ''}"`,
      s.joining_date,
      s.status,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DataPro_Gajuwaka_Students_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Student roster exported to CSV.', 'success');
  };

  const formBatches = batches.filter((b) => !courseId || String(b.course_id) === String(courseId));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            {user?.role === 'TRAINER' ? 'My Enrolled Students' : 'Student Enrollment Management'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Student admission records, batch allocations, registration numbers, and academic statuses.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>

          {canManage && (
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Register Student</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Row */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, ID, mobile, reg no..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white"
          />
        </div>

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

        <div>
          <select
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
            className="w-full py-2 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
          >
            <option value="">All Batches</option>
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.batch_code} ({b.timing})
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full py-2 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="DISCONTINUED">DISCONTINUED</option>
          </select>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-16 text-center text-slate-500">
            <div className="w-8 h-8 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs">Loading students roster...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <GraduationCap className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-800">No student records found</p>
            <p className="text-xs text-slate-500 mt-1">Adjust search parameters or register a new student.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200 text-[11px]">
                <tr>
                  <th className="py-3 px-4">Student ID</th>
                  <th className="py-3 px-4">Registration No</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Contact Details</th>
                  <th className="py-3 px-4">Course Track</th>
                  <th className="py-3 px-4">Batch</th>
                  <th className="py-3 px-4">Joined Date</th>
                  <th className="py-3 px-4">Status</th>
                  {canManage && <th className="py-3 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-blue-700 whitespace-nowrap">
                      {s.student_id}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                      {s.registration_no}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                      {s.name}
                    </td>
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span className="tabular-nums">{s.mobile}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span>{s.email}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-800 whitespace-nowrap">
                      {s.course_code || s.course_name}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700 whitespace-nowrap">
                      {s.batch_code}
                    </td>
                    <td className="py-3 px-4 tabular-nums text-slate-600 whitespace-nowrap">
                      {s.joining_date}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <StatusBadge status={s.status} />
                    </td>
                    {canManage && (
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => openEditModal(s)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded transition-colors"
                          title="Edit Student"
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

      {/* Add / Edit Student Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingStudent ? 'Update Student Record' : 'Register New Student'}
        subtitle="Manage student enrollment at DataPro Institute, Gajuwaka."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. K. Sai Teja"
                required
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Registration Number
              </label>
              <input
                type="text"
                value={registrationNo}
                onChange={(e) => setRegistrationNo(e.target.value)}
                placeholder="Auto-generated if left blank"
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
                placeholder="student@gmail.com"
                required
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Mobile Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="+91 98765 43210"
                required
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 tabular-nums focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Course Track <span className="text-rose-500">*</span>
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
                Assigned Batch <span className="text-rose-500">*</span>
              </label>
              <select
                value={batchId}
                onChange={(e) => setBatchId(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white"
              >
                {formBatches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.batch_code} ({b.timing})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Admission / Joining Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={joiningDate}
                onChange={(e) => setJoiningDate(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 tabular-nums focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Address / City
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Gajuwaka, Visakhapatnam"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white"
              />
            </div>
          </div>

          {editingStudent && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Enrollment Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="DISCONTINUED">DISCONTINUED</option>
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
              {submitting ? 'Saving...' : editingStudent ? 'Update Student' : 'Register Student'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
