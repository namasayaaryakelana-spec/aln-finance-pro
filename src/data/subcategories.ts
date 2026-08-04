export const masterCategories = {
  INCOME: {
    "Penghasilan Utama": ["Gaji Suami", "Gaji Istri", "Transport Bulanan", "Insentif / Tunjangan"],
    "Penghasilan Sampingan": ["Honorarium Kegiatan", "Transport Rapat / Bonus", "Usaha Sampingan"],
    "Pemasukan Lainnya": ["Refunds / Reimbursements", "Pemberian / Hadiah", "Hasil Investasi"]
  },
  EXPENSE: {
    "Transportasi": ["Bensin", "Biaya Perjalanan", "Parkir", "Servis & Perawatan"],
    "Makan": ["Belanja Dapur", "Makan Diluar", "Jajan"],
    "Bill & Utilitas": ["Listrik", "Gas LPG", "Wifi", "Netflix / Langganan", "Paket Data", "Kontrakan / KPR", "Air PAM"],
    "Kebutuhan Keluarga & Anak": ["Pampers / Popok", "Susu & Perlengkapan", "Sekolah / Daycare", "Pakaian"],
    "Kesehatan": ["Obat & Vitamin", "Dokter / Rumah Sakit"]
  }
};

export interface SubcategoryMap {
  [categoryName: string]: string[];
}

export const defaultCategorySubcategories: SubcategoryMap = {
  ...masterCategories.INCOME,
  ...masterCategories.EXPENSE,

  // Aliases for legacy data support
  'Gaji Utama': ['Gaji Suami', 'Gaji Istri', 'Insentif / Tunjangan'],
  'Bonus & Dividen': ['Transport Rapat / Bonus', 'Hasil Investasi'],
  'Freelance & Side Job': ['Honorarium Kegiatan', 'Usaha Sampingan'],
  'Makanan & Kuliner': ['Belanja Dapur', 'Makan Diluar', 'Jajan'],
  'Tagihan Rumah & Listrik': ['Listrik', 'Gas LPG', 'Wifi', 'Netflix / Langganan', 'Paket Data', 'Kontrakan / KPR', 'Air PAM'],
  'Pendidikan & Anak': ['Pampers / Popok', 'Susu & Perlengkapan', 'Sekolah / Daycare', 'Pakaian'],
  'Kesehatan & Asuransi': ['Obat & Vitamin', 'Dokter / Rumah Sakit']
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
