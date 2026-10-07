import React, { useState, useEffect } from 'react';
import { 
  FileCheck2, 
  Plus, 
  CheckCircle, 
  XCircle, 
  Trash2, 
  Clock, 
  DollarSign, 
  Phone, 
  Building2, 
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { RepairEstimate } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ActiveTab } from './Navbar';

interface EstimatesViewProps {
  onNavigateTab: (tab: ActiveTab) => void;
}

export const EstimatesView: React.FC<EstimatesViewProps> = ({ onNavigateTab }) => {
  const { user } = useAuth();
  const [estimates, setEstimates] = useState<RepairEstimate[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // New estimate form
  const [applianceDescription, setApplianceDescription] = useState('');
  const [serviceCenterName, setServiceCenterName] = useState('');
  const [partsCost, setPartsCost] = useState<number>(120);
  const [laborCost, setLaborCost] = useState<number>(160);
  const [warrantyMonths, setWarrantyMonths] = useState<number>(12);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const fetchEstimates = async () => {
    setIsLoading(true);
    try {
      const data = await api.getEstimates();
      setEstimates(data);
    } catch (err) {
      console.warn('Failed loading estimates', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchEstimates();
    }
  }, [user]);

  const handleUpdateStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const updated = await api.updateEstimate(id, { status });
      setEstimates(prev => prev.map(e => e.id === id ? updated : e));
    } catch (err: any) {
      alert(err.message || 'Failed updating status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this repair estimate?')) return;
    try {
      await api.deleteEstimate(id);
      setEstimates(prev => prev.filter(e => e.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed deleting estimate');
    }
  };

  const handleCreateEstimate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const taxAndFees = Math.round((partsCost + laborCost) * 0.08);
      const created = await api.createEstimate({
        applianceDescription,
        serviceCenterName,
        partsCost,
        laborCost,
        taxAndFees,
        warrantyMonths,
        notes: notes || undefined
      });

      setEstimates(prev => [created, ...prev]);
      setIsModalOpen(false);
      setApplianceDescription('');
      setServiceCenterName('');
      setNotes('');
    } catch (err: any) {
      alert(err.message || 'Failed creating estimate');
    } finally {
      setIsSaving(false);
    }
  };

  const pendingCount = estimates.filter(e => e.status === 'pending').length;
  const approvedTotal = estimates
    .filter(e => e.status === 'approved')
    .reduce((sum, e) => sum + e.totalCost, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-store-grid">
        <div>
          <div className="text-[11px] font-mono text-blue-700 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <FileCheck2 className="w-4 h-4 text-blue-600" />
            <span>Appraisal Station · Work Orders & Quotes</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-1 font-mech">
            Certified Repair Quotes & Invoices
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Compare quotes from certified repair centers, inspect parts vs labor charges, and track warranty coverage across workshops.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-center shrink-0">
          <button
            onClick={fetchEstimates}
            title="Refresh Quotes"
            className="p-2.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow-xs font-mech"
          >
            <Plus className="w-4 h-4" />
            <span>Add Manual Quote</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 p-4 sm:p-5 rounded-xl shadow-xs">
          <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider font-semibold block">
            Pending Approval
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold font-mono text-amber-600 mt-1 block tabular-nums">
            {pendingCount} Quotes
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            Awaiting customer authorization
          </span>
        </div>

        <div className="bg-white border border-slate-200 p-4 sm:p-5 rounded-xl shadow-xs">
          <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider font-semibold block">
            Approved Work Orders
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-600 mt-1 block tabular-nums">
            ${approvedTotal.toLocaleString()}
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            Authorized technician repairs
          </span>
        </div>

        <div className="bg-white border border-slate-200 p-4 sm:p-5 rounded-xl shadow-xs">
          <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider font-semibold block">
            Total Quotations Logged
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 mt-1 block tabular-nums">
            {estimates.length}
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            Historical repair records
          </span>
        </div>
      </div>

      {/* Estimates Table / Cards */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-mono">
            Itemized Repair Proposals & Work Orders
          </h2>
          <span className="text-[11px] font-mono text-slate-500">
            {estimates.length} recorded items
          </span>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-slate-500 text-xs font-mono">
            Loading repair quotes...
          </div>
        ) : estimates.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
            <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="font-bold text-slate-800 text-sm font-mech">No Repair Estimates Logged</p>
            <p className="text-xs text-slate-500 mt-1">
              Request a quote via the Service Center Locator or click "Add Manual Quote" above.
            </p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {estimates.map((est) => (
              <div
                key={est.id}
                className="bg-slate-50/70 border border-slate-200 hover:border-slate-300 hover:bg-white rounded-xl p-4 sm:p-5 transition-all shadow-2xs"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-base font-bold text-slate-900 font-mech">
                        {est.applianceDescription}
                      </span>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md uppercase ${
                        est.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : est.status === 'rejected'
                          ? 'bg-red-100 text-red-800 border border-red-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}>
                        {est.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 mt-1.5">
                      <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="text-slate-900 font-semibold">{est.serviceCenterName}</span>
                      {est.serviceCenterPhone && (
                        <>
                          <span className="text-slate-300">·</span>
                          <span className="font-mono text-slate-600">{est.serviceCenterPhone}</span>
                        </>
                      )}
                      <span className="text-slate-300">·</span>
                      <span className="font-mono text-[11px] text-slate-500">
                        Valid until {est.validUntil}
                      </span>
                    </div>
                  </div>

                  {/* Financial Breakdown */}
                  <div className="flex items-center gap-4 self-end md:self-center">
                    <div className="text-right">
                      <span className="text-[10px] font-mono text-slate-500 uppercase block font-semibold">Total Quote</span>
                      <span className="text-xl sm:text-2xl font-bold font-mono text-slate-900 tabular-nums">
                        ${est.totalCost}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 border-l border-slate-200 pl-3">
                      {est.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(est.id, 'approved')}
                            title="Approve repair quote"
                            className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg transition-colors"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(est.id, 'rejected')}
                            title="Reject repair quote"
                            className="p-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg transition-colors"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}

                      <button
                        onClick={() => handleDelete(est.id)}
                        title="Delete record"
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Sub details: Parts vs labor & warranty */}
                <div className="mt-3.5 pt-3 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4 font-mono text-[11px]">
                    <span>Parts: <strong className="text-slate-900">${est.partsCost}</strong></span>
                    <span>Labor: <strong className="text-slate-900">${est.laborCost}</strong></span>
                    <span>Tax/Shop Fees: <strong className="text-slate-900">${est.taxAndFees}</strong></span>
                    <span>Warranty: <strong className="text-blue-700">{est.warrantyMonths} Months</strong></span>
                  </div>

                  {est.notes && (
                    <span className="text-[11px] text-slate-600 italic truncate max-w-md">
                      "{est.notes}"
                    </span>
                  )}
                </div>

              </div>
            ))}
          </div>
        )}

      </div>

      {/* Manual Quote Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 font-mono mb-4 pb-2 border-b border-slate-100">
              Add New Repair Quote
            </h3>

            <form onSubmit={handleCreateEstimate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Appliance Model / Description
                </label>
                <input
                  type="text"
                  required
                  value={applianceDescription}
                  onChange={(e) => setApplianceDescription(e.target.value)}
                  placeholder="e.g. Bosch 800 Series Dishwasher"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Service Center / Mechanic Name
                </label>
                <input
                  type="text"
                  required
                  value={serviceCenterName}
                  onChange={(e) => setServiceCenterName(e.target.value)}
                  placeholder="e.g. Metro Pro Diagnostics"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-blue-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Parts Cost ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={partsCost}
                    onChange={(e) => setPartsCost(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono tabular-nums focus:outline-hidden focus:border-blue-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Labor Cost ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={laborCost}
                    onChange={(e) => setLaborCost(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono tabular-nums focus:outline-hidden focus:border-blue-500 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Warranty Guarantee (Months)
                </label>
                <input
                  type="number"
                  min="0"
                  value={warrantyMonths}
                  onChange={(e) => setWarrantyMonths(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono tabular-nums focus:outline-hidden focus:border-blue-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Technician Notes / Parts Replaced
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Circulation pump replacement + 90-day parts warranty"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-blue-500 font-medium"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg font-mech"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider font-mech transition-all shadow-xs"
                >
                  {isSaving ? 'Saving...' : 'Save Estimate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
