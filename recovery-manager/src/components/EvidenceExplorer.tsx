import React, { useState, useMemo } from 'react';
import { Charge, EvidenceRecord, ManagerType } from '../types';
import {
  ArrowLeft,
  Search,
  ArrowUpDown,
  Filter,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  AlertTriangle,
  CheckCircle2,
  FileX2,
  ShieldAlert
} from 'lucide-react';

interface EvidenceExplorerProps {
  charges: Charge[];
  onBack: () => void;
  onSelectCharge: (charge: Charge) => void;
}

export interface UnifiedEvidenceRow {
  id: string;
  unitId: string;
  chargeId: string;
  chargeType: string;
  evidenceType: string;
  sourceManager: ManagerType | 'Returns / Salvage' | 'Receiving / Dock';
  requirement: string;
  evidenceStatus: string;
  keyFinding: string;
  metric?: string;
  timestamp: string;
  stationId: string;
  operatorId: string;
  systemRef: string;
}

export const EvidenceExplorer: React.FC<EvidenceExplorerProps> = ({
  charges,
  onBack,
  onSelectCharge
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [managerFilter, setManagerFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sortField, setSortField] = useState<'unitId' | 'evidenceType' | 'sourceManager' | 'evidenceStatus' | 'timestamp'>('timestamp');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Selected evidence for deep telemetry inspection modal
  const [selectedEvidence, setSelectedEvidence] = useState<UnifiedEvidenceRow | null>(null);

  // Show only evidence records returned by the backend.
  const allRows: UnifiedEvidenceRow[] = useMemo(() => {
    const rows: UnifiedEvidenceRow[] = [];

    charges.forEach((c) => {
      c.evidence.forEach((ev) => {
        rows.push({
          id: ev.id,
          unitId: c.unitId,
          chargeId: c.id,
          chargeType: c.chargeType,
          evidenceType: ev.type,
          sourceManager: ev.manager,
          requirement: ev.requirement || 'Not supplied',
          evidenceStatus: ev.status,
          keyFinding: ev.description,
          metric: ev.metric,
          timestamp: ev.timestamp,
          stationId: ev.stationId,
          operatorId: ev.operatorId,
          systemRef: ev.systemRef
        });
      });

    });

    return rows;
  }, [charges]);
  const availableManagers = Array.from(new Set(allRows.map((row) => row.sourceManager)));
  const availableStatuses = Array.from(new Set(allRows.map((row) => row.evidenceStatus)));

  // Filtering
  const filteredRows = useMemo(() => {
    return allRows.filter((row) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        row.unitId.toLowerCase().includes(q) ||
        row.evidenceType.toLowerCase().includes(q) ||
        row.sourceManager.toLowerCase().includes(q) ||
        row.requirement.toLowerCase().includes(q) ||
        row.keyFinding.toLowerCase().includes(q) ||
        row.chargeId.toLowerCase().includes(q) ||
        row.id.toLowerCase().includes(q) ||
        row.stationId.toLowerCase().includes(q);

      const matchesManager =
        managerFilter === 'ALL' || row.sourceManager === managerFilter;

      const matchesStatus =
        statusFilter === 'ALL' || row.evidenceStatus === statusFilter;

      return matchesSearch && matchesManager && matchesStatus;
    });
  }, [allRows, searchQuery, managerFilter, statusFilter]);

  // Sorting
  const sortedRows = useMemo(() => {
    return [...filteredRows].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'unitId':
          comparison = a.unitId.localeCompare(b.unitId);
          break;
        case 'evidenceType':
          comparison = a.evidenceType.localeCompare(b.evidenceType);
          break;
        case 'sourceManager':
          comparison = a.sourceManager.localeCompare(b.sourceManager);
          break;
        case 'evidenceStatus':
          comparison = a.evidenceStatus.localeCompare(b.evidenceStatus);
          break;
        case 'timestamp':
          comparison = a.timestamp.localeCompare(b.timestamp);
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredRows, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(sortedRows.length / pageSize) || 1;
  const paginatedRows = sortedRows.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const renderStatusBadge = (status: UnifiedEvidenceRow['evidenceStatus']) => {
    const normalized = status.toUpperCase();
    const style = normalized === 'VERIFIED' || normalized === 'PASS'
      ? 'text-emerald-800 bg-[#E8F4EC] border-emerald-300'
      : normalized === 'DISCREPANCY' || normalized === 'FAIL'
        ? 'text-[#C64B32] bg-[#FAF3F1] border-[#C64B32]'
        : normalized === 'MISSING' || normalized === 'CONTRADICTED'
          ? 'text-[#9C3824] bg-[#F7EBE8] border-[#9C3824]'
          : 'text-[#151515] bg-[#EAE6DD] border-[#151515]';
    return (
      <span className={`font-mono text-[10px] font-semibold border px-2 py-0.5 inline-flex items-center gap-1 ${style}`}>
        {status.replaceAll('_', ' ')}
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#151515]">
        <div>
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#151515] hover:text-[#C64B32] transition-colors cursor-pointer mb-2 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Results</span>
          </button>

          <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-[#151515]">
            Unified Evidence Master Ledger
          </h1>
          <p className="text-sm text-[#55524B] mt-1 max-w-2xl leading-relaxed">
            Evidence records and source labels returned with the backend analysis.
          </p>
        </div>

        <div className="text-right">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#737067] block mb-0.5">
            Indexed Operational Records
          </span>
          <span className="font-mono text-xs font-semibold text-[#151515]">
            {allRows.length} Total Telemetry Logs
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="border border-[#E2DFD7] bg-[#FAF8F5] p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#737067] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search Unit ID, Requirement, Key Finding, or Manager..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-[#F5F3EE] border border-[#E2DFD7] pl-9 pr-3 py-2 text-xs text-[#151515] placeholder-[#8E8B83] focus:outline-none focus:border-[#151515] font-mono"
          />
        </div>

        {/* Manager Filter Tabs & Status Dropdown */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center border border-[#E2DFD7] bg-[#F5F3EE] p-0.5 text-xs font-mono">
            {['ALL', ...availableManagers].map((mgr) => (
              <button
                key={mgr}
                onClick={() => {
                  setManagerFilter(mgr);
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 transition-colors cursor-pointer whitespace-nowrap ${
                  managerFilter === mgr
                    ? 'bg-[#151515] text-[#F5F3EE] font-semibold'
                    : 'text-[#737067] hover:text-[#151515]'
                }`}
              >
                {mgr === 'ALL' ? 'All Managers' : mgr.replace(' Manager', '')}
              </button>
            ))}
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="border border-[#E2DFD7] bg-[#F5F3EE] px-3 py-1.5 text-xs text-[#151515] font-mono focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            {availableStatuses.map((status) => <option key={status} value={status}>{status.replaceAll('_', ' ')}</option>)}
          </select>
        </div>
      </div>

      {/* SINGLE UNIFIED EVIDENCE TABLE */}
      <div className="border border-[#151515] bg-[#FAF8F5] overflow-x-auto shadow-xs">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[#151515] bg-[#EAE7DF] text-[#151515] font-mono uppercase tracking-wider text-[11px]">
              {/* Unit ID */}
              <th
                onClick={() => toggleSort('unitId')}
                className="py-3 px-3 font-semibold cursor-pointer select-none hover:text-[#C64B32]"
              >
                <div className="flex items-center gap-1">
                  <span>Unit ID</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>

              {/* Evidence Type */}
              <th
                onClick={() => toggleSort('evidenceType')}
                className="py-3 px-3 font-semibold cursor-pointer select-none hover:text-[#C64B32]"
              >
                <div className="flex items-center gap-1">
                  <span>Evidence Type</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>

              {/* Source Manager */}
              <th
                onClick={() => toggleSort('sourceManager')}
                className="py-3 px-3 font-semibold cursor-pointer select-none hover:text-[#C64B32]"
              >
                <div className="flex items-center gap-1">
                  <span>Source Manager</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>

              {/* Requirement */}
              <th className="py-3 px-3 font-semibold">
                Requirement
              </th>

              {/* Evidence Status */}
              <th
                onClick={() => toggleSort('evidenceStatus')}
                className="py-3 px-3 font-semibold cursor-pointer select-none hover:text-[#C64B32]"
              >
                <div className="flex items-center gap-1">
                  <span>Evidence Status</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>

              {/* Key Finding */}
              <th className="py-3 px-4 font-semibold max-w-sm">
                Key Finding
              </th>

              {/* Timestamp */}
              <th
                onClick={() => toggleSort('timestamp')}
                className="py-3 px-3 font-semibold cursor-pointer select-none hover:text-[#C64B32]"
              >
                <div className="flex items-center gap-1">
                  <span>Timestamp</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>

              {/* Action */}
              <th className="py-3 px-3 font-semibold text-right">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2DFD7]">
            {paginatedRows.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-[#737067] font-mono">
                  No operational evidence records match the selected query.
                </td>
              </tr>
            ) : (
              paginatedRows.map((row) => {
                const parentCharge = charges.find((c) => c.id === row.chargeId);

                return (
                  <tr
                    key={row.id}
                    onClick={() => setSelectedEvidence(row)}
                    className="hover:bg-[#F2EFE8] cursor-pointer transition-colors group"
                  >
                    {/* Unit ID */}
                    <td className="py-3 px-3 font-mono font-bold text-[#151515]">
                      <div>{row.unitId}</div>
                      <div className="text-[10px] font-normal text-[#737067]">{row.chargeId}</div>
                    </td>

                    {/* Evidence Type */}
                    <td className="py-3 px-3 font-medium text-[#151515] whitespace-nowrap">
                      {row.evidenceType}
                    </td>

                    {/* Source Manager */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="font-heading font-semibold text-[#151515] bg-[#EAE6DD] px-2 py-0.5 text-[11px]">
                        {row.sourceManager}
                      </span>
                    </td>

                    {/* Requirement */}
                    <td className="py-3 px-3 text-[#55524B] max-w-xs truncate text-[11px] font-mono">
                      {row.requirement}
                    </td>

                    {/* Evidence Status */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      {renderStatusBadge(row.evidenceStatus)}
                    </td>

                    {/* Key Finding */}
                    <td className="py-3 px-4 max-w-sm text-[#55524B] leading-relaxed text-xs">
                      <div className="line-clamp-2">
                        {row.keyFinding}
                      </div>
                      {row.metric && row.metric !== 'N/A' && (
                        <div className="font-mono text-[10px] text-[#151515] font-semibold mt-0.5">
                          Telemetry: {row.metric}
                        </div>
                      )}
                    </td>

                    {/* Timestamp */}
                    <td className="py-3 px-3 font-mono text-[11px] text-[#737067] whitespace-nowrap">
                      {row.timestamp}
                    </td>

                    {/* Action */}
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEvidence(row);
                          }}
                          className="p-1 hover:text-[#C64B32] transition-colors text-[#737067]"
                          title="View Telemetry Dossier"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (parentCharge) onSelectCharge(parentCharge);
                          }}
                          className="inline-flex items-center gap-1 font-mono text-[#151515] group-hover:text-[#C64B32] font-semibold transition-colors cursor-pointer"
                        >
                          <span>Dossier</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination & Count */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-[#737067] pt-2">
        <div>
          Showing {paginatedRows.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to{' '}
          {Math.min(currentPage * pageSize, filteredRows.length)} of {filteredRows.length} evidence records
          {filteredRows.length !== allRows.length && ` (filtered from ${allRows.length})`}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1.5 border border-[#E2DFD7] bg-[#FAF8F5] disabled:opacity-30 disabled:cursor-not-allowed hover:border-[#151515] cursor-pointer text-[#151515]"
            title="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1.5 border border-[#E2DFD7] bg-[#FAF8F5] disabled:opacity-30 disabled:cursor-not-allowed hover:border-[#151515] cursor-pointer text-[#151515]"
            title="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Deep Telemetry Modal / Slide-Over Drawer */}
      {selectedEvidence && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-[#FAF8F5] border border-[#151515] w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#151515]">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-heading text-lg font-bold text-[#151515]">
                    {selectedEvidence.id}
                  </span>
                  {renderStatusBadge(selectedEvidence.evidenceStatus)}
                </div>
                <div className="font-mono text-xs text-[#737067]">
                  Unit: {selectedEvidence.unitId} · Charge: {selectedEvidence.chargeId}
                </div>
              </div>

              <button
                onClick={() => setSelectedEvidence(null)}
                className="p-1 border border-[#E2DFD7] hover:border-[#151515] text-[#151515] cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs font-mono p-4 bg-[#F5F3EE] border border-[#E2DFD7]">
              <div>
                <span className="text-[#737067] uppercase block text-[10px] mb-0.5">Source Manager</span>
                <span className="font-semibold text-[#151515]">{selectedEvidence.sourceManager}</span>
              </div>
              <div>
                <span className="text-[#737067] uppercase block text-[10px] mb-0.5">Station ID</span>
                <span className="font-semibold text-[#151515]">{selectedEvidence.stationId}</span>
              </div>
              <div>
                <span className="text-[#737067] uppercase block text-[10px] mb-0.5">Operator Ref</span>
                <span className="text-[#151515]">{selectedEvidence.operatorId}</span>
              </div>
              <div>
                <span className="text-[#737067] uppercase block text-[10px] mb-0.5">System LPN Ref</span>
                <span className="text-[#151515]">{selectedEvidence.systemRef}</span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="font-mono text-xs font-semibold uppercase text-[#737067] block">
                Requirement Evaluated
              </span>
              <div className="p-3 border border-[#E2DFD7] bg-white text-xs font-mono text-[#151515]">
                {selectedEvidence.requirement}
              </div>
            </div>

            <div className="space-y-2">
              <span className="font-mono text-xs font-semibold uppercase text-[#737067] block">
                Key Finding / Physical Finding
              </span>
              <p className="text-sm text-[#151515] leading-relaxed p-3 bg-white border border-[#E2DFD7]">
                {selectedEvidence.keyFinding}
              </p>
            </div>

            {selectedEvidence.metric && (
              <div className="p-3 bg-[#FAF3F1] border border-[#F0D5D0] flex items-center justify-between text-xs font-mono">
                <span className="text-[#737067] uppercase text-[10px]">Sensor Telemetry Reading:</span>
                <span className="font-bold text-[#C64B32]">{selectedEvidence.metric}</span>
              </div>
            )}

            <div className="pt-4 border-t border-[#E2DFD7] flex items-center justify-between">
              <button
                onClick={() => setSelectedEvidence(null)}
                className="px-4 py-2 border border-[#E2DFD7] text-xs font-medium text-[#151515] hover:bg-[#F5F3EE] cursor-pointer"
              >
                Close
              </button>

              <button
                onClick={() => {
                  const parent = charges.find((c) => c.id === selectedEvidence.chargeId);
                  if (parent) {
                    setSelectedEvidence(null);
                    onSelectCharge(parent);
                  }
                }}
                className="px-4 py-2 bg-[#151515] text-[#F5F3EE] text-xs font-semibold hover:bg-[#333333] cursor-pointer flex items-center gap-1.5"
              >
                <span>Inspect Charge Dossier</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
