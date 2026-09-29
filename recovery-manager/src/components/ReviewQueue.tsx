import React, { useState } from 'react';
import { ReviewItem, DecisionType } from '../types';
import { DecisionBadge } from './DecisionBadge';
import { ArrowLeft, Check, X, AlertTriangle, ShieldCheck, Filter } from 'lucide-react';

interface ReviewQueueProps {
  items: ReviewItem[];
  onBack: () => void;
  onSelectChargeId: (chargeId: string) => void;
}

export const ReviewQueue: React.FC<ReviewQueueProps> = ({ items, onBack, onSelectChargeId }) => {
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>(items);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'ACCEPTED' | 'REJECTED'>('ALL');

  const handleUpdateDecision = (id: string, newDecision: DecisionType, status: 'ACCEPTED' | 'REJECTED') => {
    setReviewItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              reviewedDecision: newDecision,
              resolutionStatus: status,
              timestamp: `${new Date().toISOString().slice(0, 10)} ${new Date().toLocaleTimeString('en-US', { hour12: false })} IST`
            }
          : item
      )
    );
  };

  const filteredItems = reviewItems.filter((item) => {
    if (statusFilter === 'ALL') return true;
    return item.resolutionStatus === statusFilter;
  });

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
            Audit queue for uncertain recommendations, contradictory warehouse records, and operator flags.
          </p>
        </div>

        {/* Filter segment */}
        <div className="flex items-center border border-[#151515] bg-[#F5F3EE] p-0.5 text-xs font-mono">
          {(['ALL', 'PENDING', 'ACCEPTED', 'REJECTED'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-3 py-1.5 transition-colors cursor-pointer ${
                statusFilter === filter
                  ? 'bg-[#151515] text-[#F5F3EE] font-semibold'
                  : 'text-[#737067] hover:text-[#151515]'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Immutable Governance Notice */}
      <div className="border border-[#E2DFD7] bg-[#FAF8F5] p-4 text-xs font-mono text-[#55524B] flex items-center gap-3">
        <ShieldCheck className="w-4 h-4 text-emerald-800 shrink-0" />
        <span>
          Immutable Audit Record: Review decisions do not overwrite original system determinations. Original classifications remain preserved for contract reconciliation and dispute filings.
        </span>
      </div>

      {/* Review Cards Grid */}
      <div className="space-y-4">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="border border-[#151515] bg-[#FAF8F5] p-6 space-y-4 transition-colors"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E2DFD7]">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => onSelectChargeId(item.chargeId)}
                  className="font-heading text-lg font-bold text-[#151515] hover:text-[#C64B32] transition-colors underline decoration-dotted cursor-pointer"
                >
                  {item.chargeId}
                </button>
                <span className="font-mono text-xs text-[#737067]">
                  Unit: {item.unitId}
                </span>
                <span className="font-medium text-xs text-[#151515]">
                  {item.chargeType}
                </span>
                <span className="font-mono text-xs font-bold text-[#151515] tabular-nums">
                  ₹{item.amount.toFixed(2)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`text-[11px] font-mono px-2 py-0.5 border ${
                    item.resolutionStatus === 'PENDING'
                      ? 'border-[#8C8980] text-[#737067] bg-[#FAF8F5]'
                      : item.resolutionStatus === 'ACCEPTED'
                      ? 'border-emerald-300 text-emerald-800 bg-[#E8F4EC]'
                      : 'border-[#151515] text-[#151515] bg-[#EAE6DD]'
                  }`}
                >
                  Status: {item.resolutionStatus}
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
                  <DecisionBadge decision={item.originalDecision} size="sm" />
                  <span className="text-[#737067] text-[11px]">
                    (Deterministic rule evaluation)
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[#737067] uppercase block text-[10px] mb-1">
                  Auditor New Decision
                </span>
                <div className="flex items-center gap-2">
                  {item.reviewedDecision ? (
                    <DecisionBadge decision={item.reviewedDecision} size="sm" />
                  ) : (
                    <span className="text-[#8E8B83] italic">
                      Pending Auditor Determination
                    </span>
                  )}
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
                  {item.reviewReason}
                </p>
              </div>

              {item.notes && (
                <div className="p-2.5 bg-white border border-[#E2DFD7] text-[#55524B]">
                  <span className="font-mono font-semibold text-[#151515] mr-1">Auditor Note:</span>
                  {item.notes}
                </div>
              )}

              <div className="pt-2 border-t border-[#E2DFD7] flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-[#737067]">
                <div>
                  <span>Reviewer: </span>
                  <span className="text-[#151515] font-semibold">{item.reviewer}</span>
                </div>
                <div>
                  <span>Audit Timestamp: </span>
                  <span className="text-[#151515]">{item.timestamp}</span>
                </div>
              </div>
            </div>

            {/* Auditor Actions */}
            <div className="pt-2 flex flex-wrap items-center justify-end gap-2">
              <button
                onClick={() => onSelectChargeId(item.chargeId)}
                className="px-3 py-1.5 border border-[#E2DFD7] hover:border-[#151515] text-xs font-medium text-[#151515] transition-colors cursor-pointer"
              >
                Inspect Telemetry Trail →
              </button>

              <button
                onClick={() => handleUpdateDecision(item.id, 'CLAIM', 'ACCEPTED')}
                className="px-3.5 py-1.5 bg-[#C64B32] text-white text-xs font-medium hover:bg-[#B03F28] transition-colors cursor-pointer flex items-center gap-1 active:translate-y-[1px]"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Override to CLAIM</span>
              </button>

              <button
                onClick={() => handleUpdateDecision(item.id, 'REJECT', 'REJECTED')}
                className="px-3.5 py-1.5 bg-[#151515] text-[#F5F3EE] text-xs font-medium hover:bg-[#333333] transition-colors cursor-pointer flex items-center gap-1 active:translate-y-[1px]"
              >
                <X className="w-3.5 h-3.5" />
                <span>Confirm REJECT</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
