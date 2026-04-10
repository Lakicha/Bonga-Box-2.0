import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon, title, description, action }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-24 h-24 bg-gradient-to-br from-purple-primary/20 to-magenta-accent/20 rounded-full flex items-center justify-center mb-6 border border-white/10">
        <Icon className="w-12 h-12 text-purple-primary" />
      </div>

      <h3 className="text-2xl font-bold text-white mb-3 text-center">{title}</h3>

      <p className="text-text-dim text-center max-w-md mb-8">
        {description}
      </p>

      {action && (
        <button
          onClick={action.onClick}
          className="px-8 py-3 bg-gradient-to-r from-purple-600 to-magenta-600 hover:from-purple-700 hover:to-magenta-700 text-white font-semibold rounded-lg transition-all duration-300 shadow-glow"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
