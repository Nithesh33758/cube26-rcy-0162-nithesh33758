import React, { useRef, useState } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import {
  FileMetadata,
  EXPECTED_LEDGER_COLUMNS,
  CONTRACT_CHARGE_REQUIRED_COLUMNS,
  CONTRACT_CHARGE_OPTIONAL_COLUMNS,
  REIMBURSEMENT_REQUIRED_COLUMNS,
  REIMBURSEMENT_OPTIONAL_COLUMNS
} from '../types';

interface UploadPanelProps {
  onFileSelected: (metadata: FileMetadata, file?: File) => void;
  onError: (message: string) => void;
  onReimbursementSelected: (file: File) => Promise<number>;
}

function parseCSVHeaders(firstLine: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < firstLine.length; i++) {
    const char = firstLine[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim().replace(/^["']|["']$/g, ''));
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim().replace(/^["']|["']$/g, ''));
  return result.map((h) => h.trim()).filter(Boolean);
}

export const UploadPanel: React.FC<UploadPanelProps> = ({ onFileSelected, onError, onReimbursementSelected }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isImportingReimbursements, setIsImportingReimbursements] = useState(false);
  const [reimbursementMessage, setReimbursementMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const reimbursementInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const processFile = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv') && file.type !== 'text/csv') {
      onError('Unable to read this file. Only standard CSV files are supported.');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      onError('Unable to read this file. File size exceeds 25 MB limit.');
      return;
    }

    const sizeStr = file.size < 1024 * 1024
      ? `${Math.max(1, Math.ceil(file.size / 1024))} KB`
      : `${(file.size / (1024 * 1024)).toFixed(2)} MB`;

    // Read header line to validate columns
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = (e.target?.result as string) || '';
      const lines = text.split(/\r\n|\n|\r/);
      const firstLine = lines[0] || '';
      const parsedHeaders = parseCSVHeaders(firstLine);
      const rowCount = Math.max(0, lines.filter((line) => line.trim().length > 0).length - 1);

      const schemaType = parsedHeaders.includes('charge_id') ? 'CONTRACT_CHARGE' : 'LEGACY_LEDGER';
      const requiredColumns = schemaType === 'CONTRACT_CHARGE'
        ? CONTRACT_CHARGE_REQUIRED_COLUMNS
        : EXPECTED_LEDGER_COLUMNS;
      const detected = requiredColumns.filter((col) => parsedHeaders.includes(col));
      const missing = requiredColumns.filter((col) => !parsedHeaders.includes(col));
      const isValid = missing.length === 0;

      onFileSelected({
        name: file.name,
        size: sizeStr,
        type: 'CSV',
        status: isValid ? 'Ready for analysis' : 'Missing required columns',
        rowCount,
        uploadedAt: new Date().toISOString(),
        detectedColumns: detected,
        missingColumns: missing,
        isValidLedger: isValid,
        schemaType
      }, file);
    };

    reader.onerror = () => {
      onError('Unable to read this file. Error occurred during file stream ingestion.');
    };

    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const loadSampleFile = () => {
    onFileSelected({
      name: 'demo_fee_report.csv',
      size: 'Synthetic demo data',
      type: 'CSV',
      status: 'Ready for analysis',
      rowCount: 320,
      uploadedAt: new Date().toISOString(),
      detectedColumns: [...EXPECTED_LEDGER_COLUMNS],
      missingColumns: [],
      isValidLedger: true,
      schemaType: 'LEGACY_LEDGER'
    });
  };

  const loadIncompleteSample = () => {
    const missing = ['fba_shipment_id', 'posted_date'];
    const detected = EXPECTED_LEDGER_COLUMNS.filter((c) => !missing.includes(c));
    onFileSelected({
      name: 'incomplete_ledger.csv',
      size: '1.8 MB',
      type: 'CSV',
      status: 'Missing required columns',
      rowCount: 180,
      uploadedAt: new Date().toISOString(),
      detectedColumns: detected,
      missingColumns: missing,
      isValidLedger: false,
      schemaType: 'LEGACY_LEDGER'
    });
  };

  const handleReimbursementFile = async (file?: File) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.csv') && file.type !== 'text/csv') {
      setReimbursementMessage('Choose a CSV reimbursement report.');
      return;
    }
    setIsImportingReimbursements(true);
    setReimbursementMessage('');
    try {
      const importedRows = await onReimbursementSelected(file);
      setReimbursementMessage(`${importedRows} reimbursement rows imported.`);
    } catch (error) {
      setReimbursementMessage(error instanceof Error ? error.message : 'Reimbursement import failed.');
    } finally {
      setIsImportingReimbursements(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      {/* Header section with asymmetric editorial typography */}
      <div className="mb-10">
        <div className="text-xs uppercase tracking-widest text-[#737067] font-mono mb-2">
          Financial Operations Ledger Intake
        </div>
        <h1 className="font-heading text-4xl sm:text-5xl font-bold tracking-tight text-[#151515] mb-4 text-balance">
          Upload Recovery Report
        </h1>
        <p className="text-lg text-[#55524B] max-w-2xl leading-relaxed">
          Upload charges for review, and import reimbursements separately to prevent duplicate claims.
        </p>
        <p className="mt-3 text-xs font-mono text-[#737067]">
          No claim is filed automatically. Review the evidence and decision before taking action.
        </p>
      </div>

      {/* Main Drag & Drop Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed p-10 sm:p-14 text-center transition-all bg-[#FAF8F5] ${
          isDragging
            ? 'border-[#C64B32] bg-[#FAF3F1]'
            : 'border-[#D5D1C7] hover:border-[#A8A49B]'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileInputChange}
          className="hidden"
          id="csv-file-input"
        />

        <div className="flex flex-col items-center justify-center max-w-lg mx-auto">
          <div className="w-14 h-14 border border-[#E2DFD7] bg-[#F5F3EE] flex items-center justify-center mb-5 text-[#151515]">
            <Upload className="w-6 h-6 stroke-[1.5]" />
          </div>

          <h3 className="font-heading text-xl font-semibold text-[#151515] mb-2">
            Drag and drop your fee report here
          </h3>

          <p className="text-sm text-[#737067] mb-6">
            Supported formats: legacy ledger or normalized charge report
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-2.5 bg-[#151515] text-[#F5F3EE] text-sm font-medium hover:bg-[#333333] transition-colors cursor-pointer whitespace-nowrap active:translate-y-[1px]"
            >
              Choose CSV File
            </button>

            <button
              onClick={loadSampleFile}
              className="px-4 py-2.5 border border-[#151515] text-[#151515] text-sm font-medium hover:bg-[#ECE9E2] transition-colors cursor-pointer whitespace-nowrap active:translate-y-[1px]"
            >
              Load Demo Ledger (320 synthetic rows)
            </button>
          </div>

          {/* Quick test option for missing columns */}
          <button
            onClick={loadIncompleteSample}
            className="mt-3 text-xs font-mono text-[#737067] hover:text-[#C64B32] underline cursor-pointer"
          >
            Test Validation: Load Incomplete Sample (Missing Columns)
          </button>
        </div>

        {/* Format details bar */}
        <div className="mt-10 pt-8 border-t border-[#E2DFD7] grid grid-cols-1 sm:grid-cols-3 gap-4 text-left text-xs">
          <div>
            <span className="text-[#737067] uppercase tracking-wider block font-mono text-[11px] mb-1">
              File Format
            </span>
            <span className="font-medium text-[#151515]">Comma-Separated Values (.csv)</span>
          </div>
          <div>
            <span className="text-[#737067] uppercase tracking-wider block font-mono text-[11px] mb-1">
              Maximum Size
            </span>
            <span className="font-medium text-[#151515]">Up to 25 MB (approx. 50,000 rows)</span>
          </div>
          <div>
            <span className="text-[#737067] uppercase tracking-wider block font-mono text-[11px] mb-1">
              Validation Protocol
            </span>
            <span className="font-medium text-[#151515]">Legacy or normalized charge schema</span>
          </div>
        </div>
      </div>

      <div className="mt-8 border-t border-[#151515] py-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 pb-2 border-b border-[#E2DFD7]">
          <h4 className="font-heading text-sm font-bold text-[#151515] uppercase tracking-wider">
            Already-Paid Reimbursements
          </h4>
          <span className="text-xs font-mono text-[#737067]">
            Separate report · imported before analysis
          </span>
        </div>
        <p className="text-xs text-[#55524B] leading-relaxed">
          Import credits first so matching reimbursements can suppress duplicate claim recommendations. Nullable case, order, and original reimbursement IDs are supported.
        </p>
        <input
          ref={reimbursementInputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(event) => {
            void handleReimbursementFile(event.target.files?.[0]);
            event.target.value = '';
          }}
        />
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <button
            type="button"
            disabled={isImportingReimbursements}
            onClick={() => reimbursementInputRef.current?.click()}
            className="px-4 py-2.5 border border-[#151515] text-[#151515] text-sm font-medium hover:bg-[#ECE9E2] disabled:opacity-50 transition-colors cursor-pointer flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            {isImportingReimbursements ? 'Importing…' : 'Import Reimbursement CSV'}
          </button>
          {reimbursementMessage && <span className="text-xs text-[#55524B]" role="status">{reimbursementMessage}</span>}
        </div>
      </div>

      <div className="mt-4 border-t border-[#E2DFD7] pt-5 space-y-3">
        <h4 className="font-heading text-sm font-bold text-[#151515] uppercase tracking-wider">
          Accepted CSV Headers
        </h4>
        <div className="grid gap-4 text-xs text-[#55524B]">
          <div>
            <span className="font-semibold text-[#151515]">Normalized charge report - required: </span>
            <span className="font-mono break-words">{CONTRACT_CHARGE_REQUIRED_COLUMNS.join(', ')}</span>
            <div><span className="font-semibold text-[#151515]">Optional: </span>
              <span className="font-mono break-words">{CONTRACT_CHARGE_OPTIONAL_COLUMNS.join(', ')}</span>
            </div>
          </div>
          <div>
            <span className="font-semibold text-[#151515]">Reimbursement report - required: </span>
            <span className="font-mono break-words">{REIMBURSEMENT_REQUIRED_COLUMNS.join(', ')}</span>
            <div><span className="font-semibold text-[#151515]">Optional: </span>
              <span className="font-mono break-words">{REIMBURSEMENT_OPTIONAL_COLUMNS.join(', ')}</span>
            </div>
          </div>
          <div>
            <span className="font-semibold text-[#151515]">Legacy charge report: </span>
            <span className="font-mono break-words">{EXPECTED_LEDGER_COLUMNS.join(', ')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
