import React, { useState } from 'react';
import { Charge, RequirementStatus } from '../types';
import { DecisionBadge } from './DecisionBadge';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  HelpCircle,
  Clock,
  MapPin,
  Barcode,
  Layers,
  FileCheck,
  Check,
  Copy,
  Download
} from 'lucide-react';

interface ChargeInvestigationProps {
  charge: Charge;
  allCharges: Charge[];
  onBack: () => void;
  onNavigateToCharge: (charge: Charge) => void;
  onUpdateChargeStatus?: (chargeId: string, newStatus: any) => void;
}

export const ChargeInvestigation: React.FC<ChargeInvestigationProps> = ({
  charge,
  allCharges,
  onBack,
  onNavigateToCharge
}) => {
  const [copied, setCopied] = useState(false);
  const [isAudited, setIsAudited] = useState(charge.status === 'Audited');

  const currentIndex = allCharges.findIndex((c) => c.id === charge.id);
  const prevCharge = currentIndex > 0 ? allCharges[currentIndex - 1] : null;
  const nextCharge = currentIndex < allCharges.length - 1 ? allCharges[currentIndex + 1] : null;

  const handleCopy = () => {
    navigator.clipboard.writeText(`DOCKET:${charge.id} / UNIT:${charge.unitId} / ${charge.chargeType} / ${charge.currency}${charge.amount}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderStatusBadge = (status: RequirementStatus) => {
    switch (status) {
      case 'PASS':
        return (
          <span className="font-mono text-xs font-semibold text-emerald-800 bg-[#E8F4EC] border border-emerald-300 px-2 py-0.5 inline-flex items-center gap-1">
            ✓ PASS
          </span>
        );
      case 'FAIL':
        return (
          <span className="font-mono text-xs font-semibold text-[#151515] bg-[#EAE6DD] border border-[#151515] px-2 py-0.5 inline-flex items-center gap-1">
            ✕ FAIL
          </span>
        );
      case 'MISSING':
        return (
          <span className="font-mono text-xs font-semibold text-[#C64B32] bg-[#FAF3F1] border border-[#C64B32] px-2 py-0.5 inline-flex items-center gap-1">
            ! MISSING
          </span>
        );
      case 'CONTRADICTED':
        return (
          <span className="font-mono text-xs font-semibold text-[#9C3824] bg-[#F7EBE8] border border-[#9C3824] px-2 py-0.5 inline-flex items-center gap-1">
            ≠ CONTRADICTED
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
      {/* Top Contextual Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E2DFD7]">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#151515] hover:text-[#C64B32] transition-colors cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Results</span>
          </button>

          <span className="text-[#C5C2BA]">/</span>

          <span className="font-mono text-xs text-[#737067]">
            Charge Audit Investigation
          </span>
        </div>

        {/* Prev / Next pagination */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => prevCharge && onNavigateToCharge(prevCharge)}
            disabled={!prevCharge}
            className="px-3 py-1.5 border border-[#E2DFD7] bg-[#FAF8F5] text-xs font-mono disabled:opacity-30 disabled:cursor-not-allowed hover:border-[#151515] text-[#151515] flex items-center gap-1 cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Prev ({prevCharge ? prevCharge.id : '—'})</span>
          </button>

          <button
            onClick={() => nextCharge && onNavigateToCharge(nextCharge)}
            disabled={!nextCharge}
            className="px-3 py-1.5 border border-[#E2DFD7] bg-[#FAF8F5] text-xs font-mono disabled:opacity-30 disabled:cursor-not-allowed hover:border-[#151515] text-[#151515] flex items-center gap-1 cursor-pointer"
          >
            <span>Next ({nextCharge ? nextCharge.id : '—'})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Header Lockup */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 pb-6 border-b border-[#151515]">
        <div>
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <span className="font-heading text-3xl sm:text-4xl font-bold text-[#151515]">
              {charge.id}
            </span>
            <DecisionBadge decision={charge.decision} size="lg" />
            <span className="font-mono text-xs bg-[#EAE6DD] text-[#55524B] px-2.5 py-1">
              {charge.confidence}% Confidence
            </span>
            <span className="font-mono text-xs border border-[#C5C2BA] text-[#55524B] px-2.5 py-1">
              Unit: {charge.unitId}
            </span>
          </div>

          <p className="text-sm text-[#737067] flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>{charge.chargeType}</span>
            <span aria-hidden="true">·</span>
            <span>SKU: {charge.sku}</span>
            <span aria-hidden="true">·</span>
            <span>{charge.fulfillmentCenter}</span>
            <span aria-hidden="true">·</span>
            <span>Transacted: {charge.date}</span>
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleCopy}
            className="px-3.5 py-2 border border-[#151515] bg-[#FAF8F5] hover:bg-[#ECE9E2] text-xs font-medium text-[#151515] transition-colors cursor-pointer flex items-center gap-1.5 active:translate-y-[1px]"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Reference Copied' : 'Copy Claim Ref'}</span>
          </button>

          <button
            onClick={() => setIsAudited(!isAudited)}
            className={`px-4 py-2 text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 active:translate-y-[1px] ${
              isAudited
                ? 'bg-emerald-800 text-white'
                : 'bg-[#151515] text-[#F5F3EE] hover:bg-[#333333]'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>{isAudited ? 'Marked as Audited' : 'Verify & Sign Audit'}</span>
          </button>
        </div>
      </div>

      {/* Editorial Asymmetric Layout (2 unequal columns: 5 cols / 7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (5 cols): Charge Information, Decision Explanation & Requirements */}
        <div className="lg:col-span-5 space-y-6">
          {/* Section A: Charge Information */}
          <div className="border border-[#151515] bg-[#FAF8F5] p-6 space-y-4">
            <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-[#151515] pb-3 border-b border-[#E2DFD7]">
              Charge Information
            </h3>

            <div className="grid grid-cols-2 gap-4 text-xs font-mono">
              <div>
                <span className="text-[#737067] uppercase block text-[10px] mb-0.5">
                  Charge ID
                </span>
                <span className="text-[#151515] font-bold text-sm">{charge.id}</span>
              </div>
              <div>
                <span className="text-[#737067] uppercase block text-[10px] mb-0.5">
                  Unit Identifier
                </span>
                <span className="text-[#151515] font-bold text-sm">{charge.unitId}</span>
              </div>
              <div>
                <span className="text-[#737067] uppercase block text-[10px] mb-0.5">
                  Charge Type
                </span>
                <span className="text-[#151515] font-semibold">{charge.chargeType}</span>
              </div>
              <div>
                <span className="text-[#737067] uppercase block text-[10px] mb-0.5">
                  Billed Amount
                </span>
                <span className="text-[#151515] font-bold text-base tabular-nums">
                  {charge.currency}{charge.amount.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-[#737067] uppercase block text-[10px] mb-0.5">
                  Billing Date
                </span>
                <span className="text-[#151515]">{charge.date}</span>
              </div>
              <div>
                <span className="text-[#737067] uppercase block text-[10px] mb-0.5">
                  Decision & Score
                </span>
                <span className="text-[#151515] font-bold">
                  {charge.decision} ({charge.confidence}%)
                </span>
              </div>
            </div>

            {/* Billed vs Actual Metrics */}
            {(charge.billedMetric || charge.actualMetric) && (
              <div className="pt-4 border-t border-[#E2DFD7] space-y-2 text-xs font-mono">
                <div className="p-2.5 bg-[#F5F3EE] border border-[#E2DFD7] space-y-1">
                  <div className="text-[#737067]">{charge.billedMetric}</div>
                  <div className="text-[#151515] font-bold">{charge.actualMetric}</div>
                  {charge.variance && (
                    <div className="text-[#C64B32] font-semibold pt-1 border-t border-[#E2DFD7]">
                      {charge.variance}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Section B: Decision Explanation */}
          <div className="border border-[#151515] bg-[#FAF8F5] p-6">
            <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-[#151515] mb-2 flex items-center justify-between">
              <span>Decision Explanation</span>
              <DecisionBadge decision={charge.decision} size="sm" />
            </h3>

            <blockquote className="mt-3 p-4 bg-[#F5F3EE] border-l-2 border-[#C64B32] text-sm text-[#151515] leading-relaxed italic">
              "{charge.decisionExplanation}"
            </blockquote>
          </div>

          {/* Section C: Requirements Check */}
          <div className="border border-[#151515] bg-[#FAF8F5] p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2DFD7]">
              <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-[#151515]">
                Contractual Requirements
              </h3>
              <span className="text-[11px] font-mono text-[#737067]">
                Clause Validation Matrix
              </span>
            </div>

            <div className="space-y-3">
              {charge.requirements.map((req) => (
                <div
                  key={req.id}
                  className="p-3.5 border border-[#E2DFD7] bg-[#F5F3EE] space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-heading text-sm font-semibold text-[#151515]">
                        {req.name}
                      </div>
                      <div className="text-xs text-[#737067] mt-0.5">
                        {req.description}
                      </div>
                    </div>
                    {renderStatusBadge(req.status)}
                  </div>

                  <div className="text-xs font-mono text-[#3E3C37] pt-2 border-t border-[#E2DFD7] bg-white/50 p-2">
                    <span className="text-[#737067] mr-1">Rule [{req.ruleCode}]:</span>
                    <span>{req.details}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (7 cols): Supporting Evidence Investigation Timeline & Upstream Logs */}
        <div className="lg:col-span-7 space-y-6">
          {/* Section D: Supporting Evidence Investigation Timeline */}
          <div className="border border-[#151515] bg-[#FAF8F5] p-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#151515] mb-6">
              <div>
                <h3 className="font-heading text-lg font-bold text-[#151515]">
                  Investigation Timeline
                </h3>
                <p className="text-xs text-[#737067]">
                  Deterministic audit path from charge ingestion to final recovery decision
                </p>
              </div>
              <span className="text-xs font-mono text-[#151515] font-semibold bg-[#EAE7DF] px-2 py-1">
                6 Verified Steps
              </span>
            </div>

            {/* Step-by-Step Investigation Timeline Diagram */}
            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[1px] before:bg-[#151515]">
              {/* Step 1: Charge Ingested */}
              <div className="relative">
                <div className="absolute -left-[27px] top-1 w-2.5 h-2.5 bg-[#151515] rounded-none"></div>
                <div className="font-heading text-xs font-bold uppercase tracking-wider text-[#151515]">
                  01. Charge Ingested
                </div>
                <p className="text-xs text-[#55524B] mt-0.5">
                  Billed under transaction ledger at {charge.date}. Amount: {charge.currency}{charge.amount.toFixed(2)}.
                </p>
              </div>

              {/* Step 2: Unit matched */}
              <div className="relative">
                <div className="absolute -left-[27px] top-1 w-2.5 h-2.5 bg-[#151515] rounded-none"></div>
                <div className="font-heading text-xs font-bold uppercase tracking-wider text-[#151515]">
                  02. Unit Matched
                </div>
                <p className="text-xs text-[#55524B] mt-0.5">
                  Unit serial {charge.unitId} matched with catalog SKU {charge.sku} in {charge.fulfillmentCenter}.
                </p>
              </div>

              {/* Step 3: Operational Event */}
              <div className="relative">
                <div className="absolute -left-[27px] top-1 w-2.5 h-2.5 bg-[#151515] rounded-none"></div>
                <div className="font-heading text-xs font-bold uppercase tracking-wider text-[#151515]">
                  03. Operational Event Correlated
                </div>
                <p className="text-xs text-[#55524B] mt-0.5">
                  Physical warehouse events indexed across dock receiving, prep stations, pack scales, and return bays.
                </p>
              </div>

              {/* Step 4: Evidence retrieved */}
              <div className="relative">
                <div className="absolute -left-[27px] top-1 w-2.5 h-2.5 bg-[#151515] rounded-none"></div>
                <div className="font-heading text-xs font-bold uppercase tracking-wider text-[#151515]">
                  04. Evidence Retrieved
                </div>
                <p className="text-xs text-[#55524B] mt-0.5">
                  {charge.evidence.length} authoritative telemetry records queried from manager repositories.
                </p>
              </div>

              {/* Step 5: Requirement checked */}
              <div className="relative">
                <div className="absolute -left-[27px] top-1 w-2.5 h-2.5 bg-[#151515] rounded-none"></div>
                <div className="font-heading text-xs font-bold uppercase tracking-wider text-[#151515]">
                  05. Requirement Checked
                </div>
                <p className="text-xs text-[#55524B] mt-0.5">
                  Contractual rules evaluated: {charge.requirements.filter((r) => r.status === 'PASS').length} Passed, {charge.requirements.filter((r) => r.status !== 'PASS').length} Deviated/Contradicted.
                </p>
              </div>

              {/* Step 6: Final decision */}
              <div className="relative">
                <div className="absolute -left-[27px] top-1 w-2.5 h-2.5 bg-[#C64B32] rounded-none"></div>
                <div className="font-heading text-xs font-bold uppercase tracking-wider text-[#C64B32]">
                  06. Final Recovery Decision
                </div>
                <p className="text-xs text-[#151515] font-semibold mt-0.5">
                  {charge.decision} recommended with {charge.confidence}% confidence score.
                </p>
              </div>
            </div>
          </div>

          {/* Section E: Upstream Evidence Records */}
          <div className="border border-[#151515] bg-[#FAF8F5] p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2DFD7]">
              <div>
                <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-[#151515]">
                  Upstream Manager Telemetry
                </h3>
                <p className="text-xs text-[#737067]">
                  Evidence retrieved from Receiving, Prep, Pack, and Returns Managers
                </p>
              </div>
              <span className="text-xs font-mono text-[#737067]">
                {charge.evidence.length} Records
              </span>
            </div>

            <div className="space-y-4">
              {charge.evidence.map((ev) => (
                <div
                  key={ev.id}
                  className="border border-[#E2DFD7] bg-[#F5F3EE] p-4 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#E2DFD7]">
                    <div className="flex items-center gap-2">
                      <span className="font-heading text-xs font-bold uppercase text-[#151515] bg-[#EAE6DD] px-2 py-0.5">
                        {ev.manager}
                      </span>
                      <span className="font-mono text-xs text-[#737067]">
                        {ev.id}
                      </span>
                    </div>

                    <span
                      className={`font-mono text-[11px] px-2 py-0.5 border ${
                        ev.status === 'VERIFIED'
                          ? 'border-emerald-300 text-emerald-800 bg-[#E8F4EC]'
                          : ev.status === 'DISCREPANCY'
                          ? 'border-[#C64B32] text-[#C64B32] bg-[#FAF3F1]'
                          : 'border-[#8C8980] text-[#737067] bg-[#FAF8F5]'
                      }`}
                    >
                      {ev.status}
                    </span>
                  </div>

                  <div className="text-sm font-medium text-[#151515]">
                    {ev.type}
                  </div>

                  <p className="text-xs text-[#55524B] leading-relaxed">
                    {ev.description}
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[#E2DFD7] text-[11px] font-mono text-[#737067]">
                    <div>
                      <span className="block text-[10px] uppercase">Timestamp</span>
                      <span className="text-[#151515]">{ev.timestamp}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase">Station / Line</span>
                      <span className="text-[#151515]">{ev.stationId}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase">Operator Ref</span>
                      <span className="text-[#151515]">{ev.operatorId}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase">Telemetry Ref</span>
                      <span className="text-[#151515]">{ev.systemRef}</span>
                    </div>
                  </div>

                  {ev.metric && (
                    <div className="p-2 bg-white border border-[#E2DFD7] text-xs font-mono font-semibold text-[#151515] flex items-center justify-between">
                      <span className="text-[#737067] font-normal uppercase text-[10px]">
                        Recorded Reading:
                      </span>
                      <span>{ev.metric}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
