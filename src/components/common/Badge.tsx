import React from 'react';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const normalized = status.toUpperCase();

  let dotColor = 'bg-slate-400';
  let textColor = 'text-slate-700';

  if (['ACTIVE', 'APPROVED', 'PUBLISHED', 'COMPLETED'].includes(normalized)) {
    dotColor = 'bg-emerald-500';
    textColor = 'text-emerald-700';
  } else if (['SUBMITTED', 'PENDING', 'REVIEWED'].includes(normalized)) {
    dotColor = 'bg-amber-500';
    textColor = 'text-amber-800';
  } else if (['INACTIVE', 'DISCONTINUED', 'REJECTED', 'ARCHIVED'].includes(normalized)) {
    dotColor = 'bg-rose-500';
    textColor = 'text-rose-700';
  }

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${textColor} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} aria-hidden="true" />
      <span>{status}</span>
    </span>
  );
};
