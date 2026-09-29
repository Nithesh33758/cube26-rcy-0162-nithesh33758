import React from 'react';
import { ANALYTICS_DATA } from '../data/mockData';
import { ArrowLeft, Target, Percent, ShieldCheck, Scale, AlertOctagon } from 'lucide-react';

interface AnalyticsPanelProps {
  onBack: () => void;
}

export const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({ onBack }) => {
  const data = ANALYTICS_DATA;

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
            Recovery Analytics & Precision
          </h1>
          <p className="text-sm text-[#55524B] mt-1 max-w-2xl leading-relaxed">
            Quantitative analysis of automated recovery decisions, false-positive mitigation, and operational telemetry precision.
          </p>
        </div>

        <div className="text-right">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#737067] block mb-0.5">
            Audit Ledger Sample
          </span>
          <span className="font-mono text-xs font-semibold text-[#151515]">
            320 Units / March 2026 Batch
          </span>
        </div>
      </div>

      {/* Hero Metric Section: CLAIM PRECISION (Visually Important) */}
      <div className="border border-[#151515] bg-[#151515] text-[#F5F3EE] p-8 sm:p-12 relative overflow-hidden">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#C5C2BA] mb-3 border-b border-[#333333] pb-1">
            <Target className="w-4 h-4 text-[#C64B32]" />
            <span>Primary Operational KPI</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-baseline gap-4 sm:gap-6 mb-4">
            <span className="font-heading text-6xl sm:text-7xl font-bold tracking-tight text-white tabular-nums">
              {data.claimPrecision}%
            </span>
            <span className="font-heading text-2xl sm:text-3xl font-semibold text-[#E2DFD7]">
              Verified Claim Precision
            </span>
          </div>

          <p className="text-sm text-[#C5C2BA] leading-relaxed max-w-2xl">
            178 out of 184 system-recommended claims passed independent warehouse audit and carrier reconciliation without clawback. Only 6 claims were contested or adjusted due to secondary packing exceptions.
          </p>

          <div className="mt-8 pt-6 border-t border-[#333333] grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
            <div>
              <span className="text-[#8E8B83] block uppercase text-[10px]">Precision Formula</span>
              <span className="text-white font-medium">TP / (TP + FP)</span>
            </div>
            <div>
              <span className="text-[#8E8B83] block uppercase text-[10px]">True Positives (TP)</span>
              <span className="text-white font-medium tabular-nums">{data.correctlySupportedClaims} Claims</span>
            </div>
            <div>
              <span className="text-[#8E8B83] block uppercase text-[10px]">False Positives (FP)</span>
              <span className="text-[#E57373] font-medium tabular-nums">{data.incorrectlyRecommendedClaims} Claims</span>
            </div>
            <div>
              <span className="text-[#8E8B83] block uppercase text-[10px]">Missed Claims (FN)</span>
              <span className="text-[#FFD54F] font-medium tabular-nums">{data.missedRecoverableClaims} Claims</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quantitative Rigor Metric Blocks (Editorial Asymmetric Layout) */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-0 border border-[#151515] bg-[#FAF8F5] divide-y md:divide-y-0 md:divide-x divide-[#151515]">
        <div className="p-6">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#737067] block mb-1">
            Total Charges
          </span>
          <div className="font-heading text-2xl font-bold text-[#151515] tabular-nums">
            {data.totalCharges}
          </div>
          <span className="text-[11px] font-mono text-[#737067] mt-1 block">
            ₹{data.totalChargesAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })} gross
          </span>
        </div>

        <div className="p-6 bg-[#FAF3F1]">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#C64B32] font-semibold block mb-1">
            Claims Recommended
          </span>
          <div className="font-heading text-2xl font-bold text-[#C64B32] tabular-nums">
            {data.claimsRecommended}
          </div>
          <span className="text-[11px] font-mono text-[#C64B32] mt-1 block font-medium">
            ₹{data.claimsRecommendedAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })} yield
          </span>
        </div>

        <div className="p-6">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#737067] block mb-1">
            Correctly Supported
          </span>
          <div className="font-heading text-2xl font-bold text-[#151515] tabular-nums">
            {data.correctlySupportedClaims}
          </div>
          <span className="text-[11px] font-mono text-emerald-800 mt-1 block">
            96.7% accuracy
          </span>
        </div>

        <div className="p-6">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#737067] block mb-1">
            Incorrectly Recommended
          </span>
          <div className="font-heading text-2xl font-bold text-[#151515] tabular-nums">
            {data.incorrectlyRecommendedClaims}
          </div>
          <span className="text-[11px] font-mono text-[#C64B32] mt-1 block">
            3.3% error rate
          </span>
        </div>

        <div className="p-6">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#737067] block mb-1">
            Missed Recoverable
          </span>
          <div className="font-heading text-2xl font-bold text-[#151515] tabular-nums">
            {data.missedRecoverableClaims}
          </div>
          <span className="text-[11px] font-mono text-[#737067] mt-1 block">
            False negatives
          </span>
        </div>

        <div className="p-6">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#737067] block mb-1">
            Uncertain Rate
          </span>
          <div className="font-heading text-2xl font-bold text-[#55524B] tabular-nums">
            {data.uncertainRate}%
          </div>
          <span className="text-[11px] font-mono text-[#737067] mt-1 block">
            {data.uncertain} in queue
          </span>
        </div>
      </div>

      {/* Editorial Detail Table: Recovery Yield by Fee Type */}
      <div className="border border-[#151515] bg-[#FAF8F5] p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E2DFD7]">
          <div>
            <h3 className="font-heading text-base font-bold text-[#151515]">
              Recovery Yield by Fee Type
            </h3>
            <p className="text-xs text-[#737067]">
              Performance across discrete ecommerce fee categories
            </p>
          </div>
          <span className="font-mono text-xs text-[#151515]">
            6 Categories
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#151515] text-[#737067] font-mono uppercase text-[10px]">
                <th className="py-2.5 px-3">Fee Category</th>
                <th className="py-2.5 px-3 text-right">Audited</th>
                <th className="py-2.5 px-3 text-right">Recoverable</th>
                <th className="py-2.5 px-3 text-right">Yield Rate</th>
                <th className="py-2.5 px-3 text-right">Total Recoverable</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2DFD7] font-mono">
              {data.feeTypeBreakdown.map((row) => (
                <tr key={row.type} className="hover:bg-[#F2EFE8]">
                  <td className="py-3 px-3 font-sans font-medium text-[#151515]">
                    {row.type}
                  </td>
                  <td className="py-3 px-3 text-right text-[#737067] tabular-nums">
                    {row.total}
                  </td>
                  <td className="py-3 px-3 text-right text-[#151515] font-semibold tabular-nums">
                    {row.recoverable}
                  </td>
                  <td className="py-3 px-3 text-right font-semibold text-[#C64B32] tabular-nums">
                    {row.yield}%
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-[#151515] tabular-nums">
                    ₹{row.recoverableAmount.toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
