import React from "react";

export const OnboardingSkeleton: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-pulse p-4">
      {/* Header Skeleton */}
      <div className="h-20 bg-slate-900/80 rounded-2xl border border-slate-800" />
      {/* Hero / Form Skeleton */}
      <div className="h-96 bg-slate-900/60 rounded-3xl border border-slate-800 p-8 space-y-6">
        <div className="h-8 bg-slate-800 rounded-xl w-2/3 mx-auto" />
        <div className="h-4 bg-slate-800/60 rounded-lg w-1/2 mx-auto" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
          <div className="h-24 bg-slate-950/80 rounded-2xl" />
          <div className="h-24 bg-slate-950/80 rounded-2xl" />
          <div className="h-24 bg-slate-950/80 rounded-2xl" />
        </div>
        <div className="h-14 bg-slate-800/80 rounded-2xl w-full" />
      </div>
    </div>
  );
};
