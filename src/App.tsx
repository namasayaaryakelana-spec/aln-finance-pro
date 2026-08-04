import React, { useState, useEffect } from 'react';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { SplashScreen } from './components/layout/SplashScreen';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { MobileNav } from './components/layout/MobileNav';
import { OfflineNotifier } from './components/layout/OfflineNotifier';
import { PWAInstallPrompt } from './components/layout/PWAInstallPrompt';

import { DashboardView } from './components/views/DashboardView';
import { WalletsView } from './components/views/WalletsView';
import { InvestmentsView } from './components/views/InvestmentsView';
import { TransactionsView } from './components/views/TransactionsView';
import { ReportsView } from './components/views/ReportsView';
import { AIAdvisorView } from './components/views/AIAdvisorView';
import { PlanningView } from './components/views/PlanningView';
import { BusinessToolsView } from './components/views/BusinessToolsView';
import { SettingsView } from './components/views/SettingsView';

import { AddTransactionModal } from './components/modals/AddTransactionModal';
import { FastAITransactionModal } from './components/modals/FastAITransactionModal';
import { AddWalletModal } from './components/modals/AddWalletModal';
import { TransferModal } from './components/modals/TransferModal';
import { AddBudgetModal } from './components/modals/AddBudgetModal';
import { AddGoalModal } from './components/modals/AddGoalModal';
import { AddDebtModal } from './components/modals/AddDebtModal';
import { AddInvoiceModal } from './components/modals/AddInvoiceModal';
import { CategoryMasterModal } from './components/modals/CategoryMasterModal';
import { NotificationModal } from './components/modals/NotificationModal';
import { Invoice } from './types';

const AppContent: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Modals state
  const [isAddTxOpen, setIsAddTxOpen] = useState(false);
  const [isFastAITxOpen, setIsFastAITxOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isAddWalletOpen, setIsAddWalletOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isAddBudgetOpen, setIsAddBudgetOpen] = useState(false);
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [isAddDebtOpen, setIsAddDebtOpen] = useState(false);
  const [isAddInvoiceOpen, setIsAddInvoiceOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);

  // PWA Deferred Prompt event state
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const triggerPwaInstall = () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult: any) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted PWA install');
      }
      setDeferredPrompt(null);
    });
  };

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  return (
    <div className="min-h-screen ambient-mesh text-slate-100 flex flex-col antialiased selection:bg-emerald-500 selection:text-slate-950 font-sans">
      {/* Toast Notifier */}
      <OfflineNotifier />

      {/* Desktop Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openAddTxModal={() => setIsAddTxOpen(true)}
      />

      {/* Main Content Layout */}
      <div className="lg:pl-64 flex-1 flex flex-col min-h-screen">
        <Header
          activeTab={activeTab}
          openAddTxModal={() => setIsAddTxOpen(true)}
          openFastAITxModal={() => setIsFastAITxOpen(true)}
          openNotificationModal={() => setIsNotificationOpen(true)}
          pwaPromptEvent={deferredPrompt}
          triggerPwaInstall={triggerPwaInstall}
        />

        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              openAddTxModal={() => setIsAddTxOpen(true)}
              openFastAITxModal={() => setIsFastAITxOpen(true)}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'wallets' && (
            <WalletsView
              openTransferModal={() => setIsTransferOpen(true)}
              openAddWalletModal={() => setIsAddWalletOpen(true)}
            />
          )}

          {activeTab === 'investments' && <InvestmentsView />}

          {activeTab === 'transactions' && (
            <TransactionsView
              openAddTxModal={() => setIsAddTxOpen(true)}
              openFastAITxModal={() => setIsFastAITxOpen(true)}
              openCategoryModal={() => setIsCategoryOpen(true)}
            />
          )}

          {activeTab === 'reports' && <ReportsView />}

          {activeTab === 'ai_advisor' && <AIAdvisorView />}

          {activeTab === 'planning' && (
            <PlanningView
              openAddBudgetModal={() => setIsAddBudgetOpen(true)}
              openAddGoalModal={() => setIsAddGoalOpen(true)}
              openAddDebtModal={() => setIsAddDebtOpen(true)}
            />
          )}

          {activeTab === 'business_tools' && (
            <BusinessToolsView
              openAddInvoiceModal={() => {
                setEditingInvoice(null);
                setIsAddInvoiceOpen(true);
              }}
              openEditInvoiceModal={(inv) => {
                setEditingInvoice(inv);
                setIsAddInvoiceOpen(true);
              }}
            />
          )}

          {activeTab === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openAddTxModal={() => setIsAddTxOpen(true)}
      />

      {/* PWA Installation Prompt Banner */}
      <PWAInstallPrompt deferredPrompt={deferredPrompt} onInstall={triggerPwaInstall} />

      {/* MODALS */}
      <AddTransactionModal isOpen={isAddTxOpen} onClose={() => setIsAddTxOpen(false)} />
      <FastAITransactionModal isOpen={isFastAITxOpen} onClose={() => setIsFastAITxOpen(false)} />
      <AddWalletModal isOpen={isAddWalletOpen} onClose={() => setIsAddWalletOpen(false)} />
      <TransferModal isOpen={isTransferOpen} onClose={() => setIsTransferOpen(false)} />
      <AddBudgetModal isOpen={isAddBudgetOpen} onClose={() => setIsAddBudgetOpen(false)} />
      <AddGoalModal isOpen={isAddGoalOpen} onClose={() => setIsAddGoalOpen(false)} />
      <AddDebtModal isOpen={isAddDebtOpen} onClose={() => setIsAddDebtOpen(false)} />
      <AddInvoiceModal
        isOpen={isAddInvoiceOpen}
        onClose={() => {
          setIsAddInvoiceOpen(false);
          setEditingInvoice(null);
        }}
        editingInvoice={editingInvoice}
      />
      <CategoryMasterModal isOpen={isCategoryOpen} onClose={() => setIsCategoryOpen(false)} />
      <NotificationModal
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        setActiveTab={setActiveTab}
      />
    </div>
  );
};

export function App() {
  return (
    <FinanceProvider>
      <AppContent />
    </FinanceProvider>
  );
}

export default App;
