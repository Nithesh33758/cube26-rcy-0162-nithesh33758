import React, { useState, useEffect } from 'react';
import { AnalysisSummary, AppState, Charge, ChargeStatus, DecisionType, FileMetadata, ManagerType } from './types';
import { Header, NavItem } from './components/Header';
import { UploadPanel } from './components/UploadPanel';
import { FileStatus } from './components/FileStatus';
import { ProcessingPipeline } from './components/ProcessingPipeline';
import { ResultsView } from './components/ResultsView';
import { ChargeInvestigation } from './components/ChargeInvestigation';
import { ReviewQueue } from './components/ReviewQueue';
import { AnalyticsPanel } from './components/AnalyticsPanel';
import { EvidenceExplorer } from './components/EvidenceExplorer';
import { ErrorState } from './components/ErrorState';
import { DashboardView } from './components/DashboardView';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const API_ORG_ID = 'org_demo_alpha';

interface BackendCharge {
  id?: string;
  lineId?: string;
  unitId: string | null;
  shipmentId?: string | null;
  orderId?: string | null;
  sku?: string | null;
  fnsku?: string | null;
  asin?: string | null;
  chargeType: string;
  chargeSubtype?: string | null;
  amount: number;
  currency: string;
  postedDate: string | null;
  chargedAt?: string | null;
  granularity?: string;
  description?: string | null;
  decision: DecisionType;
  originalDecision?: DecisionType | null;
  decisionExplanation: string;
  confidence: number | null;
  evidenceCount: number;
  status: string;
  evidence: Array<{
    recordId: string;
    sourceType: string;
    requirement: string | null;
    status: string;
    finding: string | null;
    timestamp: string | null;
  }>;
  requirements: Array<{
    id: string | number;
    name: string;
    description: string;
    chargeType: string;
    active: boolean;
  }>;
}

interface BackendAnalysisResult {
  analysisId: string;
  fileName: string;
  status: string;
  totalRows: number;
  processedRows: number;
  failedRows: number;
  createdAt: string;
  summary: AnalysisSummary;
  validationErrors?: BackendValidationError[];
  charges: BackendCharge[];
}

interface BackendValidationError {
  row: number;
  field: string;
  error: string;
}

interface BackendErrorResponse {
  error?: string;
  errorMessage?: string;
  message?: string;
  details?: string[];
  analysisId?: string;
  status?: string;
  missingColumns?: string[];
  rowErrors?: Array<{ row: number; field: string; error: string }>;
  headersValid?: boolean;
  totalRows?: number;
}

function formatBackendError(response: BackendErrorResponse, fallback: string): string {
  const message = response.errorMessage || response.message || fallback;
  const details = [
    ...(response.details ?? []),
    ...(response.missingColumns ?? []).map((column) => `Missing column: ${column}`),
    ...(response.rowErrors ?? []).map((rowError) =>
      `Row ${rowError.row} ${rowError.field}: ${rowError.error}`)
  ].filter(Boolean).join('; ');
  const prefix = response.error ? `${response.error}: ` : '';
  return `${prefix}${message}${details ? ` (${details})` : ''}`;
}

function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set('X-Org-Id', API_ORG_ID);
  return fetch(`${API_BASE_URL}${path}`, { ...init, headers });
}

function managerForSource(sourceType: string): ManagerType {
  switch (sourceType.toUpperCase()) {
    case 'RECEIVING': return 'Receiving Manager';
    case 'PREP': return 'Prep Manager';
    case 'PACK': return 'Pack Manager';
    case 'RETURNS': return 'Returns Manager';
    default: return 'Unknown Source';
  }
}

function mapChargeStatus(status: string): ChargeStatus {
  switch (status) {
    case 'Ready': return 'Ready';
    case 'Pending Review':
    case 'PENDING_REVIEW': return 'Pending Review';
    case 'Contradicted': return 'Contradicted';
    case 'Audited': return 'Audited';
    case 'Already Reimbursed':
    case 'ALREADY_REIMBURSED': return 'Already Reimbursed';
    case 'Out of Window':
    case 'OUT_OF_WINDOW': return 'Out of Window';
    default: return 'Unknown';
  }
}

function normalizeDecision(decision: string | null | undefined): DecisionType {
  if (!decision) return 'UNCERTAIN';
  const upper = decision.toUpperCase();
  if (upper === 'CLAIM' || upper === 'CONTESTED') return 'CLAIM';
  if (upper === 'REJECT' || upper === 'ACCEPTED' || upper === 'ALREADY_REIMBURSED' || upper === 'OUT_OF_WINDOW') return 'REJECT';
  return 'UNCERTAIN';
}

function normalizeSummary(rawSummary: AnalysisSummary | null | undefined): AnalysisSummary {
  if (!rawSummary) {
    return {
      totalCharges: 0,
      claimsRecommended: 0,
      rejected: 0,
      uncertain: 0,
      pendingReview: 0,
      contested: 0,
      accepted: 0,
      insufficientEvidence: 0,
      alreadyReimbursed: 0,
      outOfWindow: 0,
    };
  }
  const claimsRecommended = (rawSummary.claimsRecommended ?? 0) + (rawSummary.contested ?? 0);
  const rejected = (rawSummary.rejected ?? 0) + (rawSummary.accepted ?? 0) + (rawSummary.alreadyReimbursed ?? 0) + (rawSummary.outOfWindow ?? 0);
  const uncertain = (rawSummary.uncertain ?? 0) + (rawSummary.pendingReview ?? 0) + (rawSummary.insufficientEvidence ?? 0);
  return {
    ...rawSummary,
    claimsRecommended,
    rejected,
    uncertain,
    contested: claimsRecommended,
    accepted: rejected,
    pendingReview: uncertain,
    insufficientEvidence: uncertain,
    alreadyReimbursed: 0,
    outOfWindow: 0,
  };
}

function mapBackendCharges(backendCharges: BackendCharge[]): Charge[] {
  return backendCharges.map((charge) => ({
    id: charge.lineId || charge.id || '',
    unitId: charge.unitId || '',
    chargeType: charge.chargeType,
    amount: charge.amount,
    currency: charge.currency,
    decision: normalizeDecision(charge.decision),
    confidence: charge.confidence,
    evidenceCount: charge.evidenceCount,
    status: mapChargeStatus(charge.status),
    date: charge.chargedAt || charge.postedDate || '',
    sku: charge.sku || '',
    fulfillmentCenter: '',
    decisionExplanation: charge.decisionExplanation || '',
    originalDecision: charge.originalDecision,
    chargeSubtype: charge.chargeSubtype,
    shipmentId: charge.shipmentId,
    orderId: charge.orderId,
    fnsku: charge.fnsku,
    asin: charge.asin,
    granularity: charge.granularity,
    description: charge.description,
    requirements: charge.requirements.map((requirement) => ({
      id: String(requirement.id),
      name: requirement.name,
      category: 'Unspecified',
      status: null,
      description: requirement.description,
      ruleCode: String(requirement.id),
      details: requirement.active ? 'Active' : 'Inactive',
      active: requirement.active,
      chargeType: requirement.chargeType
    })),
    evidence: charge.evidence.map((evidence) => ({
      id: evidence.recordId,
      manager: managerForSource(evidence.sourceType),
      timestamp: evidence.timestamp || '',
      stationId: '',
      operatorId: '',
      type: evidence.sourceType,
      description: evidence.finding || '',
      systemRef: evidence.recordId,
      status: evidence.status,
      requirement: evidence.requirement || undefined
    }))
  }));
}

const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function fetchCompletedAnalysis(analysisId: string): Promise<BackendAnalysisResult> {
  const deadline = Date.now() + 10 * 60 * 1000;
  while (Date.now() < deadline) {
    const response = await apiFetch(`/api/analysis/${encodeURIComponent(analysisId)}`);
    const result = await response.json().catch(() => ({})) as BackendAnalysisResult & BackendErrorResponse;
    if (!response.ok) {
      throw new Error(formatBackendError(result, 'The backend could not return the analysis.'));
    }
    if (result.status === 'COMPLETED') return result;
    if (result.status === 'FAILED') {
      throw new Error(result.errorMessage || 'The backend analysis failed.');
    }
    await wait(1000);
  }
  throw new Error('The analysis did not complete before the wait limit.');
}

const SESSION_STORAGE_KEY = 'sydon_rcm_session_v1';

interface SavedSession {
  currentState: AppState;
  selectedFile: FileMetadata | null;
  analysisId: string | null;
  hasCompletedProcessing: boolean;
  charges: Charge[];
  analysisSummary: AnalysisSummary | null;
  validationErrors: BackendValidationError[];
  selectedChargeId: string | null;
}

function loadSavedSession(): SavedSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (error) {
    console.warn('Failed to load session from sessionStorage:', error);
    return null;
  }
}

function clearSavedSession(): void {
  try {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear sessionStorage:', error);
  }
}

export default function App() {
  const [savedSession] = useState<SavedSession | null>(loadSavedSession);

  // Application State: restore from session if available, else start at UPLOAD
  const [currentState, setCurrentState] = useState<AppState>(() => {
    if (savedSession?.hasCompletedProcessing && savedSession.currentState) {
      if (savedSession.currentState === 'PROCESSING' || savedSession.currentState === 'FAILED') {
        return 'RESULTS';
      }
      return savedSession.currentState;
    }
    return 'UPLOAD';
  });

  const [selectedFile, setSelectedFile] = useState<FileMetadata | null>(() => savedSession?.selectedFile ?? null);
  const [selectedUpload, setSelectedUpload] = useState<File | null>(null);
  const [analysisId, setAnalysisId] = useState<string | null>(() => savedSession?.analysisId ?? null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [simulateError, setSimulateError] = useState(false);
  const [hasCompletedProcessing, setHasCompletedProcessing] = useState<boolean>(() => savedSession?.hasCompletedProcessing ?? false);

  const [charges, setCharges] = useState<Charge[]>(() => savedSession?.charges ?? []);
  const [analysisSummary, setAnalysisSummary] = useState<AnalysisSummary | null>(() => savedSession?.analysisSummary ?? null);
  const [validationErrors, setValidationErrors] = useState<BackendValidationError[]>(() => savedSession?.validationErrors ?? []);
  const [selectedCharge, setSelectedCharge] = useState<Charge | null>(() => {
    if (savedSession?.selectedChargeId && savedSession?.charges) {
      return savedSession.charges.find((c) => c.id === savedSession.selectedChargeId) || null;
    }
    return null;
  });

  // Automatically sync session state to sessionStorage
  useEffect(() => {
    if (hasCompletedProcessing && charges.length > 0) {
      try {
        const payload: SavedSession = {
          currentState,
          selectedFile,
          analysisId,
          hasCompletedProcessing,
          charges,
          analysisSummary,
          validationErrors,
          selectedChargeId: selectedCharge?.id ?? null,
        };
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(payload));
      } catch (e) {
        console.warn('Unable to persist session to sessionStorage:', e);
      }
    }
  }, [
    currentState,
    selectedFile,
    analysisId,
    hasCompletedProcessing,
    charges,
    analysisSummary,
    validationErrors,
    selectedCharge,
  ]);

  // Determine active navigation item based on current app state
  const getActiveNav = (): NavItem => {
    switch (currentState) {
      case 'DASHBOARD':
        return 'Dashboard';
      case 'EVIDENCE':
        return 'Evidence';
      case 'REVIEW':
        return 'Reviews';
      case 'ANALYTICS':
        return 'Analytics';
      case 'UPLOAD':
      case 'FILE_SELECTED':
      case 'PROCESSING':
      case 'RESULTS':
      case 'INVESTIGATION':
      case 'FAILED':
      default:
        return 'Charges';
    }
  };

  // Top navigation menu selection handler
  const handleSelectNav = (item: NavItem) => {
    switch (item) {
      case 'Dashboard':
        setCurrentState('DASHBOARD');
        break;
      case 'Charges':
        if (hasCompletedProcessing) {
          setCurrentState('RESULTS');
        } else if (selectedFile) {
          setCurrentState('FILE_SELECTED');
        } else {
          setCurrentState('UPLOAD');
        }
        break;
      case 'Evidence':
        setCurrentState('EVIDENCE');
        break;
      case 'Reviews':
        setCurrentState('REVIEW');
        break;
      case 'Analytics':
        setCurrentState('ANALYTICS');
        break;
    }
  };

  // Handlers for existing workflow transitions
  const handleFileSelected = (metadata: FileMetadata, file?: File) => {
    clearSavedSession();
    setSelectedFile(metadata);
    setSelectedUpload(file || null);
    setAnalysisId(null);
    setErrorMessage(null);
    setCharges([]);
    setAnalysisSummary(null);
    setValidationErrors([]);
    setHasCompletedProcessing(false);
    // CRITICAL: DO NOT automatically start processing!
    // Transition only to FILE_SELECTED state and wait for user click.
    setCurrentState('FILE_SELECTED');
  };

  const handleStartAnalysis = async () => {
    if (!selectedUpload) {
      setErrorMessage('Choose an actual CSV file before starting analysis. The demo ledger is still synthetic.');
      setCurrentState('FAILED');
      return;
    }

    setErrorMessage(null);
    setCurrentState('PROCESSING');

    try {
      const formData = new FormData();
      formData.append('file', selectedUpload);
      const uploadResponse = await apiFetch('/api/analysis/upload', {
        method: 'POST',
        body: formData
      });
      const uploadBody = await uploadResponse.json().catch(() => ({})) as BackendErrorResponse;
      if (!uploadResponse.ok || !uploadBody.analysisId) {
        throw new Error(formatBackendError(uploadBody, 'The backend rejected the uploaded CSV.'));
      }

      setValidationErrors(uploadBody.rowErrors ?? []);
      setAnalysisId(uploadBody.analysisId);
      const startResponse = await apiFetch(`/api/analysis/${encodeURIComponent(uploadBody.analysisId)}/start`, {
        method: 'POST'
      });
      const startBody = await startResponse.json().catch(() => ({})) as BackendErrorResponse;
      if (!startResponse.ok) {
        throw new Error(formatBackendError(startBody, 'The backend could not start this analysis.'));
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to connect to the analysis backend.');
      setCurrentState('FAILED');
    }
  };

  const handleImportReimbursements = async (file: File): Promise<number> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiFetch('/api/reimbursements/upload', {
      method: 'POST',
      body: formData
    });
    const body = await response.json().catch(() => ({})) as BackendErrorResponse & { importedRows?: number };
    if (!response.ok) {
      throw new Error(formatBackendError(body, 'The backend rejected the reimbursement report.'));
    }
    return body.importedRows ?? 0;
  };

  const handleProcessingComplete = async () => {
    if (!analysisId) {
      setErrorMessage('The backend did not return an analysis ID.');
      setCurrentState('FAILED');
      return;
    }

    try {
      const result = await fetchCompletedAnalysis(analysisId);
      setCharges(mapBackendCharges(result.charges));
      setAnalysisSummary(normalizeSummary(result.summary));
      setValidationErrors(result.validationErrors ?? []);
      setHasCompletedProcessing(true);
      setCurrentState('RESULTS');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load analysis results.');
      setCurrentState('FAILED');
    }
  };

  const handleProcessingError = () => {
    setCurrentState('FAILED');
  };

  const handleSelectCharge = (charge: Charge) => {
    setSelectedCharge(charge);
    setCurrentState('INVESTIGATION');
  };

  const handleSelectChargeId = (chargeId: string) => {
    const found = charges.find((c) => c.id === chargeId);
    if (found) {
      setSelectedCharge(found);
      setCurrentState('INVESTIGATION');
    }
  };

  const handleBackToResults = () => {
    setCurrentState(hasCompletedProcessing ? 'RESULTS' : 'UPLOAD');
  };

  const handleResetToUpload = () => {
    clearSavedSession();
    setSelectedFile(null);
    setSelectedUpload(null);
    setSelectedCharge(null);
    setErrorMessage(null);
    setAnalysisId(null);
    setHasCompletedProcessing(false);
    setCharges([]);
    setAnalysisSummary(null);
    setValidationErrors([]);
    setCurrentState('UPLOAD');
  };

  const handleChangeFile = () => {
    clearSavedSession();
    setSelectedFile(null);
    setSelectedUpload(null);
    setAnalysisId(null);
    setErrorMessage(null);
    setCharges([]);
    setAnalysisSummary(null);
    setValidationErrors([]);
    setCurrentState('UPLOAD');
  };

  const handleFileError = (msg: string) => {
    setErrorMessage(msg);
  };

  return (
    <div className="min-h-screen bg-[#F5F3EE] text-[#151515] flex flex-col font-sans selection:bg-[#C64B32] selection:text-white">
      {/* 1. Sticky Top Navigation Bar */}
      <Header
        activeNav={getActiveNav()}
        onSelectNav={handleSelectNav}
        onNavigateHome={() => handleSelectNav('Charges')}
        fileName={selectedFile?.name}
        isProcessing={currentState === 'PROCESSING'}
      />

      {/* Main Viewport Workspace */}
      <main className="flex-1">
        {/* NEW DASHBOARD: Long scroll-based executive recovery intelligence view */}
        {currentState === 'DASHBOARD' && (
          <DashboardView
            summary={analysisSummary}
            charges={charges}
            onNavigateToCharges={() => handleSelectNav('Charges')}
            onNavigateToReviews={() => setCurrentState('REVIEW')}
            onNavigateToEvidence={() => setCurrentState('EVIDENCE')}
            onNavigateToAnalytics={() => setCurrentState('ANALYTICS')}
          />
        )}

        {/* State 1: UPLOAD (Existing clean upload screen) */}
        {currentState === 'UPLOAD' && (
          <div>
            {errorMessage ? (
              <ErrorState
                type="INVALID_CSV"
                message={errorMessage}
                onBackToUpload={() => setErrorMessage(null)}
                onChangeFile={() => setErrorMessage(null)}
              />
            ) : (
              <UploadPanel
                onFileSelected={handleFileSelected}
                onError={handleFileError}
                onReimbursementSelected={handleImportReimbursements}
              />
            )}
          </div>
        )}

        {/* State 2: FILE_SELECTED (No processing starts, waiting for explicit user click) */}
        {currentState === 'FILE_SELECTED' && selectedFile && (
          <FileStatus
            metadata={selectedFile}
            onChangeFile={handleChangeFile}
            onStartAnalysis={handleStartAnalysis}
            simulateError={simulateError}
            onToggleSimulateError={setSimulateError}
          />
        )}

        {/* State 3: PROCESSING (Dedicated processing screen, results are NEVER visible) */}
        {currentState === 'PROCESSING' && (
          <ProcessingPipeline
            totalRows={selectedFile?.rowCount ?? 0}
            onComplete={handleProcessingComplete}
            onError={handleProcessingError}
            simulateError={simulateError}
          />
        )}

        {/* State 4: RESULTS (Full operations table & editorial metric blocks) */}
        {currentState === 'RESULTS' && (
          <ResultsView
            charges={charges}
            summary={analysisSummary}
            validationErrors={validationErrors}
            onSelectCharge={handleSelectCharge}
            onOpenReviewQueue={() => setCurrentState('REVIEW')}
            onOpenAnalytics={() => setCurrentState('ANALYTICS')}
            onOpenEvidence={() => setCurrentState('EVIDENCE')}
            onNewAnalysis={handleResetToUpload}
          />
        )}

        {/* State 5: INVESTIGATION (Dedicated charge audit view) */}
        {currentState === 'INVESTIGATION' && selectedCharge && (
          <ChargeInvestigation
            charge={selectedCharge}
            allCharges={charges}
            onBack={handleBackToResults}
            onNavigateToCharge={(nextCharge) => setSelectedCharge(nextCharge)}
          />
        )}

        {/* Contextual Screen: REVIEW QUEUE */}
        {currentState === 'REVIEW' && (
          <ReviewQueue
            charges={charges}
            onBack={handleBackToResults}
            onSelectChargeId={handleSelectChargeId}
          />
        )}

        {/* Contextual Screen: ANALYTICS */}
        {currentState === 'ANALYTICS' && (
          <AnalyticsPanel charges={charges} summary={analysisSummary} onBack={handleBackToResults} />
        )}

        {/* Contextual Screen: EVIDENCE EXPLORER */}
        {currentState === 'EVIDENCE' && (
          <EvidenceExplorer
            charges={charges}
            onBack={handleBackToResults}
            onSelectCharge={handleSelectCharge}
          />
        )}

        {/* State: FAILED (Error State) */}
        {currentState === 'FAILED' && (
          <ErrorState
            type="PROCESSING_FAILURE"
            message={errorMessage ?? undefined}
            onRetry={handleStartAnalysis}
            onBackToUpload={handleResetToUpload}
          />
        )}
      </main>

      {/* Editorial Footer */}
      <footer className="border-t border-[#E2DFD7] py-6 px-6 text-xs text-[#737067] bg-[#FAF8F5]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <span className="font-heading font-bold text-[#151515] mr-2">Recovery Manager</span>
            <span>Ecommerce Fee & Reimbursement Operations Console</span>
          </div>
          <div className="font-mono text-[11px] text-[#8E8B83]">
            Audit Standard RFC-4481 · Contract Tier Strict Verification
          </div>
        </div>
      </footer>
    </div>
  );
}
