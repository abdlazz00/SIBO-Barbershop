import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import axios from 'axios';

export default function Products({ products = [], branches = [] }) {
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [activeDropdownId, setActiveDropdownId] = useState(null);

    // Form states
    const [branchId, setBranchId] = useState('');
    const [name, setName] = useState('');
    const [category, setCategory] = useState('Pomade');
    const [price, setPrice] = useState(100000);
    const [stock, setStock] = useState(10);
    const [status, setStatus] = useState('active');
    const [photo, setPhoto] = useState(null);
    const [errors, setErrors] = useState({});

    // Restock Modal states
    const [showRestockModal, setShowRestockModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [restockQty, setRestockQty] = useState(5);
    const [restockNotes, setRestockNotes] = useState('');
    const [processingRestock, setProcessingRestock] = useState(false);

    // Opname Modal states
    const [showOpnameModal, setShowOpnameModal] = useState(false);
    const [opnameActual, setOpnameActual] = useState(0);
    const [opnameNotes, setOpnameNotes] = useState('');
    const [processingOpname, setProcessingOpname] = useState(false);

    // Mutations Modal states
    const [showMutationsModal, setShowMutationsModal] = useState(false);
    const [mutationsList, setMutationsList] = useState([]);
    const [loadingMutations, setLoadingMutations] = useState(false);

    const openCreateModal = () => {
        setEditingProduct(null);
        setBranchId(branches[0]?.id || '');
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
        setBranchId(p.branch_id);
        setName(p.name);
        setCategory(p.category);
        setPrice(p.price);
        setStock(p.stock);
        setStatus(p.status);
        setPhoto(null);
        setErrors({});
        setShowModal(true);
    };

    const openRestockModal = (p) => {
        setSelectedProduct(p);
        setRestockQty(5);
        setRestockNotes('');
        setShowRestockModal(true);
    };

    const openOpnameModal = (p) => {
        setSelectedProduct(p);
        setOpnameActual(p.stock);
        setOpnameNotes('');
        setShowOpnameModal(true);
    };

    const openMutationsModal = (p) => {
        setSelectedProduct(p);
        setShowMutationsModal(true);
        setLoadingMutations(true);
        setMutationsList([]);

        axios.get(route('owner.products.mutations', p.id))
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

    const handleSubmit = (e) => {
        e.preventDefault();
        setErrors({});

        const payload = {
            branch_id: branchId,
            name,
            category,
            price,
            stock,
            status,
        };

        if (photo) {
            payload.photo = photo;
        }

        if (editingProduct) {
            router.post(route('owner.products.update', editingProduct.id), {
                ...payload,
                _method: 'PATCH'
            }, {
                onSuccess: () => setShowModal(false),
                onError: (errs) => setErrors(errs)
            });
        } else {
            router.post(route('owner.products.store'), payload, {
                onSuccess: () => setShowModal(false),
                onError: (errs) => setErrors(errs)
            });
        }
    };

    const handleRestockSubmit = (e) => {
        e.preventDefault();
        setProcessingRestock(true);
        router.post(route('owner.products.restock', selectedProduct.id), {
            qty: restockQty,
            notes: restockNotes
        }, {
            onSuccess: () => {
                setShowRestockModal(false);
                setProcessingRestock(false);
            },
            onError: () => {
                setProcessingRestock(false);
            }
        });
    };

    const handleOpnameSubmit = (e) => {
        e.preventDefault();
        setProcessingOpname(true);
        router.post(route('owner.products.adjust', selectedProduct.id), {
            actual_stock: opnameActual,
            notes: opnameNotes
        }, {
            onSuccess: () => {
                setShowOpnameModal(false);
                setProcessingOpname(false);
            },
            onError: () => {
                setProcessingOpname(false);
            }
        });
    };

    const handleDelete = (id) => {
        if (confirm('Apakah Anda yakin ingin menonaktifkan produk ini?')) {
            router.delete(route('owner.products.destroy', id));
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold font-sans text-ink leading-tight">
                        Manajemen Produk Retail Per Cabang
                    </h2>
                    <button
                        onClick={openCreateModal}
                        className="btn-accent px-5 py-2.5 flex items-center space-x-2 text-xs font-bold shadow-md"
                    >
                        <span>➕ TAMBAH PRODUK</span>
                    </button>
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
                                        <th className="py-4 px-6">Cabang</th>
                                        <th className="py-4 px-6">Kategori</th>
                                        <th className="py-4 px-6">Harga</th>
                                        <th className="py-4 px-6">Stok</th>
                                        <th className="py-4 px-6 text-center">Status</th>
                                        <th className="py-4 px-6 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-hairline-cloud">
                                    {products.length > 0 ? (
                                        products.map((p) => (
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
                                                <td className="py-4 px-6 text-on-light-muted">{p.branch?.name || '-'}</td>
                                                <td className="py-4 px-6">
                                                    <span className="px-2.5 py-0.5 rounded bg-primary/5 text-accent-violet-deep text-[10px] font-bold uppercase tracking-wider">
                                                        {p.category}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6 font-semibold">
                                                    Rp {new Intl.NumberFormat('id-ID').format(p.price)}
                                                </td>
                                                <td className="py-4 px-6">
                                                    <span className={`font-bold ${p.stock <= 5 ? 'text-booking-cancelled' : 'text-ink'}`}>
                                                        {p.stock} pcs
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6 text-center">
                                                    <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                                                        p.status === 'active' ? 'bg-green-50 border border-green-200 text-booking-completed' : 'bg-red-50 border border-red-200 text-booking-cancelled'
                                                    }`}>
                                                        {p.status}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6 text-right relative">
                                                    <div className="inline-block text-left">
                                                        <button 
                                                            onClick={() => setActiveDropdownId(activeDropdownId === p.id ? null : p.id)}
                                                            className="px-3 py-1.5 rounded bg-surface-card border border-hairline-cool text-ink hover:bg-surface-press-light transition text-xs font-bold flex items-center space-x-1 ml-auto"
                                                        >
                                                            <span>Pilihan</span>
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3 opacity-70">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                                                            </svg>
                                                        </button>
                                                        {activeDropdownId === p.id && (
                                                            <>
                                                                <div 
                                                                    className="fixed inset-0 z-10" 
                                                                    onClick={() => setActiveDropdownId(null)}
                                                                />
                                                                <div className="absolute right-0 mt-1 w-40 rounded-md shadow-lg bg-white border border-hairline-cloud z-20 py-1 divide-y divide-hairline-cloud/50 text-xs text-left animate-in fade-in slide-in-from-top-1 duration-100">
                                                                    <div className="py-1">
                                                                        <button
                                                                            onClick={() => { openRestockModal(p); setActiveDropdownId(null); }}
                                                                            className="w-full text-left px-4 py-2 hover:bg-green-50 text-booking-completed font-semibold flex items-center gap-2"
                                                                        >
                                                                            <span>➕</span>
                                                                            <span>Stok Masuk</span>
                                                                        </button>
                                                                        <button
                                                                            onClick={() => { openOpnameModal(p); setActiveDropdownId(null); }}
                                                                            className="w-full text-left px-4 py-2 hover:bg-amber-50 text-booking-in-progress font-semibold flex items-center gap-2"
                                                                        >
                                                                            <span>⚙️</span>
                                                                            <span>Stok Opname</span>
                                                                        </button>
                                                                        <button
                                                                            onClick={() => { openMutationsModal(p); setActiveDropdownId(null); }}
                                                                            className="w-full text-left px-4 py-2 hover:bg-blue-50 text-booking-confirmed font-semibold flex items-center gap-2"
                                                                        >
                                                                            <span>📜</span>
                                                                            <span>Log Mutasi</span>
                                                                        </button>
                                                                    </div>
                                                                    <div className="py-1">
                                                                        <button
                                                                            onClick={() => { openEditModal(p); setActiveDropdownId(null); }}
                                                                            className="w-full text-left px-4 py-2 hover:bg-surface-card text-accent-violet-deep font-semibold flex items-center gap-2"
                                                                        >
                                                                            <span>✏️</span>
                                                                            <span>Edit Produk</span>
                                                                        </button>
                                                                        <button
                                                                            onClick={() => { handleDelete(p.id); setActiveDropdownId(null); }}
                                                                            className="w-full text-left px-4 py-2 hover:bg-red-50 text-status-danger font-semibold flex items-center gap-2"
                                                                        >
                                                                            <span>❌</span>
                                                                            <span>Hapus Produk</span>
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="7" className="py-12 text-center text-on-light-muted italic">
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
                                className="text-on-light-muted hover:text-ink text-xl font-bold"
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
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-on-light-muted uppercase tracking-wider mb-2">Pilih Cabang</label>
                                    <select
                                        value={branchId}
                                        onChange={(e) => setBranchId(e.target.value)}
                                        className="input-field w-full text-sm"
                                        required
                                    >
                                        <option value="">-- Pilih --</option>
                                        {branches.map(b => (
                                            <option key={b.id} value={b.id}>{b.name}</option>
                                        ))}
                                    </select>
                                    {errors.branch_id && <p className="text-xs text-status-danger mt-1">{errors.branch_id}</p>}
                                </div>
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
                                        <option value="Aksesoris">Aksesoris</option>
                                    </select>
                                    {errors.category && <p className="text-xs text-status-danger mt-1">{errors.category}</p>}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-on-light-muted uppercase tracking-wider mb-2">Nama Produk</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="input-field w-full text-sm"
                                    placeholder="Contoh: Premium Strong Hold Pomade"
                                    required
                                />
                                {errors.name && <p className="text-xs text-status-danger mt-1">{errors.name}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-on-light-muted uppercase tracking-wider mb-2">Harga Jual</label>
                                    <input
                                        type="number"
                                        value={price}
                                        onChange={(e) => setPrice(e.target.value)}
                                        className="input-field w-full text-sm"
                                        min="0"
                                        placeholder="Contoh: 120000"
                                        required
                                    />
                                    {errors.price && <p className="text-xs text-status-danger mt-1">{errors.price}</p>}
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-on-light-muted uppercase tracking-wider mb-2">Stok Awal</label>
                                    <input
                                        type="number"
                                        value={stock}
                                        onChange={(e) => setStock(e.target.value)}
                                        className="input-field w-full text-sm"
                                        min="0"
                                        required
                                        disabled={!!editingProduct}
                                    />
                                    {errors.stock && <p className="text-xs text-status-danger mt-1">{errors.stock}</p>}
                                </div>
                            </div>

                            {editingProduct && (
                                <div>
                                    <label className="block text-xs font-bold text-on-light-muted uppercase tracking-wider mb-2">Status</label>
                                    <select
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value)}
                                        className="input-field w-full text-sm"
                                        required
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>
                            )}

                            {/* Submit Button */}
                            <div className="border-t border-hairline-cloud pt-4 flex justify-end space-x-2">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 border border-hairline-cool rounded-md text-xs font-semibold text-on-light-muted hover:bg-surface-card"
                                >
                                    BATAL
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 bg-primary text-white text-xs font-bold rounded-md hover:bg-primary-dark transition"
                                >
                                    SIMPAN
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Restock (Stok Masuk) Modal */}
            {showRestockModal && selectedProduct && (
                <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-sm rounded-xl shadow-modal border border-hairline-cloud overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-5 border-b border-hairline-cloud bg-surface-card flex justify-between items-center text-ink">
                            <div>
                                <h3 className="font-display font-bold text-base text-ink-deep">Stok Masuk (Restock)</h3>
                                <p className="text-[10px] text-on-light-muted mt-0.5">{selectedProduct.name}</p>
                            </div>
                            <button onClick={() => setShowRestockModal(false)} className="text-on-light-muted hover:text-ink font-bold text-lg">&times;</button>
                        </div>
                        <form onSubmit={handleRestockSubmit} className="p-5 space-y-4 text-xs text-ink">
                            <div>
                                <label className="block font-bold text-on-light-muted uppercase tracking-wider mb-2">Jumlah Stok Masuk</label>
                                <input 
                                    type="number"
                                    min="1"
                                    value={restockQty}
                                    onChange={(e) => setRestockQty(parseInt(e.target.value) || 1)}
                                    className="input-field w-full text-xs"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block font-bold text-on-light-muted uppercase tracking-wider mb-2">Catatan (Opsional)</label>
                                <textarea 
                                    rows="2"
                                    value={restockNotes}
                                    onChange={(e) => setRestockNotes(e.target.value)}
                                    placeholder="Contoh: Pengiriman supplier, Restock bulanan"
                                    className="input-field w-full text-xs"
                                />
                            </div>
                            <div className="border-t border-hairline-cloud pt-4 flex justify-end space-x-2">
                                <button 
                                    type="button" 
                                    onClick={() => setShowRestockModal(false)}
                                    className="px-4 py-2 border border-hairline-cool rounded text-on-light-muted hover:bg-surface-card text-xs font-semibold"
                                >
                                    Batal
                                </button>
                                <button 
                                    type="submit"
                                    disabled={processingRestock}
                                    className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark transition text-xs font-bold disabled:opacity-55"
                                >
                                    {processingRestock ? 'Memproses...' : 'Tambah Stok'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Opname (Adjustment) Modal */}
            {showOpnameModal && selectedProduct && (
                <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-sm rounded-xl shadow-modal border border-hairline-cloud overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-5 border-b border-hairline-cloud bg-surface-card flex justify-between items-center text-ink">
                            <div>
                                <h3 className="font-display font-bold text-base text-ink-deep">Koreksi Stok Opname</h3>
                                <p className="text-[10px] text-on-light-muted mt-0.5">{selectedProduct.name}</p>
                            </div>
                            <button onClick={() => setShowOpnameModal(false)} className="text-on-light-muted hover:text-ink font-bold text-lg">&times;</button>
                        </div>
                        <form onSubmit={handleOpnameSubmit} className="p-5 space-y-4 text-xs text-ink">
                            <div className="bg-surface-card p-3 rounded border border-hairline-cloud mb-2 flex justify-between items-center text-[11px]">
                                <span className="text-on-light-muted font-medium">Stok Sistem Saat Ini:</span>
                                <span className="font-bold text-ink-deep">{selectedProduct.stock} pcs</span>
                            </div>
                            <div>
                                <label className="block font-bold text-on-light-muted uppercase tracking-wider mb-2">Stok Fisik Sebenarnya</label>
                                <input 
                                    type="number"
                                    min="0"
                                    value={opnameActual}
                                    onChange={(e) => setOpnameActual(parseInt(e.target.value) || 0)}
                                    className="input-field w-full text-xs"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block font-bold text-on-light-muted uppercase tracking-wider mb-2">Alasan Koreksi / Catatan</label>
                                <textarea 
                                    rows="2"
                                    value={opnameNotes}
                                    onChange={(e) => setOpnameNotes(e.target.value)}
                                    placeholder="Contoh: Selisih stock opname bulanan, Pecah di display"
                                    className="input-field w-full text-xs"
                                    required
                                />
                            </div>
                            <div className="border-t border-hairline-cloud pt-4 flex justify-end space-x-2">
                                <button 
                                    type="button" 
                                    onClick={() => setShowOpnameModal(false)}
                                    className="px-4 py-2 border border-hairline-cool rounded text-on-light-muted hover:bg-surface-card text-xs font-semibold"
                                >
                                    Batal
                                </button>
                                <button 
                                    type="submit"
                                    disabled={processingOpname}
                                    className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark transition text-xs font-bold disabled:opacity-55"
                                >
                                    {processingOpname ? 'Memproses...' : 'Simpan Penyesuaian'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Mutations History (Log) Modal */}
            {showMutationsModal && selectedProduct && (
                <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-2xl rounded-xl shadow-modal border border-hairline-cloud overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-ink">
                        <div className="p-5 border-b border-hairline-cloud bg-surface-card flex justify-between items-center">
                            <div>
                                <h3 className="font-display font-bold text-base text-ink-deep">Histori Mutasi Stok</h3>
                                <p className="text-[10px] text-on-light-muted mt-0.5">{selectedProduct.name}</p>
                            </div>
                            <button onClick={() => setShowMutationsModal(false)} className="text-on-light-muted hover:text-ink font-bold text-lg">&times;</button>
                        </div>
                        <div className="p-5 max-h-[60vh] overflow-y-auto">
                            {loadingMutations ? (
                                <div className="text-center py-8">
                                    <div className="w-6 h-6 border-2 border-accent-violet border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                                    <p className="text-xs text-on-light-muted">Mengambil riwayat mutasi...</p>
                                </div>
                            ) : mutationsList.length > 0 ? (
                                <div className="overflow-x-auto border border-hairline-cloud rounded-card">
                                    <table className="w-full text-left border-collapse text-[10px] font-sans">
                                        <thead>
                                            <tr className="bg-surface-card border-b border-hairline-cloud font-bold text-on-light-muted uppercase tracking-wider text-left">
                                                <th className="py-2.5 px-3">Tanggal</th>
                                                <th className="py-2.5 px-3">Tipe Aktivitas</th>
                                                <th className="py-2.5 px-3 text-center">Jumlah</th>
                                                <th className="py-2.5 px-3 text-center">Sebelum → Sesudah</th>
                                                <th className="py-2.5 px-3">Catatan</th>
                                                <th className="py-2.5 px-3">Operator</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-hairline-cloud text-ink-deep">
                                            {mutationsList.map((m) => (
                                                <tr key={m.id} className="hover:bg-surface-card/40 transition">
                                                    <td className="py-2.5 px-3 text-on-light-muted font-mono">{m.date}</td>
                                                    <td className="py-2.5 px-3">
                                                        <span className={`inline-block px-1.5 py-0.5 rounded-[3px] text-[8px] font-bold uppercase ${
                                                            m.type.startsWith('in_') ? 'bg-green-50 text-booking-completed border border-green-200/50' : 'bg-red-50 text-booking-cancelled border border-red-200/50'
                                                        }`}>
                                                            {m.type_label}
                                                        </span>
                                                    </td>
                                                    <td className="py-2.5 px-3 text-center font-bold">
                                                        {m.type.startsWith('in_') ? `+${m.qty}` : `-${m.qty}`}
                                                    </td>
                                                    <td className="py-2.5 px-3 text-center font-mono font-medium text-on-light-muted">
                                                        {m.stock_before} → <span className="font-bold text-ink-deep">{m.stock_after}</span>
                                                    </td>
                                                    <td className="py-2.5 px-3 max-w-[150px] truncate" title={m.notes}>{m.notes}</td>
                                                    <td className="py-2.5 px-3 text-on-light-muted font-medium">{m.operator}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-xs text-on-light-muted italic text-center py-6">
                                    Belum ada catatan mutasi stok untuk produk ini.
                                </p>
                            )}
                        </div>
                        <div className="p-4 border-t border-hairline-cloud bg-surface-card flex justify-end">
                            <button 
                                onClick={() => setShowMutationsModal(false)} 
                                className="px-5 py-1.5 bg-ink-deep text-white rounded font-sans font-bold text-xs hover:bg-ink-press transition"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
