import { Wallet, Transaction } from '../types';
import { isWalletMatch, calculateWalletBalance } from './balanceHelper';

export interface WalletMutation {
  id: string;
  transactionId: string;
  walletId: string;
  walletName: string;
  date: string;
  description: string;
  type: 'debit' | 'kredit';
  debitAmount: number;
  kreditAmount: number;
  runningBalance: number;
  category: string;
  subcategory?: string;
  paidBy?: string;
}

export interface WalletMutationSummary {
  walletId: string;
  walletName: string;
  currentBalance: number;
  totalDebit: number;
  totalKredit: number;
  mutations: WalletMutation[];
}

/**
 * Calculates Debit & Kredit mutations, running balance, and totals for a given wallet.
 */
export function calculateWalletMutations(
  wallet: Wallet,
  allTransactions: Transaction[],
  allWallets: Wallet[]
): WalletMutationSummary {
  // Find all transactions relevant to this wallet
  const relevantTxs = allTransactions.filter(tx => {
    const isSource = isWalletMatch(tx.walletId, wallet) || isWalletMatch((tx as any).dari, wallet) || isWalletMatch((tx as any).account, wallet);
    const isTarget = isWalletMatch(tx.targetWalletId, wallet) || isWalletMatch((tx as any).ke, wallet);
    return isSource || isTarget;
  });

  // Sort chronologically ascending (oldest first)
  relevantTxs.sort((a, b) => {
    const timeA = new Date(a.date || a.createdAt).getTime();
    const timeB = new Date(b.date || b.createdAt).getTime();
    if (timeA !== timeB) return timeA - timeB;
    return (a.createdAt || '').localeCompare(b.createdAt || '');
  });

  let totalDebit = 0;
  let totalKredit = 0;
  const rawMutations: Omit<WalletMutation, 'runningBalance'>[] = [];

  for (const tx of relevantTxs) {
    const isTransfer = tx.type === 'transfer';
    const isTargetOfTransfer = isTransfer && tx.targetWalletId === wallet.id;

    if (tx.type === 'expense' || (isTransfer && tx.walletId === wallet.id && !isTargetOfTransfer)) {
      // Debit (Pengeluaran / Transfer Keluar)
      let targetName = '';
      if (isTransfer) {
        const targetW = allWallets.find(w => w.id === tx.targetWalletId);
        targetName = targetW ? targetW.name : 'Dompet Lain';
      }

      const desc = isTransfer
        ? (tx.note || `Transfer ke ${targetName}`)
        : tx.title;

      totalDebit += tx.amount;
      rawMutations.push({
        id: `mut-${tx.id}-dr`,
        transactionId: tx.id,
        walletId: wallet.id,
        walletName: wallet.name,
        date: tx.date || (tx.createdAt ? tx.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]),
        description: desc,
        type: 'debit',
        debitAmount: tx.amount,
        kreditAmount: 0,
        category: tx.category || 'Transfer Keluar',
        subcategory: tx.subcategory,
        paidBy: (tx as any).paid_by || (tx as any).paidBy
      });
    } else if (tx.type === 'income' || isTargetOfTransfer) {
      // Kredit (Pemasukan / Transfer Masuk)
      let sourceName = '';
      if (isTransfer) {
        const sourceW = allWallets.find(w => w.id === tx.walletId);
        sourceName = sourceW ? sourceW.name : 'Dompet Lain';
      }

      const desc = isTransfer
        ? (tx.note || `Transfer dari ${sourceName}`)
        : tx.title;

      totalKredit += tx.amount;
      rawMutations.push({
        id: `mut-${tx.id}-cr`,
        transactionId: tx.id,
        walletId: wallet.id,
        walletName: wallet.name,
        date: tx.date || (tx.createdAt ? tx.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]),
        description: desc,
        type: 'kredit',
        debitAmount: 0,
        kreditAmount: tx.amount,
        category: tx.category || 'Transfer Masuk',
        subcategory: tx.subcategory,
        paidBy: (tx as any).paid_by || (tx as any).paidBy
      });
    }
  }

  // Calculate starting balance before these transactions
  const netChange = totalKredit - totalDebit;
  const startingBalance = wallet.balance - netChange;

  let currentRunning = startingBalance;
  const mutations: WalletMutation[] = rawMutations.map(m => {
    if (m.type === 'debit') {
      currentRunning -= m.debitAmount;
    } else {
      currentRunning += m.kreditAmount;
    }
    return {
      ...m,
      runningBalance: currentRunning
    };
  });

  return {
    walletId: wallet.id,
    walletName: wallet.name,
    currentBalance: wallet.balance,
    totalDebit,
    totalKredit,
    mutations
  };
}
