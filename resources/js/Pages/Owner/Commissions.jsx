import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import axios from 'axios';

export default function Commissions({ branches = [], barbers = [], records = [], unpaidGrouped = [], totals, filters }) {
    const [branchId, setBranchId] = useState(filters.branch_id || '');
    const [barberId, setBarberId] = useState(filters.barber_id || '');
    const [startDate, setStartDate] = useState(filters.start_date || '');
    const [endDate, setEndDate] = useState(filters.end_date || '');

    // Payout modal states
    const [payoutModalOpen, setPayoutModalOpen] = useState(false);
    const [historyModalOpen, setHistoryModalOpen] = useState(false);
    const [selectedBarber, setSelectedBarber] = useState(null);
    const [unpaidRecords, setUnpaidRecords] = useState([]);
    const [selectedRecordIds, setSelectedRecordIds] = useState([]);
    const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
    const [referenceNumber, setReferenceNumber] = useState('');
    const [notes, setNotes] = useState('');
    const [payoutHistory, setPayoutHistory] = useState([]);
    const [loadingUnpaid, setLoadingUnpaid] = useState(false);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [processingSubmit, setProcessingSubmit] = useState(false);
    const [receiptModalOpen, setReceiptModalOpen] = useState(false);
    const [selectedPayout, setSelectedPayout] = useState(null);

    const handleFilter = (e) => {
        e.preventDefault();
        router.get(route('owner.commissions.index'), {
            branch_id: branchId,
            barber_id: barberId,
            start_date: startDate,
            end_date: endDate,
        }, {
            preserveState: true,
        });
    };

    const openPayoutModal = (barberSummary) => {
        setSelectedBarber(barberSummary);
        setPayoutModalOpen(true);
        setLoadingUnpaid(true);
        setUnpaidRecords([]);
        setSelectedRecordIds([]);
        setPaymentMethod('bank_transfer');
        setReferenceNumber('');
        setNotes('');

        axios.get(route('owner.commissions.unpaid', barberSummary.barber_id))
            .then(res => {
                setUnpaidRecords(res.data.records || []);
                // Pilih semua komisi secara default
                setSelectedRecordIds((res.data.records || []).map(r => r.id));
            })
            .catch(err => {
                console.error(err);
                alert('Gagal mengambil data komisi belum dibayar.');
            })
            .finally(() => {
                setLoadingUnpaid(false);
            });
    };

    const openHistoryModal = (barberSummary) => {
        setSelectedBarber(barberSummary);
        setHistoryModalOpen(true);
        setLoadingHistory(true);
        setPayoutHistory([]);

        axios.get(route('owner.commissions.payouts', barberSummary.barber_id))
            .then(res => {
                setPayoutHistory(res.data.payouts || []);
            })
            .catch(err => {
                console.error(err);
                alert('Gagal mengambil riwayat pembayaran komisi.');
            })
            .finally(() => {
                setLoadingHistory(false);
            });
    };

    const handleToggleRecord = (id) => {
        setSelectedRecordIds(prev => 
            prev.includes(id) ? prev.filter(rid => rid !== id) : [...prev, id]
        );
    };

    const handleSelectAllRecords = () => {
        if (selectedRecordIds.length === unpaidRecords.length) {
            setSelectedRecordIds([]);
        } else {
            setSelectedRecordIds(unpaidRecords.map(r => r.id));
        }
    };

    const handleSubmitPayout = () => {
        if (selectedRecordIds.length === 0) return;
        setProcessingSubmit(true);

        router.post(route('owner.commissions.payout.store', selectedBarber.barber_id), {
            record_ids: selectedRecordIds,
            payment_method: paymentMethod,
            reference_number: referenceNumber,
            notes: notes
        }, {
            onSuccess: () => {
                setPayoutModalOpen(false);
                setProcessingSubmit(false);
                openHistoryModal(selectedBarber);
            },
            onError: (errors) => {
                alert('Error: ' + (errors.error || 'Gagal memproses pembayaran komisi.'));
                setProcessingSubmit(false);
            }
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-bold font-sans text-ink leading-tight">
                    Laporan Pendapatan Layanan & Komisi Barber
                </h2>
            }
        >
            <Head title="Laporan Komisi Barber" />

            <div className="py-6 px-4 sm:px-6 lg:px-8 bg-surface-canvas-light text-ink min-h-screen space-y-6">
                <div className="max-w-7xl mx-auto space-y-6">

                    {/* Filter Bar */}
                    <form onSubmit={handleFilter} className="bg-white p-4 border border-hairline-cloud rounded-card shadow-card flex flex-col md:flex-row md:items-end gap-4 text-xs">
                        <div className="w-full md:w-48">
                            <label className="block text-[10px] font-bold text-on-light-muted uppercase tracking-wider mb-2">Pilih Cabang</label>
                            <select
                                value={branchId}
                                onChange={(e) => setBranchId(e.target.value)}
                                className="input-field w-full text-xs"
                            >
                                <option value="">Semua Cabang</option>
                                {branches.map(b => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="w-full md:w-48">
                            <label className="block text-[10px] font-bold text-on-light-muted uppercase tracking-wider mb-2">Pilih Barber</label>
                            <select
                                value={barberId}
                                onChange={(e) => setBarberId(e.target.value)}
                                className="input-field w-full text-xs"
                            >
                                <option value="">Semua Barber</option>
                                {barbers.map(b => (
                                    <option key={b.id} value={b.id}>{b.user.name}</option>
                                ))}
                            </select>
                        </div>

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

                    {/* Grid Layout: Left Table & Right Payout Queue */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        
                        {/* Report Table Column */}
                        <div className="lg:col-span-8 bg-white border border-hairline-cloud rounded-card shadow-card overflow-hidden">
                            <div className="p-5 border-b border-hairline-cloud flex justify-between items-center">
                                <h3 className="font-display font-bold text-lg text-ink-deep">Rincian Transaksi Komisi</h3>
                                <span className="text-xs text-on-light-muted font-medium">
                                    Periode: {new Date(startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} - {new Date(endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </span>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse text-sm">
                                    <thead>
                                        <tr className="bg-surface-card border-b border-hairline-cloud text-[11px] font-bold text-on-light-muted uppercase tracking-wider">
                                            <th className="py-4 px-6">Tanggal / Waktu</th>
                                            <th className="py-4 px-6">Barber</th>
                                            <th className="py-4 px-6">Cabang</th>
                                            <th className="py-4 px-6">No. Nota POS</th>
                                            <th className="py-4 px-6">Layanan</th>
                                            <th className="py-4 px-6 text-right">Nilai Layanan</th>
                                            <th className="py-4 px-6 text-center">Komisi (%)</th>
                                            <th className="py-4 px-6 text-right">Jumlah Komisi</th>
                                            <th className="py-4 px-6 text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-hairline-cloud">
                                        {records.length > 0 ? (
                                            records.map((r) => (
                                                <tr key={r.id} className="hover:bg-surface-card/40 transition text-xs">
                                                    <td className="py-4 px-6 text-on-light-muted font-mono">{r.date}</td>
                                                    <td className="py-4 px-6 font-bold text-ink-deep">{r.barber_name}</td>
                                                    <td className="py-4 px-6 text-on-light-muted">{r.branch_name}</td>
                                                    <td className="py-4 px-6 font-mono font-semibold">{r.invoice_number}</td>
                                                    <td className="py-4 px-6 font-medium">{r.service_name}</td>
                                                    <td className="py-4 px-6 text-right">
                                                        Rp {new Intl.NumberFormat('id-ID').format(r.service_amount)}
                                                    </td>
                                                    <td className="py-4 px-6 text-center font-bold text-accent-violet-deep">{r.percentage}%</td>
                                                    <td className="py-4 px-6 text-right font-bold text-ink-deep">
                                                        Rp {new Intl.NumberFormat('id-ID').format(r.commission_amount)}
                                                    </td>
                                                    <td className="py-4 px-6 text-center">
                                                        {r.is_paid ? (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-green-50 border border-green-200 text-booking-completed">
                                                                Lunas
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-red-50 border border-red-200 text-booking-cancelled">
                                                                Unpaid
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="9" className="py-12 text-center text-on-light-muted italic text-xs">
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
                                    <span>Total Revenue Layanan:</span>
                                    <span className="text-ink-deep">
                                        Rp {new Intl.NumberFormat('id-ID').format(totals.service_amount)}
                                    </span>
                                </div>
                                <div className="flex space-x-3 text-accent-violet-deep text-lg border-t sm:border-t-0 sm:border-l border-hairline-cloud/80 pt-2 sm:pt-0 sm:pl-6">
                                    <span>Total Komisi Barber:</span>
                                    <span>
                                        Rp {new Intl.NumberFormat('id-ID').format(totals.commission_amount)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Payout Queue Column */}
                        <div className="lg:col-span-4 bg-white border border-hairline-cloud rounded-card shadow-card overflow-hidden">
                            <div className="p-5 border-b border-hairline-cloud">
                                <h3 className="font-display font-bold text-lg text-ink-deep">Antrean Payout Komisi Barber</h3>
                                <p className="text-xs text-on-light-muted">Daftar akumulasi komisi barber yang belum dibayarkan oleh Owner.</p>
                            </div>
                            <div className="p-5 space-y-4">
                                {unpaidGrouped.length > 0 ? (
                                    unpaidGrouped.map((item) => (
                                        <div key={item.barber_id} className="p-4 border border-hairline-cloud rounded bg-surface-card/30 flex justify-between items-center hover:bg-surface-card/60 transition">
                                            <div className="space-y-1">
                                                <h4 className="font-display font-bold text-sm text-ink-deep">{item.barber_name}</h4>
                                                <p className="text-[10px] text-on-light-muted">📍 {item.branch_name} | {item.total_unpaid_records} Transaksi</p>
                                                <p className="text-xs font-bold text-accent-violet-deep mt-1">
                                                    Unpaid: Rp {new Intl.NumberFormat('id-ID').format(item.total_unpaid_commission)}
                                                </p>
                                            </div>
                                            <div className="flex flex-col gap-2 shrink-0">
                                                <button
                                                    onClick={() => openPayoutModal(item)}
                                                    className="px-3 py-1.5 bg-accent-lime text-ink-deep rounded font-sans font-bold text-[10px] hover:bg-accent-lime-muted transition text-center shadow-md shadow-accent-lime/10"
                                                >
                                                    Bayar Komisi
                                                </button>
                                                <button
                                                    onClick={() => openHistoryModal(item)}
                                                    className="px-3 py-1.5 border border-hairline-violet text-accent-violet-deep rounded font-semibold text-[10px] hover:bg-surface-press-light transition text-center"
                                                >
                                                    Riwayat Payout
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-6 text-on-light-muted italic text-xs">
                                        Semua komisi barber telah dilunasi.
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>

                </div>
            </div>

            {/* Payout Modal */}
            {payoutModalOpen && selectedBarber && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-card border border-hairline-cloud shadow-modal w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden text-ink">
                        <div className="p-5 border-b border-hairline-cloud flex justify-between items-center">
                            <div>
                                <h3 className="font-display font-bold text-lg text-ink-deep">Bayar Komisi: {selectedBarber.barber_name}</h3>
                                <p className="text-xs text-on-light-muted">Silahkan pilih transaksi komisi yang ingin dibayarkan.</p>
                            </div>
                            <button onClick={() => setPayoutModalOpen(false)} className="text-on-light-muted hover:text-ink-deep font-bold text-lg">✕</button>
                        </div>
                        
                        <div className="p-6 flex-1 overflow-y-auto space-y-6">
                            {loadingUnpaid ? (
                                <div className="text-center py-8">
                                    <div className="w-6 h-6 border-2 border-accent-violet border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                                    <p className="text-xs text-on-light-muted">Mengambil data transaksi belum dibayar...</p>
                                </div>
                            ) : unpaidRecords.length > 0 ? (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center text-xs pb-2 border-b border-hairline-cloud">
                                        <button 
                                            type="button"
                                            onClick={handleSelectAllRecords}
                                            className="text-accent-violet-deep font-bold hover:underline"
                                        >
                                            {selectedRecordIds.length === unpaidRecords.length ? 'Batal Pilih Semua' : 'Pilih Semua'}
                                        </button>
                                        <span className="text-on-light-muted font-medium">{selectedRecordIds.length} dari {unpaidRecords.length} Terpilih</span>
                                    </div>
                                    <div className="space-y-2 max-h-48 overflow-y-auto border border-hairline-cloud rounded p-2">
                                        {unpaidRecords.map(rec => (
                                            <label key={rec.id} className="flex items-center gap-3 p-2 rounded hover:bg-surface-card/40 cursor-pointer text-xs transition">
                                                <input 
                                                    type="checkbox"
                                                    checked={selectedRecordIds.includes(rec.id)}
                                                    onChange={() => handleToggleRecord(rec.id)}
                                                    className="rounded border-hairline-cloud text-accent-violet focus:ring-accent-violet"
                                                />
                                                <div className="flex-1 flex justify-between items-center">
                                                    <div>
                                                        <span className="font-bold text-ink-deep font-mono">{rec.invoice_number}</span>
                                                        <span className="text-on-light-muted mx-2">|</span>
                                                        <span>{rec.service_name}</span>
                                                        <span className="text-[10px] text-on-light-muted block">{rec.date}</span>
                                                    </div>
                                                    <span className="font-bold text-accent-violet-deep">
                                                        Rp {new Intl.NumberFormat('id-ID').format(rec.commission_amount)}
                                                    </span>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-6 text-on-light-muted italic text-xs">
                                    Tidak ada data komisi belum dibayar.
                                </div>
                            )}

                            {/* Payout Details Form */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                <div>
                                    <label className="block font-bold text-on-light-muted uppercase tracking-wider mb-2">Metode Pembayaran</label>
                                    <select 
                                        value={paymentMethod}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                        className="input-field w-full text-xs"
                                    >
                                        <option value="bank_transfer">Transfer Bank</option>
                                        <option value="cash">Tunai (Cash)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block font-bold text-on-light-muted uppercase tracking-wider mb-2">Nomor Referensi (Opsional)</label>
                                    <input 
                                        type="text"
                                        placeholder="cth: Resi Transfer, ID Transaksi"
                                        value={referenceNumber}
                                        onChange={(e) => setReferenceNumber(e.target.value)}
                                        className="input-field w-full text-xs"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block font-bold text-on-light-muted uppercase tracking-wider mb-2">Catatan Internal (Opsional)</label>
                                    <textarea 
                                        rows="2"
                                        placeholder="Catatan tambahan pembayaran komisi..."
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        className="input-field w-full text-xs"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-5 border-t border-hairline-cloud bg-surface-card flex justify-between items-center">
                            <div className="text-sm">
                                <span className="text-on-light-muted">Total Pembayaran:</span>
                                <span className="font-bold text-lg text-accent-violet-deep ml-2">
                                    Rp {new Intl.NumberFormat('id-ID').format(
                                        unpaidRecords
                                            .filter(r => selectedRecordIds.includes(r.id))
                                            .reduce((sum, r) => sum + r.commission_amount, 0)
                                    )}
                                </span>
                            </div>
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => setPayoutModalOpen(false)} 
                                    className="px-4 py-2 border border-hairline-cloud rounded text-on-light-muted hover:bg-surface-press-light transition text-xs font-semibold"
                                >
                                    Batal
                                </button>
                                <button 
                                    onClick={handleSubmitPayout}
                                    disabled={processingSubmit || selectedRecordIds.length === 0}
                                    className="px-5 py-2 bg-accent-lime text-ink-deep rounded font-display font-bold text-xs hover:bg-accent-lime-muted active:scale-98 transition shadow-lg shadow-accent-lime/10 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {processingSubmit ? 'Memproses...' : 'Proses Payout'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* History Modal */}
            {historyModalOpen && selectedBarber && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-card border border-hairline-cloud shadow-modal w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden text-ink">
                        <div className="p-5 border-b border-hairline-cloud flex justify-between items-center text-ink">
                            <div>
                                <h3 className="font-display font-bold text-lg text-ink-deep">Riwayat Payout: {selectedBarber.barber_name}</h3>
                                <p className="text-xs text-on-light-muted">Daftar transaksi pencairan komisi yang telah dibayarkan oleh Owner.</p>
                            </div>
                            <button onClick={() => setHistoryModalOpen(false)} className="text-on-light-muted hover:text-ink-deep font-bold text-lg">✕</button>
                        </div>
                        
                        <div className="p-6 flex-1 overflow-y-auto">
                            {loadingHistory ? (
                                <div className="text-center py-8">
                                    <div className="w-6 h-6 border-2 border-accent-violet border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                                    <p className="text-xs text-on-light-muted">Mengambil riwayat pembayaran...</p>
                                </div>
                            ) : payoutHistory.length > 0 ? (
                                <div className="overflow-x-auto border border-hairline-cloud rounded-card">
                                    <table className="w-full text-left border-collapse text-[11px]">
                                        <thead>
                                            <tr className="bg-surface-card border-b border-hairline-cloud font-bold text-on-light-muted uppercase tracking-wider text-left">
                                                <th className="py-3 px-4">Tanggal Payout</th>
                                                <th className="py-3 px-4">Metode</th>
                                                <th className="py-3 px-4">No. Referensi</th>
                                                <th className="py-3 px-4">Catatan</th>
                                                <th className="py-3 px-4">Oleh</th>
                                                <th className="py-3 px-4 text-right">Nominal</th>
                                                <th className="py-3 px-4 text-center">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-hairline-cloud text-ink-deep font-medium">
                                            {payoutHistory.map((p) => (
                                                <tr key={p.id} className="hover:bg-surface-card/40 transition">
                                                    <td className="py-3 px-4 text-on-light-muted font-mono">{p.paid_at}</td>
                                                    <td className="py-3 px-4 font-semibold">{p.payment_method === 'bank_transfer' ? 'Transfer Bank' : 'Tunai'}</td>
                                                    <td className="py-3 px-4 font-mono">{p.reference_number}</td>
                                                    <td className="py-3 px-4 max-w-[120px] truncate" title={p.notes}>{p.notes}</td>
                                                    <td className="py-3 px-4 text-on-light-muted">{p.paid_by_name}</td>
                                                    <td className="py-3 px-4 text-right font-bold text-accent-violet-deep">
                                                        Rp {new Intl.NumberFormat('id-ID').format(p.payout_amount)}
                                                    </td>
                                                    <td className="py-3 px-4 text-center">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedPayout(p);
                                                                setReceiptModalOpen(true);
                                                            }}
                                                            className="px-2.5 py-1 bg-primary hover:bg-primary-dark text-white rounded text-[10px] font-bold transition cursor-pointer"
                                                        >
                                                            Cetak
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-on-light-muted italic text-xs">
                                    Belum ada riwayat pembayaran komisi untuk barber ini.
                                </div>
                            )}
                        </div>

                        <div className="p-5 border-t border-hairline-cloud bg-surface-card flex justify-end">
                            <button 
                                onClick={() => setHistoryModalOpen(false)} 
                                className="px-5 py-2 bg-ink-deep text-white rounded font-sans font-bold text-xs hover:bg-ink-press transition"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Receipt Modal */}
            {receiptModalOpen && selectedPayout && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
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
                                    <div><span className="text-on-light-muted">Cabang:</span> <span className="font-semibold">{selectedBarber?.branch_name || '-'}</span></div>
                                    <div><span className="text-on-light-muted">Penerima (Barber):</span> <span className="font-bold text-primary">{selectedBarber?.barber_name}</span></div>
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
                                    <p className="font-bold mt-1.5">{selectedBarber?.barber_name}</p>
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
