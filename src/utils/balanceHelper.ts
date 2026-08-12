import { Wallet, Transaction } from '../types';

export const CANONICAL_WALLETS = [
  'BCA',
  'JAGO',
  'BNI LANA',
  'BNI LINA',
  'GOPAY',
  'BPD DIY',
  'BRI',
  'CASH'
];

/**
 * Safely extracts wallet account number supporting both `accountNumber` and `account_number` field formats.
 * Priority: 1. wallet.accountNumber, 2. wallet.account_number, 3. canonical fallback if master wallet.
 */
export function getWalletAccountNumber(wallet: any): string {
  if (!wallet) return '';
  const val =
    wallet.accountNumber ??
    wallet.account_number ??
    wallet.accountNo ??
    wallet.account_no ??
    '';

  const trimmed = String(val).trim();
  if (trimmed) return trimmed;

  // Fallback to master wallet canonical account number if available
  const canonical = getCanonicalAccountNumber(wallet.id, wallet.name);
  return canonical || '';
}

/**
 * Canonical default account numbers for master wallets (fallback if empty in DB/storage).
 */
export function getCanonicalAccountNumber(walletId?: string, walletName?: string): string | undefined {
  if (!walletId && !walletName) return undefined;
  const id = (walletId || '').toLowerCase();
  const name = (walletName || '').toLowerCase();

  // CASH explicitly has no account number
  if (id === 'w-4' || id === 'w-cash' || name === 'cash' || name.includes('kas tunai') || name === 'kas') {
    return undefined;
  }

  if (id === 'w-1' || id === 'w-bca' || name.includes('bca') || name.includes('mandiri')) return '8830192841';
  if (id === 'w-3' || id === 'w-jago' || name.includes('jago')) return '1420018294021';
  if (id === 'w-2' || id === 'w-gopay' || name.includes('gopay')) return '081298765432';
  if (id === 'w-bni-lina' || name.includes('bni lina') || name.includes('bnilina')) return '9912048201';
  if (id === 'w-bni-lana' || name.includes('bni lana') || name.includes('bnilana')) return '9912048202';
  if (id === 'w-bpd' || name.includes('bpd')) return '5501928401';
  if (id === 'w-bri' || name.includes('bri')) return '7712049281';
  if (id === 'w-5' || name.includes('kredit') || name.includes('credit')) return '4181 **** **** 9012';

  return undefined;
}

/**
 * Safely merges local & cloud wallet while preserving accountNumber under rules A-D.
 */
export function mergeWalletPreservingAccountNumber(localW: Partial<Wallet>, cloudW: Partial<Wallet>): Wallet {
  const localAcc = getWalletAccountNumber(localW);
  const cloudAcc = getWalletAccountNumber(cloudW);

  let finalAcc = '';
  // Rule A: If Cloud has accountNumber and Local empty -> use Cloud
  if (cloudAcc && !localAcc) {
    finalAcc = cloudAcc;
  }
  // Rule B: If Local has accountNumber and Cloud empty -> preserve Local
  else if (localAcc && !cloudAcc) {
    finalAcc = localAcc;
  }
  // Rule C: If both have accountNumber -> use local / latest
  else if (localAcc && cloudAcc) {
    finalAcc = localAcc;
  }
  // Rule D: Both empty -> check canonical fallback by wallet ID/name
  else {
    finalAcc = getCanonicalAccountNumber(localW.id || cloudW.id, localW.name || cloudW.name) || '';
  }

  const merged = {
    ...cloudW,
    ...localW,
    accountNumber: finalAcc
  } as Wallet;

  return merged;
}



/**
 * Normalizes transaction type string to standard enum ('income' | 'expense' | 'transfer').
 */
export function normalizeTransactionType(type: string | undefined | null): 'income' | 'expense' | 'transfer' {
  if (!type) return 'expense';
  const t = String(type).trim().toLowerCase();
  if (t === 'income' || t === 'pemasukan' || t === 'masuk') return 'income';
  if (t === 'transfer' || t === 'pindahan' || t === 'mutasi') return 'transfer';
  return 'expense';
}

/**
 * Resolves legacy string names/aliases to canonical Wallet ID for backward compatibility.
 */
export function resolveWalletId(identifier: string | undefined | null, wallets: Wallet[]): string {
  if (!identifier) return '';
  const q = String(identifier).trim().toLowerCase();

  // 1. Direct Wallet ID match
  const directW = wallets.find(w => w.id.toLowerCase() === q);
  if (directW) return directW.id;

  // 2. Direct Wallet Name match
  const nameW = wallets.find(w => w.name.toLowerCase() === q);
  if (nameW) return nameW.id;

  // 3. Legacy Name Resolver mapping to wallet IDs
  if (q.includes('gopay') || q.includes('go-pay') || q === 'w-2') {
    const gW = wallets.find(w => w.id === 'w-2' || w.name.toLowerCase().includes('gopay'));
    if (gW) return gW.id;
  }
  if (q.includes('cash') || q.includes('tunai') || q.includes('kas') || q === 'w-4') {
    const cW = wallets.find(w => w.id === 'w-4' || w.name.toLowerCase().includes('cash') || w.name.toLowerCase().includes('tunai'));
    if (cW) return cW.id;
  }
  if (q.includes('jago') || q === 'w-3') {
    const jW = wallets.find(w => w.id === 'w-3' || w.name.toLowerCase().includes('jago'));
    if (jW) return jW.id;
  }
  if (q.includes('bca') || q === 'w-1') {
    const bW = wallets.find(w => w.id === 'w-1' || w.name.toLowerCase().includes('bca') || w.name.toLowerCase().includes('mandiri'));
    if (bW) return bW.id;
  }
  if (q.includes('bni lina') || q.includes('bnilina') || q === 'w-bni-lina') {
    const lW = wallets.find(w => w.id === 'w-bni-lina' || w.name.toLowerCase().includes('bni lina'));
    if (lW) return lW.id;
  }
  if (q.includes('bni lana') || q.includes('bnilana') || q === 'w-bni-lana') {
    const aW = wallets.find(w => w.id === 'w-bni-lana' || w.name.toLowerCase().includes('bni lana'));
    if (aW) return aW.id;
  }

  return identifier;
}

/**
 * Checks whether a given identifier (ID, Name, or Alias) matches a target Wallet.
 */
export function isWalletMatch(
  identifier: string | undefined | null,
  wallet: Wallet
): boolean {
  if (!identifier || !wallet) return false;
  const resolvedId = resolveWalletId(identifier, [wallet]);
  return resolvedId === wallet.id || resolvedId.toLowerCase() === wallet.id.toLowerCase();
}

/**
 * Single authoritative wallet balance calculation engine using WALLET ID as Single Source of Truth.
 *
 * Rules:
 * Income: Target Wallet (Ke) += Amount
 * Expense: Source Wallet (Dari) -= Amount
 * Transfer: Source Wallet (Dari) -= Amount, Target Wallet (Ke) += Amount
 */
export function calculateWalletBalance(
  wallet: Wallet,
  transactions: Transaction[],
  initialBalanceMap?: { [walletId: string]: number }
): number {
  const baseBalance = initialBalanceMap && initialBalanceMap[wallet.id] !== undefined
    ? initialBalanceMap[wallet.id]
    : (wallet.initialBalance !== undefined ? wallet.initialBalance : 0);

  let netBalance = baseBalance;

  for (const tx of transactions) {
    const amount = Math.abs(tx.amount || 0);
    const type = normalizeTransactionType(tx.type);

    const sourceWalletRef = tx.walletId || (tx as any).dari || (tx as any).fromWallet || (tx as any).account;
    const targetWalletRef = tx.targetWalletId || (tx as any).ke || (tx as any).toWallet || (tx as any).targetWallet;

    const isSource = sourceWalletRef === wallet.id || resolveWalletId(sourceWalletRef, [wallet]) === wallet.id;
    const isTarget = targetWalletRef === wallet.id || resolveWalletId(targetWalletRef, [wallet]) === wallet.id;

    if (type === 'income') {
      if (isTarget || isSource) {
        netBalance += amount;
      }
    } else if (type === 'expense') {
      if (isSource) {
        netBalance -= amount;
      }
    } else if (type === 'transfer') {
      if (isSource && !isTarget) {
        netBalance -= amount;
      } else if (isTarget && !isSource) {
        netBalance += amount;
      }
    }
  }

  return netBalance;
}

/**
 * Recalculates balance for all wallets dynamically from transaction history.
 */
export function recalculateAllWalletBalances(
  wallets: Wallet[],
  transactions: Transaction[],
  initialBalanceMap?: { [walletId: string]: number }
): Wallet[] {
  return wallets.map(w => {
    const updatedBalance = calculateWalletBalance(w, transactions, initialBalanceMap);
    return {
      ...w,
      balance: updatedBalance
    };
  });
}

/**
 * Repairs & Migrates imported/stored transaction records to ensure
 * transfers contain both walletId (fromWallet / Dari) and targetWalletId (toWallet / Ke).
 */
export function repairAndMigrateTransactions(
  transactions: Transaction[],
  wallets: Wallet[]
): Transaction[] {
  if (!transactions || !Array.isArray(transactions)) return [];

  return transactions.map(tx => {
    const type = (tx.type || '').toLowerCase();
    let category = tx.category || '';
    let subcategory = tx.subcategory || '';

    let fromRef = tx.walletId || (tx as any).dari || (tx as any).fromWallet || (tx as any).account;
    let toRef = tx.targetWalletId || (tx as any).ke || (tx as any).toWallet || (tx as any).targetWallet;

    const isTransfer = type === 'transfer' || /transfer/i.test(category) || /transfer/i.test(tx.title);

    if (isTransfer) {
      if (!toRef && tx.title) {
        const matchArrow = tx.title.match(/transfer\s+(.+?)\s*(?:➔|->|ke)\s*(.+)/i);
        if (matchArrow) {
          if (!fromRef) fromRef = matchArrow[1].trim();
          toRef = matchArrow[2].trim();
        } else {
          const matchKe = tx.title.match(/transfer\s+(?:ke\s+)?(.+)/i);
          if (matchKe && !toRef) {
            toRef = matchKe[1].trim();
          }
        }
      }
    }

    const sourceW = wallets.find(w => isWalletMatch(fromRef, w));
    const targetW = wallets.find(w => isWalletMatch(toRef, w));

    const resolvedWalletId = sourceW ? sourceW.id : (fromRef || (wallets[0]?.id || 'w-cash'));
    const resolvedTargetWalletId = isTransfer ? (targetW ? targetW.id : (toRef || undefined)) : undefined;

    return {
      ...tx,
      type: isTransfer ? 'transfer' : (type === 'income' ? 'income' : 'expense'),
      walletId: resolvedWalletId,
      targetWalletId: resolvedTargetWalletId,
      category: isTransfer ? 'Transfer Antar Wallet' : category,
      subcategory: isTransfer ? 'Transfer Antar Wallet' : subcategory
    };
  });
}
