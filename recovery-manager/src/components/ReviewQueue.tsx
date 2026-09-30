import React, { useMemo, useState } from 'react';
import { Charge, DecisionType } from '../types';
import { DecisionBadge } from './DecisionBadge';
import { ArrowLeft, ArrowUpRight, ShieldCheck } from 'lucide-react';

interface ReviewQueueProps {
  charges: Charge[];
  onBack: () => void;
  onSelectChargeId: (chargeId: string) => void;
}

const REVIEW_DECISIONS: DecisionType[] = ['UNCERTAIN'];

function formatAmount(charge: Charge): string {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: charge.currency }).format(charge.amount);
  } catch {
    return `${charge.currency} ${charge.amount.toFixed(2)}`;
  }
}

export const ReviewQueue: React.FC<ReviewQueueProps> = ({ charges, onBack, onSelectChargeId }) => {
  const [decisionFilter, setDecisionFilter] = useState<DecisionType | 'ALL'>('ALL');
  const reviewCharges = useMemo(
    () => charges.filter((charge) => REVIEW_DECISIONS.includes(charge.decision)),
    [charges]
  );
  const availableDecisions = Array.from(new Set(reviewCharges.map((charge) => charge.decision)));
  const filteredCharges = decisionFilter === 'ALL'
    ? reviewCharges
    : reviewCharges.filter((charge) => charge.decision === decisionFilter);

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
      {/* Contextual Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#151515]">
        <div>
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#151515] hover:text-[#C64B32] transition-colors cursor-pointer mb-3 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Results</span>
          </button>

          <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-[#151515]">
            Audit & Review Queue
          </h1>
          <p className="text-sm text-[#55524B] mt-1 max-w-2xl">
            Audit queue for uncertain charges requiring manual investigation and evidence review.
          </p>
        </div>

        {/* Filter segment */}
        <div className="flex items-center border border-[#151515] bg-[#F5F3EE] p-0.5 text-xs font-mono">
          {(['ALL', ...availableDecisions] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setDecisionFilter(filter)}
              className={`px-3 py-1.5 transition-colors cursor-pointer ${
                decisionFilter === filter
                  ? 'bg-[#151515] text-[#F5F3EE] font-semibold'
                  : 'text-[#737067] hover:text-[#151515]'
              }`}
            >
              {filter === 'ALL' ? 'ALL' : filter.replaceAll('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Immutable Governance Notice */}
      <div className="border border-[#E2DFD7] bg-[#FAF8F5] p-4 text-xs font-mono text-[#55524B] flex items-center gap-3">
        <ShieldCheck className="w-4 h-4 text-emerald-800 shrink-0" />
        <span>
          This view does not submit or store auditor overrides; backend decisions remain unchanged.
        </span>
      </div>

      {/* Review Cards Grid */}
      <div className="space-y-4">
        {filteredCharges.length === 0 ? (
          <div className="border border-[#E2DFD7] bg-[#FAF8F5] p-8 text-sm text-[#737067]">
            {charges.length === 0 ? 'No analysis results are loaded.' : 'No charges require review in this analysis.'}
          </div>
        ) : filteredCharges.map((item) => (
          <div
            key={item.id}
            className="border border-[#151515] bg-[#FAF8F5] p-6 space-y-4 transition-colors"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E2DFD7]">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => onSelectChargeId(item.id)}
                  className="font-heading text-lg font-bold text-[#151515] hover:text-[#C64B32] transition-colors underline decoration-dotted cursor-pointer"
                >
                  {item.id}
                </button>
                <span className="font-mono text-xs text-[#737067]">
                  Unit: {item.unitId || '—'}
                </span>
                <span className="font-medium text-xs text-[#151515]">
                  {item.chargeType}
                </span>
                <span className="font-mono text-xs font-bold text-[#151515] tabular-nums">
                  {formatAmount(item)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`text-[11px] font-mono px-2 py-0.5 border ${
                    'border-[#8C8980] text-[#737067] bg-[#FAF8F5]'
                  }`}
                >
                  {item.decision.replaceAll('_', ' ')}
                </span>
              </div>
            </div>

            {/* Decisions comparison block: Original vs Reviewed */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#F5F3EE] border border-[#E2DFD7] p-4 text-xs font-mono">
              <div>
                <span className="text-[#737067] uppercase block text-[10px] mb-1">
                  Original System Decision
                </span>
                <div className="flex items-center gap-2">
                  <DecisionBadge decision={item.originalDecision ?? item.decision} size="sm" />
                  <span className="text-[#737067] text-[11px]">
                    (Backend analysis)
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[#737067] uppercase block text-[10px] mb-1">
                  Auditor New Decision
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[#8E8B83] italic">No review decision stored</span>
                </div>
              </div>
            </div>

            {/* Review Reason & Auditor Meta */}
            <div className="space-y-2 text-xs">
              <div>
                <span className="font-mono text-[10px] uppercase text-[#737067] block mb-0.5">
                  Review Reason / Discrepancy Note
                </span>
                <p className="text-[#151515] font-medium leading-relaxed">
                  {item.decisionExplanation || 'No explanation was supplied by the backend.'}
                </p>
              </div>

              <div className="pt-2 border-t border-[#E2DFD7] flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-[#737067]">
                <div>
                  <span>Evidence records: </span>
                  <span className="text-[#151515] font-semibold">{item.evidenceCount}</span>
                </div>
                <div>
                  <span>Charge date: </span>
                  <span className="text-[#151515]">{item.date || 'Not supplied'}</span>
                </div>
              </div>
            </div>

            {/* Auditor Actions */}
            <div className="pt-2 flex flex-wrap items-center justify-end gap-2">
              <button
                onClick={() => onSelectChargeId(item.id)}
                className="px-3 py-1.5 border border-[#E2DFD7] hover:border-[#151515] text-xs font-medium text-[#151515] transition-colors cursor-pointer"
              >
                Inspect Telemetry Trail →
              </button>

              <button
                onClick={() => onSelectChargeId(item.id)}
                className="px-3.5 py-1.5 bg-[#151515] text-[#F5F3EE] text-xs font-medium hover:bg-[#333333] transition-colors cursor-pointer flex items-center gap-1 active:translate-y-[1px]"
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>Inspect Charge</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
