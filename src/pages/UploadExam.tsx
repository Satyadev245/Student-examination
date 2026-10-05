import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import { Course, Batch } from '../types';
import { useToast } from '../components/common/Toast';
import {
  FileUp,
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  Award,
  Calendar,
  Layers,
  BookOpen,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface UploadExamProps {
  onNavigate: (route: string) => void;
  onPreviewExam: (id: number) => void;
}

export const UploadExam: React.FC<UploadExamProps> = ({ onNavigate, onPreviewExam }) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [courses, setCourses] = useState<Course[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [title, setTitle] = useState('');
  const [examType, setExamType] = useState('Mid Term Examination');
  const [courseId, setCourseId] = useState('');
  const [batchId, setBatchId] = useState('');
  const [subject, setSubject] = useState('');
  const [examDate, setExamDate] = useState('');
  const [duration, setDuration] = useState('2 Hours');
  const [totalMarks, setTotalMarks] = useState('100');
  const [numberOfQuestions, setNumberOfQuestions] = useState('25');
  const [instructions, setInstructions] = useState(
    '1. All questions in Section A (MCQs) are compulsory.\n2. Write code snippets for programming scenarios in Section B.\n3. Verify question paper code before commencement.'
  );
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);

  // Success state
  const [uploadedExamId, setUploadedExamId] = useState<string | null>(null);
  const [newDbId, setNewDbId] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [cRes, bRes] = await Promise.all([
          apiService.getCourses(),
          apiService.getBatches(),
        ]);
        setCourses(cRes.courses);
        setBatches(bRes.batches);

        // Pre-select first course and batch if available
        if (cRes.courses.length > 0) {
          setCourseId(String(cRes.courses[0].id));
        }
      } catch (err: any) {
        showToast(err.message, 'error');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [showToast]);

  // Filter batches by selected course
  const filteredBatches = batches.filter((b) => !courseId || String(b.course_id) === String(courseId));

  // Auto update batchId when course changes
  useEffect(() => {
    if (filteredBatches.length > 0 && !filteredBatches.some((b) => String(b.id) === String(batchId))) {
      setBatchId(String(filteredBatches[0].id));
    }
  }, [courseId, filteredBatches]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      const validTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/png'
      ];
      const validExtensions = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];
      const fileExt = '.' + selected.name.split('.').pop()?.toLowerCase();

      if (!validTypes.includes(selected.type) && !validExtensions.includes(fileExt)) {
        showToast('Only PDF, DOC, DOCX, JPG, and PNG files are allowed.', 'error');
        return;
      }

      if (selected.size > 25 * 1024 * 1024) {
        showToast('File size must not exceed 25 MB.', 'error');
        return;
      }

      setFile(selected);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !courseId || !batchId || !subject.trim() || !examDate || !duration || !totalMarks) {
      showToast('Please fill all mandatory fields.', 'error');
      return;
    }

    if (!file) {
      showToast('Please select or drag an examination paper file to upload.', 'error');
      return;
    }

    setSubmitting(true);
    const formData = new FormData();
    formData.append('title', title.trim());
    formData.append('exam_type', examType);
    formData.append('course_id', courseId);
    formData.append('batch_id', batchId);
    formData.append('subject', subject.trim());
    formData.append('exam_date', examDate);
    formData.append('duration', duration);
    formData.append('total_marks', totalMarks);
    formData.append('number_of_questions', numberOfQuestions);
    formData.append('instructions', instructions);
    formData.append('additional_notes', additionalNotes);
    formData.append('exam_file', file);

    try {
      const res = await apiService.uploadExamination(formData);
      setUploadedExamId(res.exam_id);
      setNewDbId(res.id);
      showToast('Examination paper uploaded successfully.', 'success');

      // Trigger celebration confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {
        // ignore if confetti blocked
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setTitle('');
    setSubject('');
    setExamDate('');
    setAdditionalNotes('');
    setFile(null);
    setUploadedExamId(null);
    setNewDbId(null);
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-500">
        <div className="w-8 h-8 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm font-medium">Preparing examination upload studio...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          Upload Examination Paper
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Submit curriculum assessment papers for Gajuwaka batches. Administrative notification will be generated upon deposit.
        </p>
      </div>

      {/* Success Banner if uploaded */}
      {uploadedExamId && (
        <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl shadow-xs space-y-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h2 className="text-base font-bold text-emerald-900">
                Examination paper uploaded successfully!
              </h2>
              <p className="text-xs text-emerald-800 mt-1">
                Your paper has been deposited in the secure repository and assigned unique identifier{' '}
                <span className="font-mono font-bold text-emerald-900 underline">{uploadedExamId}</span>.
                Center Manager and Academic Administrators have been notified.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            {newDbId && (
              <button
                onClick={() => onPreviewExam(newDbId)}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
              >
                Preview Uploaded Paper
              </button>
            )}
            <button
              onClick={() => onNavigate('examinations')}
              className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              Go to Examination Papers Registry
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2 text-emerald-800 hover:text-emerald-950 text-xs font-semibold"
            >
              Upload Another Paper
            </button>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
        {/* Section 1: Basic Exam Information */}
        <div className="space-y-4">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
              1. Assessment Details
            </h3>
            <p className="text-xs text-slate-500">Provide official assessment metadata.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Title */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Examination Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Python Full Stack – Mid Term Examination"
                required
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white"
              />
            </div>

            {/* Exam Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Examination Type <span className="text-rose-500">*</span>
              </label>
              <select
                value={examType}
                onChange={(e) => setExamType(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white"
              >
                <option value="Mid Term Examination">Mid Term Examination</option>
                <option value="Final Examination">Final Examination</option>
                <option value="Weekly Assessment">Weekly Assessment</option>
                <option value="Lab Practical">Lab Practical</option>
                <option value="Mock Test">Mock Test</option>
              </select>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Subject / Module <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Python Programming & OOP Concepts"
                required
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Course & Batch Assignment (Business Rule 4) */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
              2. Academic Target (Course & Batch)
            </h3>
            <p className="text-xs text-slate-500">
              {user?.role === 'TRAINER'
                ? 'Only courses and batches assigned to your instructor profile are permitted.'
                : 'Select course track and targeted batch schedule.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Course Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Target Course <span className="text-rose-500">*</span>
              </label>
              <select
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.course_name} ({c.course_code})
                  </option>
                ))}
              </select>
            </div>

            {/* Batch Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Target Batch <span className="text-rose-500">*</span>
              </label>
              <select
                value={batchId}
                onChange={(e) => setBatchId(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white"
              >
                {filteredBatches.length === 0 ? (
                  <option value="">No active batches scheduled yet (Create batch in Batch Schedule)</option>
                ) : (
                  filteredBatches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.batch_code} · {b.batch_name} ({b.timing})
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Exam Parameters */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
              3. Examination Parameters
            </h3>
            <p className="text-xs text-slate-500">Date, duration, marks, and question breakdown.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Exam Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white tabular-nums"
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
                placeholder="e.g. 2 Hours"
                required
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Total Marks <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                value={totalMarks}
                onChange={(e) => setTotalMarks(e.target.value)}
                placeholder="100"
                min="10"
                max="200"
                required
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white tabular-nums"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                No. of Questions <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                value={numberOfQuestions}
                onChange={(e) => setNumberOfQuestions(e.target.value)}
                placeholder="25"
                min="1"
                max="100"
                required
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white tabular-nums"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Candidate Instructions
            </label>
            <textarea
              rows={3}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Trainer Notes for Admin
            </label>
            <input
              type="text"
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="e.g. Lab 2 required. Soft copy dataset to be extracted before test."
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white"
            />
          </div>
        </div>

        {/* Section 4: Secure File Upload (Section 10) */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
              4. Examination Paper Document <span className="text-rose-500">*</span>
            </h3>
            <p className="text-xs text-slate-500">
              Supported formats: PDF, DOC, DOCX, JPG, PNG (Max 25 MB). Securely encrypted in repository.
            </p>
          </div>

          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-8 text-center bg-slate-50/50 hover:bg-blue-50/20 cursor-pointer transition-colors"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*"
              className="hidden"
            />

            {file ? (
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-3">
                  <FileText className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-slate-900">{file.name}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {(file.size / 1024).toFixed(1)} KB · Ready to deposit
                </p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                  }}
                  className="mt-3 text-xs text-rose-600 hover:underline font-semibold"
                >
                  Remove file & choose another
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-slate-800">
                  Click to select or drag examination paper here
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Accepts PDF, Microsoft Word (.doc, .docx), or scanned question paper images
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Submit Actions */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => onNavigate('examinations')}
            className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={submitting || !file}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            {submitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <FileUp className="w-4 h-4" />
                <span>Upload & Notify Administrators</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
