import React from 'react';

interface SkeletonProps {
  className?: string;
  count?: number;
}

const Skeleton: React.FC<SkeletonProps> = ({ className = 'h-4 w-full', count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`animate-pulse bg-gradient-to-r from-slate-700/20 via-slate-700/30 to-slate-700/20 rounded-lg ${className}`}
        />
      ))}
    </>
  );
};

/**
 * Card Skeleton for lists
 */
export const CardSkeleton: React.FC = () => (
  <div className="glass-card p-6 space-y-4">
    <Skeleton className="h-6 w-2/3" />
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-5/6" />
    <div className="flex gap-2 pt-4">
      <Skeleton className="h-10 w-24 rounded-lg" />
      <Skeleton className="h-10 w-24 rounded-lg" />
    </div>
  </div>
);

/**
 * Table Row Skeleton
 */
export const TableRowSkeleton: React.FC<{ columns?: number }> = ({ columns = 4 }) => (
  <tr className="hover:bg-white/5 transition-colors">
    {Array.from({ length: columns }).map((_, i) => (
      <td key={i} className="px-8 py-6">
        <Skeleton className="h-4 w-20" />
      </td>
    ))}
  </tr>
);

/**
 * Chart Skeleton
 */
export const ChartSkeleton: React.FC = () => (
  <div className="glass-card p-8 space-y-4">
    <Skeleton className="h-6 w-1/3" />
    <div className="h-80 flex items-end justify-between gap-4 pt-8">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton
          key={i}
          className="w-full"
          count={1}
        />
      ))}
    </div>
  </div>
);

export default Skeleton;
