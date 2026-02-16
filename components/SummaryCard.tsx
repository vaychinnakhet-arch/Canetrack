import React from 'react';
import { LucideIcon } from 'lucide-react';

interface SummaryCardProps {
  title: string;
  value: string;
  subValue?: string;
  icon: LucideIcon;
  color: 'green' | 'blue' | 'amber';
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ title, value, subValue, icon: Icon, color }) => {
  const colorClasses = {
    green: 'bg-green-50 text-green-700 border-green-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
  };

  const iconClasses = {
    green: 'bg-green-100 text-green-600',
    blue: 'bg-blue-100 text-blue-600',
    amber: 'bg-amber-100 text-amber-600',
  };

  return (
    <div className={`p-4 rounded-xl border ${colorClasses[color]} shadow-sm`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium opacity-80">{title}</span>
        <div className={`p-2 rounded-lg ${iconClasses[color]}`}>
          <Icon size={20} />
        </div>
      </div>
      <div className="text-2xl font-bold">{value}</div>
      {subValue && <div className="text-xs mt-1 opacity-75">{subValue}</div>}
    </div>
  );
};
