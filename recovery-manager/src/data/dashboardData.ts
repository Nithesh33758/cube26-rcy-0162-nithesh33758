export interface DashboardMetrics {
  totalCharges: number;
  totalChargesFormatted: string;
  totalChargeValue: string;
  totalChargeValueRaw: number;
  claimsRecommended: number;
  rejected: number;
  uncertain: number;
  claimPrecision: number;
}

export interface RecoveryTrendPoint {
  period: string;
  periodLabel: string;
  recoveryValue: number; // in thousands of ₹
  claimsCount: number;
  rejectedCount: number;
  precision: number;
}

export interface DecisionDistribution {
  category: 'CLAIM' | 'REJECT' | 'UNCERTAIN';
  label: string;
  count: number;
  percentage: number;
  color: string;
  amount: string;
  description: string;
}

export interface ChargeTypeBreakdown {
  chargeType: string;
  count: number;
  percentage: number;
  recoverableValue: string;
  recoverableValueRaw: number;
  avgVariance: string;
}

export interface FunnelStage {
  step: number;
  name: string;
  subtitle: string;
  metric: string;
  percent: number;
  detail: string;
}

export interface EvidenceQualityMetrics {
  evidenceAvailable: number;
  evidenceMissing: number;
  contradictoryEvidence: number;
  unitsMatched: number;
  unitsMatchedTotal: number;
  unitsMatchedPercent: number;
  unitsRequiringReview: number;
  unitsRequiringReviewPercent: number;
}

export interface DashboardReviewItem {
  chargeId: string;
  unitId: string;
  issue: string;
  amount: number;
  currency: string;
  status: 'Uncertain' | 'Missing Evidence' | 'Contradicted' | 'Pending Audit';
}

export interface RecentActivityItem {
  time: string;
  chargeId: string;
  unitId: string;
  action: 'Claim recommended' | 'Marked uncertain' | 'Rejected' | 'Evidence verified';
  amount: number;
  currency: string;
  detail: string;
  type: 'claim' | 'uncertain' | 'reject' | 'verified';
}

export const DASHBOARD_DATA = {
  overview: {
    totalCharges: 1248,
    totalChargesFormatted: '1,248',
    totalChargeValue: '₹8.42L',
    totalChargeValueRaw: 842500,
    claimsRecommended: 428,
    rejected: 612,
    uncertain: 208,
    claimPrecision: 91.4
  } as DashboardMetrics,

  trend: [
    { period: 'W1', periodLabel: 'Jan W1', recoveryValue: 64, claimsCount: 38, rejectedCount: 54, precision: 90.2 },
    { period: 'W2', periodLabel: 'Jan W3', recoveryValue: 88, claimsCount: 46, rejectedCount: 68, precision: 90.8 },
    { period: 'W3', periodLabel: 'Feb W1', recoveryValue: 95, claimsCount: 52, rejectedCount: 74, precision: 91.0 },
    { period: 'W4', periodLabel: 'Feb W3', recoveryValue: 122, claimsCount: 61, rejectedCount: 82, precision: 91.5 },
    { period: 'W5', periodLabel: 'Mar W1', recoveryValue: 148, claimsCount: 74, rejectedCount: 96, precision: 91.8 },
    { period: 'W6', periodLabel: 'Mar W2', recoveryValue: 136, claimsCount: 68, rejectedCount: 104, precision: 91.2 },
    { period: 'W7', periodLabel: 'Mar W3', recoveryValue: 189, claimsCount: 89, rejectedCount: 134, precision: 91.4 }
  ] as RecoveryTrendPoint[],

  distribution: [
    {
      category: 'CLAIM',
      label: 'Claims Recommended',
      count: 428,
      percentage: 34.3,
      color: '#C64B32',
      amount: '₹4,38,600',
      description: 'Definitive physical scale, dimension, or SLA discrepancy validated by dual station telemetry.'
    },
    {
      category: 'REJECT',
      label: 'Legitimate Fees (Rejected)',
      count: 612,
      percentage: 49.0,
      color: '#151515',
      amount: '₹2,96,400',
      description: 'Carrier transit weighments and pack scans confirm legitimate dimensional tiers within tolerance.'
    },
    {
      category: 'UNCERTAIN',
      label: 'Uncertain / Divergent Telemetry',
      count: 208,
      percentage: 16.7,
      color: '#737067',
      amount: '₹1,07,500',
      description: 'Contradictory warehouse handling logs or missing photographic proof requiring auditor review.'
    }
  ] as DecisionDistribution[],

  breakdown: [
    {
      chargeType: 'Fulfillment Fee',
      count: 482,
      percentage: 38.6,
      recoverableValue: '₹3,24,000',
      recoverableValueRaw: 324000,
      avgVariance: '-0.88 kg overcharge'
    },
    {
      chargeType: 'Storage Fee',
      count: 284,
      percentage: 22.8,
      recoverableValue: '₹1,88,500',
      recoverableValueRaw: 188500,
      avgVariance: '+340% volume delta'
    },
    {
      chargeType: 'Reimbursement Adjustment',
      count: 196,
      percentage: 15.7,
      recoverableValue: '₹1,64,200',
      recoverableValueRaw: 164200,
      avgVariance: '72h dock SLA elapsed'
    },
    {
      chargeType: 'Shipping Adjustment',
      count: 142,
      percentage: 11.4,
      recoverableValue: '₹98,400',
      recoverableValueRaw: 98400,
      avgVariance: 'Volumetric ghost height'
    },
    {
      chargeType: 'Returns Fee',
      count: 94,
      percentage: 7.5,
      recoverableValue: '₹48,200',
      recoverableValueRaw: 48200,
      avgVariance: 'Unverified scrap classification'
    },
    {
      chargeType: 'Other Adjustments',
      count: 50,
      percentage: 4.0,
      recoverableValue: '₹19,200',
      recoverableValueRaw: 19200,
      avgVariance: 'Prep barcode reprint'
    }
  ] as ChargeTypeBreakdown[],

  funnel: [
    {
      step: 1,
      name: 'TOTAL CHARGES',
      subtitle: 'Raw Ledger Intake',
      metric: '1,248 charges',
      percent: 100,
      detail: 'Normalized transaction records ingested from carrier and FC settlement reports.'
    },
    {
      step: 2,
      name: 'MATCHED TO UNITS',
      subtitle: 'Catalog Resolution',
      metric: '1,214 units',
      percent: 97.3,
      detail: 'Mapped to verified physical serials, lot barcodes, and inventory master SKUs.'
    },
    {
      step: 3,
      name: 'EVIDENCE RETRIEVED',
      subtitle: 'Station Telemetry Sync',
      metric: '1,142 units',
      percent: 91.5,
      detail: 'Dock tare scales, prep bypass codes, Pack Cubiscans, and return bay optic logs.'
    },
    {
      step: 4,
      name: 'REQUIREMENTS SATISFIED',
      subtitle: 'Rule Verification',
      metric: '524 charges',
      percent: 42.0,
      detail: 'Passed strict contractual tolerance thresholds, receiving certifications, and SLAs.'
    },
    {
      step: 5,
      name: 'CLAIMS RECOMMENDED',
      subtitle: 'Authoritative Recovery Dossier',
      metric: '428 claims',
      percent: 34.3,
      detail: 'Audited filings ready for submission with immutable sensor telemetry proof.'
    },
    {
      step: 6,
      name: 'RECOVERY VALUE',
      subtitle: 'Financial Realization',
      metric: '₹8.42 Lakhs',
      percent: 34.3,
      detail: 'Recoverable capital identified at 91.4% claim precision without clawback risk.'
    }
  ] as FunnelStage[],

  evidenceQuality: {
    evidenceAvailable: 94.2,
    evidenceMissing: 3.8,
    contradictoryEvidence: 2.0,
    unitsMatched: 1214,
    unitsMatchedTotal: 1248,
    unitsMatchedPercent: 97.3,
    unitsRequiringReview: 34,
    unitsRequiringReviewPercent: 2.7
  } as EvidenceQualityMetrics,

  reviewQueue: {
    summary: {
      uncertainCount: 12,
      missingEvidenceCount: 5,
      contradictionsCount: 3
    },
    items: [
      {
        chargeId: 'CHG-0184',
        unitId: 'UNIT-0982',
        issue: 'Contradictory optical grading at returns bay',
        amount: 1420.00,
        currency: '₹',
        status: 'Contradicted'
      },
      {
        chargeId: 'CHG-0179',
        unitId: 'UNIT-0891',
        issue: 'Missing dock tare scale proof from carrier manifest',
        amount: 1240.00,
        currency: '₹',
        status: 'Missing Evidence'
      },
      {
        chargeId: 'CHG-0165',
        unitId: 'UNIT-0744',
        issue: 'Prep station bypassed without certified bypass code',
        amount: 890.00,
        currency: '₹',
        status: 'Uncertain'
      },
      {
        chargeId: 'CHG-0152',
        unitId: 'UNIT-0621',
        issue: 'Outbound dimension mismatch vs Cubiscan sensor telemetry',
        amount: 1850.00,
        currency: '₹',
        status: 'Contradicted'
      },
      {
        chargeId: 'CHG-0144',
        unitId: 'UNIT-0518',
        issue: 'Cold chain liner inclusion discrepancy on poly-mail',
        amount: 960.00,
        currency: '₹',
        status: 'Pending Audit'
      }
    ] as DashboardReviewItem[]
  },

  recentActivity: [
    {
      time: '10:42',
      chargeId: 'CHG-0182',
      unitId: 'UNIT-0974',
      action: 'Claim recommended',
      amount: 842.00,
      currency: '₹',
      detail: 'Pack station optical scale delta verified (-0.93kg overcharge)',
      type: 'claim'
    },
    {
      time: '10:37',
      chargeId: 'CHG-0179',
      unitId: 'UNIT-0891',
      action: 'Marked uncertain',
      amount: 1240.00,
      currency: '₹',
      detail: 'Carrier manifest signature missing in intake docket',
      type: 'uncertain'
    },
    {
      time: '10:31',
      chargeId: 'CHG-0172',
      unitId: 'UNIT-0842',
      action: 'Claim recommended',
      amount: 620.00,
      currency: '₹',
      detail: 'Storage volumetric tier overstatement (+460% cubic delta)',
      type: 'claim'
    },
    {
      time: '10:24',
      chargeId: 'CHG-0168',
      unitId: 'UNIT-0810',
      action: 'Rejected',
      amount: 310.00,
      currency: '₹',
      detail: 'Measurement falls within contractual 2.5% calibration margin',
      type: 'reject'
    },
    {
      time: '10:18',
      chargeId: 'CHG-0164',
      unitId: 'UNIT-0792',
      action: 'Claim recommended',
      amount: 1150.00,
      currency: '₹',
      detail: 'Overhead conveyor mechanical jam confirmed in FC-BLR1',
      type: 'claim'
    },
    {
      time: '10:09',
      chargeId: 'CHG-0159',
      unitId: 'UNIT-0761',
      action: 'Marked uncertain',
      amount: 780.00,
      currency: '₹',
      detail: 'Secondary salvage grading lacks photographic archive',
      type: 'uncertain'
    }
  ] as RecentActivityItem[]
};
