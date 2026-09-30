export type DecisionType =
  | 'CLAIM'
  | 'REJECT'
  | 'UNCERTAIN'
  | 'CONTESTED'
  | 'ACCEPTED'
  | 'INSUFFICIENT_EVIDENCE'
  | 'ALREADY_REIMBURSED'
  | 'OUT_OF_WINDOW'
  | 'PENDING_REVIEW';

export type RequirementStatus = 'PASS' | 'FAIL' | 'MISSING' | 'CONTRADICTED';

export type ChargeStatus =
  | 'Ready'
  | 'Pending Review'
  | 'Contradicted'
  | 'Audited'
  | 'Already Reimbursed'
  | 'Out of Window'
  | 'Unknown';

export type ManagerType = 'Receiving Manager' | 'Prep Manager' | 'Pack Manager' | 'Returns Manager' | 'Unknown Source';

export interface RequirementCheck {
  id: string;
  name: string;
  category: 'Receiving' | 'Operational' | 'Evidence' | 'SLA' | 'Unspecified';
  status: RequirementStatus | null;
  description: string;
  ruleCode: string;
  details: string;
  active?: boolean;
  chargeType?: string;
}

export interface EvidenceRecord {
  id: string;
  manager: ManagerType;
  timestamp: string;
  stationId: string;
  operatorId: string;
  type: string;
  description: string;
  metric?: string;
  systemRef: string;
  status: string;
  requirement?: string;
}

export interface Charge {
  id: string;
  unitId: string;
  chargeType: string;
  amount: number;
  currency: string;
  decision: DecisionType;
  confidence: number | null;
  evidenceCount: number;
  status: ChargeStatus;
  date: string;
  sku: string;
  fulfillmentCenter: string;
  decisionExplanation: string;
  originalDecision?: DecisionType | null;
  chargeSubtype?: string | null;
  shipmentId?: string | null;
  orderId?: string | null;
  fnsku?: string | null;
  asin?: string | null;
  granularity?: string;
  description?: string | null;
  billedMetric?: string;
  actualMetric?: string;
  variance?: string;
  requirements: RequirementCheck[];
  evidence: EvidenceRecord[];
}

export interface AnalysisSummary {
  totalCharges: number;
  claimsRecommended: number;
  rejected: number;
  uncertain: number;
  pendingReview: number;
  contested: number;
  accepted: number;
  insufficientEvidence: number;
  alreadyReimbursed: number;
  outOfWindow: number;
}

export type AppState =
  | 'DASHBOARD'
  | 'UPLOAD'
  | 'FILE_SELECTED'
  | 'PROCESSING'
  | 'RESULTS'
  | 'INVESTIGATION'
  | 'REVIEW'
  | 'ANALYTICS'
  | 'EVIDENCE'
  | 'FAILED';

export const EXPECTED_LEDGER_COLUMNS = [
  'line_id',
  'report_type',
  'unit_id',
  'org_id',
  'sku',
  'fnsku',
  'fba_shipment_id',
  'order_id',
  'charge_type',
  'quantity',
  'amount_usd',
  'posted_date'
] as const;

export const CONTRACT_CHARGE_REQUIRED_COLUMNS = [
  'charge_id',
  'charge_type',
  'charge_subtype',
  'charged_at',
  'granularity',
  'quantity',
  'currency',
  'amount_total',
  'description'
] as const;

export const CONTRACT_CHARGE_OPTIONAL_COLUMNS = [
  'shipment_id',
  'amazon_order_id',
  'sku',
  'fnsku',
  'asin',
  'amount_per_unit'
] as const;

export const REIMBURSEMENT_REQUIRED_COLUMNS = [
  'reimbursement_id',
  'approval_date',
  'sku',
  'reason',
  'currency',
  'amount_per_unit',
  'amount_total',
  'quantity_reimbursed_cash',
  'quantity_reimbursed_inventory'
] as const;

export const REIMBURSEMENT_OPTIONAL_COLUMNS = [
  'case_id',
  'amazon_order_id',
  'fnsku',
  'asin',
  'condition',
  'original_reimbursement_id'
] as const;

export type ExpectedLedgerColumn = typeof EXPECTED_LEDGER_COLUMNS[number];

export interface FileMetadata {
  name: string;
  size: string;
  type: string;
  status: string;
  rowCount: number;
  uploadedAt: string;
  detectedColumns: string[];
  missingColumns: string[];
  isValidLedger: boolean;
  schemaType?: 'LEGACY_LEDGER' | 'CONTRACT_CHARGE';
}
