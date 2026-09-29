import React from 'react';
import { DecisionType } from '../types';

interface DecisionBadgeProps {
  decision: DecisionType;
  size?: 'sm' | 'md' | 'lg';
}

export const DecisionBadge: React.FC<DecisionBadgeProps> = ({ decision, size = 'md' }) => {
  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3.5 py-1.5'
  };

  const palette = decision === 'CLAIM' || decision === 'CONTESTED'
    ? 'border-[#C64B32] text-[#C64B32] bg-[#FAF3F1]'
    : decision === 'REJECT' || decision === 'ACCEPTED'
      ? 'border-[#151515] text-[#151515] bg-[#EBE8E1]'
      : decision === 'ALREADY_REIMBURSED'
        ? 'border-emerald-700 text-emerald-900 bg-[#E8F4EC]'
        : decision === 'OUT_OF_WINDOW'
          ? 'border-amber-700 text-amber-900 bg-amber-50'
          : 'border-[#8C8980] text-[#55524B] bg-[#F0EDE6]';

  return (
    <span className={`inline-flex items-center font-mono font-semibold tracking-wider uppercase border ${palette} ${sizeClasses[size]}`}>
      {decision.replaceAll('_', ' ')}
    </span>
  );
};
