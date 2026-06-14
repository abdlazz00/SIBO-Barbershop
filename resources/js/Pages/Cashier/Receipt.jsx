import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

export default function Receipt({ transaction, items = [], branch }) {
    const handlePrint = () => {
        window.print();
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center print:hidden">
                    <div>
                        <h2 className="text-xl font-bold font-sans text-ink leading-tight">
                            Struk Transaksi Pembayaran
                        </h2>
                        <p className="text-xs text-on-light-muted mt-1">
                            Pencetakan nota transaksi thermal kasir
                        </p>
                    </div>
                    <div className="space-x-3">
                        <Link
                            href={route('cashier.dashboard')}
                            className="px-4 py-2 border border-hairline-cool text-on-light-muted rounded text-xs font-semibold hover:bg-surface-card"
                        >
                            KEMBALI KE ANTRIAN
                        </Link>
                        <button
                            onClick={handlePrint}
                            className="btn-accent px-5 py-2.5 text-xs font-bold shadow-md"
                        >
                            🖨️ CETAK NOTA
                        </button>
                    </div>
                </div>
            }
        >
            <Head title={`Receipt - ${transaction.invoice_number}`} />

            {/* Print CSS override */}
            <style dangerouslySetInnerHTML={{__html: `
                @media print {
                    body * {
                        visibility: hidden;
                        background: white !important;
                        color: black !important;
                    }
                    #thermal-receipt, #thermal-receipt * {
                        visibility: visible;
                    }
                    #thermal-receipt {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 80mm !important;
                        margin: 0 !important;
                        padding: 10px !important;
                        border: none !important;
                        box-shadow: none !important;
                    }
                    .print-hide {
                        display: none !important;
                    }
                }
            `}} />

            <div className="py-10 px-4 bg-surface-canvas-light text-ink min-h-screen flex justify-center items-start">
                
                {/* Thermal Receipt Card Box */}
                <div 
                    id="thermal-receipt" 
                    className="w-full max-w-[80mm] bg-white border border-hairline-cloud rounded-lg p-6 shadow-card font-mono text-xs text-ink-deep leading-relaxed space-y-4"
                >
                    {/* Header */}
                    <div className="text-center space-y-1">
                        <h3 className="font-display font-bold text-sm text-ink-deep tracking-wider uppercase">HOWELL BARBERSHOP</h3>
                        <p className="text-[10px] font-semibold">{branch.name}</p>
                        <p className="text-[9px] text-on-light-muted leading-tight">{branch.address}</p>
                        <p className="text-[9px] text-on-light-muted">Telp: {branch.phone}</p>
                    </div>

                    <div className="border-t border-dashed border-hairline-cloud/80 pt-3 space-y-1 text-[10px]">
                        <div className="flex justify-between">
                            <span>No. Nota :</span>
                            <span className="font-bold">{transaction.invoice_number}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Tanggal  :</span>
                            <span>{transaction.created_at}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Kasir    :</span>
                            <span>{transaction.cashier_name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Barber   :</span>
                            <span>{transaction.barber_name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Customer :</span>
                            <span>{transaction.customer_name}</span>
                        </div>
                    </div>

                    {/* Transaction Items */}
                    <div className="border-t border-b border-dashed border-hairline-cloud/80 py-3 space-y-2 text-[10px]">
                        {items.map((item, idx) => (
                            <div key={idx} className="space-y-0.5">
                                <div className="flex justify-between font-bold">
                                    <span>{item.name}</span>
                                    <span>Rp {new Intl.NumberFormat('id-ID').format(item.subtotal)}</span>
                                </div>
                                <div className="text-[9px] text-on-light-muted">
                                    {item.qty} x Rp {new Intl.NumberFormat('id-ID').format(item.unit_price)}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Totals */}
                    <div className="space-y-1 text-[10px] pt-1">
                        <div className="flex justify-between text-on-light-muted">
                            <span>Total Layanan:</span>
                            <span>Rp {new Intl.NumberFormat('id-ID').format(transaction.total_service)}</span>
                        </div>
                        {transaction.total_product > 0 && (
                            <div className="flex justify-between text-on-light-muted">
                                <span>Total Produk:</span>
                                <span>Rp {new Intl.NumberFormat('id-ID').format(transaction.total_product)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-base font-bold pt-2 border-t border-dashed border-hairline-cloud/85">
                            <span>TOTAL:</span>
                            <span>Rp {new Intl.NumberFormat('id-ID').format(transaction.grand_total)}</span>
                        </div>
                        <div className="flex justify-between text-[10px] pt-1.5 font-bold uppercase tracking-wider text-accent-violet">
                            <span>Pembayaran:</span>
                            <span>{transaction.payment_type}</span>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="border-t border-dashed border-hairline-cloud/80 pt-4 text-center space-y-1">
                        <p className="text-[10px] font-bold">TERIMA KASIH ATAS KUNJUNGAN ANDA</p>
                        <p className="text-[9px] text-on-light-muted leading-tight">Kepuasan & kenyamanan Anda adalah komitmen utama kami.</p>
                        <p className="text-[9px] text-on-light-muted">Instagram: @howell.barber</p>
                    </div>

                </div>

            </div>
        </AuthenticatedLayout>
    );
}
