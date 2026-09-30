import React from 'react';
import { AnalysisSummary, Charge } from '../types';
import { ChargeTable } from './ChargeTable';
import { Download, RefreshCw, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';

interface ResultsViewProps {
  charges: Charge[];
  summary: AnalysisSummary | null;
  validationErrors: Array<{ row: number; field: string; error: string }>;
  onSelectCharge: (charge: Charge) => void;
  onOpenReviewQueue: () => void;
  onOpenAnalytics: () => void;
  onOpenEvidence: () => void;
  onNewAnalysis: () => void;
}

export const ResultsView: React.FC<ResultsViewProps> = ({
  charges,
  summary,
  validationErrors,
  onSelectCharge,
  onOpenReviewQueue,
  onOpenAnalytics,
  onOpenEvidence,
  onNewAnalysis
}) => {
  const totalChargesCount = summary?.totalCharges ?? charges.length;
  const claimCharges = charges.filter((c) => c.decision === 'CLAIM');
  const rejectedCharges = charges.filter((c) => c.decision === 'REJECT' || c.decision === 'ACCEPTED');
  const uncertainCharges = charges.filter((c) => c.decision === 'UNCERTAIN' || c.decision === 'INSUFFICIENT_EVIDENCE');
  const reimbursedCharges = charges.filter((c) => c.decision === 'ALREADY_REIMBURSED');
  const outOfWindowCharges = charges.filter((c) => c.decision === 'OUT_OF_WINDOW');

  const claimsRecommendedCount = summary?.claimsRecommended ?? claimCharges.length;
  const rejectedCount = summary?.rejected ?? rejectedCharges.length;
  const uncertainCount = summary?.uncertain ?? uncertainCharges.length;
  const reimbursedCount = summary?.alreadyReimbursed ?? reimbursedCharges.length;
  const outOfWindowCount = summary?.outOfWindow ?? outOfWindowCharges.length;

  const formatAmounts = (items: Charge[]) => {
    const amountsByCurrency = items.reduce<Map<string, number>>((totals, charge) => {
      totals.set(charge.currency, (totals.get(charge.currency) ?? 0) + charge.amount);
      return totals;
    }, new Map());
    if (items.length === 0) return '0';
    return [...amountsByCurrency.entries()]
      .map(([currency, currencyAmount]) => `${currency} ${currencyAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}`)
      .join(' / ');
  };

  const handleExportCSV = () => {
    const headers = ['Charge ID', 'Unit ID', 'Charge Type', 'Amount', 'Currency', 'Decision', 'Confidence', 'Status', 'Date', 'SKU', 'Fulfillment Center'];
    const rows = charges.map((c) => [
      c.id,
      c.unitId,
      `"${c.chargeType}"`,
      c.amount,
      c.currency,
      c.decision,
      c.confidence === null ? '' : `${c.confidence}%`,
      c.status,
      c.date,
      c.sku,
      `"${c.fulfillmentCenter}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `recovery_results_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
      {/* Editorial Header & Asymmetric Layout */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#151515]">
        <div>
          <div className="text-xs uppercase tracking-widest text-[#737067] font-mono mb-2">
            Automated Audit Resolution Dossier
          </div>
          <h1 className="font-heading text-4xl sm:text-5xl font-bold tracking-tight text-[#151515] mb-3">
            Recovery Results
          </h1>
          <p className="text-base text-[#55524B] max-w-2xl leading-relaxed">
            Review charges identified as recoverable, unsupported, or requiring further investigation.
          </p>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 border border-[#151515] text-[#151515] text-xs font-medium hover:bg-[#ECE9E2] transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap active:translate-y-[1px]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Recovery CSV</span>
          </button>

          <button
            onClick={onNewAnalysis}
            className="px-4 py-2.5 bg-[#151515] text-[#F5F3EE] text-xs font-medium hover:bg-[#333333] transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap active:translate-y-[1px]"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Upload New Report</span>
          </button>
        </div>
      </div>

      {validationErrors.length > 0 && (
        <div className="border border-amber-700 bg-amber-50 p-4 text-sm text-amber-950">
          <div className="flex items-center gap-2 font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{validationErrors.length} CSV row validation issue(s); rejected rows are not included in the analysis.</span>
          </div>
          <ul className="mt-2 space-y-1 text-xs font-mono">
            {validationErrors.slice(0, 8).map((validationError, index) => (
              <li key={`${validationError.row}-${validationError.field}-${index}`}>
                Row {validationError.row}, {validationError.field}: {validationError.error}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Editorial Metric Blocks - Asymmetric layout, thin borders, strong typography */}
      {/* Metric Blocks - Exactly 3 Outputs: Claim, Reject, Uncertain */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 border border-[#151515] bg-[#FAF8F5] divide-y sm:divide-y-0 sm:divide-x divide-[#151515]">
        {/* Total Charges */}
        <div className="p-6">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#737067] block mb-1">
            Total Charges
          </span>
          <div className="font-heading text-3xl font-bold text-[#151515] tabular-nums">
            {totalChargesCount}
          </div>
          <div className="text-xs font-mono text-[#737067] mt-1 tabular-nums">
            {formatAmounts(charges)} gross ledger
          </div>
        </div>

        {/* Claim */}
        <div className="p-6 bg-emerald-50/60">
          <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-800 font-semibold block mb-1">
            Claim
          </span>
          <div className="font-heading text-3xl font-bold text-emerald-800 tabular-nums">
            {claimsRecommendedCount}
          </div>
          <div className="text-xs font-mono text-emerald-800 mt-1 font-medium tabular-nums">
            {formatAmounts(claimCharges)} recoverable
          </div>
        </div>

        {/* Reject */}
        <div className="p-6">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#737067] block mb-1">
            Reject
          </span>
          <div className="font-heading text-3xl font-bold text-[#151515] tabular-nums">
            {rejectedCount}
          </div>
          <div className="text-xs font-mono text-[#737067] mt-1 tabular-nums">
            {formatAmounts(rejectedCharges)} legitimate
          </div>
        </div>

        {/* Uncertain */}
        <div className="p-6 bg-amber-50/60">
          <span className="text-[11px] font-mono uppercase tracking-wider text-amber-900 font-semibold block mb-1">
            Uncertain
          </span>
          <div className="font-heading text-3xl font-bold text-amber-900 tabular-nums">
            {uncertainCount}
          </div>
          <div className="text-xs font-mono text-amber-800 mt-1 tabular-nums">
            {formatAmounts(uncertainCharges)} manual review
          </div>
        </div>
      </div>

      {/* Operations Table Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-xl font-bold tracking-tight text-[#151515]">
            Individual Charge Ledger
          </h2>
          <span className="text-xs font-mono text-[#737067]">
            Select any row to inspect complete upstream evidence & requirements
          </span>
        </div>

        <ChargeTable
          charges={charges}
          onSelectCharge={onSelectCharge}
          onOpenReviewQueue={onOpenReviewQueue}
          onOpenAnalytics={onOpenAnalytics}
          onOpenEvidence={onOpenEvidence}
        />
      </div>
    </div>
  );
};
