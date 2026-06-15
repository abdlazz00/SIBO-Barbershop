import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

export default function Dashboard({ bookings = [], shift, summary }) {
    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-xl font-bold font-sans text-ink leading-tight">
                            Panel Barber — Halaman Utama
                        </h2>
                        <p className="text-xs text-on-light-muted mt-1">
                            Pantau jadwal tugas harian dan performa bulanan Anda.
                        </p>
                    </div>
                    {shift && (
                        <span className={`px-4 py-2 rounded-md border text-xs font-bold ${
                            shift.is_off 
                            ? 'bg-red-50 border-red-200 text-status-danger' 
                            : 'bg-green-50 border-green-200 text-status-success'
                        }`}>
                            📆 Hari Ini: {shift.is_off ? 'LIBUR' : `MASUK (${shift.start_time} - ${shift.end_time})`}
                        </span>
                    )}
                </div>
            }
        >
            <Head title="Barber Dashboard" />

            <div className="py-6 px-4 sm:px-6 lg:px-8 bg-surface-canvas-light text-ink min-h-screen">
                <div className="max-w-7xl mx-auto space-y-8">
                    
                    {/* Monthly Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <div className="bg-white p-5 border border-hairline-cloud rounded-card shadow-card">
                            <span className="text-[10px] font-bold text-on-light-muted uppercase tracking-wider block mb-1">
                                Total Kerja Selesai (Bulan Ini)
                            </span>
                            <span className="text-2xl font-bold font-display text-ink-deep">
                                {summary.monthly_bookings} Booking Completed
                            </span>
                        </div>
                        <div className="bg-white p-5 border border-hairline-cloud rounded-card shadow-card">
                            <span className="text-[10px] font-bold text-on-light-muted uppercase tracking-wider block mb-1">
                                Persentase Komisi Saya
                            </span>
                            <span className="text-2xl font-bold font-display text-accent-violet-deep">
                                {summary.commission_percentage}% per Service
                            </span>
                        </div>
                        <div className="bg-white p-5 border border-hairline-cloud rounded-card shadow-card border-l-4 border-l-status-success">
                            <span className="text-[10px] font-bold text-on-light-muted uppercase tracking-wider block mb-1">
                                Akumulasi Komisi (Bulan Ini)
                            </span>
                            <span className="text-2xl font-bold font-display text-status-success">
                                Rp {new Intl.NumberFormat('id-ID').format(summary.monthly_commission)}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left/Middle Column: Today's Tasks */}
                        <div className="lg:col-span-2 bg-white border border-hairline-cloud rounded-card shadow-card overflow-hidden">
                            <div className="p-5 border-b border-hairline-cloud">
                                <h3 className="font-display font-bold text-lg text-ink-deep">Jadwal Tugas Haircut Hari Ini</h3>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse text-sm">
                                    <thead>
                                        <tr className="bg-surface-card border-b border-hairline-cloud text-[11px] font-bold text-on-light-muted uppercase tracking-wider">
                                            <th className="py-4 px-6">Waktu</th>
                                            <th className="py-4 px-6">Nama Customer</th>
                                            <th className="py-4 px-6">Layanan Pilihan</th>
                                            <th className="py-4 px-6 text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-hairline-cloud">
                                        {bookings.length > 0 ? (
                                            bookings.map((booking) => (
                                                <tr key={booking.id} className="hover:bg-surface-card/40 transition">
                                                    <td className="py-4 px-6 font-semibold font-display text-ink-deep">
                                                        {booking.slot_start} - {booking.slot_end}
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <span className="font-bold text-ink-deep block">{booking.customer_name}</span>
                                                        <span className="text-xs text-on-light-muted">{booking.customer_phone}</span>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <span className="font-medium">{booking.service_name}</span>
                                                        <span className="block text-xs text-on-light-muted">⏱ {booking.duration} Menit</span>
                                                    </td>
                                                    <td className="py-4 px-6 text-center">
                                                        <span className={`inline-block px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${
                                                            booking.status === 'confirmed' ? 'bg-blue-50 border-blue-200 text-booking-confirmed' :
                                                            booking.status === 'in_progress' ? 'bg-amber-50 border-amber-200 text-booking-in-progress' :
                                                            'bg-green-50 border-green-200 text-booking-completed'
                                                        }`}>
                                                            {booking.status === 'in_progress' ? 'In-Progress' : booking.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="4" className="py-12 text-center text-on-light-muted italic">
                                                    Tidak ada antrean tugas ditugaskan untuk Anda hari ini.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Right Panel: Short Quick Actions */}
                        <div className="bg-white border border-hairline-cloud rounded-card shadow-card p-6 flex flex-col justify-between h-fit space-y-6">
                            <div>
                                <h3 className="font-display font-bold text-lg text-ink-deep mb-2">Pantau Pendapatan</h3>
                                <p className="text-xs text-on-light-muted leading-relaxed">
                                    Setiap layanan selesai dicatat kasir harian akan langsung masuk ke tabulasi komisi Anda secara instan dan real-time.
                                </p>
                            </div>
                            
                            <div className="border-t border-hairline-cloud/50 pt-4">
                                <Link
                                    href={route('barber.commissions.index')}
                                    className="w-full btn-primary py-3 flex items-center justify-center space-x-2 text-xs font-bold shadow-sm"
                                >
                                    <span>LIHAT RINCIAN KOMISI SAYA</span>
                                </Link>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
