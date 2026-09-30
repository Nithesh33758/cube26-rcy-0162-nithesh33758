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

  const normalized = (decision === 'CLAIM' || decision === 'CONTESTED')
    ? 'CLAIM'
    : (decision === 'REJECT' || decision === 'ACCEPTED' || decision === 'ALREADY_REIMBURSED' || decision === 'OUT_OF_WINDOW')
      ? 'REJECT'
      : 'UNCERTAIN';

  const palette = normalized === 'CLAIM'
    ? 'border-emerald-700 text-emerald-800 bg-emerald-50'
    : normalized === 'REJECT'
      ? 'border-[#151515] text-[#151515] bg-[#EBE8E1]'
      : 'border-amber-700 text-amber-900 bg-amber-50';

  return (
    <span className={`inline-flex items-center font-mono font-semibold tracking-wider uppercase border ${palette} ${sizeClasses[size]}`}>
      {normalized}
    </span>
  );
};
