import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, Link } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import axios from 'axios'; // We'll use axios

export default function ProductsAdjust({ branches = [] }) {
    const [branchId, setBranchId] = useState('');
    const [products, setProducts] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(false);
    
    // Items state: object mapping product_id to { actual_stock: number, notes: string }
    const [adjustments, setAdjustments] = useState({});
    const [errors, setErrors] = useState({});
    const [processing, setProcessing] = useState(false);

    // Fetch products when branch changes
    useEffect(() => {
        if (!branchId) {
            setProducts([]);
            setAdjustments({});
            return;
        }

        setLoadingProducts(true);
        setAdjustments({});
        
        axios.get(route('owner.products.by_branch', branchId))
            .then(res => {
                const fetchedProducts = res.data.products || [];
                setProducts(fetchedProducts);
                
                // Initialize adjustments with current stock values and empty notes
                const initialAdjustments = {};
                fetchedProducts.forEach(p => {
                    initialAdjustments[p.id] = {
                        actual_stock: p.stock,
                        notes: ''
                    };
                });
                setAdjustments(initialAdjustments);
            })
            .catch(err => {
                console.error(err);
                alert('Gagal mengambil data produk untuk cabang ini.');
            })
            .finally(() => {
                setLoadingProducts(false);
            });
    }, [branchId]);

    const handleActualStockChange = (productId, val) => {
        const intVal = parseInt(val);
        const actual = isNaN(intVal) ? 0 : Math.max(0, intVal);
        
        setAdjustments(prev => ({
            ...prev,
            [productId]: {
                ...prev[productId],
                actual_stock: actual
            }
        }));
    };

    const handleNotesChange = (productId, val) => {
        setAdjustments(prev => ({
            ...prev,
            [productId]: {
                ...prev[productId],
                notes: val
            }
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!branchId) {
            alert('Silakan pilih cabang terlebih dahulu.');
            return;
        }

        // Filter only products that have differences between actual and system stock
        const itemsWithDiff = products
            .filter(p => {
                const adj = adjustments[p.id];
                return adj && adj.actual_stock !== p.stock;
            })
            .map(p => {
                const adj = adjustments[p.id];
                return {
                    product_id: p.id,
                    actual_stock: adj.actual_stock,
                    notes: adj.notes || 'Koreksi stok opname'
                };
            });

        if (itemsWithDiff.length === 0) {
            alert('Tidak ada perbedaan stok yang diinputkan. Pastikan Anda mengubah "Stok Fisik Sebenarnya" jika ingin melakukan penyesuaian.');
            return;
        }

        // Validate notes are entered for products with differences
        const missingNotes = itemsWithDiff.filter(item => !item.notes.trim());
        if (missingNotes.length > 0) {
            alert('Silakan isi alasan penyesuaian/catatan untuk setiap produk yang mengalami selisih stok.');
            return;
        }

        setProcessing(true);
        setErrors({});

        router.post(route('owner.products.adjust.bulk'), {
            branch_id: branchId,
            items: itemsWithDiff
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

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold font-sans text-ink leading-tight">
                            Koreksi Stok Opname (Bulk Adjustment)
                        </h2>
                        <p className="text-xs text-on-light-muted mt-1 font-sans">Sesuaikan stok sistem dengan jumlah fisik produk sebenarnya di cabang.</p>
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
            <Head title="Stok Opname Bulk" />

            <div className="py-6 px-4 sm:px-6 lg:px-8 bg-surface-canvas-light text-ink min-h-screen">
                <div className="max-w-6xl mx-auto">
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

                        {/* Opname Table Card */}
                        {branchId && (
                            <div className="bg-white border border-hairline-cloud rounded-card shadow-card overflow-hidden">
                                <div className="p-5 border-b border-hairline-cloud bg-surface-card flex justify-between items-center">
                                    <h3 className="font-display font-bold text-sm text-ink-deep">Daftar Inventaris Stok Opname</h3>
                                    <span className="text-[10px] bg-accent-lime/20 text-[#7C5CBF] px-2 py-1 rounded font-bold border border-accent-lime/40">
                                        Total: {products.length} Produk Aktif
                                    </span>
                                </div>

                                <div className="p-0">
                                    {loadingProducts ? (
                                        <div className="text-center py-12">
                                            <div className="w-6 h-6 border-2 border-accent-violet border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                                            <p className="text-xs text-on-light-muted">Mengambil data produk cabang...</p>
                                        </div>
                                    ) : products.length === 0 ? (
                                        <div className="text-center py-12 text-on-light-muted italic text-sm">
                                            Tidak ada produk retail aktif di cabang ini. Daftarkan produk terlebih dahulu.
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left border-collapse text-xs">
                                                <thead>
                                                    <tr className="bg-surface-card border-b border-hairline-cloud text-[10px] font-bold text-on-light-muted uppercase tracking-wider">
                                                        <th className="py-3.5 px-5">Produk</th>
                                                        <th className="py-3.5 px-5">Kategori</th>
                                                        <th className="py-3.5 px-5 text-center">Stok Sistem</th>
                                                        <th className="py-3.5 px-5 text-center" style={{ width: '130px' }}>Stok Fisik Sebenarnya</th>
                                                        <th className="py-3.5 px-5 text-center">Selisih</th>
                                                        <th className="py-3.5 px-5">Alasan / Catatan Koreksi (Wajib jika ada selisih)</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-hairline-cloud">
                                                    {products.map((p) => {
                                                        const adj = adjustments[p.id] || { actual_stock: p.stock, notes: '' };
                                                        const diff = adj.actual_stock - p.stock;

                                                        return (
                                                            <tr key={p.id} className={`hover:bg-surface-card/30 transition ${diff !== 0 ? 'bg-surface-card/10' : ''}`}>
                                                                <td className="py-3 px-5 font-bold text-ink-deep flex items-center space-x-3">
                                                                    <div className="w-8 h-8 rounded overflow-hidden bg-primary-deeper border border-hairline-cloud shrink-0 flex items-center justify-center">
                                                                        {p.photo_path ? (
                                                                            <img src={`/storage/${p.photo_path}`} alt={p.name} className="w-full h-full object-cover" />
                                                                        ) : (
                                                                            <span className="text-xs">🧴</span>
                                                                        )}
                                                                    </div>
                                                                    <span>{p.name}</span>
                                                                </td>
                                                                <td className="py-3 px-5 text-on-light-muted">{p.category}</td>
                                                                <td className="py-3 px-5 text-center font-bold text-ink font-mono">{p.stock} pcs</td>
                                                                <td className="py-3 px-5 text-center">
                                                                    <input
                                                                        type="number"
                                                                        min="0"
                                                                        value={adj.actual_stock}
                                                                        onChange={(e) => handleActualStockChange(p.id, e.target.value)}
                                                                        className="input-field w-full text-center text-xs font-semibold py-1 px-2 border-hairline-violet-light focus:border-accent-violet font-mono"
                                                                        required
                                                                        disabled={processing}
                                                                    />
                                                                </td>
                                                                <td className="py-3 px-5 text-center">
                                                                    {diff === 0 ? (
                                                                        <span className="inline-block px-2 py-0.5 rounded-[4px] text-[10px] font-bold bg-gray-50 border border-gray-200 text-gray-400">
                                                                            Cocok
                                                                        </span>
                                                                    ) : diff > 0 ? (
                                                                        <span className="inline-block px-2 py-0.5 rounded-[4px] text-[10px] font-bold bg-green-50 border border-green-200 text-booking-completed font-mono">
                                                                            +{diff}
                                                                        </span>
                                                                    ) : (
                                                                        <span className="inline-block px-2 py-0.5 rounded-[4px] text-[10px] font-bold bg-red-50 border border-red-200 text-booking-cancelled font-mono">
                                                                            {diff}
                                                                        </span>
                                                                    )}
                                                                </td>
                                                                <td className="py-3 px-5">
                                                                    <input
                                                                        type="text"
                                                                        placeholder={diff === 0 ? "Tidak ada selisih" : "Contoh: Pecah di display, Hilang, Selisih opname"}
                                                                        value={adj.notes}
                                                                        onChange={(e) => handleNotesChange(p.id, e.target.value)}
                                                                        className={`input-field w-full text-xs py-1 px-3 ${diff !== 0 && !adj.notes.trim() ? 'border-red-300 bg-red-50/20' : ''}`}
                                                                        required={diff !== 0}
                                                                        disabled={processing || diff === 0}
                                                                    />
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>

                                {products.length > 0 && (
                                    <div className="border-t border-hairline-cloud p-5 bg-surface-card flex justify-end space-x-3">
                                        <Link
                                            href={route('owner.products.index')}
                                            className="px-5 py-2.5 border border-hairline-cool rounded-md text-xs font-bold text-on-light-muted hover:bg-white transition"
                                        >
                                            BATAL
                                        </Link>
                                        <button
                                            type="submit"
                                            disabled={processing}
                                            className="px-6 py-2.5 bg-accent-lime hover:bg-accent-lime-muted text-ink-deep font-display font-bold text-xs rounded-md shadow-lg shadow-accent-lime/10 transition active:scale-98 disabled:opacity-50"
                                        >
                                            {processing ? 'MEMPROSES KOREKSI...' : 'SIMPAN KOREKSI STOK OPNAME'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
