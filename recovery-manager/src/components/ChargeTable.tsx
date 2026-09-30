import React, { useState } from 'react';
import { Charge, DecisionType } from '../types';
import { DecisionBadge } from './DecisionBadge';
import { ArrowUpRight, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';

interface ChargeTableProps {
  charges: Charge[];
  onSelectCharge: (charge: Charge) => void;
  onOpenReviewQueue: () => void;
  onOpenAnalytics: () => void;
  onOpenEvidence: () => void;
}

export const ChargeTable: React.FC<ChargeTableProps> = ({
  charges,
  onSelectCharge,
  onOpenReviewQueue,
  onOpenAnalytics,
  onOpenEvidence
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [decisionFilter, setDecisionFilter] = useState<DecisionType | 'ALL'>('ALL');
  const [feeTypeFilter, setFeeTypeFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const uniqueFeeTypes = Array.from(new Set(charges.map((c) => c.chargeType)));
  const uniqueDecisions = Array.from(new Set(charges.map((charge) => charge.decision)));
  const reviewQueueCount = charges.filter((charge) => charge.decision === 'UNCERTAIN').length;

  // Filter charges
  const filteredCharges = charges.filter((charge) => {
    const matchesSearch =
      charge.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      charge.unitId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      charge.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      charge.fulfillmentCenter.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDecision =
      decisionFilter === 'ALL' || charge.decision === decisionFilter;

    const matchesFeeType =
      feeTypeFilter === 'ALL' || charge.chargeType === feeTypeFilter;

    return matchesSearch && matchesDecision && matchesFeeType;
  });

  const totalPages = Math.ceil(filteredCharges.length / pageSize) || 1;
  const paginatedCharges = filteredCharges.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="space-y-4">
      {/* Contextual Action Bar & Filters */}
      <div className="border border-[#E2DFD7] bg-[#FAF8F5] p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#737067] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search Charge ID, Unit ID, SKU, or FC..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-[#F5F3EE] border border-[#E2DFD7] pl-9 pr-3 py-2 text-xs text-[#151515] placeholder-[#8E8B83] focus:outline-none focus:border-[#151515] font-mono"
          />
        </div>

        {/* Filter buttons & Contextual Views */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Filter by decision"
            value={decisionFilter}
            onChange={(event) => {
              setDecisionFilter(event.target.value as DecisionType | 'ALL');
              setCurrentPage(1);
            }}
            className="border border-[#E2DFD7] bg-[#F5F3EE] px-3 py-1.5 text-xs text-[#151515] font-mono focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Decisions</option>
            {uniqueDecisions.map((decision) => {
              const label = decision === 'CLAIM' ? 'Claim' : decision === 'REJECT' ? 'Reject' : decision === 'UNCERTAIN' ? 'Uncertain' : decision;
              return <option key={decision} value={decision}>{label}</option>;
            })}
          </select>

          {/* Fee Type Dropdown */}
          <select
            value={feeTypeFilter}
            onChange={(e) => {
              setFeeTypeFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="border border-[#E2DFD7] bg-[#F5F3EE] px-3 py-1.5 text-xs text-[#151515] font-mono focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Fee Types</option>
            {uniqueFeeTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>

          {/* Contextual navigation buttons */}
          <button
            onClick={onOpenReviewQueue}
            className="border border-[#151515] bg-[#F5F3EE] hover:bg-[#151515] hover:text-[#F5F3EE] text-[#151515] px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap active:translate-y-[1px]"
          >
            Review Queue ({reviewQueueCount})
          </button>

          <button
            onClick={onOpenAnalytics}
            className="border border-[#E2DFD7] bg-[#F5F3EE] hover:border-[#151515] text-[#151515] px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap active:translate-y-[1px]"
          >
            Analytics & Precision
          </button>

          <button
            onClick={onOpenEvidence}
            className="border border-[#E2DFD7] bg-[#F5F3EE] hover:border-[#151515] text-[#151515] px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap active:translate-y-[1px]"
          >
            Evidence Explorer
          </button>
        </div>
      </div>

      {/* Main Operations Table */}
      <div className="border border-[#151515] bg-[#FAF8F5] overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[#151515] bg-[#EAE7DF] text-[#151515] font-mono uppercase tracking-wider text-[11px]">
              <th className="py-3 px-4 font-semibold">Charge ID</th>
              <th className="py-3 px-4 font-semibold">Unit ID</th>
              <th className="py-3 px-4 font-semibold">Charge Type</th>
              <th className="py-3 px-4 font-semibold text-right">Amount</th>
              <th className="py-3 px-4 font-semibold text-center">Decision</th>
              <th className="py-3 px-4 font-semibold text-right">Confidence</th>
              <th className="py-3 px-4 font-semibold">Evidence</th>
              <th className="py-3 px-4 font-semibold">Status</th>
              <th className="py-3 px-4 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2DFD7]">
            {paginatedCharges.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-[#737067] font-mono">
                  No charges matched the specified filter criteria.
                </td>
              </tr>
            ) : (
              paginatedCharges.map((charge) => (
                <tr
                  key={charge.id}
                  onClick={() => onSelectCharge(charge)}
                  className="hover:bg-[#F2EFE8] cursor-pointer transition-colors group"
                >
                  <td className="py-3 px-4 font-mono font-bold text-[#151515]">
                    {charge.id}
                  </td>
                  <td className="py-3 px-4 font-mono text-[#55524B]">
                    {charge.unitId || '—'}
                  </td>
                  <td className="py-3 px-4 font-medium text-[#151515]">
                    {charge.chargeType}
                  </td>
                  <td className="py-3 px-4 font-mono font-semibold text-[#151515] text-right tabular-nums">
                    {charge.currency}{charge.amount.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <DecisionBadge decision={charge.decision} size="sm" />
                  </td>
                  <td className="py-3 px-4 font-mono text-[#55524B] text-right tabular-nums">
                    {charge.confidence === null ? '—' : `${charge.confidence}%`}
                  </td>
                  <td className="py-3 px-4 text-[#737067] font-mono text-[11px]">
                    {charge.evidenceCount} Evidence
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`text-[11px] font-mono px-1.5 py-0.5 border ${
                        charge.status === 'Ready'
                          ? 'border-[#C5C2BA] text-[#55524B] bg-[#F5F3EE]'
                          : charge.status === 'Contradicted'
                          ? 'border-[#C64B32] text-[#C64B32] bg-[#FAF3F1]'
                          : 'border-[#8C8980] text-[#737067] bg-[#FAF8F5]'
                      }`}
                    >
                      {charge.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectCharge(charge);
                      }}
                      className="inline-flex items-center gap-1 font-mono text-[#151515] group-hover:text-[#C64B32] font-semibold transition-colors cursor-pointer"
                    >
                      <span>Investigate</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination & Summary */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-[#737067] pt-2">
        <div>
          Showing {paginatedCharges.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to{' '}
          {Math.min(currentPage * pageSize, filteredCharges.length)} of {filteredCharges.length} charges
          {filteredCharges.length !== charges.length && ` (filtered from ${charges.length})`}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1.5 border border-[#E2DFD7] bg-[#FAF8F5] disabled:opacity-30 disabled:cursor-not-allowed hover:border-[#151515] cursor-pointer text-[#151515]"
            title="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1.5 border border-[#E2DFD7] bg-[#FAF8F5] disabled:opacity-30 disabled:cursor-not-allowed hover:border-[#151515] cursor-pointer text-[#151515]"
            title="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
