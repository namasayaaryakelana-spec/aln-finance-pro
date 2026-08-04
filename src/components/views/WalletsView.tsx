import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  Wallet as WalletIcon,
  Coins,
  Building2,
  Landmark,
  Smartphone,
  Banknote,
  CreditCard,
  Plus,
  ArrowRightLeft,
  Trash2,
  Edit3
} from 'lucide-react';
import { Wallet, WalletType, Currency } from '../../types';

interface WalletsViewProps {
  openTransferModal: () => void;
  openAddWalletModal: () => void;
}

export const WalletsView: React.FC<WalletsViewProps> = ({
  openTransferModal,
  openAddWalletModal
}) => {
  const { filteredWallets, deleteWallet, totalBalance, totalInvestment, totalAssets } = useFinance();
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);

  const getWalletIcon = (type: WalletType) => {
    switch (type) {
      case 'bank':
        return Landmark;
      case 'ewallet':
        return Smartphone;
      case 'cash':
        return Banknote;
      case 'credit':
        return CreditCard;
      default:
        return Building2;
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Banner Overview */}
      <div className="bg-gradient-to-r from-slate-900 via-[#0D1527] to-slate-950 p-6 rounded-3xl border border-slate-800/80 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <WalletIcon className="w-4 h-4" />
            Kas Likuid Multi-Dompet
          </span>
          <h2 className="text-3xl font-extrabold text-white mt-1">
            Rp {totalBalance.toLocaleString('id-ID')}
          </h2>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-slate-400">
              {filteredWallets.length} Akun Terdaftar (Bank, E-Wallet, Kas Tunai & Kredit)
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-amber-300 font-semibold flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
              <Coins className="w-3 h-3" /> Investasi: Rp {totalInvestment.toLocaleString('id-ID')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={openTransferModal}
            className="px-4 py-2.5 rounded-2xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 text-xs font-bold flex items-center gap-2 shadow-md transition-all active:scale-95"
          >
            <ArrowRightLeft className="w-4 h-4" />
            Transfer Antar Akun
          </button>

          <button
            onClick={openAddWalletModal}
            className="px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-950/40 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            Tambah Akun
          </button>
        </div>
      </div>

      {/* Wallet Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredWallets.map(w => {
          const Icon = getWalletIcon(w.type);
          return (
            <div
              key={w.id}
              className="bg-slate-900/90 p-5 rounded-3xl border border-slate-800/80 hover:border-slate-700 transition-all shadow-xl relative overflow-hidden flex flex-col justify-between group"
            >
              <div
                className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl pointer-events-none opacity-20"
                style={{ backgroundColor: w.color }}
              />

              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-md"
                      style={{ backgroundColor: w.color }}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-white">{w.name}</h4>
                      <span className="text-[10px] text-slate-400 font-mono uppercase">
                        {w.accountNumber || w.type}
                      </span>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-slate-800 text-slate-300 border border-slate-700">
                    {w.scope}
                  </span>
                </div>

                <div className="mt-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Saldo Real-time
                  </span>
                  <div className="text-xl font-extrabold text-white mt-0.5">
                    {w.currency} {w.balance.toLocaleString('id-ID')}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-[10px] text-slate-400">
                  {w.isDefault ? '⭐ Akun Utama' : 'Akun Sekunder'}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => deleteWallet(w.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                    title="Hapus Dompet"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
