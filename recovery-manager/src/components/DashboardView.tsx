import React, { useState } from 'react';
import {
  DASHBOARD_DATA,
  RecoveryTrendPoint
} from '../data/dashboardData';
import { useInView, useCountUp, useDecimalCountUp } from '../hooks/useInView';
import {
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  HelpCircle,
  Clock,
  ShieldCheck,
  FileCheck
} from 'lucide-react';

interface DashboardViewProps {
  onNavigateToCharges: () => void;
  onNavigateToReviews: () => void;
  onNavigateToEvidence: () => void;
  onNavigateToAnalytics: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigateToCharges,
  onNavigateToReviews,
  onNavigateToEvidence,
  onNavigateToAnalytics
}) => {
  const data = DASHBOARD_DATA;

  // Viewport observers for each of the 8 sequential sections
  const [s1Ref, s1InView] = useInView({ threshold: 0.15 });
  const [s2Ref, s2InView] = useInView({ threshold: 0.15 });
  const [s3Ref, s3InView] = useInView({ threshold: 0.15 });
  const [s4Ref, s4InView] = useInView({ threshold: 0.15 });
  const [s5Ref, s5InView] = useInView({ threshold: 0.15 });
  const [s6Ref, s6InView] = useInView({ threshold: 0.15 });
  const [s7Ref, s7InView] = useInView({ threshold: 0.15 });
  const [s8Ref, s8InView] = useInView({ threshold: 0.15 });

  // Section 1 animated count-ups
  const countCharges = useCountUp(1248, 800, s1InView);
  const countRecoveryLakhs = useDecimalCountUp(8.42, 2, 800, s1InView);
  const countClaims = useCountUp(428, 800, s1InView);
  const countUncertain = useCountUp(208, 800, s1InView);
  const countPrecision = useDecimalCountUp(91.4, 1, 800, s1InView);

  // Section 8 animated count-ups
  const s8Charges = useCountUp(1248, 700, s8InView);
  const s8Claims = useCountUp(428, 700, s8InView);
  const s8Recovery = useDecimalCountUp(8.42, 2, 700, s8InView);
  const s8Uncertain = useCountUp(208, 700, s8InView);
  const s8Precision = useDecimalCountUp(91.4, 1, 700, s8InView);

  // Section 3 interactive hover point for the Recovery Trend line chart
  const [activeTrendPoint, setActiveTrendPoint] = useState<RecoveryTrendPoint | null>(
    data.trend[data.trend.length - 1]
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-28 selection:bg-[#C64B32] selection:text-white">
      {/* ========================================================================= */}
      {/* SECTION 01 — OPENING / HERO                                               */}
      {/* ========================================================================= */}
      <section
        ref={s1Ref}
        className={`transition-all duration-700 ease-out transform ${
          s1InView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <div className="pb-8 border-b border-[#151515] mb-8">
          <div className="text-xs uppercase tracking-widest text-[#737067] font-mono mb-2">
            Executive Financial Operations Ledger
          </div>
          <h1 className="font-heading text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-[#151515] mb-4 text-balance">
            Recovery Intelligence
          </h1>
          <p className="text-lg sm:text-xl text-[#55524B] max-w-3xl leading-relaxed">
            A centralized operational dossier summarizing disputed fulfillment charges, upstream warehouse evidence, deterministic decisions, and verified capital recovery.
          </p>
        </div>

        {/* Headline Numbers Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 border border-[#151515] bg-[#FAF8F5] divide-y lg:divide-y-0 lg:divide-x divide-[#151515]">
          {/* Total Charges */}
          <div className="p-6">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#737067] block mb-1">
              Total Charges
            </span>
            <div className="font-heading text-3xl sm:text-4xl font-bold text-[#151515] tabular-nums">
              {s1InView ? countCharges.toLocaleString() : '0'}
            </div>
            <div className="text-xs font-mono text-[#737067] mt-1">
              Ledger intake batch
            </div>
          </div>

          {/* Potential Recovery */}
          <div className="p-6 bg-[#FAF3F1]">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#C64B32] font-semibold block mb-1">
              Potential Recovery
            </span>
            <div className="font-heading text-3xl sm:text-4xl font-bold text-[#C64B32] tabular-nums">
              ₹{s1InView ? countRecoveryLakhs.toFixed(2) : '0.00'}L
            </div>
            <div className="text-xs font-mono text-[#C64B32] font-medium mt-1">
              ₹8,42,500 total value
            </div>
          </div>

          {/* Claims Recommended */}
          <div className="p-6">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#737067] block mb-1">
              Claims Recommended
            </span>
            <div className="font-heading text-3xl sm:text-4xl font-bold text-[#151515] tabular-nums">
              {s1InView ? countClaims : '0'}
            </div>
            <div className="text-xs font-mono text-[#737067] mt-1">
              34.3% recovery rate
            </div>
          </div>

          {/* Uncertain */}
          <div className="p-6">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#737067] block mb-1">
              Uncertain
            </span>
            <div className="font-heading text-3xl sm:text-4xl font-bold text-[#55524B] tabular-nums">
              {s1InView ? countUncertain : '0'}
            </div>
            <div className="text-xs font-mono text-[#737067] mt-1">
              Requires audit review
            </div>
          </div>

          {/* Claim Precision */}
          <div className="p-6 col-span-2 lg:col-span-1 bg-[#151515] text-[#F5F3EE]">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#A8A49B] block mb-1">
              Claim Precision
            </span>
            <div className="font-heading text-3xl sm:text-4xl font-bold text-[#F5F3EE] tabular-nums">
              {s1InView ? countPrecision.toFixed(1) : '0.0'}%
            </div>
            <div className="text-xs font-mono text-[#A8A49B] mt-1">
              Zero clawback policy
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 02 — RECOVERY SNAPSHOT                                            */}
      {/* ========================================================================= */}
      <section
        ref={s2Ref}
        className={`transition-all duration-700 ease-out transform ${
          s2InView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <div className="pb-4 border-b border-[#151515] mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <div className="text-xs uppercase tracking-widest text-[#737067] font-mono mb-1">
              Section 02 · Operational Overview
            </div>
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#151515]">
              Recovery Snapshot
            </h2>
          </div>
          <span className="text-xs font-mono text-[#737067]">
            Active Settlement Batch · March 2026
          </span>
        </div>

        {/* Editorial Asymmetric Snapshot Layout */}
        <div className="border border-[#151515] bg-[#FAF8F5] p-6 sm:p-10 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Narrative Pillar (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              <div className="font-heading text-xl sm:text-2xl font-bold text-[#151515] leading-snug">
                One-third of audited fulfillment fees demonstrate quantifiable deviations from calibrated warehouse physical logs.
              </div>

              <p className="text-sm text-[#55524B] leading-relaxed">
                Out of 1,248 transactions processed across 4 fulfillment hubs (BLR1, DEL2, BOM1, and HYD1), 428 charges exhibited conclusive discrepancies between carrier billing tiers and physical station telemetry. The primary overcharge mechanisms isolated are phantom volumetric height adjustments (+340% cubic expansion) and baseline poly-mailer packaging billed at parcel rates.
              </p>

              <div className="pt-4 border-t border-[#E2DFD7] flex flex-wrap items-center gap-6 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                  <span className="text-[#151515] font-semibold">97.3% Unit Matching Rate</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#C64B32]"></span>
                  <span className="text-[#151515] font-semibold">₹8.42L Actionable Capital</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#737067]"></span>
                  <span className="text-[#151515] font-semibold">16.7% Uncertain Tolerance</span>
                </div>
              </div>
            </div>

            {/* Right Asymmetric Metric Block (5 cols) */}
            <div className="lg:col-span-5 bg-[#F5F3EE] border border-[#151515] p-6 space-y-5">
              <div className="text-xs font-mono uppercase tracking-wider text-[#737067] border-b border-[#E2DFD7] pb-2">
                Operational Highlights
              </div>

              <div className="space-y-4 text-xs font-mono">
                <div>
                  <div className="text-[#737067] uppercase text-[10px]">Gross Ingested Ledger</div>
                  <div className="text-xl font-bold text-[#151515] mt-0.5">₹24,86,500</div>
                  <div className="text-[#737067] text-[11px] mt-0.5">1,248 individual transactions examined</div>
                </div>

                <div className="pt-3 border-t border-[#E2DFD7]">
                  <div className="text-[#737067] uppercase text-[10px]">Deterministic Recovery Yield</div>
                  <div className="text-xl font-bold text-[#C64B32] mt-0.5">34.3% (₹8.42L)</div>
                  <div className="text-[#737067] text-[11px] mt-0.5">Dual-sensor corroborated dispute value</div>
                </div>

                <div className="pt-3 border-t border-[#E2DFD7]">
                  <div className="text-[#737067] uppercase text-[10px]">Dispute Confidence Index</div>
                  <div className="text-xl font-bold text-emerald-800 mt-0.5">91.4% Verified Precision</div>
                  <div className="text-[#737067] text-[11px] mt-0.5">6 adjusted / 178 validated without pushback</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 03 — RECOVERY TREND (VISUALIZATION 1)                             */}
      {/* ========================================================================= */}
      <section
        ref={s3Ref}
        className={`transition-all duration-700 ease-out transform ${
          s3InView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-[#151515] mb-8">
          <div>
            <div className="text-xs uppercase tracking-widest text-[#737067] font-mono mb-1">
              Section 03 · Visualization 01 of 02
            </div>
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#151515]">
              Recovery Value Over Time
            </h2>
            <p className="text-sm text-[#55524B] mt-1 max-w-xl">
              Clean line visualization communicating whether recoverable capital yields are accelerating across recent audit cycles.
            </p>
          </div>

          {activeTrendPoint && (
            <div className="flex items-center gap-6 text-xs font-mono border border-[#E2DFD7] bg-[#FAF8F5] px-4 py-2">
              <div>
                <span className="text-[#737067] uppercase block text-[10px]">Period</span>
                <span className="text-[#151515] font-semibold">{activeTrendPoint.periodLabel}</span>
              </div>
              <div>
                <span className="text-[#737067] uppercase block text-[10px]">Recovered Value</span>
                <span className="text-[#C64B32] font-bold text-sm">₹{activeTrendPoint.recoveryValue}k</span>
              </div>
              <div>
                <span className="text-[#737067] uppercase block text-[10px]">Precision</span>
                <span className="text-[#151515] font-semibold">{activeTrendPoint.precision}%</span>
              </div>
            </div>
          )}
        </div>

        {/* Visualization 1 Frame */}
        <div className="border border-[#151515] bg-[#FAF8F5] p-6 sm:p-10 space-y-6">
          <div className="relative h-64 sm:h-72 w-full">
            <svg
              className="w-full h-full overflow-visible"
              viewBox="0 0 700 240"
              preserveAspectRatio="none"
            >
              {/* Subtle Horizontal Gridlines */}
              <line x1="0" y1="20" x2="700" y2="20" stroke="#E2DFD7" strokeDasharray="3 3" />
              <line x1="0" y1="80" x2="700" y2="80" stroke="#E2DFD7" strokeDasharray="3 3" />
              <line x1="0" y1="140" x2="700" y2="140" stroke="#E2DFD7" strokeDasharray="3 3" />
              <line x1="0" y1="200" x2="700" y2="200" stroke="#151515" strokeWidth="1" />

              {/* Y Axis Labels */}
              <text x="5" y="16" fill="#8E8B83" fontSize="10" fontFamily="IBM Plex Mono">₹200k</text>
              <text x="5" y="76" fill="#8E8B83" fontSize="10" fontFamily="IBM Plex Mono">₹140k</text>
              <text x="5" y="136" fill="#8E8B83" fontSize="10" fontFamily="IBM Plex Mono">₹80k</text>
              <text x="5" y="196" fill="#8E8B83" fontSize="10" fontFamily="IBM Plex Mono">₹0k</text>

              {/* Shaded Area under Curve */}
              <path
                d={`M 50,${200 - (64 / 200) * 180}
                    L 150,${200 - (88 / 200) * 180}
                    L 250,${200 - (95 / 200) * 180}
                    L 350,${200 - (122 / 200) * 180}
                    L 450,${200 - (148 / 200) * 180}
                    L 550,${200 - (136 / 200) * 180}
                    L 650,${200 - (189 / 200) * 180}
                    L 650,200 L 50,200 Z`}
                fill="#C64B32"
                fillOpacity={s3InView ? "0.07" : "0"}
                className="transition-opacity duration-1000 ease-out"
              />

              {/* Progressive SVG Path Animation */}
              <path
                d={`M 50,${200 - (64 / 200) * 180}
                    L 150,${200 - (88 / 200) * 180}
                    L 250,${200 - (95 / 200) * 180}
                    L 350,${200 - (122 / 200) * 180}
                    L 450,${200 - (148 / 200) * 180}
                    L 550,${200 - (136 / 200) * 180}
                    L 650,${200 - (189 / 200) * 180}`}
                fill="none"
                stroke="#C64B32"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  strokeDasharray: 900,
                  strokeDashoffset: s3InView ? 0 : 900,
                  transition: 'stroke-dashoffset 1.4s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
              />

              {/* Data Node Markers */}
              {data.trend.map((pt, i) => {
                const cx = 50 + i * 100;
                const cy = 200 - (pt.recoveryValue / 200) * 180;
                const isActive = activeTrendPoint?.period === pt.period;

                return (
                  <g
                    key={pt.period}
                    className="cursor-pointer group"
                    onMouseEnter={() => setActiveTrendPoint(pt)}
                  >
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isActive ? 6 : 4}
                      fill={isActive ? '#C64B32' : '#FAF8F5'}
                      stroke="#C64B32"
                      strokeWidth={isActive ? '3' : '2'}
                      className="transition-all duration-200"
                    />
                    <text
                      x={cx}
                      y="222"
                      textAnchor="middle"
                      fill="#737067"
                      fontSize="11"
                      fontFamily="IBM Plex Mono"
                      className={`transition-opacity duration-700 ${s3InView ? 'opacity-100' : 'opacity-0'}`}
                      style={{ transitionDelay: `${i * 100}ms` }}
                    >
                      {pt.periodLabel}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-4 border-t border-[#E2DFD7] text-xs font-mono text-[#737067]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-0.5 bg-[#C64B32] inline-block"></span>
              <span>Recovery Value Progression (₹ Thousands)</span>
            </div>
            <span>Trajectory: +195% quarterly growth in resolved fee recovery</span>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 04 — DECISION OVERVIEW (VISUALIZATION 2)                          */}
      {/* ========================================================================= */}
      <section
        ref={s4Ref}
        className={`transition-all duration-700 ease-out transform ${
          s4InView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <div className="pb-4 border-b border-[#151515] mb-8">
          <div className="text-xs uppercase tracking-widest text-[#737067] font-mono mb-1">
            Section 04 · Visualization 02 of 02
          </div>
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#151515]">
            Decision Overview
          </h2>
          <p className="text-sm text-[#55524B] mt-1 max-w-xl">
            Classification distribution communicating how the deterministic audit engine partitions incoming charges.
          </p>
        </div>

        <div className="border border-[#151515] bg-[#FAF8F5] p-6 sm:p-10 space-y-8">
          {/* Restrained Visualization 2: Single Proportion Segment Bar */}
          <div className="space-y-2">
            <div className="h-6 w-full flex overflow-hidden border border-[#151515] bg-[#EAE6DD]">
              <div
                className="bg-[#C64B32] transition-all duration-1000 ease-out"
                style={{ width: s4InView ? '34.3%' : '0%' }}
                title="CLAIM: 34.3% (428 charges)"
              />
              <div
                className="bg-[#151515] transition-all duration-1000 ease-out"
                style={{ width: s4InView ? '49.0%' : '0%' }}
                title="REJECT: 49.0% (612 charges)"
              />
              <div
                className="bg-[#737067] transition-all duration-1000 ease-out"
                style={{ width: s4InView ? '16.7%' : '0%' }}
                title="UNCERTAIN: 16.7% (208 charges)"
              />
            </div>

            <div className="flex items-center justify-between text-xs font-mono text-[#737067] pt-1">
              <span className="text-[#C64B32] font-semibold">34.3% CLAIM</span>
              <span className="text-[#151515] font-semibold">49.0% REJECT</span>
              <span className="text-[#737067] font-semibold">16.7% UNCERTAIN</span>
            </div>
          </div>

          {/* Textual Interpretation beside/underneath rather than another graph */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-[#E2DFD7]">
            {/* 428 Claims Recommended */}
            <div className="p-4 bg-[#F5F3EE] border-l-2 border-[#C64B32] space-y-1.5">
              <div className="font-heading text-lg font-bold text-[#151515]">
                428 Claims Recommended
              </div>
              <p className="text-xs text-[#55524B] leading-relaxed">
                Supported by available operational evidence and applicable contractual requirements. Physical scale discrepancies exceed allowable baseline thresholds.
              </p>
              <div className="text-xs font-mono font-semibold text-[#C64B32] pt-1">
                Yield: ₹4,38,600
              </div>
            </div>

            {/* 612 Rejected */}
            <div className="p-4 bg-[#F5F3EE] border-l-2 border-[#151515] space-y-1.5">
              <div className="font-heading text-lg font-bold text-[#151515]">
                612 Rejected
              </div>
              <p className="text-xs text-[#55524B] leading-relaxed">
                Evidence or requirements do not support recovery. Station measurements align with billed fee tiers within the allowable 2.5% calibration margin.
              </p>
              <div className="text-xs font-mono font-semibold text-[#151515] pt-1">
                Supported: ₹2,96,400
              </div>
            </div>

            {/* 208 Uncertain */}
            <div className="p-4 bg-[#F5F3EE] border-l-2 border-[#737067] space-y-1.5">
              <div className="font-heading text-lg font-bold text-[#151515]">
                208 Uncertain
              </div>
              <p className="text-xs text-[#55524B] leading-relaxed">
                Requires human review because evidence or requirements are incomplete or contradictory between shift logs. Preserves seller credibility.
              </p>
              <div className="text-xs font-mono font-semibold text-[#55524B] pt-1">
                Triage Ledger: ₹1,07,500
              </div>
            </div>
          </div>

          {/* Explicit Mock Data Indicator */}
          <div className="pt-2 text-[11px] font-mono text-[#8E8B83] flex items-center justify-between border-t border-[#E2DFD7]">
            <span>Simulation Mode: Demonstrating verified deterministic classification logic</span>
            <span>Dataset: 1,248 Records</span>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 05 — RECOVERY FUNNEL                                               */}
      {/* ========================================================================= */}
      <section
        ref={s5Ref}
        className={`transition-all duration-700 ease-out transform ${
          s5InView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <div className="pb-4 border-b border-[#151515] mb-8">
          <div className="text-xs uppercase tracking-widest text-[#737067] font-mono mb-1">
            Section 05 · Systematic Filtering Pipeline
          </div>
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#151515]">
            Recovery Funnel
          </h2>
          <p className="text-sm text-[#55524B] mt-1 max-w-xl">
            A large operational progression detailing how charges move from raw ingestion to verified recovery capital.
          </p>
        </div>

        {/* Large Sequential Visual Progression (No graph slop) */}
        <div className="border border-[#151515] bg-[#FAF8F5] p-6 sm:p-10 space-y-3">
          {[
            {
              step: '01',
              title: 'Charges',
              metric: '1,248 Transactions',
              desc: 'Raw fee and reimbursement ledger ingested from carrier and settlement reports.'
            },
            {
              step: '02',
              title: 'Units Matched',
              metric: '1,214 Units (97.3%)',
              desc: 'Serials mapped to catalog product master, package specifications, and bin locations.'
            },
            {
              step: '03',
              title: 'Evidence Retrieved',
              metric: '1,142 Units (91.5%)',
              desc: 'Optical tare logs, Cubiscan dimensions, and carrier gate signatures pulled into audit dossier.'
            },
            {
              step: '04',
              title: 'Requirements Checked',
              metric: '524 Charges (42.0%)',
              desc: 'Contractual dispute clauses and tolerance boundaries evaluated across all operational events.'
            },
            {
              step: '05',
              title: 'Claims Recommended',
              metric: '428 Claims (34.3%)',
              desc: 'Authoritative recovery filings certified with verified dual-sensor telemetry proof.'
            },
            {
              step: '06',
              title: 'Recovery Value',
              metric: '₹8.42 Lakhs Realized',
              desc: 'High-confidence recoverable capital secured without clawback risk or carrier dispute penalties.'
            }
          ].map((stage, idx, arr) => {
            const isLast = idx === arr.length - 1;

            return (
              <div
                key={stage.title}
                className="transition-all duration-500 transform"
                style={{
                  opacity: s5InView ? 1 : 0,
                  transform: s5InView ? 'translateY(0)' : 'translateY(16px)',
                  transitionDelay: `${idx * 120}ms`
                }}
              >
                <div
                  className={`p-4 sm:p-5 border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isLast
                      ? 'border-[#C64B32] bg-[#FAF3F1]'
                      : 'border-[#E2DFD7] bg-[#F5F3EE]'
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-4">
                    <span
                      className={`w-7 h-7 flex items-center justify-center font-mono text-xs font-bold shrink-0 ${
                        isLast ? 'bg-[#C64B32] text-white' : 'bg-[#151515] text-[#F5F3EE]'
                      }`}
                    >
                      {stage.step}
                    </span>

                    <div>
                      <span
                        className={`font-heading text-base font-bold tracking-tight ${
                          isLast ? 'text-[#C64B32]' : 'text-[#151515]'
                        }`}
                      >
                        {stage.title}
                      </span>
                      <p className="text-xs text-[#55524B] mt-0.5 max-w-xl">
                        {stage.desc}
                      </p>
                    </div>
                  </div>

                  <div
                    className={`font-mono text-sm sm:text-base font-bold shrink-0 tabular-nums ${
                      isLast ? 'text-[#C64B32]' : 'text-[#151515]'
                    }`}
                  >
                    {stage.metric}
                  </div>
                </div>

                {!isLast && (
                  <div className="flex justify-center my-1">
                    <span className="text-xs font-mono text-[#A8A49B]">↓</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 06 — REVIEW QUEUE                                                 */}
      {/* ========================================================================= */}
      <section
        ref={s6Ref}
        className={`transition-all duration-700 ease-out transform ${
          s6InView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-[#151515] mb-8">
          <div>
            <div className="text-xs uppercase tracking-widest text-[#737067] font-mono mb-1">
              Section 06 · Human Review Queue
            </div>
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#151515]">
              Review Queue
            </h2>
            <p className="text-sm text-[#55524B] mt-1 max-w-xl">
              Items requiring human attention due to incomplete or contradictory warehouse evidence.
            </p>
          </div>

          <button
            onClick={onNavigateToReviews}
            className="px-4 py-2 bg-[#151515] text-[#F5F3EE] text-xs font-semibold hover:bg-[#333333] transition-colors cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
          >
            <span>View Reviews</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Compact Table / List */}
        <div className="border border-[#151515] bg-[#FAF8F5] p-6 sm:p-8 space-y-6">
          <div className="flex flex-wrap items-center gap-3 pb-4 border-b border-[#E2DFD7]">
            <span className="text-xs font-mono bg-[#EAE6DD] text-[#151515] px-2.5 py-1 font-semibold border border-[#D5D1C7]">
              12 Uncertain Cases
            </span>
            <span className="text-xs font-mono bg-[#FAF3F1] text-[#C64B32] px-2.5 py-1 font-semibold border border-[#F0D5D0]">
              5 Missing Evidence
            </span>
            <span className="text-xs font-mono bg-[#F7EBE8] text-[#9C3824] px-2.5 py-1 font-semibold border border-[#E9C4BC]">
              3 Contradictions
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#151515] font-mono uppercase text-[10px] text-[#737067]">
                  <th className="py-2.5 px-3">Charge ID</th>
                  <th className="py-2.5 px-3">Unit ID</th>
                  <th className="py-2.5 px-3">Discrepancy / Issue</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2DFD7] font-mono">
                {data.reviewQueue.items.map((item) => (
                  <tr
                    key={item.chargeId}
                    onClick={onNavigateToReviews}
                    className="hover:bg-[#F2EFE8] cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-3 font-bold text-[#151515]">
                      {item.chargeId}
                    </td>
                    <td className="py-3 px-3 text-[#737067]">
                      {item.unitId}
                    </td>
                    <td className="py-3 px-3 font-sans font-medium text-[#151515] max-w-sm truncate">
                      {item.issue}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-[#151515] tabular-nums">
                      {item.currency}{item.amount.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span
                        className={`text-[10px] px-2 py-0.5 border ${
                          item.status === 'Missing Evidence'
                            ? 'border-[#C64B32] text-[#C64B32] bg-[#FAF3F1]'
                            : item.status === 'Contradicted'
                            ? 'border-[#9C3824] text-[#9C3824] bg-[#F7EBE8]'
                            : 'border-[#8C8980] text-[#737067] bg-[#FAF8F5]'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pt-2 flex items-center justify-between text-xs text-[#737067]">
            <span>Immutable review protocol: Original findings preserved for dispute records</span>
            <button
              onClick={onNavigateToReviews}
              className="font-mono text-[#151515] hover:text-[#C64B32] font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>Inspect All Review Items</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 07 — RECENT RECOVERY ACTIVITY (Vertical Timeline)                 */}
      {/* ========================================================================= */}
      <section
        ref={s7Ref}
        className={`transition-all duration-700 ease-out transform ${
          s7InView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <div className="pb-4 border-b border-[#151515] mb-8">
          <div className="text-xs uppercase tracking-widest text-[#737067] font-mono mb-1">
            Section 07 · Operational Audit Log
          </div>
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#151515]">
            Recent Recovery Activity
          </h2>
          <p className="text-sm text-[#55524B] mt-1 max-w-xl">
            Live sequential feed of recent charges analyzed, evidence telemetry matches, and review items queued.
          </p>
        </div>

        <div className="border border-[#151515] bg-[#FAF8F5] p-6 sm:p-10">
          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[1px] before:bg-[#151515]">
            {[
              {
                time: '09:42',
                action: '18 charges analyzed',
                detail: 'Pack station scale logs correlated against carrier invoices. 12 claims validated at FC-BLR1.',
                tag: 'Analysis Complete',
                highlight: true
              },
              {
                time: '09:38',
                action: 'Evidence retrieved for 42 units',
                detail: 'Optical tare verification certificates synchronized from gate docks 2 and 4.',
                tag: 'Evidence Synced',
                highlight: false
              },
              {
                time: '09:31',
                action: '12 uncertain cases added to review',
                detail: 'Contradictory salvage condition classifications flagged for human audit determination.',
                tag: 'Triage Queue',
                highlight: false
              },
              {
                time: '09:24',
                action: 'Recovery analysis completed',
                detail: 'Batch #2026-03B completed through deterministic SLA rules engine. ₹1.89L recovered.',
                tag: 'Batch Finalized',
                highlight: true
              }
            ].map((activity, idx) => (
              <div
                key={activity.time}
                className="relative transition-all duration-500 transform"
                style={{
                  opacity: s7InView ? 1 : 0,
                  transform: s7InView ? 'translateY(0)' : 'translateY(12px)',
                  transitionDelay: `${idx * 150}ms`
                }}
              >
                {/* Node pin */}
                <div
                  className={`absolute -left-[27px] top-1.5 w-2.5 h-2.5 rounded-none ${
                    activity.highlight ? 'bg-[#C64B32]' : 'bg-[#151515]'
                  }`}
                />

                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-bold text-[#151515]">
                        {activity.time}
                      </span>
                      <span className="font-heading text-sm font-semibold text-[#151515]">
                        — {activity.action}
                      </span>
                      <span className="font-mono text-[10px] uppercase text-[#737067] bg-[#EAE6DD] px-1.5 py-0.2">
                        {activity.tag}
                      </span>
                    </div>

                    <p className="text-xs text-[#55524B] leading-relaxed">
                      {activity.detail}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 08 — FINAL RECOVERY SUMMARY ("Recovery at a glance")              */}
      {/* ========================================================================= */}
      <section
        ref={s8Ref}
        className={`transition-all duration-700 ease-out transform border border-[#151515] bg-[#151515] text-[#F5F3EE] p-8 sm:p-12 ${
          s8InView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <div className="max-w-4xl space-y-8">
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-[#A8A49B] mb-2">
              Section 08 · Investigation Conclusion
            </div>
            <h2 className="font-heading text-3xl sm:text-5xl font-bold tracking-tight text-white mb-3">
              Recovery at a glance
            </h2>
            <p className="text-sm sm:text-base text-[#C5C2BA] leading-relaxed max-w-2xl">
              Deterministic, audit-grade ecommerce recovery engine. Isolating non-compliant warehouse overcharges and recovering lost capital with zero carrier friction.
            </p>
          </div>

          {/* Key Summary Numbers with Viewport Count-ups */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-6 pt-6 border-t border-[#333333] text-xs font-mono">
            <div>
              <span className="text-[#8E8B83] block uppercase text-[10px] mb-1">
                Charges Analyzed
              </span>
              <span className="text-white text-2xl font-bold font-heading tabular-nums">
                {s8InView ? s8Charges.toLocaleString() : '0'}
              </span>
            </div>

            <div>
              <span className="text-[#8E8B83] block uppercase text-[10px] mb-1">
                Claims Recommended
              </span>
              <span className="text-white text-2xl font-bold font-heading tabular-nums">
                {s8InView ? s8Claims : '0'}
              </span>
            </div>

            <div>
              <span className="text-[#8E8B83] block uppercase text-[10px] mb-1">
                Potential Recovery
              </span>
              <span className="text-[#E57373] text-2xl font-bold font-heading tabular-nums">
                ₹{s8InView ? s8Recovery.toFixed(2) : '0.00'}L
              </span>
            </div>

            <div>
              <span className="text-[#8E8B83] block uppercase text-[10px] mb-1">
                Uncertain Cases
              </span>
              <span className="text-[#C5C2BA] text-2xl font-bold font-heading tabular-nums">
                {s8InView ? s8Uncertain : '0'}
              </span>
            </div>

            <div>
              <span className="text-[#8E8B83] block uppercase text-[10px] mb-1">
                Claim Precision
              </span>
              <span className="text-white text-2xl font-bold font-heading tabular-nums">
                {s8InView ? s8Precision.toFixed(1) : '0.0'}%
              </span>
            </div>
          </div>

          {/* Contextual Action Button to View All Charges */}
          <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <span className="text-xs text-[#8E8B83]">
              Ready to examine individual charge dossiers and telemetry logs?
            </span>

            <button
              onClick={onNavigateToCharges}
              className="px-6 py-3.5 bg-[#C64B32] text-white text-sm font-semibold hover:bg-[#B03F28] transition-colors cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap active:translate-y-[1px]"
            >
              <span>View All Charges →</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
