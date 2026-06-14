import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';

export default function Commissions({ records = [], totals, filters }) {
    const [startDate, setStartDate] = useState(filters.start_date || '');
    const [endDate, setEndDate] = useState(filters.end_date || '');

    const handleFilter = (e) => {
        e.preventDefault();
        router.get(route('barber.commissions.index'), {
            start_date: startDate,
            end_date: endDate,
        }, {
            preserveState: true,
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-bold font-sans text-ink leading-tight">
                    Laporan Riwayat Komisi & Kinerja Layanan Saya
                </h2>
            }
        >
            <Head title="Komisi Saya" />

            <div className="py-6 px-4 sm:px-6 lg:px-8 bg-surface-canvas-light text-ink min-h-screen space-y-6">
                <div className="max-w-7xl mx-auto space-y-6">

                    {/* Filter Bar */}
                    <form onSubmit={handleFilter} className="bg-white p-4 border border-hairline-cloud rounded-card shadow-card flex flex-col md:flex-row md:items-end gap-4 text-xs">
                        <div className="w-full md:w-36">
                            <label className="block text-[10px] font-bold text-on-light-muted uppercase tracking-wider mb-2">Dari Tanggal</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="input-field w-full text-xs"
                            />
                        </div>

                        <div className="w-full md:w-36">
                            <label className="block text-[10px] font-bold text-on-light-muted uppercase tracking-wider mb-2">Sampai Tanggal</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="input-field w-full text-xs"
                            />
                        </div>

                        <div>
                            <button
                                type="submit"
                                className="btn-primary w-full md:w-auto px-6 py-2.5 text-xs text-center"
                            >
                                Saring Laporan
                            </button>
                        </div>
                    </form>

                    {/* Report Table */}
                    <div className="bg-white border border-hairline-cloud rounded-card shadow-card overflow-hidden">
                        <div className="p-5 border-b border-hairline-cloud flex justify-between items-center">
                            <h3 className="font-display font-bold text-lg text-ink-deep">Rincian Komisi</h3>
                            <span className="text-xs text-on-light-muted font-medium">
                                Periode: {new Date(startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} - {new Date(endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-sm">
                                <thead>
                                    <tr className="bg-surface-card border-b border-hairline-cloud text-[11px] font-bold text-on-light-muted uppercase tracking-wider">
                                        <th className="py-4 px-6">Tanggal / Waktu</th>
                                        <th className="py-4 px-6">No. Nota POS</th>
                                        <th className="py-4 px-6">Pelanggan</th>
                                        <th className="py-4 px-6">Layanan</th>
                                        <th className="py-4 px-6 text-right">Nilai Layanan</th>
                                        <th className="py-4 px-6 text-center">Komisi (%)</th>
                                        <th className="py-4 px-6 text-right">Komisi Saya</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-hairline-cloud">
                                    {records.length > 0 ? (
                                        records.map((r) => (
                                            <tr key={r.id} className="hover:bg-surface-card/40 transition">
                                                <td className="py-4 px-6 text-on-light-muted font-mono text-xs">{r.date}</td>
                                                <td className="py-4 px-6 font-mono text-xs font-semibold">{r.invoice_number}</td>
                                                <td className="py-4 px-6 font-bold text-ink-deep">{r.customer_name}</td>
                                                <td className="py-4 px-6 font-medium text-xs text-on-light-muted">{r.service_name}</td>
                                                <td className="py-4 px-6 text-right">
                                                    Rp {new Intl.NumberFormat('id-ID').format(r.service_amount)}
                                                </td>
                                                <td className="py-4 px-6 text-center font-bold text-accent-violet-deep">{r.percentage}%</td>
                                                <td className="py-4 px-6 text-right font-bold text-status-success">
                                                    Rp {new Intl.NumberFormat('id-ID').format(r.commission_amount)}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="7" className="py-12 text-center text-on-light-muted italic">
                                                Tidak ada data komisi tercatat dalam periode filter ini.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Summary Footer */}
                        <div className="border-t border-hairline-cloud p-6 bg-surface-card flex flex-col sm:flex-row justify-end items-end gap-6 text-sm font-bold">
                            <div className="flex space-x-3 text-on-light-muted">
                                <span>Total Omset Layanan Dikerjakan:</span>
                                <span className="text-ink-deep">
                                    Rp {new Intl.NumberFormat('id-ID').format(totals.service_amount)}
                                </span>
                            </div>
                            <div className="flex space-x-3 text-status-success text-lg border-t sm:border-t-0 sm:border-l border-hairline-cloud/80 pt-2 sm:pt-0 sm:pl-6">
                                <span>Total Pendapatan Komisi Saya:</span>
                                <span>
                                    Rp {new Intl.NumberFormat('id-ID').format(totals.commission_amount)}
                                </span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
