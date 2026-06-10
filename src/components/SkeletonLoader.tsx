import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const SkeletonBase: React.FC<SkeletonProps> = ({ className = '' }) => (
  <div className={`animate-pulse bg-slate-200/90 rounded-xl ${className}`} />
);

export const SkeletonStatCard: React.FC = () => (
  <div className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-xs flex items-center justify-between">
    <div className="flex items-center gap-3">
      <SkeletonBase className="w-10 h-10 rounded-xl" />
      <div className="space-y-1.5">
        <SkeletonBase className="h-2.5 w-24 rounded" />
        <SkeletonBase className="h-3.5 w-12 rounded" />
      </div>
    </div>
    <SkeletonBase className="h-7 w-8 rounded-lg" />
  </div>
);

export const SkeletonReportItem: React.FC = () => (
  <div className="bg-white rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border border-slate-200/70">
    <div className="space-y-2.5 w-full sm:w-auto flex-1">
      <div className="flex items-center gap-2">
        <SkeletonBase className="h-4 w-16 rounded-full" />
        <SkeletonBase className="h-3 w-12 rounded-full" />
      </div>
      <SkeletonBase className="h-4 w-1/3 rounded-md" />
      <SkeletonBase className="h-3 w-2/3 rounded-md" />
    </div>
    <SkeletonBase className="h-8 w-20 rounded-xl shrink-0" />
  </div>
);

export const SkeletonDetailPanel: React.FC = () => (
  <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
      <SkeletonBase className="h-4 w-28 rounded" />
      <SkeletonBase className="h-4.5 w-14 rounded-full" />
    </div>

    <div className="space-y-3">
      <div className="space-y-1.5">
        <SkeletonBase className="h-2 w-12" />
        <SkeletonBase className="h-4 w-32" />
      </div>
      <div className="space-y-1.5">
        <SkeletonBase className="h-2.5 w-16" />
        <SkeletonBase className="h-3.5 w-48" />
      </div>
      <div className="space-y-1.5">
        <SkeletonBase className="h-2 w-24" />
        <SkeletonBase className="h-16 w-full rounded-xl" />
      </div>
    </div>
  </div>
);

export const SkeletonUserListItem: React.FC = () => (
  <tr className="border-b border-slate-100">
    <td className="py-3 px-4">
      <div className="flex items-center gap-3">
        <SkeletonBase className="w-8 h-8 rounded-full shrink-0" />
        <div className="space-y-1">
          <SkeletonBase className="h-3 w-24 rounded" />
          <SkeletonBase className="h-2 w-32 rounded" />
        </div>
      </div>
    </td>
    <td className="py-3 px-4">
      <SkeletonBase className="h-4.5 w-16 rounded-full" />
    </td>
    <td className="py-3 px-4">
      <div className="flex gap-1.5 flex-wrap">
        <SkeletonBase className="h-6 w-12 rounded" />
        <SkeletonBase className="h-6 w-16 rounded" />
      </div>
    </td>
  </tr>
);

export const SkeletonDashboardScreen: React.FC<{ listCount?: number; showStats?: boolean }> = ({
  listCount = 3,
  showStats = true
}) => {
  return (
    <div className="space-y-6">
      {showStats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SkeletonStatCard />
          <SkeletonStatCard />
          <SkeletonStatCard />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-4">
          <div className="flex justify-between items-center">
            <SkeletonBase className="h-4.5 w-36 rounded" />
            <div className="flex gap-1">
              <SkeletonBase className="h-6 w-10 rounded" />
              <SkeletonBase className="h-6 w-10 rounded" />
              <SkeletonBase className="h-6 w-10 rounded" />
            </div>
          </div>
          <div className="space-y-3">
            {Array.from({ length: listCount }).map((_, i) => (
              <SkeletonReportItem key={i} />
            ))}
          </div>
        </div>

        <div className="lg:col-span-5">
          <SkeletonDetailPanel />
        </div>
      </div>
    </div>
  );
};
