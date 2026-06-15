import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, Link } from '@inertiajs/react';
import { useState, useEffect } from 'react';

export default function ProductsAdjust({ branch = {}, products = [] }) {
    // Items state: array of { id: unique_temp_id, product_id: '', actual_stock: 0, notes: '' }
    const [items, setItems] = useState([]);
    const [errors, setErrors] = useState({});
    const [processing, setProcessing] = useState(false);

    // Initialize with one default row
    useEffect(() => {
        setItems([{ id: Date.now(), product_id: '', actual_stock: 0, notes: '' }]);
    }, [products]);

    const handleAddRow = () => {
        setItems(prev => [
            ...prev,
            { id: Date.now(), product_id: '', actual_stock: 0, notes: '' }
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

        // Validate items
        const invalidItems = items.filter(item => !item.product_id || item.actual_stock < 0);
        if (invalidItems.length > 0) {
            alert('Pastikan semua baris sudah memilih produk dan memiliki jumlah stok aktual minimal 0.');
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

        router.post(route('cashier.products.adjust.bulk'), {
            items: items.map(item => ({
                product_id: item.product_id,
                actual_stock: parseInt(item.actual_stock) || 0,
                notes: item.notes
            }))
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
                            Penyelarasan Stok Opname ({branch.name})
                        </h2>
                        <p className="text-xs text-on-light-muted mt-1">Form input penyesuaian stok opname fisik retail.</p>
                    </div>
                    <Link
                        href={route('cashier.products.index')}
                        className="px-4 py-2 border border-hairline-cool rounded-md text-xs font-bold text-ink hover:bg-surface-card transition flex items-center space-x-1"
                    >
                        <span>KEMBALI</span>
                    </Link>
                </div>
            }
        >
            <Head title="Stok Opname Bulk" />

            <div className="py-6 px-4 sm:px-6 lg:px-8 bg-surface-canvas-light text-ink min-h-screen">
                <div className="max-w-4xl mx-auto font-medium">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        
                        {/* Items Table Card */}
                        <div className="bg-white border border-hairline-cloud rounded-card shadow-card overflow-hidden">
                            <div className="p-5 border-b border-hairline-cloud flex justify-between items-center bg-[#f8f7ff]/40">
                                <h3 className="font-display font-bold text-sm text-ink-deep uppercase tracking-wider">Daftar Koreksi Opname</h3>
                                <button
                                    type="button"
                                    onClick={handleAddRow}
                                    className="px-3.5 py-1.5 bg-[#7C5CBF] hover:bg-[#6b4fa8] text-white rounded text-xs font-bold tracking-wider transition cursor-pointer"
                                    disabled={processing}
                                >
                                    + BARIS BARU
                                </button>
                            </div>

                            <div className="p-6">
                                <div className="space-y-6">
                                    {items.map((item, idx) => {
                                        const availableProducts = getAvailableProducts(item.product_id);
                                        const selectedProduct = products.find(p => p.id.toString() === item.product_id.toString() || p.id === item.product_id);
                                        const systemStock = selectedProduct ? selectedProduct.stock : 0;
                                        const difference = item.actual_stock - systemStock;

                                        return (
                                            <div key={item.id} className="p-4 border border-hairline-cloud rounded-xl bg-surface-card/25 space-y-4">
                                                <div className="flex items-center space-x-4">
                                                    <span className="text-xs font-bold text-on-light-faint w-6 text-center">{idx + 1}.</span>
                                                    
                                                    {/* Select Product */}
                                                    <div className="flex-1">
                                                        <select
                                                            value={item.product_id}
                                                            onChange={(e) => handleItemChange(item.id, 'product_id', e.target.value)}
                                                            className="input-field w-full text-sm font-semibold"
                                                            required
                                                            disabled={processing}
                                                        >
                                                            <option value="">-- Pilih Produk --</option>
                                                            {availableProducts.map(p => (
                                                                <option key={p.id} value={p.id}>
                                                                    {p.name} [{p.category}]
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    {/* System Stock display */}
                                                    <div className="w-32 text-center bg-[#f0eeff] py-2 px-3 rounded-lg border border-hairline-cloud shrink-0">
                                                        <p className="text-[9px] font-bold text-on-light-muted uppercase tracking-wide">Stok Sistem</p>
                                                        <p className="text-xs font-bold text-ink mt-0.5">{systemStock} pcs</p>
                                                    </div>

                                                    {/* Actual Stock Input */}
                                                    <div className="w-32">
                                                        <input
                                                            type="number"
                                                            placeholder="Aktual"
                                                            value={item.actual_stock}
                                                            onChange={(e) => handleItemChange(item.id, 'actual_stock', parseInt(e.target.value) || 0)}
                                                            className="input-field w-full text-sm font-bold text-center"
                                                            min="0"
                                                            required
                                                            disabled={processing}
                                                        />
                                                    </div>

                                                    {/* Difference display */}
                                                    {item.product_id && (
                                                        <div className={`w-24 text-center py-2 px-3 rounded-lg border shrink-0 ${
                                                            difference === 0 
                                                                ? 'bg-gray-50 border-gray-200 text-gray-500' 
                                                                : difference > 0 
                                                                ? 'bg-green-50 border-green-200 text-green-600' 
                                                                : 'bg-red-50 border-red-200 text-red-600'
                                                        }`}>
                                                            <p className="text-[9px] font-bold uppercase tracking-wide">Selisih</p>
                                                            <p className="text-xs font-bold mt-0.5">
                                                                {difference > 0 ? `+${difference}` : difference} pcs
                                                            </p>
                                                        </div>
                                                    )}

                                                    {/* Action Button */}
                                                    {items.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveRow(item.id)}
                                                            className="p-2 border border-[#EF4444] hover:bg-red-50 text-[#EF4444] rounded-lg transition cursor-pointer"
                                                            disabled={processing}
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Single Notes input per row */}
                                                <div>
                                                    <input
                                                        type="text"
                                                        placeholder="Catatan penyesuaian untuk produk ini (contoh: Barang pecah / kedaluwarsa)"
                                                        value={item.notes}
                                                        onChange={(e) => handleItemChange(item.id, 'notes', e.target.value)}
                                                        className="input-field w-full text-xs font-semibold"
                                                        disabled={processing}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Submit Button Section */}
                        <div className="flex justify-end space-x-3">
                            <Link
                                href={route('cashier.products.index')}
                                className="px-5 py-2.5 border border-hairline-cool hover:bg-surface-card rounded-lg text-xs font-bold text-on-light-muted uppercase tracking-wide transition"
                            >
                                BATAL
                            </Link>
                            <button
                                type="submit"
                                className="px-6 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-lg text-xs font-bold uppercase tracking-wider transition shadow-md cursor-pointer"
                                disabled={processing}
                            >
                                {processing ? 'MEMPROSES...' : 'SIMPAN STOK OPNAME'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
