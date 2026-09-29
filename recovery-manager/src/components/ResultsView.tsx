import React from 'react';
import { Charge } from '../types';
import { ChargeTable } from './ChargeTable';
import { Download, RefreshCw, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';

interface ResultsViewProps {
  charges: Charge[];
  onSelectCharge: (charge: Charge) => void;
  onOpenReviewQueue: () => void;
  onOpenAnalytics: () => void;
  onOpenEvidence: () => void;
  onNewAnalysis: () => void;
}

export const ResultsView: React.FC<ResultsViewProps> = ({
  charges,
  onSelectCharge,
  onOpenReviewQueue,
  onOpenAnalytics,
  onOpenEvidence,
  onNewAnalysis
}) => {
  const totalChargesCount = charges.length;
  const claimsRecommended = charges.filter((c) => c.decision === 'CLAIM' || c.decision === 'CONTESTED');
  const rejectedCharges = charges.filter((c) => c.decision === 'REJECT' || c.decision === 'ACCEPTED');
  const uncertainCharges = charges.filter((c) =>
    c.decision === 'UNCERTAIN' || c.decision === 'INSUFFICIENT_EVIDENCE' || c.decision === 'PENDING_REVIEW');
  const reimbursedCharges = charges.filter((c) => c.decision === 'ALREADY_REIMBURSED');
  const outOfWindowCharges = charges.filter((c) => c.decision === 'OUT_OF_WINDOW');

  const totalAmount = charges.reduce((acc, c) => acc + c.amount, 0);
  const claimAmount = claimsRecommended.reduce((acc, c) => acc + c.amount, 0);
  const rejectAmount = rejectedCharges.reduce((acc, c) => acc + c.amount, 0);
  const uncertainAmount = uncertainCharges.reduce((acc, c) => acc + c.amount, 0);

  const handleExportCSV = () => {
    const headers = ['Charge ID', 'Unit ID', 'Charge Type', 'Amount', 'Currency', 'Decision', 'Confidence', 'Status', 'Date', 'SKU', 'Fulfillment Center'];
    const rows = charges.map((c) => [
      c.id,
      c.unitId,
      `"${c.chargeType}"`,
      c.amount,
      c.currency,
      c.decision,
      `${c.confidence}%`,
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

      {/* Editorial Metric Blocks - Asymmetric layout, thin borders, strong typography */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-0 border border-[#151515] bg-[#FAF8F5] divide-y md:divide-y-0 md:divide-x divide-[#151515]">
        {/* Total Charges */}
        <div className="p-6">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#737067] block mb-1">
            Total Charges
          </span>
          <div className="font-heading text-3xl font-bold text-[#151515] tabular-nums">
            {totalChargesCount}
          </div>
          <div className="text-xs font-mono text-[#737067] mt-1 tabular-nums">
            ₹{totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })} gross ledger
          </div>
        </div>

        {/* Claims Recommended - Burnt Rust Accent */}
        <div className="p-6 bg-[#FAF3F1]">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#C64B32] font-semibold block mb-1">
            Claims Recommended
          </span>
          <div className="font-heading text-3xl font-bold text-[#C64B32] tabular-nums">
            {claimsRecommended.length}
          </div>
          <div className="text-xs font-mono text-[#C64B32] mt-1 font-medium tabular-nums">
            ₹{claimAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })} recoverable
          </div>
        </div>

        {/* Rejected */}
        <div className="p-6">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#737067] block mb-1">
            Rejected
          </span>
          <div className="font-heading text-3xl font-bold text-[#151515] tabular-nums">
            {rejectedCharges.length}
          </div>
          <div className="text-xs font-mono text-[#737067] mt-1 tabular-nums">
            ₹{rejectAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })} supported fees
          </div>
        </div>

        {/* Uncertain */}
        <div className="p-6">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#737067] block mb-1">
            Uncertain
          </span>
          <div className="font-heading text-3xl font-bold text-[#55524B] tabular-nums">
            {uncertainCharges.length}
          </div>
          <div className="text-xs font-mono text-[#737067] mt-1 tabular-nums">
            ₹{uncertainAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })} for auditor queue
          </div>
        </div>

        <div className="p-6">
          <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-800 block mb-1">
            Already Reimbursed
          </span>
          <div className="font-heading text-3xl font-bold text-emerald-900 tabular-nums">
            {reimbursedCharges.length}
          </div>
          <div className="text-xs font-mono text-[#737067] mt-1 tabular-nums">
            Duplicate claim suppressed
          </div>
        </div>

        <div className="p-6">
          <span className="text-[11px] font-mono uppercase tracking-wider text-amber-800 block mb-1">
            Out of Window
          </span>
          <div className="font-heading text-3xl font-bold text-amber-900 tabular-nums">
            {outOfWindowCharges.length}
          </div>
          <div className="text-xs font-mono text-[#737067] mt-1 tabular-nums">
            Filing deadline passed
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
