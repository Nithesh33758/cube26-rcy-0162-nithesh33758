import React from 'react';
import { FileText, Check, ArrowRight, AlertTriangle, AlertCircle, XCircle } from 'lucide-react';
import { FileMetadata, EXPECTED_LEDGER_COLUMNS, CONTRACT_CHARGE_REQUIRED_COLUMNS } from '../types';

interface FileStatusProps {
  metadata: FileMetadata;
  onChangeFile: () => void;
  onStartAnalysis: () => void;
  simulateError: boolean;
  onToggleSimulateError: (value: boolean) => void;
}

export const FileStatus: React.FC<FileStatusProps> = ({
  metadata,
  onChangeFile,
  onStartAnalysis,
  simulateError,
  onToggleSimulateError
}) => {
  const isValid = metadata.isValidLedger !== false && (metadata.missingColumns?.length || 0) === 0;
  const expectedColumns = metadata.schemaType === 'CONTRACT_CHARGE'
    ? CONTRACT_CHARGE_REQUIRED_COLUMNS
    : EXPECTED_LEDGER_COLUMNS;
  const schemaLabel = metadata.schemaType === 'CONTRACT_CHARGE' ? 'normalized charge report' : 'legacy ledger';
  const missingCols = metadata.missingColumns || [];
  const detectedCols = metadata.detectedColumns || [...expectedColumns];

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="mb-10">
        <div className="text-xs uppercase tracking-widest text-[#737067] font-mono mb-2">
          File Confirmation & Ledger Validation
        </div>
        <h1 className="font-heading text-4xl sm:text-5xl font-bold tracking-tight text-[#151515] mb-4 text-balance">
          Upload Recovery Report
        </h1>
        <p className="text-lg text-[#55524B] max-w-2xl leading-relaxed">
          Report loaded into memory. Ledger schema verified against expected columns before analysis begins.
        </p>
      </div>

      {/* Selected File Card */}
      <div className="border border-[#151515] bg-[#FAF8F5] p-8 sm:p-10 mb-8 space-y-8">
        {/* Top File Summary Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-[#E2DFD7]">
          <div className="flex items-start gap-4">
            <div
              className={`w-10 h-10 border flex items-center justify-center shrink-0 mt-0.5 ${
                isValid
                  ? 'border-[#151515] bg-[#151515] text-[#F5F3EE]'
                  : 'border-[#C64B32] bg-[#FAF3F1] text-[#C64B32]'
              }`}
            >
              {isValid ? (
                <Check className="w-5 h-5 stroke-[2.5]" />
              ) : (
                <AlertTriangle className="w-5 h-5 stroke-[2]" />
              )}
            </div>

            <div>
              <div className="font-heading text-2xl font-bold text-[#151515] flex items-center gap-2">
                <span>{metadata.name}</span>
                <span className="text-xs font-mono font-normal uppercase bg-[#EAE6DD] text-[#55524B] px-2 py-0.5">
                  {metadata.type}
                </span>
              </div>
              <div className="text-sm font-mono text-[#737067] mt-1">
                {metadata.size}
              </div>
              <div className="text-sm font-medium text-[#151515] mt-1.5 flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full inline-block ${
                    isValid ? 'bg-emerald-600' : 'bg-[#C64B32]'
                  }`}
                />
                <span className={isValid ? 'text-emerald-900 font-semibold' : 'text-[#C64B32] font-semibold'}>
                  {isValid ? 'Ready for analysis' : 'Missing required columns'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onChangeFile}
              className="px-4 py-2.5 border border-[#151515] text-[#151515] text-sm font-medium hover:bg-[#ECE9E2] transition-colors cursor-pointer whitespace-nowrap active:translate-y-[1px]"
            >
              Change File
            </button>
          </div>
        </div>

        {/* Validation Result Banner */}
        {isValid ? (
          <div className="p-5 bg-[#E8F4EC] border border-emerald-300 space-y-3">
            <div className="flex items-center gap-2 text-emerald-900 font-heading text-base font-bold">
              <Check className="w-5 h-5 text-emerald-700 stroke-[2.5]" />
              <span>Charge report format valid</span>
            </div>
            <p className="text-xs text-emerald-900 leading-relaxed font-sans">
              All {expectedColumns.length} required {schemaLabel} columns are present. Additional columns are allowed.
            </p>

            {/* Display detected columns */}
            <div className="pt-2 border-t border-emerald-200">
              <span className="text-[11px] font-mono uppercase text-emerald-800 font-semibold block mb-2">
                Detected Required Columns ({detectedCols.length} / {expectedColumns.length}):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {detectedCols.map((col) => (
                  <span
                    key={col}
                    className="inline-flex items-center gap-1 font-mono text-xs bg-white/80 border border-emerald-300 text-emerald-900 px-2 py-0.5 font-medium"
                  >
                    <span>✓</span>
                    <span>{col}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-5 bg-[#FAF3F1] border-2 border-[#C64B32] space-y-3">
            <div className="flex items-center gap-2 text-[#C64B32] font-heading text-base font-bold">
              <XCircle className="w-5 h-5 text-[#C64B32]" />
              <span>Missing required columns</span>
            </div>
            <p className="text-xs text-[#55524B] leading-relaxed">
              The uploaded CSV is missing required {schemaLabel} columns. Update its headers to the supported contract format.
            </p>

            {/* List the exact missing column names as requested */}
            <div className="p-3 bg-white border border-[#F0D5D0] space-y-1.5">
              <span className="font-mono text-xs font-bold text-[#C64B32] block uppercase tracking-wider">
                Missing:
              </span>
              <ul className="list-disc list-inside font-mono text-xs text-[#151515] space-y-1 pl-1">
                {missingCols.map((col) => (
                  <li key={col} className="font-semibold text-[#C64B32]">
                    <code className="bg-[#FAF3F1] px-1.5 py-0.5 border border-[#F0D5D0]">
                      {col}
                    </code>
                  </li>
                ))}
              </ul>
            </div>

            {detectedCols.length > 0 && (
              <div className="pt-2 text-xs font-mono text-[#737067]">
                <span>Detected ({detectedCols.length} / {expectedColumns.length}): </span>
                <span className="text-[#151515]">{detectedCols.join(', ')}</span>
              </div>
            )}
          </div>
        )}

        {/* Ledger Metadata Details */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 text-xs border-b border-[#E2DFD7]">
          <div>
            <span className="text-[#737067] uppercase font-mono tracking-wider block mb-1">
              Report Rows
            </span>
            <span className="font-heading text-base font-semibold text-[#151515] tabular-nums">
              {metadata.rowCount} rows
            </span>
          </div>
          <div>
            <span className="text-[#737067] uppercase font-mono tracking-wider block mb-1">
              Uploaded
            </span>
            <span className="font-heading text-base font-semibold text-[#151515]">
              {new Date(metadata.uploadedAt).toLocaleDateString()}
            </span>
          </div>
          <div>
            <span className="text-[#737067] uppercase font-mono tracking-wider block mb-1">
              Schema Integrity
            </span>
            <span
              className={`font-heading text-base font-semibold ${
                isValid ? 'text-emerald-800' : 'text-[#C64B32]'
              }`}
            >
              {detectedCols.length}/{expectedColumns.length} Columns Valid
            </span>
          </div>
          <div>
            <span className="text-[#737067] uppercase font-mono tracking-wider block mb-1">
              Currency
            </span>
            <span className="font-heading text-base font-semibold text-[#151515]">
              {metadata.schemaType === 'CONTRACT_CHARGE' ? 'From report' : 'USD ($)'}
            </span>
          </div>
        </div>

        {/* Action controls */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-xs text-[#737067]">
            {isValid ? (
              <span>
                Start analysis uses uploaded charge rows. Without contracted evidence and authoritative policy rules, unresolved charges remain for review.
              </span>
            ) : (
              <span className="text-[#C64B32] font-medium">
                Resolve missing ledger columns or upload a complete CSV before starting analysis.
              </span>
            )}
          </div>

          <button
            onClick={onStartAnalysis}
            disabled={!isValid}
            className={`px-8 py-3.5 text-base font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap shadow-sm active:translate-y-[1px] ${
              isValid
                ? 'bg-[#C64B32] text-white hover:bg-[#B03F28]'
                : 'bg-[#C5C2BA] text-[#737067] cursor-not-allowed opacity-60'
            }`}
          >
            <span>Start Analysis</span>
            <ArrowRight className="w-5 h-5 stroke-[2]" />
          </button>
        </div>
      </div>

      {/* Verification protocol note & testing controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-[#737067] border-t border-[#E2DFD7] pt-4">
        <div>
          <span>Deterministic Audit Mode: </span>
          <span className="text-[#151515] font-mono">
            {metadata.schemaType === 'CONTRACT_CHARGE' ? 'RECOVERY_DATA_CONTRACT' : 'CUSTOMER_LEDGER_V12'}
          </span>
        </div>

        <label className="flex items-center gap-2 mt-2 sm:mt-0 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={simulateError}
            onChange={(e) => onToggleSimulateError(e.target.checked)}
            className="w-3.5 h-3.5 accent-[#C64B32]"
          />
          <span className="text-[#55524B]">Simulate analysis failure (tests error recovery state)</span>
        </label>
      </div>
    </div>
  );
};
