import React, { useState } from 'react';
import { AppState, Charge, DecisionType, FileMetadata } from './types';
import { generateFullDataset, INITIAL_REVIEW_ITEMS } from './data/mockData';
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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081';

interface BackendCharge {
  id: string;
  unitId: string | null;
  shipmentId?: string | null;
  orderId?: string | null;
  sku?: string | null;
  chargeType: string;
  chargeSubtype?: string | null;
  amount: number;
  currency: string;
  postedDate: string | null;
  chargedAt?: string | null;
  decision: DecisionType;
  decisionExplanation: string;
  confidence: number | null;
  evidenceCount: number;
  status: string;
  evidence: Array<{
    recordId: string;
    sourceType: string;
    requirement: string;
    status: string;
    finding: string;
    timestamp: string;
  }>;
  requirements: Array<{
    id: string;
    name: string;
    description: string;
    active: boolean;
  }>;
}

interface BackendAnalysisResult {
  status: string;
  charges: BackendCharge[];
}

interface BackendErrorResponse {
  error?: string;
  errorMessage?: string;
  message?: string;
  details?: string[];
  analysisId?: string;
}

function formatBackendError(response: BackendErrorResponse, fallback: string): string {
  const message = response.errorMessage || response.message || fallback;
  const details = response.details?.filter(Boolean).join('; ');
  const prefix = response.error ? `${response.error}: ` : '';
  return `${prefix}${message}${details ? ` (${details})` : ''}`;
}

function mapBackendCharges(backendCharges: BackendCharge[]): Charge[] {
  return backendCharges.map((charge) => ({
    id: charge.id,
    unitId: charge.unitId || charge.shipmentId || charge.orderId || 'Unattributed',
    chargeType: charge.chargeSubtype ? `${charge.chargeType}: ${charge.chargeSubtype}` : charge.chargeType,
    amount: Number(charge.amount),
    currency: charge.currency || 'USD',
    decision: charge.decision,
    confidence: charge.confidence ?? 0,
    evidenceCount: charge.evidenceCount,
    status: charge.status === 'ALREADY_REIMBURSED' ? 'Already Reimbursed'
      : charge.status === 'OUT_OF_WINDOW' ? 'Out of Window'
      : charge.status === 'PENDING_REVIEW' ? 'Pending Review' : 'Ready',
    date: charge.chargedAt || charge.postedDate || '',
    sku: charge.sku || '',
    fulfillmentCenter: '',
    decisionExplanation: charge.decisionExplanation || 'No explanation provided.',
    requirements: charge.requirements.map((requirement) => ({
      id: String(requirement.id),
      name: requirement.name,
      category: 'Operational',
      status: 'MISSING',
      description: requirement.description,
      ruleCode: `REQ-${requirement.id}`,
      details: requirement.active ? 'Active requirement.' : 'Inactive requirement.'
    })),
    evidence: charge.evidence.map((evidence) => ({
      id: evidence.recordId,
      manager: 'Receiving Manager',
      timestamp: evidence.timestamp,
      stationId: evidence.sourceType,
      operatorId: '',
      type: evidence.sourceType,
      description: evidence.finding,
      systemRef: evidence.recordId,
      status: evidence.status === 'VERIFIED' ? 'VERIFIED' : 'FLAGGED'
    }))
  }));
}

export default function App() {
  // Application State: initial state is UPLOAD so the existing page looks exactly as before on load
  const [currentState, setCurrentState] = useState<AppState>('UPLOAD');
  const [selectedFile, setSelectedFile] = useState<FileMetadata | null>(null);
  const [selectedUpload, setSelectedUpload] = useState<File | null>(null);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [simulateError, setSimulateError] = useState(false);
  const [hasCompletedProcessing, setHasCompletedProcessing] = useState(false);

  // Loaded charges dataset
  const [charges, setCharges] = useState<Charge[]>(() => generateFullDataset());
  const [selectedCharge, setSelectedCharge] = useState<Charge | null>(null);

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
    setSelectedFile(metadata);
    setSelectedUpload(file || null);
    setAnalysisId(null);
    setErrorMessage(null);
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
      const uploadResponse = await fetch(`${API_BASE_URL}/api/analysis/upload`, {
        method: 'POST',
        body: formData
      });
      const uploadBody = await uploadResponse.json().catch(() => ({})) as BackendErrorResponse;
      if (!uploadResponse.ok || !uploadBody.analysisId) {
        throw new Error(formatBackendError(uploadBody, 'The backend rejected the uploaded CSV.'));
      }

      const startResponse = await fetch(`${API_BASE_URL}/api/analysis/${uploadBody.analysisId}/start`, {
        method: 'POST'
      });
      if (!startResponse.ok) {
        const startBody = await startResponse.json().catch(() => ({})) as BackendErrorResponse;
        throw new Error(formatBackendError(startBody, 'The backend could not start this analysis.'));
      }

      setAnalysisId(uploadBody.analysisId);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to connect to the analysis backend.');
      setCurrentState('FAILED');
    }
  };

  const handleImportReimbursements = async (file: File): Promise<number> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${API_BASE_URL}/api/reimbursements/upload`, {
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
      const resultResponse = await fetch(`${API_BASE_URL}/api/analysis/${analysisId}`);
      if (!resultResponse.ok) {
        throw new Error('The backend could not return the completed analysis.');
      }
      const result = (await resultResponse.json()) as BackendAnalysisResult;
      setCharges(mapBackendCharges(result.charges));
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
    setSelectedFile(null);
    setSelectedUpload(null);
    setSelectedCharge(null);
    setErrorMessage(null);
    setAnalysisId(null);
    setHasCompletedProcessing(false);
    setCurrentState('UPLOAD');
  };

  const handleChangeFile = () => {
    setSelectedFile(null);
    setSelectedUpload(null);
    setAnalysisId(null);
    setErrorMessage(null);
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
            onComplete={handleProcessingComplete}
            onError={handleProcessingError}
            simulateError={simulateError}
          />
        )}

        {/* State 4: RESULTS (Full operations table & editorial metric blocks) */}
        {currentState === 'RESULTS' && (
          <ResultsView
            charges={charges}
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
            items={INITIAL_REVIEW_ITEMS}
            onBack={handleBackToResults}
            onSelectChargeId={handleSelectChargeId}
          />
        )}

        {/* Contextual Screen: ANALYTICS */}
        {currentState === 'ANALYTICS' && (
          <AnalyticsPanel onBack={handleBackToResults} />
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
