import React, { useState } from 'react';
import { 
  Wrench, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  AlertTriangle, 
  DollarSign, 
  Leaf, 
  ShieldAlert, 
  Check, 
  HelpCircle,
  Save,
  MapPin,
  Upload
} from 'lucide-react';
import { ApplianceType } from '../types';
import { APPLIANCE_SPECS, calculateRepairOrReplace } from '../utils/calculator';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ActiveTab } from './Navbar';

interface TroubleshootingWizardProps {
  onSessionSaved: () => void;
  onNavigateTab: (tab: ActiveTab) => void;
}

export const TroubleshootingWizard: React.FC<TroubleshootingWizardProps> = ({
  onSessionSaved,
  onNavigateTab
}) => {
  const { user } = useAuth();

  // Wizard state
  const [step, setStep] = useState<number>(1);
  const [applianceType, setApplianceType] = useState<ApplianceType>('refrigerator');
  const [brand, setBrand] = useState<string>('Whirlpool');
  const [modelNumber, setModelNumber] = useState<string>('');
  
  // Financial & Age parameters
  const [ageYears, setAgeYears] = useState<number>(3);
  const [originalPrice, setOriginalPrice] = useState<number>(1200);
  const [estimatedRepairCost, setEstimatedRepairCost] = useState<number>(240);
  const [replacementCost, setReplacementCost] = useState<number>(1250);

  // Symptoms & issue
  const [problemTitle, setProblemTitle] = useState<string>('Not cooling properly / strange buzzing');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [severity, setSeverity] = useState<'low' | 'moderate' | 'critical'>('moderate');

  // File upload during diagnostic
  const [uploadedFileId, setUploadedFileId] = useState<string | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState<boolean>(false);
  const [uploadFileName, setUploadFileName] = useState<string | null>(null);

  // Saving state
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const spec = APPLIANCE_SPECS[applianceType];

  // Quick switch of defaults when appliance changes
  const handleApplianceSelect = (type: ApplianceType) => {
    setApplianceType(type);
    const s = APPLIANCE_SPECS[type];
    setReplacementCost(s.averageReplacementPrice);
    setOriginalPrice(s.averageReplacementPrice);
    setEstimatedRepairCost(Math.round(s.averageReplacementPrice * 0.25));
    setAgeYears(Math.round(s.defaultLifespan * 0.35));
    setSelectedSymptoms([]);
    setProblemTitle(s.commonSymptoms[0] || 'Appliance fault');
  };

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms(prev => 
      prev.includes(symptom) ? prev.filter(s => s !== symptom) : [...prev, symptom]
    );
  };

  // Perform calculations
  const calculation = calculateRepairOrReplace({
    applianceType,
    ageYears,
    originalPrice,
    estimatedRepairCost,
    replacementCost,
    severity
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingFile(true);
    try {
      const res = await api.uploadFile(file, 'damage_photo');
      setUploadedFileId(res.id);
      setUploadFileName(file.name);
    } catch (err: any) {
      alert(err.message || 'File upload failed');
    } finally {
      setIsUploadingFile(false);
    }
  };

  const handleSaveToDashboard = async () => {
    if (!user) {
      alert('Please sign in or use the Demo Account to save your diagnostic session.');
      return;
    }

    setIsSaving(true);
    try {
      await api.createDiagnostic({
        applianceType,
        brand,
        modelNumber: modelNumber || undefined,
        ageYears,
        expectedLifespanYears: spec.defaultLifespan,
        originalPrice,
        estimatedRepairCost,
        replacementCost,
        problemTitle: problemTitle || `${brand} ${spec.label} Issue`,
        symptoms: selectedSymptoms.length > 0 ? selectedSymptoms : [problemTitle],
        severity,
        recommendation: calculation.recommendation,
        recommendationReason: calculation.primaryReason,
        estimatedSavings: calculation.savings,
        carbonSavingsKg: calculation.carbonSavingsKg,
        fiftyPercentRuleTriggered: calculation.fiftyPercentRuleBreached,
        diyChecklist: calculation.diyChecklist,
        attachedFileIds: uploadedFileId ? [uploadedFileId] : []
      });

      setSaveSuccess(true);
      onSessionSaved();
    } catch (err: any) {
      alert(err.message || 'Failed saving diagnostic session');
    } finally {
      setIsSaving(false);
    }
  };

  const applianceOptions: { type: ApplianceType; label: string; icon: string }[] = [
    { type: 'refrigerator', label: 'Refrigerator', icon: '❄️' },
    { type: 'washing_machine', label: 'Washer', icon: '🧺' },
    { type: 'dryer', label: 'Dryer', icon: '🌀' },
    { type: 'dishwasher', label: 'Dishwasher', icon: '🍽️' },
    { type: 'laptop', label: 'Laptop / PC', icon: '💻' },
    { type: 'microwave', label: 'Microwave', icon: '📻' },
    { type: 'hvac_ac', label: 'HVAC / AC', icon: '🌡️' },
    { type: 'oven_range', label: 'Oven & Range', icon: '🔥' },
    { type: 'water_heater', label: 'Water Heater', icon: '⚡' },
    { type: 'television', label: 'Television', icon: '📺' }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs bg-store-grid">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-[11px] font-mono text-blue-700 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Wrench className="w-4 h-4 text-blue-600" />
              <span>Diagnostic Workbench · 50% Rule Engine</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-1 font-mech">
              Appliance Diagnostic & Economic Calibration
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-xl">
              Compare actual repair quotes against new replacement costs, equipment lifespan, and component failure rates.
            </p>
          </div>

          {/* Stepper Progress */}
          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                onClick={() => s < step && setStep(s)}
                className={`flex items-center justify-center w-8 h-8 rounded-lg font-mono text-xs font-bold transition-all ${
                  step === s
                    ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-500/30'
                    : step > s
                    ? 'bg-slate-100 text-blue-700 border border-slate-300 cursor-pointer hover:bg-slate-200'
                    : 'bg-slate-100 text-slate-400 border border-slate-200'
                }`}
              >
                {step > s ? <Check className="w-4 h-4" /> : s}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* STEP 1: Appliance & Brand */}
      {step === 1 && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6 shadow-xs animate-in fade-in duration-150">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-mono">
              01. Select Hardware Type & Manufacturer
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Each appliance category has an industry-standard engineering lifespan and part failure rate.
            </p>
          </div>

          {/* Category Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {applianceOptions.map((item) => (
              <button
                key={item.type}
                type="button"
                onClick={() => handleApplianceSelect(item.type)}
                className={`p-3 rounded-lg border text-left flex flex-col justify-between transition-all ${
                  applianceType === item.type
                    ? 'bg-blue-50/80 border-blue-600 shadow-xs ring-1 ring-blue-600'
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-white'
                }`}
              >
                <span className="text-2xl mb-1">{item.icon}</span>
                <span className="text-xs font-bold text-slate-900 block truncate font-mech">
                  {item.label}
                </span>
                <span className="text-[10px] text-slate-500 font-mono mt-0.5">
                  ~{APPLIANCE_SPECS[item.type].defaultLifespan}y lifespan
                </span>
              </button>
            ))}
          </div>

          {/* Brand & Model Input */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Manufacturer / Brand
              </label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g. Whirlpool, Samsung, LG, Bosch, GE, Apple"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-blue-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Model Number <span className="text-slate-400 font-normal">(Optional, from rating plate)</span>
              </label>
              <input
                type="text"
                value={modelNumber}
                onChange={(e) => setModelNumber(e.target.value)}
                placeholder="e.g. WRF535SWHZ / WF45R6100"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-blue-500 font-mono"
              />
            </div>
          </div>

          {/* Next Button */}
          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider rounded-lg flex items-center gap-2 transition-all shadow-xs font-mech"
            >
              <span>Continue to Financials</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Age & Financial Comparison */}
      {step === 2 && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6 shadow-xs animate-in fade-in duration-150">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-mono">
              02. Appliance Age & Economic Figures
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter current quotes and expected new purchase costs to evaluate the 50% Rule and straight-line depreciation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Age Slider */}
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 font-mech">
                  Current Appliance Age
                </label>
                <span className="text-sm font-mono font-bold text-blue-700">
                  {ageYears} Years Old
                </span>
              </div>

              <input
                type="range"
                min="0.5"
                max={Math.max(16, spec.defaultLifespan + 4)}
                step="0.5"
                value={ageYears}
                onChange={(e) => setAgeYears(parseFloat(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />

              <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                <span>New (0.5y)</span>
                <span>Expected Lifespan: {spec.defaultLifespan} yrs</span>
                <span>End-of-life (15y+)</span>
              </div>

              <div className="text-[11px] text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200 font-mono">
                Lifespan consumed: <strong className="text-slate-900">{Math.round((ageYears / spec.defaultLifespan) * 100)}%</strong>.
                {ageYears >= spec.defaultLifespan * 0.5 ? (
                  <span className="text-amber-700 font-bold ml-1">Past halfway mark.</span>
                ) : (
                  <span className="text-emerald-700 font-bold ml-1">Within first half of lifespan.</span>
                )}
              </div>
            </div>

            {/* Original purchase price */}
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2">
              <label className="block text-xs font-bold text-slate-800 font-mech">
                Original Purchase Price ($)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-slate-500 font-mono">$</span>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 rounded-lg py-2 pl-7 pr-3 text-xs text-slate-900 focus:outline-hidden focus:border-blue-500 font-mono tabular-nums font-bold"
                />
              </div>
              <p className="text-[11px] text-slate-500">
                What you paid when originally purchasing this unit.
              </p>
            </div>

            {/* Estimated Repair Cost */}
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2">
              <label className="block text-xs font-bold text-slate-800 font-mech">
                Estimated Repair Cost ($ Parts + Labor)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-slate-500 font-mono">$</span>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={estimatedRepairCost}
                  onChange={(e) => setEstimatedRepairCost(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 rounded-lg py-2 pl-7 pr-3 text-xs text-slate-900 focus:outline-hidden focus:border-blue-500 font-mono tabular-nums font-bold"
                />
              </div>
              <p className="text-[11px] text-slate-500">
                Diagnostic fee, replacement component, and technician labor.
              </p>
            </div>

            {/* Replacement Cost */}
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2">
              <label className="block text-xs font-bold text-slate-800 font-mech">
                Equivalent New Replacement Price ($)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-slate-500 font-mono">$</span>
                <input
                  type="number"
                  min="50"
                  step="25"
                  value={replacementCost}
                  onChange={(e) => setReplacementCost(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 rounded-lg py-2 pl-7 pr-3 text-xs text-slate-900 focus:outline-hidden focus:border-blue-500 font-mono tabular-nums font-bold"
                />
              </div>
              <p className="text-[11px] text-slate-500">
                Price for a modern equivalent new model in store.
              </p>
            </div>

          </div>

          {/* Quick ratio preview badge */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
            <span className="text-slate-600">
              Repair is <strong className="text-slate-900 font-mono">{Math.round((estimatedRepairCost / (replacementCost || 1)) * 100)}%</strong> of replacement cost
            </span>
            <span className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded ${
              estimatedRepairCost > replacementCost * 0.5 ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
            }`}>
              {estimatedRepairCost > replacementCost * 0.5 ? '⚠️ 50% Rule Threshold Reached' : '✓ Below 50% Threshold'}
            </span>
          </div>

          <div className="pt-3 flex items-center justify-between border-t border-slate-100">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 transition-colors font-mech"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider rounded-lg flex items-center gap-2 transition-all shadow-xs font-mech"
            >
              <span>Continue to Symptoms</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Symptoms & File Attachments */}
      {step === 3 && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6 shadow-xs animate-in fade-in duration-150">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-mono">
              03. Fault Symptoms & Evidence Upload
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select recurring symptoms for your {spec.label} or upload error code photos.
            </p>
          </div>

          {/* Common Symptoms Checklist */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-2 font-mech">
              Common Mechanical Failure Indicators
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {spec.commonSymptoms.map((symptom) => {
                const isSelected = selectedSymptoms.includes(symptom);
                return (
                  <div
                    key={symptom}
                    onClick={() => toggleSymptom(symptom)}
                    className={`p-2.5 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-blue-50/80 border-blue-600 text-blue-900 font-medium'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:text-slate-900 hover:border-slate-300 hover:bg-white'
                    }`}
                  >
                    <span className="leading-snug pr-2">{symptom}</span>
                    <div className={`w-4 h-4 rounded shrink-0 flex items-center justify-center border ${
                      isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'
                    }`}>
                      {isSelected && <Check className="w-3 h-3" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Problem description */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1 font-mech">
              Problem Description / Error Code Displayed
            </label>
            <input
              type="text"
              value={problemTitle}
              onChange={(e) => setProblemTitle(e.target.value)}
              placeholder="e.g. Code F21 / Leaking water during rinse cycle"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-blue-500 font-medium"
            />
          </div>

          {/* Severity selector */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5 font-mech">
              Operational Severity
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'low', label: 'Minor / Cosmetic', desc: 'Runs, minor annoyance' },
                { id: 'moderate', label: 'Moderate / Intermittent', desc: 'Cycles fail or noisy' },
                { id: 'critical', label: 'Critical / Inoperable', desc: 'Dead, leak, safety hazard' }
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSeverity(s.id as any)}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    severity === s.id
                      ? 'bg-blue-50/80 border-blue-600 ring-1 ring-blue-600'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-white'
                  }`}
                >
                  <span className="text-xs font-bold text-slate-900 block font-mech">{s.label}</span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">{s.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* File Attachment / Photo Upload */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 font-mech">
                <Upload className="w-3.5 h-3.5 text-blue-600" />
                Attach Photo of Damage or Technician Invoice (Optional)
              </label>
              {uploadedFileId && (
                <span className="text-[11px] font-mono text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Attached
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileUpload}
                disabled={isUploadingFile}
                className="text-xs text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-slate-200 file:text-slate-800 hover:file:bg-slate-300 cursor-pointer"
              />
              {uploadFileName && (
                <span className="text-xs font-mono text-slate-600 truncate max-w-xs">
                  {uploadFileName}
                </span>
              )}
            </div>
          </div>

          <div className="pt-3 flex items-center justify-between border-t border-slate-100">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 transition-colors font-mech"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
            <button
              type="button"
              onClick={() => setStep(4)}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider rounded-lg flex items-center gap-2 transition-all shadow-xs font-mech"
            >
              <span>Generate Decision Matrix</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Decision Analysis Report */}
      {step === 4 && (
        <div className="space-y-6 animate-in fade-in duration-150">
          
          {/* Main Verdict Card */}
          <div className={`rounded-xl border p-6 shadow-xs ${
            calculation.recommendation === 'REPAIR'
              ? 'bg-white border-2 border-emerald-500 ring-2 ring-emerald-500/20'
              : calculation.recommendation === 'REPLACE'
              ? 'bg-white border-2 border-amber-500 ring-2 ring-amber-500/20'
              : 'bg-white border-slate-200'
          }`}>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-widest text-blue-700 font-bold">
                  Official Technical Determination
                </span>
                <div className="flex items-center gap-3 mt-1">
                  <span className={`text-2xl sm:text-3xl font-extrabold tracking-tight font-mech ${
                    calculation.recommendation === 'REPAIR'
                      ? 'text-emerald-700'
                      : calculation.recommendation === 'REPLACE'
                      ? 'text-amber-700'
                      : 'text-blue-700'
                  }`}>
                    {calculation.recommendation === 'REPAIR' && 'RECOMMENDED: REPAIR'}
                    {calculation.recommendation === 'REPLACE' && 'RECOMMENDED: REPLACE'}
                    {calculation.recommendation === 'CONSULT_PRO' && 'RECOMMENDED: SECOND OPINION'}
                  </span>
                  
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 border border-slate-300 text-slate-800">
                    Confidence: {calculation.confidenceScore}%
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[11px] text-slate-500 block font-semibold">Estimated Financial Impact</span>
                <span className="text-xl sm:text-2xl font-extrabold font-mono tabular-nums text-emerald-700 flex items-center justify-end gap-1">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                  Save ~${calculation.savings.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Explanation Prose */}
            <div className="py-4">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800 mb-1.5">
                Diagnostic Analysis & Economic Rationale:
              </h3>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-200">
                {calculation.primaryReason}
              </p>
            </div>

            {/* Key Diagnostic Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-lg">
                <span className="text-[11px] text-slate-500 font-semibold block">50% Rule Status</span>
                <span className={`text-xs font-mono font-bold mt-1 block ${
                  calculation.fiftyPercentRuleBreached ? 'text-amber-700' : 'text-emerald-700'
                }`}>
                  {calculation.fiftyPercentRuleBreached ? 'BREACHED' : 'PASSED'}
                </span>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-lg">
                <span className="text-[11px] text-slate-500 font-semibold block">Current Equipment Value</span>
                <span className="text-xs font-mono font-bold text-slate-900 mt-1 block tabular-nums">
                  ${calculation.currentEstimatedValue}
                </span>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-lg">
                <span className="text-[11px] text-slate-500 font-semibold block">Lifespan Consumed</span>
                <span className="text-xs font-mono font-bold text-blue-700 mt-1 block tabular-nums">
                  {Math.round(calculation.ageRatio * 100)}% ({ageYears}/{spec.defaultLifespan} yrs)
                </span>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-lg">
                <span className="text-[11px] text-slate-500 font-semibold block">CO2e Emissions Prevented</span>
                <span className="text-xs font-mono font-bold text-emerald-700 mt-1 flex items-center gap-1 tabular-nums">
                  <Leaf className="w-3.5 h-3.5" />
                  {calculation.carbonSavingsKg} kg
                </span>
              </div>
            </div>

          </div>

          {/* Pre-Technician DIY Checklist */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <ShieldAlert className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-mono">
                Verify Before Paying a Technician (DIY Checks for {spec.label})
              </h3>
            </div>
            
            <div className="space-y-2">
              {calculation.diyChecklist.map((tip, idx) => (
                <div 
                  key={idx}
                  className="flex items-start gap-2.5 text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200"
                >
                  <span className="font-mono text-blue-700 font-bold shrink-0">{idx + 1}.</span>
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Footer */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 order-2 sm:order-1 transition-colors font-mech"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Modify Parameters</span>
            </button>

            <div className="flex items-center gap-3 order-1 sm:order-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => onNavigateTab('locator')}
                className="flex-1 sm:flex-initial px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors font-mech uppercase tracking-wider"
              >
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                <span>Find Certified Centers</span>
              </button>

              <button
                type="button"
                onClick={handleSaveToDashboard}
                disabled={isSaving || saveSuccess}
                className="flex-1 sm:flex-initial px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-xs font-mech"
              >
                <Save className="w-4 h-4" />
                <span>{saveSuccess ? 'Saved to Dashboard!' : isSaving ? 'Saving...' : 'Save Diagnostic'}</span>
              </button>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
