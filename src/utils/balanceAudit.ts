import { StorageService } from '../services/storage';
import { recalculateAllWalletBalances } from './balanceHelper';
import { Wallet, Transaction } from '../types';

/**
 * Audits wallet balances by recalculating balances from all transactions and
 * comparing them against the stored wallet balance.
 *
 * Returns an array of mismatched wallets with details.
 */
export function auditWalletBalances(): {
  walletId: string;
  walletName: string;
  storedBalance: number;
  calculatedBalance: number;
  diff: number;
}[] {
  const wallets: Wallet[] = StorageService.getWallets();
  const transactions: Transaction[] = StorageService.getTransactions();

  const calculatedWallets = recalculateAllWalletBalances(wallets, transactions);

  const mismatches = [] as {
    walletId: string;
    walletName: string;
    storedBalance: number;
    calculatedBalance: number;
    diff: number;
  }[];

  for (const w of wallets) {
    const calc = calculatedWallets.find(c => c.id === w.id);
    if (!calc) continue;
    const diff = calc.balance - w.balance;
    if (Math.abs(diff) > 0.01) { // tolerance for floating point
      mismatches.push({
        walletId: w.id,
        walletName: w.name,
        storedBalance: w.balance,
        calculatedBalance: calc.balance,
        diff,
      });
    }
  }

  return mismatches;
}
