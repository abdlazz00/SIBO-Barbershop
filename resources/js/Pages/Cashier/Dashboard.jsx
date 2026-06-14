import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Dashboard({ bookings = [], barbers = [], services = [], products = [], branch, stats, filters }) {
    // Search and filter states
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');
    const [barberId, setBarberId] = useState(filters.barber_id || '');
    const [date, setDate] = useState(filters.date || new Date().toISOString().split('T')[0]);

    // Walk-in booking states
    const [showWalkInModal, setShowWalkInModal] = useState(false);
    const [customerType, setCustomerType] = useState('guest');
    const [guestName, setGuestName] = useState('');
    const [guestPhone, setGuestPhone] = useState('');
    const [memberPhone, setMemberPhone] = useState('');
    const [foundMember, setFoundMember] = useState(null);
    const [searchingMember, setSearchingMember] = useState(false);
    const [memberSearchError, setMemberSearchError] = useState('');
    const [walkInService, setWalkInService] = useState('');
    const [walkInBarber, setWalkInBarber] = useState('');
    const [walkInTime, setWalkInTime] = useState('');
    const [availableWalkInSlots, setAvailableWalkInSlots] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [formErrors, setFormErrors] = useState({});

    // Debounce/trigger filters update
    const handleFilterChange = () => {
        router.get(route('cashier.dashboard'), {
            search,
            status,
            barber_id: barberId,
            date
        }, {
            preserveState: true,
            replace: true
        });
    };

    // Look up slots for walk-in form when date, barber, or service changes
    useEffect(() => {
        if (walkInBarber && walkInService) {
            setLoadingSlots(true);
            setAvailableWalkInSlots([]);
            setFormErrors(prev => ({ ...prev, time: null }));

            axios.post(route('booking.slots'), {
                barber_id: walkInBarber,
                date: date, // walk-in is always for selected dashboard date
                service_id: walkInService
            })
            .then(res => {
                setAvailableWalkInSlots(res.data.slots || []);
            })
            .catch(err => {
                console.error(err);
            })
            .finally(() => {
                setLoadingSlots(false);
            });
        }
    }, [walkInBarber, walkInService, date]);

    // Handle member phone search
    const handleSearchMember = () => {
        if (!memberPhone) return;
        setSearchingMember(true);
        setFoundMember(null);
        setMemberSearchError('');

        axios.post(route('cashier.customers.search'), { phone: memberPhone })
            .then(res => {
                if (res.data.found) {
                    setFoundMember(res.data.customer);
                } else {
                    setMemberSearchError('Nomor HP tidak terdaftar sebagai member.');
                }
            })
            .catch(err => {
                console.error(err);
                setMemberSearchError('Terjadi kesalahan pencarian.');
            })
            .finally(() => {
                setSearchingMember(false);
            });
    };

    // Handle walk-in submit
    const handleWalkInSubmit = (e) => {
        e.preventDefault();
        setFormErrors({});

        const payload = {
            service_id: walkInService,
            barber_id: walkInBarber,
            time: walkInTime,
            customer_type: customerType
        };

        if (customerType === 'guest') {
            payload.guest_name = guestName;
            payload.guest_phone = guestPhone;
        } else {
            if (!foundMember) {
                setFormErrors({ member: 'Harap cari dan temukan member terlebih dahulu.' });
                return;
            }
            payload.customer_id = foundMember.id;
        }

        router.post(route('cashier.bookings.store'), payload, {
            onSuccess: () => {
                setShowWalkInModal(false);
                resetWalkInForm();
            },
            onError: (errs) => {
                setFormErrors(errs);
            }
        });
    };

    const resetWalkInForm = () => {
        setGuestName('');
        setGuestPhone('');
        setMemberPhone('');
        setFoundMember(null);
        setWalkInService('');
        setWalkInBarber('');
        setWalkInTime('');
        setFormErrors({});
        setMemberSearchError('');
    };

    // Handle status changes (Mulai Service or Batalkan)
    const handleUpdateStatus = (bookingId, newStatus) => {
        if (confirm(`Apakah Anda yakin ingin mengubah status booking ini menjadi ${newStatus === 'in_progress' ? 'Mulai Service' : 'Batal'}?`)) {
            router.post(route('cashier.bookings.status', bookingId), {
                status: newStatus
            });
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-xl font-bold font-sans text-ink leading-tight">
                            Panel Kasir — {branch.name}
                        </h2>
                        <p className="text-xs text-on-light-muted mt-1">
                            {branch.address}
                        </p>
                    </div>
                    <button
                        onClick={() => setShowWalkInModal(true)}
                        className="btn-accent px-5 py-2.5 flex items-center space-x-2 text-xs"
                    >
                        <span>➕ WALK-IN BOOKING</span>
                    </button>
                </div>
            }
        >
            <Head title="Kasir Dashboard" />

            <div className="py-6 px-4 sm:px-6 lg:px-8 bg-surface-canvas-light text-ink min-h-screen">
                <div className="max-w-7xl mx-auto space-y-6">

                    {/* Stats Section */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="bg-surface-card p-5 border border-hairline-cloud rounded-card shadow-card">
                            <span className="text-[10px] font-bold text-on-light-muted uppercase tracking-wider block mb-1">Total Antrean</span>
                            <span className="text-2xl font-bold font-display text-ink">{stats.total_bookings}</span>
                        </div>
                        <div className="bg-surface-card p-5 border border-hairline-cloud rounded-card shadow-card border-l-4 border-l-booking-confirmed">
                            <span className="text-[10px] font-bold text-on-light-muted uppercase tracking-wider block mb-1">Confirmed</span>
                            <span className="text-2xl font-bold font-display text-booking-confirmed">{stats.confirmed}</span>
                        </div>
                        <div className="bg-surface-card p-5 border border-hairline-cloud rounded-card shadow-card border-l-4 border-l-booking-in-progress">
                            <span className="text-[10px] font-bold text-on-light-muted uppercase tracking-wider block mb-1">In-Progress</span>
                            <span className="text-2xl font-bold font-display text-booking-in-progress">{stats.in_progress}</span>
                        </div>
                        <div className="bg-surface-card p-5 border border-hairline-cloud rounded-card shadow-card border-l-4 border-l-booking-completed">
                            <span className="text-[10px] font-bold text-on-light-muted uppercase tracking-wider block mb-1">Selesai</span>
                            <span className="text-2xl font-bold font-display text-booking-completed">{stats.completed}</span>
                        </div>
                        <div className="bg-surface-card p-5 border border-hairline-cloud rounded-card shadow-card col-span-2 md:col-span-1">
                            <span className="text-[10px] font-bold text-on-light-muted uppercase tracking-wider block mb-1">Omset Hari Ini</span>
                            <span className="text-xl font-bold font-display text-accent-lime-muted">
                                Rp {new Intl.NumberFormat('id-ID').format(stats.revenue)}
                            </span>
                        </div>
                    </div>

                    {/* Filters Section */}
                    <div className="bg-white p-4 border border-hairline-cloud rounded-card shadow-card flex flex-col md:flex-row md:items-end gap-4">
                        <div className="flex-1 min-w-[200px]">
                            <label className="block text-xs font-bold text-on-light-muted uppercase tracking-wider mb-2">Pencarian Customer</label>
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="input-field w-full text-sm"
                                placeholder="Cari nama atau No HP..."
                            />
                        </div>

                        <div className="w-full md:w-48">
                            <label className="block text-xs font-bold text-on-light-muted uppercase tracking-wider mb-2">Tanggal Antrean</label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="input-field w-full text-sm"
                            />
                        </div>

                        <div className="w-full md:w-44">
                            <label className="block text-xs font-bold text-on-light-muted uppercase tracking-wider mb-2">Filter Status</label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="input-field w-full text-sm"
                            >
                                <option value="">Semua Status</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="in_progress">In-Progress</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>

                        <div className="w-full md:w-48">
                            <label className="block text-xs font-bold text-on-light-muted uppercase tracking-wider mb-2">Filter Barber</label>
                            <select
                                value={barberId}
                                onChange={(e) => setBarberId(e.target.value)}
                                className="input-field w-full text-sm"
                            >
                                <option value="">Semua Barber</option>
                                {barbers.map(b => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <button
                                onClick={handleFilterChange}
                                className="btn-primary w-full md:w-auto px-6 py-2.5 text-xs text-center"
                            >
                                CARI
                            </button>
                        </div>
                    </div>

                    {/* Queue List Table */}
                    <div className="bg-white border border-hairline-cloud rounded-card shadow-card overflow-hidden">
                        <div className="p-5 border-b border-hairline-cloud flex justify-between items-center">
                            <h3 className="font-display font-bold text-lg text-ink">Antrean Pelanggan</h3>
                            <span className="text-xs text-on-light-muted font-medium">
                                Tanggal: {new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-sm">
                                <thead>
                                    <tr className="bg-surface-card border-b border-hairline-cloud text-[11px] font-bold text-on-light-muted uppercase tracking-wider">
                                        <th className="py-4 px-6">Waktu</th>
                                        <th className="py-4 px-6">Nama / HP</th>
                                        <th className="py-4 px-6">Layanan</th>
                                        <th className="py-4 px-6">Barber</th>
                                        <th className="py-4 px-6">Harga</th>
                                        <th className="py-4 px-6 text-center">Status</th>
                                        <th className="py-4 px-6 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-hairline-cloud">
                                    {bookings.length > 0 ? (
                                        bookings.map((booking) => (
                                            <tr key={booking.id} className="hover:bg-surface-card/40 transition duration-150">
                                                <td className="py-4 px-6 font-semibold font-display text-ink-deep">
                                                    {booking.slot_start} - {booking.slot_end}
                                                </td>
                                                <td className="py-4 px-6">
                                                    <span className="font-bold block text-ink-deep">{booking.customer_name}</span>
                                                    <span className="text-xs text-on-light-muted">{booking.customer_phone}</span>
                                                </td>
                                                <td className="py-4 px-6 font-medium text-ink">{booking.service_name}</td>
                                                <td className="py-4 px-6 text-on-light-muted">{booking.barber_name}</td>
                                                <td className="py-4 px-6 font-bold text-ink">
                                                    Rp {new Intl.NumberFormat('id-ID').format(booking.price)}
                                                </td>
                                                <td className="py-4 px-6 text-center">
                                                    <span className={`inline-block px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${
                                                        booking.status === 'confirmed' ? 'bg-blue-50 border-blue-200 text-booking-confirmed' :
                                                        booking.status === 'in_progress' ? 'bg-amber-50 border-amber-200 text-booking-in-progress' :
                                                        booking.status === 'completed' ? 'bg-green-50 border-green-200 text-booking-completed' :
                                                        'bg-red-50 border-red-200 text-booking-cancelled'
                                                    }`}>
                                                        {booking.status}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6 text-right space-x-2">
                                                    {booking.status === 'confirmed' && (
                                                        <>
                                                            <button
                                                                onClick={() => handleUpdateStatus(booking.id, 'in_progress')}
                                                                className="px-3 py-1.5 rounded bg-booking-confirmed text-white text-xs font-semibold hover:bg-blue-600 transition"
                                                            >
                                                                Mulai Service
                                                            </button>
                                                            <button
                                                                onClick={() => handleUpdateStatus(booking.id, 'cancelled')}
                                                                className="px-3 py-1.5 rounded border border-status-danger text-status-danger text-xs font-medium hover:bg-red-50 transition"
                                                            >
                                                                Batal
                                                            </button>
                                                        </>
                                                    )}
                                                    {booking.status === 'in_progress' && (
                                                        <>
                                                            <Link
                                                                href={route('cashier.pos.index', booking.id)}
                                                                className="inline-block px-3 py-1.5 rounded bg-booking-in-progress text-white text-xs font-semibold hover:bg-amber-600 transition"
                                                            >
                                                                Buka POS
                                                            </Link>
                                                            <button
                                                                onClick={() => handleUpdateStatus(booking.id, 'cancelled')}
                                                                className="px-3 py-1.5 rounded border border-status-danger text-status-danger text-xs font-medium hover:bg-red-50 transition"
                                                            >
                                                                Batal
                                                            </button>
                                                        </>
                                                    )}
                                                    {booking.status === 'completed' && (
                                                        <span className="text-xs text-on-light-faint font-semibold italic">Transaksi Selesai</span>
                                                    )}
                                                    {booking.status === 'cancelled' && (
                                                        <span className="text-xs text-status-danger font-semibold">Batal</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="7" className="py-12 text-center text-on-light-muted italic">
                                                Tidak ada antrean booking harian untuk filter saat ini.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </div>

            {/* Walk-in Booking Modal */}
            {showWalkInModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-lg rounded-xl shadow-modal border border-hairline-cloud overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-hairline-cloud flex justify-between items-center bg-surface-card">
                            <h3 className="font-display font-bold text-lg text-ink">Walk-in Booking Baru</h3>
                            <button
                                onClick={() => {
                                    setShowWalkInModal(false);
                                    resetWalkInForm();
                                }}
                                className="text-on-light-muted hover:text-ink text-xl font-bold"
                            >
                                &times;
                            </button>
                        </div>

                        <form onSubmit={handleWalkInSubmit} className="p-6 space-y-4">
                            {/* Customer Type Selector */}
                            <div className="flex space-x-4">
                                <label className="flex items-center space-x-2 text-sm font-semibold cursor-pointer">
                                    <input
                                        type="radio"
                                        name="customer_type"
                                        checked={customerType === 'guest'}
                                        onChange={() => setCustomerType('guest')}
                                        className="text-primary focus:ring-primary border-hairline-cool"
                                    />
                                    <span>Guest / Pelanggan Baru</span>
                                </label>
                                <label className="flex items-center space-x-2 text-sm font-semibold cursor-pointer">
                                    <input
                                        type="radio"
                                        name="customer_type"
                                        checked={customerType === 'member'}
                                        onChange={() => setCustomerType('member')}
                                        className="text-primary focus:ring-primary border-hairline-cool"
                                    />
                                    <span>Member Terdaftar</span>
                                </label>
                            </div>

                            {/* Guest Fields */}
                            {customerType === 'guest' ? (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-on-light-muted uppercase tracking-wider mb-2">Nama Pelanggan</label>
                                        <input
                                            type="text"
                                            value={guestName}
                                            onChange={(e) => setGuestName(e.target.value)}
                                            className="input-field w-full text-sm"
                                            placeholder="Masukkan nama"
                                            required
                                        />
                                        {formErrors.guest_name && <p className="text-xs text-status-danger mt-1">{formErrors.guest_name}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-on-light-muted uppercase tracking-wider mb-2">No WhatsApp</label>
                                        <input
                                            type="text"
                                            value={guestPhone}
                                            onChange={(e) => setGuestPhone(e.target.value)}
                                            className="input-field w-full text-sm"
                                            placeholder="Contoh: 0812..."
                                            required
                                        />
                                        {formErrors.guest_phone && <p className="text-xs text-status-danger mt-1">{formErrors.guest_phone}</p>}
                                    </div>
                                </div>
                            ) : (
                                /* Member Search Field */
                                <div className="space-y-3 p-4 bg-surface-card rounded-md border border-hairline-cloud">
                                    <div>
                                        <label className="block text-xs font-bold text-on-light-muted uppercase tracking-wider mb-2">Masukkan No WhatsApp Member</label>
                                        <div className="flex space-x-2">
                                            <input
                                                type="text"
                                                value={memberPhone}
                                                onChange={(e) => setMemberPhone(e.target.value)}
                                                className="input-field flex-1 text-sm"
                                                placeholder="Cari No HP Member..."
                                            />
                                            <button
                                                type="button"
                                                onClick={handleSearchMember}
                                                disabled={searchingMember}
                                                className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-md hover:bg-primary-dark transition"
                                            >
                                                {searchingMember ? 'Mencari...' : 'CARI'}
                                            </button>
                                        </div>
                                        {memberSearchError && <p className="text-xs text-status-danger mt-1">{memberSearchError}</p>}
                                        {formErrors.member && <p className="text-xs text-status-danger mt-1">{formErrors.member}</p>}
                                    </div>

                                    {foundMember && (
                                        <div className="p-3 bg-green-50 border border-green-200 text-status-success rounded text-xs font-semibold">
                                            ✅ Member Ditemukan: {foundMember.name} ({foundMember.phone})
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Service and Barber Selector */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-on-light-muted uppercase tracking-wider mb-2">Pilih Layanan</label>
                                    <select
                                        value={walkInService}
                                        onChange={(e) => setWalkInService(e.target.value)}
                                        className="input-field w-full text-sm"
                                        required
                                    >
                                        <option value="">-- Pilih --</option>
                                        {services.map(s => (
                                            <option key={s.id} value={s.id}>{s.name} ({s.duration_minutes}m)</option>
                                        ))}
                                    </select>
                                    {formErrors.service_id && <p className="text-xs text-status-danger mt-1">{formErrors.service_id}</p>}
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-on-light-muted uppercase tracking-wider mb-2">Pilih Barber</label>
                                    <select
                                        value={walkInBarber}
                                        onChange={(e) => setWalkInBarber(e.target.value)}
                                        className="input-field w-full text-sm"
                                        required
                                    >
                                        <option value="">-- Pilih --</option>
                                        {barbers.map(b => (
                                            <option key={b.id} value={b.id}>{b.name}</option>
                                        ))}
                                    </select>
                                    {formErrors.barber_id && <p className="text-xs text-status-danger mt-1">{formErrors.barber_id}</p>}
                                </div>
                            </div>

                            {/* Slot Time Selector */}
                            {walkInBarber && walkInService && (
                                <div>
                                    <label className="block text-xs font-bold text-on-light-muted uppercase tracking-wider mb-2">Pilih Jam Antrean</label>
                                    {loadingSlots ? (
                                        <p className="text-xs text-on-light-muted animate-pulse">Menghitung ketersediaan slot...</p>
                                    ) : (
                                        <div className="grid grid-cols-4 gap-2 max-h-36 overflow-y-auto p-1 border border-hairline-cool rounded">
                                            {availableWalkInSlots.length > 0 ? (
                                                availableWalkInSlots.map(t => (
                                                    <button
                                                        key={t}
                                                        type="button"
                                                        onClick={() => setWalkInTime(t)}
                                                        className={`py-1.5 px-2 rounded text-xs font-semibold border text-center transition ${
                                                            walkInTime === t
                                                            ? 'bg-primary border-primary text-white'
                                                            : 'bg-white border-hairline-cool text-ink hover:border-primary'
                                                        }`}
                                                    >
                                                        {t}
                                                    </button>
                                                ))
                                            ) : (
                                                <p className="col-span-full text-xs text-status-danger text-center p-2">Tidak ada slot tersisa untuk tanggal ini.</p>
                                            )}
                                        </div>
                                    )}
                                    {formErrors.time && <p className="text-xs text-status-danger mt-1">{formErrors.time}</p>}
                                </div>
                            )}

                            {/* Submit Button */}
                            <div className="border-t border-hairline-cloud pt-4 flex justify-end space-x-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowWalkInModal(false);
                                        resetWalkInForm();
                                    }}
                                    className="px-4 py-2 border border-hairline-cool rounded-md text-xs font-semibold text-on-light-muted hover:bg-surface-card"
                                >
                                    BATAL
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 bg-primary text-white text-xs font-bold rounded-md hover:bg-primary-dark transition shadow-md"
                                >
                                    SIMPAN ANTRIAN
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
