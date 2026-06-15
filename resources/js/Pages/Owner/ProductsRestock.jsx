import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, Link } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function ProductsRestock({ branches = [] }) {
    const [branchId, setBranchId] = useState('');
    const [products, setProducts] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(false);
    
    // Items state: array of { id: unique_temp_id, product_id: '', qty: 1 }
    const [items, setItems] = useState([]);
    const [notes, setNotes] = useState('');
    const [errors, setErrors] = useState({});
    const [processing, setProcessing] = useState(false);

    // Fetch products when branch changes
    useEffect(() => {
        if (!branchId) {
            setProducts([]);
            setItems([]);
            return;
        }

        setLoadingProducts(true);
        setItems([]); // reset items
        
        axios.get(route('owner.products.by_branch', branchId))
            .then(res => {
                setProducts(res.data.products || []);
                // Add one default row
                setItems([{ id: Date.now(), product_id: '', qty: 1 }]);
            })
            .catch(err => {
                console.error(err);
                alert('Gagal mengambil data produk untuk cabang ini.');
            })
            .finally(() => {
                setLoadingProducts(false);
            });
    }, [branchId]);

    const handleAddRow = () => {
        setItems(prev => [
            ...prev,
            { id: Date.now(), product_id: '', qty: 1 }
        ]);
    };

    const handleRemoveRow = (id) => {
        setItems(prev => prev.filter(item => item.id !== id));
    };

    const handleItemChange = (id, field, value) => {
        setItems(prev => prev.map(item => {
            if (item.id === id) {
                return { ...item, [field]: value };
            }
            return item;
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!branchId) {
            alert('Silakan pilih cabang terlebih dahulu.');
            return;
        }

        // Validate items
        const invalidItems = items.filter(item => !item.product_id || item.qty <= 0);
        if (invalidItems.length > 0) {
            alert('Pastikan semua baris sudah memilih produk dan memiliki jumlah minimal 1.');
            return;
        }

        // Check duplicates
        const productIds = items.map(item => item.product_id);
        const hasDuplicates = productIds.some((val, i) => productIds.indexOf(val) !== i);
        if (hasDuplicates) {
            alert('Ada produk yang terduplikasi di baris input. Silakan gabungkan barisnya.');
            return;
        }

        setProcessing(true);
        setErrors({});

        router.post(route('owner.products.restock.bulk'), {
            branch_id: branchId,
            items: items.map(item => ({
                product_id: item.product_id,
                qty: parseInt(item.qty) || 0
            })),
            notes: notes
        }, {
            onSuccess: () => {
                setProcessing(false);
            },
            onError: (errs) => {
                setErrors(errs);
                setProcessing(false);
            }
        });
    };

    // Helper to filter selected products to prevent duplicate selection options
    const getAvailableProducts = (currentProductId) => {
        const selectedIds = items
            .map(item => item.product_id)
            .filter(id => id && id !== currentProductId);
        return products.filter(p => !selectedIds.includes(p.id.toString()) && !selectedIds.includes(p.id));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold font-sans text-ink leading-tight">
                            Pencatatan Stok Masuk (Bulk Restock)
                        </h2>
                        <p className="text-xs text-on-light-muted mt-1">Form input stok masuk untuk beberapa produk sekaligus.</p>
                    </div>
                    <Link
                        href={route('owner.products.index')}
                        className="px-4 py-2 border border-hairline-cool rounded-md text-xs font-bold text-ink hover:bg-surface-card transition flex items-center space-x-1"
                    >
                        <span>⬅️ KEMBALI</span>
                    </Link>
                </div>
            }
        >
            <Head title="Stok Masuk Bulk" />

            <div className="py-6 px-4 sm:px-6 lg:px-8 bg-surface-canvas-light text-ink min-h-screen">
                <div className="max-w-4xl mx-auto">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Branch Selection Card */}
                        <div className="bg-white border border-hairline-cloud rounded-card shadow-card p-6">
                            <div className="max-w-xs">
                                <label className="block text-xs font-bold text-on-light-muted uppercase tracking-wider mb-2">
                                    Pilih Cabang Barbershop
                                </label>
                                <select
                                    value={branchId}
                                    onChange={(e) => setBranchId(e.target.value)}
                                    className="input-field w-full text-sm font-semibold"
                                    required
                                    disabled={processing}
                                >
                                    <option value="">-- Pilih Cabang --</option>
                                    {branches.map(b => (
                                        <option key={b.id} value={b.id}>{b.name}</option>
                                    ))}
                                </select>
                                {errors.branch_id && <p className="text-xs text-status-danger mt-1">{errors.branch_id}</p>}
                            </div>
                        </div>

                        {/* Items Grid / Table Card */}
                        {branchId && (
                            <div className="bg-white border border-hairline-cloud rounded-card shadow-card overflow-hidden">
                                <div className="p-5 border-b border-hairline-cloud flex justify-between items-center bg-surface-card">
                                    <h3 className="font-display font-bold text-sm text-ink-deep">Daftar Produk Masuk</h3>
                                    <button
                                        type="button"
                                        onClick={handleAddRow}
                                        className="px-3 py-1.5 bg-[#2D1B69] hover:bg-[#1A0F3D] text-white rounded text-[10px] font-bold transition flex items-center gap-1"
                                        disabled={products.length === 0 || items.length >= products.length}
                                    >
                                        <span>Tambah Baris</span>
                                    </button>
                                </div>

                                <div className="p-6">
                                    {loadingProducts ? (
                                        <div className="text-center py-8">
                                            <div className="w-6 h-6 border-2 border-accent-violet border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                                            <p className="text-xs text-on-light-muted">Mengambil data produk cabang...</p>
                                        </div>
                                    ) : products.length === 0 ? (
                                        <div className="text-center py-8 text-on-light-muted italic text-sm">
                                            Tidak ada produk retail aktif di cabang ini. Daftarkan produk terlebih dahulu.
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="hidden sm:grid grid-cols-12 gap-4 text-[10px] font-bold text-on-light-muted uppercase tracking-wider pb-2 border-b border-hairline-cloud">
                                                <div className="col-span-7">Nama Produk</div>
                                                <div className="col-span-4 text-center">Jumlah Masuk (Pcs)</div>
                                                <div className="col-span-1 text-right">Aksi</div>
                                            </div>

                                            <div className="divide-y divide-hairline-cloud sm:divide-y-0 space-y-4 sm:space-y-3">
                                                {items.map((item, index) => {
                                                    const available = getAvailableProducts(item.product_id);
                                                    const selectedProductObj = products.find(p => p.id.toString() === item.product_id.toString() || p.id === item.product_id);

                                                    return (
                                                        <div key={item.id} className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 items-center pt-3 sm:pt-0">
                                                            <div className="col-span-1 sm:col-span-7">
                                                                <label className="block sm:hidden text-[9px] font-bold text-on-light-muted uppercase mb-1">Produk</label>
                                                                <select
                                                                    value={item.product_id}
                                                                    onChange={(e) => handleItemChange(item.id, 'product_id', e.target.value)}
                                                                    className="input-field w-full text-xs"
                                                                    required
                                                                >
                                                                    <option value="">-- Pilih Produk --</option>
                                                                    {/* Show currently selected product in this row option */}
                                                                    {selectedProductObj && (
                                                                        <option value={selectedProductObj.id}>
                                                                            {selectedProductObj.name} (Stok: {selectedProductObj.stock} Pcs)
                                                                        </option>
                                                                    )}
                                                                    {available.map(p => (
                                                                        <option key={p.id} value={p.id}>
                                                                            {p.name} (Stok: {p.stock} Pcs)
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                            <div className="col-span-1 sm:col-span-4">
                                                                <label className="block sm:hidden text-[9px] font-bold text-on-light-muted uppercase mb-1">Jumlah</label>
                                                                <input
                                                                    type="number"
                                                                    min="1"
                                                                    value={item.qty}
                                                                    onChange={(e) => handleItemChange(item.id, 'qty', parseInt(e.target.value) || '')}
                                                                    className="input-field w-full text-center text-xs"
                                                                    required
                                                                />
                                                            </div>
                                                            <div className="col-span-1 sm:col-span-1 text-right">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleRemoveRow(item.id)}
                                                                    className="px-2.5 py-1.5 text-xs text-status-danger border border-red-200 bg-red-50 hover:bg-red-100 rounded font-semibold cursor-pointer w-full sm:w-auto text-center"
                                                                    disabled={items.length <= 1}
                                                                >
                                                                    Hapus
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* General Notes Card */}
                        {branchId && products.length > 0 && (
                            <div className="bg-white border border-hairline-cloud rounded-card shadow-card p-6 space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-on-light-muted uppercase tracking-wider mb-2">
                                        Catatan Stok Masuk (General)
                                    </label>
                                    <textarea
                                        rows="3"
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Contoh: Pengiriman batch supplier, pengisian ulang rutin bulanan."
                                        className="input-field w-full text-sm"
                                    />
                                    {errors.notes && <p className="text-xs text-status-danger mt-1">{errors.notes}</p>}
                                </div>

                                <div className="border-t border-hairline-cloud pt-4 flex justify-end space-x-3">
                                    <Link
                                        href={route('owner.products.index')}
                                        className="px-5 py-2.5 border border-hairline-cool rounded-md text-xs font-bold text-on-light-muted hover:bg-surface-card transition"
                                    >
                                        BATAL
                                    </Link>
                                    <button
                                        type="submit"
                                        disabled={processing || items.length === 0}
                                        className="px-6 py-2.5 bg-accent-lime hover:bg-accent-lime-muted text-ink-deep font-display font-bold text-xs rounded-md shadow-lg shadow-accent-lime/10 transition active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {processing ? 'MEMPROSES...' : 'SIMPAN STOK MASUK'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
