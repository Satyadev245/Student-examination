import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Examination } from '../../types';
import { apiService } from '../../services/api';
import { StatusBadge } from './Badge';
import { Download, FileText, Calendar, Clock, Award, HelpCircle, User, BookOpen, Layers } from 'lucide-react';
import { useToast } from './Toast';

interface ExamPreviewModalProps {
  examId: string | number | null;
  isOpen: boolean;
  onClose: () => void;
  canReview?: boolean;
  onStatusUpdated?: () => void;
}

export const ExamPreviewModal: React.FC<ExamPreviewModalProps> = ({
  examId,
  isOpen,
  onClose,
  canReview = false,
  onStatusUpdated
}) => {
  const [exam, setExam] = useState<Examination | null>(null);
  const [previewText, setPreviewText] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen && examId) {
      setLoading(true);
      apiService
        .previewExamination(examId)
        .then((data) => {
          setExam(data.examination);
          setPreviewText(data.previewContent);
        })
        .catch((err) => {
          showToast(err.message, 'error');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setExam(null);
      setPreviewText('');
    }
  }, [isOpen, examId, showToast]);

  const handleDownload = async () => {
    if (!exam) return;
    try {
      showToast('Downloading examination file...', 'info');
      await apiService.downloadExamPaper(exam.id, exam.file_name);
      showToast('Exam paper downloaded successfully.', 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!exam) return;
    setUpdatingStatus(true);
    try {
      await apiService.updateExamStatus(exam.id, newStatus);
      showToast(`Status updated to ${newStatus}`, 'success');
      setExam({ ...exam, status: newStatus as any });
      if (onStatusUpdated) onStatusUpdated();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={exam ? exam.title : 'Examination Paper'}
      subtitle={exam ? `Exam ID: ${exam.exam_id} · ${exam.course_name || ''}` : 'Loading examination details...'}
      maxWidth="max-w-3xl"
    >
      {loading ? (
        <div className="py-12 text-center text-slate-500">
          <div className="w-8 h-8 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm">Loading examination document...</p>
        </div>
      ) : !exam ? (
        <div className="py-8 text-center text-slate-500 text-sm">Unable to load examination details.</div>
      ) : (
        <div className="space-y-6">
          {/* Top metadata grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100 text-xs">
            <div>
              <span className="text-slate-400 block mb-0.5">Course</span>
              <span className="font-semibold text-slate-800 flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5 text-slate-500" />
                {exam.course_name}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Batch</span>
              <span className="font-semibold text-slate-800 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-slate-500" />
                {exam.batch_code}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Exam Date</span>
              <span className="font-semibold text-slate-800 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                {exam.exam_date}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Duration</span>
              <span className="font-semibold text-slate-800 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                {exam.duration}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Total Marks</span>
              <span className="font-semibold text-slate-800 tabular-nums flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-slate-500" />
                {exam.total_marks} Marks
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Questions</span>
              <span className="font-semibold text-slate-800 tabular-nums flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
                {exam.number_of_questions} Questions
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Uploaded By</span>
              <span className="font-semibold text-slate-800 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-500" />
                {exam.trainer_name}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Status</span>
              <StatusBadge status={exam.status} />
            </div>
          </div>

          {/* Subject & Instructions */}
          <div className="space-y-3">
            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Subject / Module</h4>
              <p className="text-sm font-medium text-slate-900 mt-0.5">{exam.subject}</p>
            </div>

            {exam.instructions && (
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Instructions to Candidates</h4>
                <div className="mt-1 p-3 bg-slate-50 rounded border border-slate-200 text-xs text-slate-700 whitespace-pre-line leading-relaxed">
                  {exam.instructions}
                </div>
              </div>
            )}

            {exam.additional_notes && (
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Trainer Notes for Admin</h4>
                <p className="mt-0.5 text-xs text-slate-600 italic bg-amber-50/60 p-2.5 rounded border border-amber-100">
                  {exam.additional_notes}
                </p>
              </div>
            )}
          </div>

          {/* File Attachment & Document Content */}
          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Attached Examination Paper</h4>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="truncate text-xs">
                  <p className="font-medium text-slate-900 truncate">{exam.file_name}</p>
                  <p className="text-slate-500">
                    {(exam.file_size / 1024).toFixed(1)} KB · {exam.file_type}
                  </p>
                </div>
              </div>
              <button
                onClick={handleDownload}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Paper</span>
              </button>
            </div>
          </div>

          {/* Paper Content Preview (if text readable or sample) */}
          {previewText && (
            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Document Content Preview</h4>
              <div className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-xs max-h-56 overflow-y-auto leading-relaxed border border-slate-800 select-text">
                <pre className="whitespace-pre-wrap font-mono">{previewText}</pre>
              </div>
            </div>
          )}

          {/* Status Review Actions for Admin / Center Manager / Team Lead */}
          {canReview && (
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">Review & Administer Examination Status:</span>
              <div className="flex items-center gap-2">
                <select
                  value={exam.status}
                  disabled={updatingStatus}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="text-xs border border-slate-200 rounded px-2.5 py-1.5 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
                >
                  <option value="SUBMITTED">SUBMITTED</option>
                  <option value="REVIEWED">REVIEWED</option>
                  <option value="APPROVED">APPROVED</option>
                  <option value="PUBLISHED">PUBLISHED</option>
                  <option value="ARCHIVED">ARCHIVED</option>
                </select>
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};
