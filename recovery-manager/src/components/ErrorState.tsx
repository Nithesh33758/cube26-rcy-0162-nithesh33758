import React from 'react';
import { AlertOctagon, RefreshCw, ArrowLeft, FileText } from 'lucide-react';

interface ErrorStateProps {
  type: 'INVALID_CSV' | 'PROCESSING_FAILURE';
  message?: string;
  onRetry?: () => void;
  onBackToUpload: () => void;
  onChangeFile?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  type,
  message,
  onRetry,
  onBackToUpload,
  onChangeFile
}) => {
  if (type === 'INVALID_CSV') {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16 text-center">
        <div className="w-16 h-16 border border-[#C64B32] bg-[#FAF3F1] text-[#C64B32] mx-auto flex items-center justify-center mb-6">
          <AlertOctagon className="w-8 h-8 stroke-[1.5]" />
        </div>

        <h2 className="font-heading text-3xl font-bold tracking-tight text-[#151515] mb-3">
          Unable to read this file
        </h2>

        <p className="text-sm text-[#55524B] max-w-md mx-auto mb-8 leading-relaxed">
          {message || 'The selected file is not a valid CSV or has corrupted delimiters. Please verify that the file uses standard comma-delimited columns and UTF-8 encoding.'}
        </p>

        <div className="flex items-center justify-center gap-4">
          <button
            onClick={onChangeFile || onBackToUpload}
            className="px-6 py-2.5 bg-[#151515] text-[#F5F3EE] text-sm font-medium hover:bg-[#333333] transition-colors cursor-pointer active:translate-y-[1px]"
          >
            Change File
          </button>
          <button
            onClick={onBackToUpload}
            className="px-4 py-2.5 border border-[#E2DFD7] text-[#151515] text-sm font-medium hover:bg-[#FAF8F5] transition-colors cursor-pointer"
          >
            Back to Upload
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-16 text-center">
      <div className="w-16 h-16 border border-[#C64B32] bg-[#FAF3F1] text-[#C64B32] mx-auto flex items-center justify-center mb-6">
        <AlertOctagon className="w-8 h-8 stroke-[1.5]" />
      </div>

      <h2 className="font-heading text-3xl font-bold tracking-tight text-[#151515] mb-3">
        Analysis could not be completed
      </h2>

      <p className="text-sm text-[#55524B] max-w-md mx-auto mb-8 leading-relaxed">
        {message || 'The operations ledger validation encountered an upstream connection timeout or parsing mismatch while cross-referencing warehouse unit records.'}
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        {onRetry && (
          <button
            onClick={onRetry}
            className="w-full sm:w-auto px-6 py-2.5 bg-[#C64B32] text-white text-sm font-semibold hover:bg-[#B03F28] transition-colors cursor-pointer flex items-center justify-center gap-2 active:translate-y-[1px]"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry Analysis</span>
          </button>
        )}

        <button
          onClick={onBackToUpload}
          className="w-full sm:w-auto px-6 py-2.5 border border-[#151515] text-[#151515] text-sm font-medium hover:bg-[#ECE9E2] transition-colors cursor-pointer flex items-center justify-center gap-2 active:translate-y-[1px]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Upload</span>
        </button>
      </div>

      <div className="mt-10 p-4 border border-[#E2DFD7] bg-[#FAF8F5] text-xs font-mono text-[#737067] max-w-md mx-auto text-left">
        <div>Selected report remains available for retry.</div>
      </div>
    </div>
  );
};
