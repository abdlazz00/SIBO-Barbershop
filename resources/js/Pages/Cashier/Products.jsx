import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, Link } from '@inertiajs/react';
import { useState } from 'react';
import axios from 'axios';

export default function Products({ products = [], branch = {} }) {
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);

    // Form states
    const [name, setName] = useState('');
    const [category, setCategory] = useState('Pomade');
    const [price, setPrice] = useState(100000);
    const [stock, setStock] = useState(10);
    const [status, setStatus] = useState('active');
    const [photo, setPhoto] = useState(null);
    const [errors, setErrors] = useState({});

    // Mutations Modal states
    const [showMutationsModal, setShowMutationsModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [mutationsList, setMutationsList] = useState([]);
    const [loadingMutations, setLoadingMutations] = useState(false);

    // Stock Operations (Restock / Opname Modals)
    const [showStockOpModal, setShowStockOpModal] = useState(false);
    const [stockOpType, setStockOpType] = useState('restock'); // 'restock' or 'adjust'
    const [opProduct, setOpProduct] = useState(null);
    const [opQty, setOpQty] = useState(1);
    const [opNotes, setOpNotes] = useState('');

    const openCreateModal = () => {
        setEditingProduct(null);
        setName('');
        setCategory('Pomade');
        setPrice(100000);
        setStock(10);
        setStatus('active');
        setPhoto(null);
        setErrors({});
        setShowModal(true);
    };

    const openEditModal = (p) => {
        setEditingProduct(p);
        setName(p.name);
        setCategory(p.category);
        setPrice(p.price);
        setStock(0);
        setStatus(p.status);
        setPhoto(null);
        setErrors({});
        setShowModal(true);
    };

    const openMutationsModal = (p) => {
        setSelectedProduct(p);
        setShowMutationsModal(true);
        setLoadingMutations(true);
        setMutationsList([]);

        axios.get(route('cashier.products.mutations', p.id))
            .then(res => {
                setMutationsList(res.data.mutations || []);
            })
            .catch(err => {
                console.error(err);
                alert('Gagal mengambil data riwayat mutasi.');
            })
            .finally(() => {
                setLoadingMutations(false);
            });
    };

    const openStockOpModal = (type, p) => {
        setStockOpType(type);
        setOpProduct(p);
        const currentStock = p.stocks?.find(s => s.branch_id === branch.id)?.stock || 0;
        setOpQty(type === 'restock' ? 5 : currentStock);
        setOpNotes('');
        setErrors({});
        setShowStockOpModal(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setErrors({});

        if (editingProduct) {
            const payload = {
                name,
                category,
                price,
                status,
            };
            if (photo) {
                payload.photo = photo;
            }
            router.post(route('cashier.products.update', editingProduct.id), {
                ...payload,
                _method: 'PATCH'
            }, {
                onSuccess: () => setShowModal(false),
                onError: (errs) => setErrors(errs)
            });
        } else {
            const payload = {
                name,
                category,
                price,
                stock,
                status,
            };
            if (photo) {
                payload.photo = photo;
            }
            router.post(route('cashier.products.store'), payload, {
                onSuccess: () => setShowModal(false),
                onError: (errs) => setErrors(errs)
            });
        }
    };

    const handleStockOpSubmit = (e) => {
        e.preventDefault();
        setErrors({});

        if (stockOpType === 'restock') {
            router.post(route('cashier.products.restock', opProduct.id), {
                qty: opQty,
                notes: opNotes
            }, {
                onSuccess: () => setShowStockOpModal(false),
                onError: (errs) => setErrors(errs)
            });
        } else {
            router.post(route('cashier.products.adjust', opProduct.id), {
                actual_stock: opQty,
                notes: opNotes
            }, {
                onSuccess: () => setShowStockOpModal(false),
                onError: (errs) => setErrors(errs)
            });
        }
    };

    const handleDelete = (id) => {
        if (confirm('Apakah Anda yakin ingin menonaktifkan produk ini?')) {
            router.delete(route('cashier.products.destroy', id));
        }
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(val);
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center flex-wrap gap-4">
                    <div>
                        <h2 className="text-xl font-bold font-sans text-ink leading-tight">
                            Manajemen Produk & Stok ({branch.name})
                        </h2>
                        <p className="text-xs text-on-light-muted mt-1">
                            Kelola data produk retail dan lakukan penyesuaian stok untuk cabang Anda.
                        </p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Link
                            href={route('cashier.products.restock.form')}
                            className="px-4 py-2 border border-hairline-cool hover:bg-surface-press-light rounded-lg text-xs font-bold text-primary transition cursor-pointer"
                        >
                            STOK MASUK BULK
                        </Link>
                        <Link
                            href={route('cashier.products.adjust.form')}
                            className="px-4 py-2 border border-hairline-cool hover:bg-surface-press-light rounded-lg text-xs font-bold text-primary transition cursor-pointer"
                        >
                            STOK OPNAME BULK
                        </Link>
                        <button
                            onClick={openCreateModal}
                            className="btn-accent px-5 py-2.5 flex items-center space-x-2 text-xs font-bold shadow-md cursor-pointer"
                        >
                            <span>TAMBAH PRODUK</span>
                        </button>
                    </div>
                </div>
            }
        >
            <Head title="Kelola Produk" />

            <div className="py-6 px-4 sm:px-6 lg:px-8 bg-surface-canvas-light text-ink min-h-screen">
                <div className="max-w-7xl mx-auto">
                    
                    {/* Products List Table */}
                    <div className="bg-white border border-hairline-cloud rounded-card shadow-card overflow-hidden">
                        <div className="p-5 border-b border-hairline-cloud">
                            <h3 className="font-display font-bold text-lg text-ink-deep">Inventaris Produk</h3>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-sm">
                                <thead>
                                    <tr className="bg-surface-card border-b border-hairline-cloud text-[11px] font-bold text-on-light-muted uppercase tracking-wider">
                                        <th className="py-4 px-6">Produk</th>
                                        <th className="py-4 px-6">Kategori</th>
                                        <th className="py-4 px-6">Harga</th>
                                        <th className="py-4 px-6">Stok Toko</th>
                                        <th className="py-4 px-6 text-center">Status</th>
                                        <th className="py-4 px-6 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-hairline-cloud text-ink-deep font-medium">
                                    {products.length > 0 ? (
                                        products.map((p) => {
                                            const branchStockObj = p.stocks?.find(s => s.branch_id === branch.id);
                                            const currentStock = branchStockObj ? branchStockObj.stock : 0;

                                            return (
                                                <tr key={p.id} className="hover:bg-surface-card/40 transition">
                                                    <td className="py-4 px-6 font-bold text-ink-deep flex items-center space-x-3">
                                                        <div className="w-10 h-10 rounded overflow-hidden bg-primary-deeper border border-hairline-cloud shrink-0 flex items-center justify-center">
                                                            {p.photo_path ? (
                                                                <img src={`/storage/${p.photo_path}`} alt={p.name} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <span className="text-sm">🧴</span>
                                                            )}
                                                        </div>
                                                        <span>{p.name}</span>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <span className="px-2.5 py-0.5 rounded bg-primary/5 text-accent-violet-deep text-[10px] font-bold uppercase tracking-wider">
                                                            {p.category}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-6 font-semibold">
                                                        {formatCurrency(p.price)}
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <span className={`font-bold ${currentStock <= 5 ? 'text-booking-cancelled' : 'text-ink'}`}>
                                                            {currentStock} pcs
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-6 text-center">
                                                        <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                                                            p.status === 'active' ? 'bg-green-50 border border-green-200 text-booking-completed' : 'bg-red-50 border border-red-200 text-booking-cancelled'
                                                        }`}>
                                                            {p.status}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-6 text-right space-x-1.5 whitespace-nowrap">
                                                        <button
                                                            onClick={() => openMutationsModal(p)}
                                                            className="px-2.5 py-1.5 rounded border border-hairline-cool text-booking-confirmed text-xs font-bold hover:bg-surface-card transition inline-flex items-center"
                                                        >
                                                            Riwayat
                                                        </button>
                                                        <button
                                                            onClick={() => openEditModal(p)}
                                                            className="px-2.5 py-1.5 rounded border border-hairline-cool text-ink-deep text-xs font-bold hover:bg-surface-card transition inline-flex items-center"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(p.id)}
                                                            className="px-2.5 py-1.5 rounded border border-status-danger text-status-danger text-xs font-bold hover:bg-red-50 transition inline-flex items-center"
                                                        >
                                                            Hapus
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan="6" className="py-12 text-center text-on-light-muted italic">
                                                Belum ada produk terdaftar. Silahkan klik tambah produk.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </div>

            {/* Create / Edit Product Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-md rounded-xl shadow-modal border border-hairline-cloud overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-hairline-cloud flex justify-between items-center bg-surface-card">
                            <h3 className="font-display font-bold text-lg text-ink">
                                {editingProduct ? 'Edit Produk Retail' : 'Daftarkan Produk Baru'}
                            </h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-on-light-muted hover:text-ink text-xl font-bold cursor-pointer"
                            >
                                &times;
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {/* Photo Upload Section */}
                            <div className="flex items-center space-x-4 bg-surface-card p-3 rounded-lg border border-hairline-cloud mb-4">
                                <div className="w-16 h-12 rounded overflow-hidden bg-primary-deeper border border-hairline-violet shrink-0 flex items-center justify-center">
                                    {photo ? (
                                        <img src={URL.createObjectURL(photo)} className="w-full h-full object-cover" />
                                    ) : editingProduct?.photo_path ? (
                                        <img src={`/storage/${editingProduct.photo_path}`} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-xl">🧴</span>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <label className="block text-[10px] font-bold text-on-light-muted uppercase tracking-wider mb-1">
                                        Foto Produk
                                    </label>
                                    <input 
                                        type="file" 
                                        accept="image/*"
                                        onChange={(e) => setPhoto(e.target.files[0] || null)}
                                        className="text-xs text-on-light-muted file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-dark cursor-pointer w-full"
                                    />
                                    {errors.photo && <p className="text-xs text-status-danger mt-1">{errors.photo}</p>}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-on-light-muted uppercase tracking-wider mb-2">Nama Produk</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Contoh: Pomade Hair Grease"
                                    className="input-field w-full text-sm"
                                    required
                                />
                                {errors.name && <p className="text-xs text-status-danger mt-1">{errors.name}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-on-light-muted uppercase tracking-wider mb-2">Kategori</label>
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="input-field w-full text-sm"
                                        required
                                    >
                                        <option value="Pomade">Pomade</option>
                                        <option value="Shampoo">Shampoo</option>
                                        <option value="Vitamin">Vitamin</option>
                                        <option value="Tonic">Tonic</option>
                                        <option value="Aksesoris">Aksesoris</option>
                                    </select>
                                    {errors.category && <p className="text-xs text-status-danger mt-1">{errors.category}</p>}
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-on-light-muted uppercase tracking-wider mb-2">Harga Jual (Rp)</label>
                                    <input
                                        type="number"
                                        value={price}
                                        onChange={(e) => setPrice(e.target.value)}
                                        className="input-field w-full text-sm"
                                        required
                                        min="0"
                                    />
                                    {errors.price && <p className="text-xs text-status-danger mt-1">{errors.price}</p>}
                                </div>
                            </div>

                            {!editingProduct && (
                                <div>
                                    <label className="block text-xs font-bold text-on-light-muted uppercase tracking-wider mb-2">Stok Awal</label>
                                    <input
                                        type="number"
                                        value={stock}
                                        onChange={(e) => setStock(e.target.value)}
                                        className="input-field w-full text-sm"
                                        required
                                        min="0"
                                    />
                                    {errors.stock && <p className="text-xs text-status-danger mt-1">{errors.stock}</p>}
                                </div>
                            )}

                            {editingProduct && (
                                <div>
                                    <label className="block text-xs font-bold text-on-light-muted uppercase tracking-wider mb-2">Status Produk</label>
                                    <select
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value)}
                                        className="input-field w-full text-sm"
                                        required
                                    >
                                        <option value="active">Aktif</option>
                                        <option value="inactive">Non-aktif</option>
                                    </select>
                                    {errors.status && <p className="text-xs text-status-danger mt-1">{errors.status}</p>}
                                </div>
                            )}

                            <div className="flex justify-end space-x-3 pt-4 border-t border-hairline-cloud">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 border border-hairline-cool rounded-lg text-xs font-bold text-on-light-muted uppercase tracking-wide transition cursor-pointer hover:bg-surface-card"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 bg-primary hover:bg-primary-dark rounded-lg text-xs font-bold text-white uppercase tracking-wide transition cursor-pointer shadow-sm"
                                >
                                    {editingProduct ? 'Simpan Perubahan' : 'Daftarkan Produk'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Mutations History Modal */}
            {showMutationsModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-2xl rounded-xl shadow-modal border border-hairline-cloud overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-hairline-cloud flex justify-between items-center bg-surface-card">
                            <div>
                                <h3 className="font-display font-bold text-lg text-ink">
                                    Riwayat Mutasi Stok
                                </h3>
                                <p className="text-xs text-on-light-muted mt-0.5">Produk: <span className="font-bold text-primary">{selectedProduct?.name}</span></p>
                            </div>
                            <button
                                onClick={() => setShowMutationsModal(false)}
                                className="text-on-light-muted hover:text-ink text-xl font-bold cursor-pointer"
                            >
                                &times;
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto max-h-[450px]">
                            {loadingMutations ? (
                                <div className="text-center py-12 text-on-light-muted font-medium">
                                    Memuat data riwayat mutasi...
                                </div>
                            ) : mutationsList.length === 0 ? (
                                <div className="text-center py-12 text-on-light-muted italic">
                                    Belum ada catatan mutasi stok untuk produk ini di cabang Anda.
                                </div>
                            ) : (
                                <table className="w-full text-left border-collapse text-xs">
                                    <thead>
                                        <tr className="border-b border-hairline-cloud text-[10px] font-bold text-on-light-muted uppercase tracking-wider pb-2">
                                            <th className="py-2">Tanggal & Waktu</th>
                                            <th className="py-2">Tipe Mutasi</th>
                                            <th className="py-2 text-right">Jumlah</th>
                                            <th className="py-2 text-right">Stok Sebelum</th>
                                            <th className="py-2 text-right">Stok Sesudah</th>
                                            <th className="py-2">Keterangan</th>
                                            <th className="py-2">Operator</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-hairline-cloud font-medium text-ink-deep">
                                        {mutationsList.map((m) => (
                                            <tr key={m.id} className="hover:bg-surface-card/20 transition">
                                                <td className="py-3 text-on-light-muted">{m.date}</td>
                                                <td className="py-3 font-semibold">
                                                    <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold ${
                                                        m.type.startsWith('in_') ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'
                                                    }`}>
                                                        {m.type_label}
                                                    </span>
                                                </td>
                                                <td className="py-3 text-right font-bold">{m.qty} pcs</td>
                                                <td className="py-3 text-right">{m.stock_before} pcs</td>
                                                <td className="py-3 text-right font-bold">{m.stock_after} pcs</td>
                                                <td className="py-3 text-on-light-muted max-w-[150px] truncate" title={m.notes}>{m.notes}</td>
                                                <td className="py-3 text-on-light-muted">{m.operator}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        <div className="p-4 border-t border-hairline-cloud bg-surface-card flex justify-end">
                            <button
                                onClick={() => setShowMutationsModal(false)}
                                className="px-5 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-xs font-bold transition cursor-pointer"
                            >
                                Selesai
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Single Stock Op (Restock / Adjust) Modal */}
            {showStockOpModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-md rounded-xl shadow-modal border border-hairline-cloud overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-hairline-cloud flex justify-between items-center bg-surface-card">
                            <h3 className="font-display font-bold text-lg text-ink">
                                {stockOpType === 'restock' ? 'Tambah Stok Masuk' : 'Penyesuaian Stok Opname'}
                            </h3>
                            <button
                                onClick={() => setShowStockOpModal(false)}
                                className="text-on-light-muted hover:text-ink text-xl font-bold cursor-pointer"
                            >
                                &times;
                            </button>
                        </div>

                        <form onSubmit={handleStockOpSubmit} className="p-6 space-y-4">
                            <div className="bg-[#f8f7ff] p-3 rounded-lg border border-hairline-cloud">
                                <p className="text-xs text-on-light-muted font-medium">Nama Produk:</p>
                                <h4 className="text-sm font-bold text-primary mt-0.5">{opProduct?.name}</h4>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-on-light-muted uppercase tracking-wider mb-2">
                                    {stockOpType === 'restock' ? 'Jumlah Stok Masuk (pcs)' : 'Jumlah Stok Aktual (pcs)'}
                                </label>
                                <input
                                    type="number"
                                    value={opQty}
                                    onChange={(e) => setOpQty(parseInt(e.target.value) || 0)}
                                    className="input-field w-full text-sm"
                                    required
                                    min="0"
                                />
                                {errors.qty && <p className="text-xs text-status-danger mt-1">{errors.qty}</p>}
                                {errors.actual_stock && <p className="text-xs text-status-danger mt-1">{errors.actual_stock}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-on-light-muted uppercase tracking-wider mb-2">Keterangan / Catatan</label>
                                <textarea
                                    value={opNotes}
                                    onChange={(e) => setOpNotes(e.target.value)}
                                    placeholder={stockOpType === 'restock' ? 'Contoh: Restok dari pusat / supplier' : 'Contoh: Koreksi stok hilang / barang rusak'}
                                    className="input-field w-full text-sm h-20 resize-none"
                                />
                                {errors.notes && <p className="text-xs text-status-danger mt-1">{errors.notes}</p>}
                            </div>

                            <div className="flex justify-end space-x-3 pt-4 border-t border-hairline-cloud">
                                <button
                                    type="button"
                                    onClick={() => setShowStockOpModal(false)}
                                    className="px-4 py-2 border border-hairline-cool rounded-lg text-xs font-bold text-on-light-muted uppercase tracking-wide transition cursor-pointer hover:bg-surface-card"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 bg-primary hover:bg-primary-dark rounded-lg text-xs font-bold text-white uppercase tracking-wide transition cursor-pointer shadow-sm"
                                >
                                    Proses Penyesuaian
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
