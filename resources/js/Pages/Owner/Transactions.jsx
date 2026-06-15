import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

export default function Transactions({ transactions = [], branches = [], filters = {} }) {
    const [search, setSearch] = useState(filters.search || '');
    const [branchId, setBranchId] = useState(filters.branch_id || '');
    const [dateStart, setDateStart] = useState(filters.date_start || '');
    const [dateEnd, setDateEnd] = useState(filters.date_end || '');
    const [paymentType, setPaymentType] = useState(filters.payment_type || '');

    const handleSearch = (e) => {
        e.preventDefault();
        applyFilters();
    };

    const applyFilters = () => {
        router.get(route('owner.transactions.index'), {
            search,
            branch_id: branchId,
            date_start: dateStart,
            date_end: dateEnd,
            payment_type: paymentType
        }, {
            preserveState: true,
            replace: true
        });
    };

    const handleReset = () => {
        setSearch('');
        setBranchId('');
        setDateStart('');
        setDateEnd('');
        setPaymentType('');
        router.get(route('owner.transactions.index'), {});
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
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="font-display font-bold text-2xl text-ink leading-tight">
                            Riwayat Transaksi Global
                        </h2>
                        <p className="text-sm text-on-light-muted mt-1">
                            Kelola dan tinjau seluruh transaksi pembayaran dari semua cabang.
                        </p>
                    </div>
                </div>
            }
        >
            <Head title="Riwayat Transaksi Global" />

            <div className="py-8 px-6 sm:px-8 max-w-7xl mx-auto space-y-6">
                {/* Filter Card */}
                <div className="bg-white rounded-xl border border-hairline-cloud p-5 shadow-card">
                    <form onSubmit={handleSearch} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                            {/* Search */}
                            <div>
                                <label className="block text-xs font-semibold text-on-light-muted uppercase tracking-wider mb-2">
                                    Cari Transaksi
                                </label>
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="No. Invoice, customer, barber..."
                                    className="w-full text-sm rounded-lg border-hairline-cloud focus:border-[#7C5CBF] focus:ring focus:ring-ring-focus bg-surface-canvas-light text-ink placeholder:text-on-light-faint px-3 py-2"
                                />
                            </div>

                            {/* Branch Filter */}
                            <div>
                                <label className="block text-xs font-semibold text-on-light-muted uppercase tracking-wider mb-2">
                                    Cabang
                                </label>
                                <select
                                    value={branchId}
                                    onChange={(e) => setBranchId(e.target.value)}
                                    className="w-full text-sm rounded-lg border-hairline-cloud focus:border-[#7C5CBF] focus:ring focus:ring-ring-focus bg-surface-canvas-light text-ink px-3 py-2"
                                >
                                    <option value="">Semua Cabang</option>
                                    {branches.map((b) => (
                                        <option key={b.id} value={b.id}>{b.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Date Start */}
                            <div>
                                <label className="block text-xs font-semibold text-on-light-muted uppercase tracking-wider mb-2">
                                    Mulai Tanggal
                                </label>
                                <input
                                    type="date"
                                    value={dateStart}
                                    onChange={(e) => setDateStart(e.target.value)}
                                    className="w-full text-sm rounded-lg border-hairline-cloud focus:border-[#7C5CBF] focus:ring focus:ring-ring-focus bg-surface-canvas-light text-ink px-3 py-2"
                                />
                            </div>

                            {/* Date End */}
                            <div>
                                <label className="block text-xs font-semibold text-on-light-muted uppercase tracking-wider mb-2">
                                    Sampai Tanggal
                                </label>
                                <input
                                    type="date"
                                    value={dateEnd}
                                    onChange={(e) => setDateEnd(e.target.value)}
                                    className="w-full text-sm rounded-lg border-hairline-cloud focus:border-[#7C5CBF] focus:ring focus:ring-ring-focus bg-surface-canvas-light text-ink px-3 py-2"
                                />
                            </div>

                            {/* Payment Type */}
                            <div>
                                <label className="block text-xs font-semibold text-on-light-muted uppercase tracking-wider mb-2">
                                    Tipe Pembayaran
                                </label>
                                <select
                                    value={paymentType}
                                    onChange={(e) => setPaymentType(e.target.value)}
                                    className="w-full text-sm rounded-lg border-hairline-cloud focus:border-[#7C5CBF] focus:ring focus:ring-ring-focus bg-surface-canvas-light text-ink px-3 py-2"
                                >
                                    <option value="">Semua Metode</option>
                                    <option value="cash">CASH</option>
                                    <option value="transfer">TRANSFER</option>
                                    <option value="qris">QRIS</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 pt-2">
                            <button
                                type="button"
                                onClick={handleReset}
                                className="px-4 py-2 border border-hairline-cool hover:bg-surface-press-light rounded-lg text-xs font-bold text-on-light-muted uppercase tracking-wide transition cursor-pointer"
                            >
                                Reset Filter
                            </button>
                            <button
                                type="submit"
                                className="px-5 py-2 bg-primary hover:bg-primary-dark rounded-lg text-xs font-bold text-white uppercase tracking-wide transition cursor-pointer shadow-sm"
                            >
                                Terapkan Filter
                            </button>
                        </div>
                    </form>
                </div>

                {/* Table Card */}
                <div className="bg-white rounded-xl border border-hairline-cloud shadow-card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-hairline-cloud bg-[#f8f7ff]/50 text-[11px] font-bold text-on-light-muted uppercase tracking-wider">
                                    <th className="px-6 py-4">No. Invoice</th>
                                    <th className="px-6 py-4">Cabang</th>
                                    <th className="px-6 py-4">Waktu</th>
                                    <th className="px-6 py-4">Customer</th>
                                    <th className="px-6 py-4">Barber</th>
                                    <th className="px-6 py-4 text-right">Layanan</th>
                                    <th className="px-6 py-4 text-right">Produk</th>
                                    <th className="px-6 py-4 text-right">Total Transaksi</th>
                                    <th className="px-6 py-4 text-center">Metode</th>
                                    <th className="px-6 py-4 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-hairline-cloud text-sm text-ink-deep font-medium">
                                {transactions.length === 0 ? (
                                    <tr>
                                        <td colSpan="10" className="text-center py-12 text-on-light-faint font-medium">
                                            Tidak ada riwayat transaksi ditemukan.
                                        </td>
                                    </tr>
                                ) : (
                                    transactions.map((tx) => (
                                        <tr key={tx.id} className="hover:bg-[#f8f7ff]/20 transition duration-150">
                                            <td className="px-6 py-4 font-mono font-bold text-primary">
                                                {tx.invoice_number}
                                            </td>
                                            <td className="px-6 py-4 font-semibold text-xs text-on-light-muted">
                                                {tx.branch_name}
                                            </td>
                                            <td className="px-6 py-4 text-xs text-on-light-muted">
                                                {tx.created_at}
                                            </td>
                                            <td className="px-6 py-4 font-semibold">
                                                {tx.customer_name}
                                            </td>
                                            <td className="px-6 py-4">
                                                {tx.barber_name}
                                            </td>
                                            <td className="px-6 py-4 text-right font-semibold">
                                                {formatCurrency(tx.total_service)}
                                            </td>
                                            <td className="px-6 py-4 text-right font-semibold">
                                                {formatCurrency(tx.total_product)}
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-ink-deep">
                                                {formatCurrency(tx.grand_total)}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-block text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                                                    tx.payment_type === 'QRIS' 
                                                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' 
                                                        : tx.payment_type === 'TRANSFER'
                                                        ? 'bg-blue-50 text-blue-600 border border-blue-200'
                                                        : 'bg-amber-50 text-amber-600 border border-amber-200'
                                                }`}>
                                                    {tx.payment_type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <Link
                                                    href={route('owner.transactions.receipt', tx.uuid)}
                                                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 border border-hairline-cool hover:bg-[#7C5CBF] hover:text-white rounded-lg text-xs font-bold text-primary transition duration-150 cursor-pointer"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.617 0-1.11-.474-1.12-1.09l-.229-2.66m11.77 0a42.008 42.008 0 0 0-11.77 0M19.27 10.125c.069-.617-.38-1.16-1.002-1.197a44.47 44.47 0 0 0-12.536 0c-.621.037-1.07.58-1.002 1.197L5.34 18h13.32l.61-7.875ZM6 6h12V3.75A1.75 1.75 0 0 0 16.25 2h-8.5A1.75 1.75 0 0 0 6 3.75V6Z" />
                                                    </svg>
                                                    <span>Lihat Struk</span>
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
