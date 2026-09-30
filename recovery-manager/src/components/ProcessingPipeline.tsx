import React, { useEffect, useState } from 'react';
import { Check, Loader2, ArrowRight } from 'lucide-react';

interface ProcessingPipelineProps {
  totalRows: number;
  onComplete: () => void;
  onError: () => void;
  simulateError?: boolean;
}

interface Step {
  id: number;
  label: string;
  description: string;
  detail: string;
}

const STEPS: Step[] = [
  {
    id: 1,
    label: 'Reading charges',
    description: 'Preparing the uploaded CSV for backend analysis.',
    detail: 'Uploaded report sent to the backend.'
  },
  {
    id: 2,
    label: 'Validating report',
    description: 'Validating the report structure and rows.',
    detail: 'Backend validation completed.'
  },
  {
    id: 3,
    label: 'Matching units',
    description: 'Grouping uploaded charges for analysis.',
    detail: 'Charges grouped by the backend.'
  },
  {
    id: 4,
    label: 'Retrieving upstream evidence',
    description: 'Loading evidence associated with the charges.',
    detail: 'Backend evidence lookup completed.'
  },
  {
    id: 5,
    label: 'Checking requirements',
    description: 'Loading applicable requirements for each charge.',
    detail: 'Backend requirement lookup completed.'
  },
  {
    id: 6,
    label: 'Generating decisions',
    description: 'Applying the configured decision provider.',
    detail: 'Backend decisions completed.'
  },
  {
    id: 7,
    label: 'Finalizing results',
    description: 'Retrieving the completed analysis response.',
    detail: 'Loading backend summary and charge results.'
  }
];

export const ProcessingPipeline: React.FC<ProcessingPipelineProps> = ({
  totalRows,
  onComplete,
  onError,
  simulateError = false
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    // If simulateError is true, fail on step 4
    if (simulateError && currentStepIndex === 3) {
      const errorTimer = setTimeout(() => {
        onError();
      }, 700);
      return () => clearTimeout(errorTimer);
    }

    if (currentStepIndex < STEPS.length) {
      // Step duration between 450ms and 650ms for realistic operations feel
      const duration = 520;
      const timer = setTimeout(() => {
        setCurrentStepIndex((prev) => prev + 1);
      }, duration);

      return () => clearTimeout(timer);
    } else {
      // Step sequence completed, transition to results
      const completeTimer = setTimeout(() => {
        onComplete();
      }, 400);

      return () => clearTimeout(completeTimer);
    }
  }, [currentStepIndex, simulateError, onComplete, onError]);

  return (
    <div className="max-w-3xl mx-auto px-6 py-14">
      {/* Editorial Title & Subtitle */}
      <div className="mb-12">
        <div className="text-xs uppercase tracking-widest text-[#737067] font-mono mb-2">
          Operations Verification Engine
        </div>
        <h1 className="font-heading text-4xl sm:text-5xl font-bold tracking-tight text-[#151515] mb-3 text-balance">
          Analyzing Recovery Report
        </h1>
        <p className="text-lg text-[#55524B] max-w-2xl leading-relaxed">
          Matching charges against operational evidence and recovery requirements.
        </p>
      </div>

      {/* Processing Status Banner */}
      <div className="border border-[#151515] bg-[#FAF8F5] p-6 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono uppercase text-[#737067] block mb-0.5">
            Active Ledger Processing
          </span>
          <div className="font-heading text-lg font-bold text-[#151515] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#C64B32] animate-pulse"></span>
            <span>
              {currentStepIndex < STEPS.length
                ? STEPS[currentStepIndex].label
                : 'Finalizing ledger output...'}
            </span>
          </div>
        </div>

        <div className="text-right sm:border-l sm:border-[#E2DFD7] sm:pl-6">
          <span className="text-xs font-mono uppercase text-[#737067] block mb-0.5">
            Rows in report
          </span>
          <span className="font-heading text-lg font-bold text-[#151515] tabular-nums">
            {totalRows} charges
          </span>
        </div>
      </div>

      {/* Step by Step Timeline */}
      <div className="border border-[#E2DFD7] bg-[#FAF8F5] divide-y divide-[#E2DFD7]">
        {STEPS.map((step, idx) => {
          const isDone = currentStepIndex > idx;
          const isCurrent = currentStepIndex === idx;
          const isPending = currentStepIndex < idx;

          return (
            <div
              key={step.id}
              className={`p-4 sm:px-6 transition-colors flex items-start justify-between gap-4 ${
                isCurrent ? 'bg-[#F2EFE8]' : 'bg-[#FAF8F5]'
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Step indicator symbol matching the prompt spec */}
                <div className="w-6 h-6 flex items-center justify-center shrink-0 mt-0.5 font-mono text-sm">
                  {isDone && (
                    <div className="w-5 h-5 bg-[#151515] text-[#F5F3EE] flex items-center justify-center text-xs">
                      ✓
                    </div>
                  )}
                  {isCurrent && (
                    <div className="w-3.5 h-3.5 rounded-full bg-[#C64B32] animate-ping" />
                  )}
                  {isPending && (
                    <span className="text-[#A8A49B] text-base">○</span>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-semibold tracking-tight ${
                        isDone
                          ? 'text-[#151515]'
                          : isCurrent
                          ? 'text-[#C64B32] font-bold'
                          : 'text-[#8E8B83]'
                      }`}
                    >
                      {step.label}
                    </span>
                    {isCurrent && (
                      <span className="text-[11px] font-mono uppercase text-[#C64B32] bg-[#FAF3F1] px-1.5 py-0.2 border border-[#F0D5D0]">
                        In Progress
                      </span>
                    )}
                  </div>
                  <p
                    className={`text-xs mt-0.5 ${
                      isCurrent ? 'text-[#3E3C37]' : 'text-[#737067]'
                    }`}
                  >
                    {isDone ? step.detail : step.description}
                  </p>
                </div>
              </div>

              <div className="text-xs font-mono text-[#8E8B83] shrink-0 pt-0.5">
                0{step.id} / 07
              </div>
            </div>
          );
        })}
      </div>

      {/* Subtle testing convenience control */}
      <div className="mt-6 flex items-center justify-between text-xs text-[#737067]">
        <span>Analysis is running on the backend</span>
        <button
          onClick={onComplete}
          className="hover:text-[#151515] underline cursor-pointer text-xs font-mono"
        >
          Check for results →
        </button>
      </div>
    </div>
  );
};
