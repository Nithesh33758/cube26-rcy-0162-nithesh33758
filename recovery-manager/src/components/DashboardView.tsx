import React, { useState } from 'react';
import { AnalysisSummary, Charge } from '../types';
import { useInView, useCountUp } from '../hooks/useInView';
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
  summary: AnalysisSummary | null;
  charges: Charge[];
  onNavigateToCharges: () => void;
  onNavigateToReviews: () => void;
  onNavigateToEvidence: () => void;
  onNavigateToAnalytics: () => void;
}

interface TrendPoint {
  period: string;
  periodLabel: string;
  claimsCount: number;
  rejectedCount: number;
  uncertainCount: number;
}

function formatAmounts(charges: Charge[]): string {
  const totals = charges.reduce<Map<string, number>>((amounts, charge) => {
    amounts.set(charge.currency, (amounts.get(charge.currency) ?? 0) + charge.amount);
    return amounts;
  }, new Map());
  if (totals.size === 0) return '0';
  return [...totals.entries()].map(([currency, amount]) =>
    `${currency} ${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}`).join(' / ');
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  summary,
  charges,
  onNavigateToCharges,
  onNavigateToReviews,
  onNavigateToEvidence,
  onNavigateToAnalytics
}) => {
  const totalCharges = summary?.totalCharges ?? charges.length;
  const claimsRecommended = summary?.claimsRecommended ?? charges.filter((charge) => charge.decision === 'CLAIM').length;
  const rejected = summary?.rejected ?? charges.filter((charge) => charge.decision === 'REJECT').length;
  const uncertain = summary?.uncertain ?? charges.filter((charge) => charge.decision === 'UNCERTAIN').length;
  const claimCharges = charges.filter((charge) => charge.decision === 'CLAIM');
  const reviewCharges = charges.filter((charge) => charge.decision === 'UNCERTAIN');

  const chargesByDecision = Array.from(charges.reduce<Map<string, Charge[]>>((groups, charge) => {
    const group = groups.get(charge.decision) ?? [];
    group.push(charge);
    groups.set(charge.decision, group);
    return groups;
  }, new Map()));
  const chargesByType = Array.from(charges.reduce<Map<string, Charge[]>>((groups, charge) => {
    const group = groups.get(charge.chargeType) ?? [];
    group.push(charge);
    groups.set(charge.chargeType, group);
    return groups;
  }, new Map()));
  const monthGroups = Array.from(charges.reduce<Map<string, Charge[]>>((groups, charge) => {
    const date = new Date(charge.date);
    if (Number.isNaN(date.getTime())) return groups;
    const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const group = groups.get(period) ?? [];
    group.push(charge);
    groups.set(period, group);
    return groups;
  }, new Map()).entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .slice(-7);
  const trendPoints = monthGroups.map(([period, group]): TrendPoint => ({
      period,
      periodLabel: new Date(`${period}-01T00:00:00`).toLocaleDateString(undefined, { month: 'short', year: '2-digit' }),
      claimsCount: group.filter((charge) => charge.decision === 'CLAIM').length,
      rejectedCount: group.filter((charge) => charge.decision === 'REJECT').length,
      uncertainCount: group.filter((charge) => charge.decision === 'UNCERTAIN').length
    }));
  const maxTrendCount = Math.max(1, ...trendPoints.flatMap((point) =>
    [point.claimsCount, point.rejectedCount, point.uncertainCount]));
  const confidenceValues = charges.map((charge) => charge.confidence)
    .filter((confidence): confidence is number => confidence !== null);
  const averageConfidence = confidenceValues.length === 0 ? null
    : confidenceValues.reduce((total, confidence) => total + confidence, 0) / confidenceValues.length;
  const chargesWithEvidence = charges.filter((charge) => charge.evidenceCount > 0).length;
  const chargesWithUnit = charges.filter((charge) => Boolean(charge.unitId)).length;
  const chargesWithRequirements = charges.filter((charge) => charge.requirements.length > 0).length;
  const funnelStages = [
    { title: 'Charges Returned', count: totalCharges, description: 'Charge rows included in the completed analysis response.' },
    { title: 'Unit IDs Supplied', count: chargesWithUnit, description: 'Returned rows with a unit identifier.' },
    { title: 'Evidence Attached', count: chargesWithEvidence, description: 'Returned rows with at least one evidence record.' },
    { title: 'Requirements Attached', count: chargesWithRequirements, description: 'Returned rows with applicable requirements.' },
    { title: 'CLAIM Decisions', count: claimsRecommended, description: 'Rows classified as CLAIM (actionable recovery).' },
    { title: 'Review Queue', count: reviewCharges.length, description: 'Uncertain decisions requiring investigation.' }
  ];
  const recentCharges = [...charges]
    .sort((left, right) => right.date.localeCompare(left.date))
    .slice(0, 4);
  const trendSvgPoints = trendPoints.map((point, index) => ({
    ...point,
    x: trendPoints.length === 1 ? 350 : 50 + (index * 600) / (trendPoints.length - 1),
    y: 200 - (point.claimsCount / maxTrendCount) * 180
  }));
  const trendLinePath = trendSvgPoints.map((point, index) =>
    `${index === 0 ? 'M' : 'L'} ${point.x},${point.y}`).join(' ');
  const firstTrendPoint = trendSvgPoints[0];
  const lastTrendPoint = trendSvgPoints[trendSvgPoints.length - 1];
  const trendAreaPath = firstTrendPoint && lastTrendPoint
    ? `${trendLinePath} L ${lastTrendPoint.x},200 L ${firstTrendPoint.x},200 Z`
    : '';

  // Viewport observers for each of the 8 sequential sections
  const [s1Ref, s1InView] = useInView({ threshold: 0.15 });
  const [s2Ref, s2InView] = useInView({ threshold: 0.15 });
  const [s3Ref, s3InView] = useInView({ threshold: 0.15 });
  const [s4Ref, s4InView] = useInView({ threshold: 0.15 });
  const [s5Ref, s5InView] = useInView({ threshold: 0.15 });
  const [s6Ref, s6InView] = useInView({ threshold: 0.15 });
  const [s7Ref, s7InView] = useInView({ threshold: 0.15 });
  const [s8Ref, s8InView] = useInView({ threshold: 0.15 });

  const countCharges = useCountUp(totalCharges, 800, s1InView);
  const countClaims = useCountUp(claimsRecommended, 800, s1InView);
  const countRejected = useCountUp(rejected, 800, s1InView);
  const countUncertain = useCountUp(uncertain, 800, s1InView);

  const s8Charges = useCountUp(totalCharges, 700, s8InView);
  const s8Claims = useCountUp(claimsRecommended, 700, s8InView);
  const s8Rejected = useCountUp(rejected, 700, s8InView);
  const s8Uncertain = useCountUp(uncertain, 700, s8InView);

  const [activeTrendPeriod, setActiveTrendPeriod] = useState<string | null>(null);
  const activeTrendPoint = trendSvgPoints.find((point) => point.period === activeTrendPeriod)
    ?? trendPoints[trendPoints.length - 1]
    ?? null;

  if (!summary) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="pb-8 border-b border-[#151515] mb-8">
          <div className="text-xs uppercase tracking-widest text-[#737067] font-mono mb-2">Executive Financial Operations Ledger</div>
          <h1 className="font-heading text-4xl sm:text-6xl font-bold tracking-tight text-[#151515] mb-4">Recovery Intelligence</h1>
          <p className="text-lg text-[#55524B] max-w-3xl leading-relaxed">Dashboard metrics appear here after a CSV report has completed backend analysis.</p>
        </div>
        <div className="border border-[#151515] bg-[#FAF8F5] p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <span className="text-sm text-[#55524B]">No completed analysis is loaded.</span>
          <button onClick={onNavigateToCharges} className="px-5 py-2.5 bg-[#151515] text-[#F5F3EE] text-sm font-semibold hover:bg-[#333333] transition-colors cursor-pointer">Upload Recovery Report</button>
        </div>
      </div>
    );
  }

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
            Summary of charge decisions and evidence returned by the completed backend analysis.
          </p>
        </div>

        {/* Headline Numbers Grid - 3 Outputs: Claim, Reject, Uncertain */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border border-[#151515] bg-[#FAF8F5] divide-y sm:divide-y-0 sm:divide-x divide-[#151515]">
          {/* Total Charges */}
          <div className="p-6">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#737067] block mb-1">
              Total Charges
            </span>
            <div className="font-heading text-3xl sm:text-4xl font-bold text-[#151515] tabular-nums">
              {s1InView ? countCharges.toLocaleString() : '0'}
            </div>
            <div className="text-xs font-mono text-[#737067] mt-1">
              From backend summary
            </div>
          </div>

          {/* Claim */}
          <div className="p-6 bg-emerald-50/60">
            <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-800 font-semibold block mb-1">
              Claim
            </span>
            <div className="font-heading text-3xl sm:text-4xl font-bold text-emerald-800 tabular-nums">
              {s1InView ? countClaims : '0'}
            </div>
            <div className="text-xs font-mono text-emerald-800 font-medium mt-1">
              {formatAmounts(claimCharges)} recoverable
            </div>
          </div>

          {/* Reject */}
          <div className="p-6">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#737067] block mb-1">
              Reject
            </span>
            <div className="font-heading text-3xl sm:text-4xl font-bold text-[#151515] tabular-nums">
              {s1InView ? countRejected : '0'}
            </div>
            <div className="text-xs font-mono text-[#737067] mt-1">
              Legitimate charges verified
            </div>
          </div>

          {/* Uncertain */}
          <div className="p-6 bg-amber-50/60">
            <span className="text-[11px] font-mono uppercase tracking-wider text-amber-900 font-semibold block mb-1">
              Uncertain
            </span>
            <div className="font-heading text-3xl sm:text-4xl font-bold text-amber-900 tabular-nums">
              {s1InView ? countUncertain : '0'}
            </div>
            <div className="text-xs font-mono text-amber-800 mt-1">
              Requires manual review
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
            Completed backend analysis
          </span>
        </div>

        {/* Editorial Asymmetric Snapshot Layout */}
        <div className="border border-[#151515] bg-[#FAF8F5] p-6 sm:p-10 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Narrative Pillar (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              <div className="font-heading text-xl sm:text-2xl font-bold text-[#151515] leading-snug">
                {totalCharges} charges returned across {chargesByType.length} charge types.
              </div>

              <p className="text-sm text-[#55524B] leading-relaxed">
                The backend summary reports {claimsRecommended} CLAIM decisions, {rejected} REJECT decisions, and {uncertain} UNCERTAIN decisions.
              </p>

              <div className="pt-4 border-t border-[#E2DFD7] flex flex-wrap items-center gap-6 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                  <span className="text-[#151515] font-semibold">{chargesWithUnit} charges with unit IDs</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#C64B32]"></span>
                  <span className="text-[#151515] font-semibold">{chargesWithEvidence} charges with evidence</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#737067]"></span>
                  <span className="text-[#151515] font-semibold">{chargesWithRequirements} charges with requirements</span>
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
                  <div className="text-xl font-bold text-[#151515] mt-0.5">{formatAmounts(charges)}</div>
                  <div className="text-[#737067] text-[11px] mt-0.5">{totalCharges} returned charge rows</div>
                </div>

                <div className="pt-3 border-t border-[#E2DFD7]">
                  <div className="text-[#737067] uppercase text-[10px]">CLAIM Decision Amount</div>
                  <div className="text-xl font-bold text-[#C64B32] mt-0.5">{formatAmounts(claimCharges)}</div>
                  <div className="text-[#737067] text-[11px] mt-0.5">Sum of amounts on CLAIM decision rows</div>
                </div>

                <div className="pt-3 border-t border-[#E2DFD7]">
                  <div className="text-[#737067] uppercase text-[10px]">Average Supplied Confidence</div>
                  <div className="text-xl font-bold text-emerald-800 mt-0.5">{averageConfidence === null ? 'Not available' : `${averageConfidence.toFixed(1)}%`}</div>
                  <div className="text-[#737067] text-[11px] mt-0.5">{confidenceValues.length} charges supplied confidence</div>
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
              CLAIM Decisions by Charge Date
            </h2>
            <p className="text-sm text-[#55524B] mt-1 max-w-xl">
              Monthly charge counts for rows the backend classified as CLAIM.
            </p>
          </div>

          {activeTrendPoint && (
            <div className="flex items-center gap-6 text-xs font-mono border border-[#E2DFD7] bg-[#FAF8F5] px-4 py-2">
              <div>
                <span className="text-[#737067] uppercase block text-[10px]">Period</span>
                <span className="text-[#151515] font-semibold">{activeTrendPoint.periodLabel}</span>
              </div>
              <div>
                <span className="text-[#737067] uppercase block text-[10px]">CLAIM Decisions</span>
                <span className="text-[#C64B32] font-bold text-sm">{activeTrendPoint.claimsCount}</span>
              </div>
              <div>
                <span className="text-[#737067] uppercase block text-[10px]">Rejected</span>
                <span className="text-[#151515] font-semibold">{activeTrendPoint.rejectedCount}</span>
              </div>
            </div>
          )}
        </div>

        {/* Visualization 1 Frame */}
        <div className="border border-[#151515] bg-[#FAF8F5] p-6 sm:p-10 space-y-6">
          {trendPoints.length === 0 && (
            <p className="text-sm text-[#737067]">No valid charge dates were returned for a monthly trend.</p>
          )}
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
              <text x="5" y="16" fill="#8E8B83" fontSize="10" fontFamily="IBM Plex Mono">{maxTrendCount}</text>
              <text x="5" y="76" fill="#8E8B83" fontSize="10" fontFamily="IBM Plex Mono">{Math.round(maxTrendCount * 2 / 3)}</text>
              <text x="5" y="136" fill="#8E8B83" fontSize="10" fontFamily="IBM Plex Mono">{Math.round(maxTrendCount / 3)}</text>
              <text x="5" y="196" fill="#8E8B83" fontSize="10" fontFamily="IBM Plex Mono">0</text>

              {/* Shaded Area under Curve */}
              <path
                d={trendAreaPath}
                fill="#C64B32"
                fillOpacity={s3InView ? "0.07" : "0"}
                className="transition-opacity duration-1000 ease-out"
              />

              {/* Progressive SVG Path Animation */}
              <path
                d={trendLinePath}
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
              {trendSvgPoints.map((pt, i) => {
                const cx = pt.x;
                const cy = pt.y;
                const isActive = activeTrendPoint?.period === pt.period;

                return (
                  <g
                    key={pt.period}
                    className="cursor-pointer group"
                    onMouseEnter={() => setActiveTrendPeriod(pt.period)}
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
              <span>CLAIM decision count by charge month</span>
            </div>
            <span>{trendPoints.length} date periods available</span>
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
            Distribution of the exact decision values returned for this analysis.
          </p>
        </div>

        <div className="border border-[#151515] bg-[#FAF8F5] p-6 sm:p-10 space-y-8">
          {/* Restrained Visualization 2: Single Proportion Segment Bar */}
          <div className="space-y-2">
            <div className="h-6 w-full flex overflow-hidden border border-[#151515] bg-[#EAE6DD]">
              {chargesByDecision.map(([decision, group]) => {
                const color = decision === 'CLAIM' ? '#166534'
                  : decision === 'REJECT' ? '#151515' : '#D97706';
                const width = totalCharges === 0 ? 0 : (group.length / totalCharges) * 100;
                return <div key={decision} className="transition-all duration-1000 ease-out" style={{ width: s4InView ? `${width}%` : '0%', backgroundColor: color }} title={`${decision}: ${group.length} charges`} />;
              })}
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-[#737067] pt-1">
              {chargesByDecision.map(([decision, group]) => (
                <span key={decision} className="font-semibold">{decision.replaceAll('_', ' ')}: {group.length}</span>
              ))}
            </div>
          </div>

          {/* Textual Interpretation beside/underneath rather than another graph */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-[#E2DFD7]">
            {chargesByDecision.map(([decision, group]) => (
              <div key={decision} className="p-4 bg-[#F5F3EE] border-l-2 border-[#C64B32] space-y-1.5">
                <div className="font-heading text-lg font-bold text-[#151515]">{group.length} {decision.replaceAll('_', ' ')}</div>
                <p className="text-xs text-[#55524B] leading-relaxed">Returned by the backend for this analysis.</p>
                <div className="text-xs font-mono font-semibold text-[#C64B32] pt-1">{formatAmounts(group)}</div>
              </div>
            ))}
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
          {funnelStages.map((stage, idx, arr) => {
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
                      {String(idx + 1).padStart(2, '0')}
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
                        {stage.description}
                      </p>
                    </div>
                  </div>

                  <div
                    className={`font-mono text-sm sm:text-base font-bold shrink-0 tabular-nums ${
                      isLast ? 'text-[#C64B32]' : 'text-[#151515]'
                    }`}
                  >
                    {stage.count} ({totalCharges === 0 ? '0.0' : (stage.count / totalCharges * 100).toFixed(1)}%)
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
              Backend decisions returned for human review or follow-up.
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
            <span className="text-xs font-mono bg-amber-50 text-amber-900 px-2.5 py-1 font-semibold border border-amber-300">
              {summary.uncertain} Uncertain Decisions
            </span>
            <span className="text-xs font-mono bg-[#FAF8F5] text-[#737067] px-2.5 py-1 font-semibold border border-[#D5D1C7]">
              {charges.filter((charge) => charge.evidenceCount === 0).length} With No Evidence Records
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
                  <th className="py-2.5 px-3 text-center">Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2DFD7] font-mono">
                {reviewCharges.length === 0 ? (
                  <tr><td colSpan={5} className="py-8 text-center text-[#737067]">No review decisions in this analysis.</td></tr>
                ) : reviewCharges.slice(0, 8).map((item) => (
                  <tr
                    key={item.id}
                    onClick={onNavigateToReviews}
                    className="hover:bg-[#F2EFE8] cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-3 font-bold text-[#151515]">
                      {item.id}
                    </td>
                    <td className="py-3 px-3 text-[#737067]">
                      {item.unitId}
                    </td>
                    <td className="py-3 px-3 font-sans font-medium text-[#151515] max-w-sm truncate">
                      {item.decisionExplanation}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-[#151515] tabular-nums">
                      {formatAmounts([item])}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <DecisionBadge decision={item.decision} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pt-2 flex items-center justify-between text-xs text-[#737067]">
            <span>Review list derived from current backend decisions</span>
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
            Recent Analysis Results
          </h2>
          <p className="text-sm text-[#55524B] mt-1 max-w-xl">
            Most recent charge rows returned by the backend analysis.
          </p>
        </div>

        <div className="border border-[#151515] bg-[#FAF8F5] p-6 sm:p-10">
          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[1px] before:bg-[#151515]">
            {recentCharges.length === 0 ? (
              <p className="text-sm text-[#737067]">No charge rows were returned.</p>
            ) : recentCharges.map((activity, idx) => (
              <div
                key={activity.id}
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
                    activity.decision === 'CLAIM' ? 'bg-[#C64B32]' : 'bg-[#151515]'
                  }`}
                />

                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-bold text-[#151515]">
                        {activity.date || 'Date not supplied'}
                      </span>
                      <span className="font-heading text-sm font-semibold text-[#151515]">
                        — {activity.id} · {activity.decision.replaceAll('_', ' ')}
                      </span>
                      <span className="font-mono text-[10px] uppercase text-[#737067] bg-[#EAE6DD] px-1.5 py-0.2">
                        Backend Result
                      </span>
                    </div>

                    <p className="text-xs text-[#55524B] leading-relaxed">
                      {activity.decisionExplanation || 'No explanation was supplied by the backend.'}
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
              Decision counts and charge details from the currently loaded backend analysis. No precision estimate is shown without independent audit labels.
            </p>
          </div>

          {/* Key Summary Numbers with Viewport Count-ups */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-6 border-t border-[#333333] text-xs font-mono">
            <div>
              <span className="text-[#8E8B83] block uppercase text-[10px] mb-1">
                Charges Analyzed
              </span>
              <span className="text-white text-2xl font-bold font-heading tabular-nums">
                {s8InView ? s8Charges.toLocaleString() : '0'}
              </span>
            </div>

            <div>
              <span className="text-emerald-400 block uppercase text-[10px] mb-1">
                Claim Decisions
              </span>
              <span className="text-emerald-400 text-2xl font-bold font-heading tabular-nums">
                {s8InView ? s8Claims : '0'}
              </span>
            </div>

            <div>
              <span className="text-[#8E8B83] block uppercase text-[10px] mb-1">
                Reject Decisions
              </span>
              <span className="text-white text-2xl font-bold font-heading tabular-nums">
                {s8InView ? s8Rejected : '0'}
              </span>
            </div>

            <div>
              <span className="text-amber-400 block uppercase text-[10px] mb-1">
                Uncertain Cases
              </span>
              <span className="text-amber-400 text-2xl font-bold font-heading tabular-nums">
                {s8InView ? s8Uncertain : '0'}
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
