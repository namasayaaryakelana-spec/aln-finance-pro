import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  X,
  Tag,
  Plus,
  Pencil,
  Trash2,
  Search,
  Check,
  RotateCcw,
  Layers,
  FolderPlus
} from 'lucide-react';
import { Category, Scope } from '../../types';

interface CategoryMasterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const COLOR_PRESETS = [
  '#10B981', // Emerald
  '#3B82F6', // Blue
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#64748B', // Slate
  '#F97316', // Orange
  '#84CC16'  // Lime
];

const ICON_PRESETS = [
  'Tag', 'Briefcase', 'Laptop', 'TrendingUp', 'Car', 'Utensils',
  'Home', 'ShoppingBag', 'HeartPulse', 'Layers', 'DollarSign',
  'Users', 'Building', 'Server', 'Megaphone', 'FileText'
];

export const CategoryMasterModal: React.FC<CategoryMasterModalProps> = ({ isOpen, onClose }) => {
  const { categories, addCategory, updateCategory, deleteCategory, addToast } = useFinance();

  // Search and Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'expense' | 'income'>('all');

  // Form State (For Create or Edit)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [scope, setScope] = useState<Scope>('personal');
  const [icon, setIcon] = useState('Tag');
  const [color, setColor] = useState('#10B981');
  
  // Subcategories state for the active form
  const [subcategories, setSubcategories] = useState<string[]>([]);
  const [newSubcategoryInput, setNewSubcategoryInput] = useState('');

  // Delete Confirmation State
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (!isOpen) return null;

  // Reset form to default (Create Mode)
  const resetForm = () => {
    setEditingCategory(null);
    setName('');
    setType('expense');
    setScope('personal');
    setIcon('Tag');
    setColor('#10B981');
    setSubcategories([]);
    setNewSubcategoryInput('');
    setDeletingId(null);
  };

  // Populate form for Edit Mode
  const handleStartEdit = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setType(cat.type);
    setScope(cat.scope || 'personal');
    setIcon(cat.icon || 'Tag');
    setColor(cat.color || '#10B981');
    setSubcategories(cat.subcategories && cat.subcategories.length > 0 ? [...cat.subcategories] : ['Umum']);
    setNewSubcategoryInput('');
  };

  // Add a subcategory item to the form array
  const handleAddSubcategory = () => {
    const trimmed = newSubcategoryInput.trim();
    if (!trimmed) return;
    if (subcategories.some(s => s.toLowerCase() === trimmed.toLowerCase())) {
      addToast('warning', 'Sub-kategori Duplikat', `Sub-kategori "${trimmed}" sudah ada.`);
      return;
    }
    setSubcategories(prev => [...prev, trimmed]);
    setNewSubcategoryInput('');
  };

  // Remove a subcategory item from the form array
  const handleRemoveSubcategory = (indexToRemove: number) => {
    setSubcategories(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Form Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      addToast('error', 'Nama Wajib Diisi', 'Mohon masukkan nama kategori.');
      return;
    }

    const finalSubcategories = subcategories.length > 0 ? subcategories : ['Umum'];

    if (editingCategory) {
      // Update existing category
      updateCategory({
        ...editingCategory,
        name: name.trim(),
        type,
        scope,
        icon,
        color,
        subcategories: finalSubcategories
      });
    } else {
      // Create new category
      addCategory({
        name: name.trim(),
        type,
        scope,
        icon,
        color,
        subcategories: finalSubcategories
      });
    }

    resetForm();
  };

  // Filter categories for the list
  const filteredCategories = categories.filter(c => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.subcategories && c.subcategories.some(sub => sub.toLowerCase().includes(searchTerm.toLowerCase())));
    const matchesType = typeFilter === 'all' || c.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#0A0F1D] border border-slate-800 w-full max-w-2xl rounded-3xl p-6 relative text-slate-100 shadow-2xl space-y-6 my-8">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Master Kategori & Sub-Kategori</h3>
              <p className="text-xs text-slate-400">Kelola kategori utama dan sub-kategori transaksi Anda</p>
            </div>
          </div>
          <button
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="p-2 rounded-full bg-slate-900 text-slate-400 hover:text-white transition-all hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Cari kategori atau sub-kategori..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 pl-9 pr-3 py-2 rounded-xl border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1 rounded-lg transition-all ${
                typeFilter === 'all' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setTypeFilter('expense')}
              className={`px-3 py-1 rounded-lg transition-all ${
                typeFilter === 'expense' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              Pengeluaran
            </button>
            <button
              onClick={() => setTypeFilter('income')}
              className={`px-3 py-1 rounded-lg transition-all ${
                typeFilter === 'income' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              Pemasukan
            </button>
          </div>
        </div>

        {/* Category List */}
        <div className="max-h-56 overflow-y-auto custom-scrollbar space-y-2 p-2 bg-slate-950/80 rounded-2xl border border-slate-800/80">
          {filteredCategories.length === 0 ? (
            <div className="text-center py-6 text-slate-500 text-xs">
              Tidak ada kategori yang sesuai pencarian/filter.
            </div>
          ) : (
            filteredCategories.map(cat => (
              <div
                key={cat.id}
                className={`p-3 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  editingCategory?.id === cat.id
                    ? 'bg-emerald-950/40 border-emerald-500/50'
                    : 'bg-slate-900/90 border-slate-800/90 hover:border-slate-700'
                }`}
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                    <span className="font-extrabold text-sm text-white truncate">{cat.name}</span>
                    
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                        cat.type === 'income'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {cat.type === 'income' ? 'Pemasukan (+)' : 'Pengeluaran (-)'}
                    </span>

                    {cat.scope && (
                      <span className="text-[10px] text-slate-400 px-2 py-0.5 rounded-md bg-slate-800 uppercase font-semibold">
                        {cat.scope}
                      </span>
                    )}
                  </div>

                  {/* Subcategories Chips */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                      <Layers className="w-3 h-3 text-cyan-400" /> Sub-kategori:
                    </span>
                    {cat.subcategories && cat.subcategories.length > 0 ? (
                      cat.subcategories.map((sub, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] font-bold bg-slate-950 border border-slate-800 text-cyan-300 px-2 py-0.5 rounded-lg"
                        >
                          {sub}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">Umum</span>
                    )}
                  </div>
                </div>

                {/* Edit & Delete Action Buttons */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {deletingId === cat.id ? (
                    <div className="flex items-center gap-1.5 bg-rose-950/80 border border-rose-800 p-1.5 rounded-xl">
                      <span className="text-[10px] text-rose-300 font-bold px-1">Hapus?</span>
                      <button
                        onClick={() => {
                          deleteCategory(cat.id);
                          setDeletingId(null);
                          if (editingCategory?.id === cat.id) resetForm();
                        }}
                        className="px-2 py-1 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-[10px] rounded-lg shadow transition-all"
                      >
                        Ya
                      </button>
                      <button
                        onClick={() => setDeletingId(null)}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] rounded-lg transition-all"
                      >
                        Batal
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => handleStartEdit(cat)}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-emerald-900/50 hover:text-emerald-300 text-slate-300 transition-all border border-slate-700"
                        title="Edit Master Kategori"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => setDeletingId(cat.id)}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-rose-900/50 hover:text-rose-300 text-slate-300 transition-all border border-slate-700"
                        title="Hapus Master Kategori"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add or Edit Category Form Section */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs border-t border-slate-800 pt-4 bg-slate-950/50 p-4 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-sm text-white flex items-center gap-2">
              <FolderPlus className="w-4 h-4 text-emerald-400" />
              {editingCategory ? `Edit Master Kategori: ${editingCategory.name}` : 'Tambah Master Kategori Baru'}
            </h4>

            {editingCategory && (
              <button
                type="button"
                onClick={resetForm}
                className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 bg-amber-950/40 border border-amber-800/60 px-2.5 py-1 rounded-lg"
              >
                <RotateCcw className="w-3 h-3" /> Batal Edit
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-400 font-bold mb-1">Nama Kategori *</label>
              <input
                type="text"
                placeholder="Mis: Transportasi, Pendidikan"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-800 text-white focus:outline-none focus:border-emerald-500 font-semibold"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1">Tipe Transaksi</label>
              <select
                value={type}
                onChange={e => setType(e.target.value as 'income' | 'expense')}
                className="w-full bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-800 text-white focus:outline-none focus:border-emerald-500 font-semibold"
              >
                <option value="expense">Pengeluaran (-)</option>
                <option value="income">Pemasukan (+)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1">Scope / Cakupan</label>
              <select
                value={scope}
                onChange={e => setScope(e.target.value as Scope)}
                className="w-full bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-800 text-white focus:outline-none focus:border-emerald-500 font-semibold"
              >
                <option value="personal">Personal / Keluarga</option>
                <option value="business">Bisnis / Usaha</option>
                <option value="all">Semua Scope</option>
              </select>
            </div>
          </div>

          {/* Color Badges Selection */}
          <div>
            <label className="block text-slate-400 font-bold mb-1.5">Warna Badge</label>
            <div className="flex flex-wrap gap-2 items-center">
              {COLOR_PRESETS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-6 h-6 rounded-full border-2 transition-all flex items-center justify-center ${
                    color === c ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c }}
                >
                  {color === c && <Check className="w-3 h-3 text-slate-950 font-bold" />}
                </button>
              ))}
            </div>
          </div>

          {/* SUB-CATEGORY MANAGEMENT SECTION */}
          <div className="space-y-2 pt-2 border-t border-slate-800/80">
            <label className="block text-slate-300 font-extrabold flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-cyan-400" />
              Kelola Sub-Kategori Turunan
            </label>
            <p className="text-[11px] text-slate-400">
              Tambahkan nama sub-kategori spesifik untuk mempermudah klasifikasi transaksi (mis: Bensin, Parkir, Servis).
            </p>

            {/* Subcategory Input + Add Button */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Ketik sub-kategori lalu tekan Tambah..."
                value={newSubcategoryInput}
                onChange={e => setNewSubcategoryInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubcategory();
                  }
                }}
                className="flex-1 bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800 text-white focus:outline-none focus:border-cyan-500 text-xs font-semibold"
              />
              <button
                type="button"
                onClick={handleAddSubcategory}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-extrabold rounded-xl transition-all shadow text-xs flex items-center gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" /> Tambah Sub
              </button>
            </div>

            {/* Display Active Subcategories Chips */}
            <div className="flex flex-wrap items-center gap-2 pt-1 min-h-[36px] bg-slate-950 p-2.5 rounded-xl border border-slate-800">
              {subcategories.length === 0 ? (
                <span className="text-[11px] text-slate-400 italic">
                  Belum ada sub-kategori khusus. Sistem akan menyertakan "Umum" secara otomatis.
                </span>
              ) : (
                subcategories.map((sub, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-950/80 border border-cyan-800/80 text-cyan-200 text-xs font-bold shadow-sm"
                  >
                    {sub}
                    <button
                      type="button"
                      onClick={() => handleRemoveSubcategory(idx)}
                      className="hover:text-rose-400 transition-colors p-0.5 rounded"
                      title="Hapus sub-kategori ini"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Form Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold rounded-xl shadow-lg transition-all text-xs flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              {editingCategory ? 'Simpan Perubahan Master Kategori' : '+ Simpan Master Kategori Baru'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
