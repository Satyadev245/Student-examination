import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/common/Toast';
import { AppLayout } from './components/layout/AppLayout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Examinations } from './pages/Examinations';
import { UploadExam } from './pages/UploadExam';
import { Courses } from './pages/Courses';
import { Batches } from './pages/Batches';
import { Students } from './pages/Students';
import { Trainers } from './pages/Trainers';
import { Reports } from './pages/Reports';
import { ActivityLogs } from './pages/ActivityLogs';
import { Users } from './pages/Users';
import { Profile } from './pages/Profile';
import { NotificationsPage } from './pages/NotificationsPage';
import { ExamPreviewModal } from './components/common/ExamPreviewModal';

function AppContent() {
  const { user, isLoading } = useAuth();
  const [currentRoute, setCurrentRoute] = useState<string>('dashboard');
  const [previewExamId, setPreviewExamId] = useState<number | null>(null);

  // Sync hash with currentRoute
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#/', '').replace('#', '');
      if (hash) {
        setCurrentRoute(hash);
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (route: string) => {
    setCurrentRoute(route);
    window.location.hash = `#/${route}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-slate-700 border-t-blue-500 rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase">
            DataPro Institute Examination Portal
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const renderPage = () => {
    switch (currentRoute) {
      case 'dashboard':
        return <Dashboard onNavigate={navigateTo} onPreviewExam={(id) => setPreviewExamId(id)} />;
      case 'upload-exam':
        return <UploadExam onNavigate={navigateTo} onPreviewExam={(id) => setPreviewExamId(id)} />;
      case 'examinations':
        return <Examinations onNavigate={navigateTo} onPreviewExam={(id) => setPreviewExamId(id)} />;
      case 'courses':
        return <Courses />;
      case 'batches':
        return <Batches />;
      case 'students':
        return <Students />;
      case 'trainers':
        return <Trainers />;
      case 'reports':
        return <Reports />;
      case 'activity-logs':
        return <ActivityLogs />;
      case 'users':
        return <Users />;
      case 'profile':
        return <Profile />;
      case 'notifications':
        return <NotificationsPage onPreviewExam={(id) => setPreviewExamId(id)} />;
      default:
        return <Dashboard onNavigate={navigateTo} onPreviewExam={(id) => setPreviewExamId(id)} />;
    }
  };

  const canReview = ['SUPER_ADMIN', 'ADMIN', 'CENTER_MANAGER', 'TEAM_LEAD'].includes(user.role);

  return (
    <AppLayout currentRoute={currentRoute} onNavigate={navigateTo}>
      {renderPage()}
      <ExamPreviewModal
        examId={previewExamId}
        isOpen={previewExamId !== null}
        onClose={() => setPreviewExamId(null)}
        canReview={canReview}
      />
    </AppLayout>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ToastProvider>
  );
}
