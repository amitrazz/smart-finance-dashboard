import React from "react";

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-8 w-full animate-pulse">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-6">
        <div className="space-y-2">
          <div className="h-8 w-64 bg-slate-800 rounded-2xl" />
          <div className="h-4 w-96 bg-slate-900 rounded-xl" />
        </div>
        <div className="flex gap-3">
          <div className="h-10 w-32 bg-slate-800 rounded-xl" />
          <div className="h-10 w-10 bg-slate-800 rounded-xl" />
        </div>
      </div>

      {/* Hero Net Worth Skeleton */}
      <div className="h-64 bg-slate-900 border border-slate-800 rounded-3xl" />

      {/* KPI Grid Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-28 bg-slate-900 border border-slate-800 rounded-2xl" />
        ))}
      </div>

      {/* Spending Overview Skeleton */}
      <div className="h-80 bg-slate-900 border border-slate-800 rounded-3xl" />

      {/* Activity & AI Skeletons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-72 bg-slate-900 border border-slate-800 rounded-3xl" />
        <div className="h-72 bg-slate-900 border border-slate-800 rounded-3xl" />
      </div>
    </div>
  );
};
