import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';

export default function Staff({ staff = [], branches = [] }) {
    const [showModal, setShowModal] = useState(false);
    const [editingStaff, setEditingStaff] = useState(null);

    // Form states
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('cashier');
    const [branchId, setBranchId] = useState('');
    const [commissionPercentage, setCommissionPercentage] = useState(40);
    const [photo, setPhoto] = useState(null);
    const [errors, setErrors] = useState({});

    const openCreateModal = () => {
        setEditingStaff(null);
        setName('');
        setEmail('');
        setPhone('');
        setPassword('');
        setRole('cashier');
        setBranchId(branches[0]?.id || '');
        setCommissionPercentage(40);
        setPhoto(null);
        setErrors({});
        setShowModal(true);
    };

    const openEditModal = (s) => {
        setEditingStaff(s);
        setName(s.name);
        setEmail(s.email);
        setPhone(s.phone);
        setPassword(''); // keep blank unless updating
        setRole(s.role);
        setBranchId(s.role === 'barber' ? (s.barber?.branch_id || '') : (s.branch_id || ''));
        setCommissionPercentage(s.barber ? s.barber.commission_percentage : 40);
        setPhoto(null);
        setErrors({});
        setShowModal(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setErrors({});

        const payload = {
            name,
            email,
            phone,
            role,
            branch_id: branchId,
        };

        if (role === 'barber') {
            payload.commission_percentage = commissionPercentage;
        }

        if (photo) {
            payload.photo = photo;
        }

        if (editingStaff) {
            if (password) payload.password = password;
            
            router.post(route('owner.staff.update', editingStaff.id), {
                ...payload,
                _method: 'PATCH'
            }, {
                onSuccess: () => setShowModal(false),
                onError: (errs) => setErrors(errs)
            });
        } else {
            payload.password = password;
            router.post(route('owner.staff.store'), payload, {
                onSuccess: () => setShowModal(false),
                onError: (errs) => setErrors(errs)
            });
        }
    };

    const handleDelete = (id) => {
        if (confirm('Apakah Anda yakin ingin menonaktifkan akun staff ini?')) {
            router.delete(route('owner.staff.destroy', id));
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold font-sans text-ink leading-tight">
                        Manajemen Staff & Karyawan
                    </h2>
                    <button
                        onClick={openCreateModal}
                        className="btn-accent px-5 py-2.5 flex items-center space-x-2 text-xs font-bold"
                    >
                        <span>➕ TAMBAH STAFF</span>
                    </button>
                </div>
            }
        >
            <Head title="Kelola Staff" />

            <div className="py-6 px-4 sm:px-6 lg:px-8 bg-surface-canvas-light text-ink min-h-screen">
                <div className="max-w-7xl mx-auto">
                    
                    {/* Staff List Table */}
                    <div className="bg-white border border-hairline-cloud rounded-card shadow-card overflow-hidden">
                        <div className="p-5 border-b border-hairline-cloud">
                            <h3 className="font-display font-bold text-lg text-ink-deep">Daftar Karyawan Aktif</h3>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-sm">
                                <thead>
                                    <tr className="bg-surface-card border-b border-hairline-cloud text-[11px] font-bold text-on-light-muted uppercase tracking-wider">
                                        <th className="py-4 px-6">Nama Lengkap</th>
                                        <th className="py-4 px-6">Kontak</th>
                                        <th className="py-4 px-6">Role</th>
                                        <th className="py-4 px-6">Cabang</th>
                                        <th className="py-4 px-6">Komisi (%)</th>
                                        <th className="py-4 px-6 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-hairline-cloud">
                                    {staff.length > 0 ? (
                                        staff.map((s) => (
                                            <tr key={s.id} className="hover:bg-surface-card/40 transition">
                                                 <td className="py-4 px-6 font-bold text-ink-deep flex items-center space-x-3">
                                                     <div className="w-8 h-8 rounded-full overflow-hidden bg-primary-deeper border border-hairline-cloud shrink-0 flex items-center justify-center">
                                                         {s.photo_path ? (
                                                             <img src={`/storage/${s.photo_path}`} alt={s.name} className="w-full h-full object-cover" />
                                                         ) : (
                                                             <span className="text-xs font-bold text-accent-violet-deep">{s.name.substring(0, 1)}</span>
                                                         )}
                                                     </div>
                                                     <span>{s.name}</span>
                                                 </td>
                                                <td className="py-4 px-6">
                                                    <span className="block text-ink">{s.email}</span>
                                                    <span className="text-xs text-on-light-muted">{s.phone}</span>
                                                </td>
                                                <td className="py-4 px-6 capitalize">
                                                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                                        s.role === 'barber' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                                                    }`}>
                                                        {s.role}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6 text-on-light-muted">{s.role === 'barber' ? (s.barber?.branch?.name || '-') : (s.branch?.name || '-')}</td>
                                                <td className="py-4 px-6 font-semibold">
                                                    {s.role === 'barber' && s.barber ? `${s.barber.commission_percentage}%` : '-'}
                                                </td>
                                                <td className="py-4 px-6 text-right space-x-2">
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
                                                        Nonaktif
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="6" className="py-12 text-center text-on-light-muted italic">
                                                Belum ada staff terdaftar. Silahkan klik tambah staff.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </div>

            {/* Create / Edit Staff Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-md rounded-xl shadow-modal border border-hairline-cloud overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-hairline-cloud flex justify-between items-center bg-surface-card">
                            <h3 className="font-display font-bold text-lg text-ink">
                                {editingStaff ? 'Edit Data Staff' : 'Tambah Staff Baru'}
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
                                <div className="w-14 h-14 rounded-full overflow-hidden bg-primary-deeper border border-hairline-violet shrink-0 flex items-center justify-center">
                                    {photo ? (
                                        <img src={URL.createObjectURL(photo)} className="w-full h-full object-cover" />
                                    ) : editingStaff?.photo_path ? (
                                        <img src={`/storage/${editingStaff.photo_path}`} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-xl font-bold text-accent-violet">👤</span>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <label className="block text-[10px] font-bold text-on-light-muted uppercase tracking-wider mb-1">
                                        Foto Profil
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
                                <label className="block text-xs font-bold text-on-light-muted uppercase tracking-wider mb-2">Nama Lengkap</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="input-field w-full text-sm"
                                    placeholder="Masukkan nama"
                                    required
                                />
                                {errors.name && <p className="text-xs text-status-danger mt-1">{errors.name}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-on-light-muted uppercase tracking-wider mb-2">Email</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="input-field w-full text-sm"
                                        placeholder="email@howell.com"
                                        required
                                    />
                                    {errors.email && <p className="text-xs text-status-danger mt-1">{errors.email}</p>}
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-on-light-muted uppercase tracking-wider mb-2">No HP</label>
                                    <input
                                        type="text"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="input-field w-full text-sm"
                                        placeholder="0812..."
                                        required
                                    />
                                    {errors.phone && <p className="text-xs text-status-danger mt-1">{errors.phone}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-on-light-muted uppercase tracking-wider mb-2">Role Akses</label>
                                    <select
                                        value={role}
                                        onChange={(e) => setRole(e.target.value)}
                                        disabled={!!editingStaff} // Role can't be changed after creation
                                        className="input-field w-full text-sm disabled:bg-surface-card disabled:text-on-light-faint"
                                        required
                                    >
                                        <option value="cashier">Cashier</option>
                                        <option value="barber">Barber</option>
                                    </select>
                                    {errors.role && <p className="text-xs text-status-danger mt-1">{errors.role}</p>}
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-on-light-muted uppercase tracking-wider mb-2">Cabang Kerja</label>
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
                            </div>

                            {role === 'barber' && (
                                <div>
                                    <label className="block text-xs font-bold text-on-light-muted uppercase tracking-wider mb-2">Persentase Komisi (%)</label>
                                    <input
                                        type="number"
                                        value={commissionPercentage}
                                        onChange={(e) => setCommissionPercentage(e.target.value)}
                                        className="input-field w-full text-sm"
                                        min="0"
                                        max="100"
                                        placeholder="Contoh: 40"
                                        required
                                    />
                                    {errors.commission_percentage && <p className="text-xs text-status-danger mt-1">{errors.commission_percentage}</p>}
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-on-light-muted uppercase tracking-wider mb-2">
                                    {editingStaff ? 'Ubah Password (Kosongkan jika tidak diganti)' : 'Password'}
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="input-field w-full text-sm"
                                    placeholder="Password"
                                    required={!editingStaff}
                                />
                                {errors.password && <p className="text-xs text-status-danger mt-1">{errors.password}</p>}
                            </div>

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
                                    SIMPAN STAFF
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
