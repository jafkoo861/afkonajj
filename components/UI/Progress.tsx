
import React from 'react';

interface ProgressBarProps {
  value: number;
  max?: number;
  color?: string;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ 
  value, 
  max = 100, 
  color = 'bg-blue-600', 
  label,
  size = 'md' 
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const height = size === 'sm' ? 'h-1.5' : size === 'lg' ? 'h-4' : 'h-2.5';

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between mb-1 text-xs font-medium text-zinc-400">
          <span>{label}</span>
          <span>{Math.round(value)}/{max}</span>
        </div>
      )}
      <div className={`w-full bg-zinc-800 rounded-full ${height} overflow-hidden`}>
        <div 
          className={`${color} h-full transition-all duration-500 ease-out`} 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
