import React, { useState } from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { ExamPreviewModal } from '../common/ExamPreviewModal';
import { useAuth } from '../../context/AuthContext';

interface AppLayoutProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ currentRoute, onNavigate, children }) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [previewExamId, setPreviewExamId] = useState<number | null>(null);
  const { user } = useAuth();

  const canReviewExams = ['SUPER_ADMIN', 'ADMIN', 'CENTER_MANAGER', 'TEAM_LEAD'].includes(user?.role || '');

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-800">
      <Sidebar
        currentRoute={currentRoute}
        onNavigate={onNavigate}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onOpenExamPreview={(id) => setPreviewExamId(id)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Global In-App Exam Preview Modal */}
      <ExamPreviewModal
        examId={previewExamId}
        isOpen={previewExamId !== null}
        onClose={() => setPreviewExamId(null)}
        canReview={canReviewExams}
        onStatusUpdated={() => {
          // Trigger optional refresh if needed
        }}
      />
    </div>
  );
};
