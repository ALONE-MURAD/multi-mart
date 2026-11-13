import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  hasPrev: boolean;
  hasNext: boolean;
  loading?: boolean;
  onPrev: () => void;
  onNext: () => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  hasPrev,
  hasNext,
  loading = false,
  onPrev,
  onNext,
}) => {
  if (!hasPrev && !hasNext) return null;

  return (
    <div className="flex items-center justify-center gap-3 pt-4">
      <button
        type="button"
        disabled={!hasPrev || loading}
        onClick={onPrev}
        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
      >
        <ChevronLeft className="h-4 w-4" />
        Previous
      </button>
      <span className="text-xs font-semibold text-slate-500 tabular-nums">Page {currentPage}</span>
      <button
        type="button"
        disabled={!hasNext || loading}
        onClick={onNext}
        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
      >
        Next
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
};
