import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { ReportData } from '../types';
import { useToast } from '../components/common/Toast';
import {
  BarChart3,
  Download,
  Printer,
  TrendingUp,
  BookOpen,
  Layers,
  Users2,
  FileText
} from 'lucide-react';

export const Reports: React.FC = () => {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    async function loadReports() {
      try {
        const res = await apiService.getReports();
        setData(res);
      } catch (err: any) {
        showToast(err.message, 'error');
      } finally {
        setLoading(false);
      }
    }
    loadReports();
  }, [showToast]);

  const handlePrint = () => {
    window.print();
  };

  const exportCourseCSV = () => {
    if (!data?.courseReports.length) return;
    const headers = ['Course Name', 'Course Code', 'Duration', 'Total Students', 'Total Batches', 'Total Examinations'];
    const rows = data.courseReports.map((c) => [
      `"${c.course_name}"`,
      c.course_code,
      `"${c.duration}"`,
      c.total_students,
      c.total_batches,
      c.total_examinations,
    ]);
    downloadCSV([headers.join(','), ...rows.map((r) => r.join(','))].join('\n'), 'DataPro_Course_Report.csv');
  };

  const exportTrainerCSV = () => {
    if (!data?.trainerReports.length) return;
    const headers = ['Trainer Name', 'Email', 'Status', 'Assigned Batches', 'Total Uploaded Exams'];
    const rows = data.trainerReports.map((t) => [
      `"${t.trainer_name}"`,
      t.email,
      t.status,
      t.assigned_batches,
      t.total_uploaded_exams,
    ]);
    downloadCSV([headers.join(','), ...rows.map((r) => r.join(','))].join('\n'), 'DataPro_Trainer_Exam_Activity.csv');
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Report CSV exported.', 'success');
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-500">
        <div className="w-8 h-8 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-2" />
        <p className="text-xs">Compiling academic analytics & examination data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Institutional Reports & Examination Audits
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            DataPro Institute, Gajuwaka – Academic assessment statistics and enrollment metrics.
          </p>
        </div>

        <div className="flex items-center gap-2 no-print">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
          <button
            onClick={exportCourseCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Course-Wise Academic Distribution */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-600" />
              Course-Wise Student & Examination Density
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Summary across all software training tracks</p>
          </div>
          <button
            onClick={exportCourseCSV}
            className="text-xs text-blue-600 hover:underline font-semibold no-print"
          >
            Export Table
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-y border-slate-100 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-2.5 px-3">Course Track</th>
                <th className="py-2.5 px-3">Code</th>
                <th className="py-2.5 px-3">Duration</th>
                <th className="py-2.5 px-3 text-right">Total Students</th>
                <th className="py-2.5 px-3 text-right">Active Batches</th>
                <th className="py-2.5 px-3 text-right">Examinations Uploaded</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data?.courseReports.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-3 font-semibold text-slate-900">{c.course_name}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-500">{c.course_code}</td>
                  <td className="py-2.5 px-3 text-slate-600">{c.duration}</td>
                  <td className="py-2.5 px-3 text-right tabular-nums font-bold text-slate-900">
                    {c.total_students}
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-slate-700">
                    {c.total_batches}
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums font-semibold text-blue-700">
                    {c.total_examinations}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Trainer Examination Upload Performance */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users2 className="w-4 h-4 text-emerald-600" />
              Trainer-Wise Examination Deposit Audit
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Faculty assessment activity and compliance</p>
          </div>
          <button
            onClick={exportTrainerCSV}
            className="text-xs text-blue-600 hover:underline font-semibold no-print"
          >
            Export Table
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-y border-slate-100 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-2.5 px-3">Trainer Name</th>
                <th className="py-2.5 px-3">Email Address</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Assigned Batches</th>
                <th className="py-2.5 px-3 text-right">Uploaded Exam Papers</th>
                <th className="py-2.5 px-3 text-right">Last Deposit Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data?.trainerReports.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-3 font-semibold text-slate-900">{t.trainer_name}</td>
                  <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">{t.email}</td>
                  <td className="py-2.5 px-3">
                    <span className="inline-block text-[11px] font-semibold text-emerald-700">
                      {t.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-slate-700">
                    {t.assigned_batches}
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums font-bold text-slate-900">
                    {t.total_uploaded_exams}
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-slate-500 text-[11px]">
                    {t.last_exam_upload ? t.last_exam_upload.substring(0, 10) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Batch Progression & Enrollment Capacity */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-600" />
            Batch-Wise Student Distribution & Examination Volume
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Live cohorts currently training at Gajuwaka</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-y border-slate-100 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-2.5 px-3">Batch Code</th>
                <th className="py-2.5 px-3">Batch Title</th>
                <th className="py-2.5 px-3">Course Track</th>
                <th className="py-2.5 px-3">Lead Faculty</th>
                <th className="py-2.5 px-3">Timing</th>
                <th className="py-2.5 px-3 text-right">Students</th>
                <th className="py-2.5 px-3 text-right">Papers</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data?.batchReports.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-3 font-mono font-bold text-blue-700">{b.batch_code}</td>
                  <td className="py-2.5 px-3 font-medium text-slate-900">{b.batch_name}</td>
                  <td className="py-2.5 px-3 text-slate-700">{b.course_name}</td>
                  <td className="py-2.5 px-3 text-slate-700">{b.trainer_name}</td>
                  <td className="py-2.5 px-3 text-slate-600">{b.timing}</td>
                  <td className="py-2.5 px-3 text-right tabular-nums font-bold text-slate-900">
                    {b.student_count}
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums font-semibold text-slate-700">
                    {b.exam_count}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
