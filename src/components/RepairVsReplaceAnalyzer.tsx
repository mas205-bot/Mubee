import React, { useState } from 'react';
import { 
  Scale, 
  Wrench, 
  ShoppingBag, 
  DollarSign, 
  Clock, 
  ShieldCheck, 
  Leaf, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  RotateCcw, 
  Save, 
  MapPin, 
  Printer,
  ChevronRight,
  Info
} from 'lucide-react';
import { ApplianceType, DiagnosedIssueOption, RecommendationType } from '../types';
import { 
  APPLIANCE_SPECS, 
  DIAGNOSED_ISSUES_CATALOG, 
  calculateRepairOrReplace 
} from '../utils/calculator';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ActiveTab } from './Navbar';

interface RepairVsReplaceAnalyzerProps {
  onSessionSaved: () => void;
  onNavigateTab: (tab: ActiveTab) => void;
  onSelectServiceCenterAppliance?: (appliance: ApplianceType) => void;
}

export const RepairVsReplaceAnalyzer: React.FC<RepairVsReplaceAnalyzerProps> = ({
  onSessionSaved,
  onNavigateTab,
  onSelectServiceCenterAppliance
}) => {
  const { user } = useAuth();

  const [selectedAppliance, setSelectedAppliance] = useState<ApplianceType>('refrigerator');
  const [selectedIssueId, setSelectedIssueId] = useState<string>('ref-fan-02');
  
  // Custom or pre-filled parameters
  const [currentAge, setCurrentAge] = useState<number>(4);
  const [repairCost, setRepairCost] = useState<number>(185);
  const [repairedLifespan, setRepairedLifespan] = useState<number>(6);
  const [newApplianceCost, setNewApplianceCost] = useState<number>(1250);
  const [newApplianceLifespan, setNewApplianceLifespan] = useState<number>(12);
  const [brand, setBrand] = useState<string>('Whirlpool');
  const [customIssueTitle, setCustomIssueTitle] = useState<string>('Evaporator Fan Motor Failure');

  // Saving state
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Issues matching selected appliance
  const availableIssues = DIAGNOSED_ISSUES_CATALOG.filter(
    issue => issue.applianceType === selectedAppliance
  );

  const handleApplianceChange = (type: ApplianceType) => {
    setSelectedAppliance(type);
    const issuesForType = DIAGNOSED_ISSUES_CATALOG.filter(i => i.applianceType === type);
    const spec = APPLIANCE_SPECS[type];
    
    if (issuesForType.length > 0) {
      applyIssue(issuesForType[0]);
    } else {
      setRepairCost(Math.round(spec.averageReplacementPrice * 0.28));
      setRepairedLifespan(Math.round(spec.defaultLifespan * 0.45));
      setNewApplianceCost(spec.averageReplacementPrice);
      setNewApplianceLifespan(spec.defaultLifespan);
      setCustomIssueTitle(`${spec.label} Component Fault`);
      setSelectedIssueId('custom');
    }
  };

  const applyIssue = (issue: DiagnosedIssueOption) => {
    setSelectedIssueId(issue.id);
    setCustomIssueTitle(issue.title);
    setRepairCost(issue.estimatedRepairCost);
    setRepairedLifespan(issue.repairedAddedLifespanYears);
    setNewApplianceCost(issue.typicalReplacementCost);
    setNewApplianceLifespan(issue.newUnitLifespanYears);
  };

  // Run calculation
  const calculation = calculateRepairOrReplace({
    applianceType: selectedAppliance,
    ageYears: currentAge,
    originalPrice: newApplianceCost,
    estimatedRepairCost: repairCost,
    replacementCost: newApplianceCost,
    diagnosedAddedLifespanYears: repairedLifespan
  });

  const annualizedRepair = Math.round(repairCost / Math.max(1, repairedLifespan));
  const annualizedNew = Math.round(newApplianceCost / Math.max(1, newApplianceLifespan));
  const annualSavings = annualizedNew - annualizedRepair;

  const handleSaveDecision = async () => {
    setIsSaving(true);
    try {
      await api.createDiagnostic({
        applianceType: selectedAppliance,
        brand,
        ageYears: currentAge,
        expectedLifespanYears: newApplianceLifespan,
        originalPrice: newApplianceCost,
        estimatedRepairCost: repairCost,
        replacementCost: newApplianceCost,
        problemTitle: customIssueTitle,
        symptoms: [`Diagnosed Issue: ${customIssueTitle}`],
        severity: 'moderate',
        recommendation: calculation.recommendation,
        recommendationReason: calculation.primaryReason,
        estimatedSavings: calculation.savings,
        carbonSavingsKg: calculation.carbonSavingsKg,
        fiftyPercentRuleTriggered: calculation.fiftyPercentRuleBreached,
        diyChecklist: calculation.diyChecklist,
        attachedFileIds: []
      });

      setSaveSuccess(true);
      onSessionSaved();
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed saving decision');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* Top Banner / Storefront Appraisal Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5 bg-store-grid">
        <div>
          <div className="text-[11px] font-mono text-blue-700 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Scale className="w-4 h-4 text-blue-600" />
            <span>Appraisal Counter · Repair vs. Replace Engineering Matrix</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1 font-mech">
            Appliance Lifespan & Cost Decision Engine
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Based on the diagnosed mechanical fault, compare estimated repair costs and extended unit lifespan directly against the cost and expected service life of a brand-new appliance.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-center shrink-0">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors font-mech"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>

          <button
            onClick={handleSaveDecision}
            disabled={isSaving || saveSuccess}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg transition-all shadow-xs font-mech"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saveSuccess ? 'Saved to Dashboard!' : isSaving ? 'Saving...' : 'Save Decision'}</span>
          </button>
        </div>
      </div>

      {/* Appliance & Diagnosed Issue Selector */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-mono">
            01. Select Hardware Category & Diagnosed Fault
          </h2>
          <span className="text-[11px] font-mono text-slate-500 font-semibold">
            {APPLIANCE_SPECS[selectedAppliance].label} ({APPLIANCE_SPECS[selectedAppliance].defaultLifespan}y avg life)
          </span>
        </div>

        {/* Category Pills / Buttons */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'refrigerator', label: 'Refrigerator' },
            { id: 'washing_machine', label: 'Washing Machine' },
            { id: 'dryer', label: 'Dryer' },
            { id: 'dishwasher', label: 'Dishwasher' },
            { id: 'laptop', label: 'Laptop / PC' },
            { id: 'hvac_ac', label: 'HVAC / AC' },
            { id: 'microwave', label: 'Microwave' },
            { id: 'oven_range', label: 'Oven & Range' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => handleApplianceChange(item.id as ApplianceType)}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg border transition-all font-mech uppercase tracking-wider ${
                selectedAppliance === item.id
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Diagnosed Issues Carousel / Cards */}
        {availableIssues.length > 0 && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Common Workshop Faults for {APPLIANCE_SPECS[selectedAppliance].label}:
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {availableIssues.map((issue) => {
                const isSelected = selectedIssueId === issue.id;
                return (
                  <div
                    key={issue.id}
                    onClick={() => applyIssue(issue)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-blue-50/70 border-blue-600 shadow-xs ring-1 ring-blue-600'
                        : 'bg-slate-50 hover:bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1.5">
                      <span className="text-xs font-bold text-slate-900 leading-snug font-mech">
                        {issue.title}
                      </span>
                      <span className="text-xs font-mono font-bold text-blue-700 shrink-0">
                        ${issue.estimatedRepairCost}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                      {issue.description}
                    </p>

                    <div className="mt-2.5 pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                      <span>Adds ~{issue.repairedAddedLifespanYears}y life</span>
                      <span className={issue.diyFeasibility === 'Simple DIY' ? 'text-emerald-700 font-bold' : 'text-slate-600 font-medium'}>
                        {issue.diyFeasibility}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Input Parameters Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5 pt-3 border-t border-slate-100">
          <div>
            <label className="block text-[11px] font-mono text-slate-600 mb-1 font-semibold">
              Brand / Manufacturer
            </label>
            <input
              type="text"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-xs text-slate-900 focus:outline-hidden focus:border-blue-500 font-semibold"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono text-slate-600 mb-1 font-semibold">
              Current Appliance Age (Years)
            </label>
            <input
              type="number"
              min="0.5"
              max="25"
              step="0.5"
              value={currentAge}
              onChange={(e) => setCurrentAge(parseFloat(e.target.value) || 1)}
              className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-xs text-slate-900 font-mono tabular-nums focus:outline-hidden focus:border-blue-500 font-semibold"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono text-slate-600 mb-1 font-semibold">
              Estimated Repair Quote ($)
            </label>
            <input
              type="number"
              min="10"
              step="10"
              value={repairCost}
              onChange={(e) => setRepairCost(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-xs text-slate-900 font-mono tabular-nums focus:outline-hidden focus:border-blue-500 font-bold"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono text-slate-600 mb-1 font-semibold">
              Cost of New Replacement Unit ($)
            </label>
            <input
              type="number"
              min="50"
              step="25"
              value={newApplianceCost}
              onChange={(e) => setNewApplianceCost(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-xs text-slate-900 font-mono tabular-nums focus:outline-hidden focus:border-blue-500 font-bold"
            />
          </div>
        </div>
      </div>

      {/* SIDE-BY-SIDE COMPARISON: REPAIR vs. REPLACE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* CARD 1: REPAIR THE EXISTING UNIT */}
        <div className={`rounded-xl border p-6 flex flex-col justify-between shadow-xs transition-all ${
          calculation.recommendation === 'REPAIR'
            ? 'bg-white border-2 border-emerald-500 ring-2 ring-emerald-500/20'
            : 'bg-white border-slate-200'
        }`}>
          <div>
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-2xs">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-mech">
                    Option A: Repair Current Unit
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    Fix fault: {customIssueTitle}
                  </span>
                </div>
              </div>

              {calculation.recommendation === 'REPAIR' && (
                <span className="text-[10px] font-mono font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-md">
                  ★ RECOMMENDED
                </span>
              )}
            </div>

            {/* Financial & Lifespan KPIs */}
            <div className="grid grid-cols-2 gap-3 my-4">
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                <span className="text-[11px] text-slate-500 block font-semibold">Total Repair Cost</span>
                <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums block mt-1">
                  ${repairCost}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  Parts + technician labor
                </span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                <span className="text-[11px] text-slate-500 block font-semibold">Repaired Unit Lifespan</span>
                <span className="text-2xl font-bold font-mono text-blue-700 tabular-nums block mt-1">
                  +{repairedLifespan} Years
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  Added operating duration
                </span>
              </div>
            </div>

            {/* Annualized Cost Metric */}
            <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-lg flex items-center justify-between mb-4">
              <div className="text-xs">
                <span className="font-semibold text-blue-900 block font-mech">Annualized Operating Cost</span>
                <span className="text-[11px] text-slate-600">
                  Cost spread over repaired lifetime
                </span>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold font-mono text-slate-900 tabular-nums">
                  ${annualizedRepair} / year
                </span>
              </div>
            </div>

            {/* Detailed Features List */}
            <ul className="space-y-2 text-xs text-slate-700">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Fast turnaround: typically 1 to 2 business days</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Warranty: 90 to 365-day repair guarantee on replaced component</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Zero haul-away or complex cabinet re-installation hassle</span>
              </li>
              <li className="flex items-center gap-2">
                <Leaf className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Prevents {calculation.carbonSavingsKg} kg of manufacturing CO2e e-waste</span>
              </li>
            </ul>
          </div>

          <div className="mt-6 pt-3.5 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs font-mono text-slate-600">
              Upfront Savings: <strong className="text-emerald-700 font-bold">${newApplianceCost - repairCost}</strong>
            </span>
            <button
              onClick={() => {
                if (onSelectServiceCenterAppliance) {
                  onSelectServiceCenterAppliance(selectedAppliance);
                }
                onNavigateTab('locator');
              }}
              className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 font-mech uppercase tracking-wider"
            >
              <span>Find Repair Pros</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* CARD 2: BUY A BRAND-NEW APPLIANCE */}
        <div className={`rounded-xl border p-6 flex flex-col justify-between shadow-xs transition-all ${
          calculation.recommendation === 'REPLACE'
            ? 'bg-white border-2 border-amber-500 ring-2 ring-amber-500/20'
            : 'bg-white border-slate-200'
        }`}>
          <div>
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600 shadow-2xs">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-mech">
                    Option B: Buy New Replacement
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    Modern Energy Star {APPLIANCE_SPECS[selectedAppliance].label}
                  </span>
                </div>
              </div>

              {calculation.recommendation === 'REPLACE' && (
                <span className="text-[10px] font-mono font-bold uppercase bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-md">
                  ★ RECOMMENDED
                </span>
              )}
            </div>

            {/* Financial & Lifespan KPIs */}
            <div className="grid grid-cols-2 gap-3 my-4">
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                <span className="text-[11px] text-slate-500 block font-semibold">New Appliance Cost</span>
                <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums block mt-1">
                  ${newApplianceCost}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  Full purchase price
                </span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                <span className="text-[11px] text-slate-500 block font-semibold">Expected New Lifespan</span>
                <span className="text-2xl font-bold font-mono text-blue-700 tabular-nums block mt-1">
                  {newApplianceLifespan} Years
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  Full factory lifespan
                </span>
              </div>
            </div>

            {/* Annualized Cost Metric */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between mb-4">
              <div className="text-xs">
                <span className="font-semibold text-slate-800 block font-mech">Annualized Operating Cost</span>
                <span className="text-[11px] text-slate-500">
                  Cost spread over 12-year lifespan
                </span>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold font-mono text-slate-900 tabular-nums">
                  ${annualizedNew} / year
                </span>
              </div>
            </div>

            {/* Detailed Features List */}
            <ul className="space-y-2 text-xs text-slate-700">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>Full manufacturer 1-year factory warranty on all components</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>Modern Energy Star efficiency: ~12-18% electric bill reduction</span>
              </li>
              <li className="flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>Delivery and scheduling lead time: 3 to 7 business days</span>
              </li>
              <li className="flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>Old unit removal and installation charges often apply</span>
              </li>
            </ul>
          </div>

          <div className="mt-6 pt-3.5 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs font-mono text-slate-600">
              Annual Difference: <strong className={annualSavings > 0 ? 'text-emerald-700' : 'text-amber-700'}>
                {annualSavings > 0 ? `Repair saves $${annualSavings}/yr` : `New saves $${Math.abs(annualSavings)}/yr`}
              </strong>
            </span>
            <button
              onClick={() => onNavigateTab('locator')}
              className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 font-mech uppercase tracking-wider"
            >
              <span>Explore Stores</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

      </div>

      {/* FINAL VERDICT & DECISION RATIONALE */}
      <div className={`rounded-xl border p-6 shadow-xs ${
        calculation.recommendation === 'REPAIR'
          ? 'bg-white border-2 border-emerald-500'
          : calculation.recommendation === 'REPLACE'
          ? 'bg-white border-2 border-amber-500'
          : 'bg-white border-slate-200'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <span className="text-[11px] font-mono text-blue-600 font-bold uppercase tracking-widest block">
              Official FixBeforeBuy Determination
            </span>
            <div className="flex items-center gap-3 mt-1">
              <span className={`text-2xl sm:text-3xl font-extrabold font-mech tracking-tight ${
                calculation.recommendation === 'REPAIR' 
                  ? 'text-emerald-700' 
                  : calculation.recommendation === 'REPLACE' 
                  ? 'text-amber-700' 
                  : 'text-blue-700'
              }`}>
                VERDICT: {calculation.recommendation === 'REPAIR' ? 'REPAIR RECOMMENDED' : calculation.recommendation === 'REPLACE' ? 'REPLACE RECOMMENDED' : 'SEEK SECOND OPINION'}
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[11px] text-slate-500 block font-mono">Net Direct Financial Savings</span>
            <span className="text-2xl sm:text-3xl font-bold font-mono text-emerald-700 tabular-nums">
              Save ~${calculation.savings.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Plain-English Technical Reason */}
        <div className="py-4">
          <h4 className="text-xs font-mono font-bold uppercase text-slate-800 mb-1.5 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-blue-600" />
            Decision Logic & Engineering Analysis:
          </h4>
          <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-200">
            {calculation.primaryReason}
          </p>
        </div>

        {/* 50% Rule Audit Box */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <span className="text-[11px] text-slate-500 block font-semibold">50% Cost Ratio Rule</span>
            <span className="font-mono text-sm font-bold text-slate-900 block mt-0.5">
              {Math.round((repairCost / newApplianceCost) * 100)}% of New Cost
            </span>
            <span className="text-[10px] text-slate-600 mt-0.5 block font-medium">
              {repairCost > newApplianceCost * 0.5 ? '⚠️ Exceeds 50% cost limit' : '✓ Below 50% threshold'}
            </span>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <span className="text-[11px] text-slate-500 block font-semibold">Lifespan Consumed</span>
            <span className="font-mono text-sm font-bold text-blue-700 block mt-0.5">
              {Math.round((currentAge / newApplianceLifespan) * 100)}% ({currentAge}/{newApplianceLifespan} yrs)
            </span>
            <span className="text-[10px] text-slate-600 mt-0.5 block font-medium">
              {currentAge > newApplianceLifespan * 0.5 ? 'Past halfway point' : 'Early in operating life'}
            </span>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <span className="text-[11px] text-slate-500 block font-semibold">Manufacturing Carbon Averted</span>
            <span className="font-mono text-sm font-bold text-emerald-700 block mt-0.5">
              {calculation.carbonSavingsKg} kg CO2e
            </span>
            <span className="text-[10px] text-slate-600 mt-0.5 block font-medium">
              EPA benchmark emission savings
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-600">
            Ready to proceed with this verdict?
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={() => onNavigateTab('locator')}
              className="flex-1 sm:flex-initial px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-lg text-xs font-bold font-mech uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors"
            >
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              <span>Locate Repair Services</span>
            </button>

            <button
              onClick={handleSaveDecision}
              disabled={isSaving || saveSuccess}
              className="flex-1 sm:flex-initial px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors shadow-xs font-mech"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saveSuccess ? 'Saved!' : 'Save to Dashboard'}</span>
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};
