import React, { useState } from 'react';
import { 
  Wrench, 
  DollarSign, 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Trash2, 
  Eye, 
  Leaf, 
  Plus, 
  Activity,
  Calculator,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { DiagnosticSession, RepairEstimate, ApplianceType } from '../types';
import { calculateRepairOrReplace, APPLIANCE_SPECS } from '../utils/calculator';
import { api } from '../services/api';
import { ActiveTab } from './Navbar';
import { useAuth } from '../context/AuthContext';

interface DashboardViewProps {
  diagnostics: DiagnosticSession[];
  estimates: RepairEstimate[];
  onRefreshData: () => void;
  onNavigateTab: (tab: ActiveTab) => void;
  onOpenAuth: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  diagnostics,
  estimates,
  onRefreshData,
  onNavigateTab,
  onOpenAuth
}) => {
  const { user } = useAuth();
  const [selectedSession, setSelectedSession] = useState<DiagnosticSession | null>(null);

  // Quick Calculator state
  const [quickType, setQuickType] = useState<ApplianceType>('refrigerator');
  const [quickAge, setQuickAge] = useState<number>(4);
  const [quickRepair, setQuickRepair] = useState<number>(250);
  const [quickReplace, setQuickReplace] = useState<number>(1200);

  const quickCalcResult = calculateRepairOrReplace({
    applianceType: quickType,
    ageYears: quickAge,
    originalPrice: quickReplace,
    estimatedRepairCost: quickRepair,
    replacementCost: quickReplace
  });

  const handleDeleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this diagnostic session?')) return;
    try {
      await api.deleteDiagnostic(id);
      onRefreshData();
      if (selectedSession?.id === id) setSelectedSession(null);
    } catch (err: any) {
      alert(err.message || 'Failed deleting session');
    }
  };

  const handleResolveSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.updateDiagnostic(id, { status: 'resolved' });
      onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Failed updating session');
    }
  };

  // KPI calculations
  const activeSessions = diagnostics.filter(d => d.status === 'active');
  const pendingEstimates = estimates.filter(e => e.status === 'pending');
  const totalSavings = diagnostics.reduce((acc, d) => acc + (d.estimatedSavings || 0), 0);
  const totalCarbon = diagnostics.reduce((acc, d) => acc + (d.carbonSavingsKg || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* Top Welcome / Storefront Hero Showcase */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs relative overflow-hidden bg-store-grid">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-blue-700 uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Certified Appliance Inspection Station · 50% Rule Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1.5 font-mech">
              {user ? `Storefront Portal · ${user.name}` : 'FixBeforeBuy · Mechanical Storefront'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1.5 max-w-2xl leading-relaxed">
              Engineering-grade appliance decision counter. Evaluate whether to service aging machines or procure new hardware using component depreciation, verified workshop quotes, and EPA carbon metrics.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 self-start md:self-center shrink-0">
            <button
              onClick={() => onNavigateTab('analyzer')}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-xs hover:shadow-blue-500/20 font-mech"
            >
              <span>Repair vs. Replace Analyzer</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onNavigateTab('wizard')}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-colors shadow-xs font-mech"
            >
              <Wrench className="w-4 h-4 text-sky-400" />
              <span>Diagnostic Wizard</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Storefront Telemetry Plaques */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        
        <div className="bg-white border border-slate-200/90 p-4 sm:p-5 rounded-xl shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider">Active Diagnostics</span>
            <div className="w-7 h-7 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 tabular-nums">
              {activeSessions.length}
            </span>
            <span className="text-[11px] text-slate-500 block mt-0.5">
              {diagnostics.length} total logged sessions
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 p-4 sm:p-5 rounded-xl shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider">Pending Quotes</span>
            <div className="w-7 h-7 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-amber-600 tabular-nums">
              {pendingEstimates.length}
            </span>
            <span className="text-[11px] text-slate-500 block mt-0.5">
              Service center proposals awaiting review
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 p-4 sm:p-5 rounded-xl shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider">Estimated Savings</span>
            <div className="w-7 h-7 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-600 tabular-nums">
              ${totalSavings.toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-500 block mt-0.5">
              Net savings across repairs
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 p-4 sm:p-5 rounded-xl shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider">CO2e Emissions Prevented</span>
            <div className="w-7 h-7 rounded-md bg-sky-50 text-sky-600 flex items-center justify-center">
              <Leaf className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-blue-700 tabular-nums">
              {totalCarbon} kg
            </span>
            <span className="text-[11px] text-slate-500 block mt-0.5">
              Manufacturing e-waste diverted
            </span>
          </div>
        </div>

      </div>

      {/* Main Grid: Active Diagnostic Sessions & Quick Calculator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Active Diagnostic Sessions (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-blue-600" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 font-mono">
                  Diagnostic History & Inspection Work Orders ({diagnostics.length})
                </h2>
              </div>

              <button
                onClick={() => onNavigateTab('wizard')}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 font-mech uppercase tracking-wider"
              >
                <span>+ New Inspection</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {diagnostics.length === 0 ? (
              <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-lg p-6 bg-slate-50/60">
                <Wrench className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-700 font-mech">No diagnostic sessions logged yet</p>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Run your first repair-or-replace assessment to diagnose symptoms and get data-driven advice.
                </p>
                <button
                  onClick={() => onNavigateTab('wizard')}
                  className="mt-4 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 font-mech shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Start Troubleshooting Wizard</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {diagnostics.map((session) => {
                  const spec = APPLIANCE_SPECS[session.applianceType as ApplianceType] || APPLIANCE_SPECS.refrigerator;
                  const isRepair = session.recommendation === 'REPAIR';
                  const isReplace = session.recommendation === 'REPLACE';

                  return (
                    <div
                      key={session.id}
                      onClick={() => setSelectedSession(session)}
                      className="bg-slate-50 hover:bg-white border border-slate-200 hover:border-slate-300 rounded-lg p-4 cursor-pointer transition-all shadow-2xs hover:shadow-xs"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-900 font-mech">
                              {session.brand} {spec.label}
                            </span>
                            {session.modelNumber && (
                              <span className="text-[10px] font-mono text-slate-600 bg-white border border-slate-200 px-1.5 py-0.5 rounded font-semibold">
                                {session.modelNumber}
                              </span>
                            )}
                            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                              isRepair 
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : isReplace
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : 'bg-blue-100 text-blue-800 border border-blue-300'
                            }`}>
                              {session.recommendation}
                            </span>
                          </div>

                          <p className="text-xs text-slate-600 mt-1 line-clamp-1">
                            {session.problemTitle}
                          </p>

                          <div className="mt-2 flex flex-wrap items-center gap-2 sm:gap-3 text-[11px] text-slate-500 font-mono">
                            <span>Age: <strong className="text-slate-800">{session.ageYears}y</strong> / {session.expectedLifespanYears}y</span>
                            <span>·</span>
                            <span>Repair: <strong className="text-slate-800">${session.estimatedRepairCost}</strong></span>
                            <span>·</span>
                            <span>New: <strong className="text-slate-800">${session.replacementCost}</strong></span>
                            <span>·</span>
                            <span className="text-emerald-700 font-bold">Save ~${session.estimatedSavings}</span>
                          </div>
                        </div>

                        {/* Status + Actions */}
                        <div className="flex items-center gap-2 self-start sm:self-center">
                          {session.status === 'active' ? (
                            <button
                              onClick={(e) => handleResolveSession(session.id, e)}
                              title="Mark issue resolved"
                              className="px-2.5 py-1 text-[11px] font-mono bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded font-semibold transition-colors"
                            >
                              Mark Resolved
                            </button>
                          ) : (
                            <span className="text-[10px] font-mono text-slate-500 uppercase px-2 py-0.5 rounded bg-slate-200">
                              Resolved
                            </span>
                          )}

                          <button
                            onClick={(e) => handleDeleteSession(session.id, e)}
                            title="Delete session"
                            className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pending Estimates Preview Widget */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-500" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 font-mono">
                  Pending Repair Quotations ({pendingEstimates.length})
                </h2>
              </div>
              <button
                onClick={() => onNavigateTab('estimates')}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 font-mech uppercase tracking-wider"
              >
                <span>View All Quotes</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {pendingEstimates.length === 0 ? (
              <p className="text-xs text-slate-500 py-3">
                No quotes currently pending. You can request estimates directly from our certified service center directory.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {pendingEstimates.map(est => (
                  <div key={est.id} className="bg-slate-50 border border-slate-200 p-3.5 rounded-lg flex flex-col justify-between hover:bg-white hover:border-slate-300 transition-all">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 truncate max-w-[180px] font-mech">
                          {est.applianceDescription}
                        </span>
                        <span className="text-xs font-mono font-bold text-amber-600 tabular-nums">
                          ${est.totalCost}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 mt-0.5 block truncate">
                        {est.serviceCenterName}
                      </span>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-mono">Expires: {est.validUntil}</span>
                      <button
                        onClick={() => onNavigateTab('estimates')}
                        className="text-blue-600 hover:text-blue-700 font-bold uppercase font-mech"
                      >
                        Review Quote
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Quick Repair-or-Replace Interactive Calculator (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs">
            <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
              <Calculator className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-mono">
                Storefront 50% Rule Benchmark
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Instantly test any appliance breakdown scenario against standard industry benchmarks.
            </p>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Appliance Category</label>
                <select
                  value={quickType}
                  onChange={(e) => {
                    const t = e.target.value as ApplianceType;
                    setQuickType(t);
                    const s = APPLIANCE_SPECS[t];
                    setQuickReplace(s.averageReplacementPrice);
                    setQuickRepair(Math.round(s.averageReplacementPrice * 0.3));
                    setQuickAge(Math.round(s.defaultLifespan * 0.4));
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-blue-500 font-medium"
                >
                  <option value="refrigerator">Refrigerator (12y life)</option>
                  <option value="washing_machine">Washing Machine (10y life)</option>
                  <option value="dryer">Dryer (13y life)</option>
                  <option value="dishwasher">Dishwasher (9y life)</option>
                  <option value="laptop">Laptop / PC (5y life)</option>
                  <option value="hvac_ac">HVAC / AC (15y life)</option>
                  <option value="microwave">Microwave (8y life)</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between text-slate-700 mb-1 font-semibold">
                  <span>Age: <strong className="text-blue-600 font-mono">{quickAge} years</strong></span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Max ~{APPLIANCE_SPECS[quickType]?.defaultLifespan}y
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="16"
                  step="0.5"
                  value={quickAge}
                  onChange={(e) => setQuickAge(parseFloat(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Repair Quote ($)</label>
                  <input
                    type="number"
                    value={quickRepair}
                    onChange={(e) => setQuickRepair(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-xs text-slate-900 font-mono tabular-nums focus:outline-hidden focus:border-blue-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">New Model ($)</label>
                  <input
                    type="number"
                    value={quickReplace}
                    onChange={(e) => setQuickReplace(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-xs text-slate-900 font-mono tabular-nums focus:outline-hidden focus:border-blue-500 font-bold"
                  />
                </div>
              </div>

              {/* Instant Output Result Box */}
              <div className={`p-3.5 rounded-lg border text-xs space-y-1.5 ${
                quickCalcResult.recommendation === 'REPAIR'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : quickCalcResult.recommendation === 'REPLACE'
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : 'bg-blue-50 border-blue-200 text-blue-900'
              }`}>
                <div className="flex items-center justify-between font-bold uppercase font-mono">
                  <span>Verdict: {quickCalcResult.recommendation}</span>
                  <span className="text-emerald-700">Save ~${quickCalcResult.savings}</span>
                </div>
                <p className="text-[11px] leading-snug">
                  {quickCalcResult.primaryReason}
                </p>
              </div>

              <button
                onClick={() => onNavigateTab('wizard')}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors font-mech shadow-xs"
              >
                <span>Run Full Diagnostic Report</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Mechanic Certifications & Standards Box */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 text-xs text-slate-600 space-y-2 shadow-xs">
            <span className="font-mono text-slate-900 font-bold block uppercase tracking-wider">
              Diagnostic Standards Applied:
            </span>
            <ul className="space-y-1.5 text-[11px] list-disc list-inside text-slate-600">
              <li>Industry 50% Rule (repair &gt; 50% of new cost + 50% of lifespan)</li>
              <li>Straight-line scrap depreciation modeling</li>
              <li>Manufacturing embodied carbon footprint (EPA standards)</li>
            </ul>
          </div>

        </div>

      </div>

      {/* Diagnostic Session Detail Modal */}
      {selectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-blue-600 font-bold">
                  Detailed Inspection Dossier
                </span>
                <h3 className="text-lg font-bold text-slate-900 font-mech">
                  {selectedSession.brand} {selectedSession.applianceType}
                </h3>
                <span className="text-xs text-slate-500">
                  Logged on {new Date(selectedSession.createdAt).toLocaleDateString()}
                </span>
              </div>
              <button
                onClick={() => setSelectedSession(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                ✕
              </button>
            </div>

            <div className={`p-4 rounded-lg border text-xs ${
              selectedSession.recommendation === 'REPAIR'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}>
              <div className="font-bold font-mono text-sm uppercase">
                Recommendation: {selectedSession.recommendation}
              </div>
              <p className="mt-1 text-slate-700 leading-relaxed">
                {selectedSession.recommendationReason}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-[11px] text-slate-500 block">Appliance Age</span>
                <span className="font-mono text-slate-900 font-bold block mt-0.5">
                  {selectedSession.ageYears} yrs (Lifespan: {selectedSession.expectedLifespanYears} yrs)
                </span>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-[11px] text-slate-500 block">Repair Quote</span>
                <span className="font-mono text-slate-900 font-bold block mt-0.5">
                  ${selectedSession.estimatedRepairCost}
                </span>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-[11px] text-slate-500 block">Replacement Cost</span>
                <span className="font-mono text-slate-900 font-bold block mt-0.5">
                  ${selectedSession.replacementCost}
                </span>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-[11px] text-slate-500 block">Net Estimated Savings</span>
                <span className="font-mono text-emerald-700 font-bold block mt-0.5">
                  ${selectedSession.estimatedSavings}
                </span>
              </div>
            </div>

            {selectedSession.symptoms && selectedSession.symptoms.length > 0 && (
              <div>
                <span className="text-xs font-mono font-semibold uppercase text-slate-700 block mb-1">
                  Observed Symptoms:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedSession.symptoms.map((s, idx) => (
                    <span key={idx} className="text-[11px] bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-slate-700 font-medium">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {selectedSession.diyChecklist && selectedSession.diyChecklist.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-xs font-mono font-semibold uppercase text-slate-700 block">
                  DIY Troubleshooting Protocol:
                </span>
                {selectedSession.diyChecklist.map((tip, idx) => (
                  <div key={idx} className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-start gap-2">
                    <span className="font-mono text-blue-600 font-bold">{idx + 1}.</span>
                    <span>{tip}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
              <button
                onClick={() => {
                  setSelectedSession(null);
                  onNavigateTab('locator');
                }}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold uppercase tracking-wider font-mech shadow-xs"
              >
                Find Repair Centers for this Model
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
