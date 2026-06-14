import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';

export default function Services({ services = [], barbers = [], overrides = [] }) {
    const [showModal, setShowModal] = useState(false);
    const [editingService, setEditingService] = useState(null);

    // Form states
    const [name, setName] = useState('');
    const [category, setCategory] = useState('Haircut');
    const [description, setDescription] = useState('');
    const [durationMinutes, setDurationMinutes] = useState(30);
    const [defaultPrice, setDefaultPrice] = useState(50000);
    const [status, setStatus] = useState('active');
    const [photo, setPhoto] = useState(null);
    const [errors, setErrors] = useState({});

    // Override price states
    const [showOverrideModal, setShowOverrideModal] = useState(false);
    const [selectedBarber, setSelectedBarber] = useState('');
    const [selectedService, setSelectedService] = useState('');
    const [overridePrice, setOverridePrice] = useState('');
    const [overrideErrors, setOverrideErrors] = useState({});

    const openCreateModal = () => {
        setEditingService(null);
        setName('');
        setCategory('Haircut');
        setDescription('');
        setDurationMinutes(30);
        setDefaultPrice(50000);
        setStatus('active');
        setPhoto(null);
        setErrors({});
        setShowModal(true);
    };

    const openEditModal = (s) => {
        setEditingService(s);
        setName(s.name);
        setCategory(s.category);
        setDescription(s.description || '');
        setDurationMinutes(s.duration_minutes);
        setDefaultPrice(s.default_price);
        setStatus(s.status);
        setPhoto(null);
        setErrors({});
        setShowModal(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setErrors({});

        const payload = {
            name,
            category,
            description,
            duration_minutes: durationMinutes,
            default_price: defaultPrice,
            status,
        };

        if (photo) {
            payload.photo = photo;
        }

        if (editingService) {
            router.post(route('owner.services.update', editingService.id), {
                ...payload,
                _method: 'PATCH'
            }, {
                onSuccess: () => setShowModal(false),
                onError: (errs) => setErrors(errs)
            });
        } else {
            router.post(route('owner.services.store'), payload, {
                onSuccess: () => setShowModal(false),
                onError: (errs) => setErrors(errs)
            });
        }
    };

    const handleDelete = (id) => {
        if (confirm('Apakah Anda yakin ingin menonaktifkan layanan ini?')) {
            router.delete(route('owner.services.destroy', id));
        }
    };

    // Override prices methods
    const handleOverrideSubmit = (e) => {
        e.preventDefault();
        setOverrideErrors({});

        router.post(route('owner.services.override.store'), {
            barber_id: selectedBarber,
            service_id: selectedService,
            price: overridePrice,
        }, {
            onSuccess: () => {
                setShowOverrideModal(false);
                setSelectedBarber('');
                setSelectedService('');
                setOverridePrice('');
            },
            onError: (errs) => setOverrideErrors(errs)
        });
    };

    const handleDeleteOverride = (barberId, serviceId) => {
        if (confirm('Hapus harga override? Layanan untuk barber ini akan menggunakan harga default kembali.')) {
            router.delete(route('owner.services.override.destroy'), {
                data: { barber_id: barberId, service_id: serviceId }
            });
        }
    };

    // Helper to match override record info
    const getOverrideDetails = () => {
        return overrides.map(o => {
            const barber = barbers.find(b => b.id === o.barber_id);
            const service = services.find(s => s.id === o.service_id);
            return {
                barber_id: o.barber_id,
                service_id: o.service_id,
                barber_name: barber ? barber.name : '-',
                service_name: service ? service.name : '-',
                price: parseFloat(o.price),
            };
        });
    };

    const overrideList = getOverrideDetails();

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold font-sans text-ink leading-tight">
                        Manajemen Layanan & Override Harga Barber
                    </h2>
                    <div className="space-x-3">
                        <button
                            onClick={() => setShowOverrideModal(true)}
                            className="px-4 py-2.5 border border-hairline-cool text-accent-violet rounded text-xs font-semibold hover:bg-surface-card"
                        >
                            🏷️ OVERRIDE HARGA BARBER
                        </button>
                        <button
                            onClick={openCreateModal}
                            className="btn-accent px-5 py-2.5 text-xs font-bold shadow-md"
                        >
                            ➕ TAMBAH LAYANAN
                        </button>
                    </div>
                </div>
            }
        >
            <Head title="Kelola Layanan" />

            <div className="py-6 px-4 sm:px-6 lg:px-8 bg-surface-canvas-light text-ink min-h-screen space-y-8">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Left: Services List Table */}
                    <div className="lg:col-span-2 bg-white border border-hairline-cloud rounded-card shadow-card overflow-hidden">
                        <div className="p-5 border-b border-hairline-cloud">
                            <h3 className="font-display font-bold text-lg text-ink-deep">Katalog Layanan Utama</h3>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-sm">
                                <thead>
                                    <tr className="bg-surface-card border-b border-hairline-cloud text-[11px] font-bold text-on-light-muted uppercase tracking-wider">
                                        <th className="py-4 px-6">Layanan</th>
                                        <th className="py-4 px-6">Kategori</th>
                                        <th className="py-4 px-6">Durasi</th>
                                        <th className="py-4 px-6">Harga Default</th>
                                        <th className="py-4 px-6 text-center">Status</th>
                                        <th className="py-4 px-6 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-hairline-cloud">
                                    {services.length > 0 ? (
                                        services.map((s) => (
                                            <tr key={s.id} className="hover:bg-surface-card/40 transition">
                                                <td className="py-4 px-6 flex items-center space-x-3">
                                                    <div className="w-10 h-10 rounded overflow-hidden bg-primary-deeper border border-hairline-cloud shrink-0 flex items-center justify-center">
                                                        {s.photo_path ? (
                                                            <img src={`/storage/${s.photo_path}`} alt={s.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <span className="text-sm">✂️</span>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <span className="font-bold block text-ink-deep">{s.name}</span>
                                                        <span className="text-xs text-on-light-muted line-clamp-1">{s.description || '-'}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <span className="px-2 py-0.5 rounded bg-primary/5 text-accent-violet-deep text-[10px] font-bold uppercase tracking-wider">
                                                        {s.category}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6 text-on-light-muted">{s.duration_minutes} Menit</td>
                                                <td className="py-4 px-6 font-bold text-ink-deep">
                                                    Rp {new Intl.NumberFormat('id-ID').format(s.default_price)}
                                                </td>
                                                <td className="py-4 px-6 text-center">
                                                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                                        s.status === 'active' ? 'bg-green-100 text-status-success' : 'bg-red-100 text-status-danger'
                                                    }`}>
                                                        {s.status}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6 text-right space-x-2 shrink-0">
                                                    <button
                                                        onClick={() => openEditModal(s)}
                                                        className="px-3 py-1.5 rounded border border-hairline-cool text-accent-violet text-xs font-semibold hover:bg-surface-card transition"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(s.id)}
                                                        className="px-3 py-1.5 rounded border border-status-danger text-status-danger text-xs font-medium hover:bg-red-50 transition"
                                                    >
                                                        Hapus
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="6" className="py-12 text-center text-on-light-muted italic">
                                                Belum ada layanan terdaftar.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Right: Override Pricing List */}
                    <div className="bg-white border border-hairline-cloud rounded-card shadow-card overflow-hidden h-fit">
                        <div className="p-5 border-b border-hairline-cloud">
                            <h3 className="font-display font-bold text-lg text-ink-deep">Harga Override Barber</h3>
                            <p className="text-xs text-on-light-muted mt-1">
                                Penyesuaian tarif khusus berdasarkan keahlian barber senior.
                            </p>
                        </div>

                        <div className="divide-y divide-hairline-cloud max-h-96 overflow-y-auto">
                            {overrideList.length > 0 ? (
                                overrideList.map((item, idx) => (
                                    <div key={idx} className="p-4 flex justify-between items-center text-xs">
                                        <div>
                                            <h4 className="font-bold text-ink-deep">{item.barber_name}</h4>
                                            <p className="text-on-light-muted mt-0.5">{item.service_name}</p>
                                            <span className="font-bold text-accent-violet-deep mt-1 block">
                                                Rp {new Intl.NumberFormat('id-ID').format(item.price)}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteOverride(item.barber_id, item.service_id)}
                                            className="text-status-danger hover:text-red-600 p-1 font-bold text-sm"
                                            title="Hapus Override"
                                        >
                                            &times;
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-on-light-muted italic text-center py-8">
                                    Belum ada penyesuaian harga khusus barber.
                                </p>
                            )}
                        </div>
                    </div>

                </div>
            </div>

            {/* Create / Edit Service Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-md rounded-xl shadow-modal border border-hairline-cloud overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-hairline-cloud flex justify-between items-center bg-surface-card">
                            <h3 className="font-display font-bold text-lg text-ink">
                                {editingService ? 'Edit Layanan' : 'Buat Layanan Baru'}
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
                                    ) : editingService?.photo_path ? (
                                        <img src={`/storage/${editingService.photo_path}`} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-xl">✂️</span>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <label className="block text-[10px] font-bold text-on-light-muted uppercase tracking-wider mb-1">
                                        Foto Layanan
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
                                <label className="block text-xs font-bold text-on-light-muted uppercase tracking-wider mb-2">Nama Layanan</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="input-field w-full text-sm"
                                    placeholder="Contoh: Premium Haircut"
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
                                        <option value="Haircut">Haircut</option>
                                        <option value="Coloring">Coloring</option>
                                        <option value="Treatment">Treatment</option>
                                    </select>
                                    {errors.category && <p className="text-xs text-status-danger mt-1">{errors.category}</p>}
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-on-light-muted uppercase tracking-wider mb-2">Durasi (Menit)</label>
                                    <input
                                        type="number"
                                        value={durationMinutes}
                                        onChange={(e) => setDurationMinutes(e.target.value)}
                                        className="input-field w-full text-sm"
                                        min="5"
                                        required
                                    />
                                    {errors.duration_minutes && <p className="text-xs text-status-danger mt-1">{errors.duration_minutes}</p>}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-on-light-muted uppercase tracking-wider mb-2">Harga Default</label>
                                <input
                                    type="number"
                                    value={defaultPrice}
                                    onChange={(e) => setDefaultPrice(e.target.value)}
                                    className="input-field w-full text-sm"
                                    min="0"
                                    placeholder="Contoh: 75000"
                                    required
                                />
                                {errors.default_price && <p className="text-xs text-status-danger mt-1">{errors.default_price}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-on-light-muted uppercase tracking-wider mb-2">Deskripsi Layanan</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="input-field w-full text-sm h-20 resize-none"
                                    placeholder="Deskripsi singkat mengenai detail layanan..."
                                />
                            </div>

                            {editingService && (
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

            {/* Set Override Price Modal */}
            {showOverrideModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-sm rounded-xl shadow-modal border border-hairline-cloud overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-hairline-cloud flex justify-between items-center bg-surface-card">
                            <h3 className="font-display font-bold text-base text-ink">Set Override Tarif Barber</h3>
                            <button
                                onClick={() => setShowOverrideModal(false)}
                                className="text-on-light-muted hover:text-ink text-xl font-bold"
                            >
                                &times;
                            </button>
                        </div>

                        <form onSubmit={handleOverrideSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-on-light-muted uppercase tracking-wider mb-2">1. Pilih Barber</label>
                                <select
                                    value={selectedBarber}
                                    onChange={(e) => setSelectedBarber(e.target.value)}
                                    className="input-field w-full text-sm"
                                    required
                                >
                                    <option value="">-- Pilih Barber --</option>
                                    {barbers.map(b => (
                                        <option key={b.id} value={b.id}>{b.name}</option>
                                    ))}
                                </select>
                                {overrideErrors.barber_id && <p className="text-xs text-status-danger mt-1">{overrideErrors.barber_id}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-on-light-muted uppercase tracking-wider mb-2">2. Pilih Layanan</label>
                                <select
                                    value={selectedService}
                                    onChange={(e) => setSelectedService(e.target.value)}
                                    className="input-field w-full text-sm"
                                    required
                                >
                                    <option value="">-- Pilih Layanan --</option>
                                    {services.map(s => (
                                        <option key={s.id} value={s.id}>{s.name} (Default: Rp {new Intl.NumberFormat('id-ID').format(s.default_price)})</option>
                                    ))}
                                </select>
                                {overrideErrors.service_id && <p className="text-xs text-status-danger mt-1">{overrideErrors.service_id}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-on-light-muted uppercase tracking-wider mb-2">3. Tarif Khusus Baru</label>
                                <input
                                    type="number"
                                    value={overridePrice}
                                    onChange={(e) => setOverridePrice(e.target.value)}
                                    className="input-field w-full text-sm"
                                    min="0"
                                    placeholder="Contoh: 90000"
                                    required
                                />
                                {overrideErrors.price && <p className="text-xs text-status-danger mt-1">{overrideErrors.price}</p>}
                            </div>

                            {/* Submit Button */}
                            <div className="border-t border-hairline-cloud pt-4 flex justify-end space-x-2">
                                <button
                                    type="button"
                                    onClick={() => setShowOverrideModal(false)}
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
