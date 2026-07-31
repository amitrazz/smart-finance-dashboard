import React from "react";

type SkeletonType = "cards" | "table" | "chart" | "list";

interface LoadingSkeletonProps {
  type?: SkeletonType;
  rows?: number;
}

const CardsSkeleton: React.FC<{ rows: number }> = ({ rows }) => (
  <div className="space-y-6 animate-pulse">
    <div className="h-8 bg-slate-800/80 rounded-xl w-1/3" />
    <div className={`grid grid-cols-1 sm:grid-cols-${Math.min(rows, 4)} gap-4`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-28 bg-slate-900/60 rounded-2xl border border-slate-800" />
      ))}
    </div>
    <div className="h-72 bg-slate-900/60 rounded-3xl border border-slate-800" />
  </div>
);

const TableSkeleton: React.FC<{ rows: number }> = ({ rows }) => (
  <div className="space-y-4 animate-pulse">
    <div className="h-8 bg-slate-800/80 rounded-xl w-1/4" />
    <div className="rounded-2xl border border-slate-800 overflow-hidden">
      <div className="h-10 bg-slate-800/60" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-14 bg-slate-900/40 border-t border-slate-800/60" />
      ))}
    </div>
  </div>
);

const ChartSkeleton: React.FC = () => (
  <div className="space-y-4 animate-pulse">
    <div className="h-8 bg-slate-800/80 rounded-xl w-1/3" />
    <div className="h-80 bg-slate-900/60 rounded-3xl border border-slate-800" />
  </div>
);

const ListSkeleton: React.FC<{ rows: number }> = ({ rows }) => (
  <div className="space-y-3 animate-pulse">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex items-center gap-3 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
        <div className="w-10 h-10 rounded-full bg-slate-800" />
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-slate-800 rounded w-1/3" />
          <div className="h-3 bg-slate-800/60 rounded w-1/2" />
        </div>
        <div className="h-4 bg-slate-800 rounded w-16" />
      </div>
    ))}
  </div>
);

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  type = "cards",
  rows = 4,
}) => {
  switch (type) {
    case "table":
      return <TableSkeleton rows={rows} />;
    case "chart":
      return <ChartSkeleton />;
    case "list":
      return <ListSkeleton rows={rows} />;
    default:
      return <CardsSkeleton rows={rows} />;
  }
};

export default LoadingSkeleton;
