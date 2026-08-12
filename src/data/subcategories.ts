export const masterCategories = {
  INCOME: {
    "Penghasilan Utama": ["Gaji Lana", "Gaji Lina", "Insentif Lina", "Transport Bulanan Lana", "Honorarium Kegiatan"],
    "Pemasukan Lainnya": ["Pemasukan Lain", "Pemberian / Hadiah", "Refunds / Reimbursements"]
  },
  EXPENSE: {
    "Makanan": ["Makan di Luar", "Belanja Makanan", "Jajan", "Oleh-oleh"],
    "Transportasi": ["Bensin", "Parkir", "Ojek", "Ongkos Kirim", "Transport Rapat/Bonus"],
    "Rumah Tangga": ["Keperluan Rumah Tangga", "Gas", "Sampah", "Kontrakan"],
    "Keperluan Bayi": ["Keperluan Bayi"],
    "Tagihan & Utilitas": ["Listrik", "WiFi", "Paket Data", "Aplikasi & Software", "Netflix"],
    "Kesehatan": ["Kesehatan", "Obat-obatan", "Dokter Kandungan"],
    "Perawatan": ["Skincare", "Makeup & Kosmetik", "Potong Rambut", "Perawatan"],
    "Belanja Pribadi": ["Pakaian", "Accessories", "Emas", "Kado & Hadiah", "Dekorasi & Pesta", "Elektronik HP/TV"],
    "Sosial": ["Iuran RT & Sampah", "Nyumbang"],
    "Biaya Keuangan": ["Admin Bank", "Pembayaran Shopee PayLater"],
    "Utang & Cicilan": ["Pembayaran Utang", "Cicilan"],
    "Service & Perbaikan": ["Service Motor", "Service", "Cuci Motor"],
    "Perjalanan": ["Tiket", "Biaya Perjalanan", "Staycation"],
    "Olahraga": ["Olahraga", "Futsal"],
    "Lain-Lain": ["Lain-Lain"]
  },
  TRANSFER: {
    "Transfer": ["Transfer Antar Wallet"]
  }
};

export interface SubcategoryMap {
  [categoryName: string]: string[];
}

export const defaultCategorySubcategories: SubcategoryMap = {
  ...masterCategories.INCOME,
  ...masterCategories.EXPENSE,
  ...masterCategories.TRANSFER,

  // Aliases for legacy data support
  'Gaji Utama': ['Gaji Lana', 'Gaji Lina', 'Insentif Lina', 'Transport Bulanan Lana', 'Honorarium Kegiatan'],
  'Penghasilan Sampingan': ['Honorarium Kegiatan', 'Pemasukan Lain'],
  'Bonus & Dividen': ['Pemasukan Lain', 'Pemberian / Hadiah'],
  'Freelance & Side Job': ['Honorarium Kegiatan'],
  'Makan': ['Makan di Luar', 'Belanja Makanan', 'Jajan', 'Oleh-oleh'],
  'Makanan & Kuliner': ['Makan di Luar', 'Belanja Makanan', 'Jajan', 'Oleh-oleh'],
  'Tagihan Rumah & Listrik': ['Listrik', 'WiFi', 'Paket Data', 'Aplikasi & Software', 'Netflix'],
  'Bill & Utilitas': ['Listrik', 'WiFi', 'Paket Data', 'Aplikasi & Software', 'Netflix'],
  'Kebutuhan Keluarga & Anak': ['Keperluan Bayi', 'Pakaian', 'Keperluan Rumah Tangga'],
  'Belanja & Lifestyle': ['Pakaian', 'Accessories', 'Emas', 'Kado & Hadiah'],
  'Kesehatan & Asuransi': ['Kesehatan', 'Obat-obatan', 'Dokter Kandungan']
};

export const getSubcategoriesForCategory = (categoryName: string, customCategories?: { name: string; subcategories?: string[] }[]): string[] => {
  if (!categoryName) return ['Umum'];
  
  if (customCategories && Array.isArray(customCategories)) {
    const found = customCategories.find(c => c.name.toLowerCase() === categoryName.toLowerCase());
    if (found && found.subcategories && found.subcategories.length > 0) {
      return found.subcategories;
    }
  }

  if (defaultCategorySubcategories[categoryName]) {
    return defaultCategorySubcategories[categoryName];
  }
  const lower = categoryName.toLowerCase();
  for (const [key, subList] of Object.entries(defaultCategorySubcategories)) {
    if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) {
      return subList;
    }
  }
  return ['Umum'];
};
