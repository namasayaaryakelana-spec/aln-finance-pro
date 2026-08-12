import { Category, Transaction } from '../types';
import { initialCategories } from '../data/initialData';

export const FINAL_MASTER_CATEGORIES: Category[] = initialCategories;

export const SUBCATEGORY_MAPPING_RULES: { [key: string]: { category: string; subcategory: string } } = {
  // WiFi / Tagihan
  'wifi': { category: 'Tagihan & Utilitas', subcategory: 'WiFi' },
  'wi-fi': { category: 'Tagihan & Utilitas', subcategory: 'WiFi' },
  'internet': { category: 'Tagihan & Utilitas', subcategory: 'WiFi' },
  'listrik': { category: 'Tagihan & Utilitas', subcategory: 'Listrik' },
  'pln': { category: 'Tagihan & Utilitas', subcategory: 'Listrik' },
  'paket data': { category: 'Tagihan & Utilitas', subcategory: 'Paket Data' },
  'pulsa': { category: 'Tagihan & Utilitas', subcategory: 'Paket Data' },
  'aplikasi': { category: 'Tagihan & Utilitas', subcategory: 'Aplikasi & Software' },
  'software': { category: 'Tagihan & Utilitas', subcategory: 'Aplikasi & Software' },
  'saas': { category: 'Tagihan & Utilitas', subcategory: 'Aplikasi & Software' },
  'netflix': { category: 'Tagihan & Utilitas', subcategory: 'Netflix' },
  'spotify': { category: 'Tagihan & Utilitas', subcategory: 'Netflix' },

  // Makanan
  'makan di luar': { category: 'Makanan', subcategory: 'Makan di Luar' },
  'makan diluar': { category: 'Makanan', subcategory: 'Makan di Luar' },
  'makan': { category: 'Makanan', subcategory: 'Makan di Luar' },
  'makanan': { category: 'Makanan', subcategory: 'Makan di Luar' },
  'belanja makanan': { category: 'Makanan', subcategory: 'Belanja Makanan' },
  'belanja dapur': { category: 'Makanan', subcategory: 'Belanja Makanan' },
  'jajan': { category: 'Makanan', subcategory: 'Jajan' },
  'kopi': { category: 'Makanan', subcategory: 'Jajan' },
  'oleh-oleh': { category: 'Makanan', subcategory: 'Oleh-oleh' },
  'oleh oleh': { category: 'Makanan', subcategory: 'Oleh-oleh' },

  // Transportasi
  'bensin': { category: 'Transportasi', subcategory: 'Bensin' },
  'pertamax': { category: 'Transportasi', subcategory: 'Bensin' },
  'pertalite': { category: 'Transportasi', subcategory: 'Bensin' },
  'parkir': { category: 'Transportasi', subcategory: 'Parkir' },
  'ojek': { category: 'Transportasi', subcategory: 'Ojek' },
  'gojek': { category: 'Transportasi', subcategory: 'Ojek' },
  'grab': { category: 'Transportasi', subcategory: 'Ojek' },
  'ongkos kirim': { category: 'Transportasi', subcategory: 'Ongkos Kirim' },
  'ongkir': { category: 'Transportasi', subcategory: 'Ongkos Kirim' },
  'transport rapat': { category: 'Transportasi', subcategory: 'Transport Rapat/Bonus' },
  'transport rapat/bonus': { category: 'Transportasi', subcategory: 'Transport Rapat/Bonus' },

  // Penghasilan Utama
  'transport bulanan lana': { category: 'Penghasilan Utama', subcategory: 'Transport Bulanan Lana' },
  'gaji lana': { category: 'Penghasilan Utama', subcategory: 'Gaji Lana' },
  'gaji lina': { category: 'Penghasilan Utama', subcategory: 'Gaji Lina' },
  'insentif lina': { category: 'Penghasilan Utama', subcategory: 'Insentif Lina' },
  'honorarium kegiatan': { category: 'Penghasilan Utama', subcategory: 'Honorarium Kegiatan' },
  'honorarium': { category: 'Penghasilan Utama', subcategory: 'Honorarium Kegiatan' },

  // Pemasukan Lainnya
  'pemasukan lain': { category: 'Pemasukan Lainnya', subcategory: 'Pemasukan Lain' },
  'pemberian / hadiah': { category: 'Pemasukan Lainnya', subcategory: 'Pemberian / Hadiah' },
  'pemberian': { category: 'Pemasukan Lainnya', subcategory: 'Pemberian / Hadiah' },
  'refunds / reimbursements': { category: 'Pemasukan Lainnya', subcategory: 'Refunds / Reimbursements' },
  'refund': { category: 'Pemasukan Lainnya', subcategory: 'Refunds / Reimbursements' },

  // Rumah Tangga
  'keperluan rumah tangga': { category: 'Rumah Tangga', subcategory: 'Keperluan Rumah Tangga' },
  'gas': { category: 'Rumah Tangga', subcategory: 'Gas' },
  'sampah': { category: 'Rumah Tangga', subcategory: 'Sampah' },
  'kontrakan': { category: 'Rumah Tangga', subcategory: 'Kontrakan' },

  // Keperluan Bayi
  'keperluan bayi': { category: 'Keperluan Bayi', subcategory: 'Keperluan Bayi' },
  'pampers': { category: 'Keperluan Bayi', subcategory: 'Keperluan Bayi' },
  'popok': { category: 'Keperluan Bayi', subcategory: 'Keperluan Bayi' },
  'susu': { category: 'Keperluan Bayi', subcategory: 'Keperluan Bayi' },

  // Kesehatan
  'kesehatan': { category: 'Kesehatan', subcategory: 'Kesehatan' },
  'obat-obatan': { category: 'Kesehatan', subcategory: 'Obat-obatan' },
  'obat obatan': { category: 'Kesehatan', subcategory: 'Obat-obatan' },
  'dokter kandungan': { category: 'Kesehatan', subcategory: 'Dokter Kandungan' },

  // Perawatan
  'skincare': { category: 'Perawatan', subcategory: 'Skincare' },
  'makeup & kosmetik': { category: 'Perawatan', subcategory: 'Makeup & Kosmetik' },
  'makeup': { category: 'Perawatan', subcategory: 'Makeup & Kosmetik' },
  'kosmetik': { category: 'Perawatan', subcategory: 'Makeup & Kosmetik' },
  'potong rambut': { category: 'Perawatan', subcategory: 'Potong Rambut' },
  'perawatan': { category: 'Perawatan', subcategory: 'Perawatan' },

  // Belanja Pribadi
  'pakaian': { category: 'Belanja Pribadi', subcategory: 'Pakaian' },
  'baju': { category: 'Belanja Pribadi', subcategory: 'Pakaian' },
  'accessories': { category: 'Belanja Pribadi', subcategory: 'Accessories' },
  'aksesoris': { category: 'Belanja Pribadi', subcategory: 'Accessories' },
  'emas': { category: 'Belanja Pribadi', subcategory: 'Emas' },
  'kado & hadiah': { category: 'Belanja Pribadi', subcategory: 'Kado & Hadiah' },
  'dekorasi & pesta': { category: 'Belanja Pribadi', subcategory: 'Dekorasi & Pesta' },
  'elektronik hp/tv': { category: 'Belanja Pribadi', subcategory: 'Elektronik HP/TV' },
  'elektronik': { category: 'Belanja Pribadi', subcategory: 'Elektronik HP/TV' },

  // Sosial
  'iuran rt & sampah': { category: 'Sosial', subcategory: 'Iuran RT & Sampah' },
  'iuran rt': { category: 'Sosial', subcategory: 'Iuran RT & Sampah' },
  'nyumbang': { category: 'Sosial', subcategory: 'Nyumbang' },

  // Biaya Keuangan
  'admin bank': { category: 'Biaya Keuangan', subcategory: 'Admin Bank' },
  'pembayaran shopee paylater': { category: 'Biaya Keuangan', subcategory: 'Pembayaran Shopee PayLater' },
  'shopee paylater': { category: 'Biaya Keuangan', subcategory: 'Pembayaran Shopee PayLater' },
  'paylater': { category: 'Biaya Keuangan', subcategory: 'Pembayaran Shopee PayLater' },

  // Utang & Cicilan
  'pembayaran utang': { category: 'Utang & Cicilan', subcategory: 'Pembayaran Utang' },
  'cicilan': { category: 'Utang & Cicilan', subcategory: 'Cicilan' },

  // Service & Perbaikan
  'service motor': { category: 'Service & Perbaikan', subcategory: 'Service Motor' },
  'servis motor': { category: 'Service & Perbaikan', subcategory: 'Service Motor' },
  'service': { category: 'Service & Perbaikan', subcategory: 'Service' },
  'servis': { category: 'Service & Perbaikan', subcategory: 'Service' },
  'cuci motor': { category: 'Service & Perbaikan', subcategory: 'Cuci Motor' },

  // Perjalanan
  'tiket': { category: 'Perjalanan', subcategory: 'Tiket' },
  'biaya perjalanan': { category: 'Perjalanan', subcategory: 'Biaya Perjalanan' },
  'staycation': { category: 'Perjalanan', subcategory: 'Staycation' },

  // Olahraga
  'olahraga': { category: 'Olahraga', subcategory: 'Olahraga' },
  'futsal': { category: 'Olahraga', subcategory: 'Futsal' },

  // Lain-Lain
  'lain-lain': { category: 'Lain-Lain', subcategory: 'Lain-Lain' },
  'lain lain': { category: 'Lain-Lain', subcategory: 'Lain-Lain' },

  // Transfer
  'transfer antar wallet': { category: 'Transfer', subcategory: 'Transfer Antar Wallet' }
};

export const CATEGORY_ALIAS_MAP: { [key: string]: string } = {
  'gaji utama': 'Penghasilan Utama',
  'penghasilan sampingan': 'Pemasukan Lainnya',
  'bonus & dividen': 'Pemasukan Lainnya',
  'freelance & side job': 'Penghasilan Utama',
  'makan': 'Makanan',
  'makanan & kuliner': 'Makanan',
  'bill & utilitas': 'Tagihan & Utilitas',
  'tagihan rumah & listrik': 'Tagihan & Utilitas',
  'kebutuhan keluarga & anak': 'Keperluan Bayi',
  'belanja & lifestyle': 'Belanja Pribadi',
  'kesehatan & asuransi': 'Kesehatan'
};

export function normalizeCategoryAndSubcategory(
  rawCat?: string,
  rawSub?: string
): { category: string; subcategory: string } {
  const catTrim = (rawCat || '').trim();
  const subTrim = (rawSub || '').trim();
  const subLower = subTrim.toLowerCase();
  const catLower = catTrim.toLowerCase();

  // 1. Check direct subcategory rule map
  if (subLower && SUBCATEGORY_MAPPING_RULES[subLower]) {
    return SUBCATEGORY_MAPPING_RULES[subLower];
  }

  // 2. Check direct category rule map
  if (catLower && SUBCATEGORY_MAPPING_RULES[catLower]) {
    return SUBCATEGORY_MAPPING_RULES[catLower];
  }

  // 3. Match against Master Data categories
  const targetCategory = FINAL_MASTER_CATEGORIES.find(
    c => c.name.toLowerCase() === catLower || c.name.toLowerCase() === (CATEGORY_ALIAS_MAP[catLower] || '').toLowerCase()
  );

  if (targetCategory) {
    const matchedSub = targetCategory.subcategories.find(s => s.toLowerCase() === subLower);
    return {
      category: targetCategory.name,
      subcategory: matchedSub || targetCategory.subcategories[0] || targetCategory.name
    };
  }

  // 4. Default Fallback
  return {
    category: 'Lain-Lain',
    subcategory: 'Lain-Lain'
  };
}

export function normalizeTransactions(transactions: Transaction[]): Transaction[] {
  return transactions.map(t => {
    const { category, subcategory } = normalizeCategoryAndSubcategory(t.category, t.subcategory);
    return {
      ...t,
      category,
      subcategory
    };
  });
}

export function upgradeMasterCategories(currentCategories: Category[]): Category[] {
  if (!currentCategories || currentCategories.length === 0) {
    return FINAL_MASTER_CATEGORIES;
  }

  const masterCategoryMap = new Map<string, Category>();
  FINAL_MASTER_CATEGORIES.forEach(cat => {
    masterCategoryMap.set(cat.name.toLowerCase(), { ...cat, subcategories: [...cat.subcategories] });
  });

  const customCategories: Category[] = [];

  for (const cat of currentCategories) {
    if (cat.isCustom) {
      customCategories.push(cat);
      continue;
    }

    const mappedName = CATEGORY_ALIAS_MAP[cat.name.toLowerCase()] || cat.name;
    const masterCat = masterCategoryMap.get(mappedName.toLowerCase());

    if (masterCat) {
      if (Array.isArray(cat.subcategories)) {
        for (const sub of cat.subcategories) {
          const { subcategory: normSub } = normalizeCategoryAndSubcategory(cat.name, sub);
          if (!masterCat.subcategories.includes(normSub)) {
            masterCat.subcategories.push(normSub);
          }
        }
      }
    }
  }

  const finalCategoriesList = Array.from(masterCategoryMap.values());
  for (const custom of customCategories) {
    if (!finalCategoriesList.some(c => c.id === custom.id || c.name.toLowerCase() === custom.name.toLowerCase())) {
      finalCategoriesList.push(custom);
    }
  }

  return finalCategoriesList;
}
