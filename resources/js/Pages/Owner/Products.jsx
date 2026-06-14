import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';

export default function Products({ products = [], branches = [] }) {
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);

    // Form states
    const [branchId, setBranchId] = useState('');
    const [name, setName] = useState('');
    const [category, setCategory] = useState('Pomade');
    const [price, setPrice] = useState(100000);
    const [stock, setStock] = useState(10);
    const [status, setStatus] = useState('active');
    const [photo, setPhoto] = useState(null);
    const [errors, setErrors] = useState({});

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
                                                    <span className={`font-bold ${p.stock <= 5 ? 'text-status-danger' : 'text-ink'}`}>
                                                        {p.stock} pcs
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6 text-center">
                                                    <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                                                        p.status === 'active' ? 'bg-green-100 text-status-success' : 'bg-red-100 text-status-danger'
                                                    }`}>
                                                        {p.status}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6 text-right space-x-2">
                                                    <button
                                                        onClick={() => openEditModal(p)}
                                                        className="px-3 py-1.5 rounded border border-hairline-cool text-accent-violet text-xs font-semibold hover:bg-surface-card transition"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(p.id)}
                                                        className="px-3 py-1.5 rounded border border-status-danger text-status-danger text-xs font-medium hover:bg-red-50 transition"
                                                    >
                                                        Hapus
                                                    </button>
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
        </AuthenticatedLayout>
    );
}
