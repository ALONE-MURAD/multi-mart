import React from 'react';

export const ProductCardSkeleton: React.FC = () => (
  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white animate-pulse">
    <div className="aspect-[4/3] bg-slate-200" />
    <div className="p-4 space-y-2.5">
      <div className="h-3 w-20 rounded bg-slate-200" />
      <div className="h-4 w-full rounded bg-slate-200" />
      <div className="h-4 w-2/3 rounded bg-slate-200" />
      <div className="pt-2 flex items-center justify-between">
        <div className="h-5 w-24 rounded bg-slate-200" />
        <div className="h-9 w-9 rounded-xl bg-slate-200" />
      </div>
    </div>
  </div>
);
