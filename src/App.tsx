import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider, useNotifications } from './context/NotificationContext';
import { Navbar, ActiveTab } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { RepairVsReplaceAnalyzer } from './components/RepairVsReplaceAnalyzer';
import { TroubleshootingWizard } from './components/TroubleshootingWizard';
import { EstimatesView } from './components/EstimatesView';
import { ServiceCenterLocator } from './components/ServiceCenterLocator';
import { FileVault } from './components/FileVault';
import { AuthModal } from './components/AuthModal';
import { NotificationDropdown } from './components/NotificationDropdown';
import { DiagnosticSession, RepairEstimate, ApplianceType } from './types';
import { api } from './services/api';
import { X, Bell, Wrench, ShieldCheck, ArrowRight, Scale } from 'lucide-react';

const AppContent: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { activeToast, dismissToast } = useNotifications();

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState<boolean>(false);

  const [diagnostics, setDiagnostics] = useState<DiagnosticSession[]>([]);
  const [estimates, setEstimates] = useState<RepairEstimate[]>([]);
  const [selectedApplianceForLocator, setSelectedApplianceForLocator] = useState<ApplianceType | undefined>(undefined);

  const loadUserData = useCallback(async () => {
    if (!user) {
      setDiagnostics([]);
      setEstimates([]);
      return;
    }

    try {
      const [diagData, estData] = await Promise.all([
        api.getDiagnostics(),
        api.getEstimates()
      ]);
      setDiagnostics(diagData);
      setEstimates(estData);
    } catch (err) {
      console.warn('Failed to load user diagnostics or estimates', err);
    }
  }, [user]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  return (
    <div className="min-h-screen flex flex-col bg-[#f1f3f7] text-slate-800 font-sans">
      
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNotifications={() => setNotifDropdownOpen(true)}
        onOpenAuth={() => setAuthModalOpen(true)}
      />

      {/* Main View Port */}
      <main className="flex-1 pb-16">
        
        {/* If user is not logged in and on dashboard, show a clean storefront welcome desk banner */}
        {!user && !authLoading && activeTab === 'dashboard' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-5">
            <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-sky-400 shrink-0 shadow-xs">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900 font-mech">
                      FixBeforeBuy · Flagship Mechanical Service Desk
                    </h4>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                      GUEST ACCESS
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                    Test appliance diagnostics, compare repair vs replace economics, or tap 1-Click Pro Demo to inspect certified work orders and file storage.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAuthModalOpen(true)}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold uppercase tracking-wider whitespace-nowrap self-start sm:self-center flex items-center gap-1.5 transition-all shadow-xs font-mech"
              >
                <span>Access Account / Demo</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Tab Router */}
        {activeTab === 'dashboard' && (
          <DashboardView
            diagnostics={diagnostics}
            estimates={estimates}
            onRefreshData={loadUserData}
            onNavigateTab={setActiveTab}
            onOpenAuth={() => setAuthModalOpen(true)}
          />
        )}

        {activeTab === 'analyzer' && (
          <RepairVsReplaceAnalyzer
            onSessionSaved={loadUserData}
            onNavigateTab={setActiveTab}
            onSelectServiceCenterAppliance={(appliance) => setSelectedApplianceForLocator(appliance)}
          />
        )}

        {activeTab === 'wizard' && (
          <TroubleshootingWizard
            onSessionSaved={loadUserData}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'estimates' && (
          <EstimatesView
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'locator' && (
          <ServiceCenterLocator
            onQuoteRequested={loadUserData}
            onNavigateTab={setActiveTab}
            filterAppliance={selectedApplianceForLocator}
          />
        )}

        {activeTab === 'files' && (
          <FileVault onOpenAuth={() => setAuthModalOpen(true)} />
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-xs text-slate-600 text-center font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-slate-700">
            <span className="font-bold text-slate-900 font-mech text-sm">FIXBEFOREBUY</span>
            <span>·</span>
            <span>Mechanical Storefront & Appliance Decision Support</span>
          </div>
          <div className="text-slate-500 text-[11px]">
            Mechanic 50% Rule Standard · Straight-Line Depreciation · Certified Repair Directory
          </div>
        </div>
      </footer>

      {/* Push Notification In-App Toast */}
      {activeToast && (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm bg-slate-900 border border-blue-500/80 rounded-lg p-4 shadow-2xl animate-in slide-in-from-bottom-5 duration-200">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className="p-1.5 bg-blue-600/30 text-sky-400 rounded">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h5 className="text-xs font-bold text-white font-mono">
                  {activeToast.title}
                </h5>
                <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                  {activeToast.message}
                </p>
              </div>
            </div>
            <button
              onClick={dismissToast}
              className="text-slate-400 hover:text-white p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modals & Slideouts */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />

      <NotificationDropdown
        isOpen={notifDropdownOpen}
        onClose={() => setNotifDropdownOpen(false)}
        onNavigateTab={setActiveTab}
      />

    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </AuthProvider>
  );
}
