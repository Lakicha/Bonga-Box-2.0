import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ProtectedContentProps {
  children: React.ReactNode;
  isLoading?: boolean;
  hasError?: boolean;
  errorMessage?: string;
  loadingComponent?: React.ReactNode;
}

const ProtectedContent: React.FC<ProtectedContentProps> = ({
  children,
  isLoading = false,
  hasError = false,
  errorMessage = 'An error occurred while loading content',
  loadingComponent,
}) => {
  if (isLoading) {
    return loadingComponent ? (
      <>{loadingComponent}</>
    ) : (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-flex items-center justify-center">
            <div className="w-12 h-12 rounded-full border-4 border-slate-700/30 border-t-purple-primary animate-spin" />
          </div>
          <p className="text-text-dim mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="max-w-md w-full bg-red-500/10 border border-red-500/20 rounded-2xl p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Error Loading Content</h3>
          <p className="text-red-400 text-sm">{errorMessage}</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedContent;
