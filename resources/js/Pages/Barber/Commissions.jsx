import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Commissions({ records = [], totals, filters }) {
    const user = usePage().props.auth.user;
    const [activeTab, setActiveTab] = useState('commissions');
    const [startDate, setStartDate] = useState(filters.start_date || '');
    const [endDate, setEndDate] = useState(filters.end_date || '');
    
    // Payout history states
    const [payouts, setPayouts] = useState([]);
    const [loadingPayouts, setLoadingPayouts] = useState(false);
    const [receiptModalOpen, setReceiptModalOpen] = useState(false);
    const [selectedPayout, setSelectedPayout] = useState(null);

    // Fetch payouts when changing to payouts tab
    useEffect(() => {
        if (activeTab === 'payouts') {
            setLoadingPayouts(true);
            axios.get(route('barber.commissions.payouts'))
                .then(res => {
                    setPayouts(res.data.payouts || []);
                })
                .catch(err => {
                    console.error(err);
                    alert('Gagal mengambil riwayat pembayaran komisi.');
                })
                .finally(() => {
                    setLoadingPayouts(false);
                });
        }
    }, [activeTab]);

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

                    {/* Tabs */}
                    <div className="flex border-b border-hairline-cloud no-print">
                        <button
                            onClick={() => setActiveTab('commissions')}
                            className={`py-3 px-6 text-sm font-semibold border-b-2 cursor-pointer transition ${
                                activeTab === 'commissions'
                                    ? 'border-[#2D1B69] text-[#2D1B69]'
                                    : 'border-transparent text-on-light-muted hover:text-ink'
                            }`}
                        >
                            Detail Rincian Komisi
                        </button>
                        <button
                            onClick={() => setActiveTab('payouts')}
                            className={`py-3 px-6 text-sm font-semibold border-b-2 cursor-pointer transition ${
                                activeTab === 'payouts'
                                    ? 'border-[#2D1B69] text-[#2D1B69]'
                                    : 'border-transparent text-on-light-muted hover:text-ink'
                            }`}
                        >
                            Riwayat Pencairan Komisi (Payout)
                        </button>
                    </div>

                    {activeTab === 'commissions' ? (
                        <>
                            {/* Filter Bar */}
                            <form onSubmit={handleFilter} className="bg-white p-4 border border-hairline-cloud rounded-card shadow-card flex flex-col md:flex-row md:items-end gap-4 text-xs no-print">
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
                        </>
                    ) : (
                        /* Payout History Tab */
                        <div className="bg-white border border-hairline-cloud rounded-card shadow-card overflow-hidden text-ink">
                            <div className="p-5 border-b border-hairline-cloud">
                                <h3 className="font-display font-bold text-lg text-ink-deep">Riwayat Pencairan Komisi</h3>
                            </div>

                            <div className="p-6">
                                {loadingPayouts ? (
                                    <div className="text-center py-8">
                                        <div className="w-6 h-6 border-2 border-accent-violet border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                                        <p className="text-xs text-on-light-muted">Mengambil riwayat pembayaran...</p>
                                    </div>
                                ) : payouts.length > 0 ? (
                                    <div className="overflow-x-auto border border-hairline-cloud rounded-card">
                                        <table className="w-full text-left border-collapse text-xs">
                                            <thead>
                                                <tr className="bg-surface-card border-b border-hairline-cloud font-bold text-on-light-muted uppercase tracking-wider text-left">
                                                    <th className="py-3 px-4">Tanggal Pencairan</th>
                                                    <th className="py-3 px-4">Metode</th>
                                                    <th className="py-3 px-4">No. Referensi</th>
                                                    <th className="py-3 px-4">Catatan</th>
                                                    <th className="py-3 px-4">Diserahkan Oleh</th>
                                                    <th className="py-3 px-4 text-right">Nominal Komisi</th>
                                                    <th className="py-3 px-4 text-center">Aksi</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-hairline-cloud text-ink-deep font-medium">
                                                {payouts.map((p) => (
                                                    <tr key={p.id} className="hover:bg-surface-card/40 transition">
                                                        <td className="py-3 px-4 text-on-light-muted font-mono">{p.paid_at}</td>
                                                        <td className="py-3 px-4 font-semibold">{p.payment_method === 'bank_transfer' ? 'Transfer Bank' : 'Tunai'}</td>
                                                        <td className="py-3 px-4 font-mono">{p.reference_number}</td>
                                                        <td className="py-3 px-4 max-w-[150px] truncate" title={p.notes}>{p.notes}</td>
                                                        <td className="py-3 px-4 text-on-light-muted">{p.paid_by_name}</td>
                                                        <td className="py-3 px-4 text-right font-bold text-[#2D1B69]">
                                                            Rp {new Intl.NumberFormat('id-ID').format(p.payout_amount)}
                                                        </td>
                                                        <td className="py-3 px-4 text-center">
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedPayout(p);
                                                                    setReceiptModalOpen(true);
                                                                }}
                                                                className="px-3 py-1 bg-[#2D1B69] hover:bg-[#1A0F3D] text-white rounded text-[10px] font-bold transition cursor-pointer"
                                                            >
                                                                Cetak Struk
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-on-light-muted italic text-xs">
                                        Belum ada riwayat pencairan komisi yang dicatat.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                </div>
            </div>

            {/* Receipt Modal */}
            {receiptModalOpen && selectedPayout && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-ink">
                    <style dangerouslySetInnerHTML={{__html: `
                        @media print {
                            body * {
                                visibility: hidden;
                            }
                            #payout-receipt-print, #payout-receipt-print * {
                                visibility: visible;
                            }
                            #payout-receipt-print {
                                position: absolute;
                                left: 0;
                                top: 0;
                                width: 100%;
                                background: white !important;
                                color: black !important;
                                padding: 24px !important;
                                box-shadow: none !important;
                                border: none !important;
                            }
                            .no-print {
                                display: none !important;
                            }
                        }
                    `}} />
                    
                    <div className="bg-white rounded-card border border-hairline-cloud shadow-modal w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden text-ink">
                        <div className="p-5 border-b border-hairline-cloud flex justify-between items-center no-print">
                            <h3 className="font-display font-bold text-base text-ink-deep">Cetak Receipt Komisi</h3>
                            <button onClick={() => setReceiptModalOpen(false)} className="text-on-light-muted hover:text-ink-deep font-bold text-lg">✕</button>
                        </div>
                        
                        <div className="p-8 flex-1 overflow-y-auto" id="payout-receipt-print">
                            <div className="text-center border-b-2 border-dashed border-hairline-cloud pb-6">
                                <h2 className="font-display font-bold text-xl tracking-tight text-[#2D1B69]">
                                    HOWELL<span className="text-[#C2EF4E]">.</span> BARBERSHOP
                                </h2>
                                <p className="text-xs text-on-light-muted mt-1 uppercase tracking-wider font-semibold">Kwitansi Pembayaran Komisi Barber</p>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-6 my-6 text-xs text-ink-deep">
                                <div className="space-y-1.5">
                                    <div><span className="text-on-light-muted">No. Payout:</span> <span className="font-mono font-bold">PAY-{selectedPayout.id.toString().padStart(4, '0')}</span></div>
                                    <div><span className="text-on-light-muted">Tanggal:</span> <span className="font-medium">{selectedPayout.paid_at}</span></div>
                                    <div><span className="text-on-light-muted">Metode:</span> <span className="font-bold">{selectedPayout.payment_method}</span></div>
                                </div>
                                <div className="space-y-1.5 text-right">
                                    <div><span className="text-on-light-muted">Penerima (Barber):</span> <span className="font-bold text-primary">{user.name}</span></div>
                                    <div><span className="text-on-light-muted">Dibayar Oleh:</span> <span className="font-semibold">{selectedPayout.paid_by_name}</span></div>
                                </div>
                            </div>
                            
                            {selectedPayout.reference_number && selectedPayout.reference_number !== '-' && (
                                <div className="mb-6 p-2.5 bg-surface-card border border-hairline-cloud rounded text-xs">
                                    <span className="text-on-light-muted font-semibold">Nomor Referensi:</span> <span className="font-mono font-bold ml-1">{selectedPayout.reference_number}</span>
                                </div>
                            )}

                            <div className="border border-hairline-cloud rounded overflow-hidden mb-6 text-[11px]">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-surface-card border-b border-hairline-cloud font-bold text-on-light-muted uppercase tracking-wider">
                                            <th className="py-2.5 px-4">Tanggal Nota</th>
                                            <th className="py-2.5 px-4">No. Invoice</th>
                                            <th className="py-2.5 px-4">Layanan</th>
                                            <th className="py-2.5 px-4 text-right">Harga Layanan</th>
                                            <th className="py-2.5 px-4 text-center">Persentase</th>
                                            <th className="py-2.5 px-4 text-right">Komisi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-hairline-cloud font-medium">
                                        {selectedPayout.records && selectedPayout.records.length > 0 ? (
                                            selectedPayout.records.map(rec => (
                                                <tr key={rec.id}>
                                                    <td className="py-2 px-4 text-on-light-muted font-mono">{rec.date}</td>
                                                    <td className="py-2 px-4 font-mono">{rec.invoice_number}</td>
                                                    <td className="py-2 px-4">{rec.service_name}</td>
                                                    <td className="py-2 px-4 text-right">Rp {new Intl.NumberFormat('id-ID').format(rec.service_amount)}</td>
                                                    <td className="py-2 px-4 text-center font-bold">{rec.percentage}%</td>
                                                    <td className="py-2 px-4 text-right font-bold text-status-success">Rp {new Intl.NumberFormat('id-ID').format(rec.commission_amount)}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="6" className="py-4 text-center italic text-on-light-muted">Tidak ada rincian transaksi</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            
                            <div className="flex flex-col items-end mb-8 text-xs font-bold">
                                <div className="flex space-x-4 text-base border-t-2 border-dashed border-hairline-cloud pt-4 w-full justify-end">
                                    <span className="text-on-light-muted">Total Pembayaran Komisi:</span>
                                    <span className="text-[#2D1B69] text-lg font-mono">Rp {new Intl.NumberFormat('id-ID').format(selectedPayout.payout_amount)}</span>
                                </div>
                            </div>
                            
                            {selectedPayout.notes && selectedPayout.notes !== '-' && (
                                <div className="mb-8 p-3 bg-surface-card border border-hairline-cloud rounded text-xs italic">
                                    <span className="text-on-light-muted font-semibold not-italic block mb-1">Catatan:</span>
                                    {selectedPayout.notes}
                                </div>
                            )}
                            
                            <div className="grid grid-cols-2 gap-12 mt-12 text-center text-xs">
                                <div>
                                    <p className="text-on-light-muted mb-16">Yang Menyerahkan,</p>
                                    <div className="border-b border-ink-deep w-40 mx-auto"></div>
                                    <p className="font-bold mt-1.5">{selectedPayout.paid_by_name}</p>
                                    <p className="text-[10px] text-on-light-muted font-semibold uppercase tracking-wider mt-0.5">Owner / Management</p>
                                </div>
                                <div>
                                    <p className="text-on-light-muted mb-16">Penerima Komisi,</p>
                                    <div className="border-b border-ink-deep w-40 mx-auto"></div>
                                    <p className="font-bold mt-1.5">{user.name}</p>
                                    <p className="text-[10px] text-on-light-muted font-semibold uppercase tracking-wider mt-0.5">Barber Professional</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="p-5 border-t border-hairline-cloud bg-surface-card flex justify-end gap-3 no-print">
                            <button 
                                onClick={() => setReceiptModalOpen(false)} 
                                className="px-4 py-2 border border-hairline-cloud rounded text-on-light-muted hover:bg-surface-press-light transition text-xs font-semibold"
                            >
                                Tutup
                            </button>
                            <button 
                                onClick={() => window.print()}
                                className="px-5 py-2 bg-[#2D1B69] hover:bg-[#1A0F3D] text-white rounded font-sans font-bold text-xs active:scale-98 transition shadow-lg flex items-center gap-1.5"
                            >
                                <span>Cetak Kwitansi</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
