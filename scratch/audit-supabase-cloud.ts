import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import { initialTransactions, initialWallets, initialCategories } from '../src/data/initialData';

console.log("==================================================");
console.log("=== SUPABASE CLOUD MULTI-BROWSER SYNC AUDIT ===");
console.log("==================================================");

const envUrl = "https://wbcnftfzftgbpndsinfm.supabase.co";
const envKey = "sb_publishable_ggV6Bqh6GS7mlf-3A5e7-A_ksydvRaY";

const supabase = createClient(envUrl, envKey);

async function runAudit() {
  console.log("\n--- AUDITING SUPABASE CLOUD TABLES ---");

  // Query transactions table
  const { data: txs, error: txError, count: txCount } = await supabase
    .from('transactions')
    .select('*', { count: 'exact' });

  // Query wallets table
  const { data: wallets, error: wError, count: wCount } = await supabase
    .from('wallets')
    .select('*', { count: 'exact' });

  // Query categories table
  const { data: categories, error: cError, count: cCount } = await supabase
    .from('categories')
    .select('*', { count: 'exact' });

  console.log(`LOCAL PRIMARY BROWSER / INITIAL DATA:`);
  console.log(`- Local Transactions : ${initialTransactions.length}`);
  console.log(`- Local Wallets      : ${initialWallets.length}`);
  console.log(`- Local Categories   : ${initialCategories.length}`);

  console.log(`\nSUPABASE CLOUD LIVE DATA:`);
  console.log(`- Cloud Transactions : ${txCount ?? (txs ? txs.length : 0)} (Error: ${txError ? txError.message : 'NONE'})`);
  console.log(`- Cloud Wallets      : ${wCount ?? (wallets ? wallets.length : 0)} (Error: ${wError ? wError.message : 'NONE'})`);
  console.log(`- Cloud Categories   : ${cCount ?? (categories ? categories.length : 0)} (Error: ${cError ? cError.message : 'NONE'})`);

  const missingCloudTxs = initialTransactions.length - (txs ? txs.length : 0);
  const missingCloudWallets = initialWallets.length - (wallets ? wallets.length : 0);
  const missingCloudCat = initialCategories.length - (categories ? categories.length : 0);

  console.log(`\nMISSING CLOUD DATA:`);
  console.log(`- Missing Cloud Transactions : ${missingCloudTxs}`);
  console.log(`- Missing Cloud Wallets      : ${missingCloudWallets}`);
  console.log(`- Missing Cloud Categories   : ${missingCloudCat}`);

  if (txs && txs.length > 0) {
    console.log("\nSample Cloud Transactions User IDs:", [...new Set(txs.map((t: any) => t.user_id))]);
  }
}

runAudit().catch(err => console.error("Audit error:", err));
