import React from 'react';
import { AnalysisSummary, Charge } from '../types';
import { ArrowLeft, Target } from 'lucide-react';

interface AnalyticsPanelProps {
  charges: Charge[];
  summary: AnalysisSummary | null;
  onBack: () => void;
}

function formatAmount(charges: Charge[]): string {
  const totals = charges.reduce<Map<string, number>>((amounts, charge) => {
    amounts.set(charge.currency, (amounts.get(charge.currency) ?? 0) + charge.amount);
    return amounts;
  }, new Map());
  if (totals.size === 0) return '0';
  return [...totals.entries()].map(([currency, amount]) =>
    `${currency} ${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}`).join(' / ');
}

export const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({ charges, summary, onBack }) => {
  const claimCharges = charges.filter((charge) => charge.decision === 'CLAIM');
  const rejectCharges = charges.filter((charge) => charge.decision === 'REJECT');
  const uncertainCharges = charges.filter((charge) => charge.decision === 'UNCERTAIN');
  const typeGroups = Array.from(charges.reduce<Map<string, Charge[]>>((groups, charge) => {
    const group = groups.get(charge.chargeType) ?? [];
    group.push(charge);
    groups.set(charge.chargeType, group);
    return groups;
  }, new Map()));
  const totalCharges = summary?.totalCharges ?? charges.length;
  const uncertain = summary?.uncertain ?? uncertainCharges.length;
  const uncertainRate = totalCharges === 0 ? 0 : (uncertain / totalCharges) * 100;
  const confidenceValues = charges.map((charge) => charge.confidence)
    .filter((confidence): confidence is number => confidence !== null);
  const averageConfidence = confidenceValues.length === 0 ? null
    : confidenceValues.reduce((total, confidence) => total + confidence, 0) / confidenceValues.length;

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
      {/* Header */}
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
            Recovery Analytics
          </h1>
          <p className="text-sm text-[#55524B] mt-1 max-w-2xl leading-relaxed">
            Counts and amounts derived from the completed backend analysis.
          </p>
        </div>

        <div className="text-right">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#737067] block mb-0.5">
            Current Analysis
          </span>
          <span className="font-mono text-xs font-semibold text-[#151515]">
            {summary ? `${summary.totalCharges} Charges` : 'No completed analysis'}
          </span>
        </div>
      </div>

      {!summary && (
        <div className="border border-[#E2DFD7] bg-[#FAF8F5] p-8 text-sm text-[#737067]">
          No completed analysis is loaded. Upload a charge report to view analytics.
        </div>
      )}

      {/* Hero Metric Section: CLAIM PRECISION (Visually Important) */}
      {summary && <div className="border border-[#151515] bg-[#151515] text-[#F5F3EE] p-8 sm:p-12 relative overflow-hidden">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#C5C2BA] mb-3 border-b border-[#333333] pb-1">
            <Target className="w-4 h-4 text-[#C64B32]" />
            <span>Primary Operational KPI</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-baseline gap-4 sm:gap-6 mb-4">
            <span className="font-heading text-6xl sm:text-7xl font-bold tracking-tight text-white tabular-nums">
              {summary?.claimsRecommended ?? 0}
            </span>
            <span className="font-heading text-2xl sm:text-3xl font-semibold text-[#E2DFD7]">
              CLAIM Decisions
            </span>
          </div>

          <p className="text-sm text-[#C5C2BA] leading-relaxed max-w-2xl">
            Backend analysis summary for the currently loaded report. Independent audit labels are not part of this response, so precision and false-positive rates cannot be calculated.
          </p>

          <div className="mt-8 pt-6 border-t border-[#333333] grid grid-cols-3 gap-4 text-xs font-mono">
            <div>
                <span className="text-[#8E8B83] block uppercase text-[10px]">Claim</span>
                <span className="text-emerald-400 font-medium tabular-nums">{summary?.claimsRecommended ?? 0}</span>
            </div>
            <div>
                <span className="text-[#8E8B83] block uppercase text-[10px]">Reject</span>
                <span className="text-[#E57373] font-medium tabular-nums">{summary?.rejected ?? 0}</span>
            </div>
            <div>
                <span className="text-[#8E8B83] block uppercase text-[10px]">Uncertain</span>
                <span className="text-[#FFD54F] font-medium tabular-nums">{summary?.uncertain ?? 0}</span>
            </div>
          </div>
        </div>
      </div>}

      {/* Quantitative Rigor Metric Blocks (Editorial Asymmetric Layout) */}
      {summary && <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 border border-[#151515] bg-[#FAF8F5] divide-y sm:divide-y-0 sm:divide-x divide-[#151515]">
        <div className="p-6">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#737067] block mb-1">
            Total Charges
          </span>
          <div className="font-heading text-2xl font-bold text-[#151515] tabular-nums">
            {summary?.totalCharges ?? charges.length}
          </div>
          <span className="text-[11px] font-mono text-[#737067] mt-1 block">
            {formatAmount(charges)} gross ledger
          </span>
        </div>

        <div className="p-6 bg-emerald-50/60">
          <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-800 font-semibold block mb-1">
            Claim
          </span>
          <div className="font-heading text-2xl font-bold text-emerald-800 tabular-nums">
            {summary?.claimsRecommended ?? 0}
          </div>
          <span className="text-[11px] font-mono text-emerald-800 mt-1 block font-medium">
            {formatAmount(claimCharges)} recoverable
          </span>
        </div>

        <div className="p-6">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#737067] block mb-1">
            Reject
          </span>
          <div className="font-heading text-2xl font-bold text-[#151515] tabular-nums">
            {summary?.rejected ?? 0}
          </div>
          <span className="text-[11px] font-mono text-[#737067] mt-1 block">
            {formatAmount(rejectCharges)} legitimate
          </span>
        </div>

        <div className="p-6 bg-amber-50/60">
          <span className="text-[11px] font-mono uppercase tracking-wider text-amber-900 font-semibold block mb-1">
            Uncertain
          </span>
          <div className="font-heading text-2xl font-bold text-amber-900 tabular-nums">
            {summary?.uncertain ?? 0}
          </div>
          <span className="text-[11px] font-mono text-amber-800 mt-1 block">
            {formatAmount(uncertainCharges)} manual review ({uncertainRate.toFixed(1)}%)
          </span>
        </div>
      </div>}

      {/* Editorial Detail Table: Recovery Yield by Fee Type */}
      {summary && <div className="border border-[#151515] bg-[#FAF8F5] p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E2DFD7]">
          <div>
            <h3 className="font-heading text-base font-bold text-[#151515]">
              Charge Breakdown by Type
            </h3>
            <p className="text-xs text-[#737067]">
              Backend decisions and ledger amounts grouped by charge type
            </p>
          </div>
            <span className="font-mono text-xs text-[#151515]">
            {typeGroups.length} Categories
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#151515] text-[#737067] font-mono uppercase text-[10px]">
                <th className="py-2.5 px-3">Fee Category</th>
                <th className="py-2.5 px-3 text-right">Charges</th>
                <th className="py-2.5 px-3 text-right">CLAIM</th>
                <th className="py-2.5 px-3 text-right">CLAIM Rate</th>
                <th className="py-2.5 px-3 text-right">CLAIM Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2DFD7] font-mono">
              {typeGroups.length === 0 ? <tr><td colSpan={5} className="py-8 text-center text-[#737067]">No charge rows were returned.</td></tr> : typeGroups.map(([chargeType, group]) => {
                const claims = group.filter((charge) => charge.decision === 'CLAIM');
                return <tr key={chargeType} className="hover:bg-[#F2EFE8]">
                  <td className="py-3 px-3 font-sans font-medium text-[#151515]">
                    {chargeType}
                  </td>
                  <td className="py-3 px-3 text-right text-[#737067] tabular-nums">
                    {group.length}
                  </td>
                  <td className="py-3 px-3 text-right text-[#151515] font-semibold tabular-nums">
                    {claims.length}
                  </td>
                  <td className="py-3 px-3 text-right font-semibold text-[#C64B32] tabular-nums">
                    {group.length === 0 ? '0.0' : (claims.length / group.length * 100).toFixed(1)}%
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-[#151515] tabular-nums">
                    {formatAmount(claims)}
                  </td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>
      </div>}
    </div>
  );
};
