import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

export default function POS({ booking, products = [] }) {
    const [cart, setCart] = useState([]);
    const [paymentType, setPaymentType] = useState('cash');
    const [processing, setProcessing] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    // Add product to cart
    const addToCart = (product) => {
        setErrorMsg('');
        const existing = cart.find(item => item.id === product.id);
        
        if (existing) {
            if (existing.qty >= product.stock) {
                setErrorMsg(`Stok tidak mencukupi untuk ${product.name} (Stok: ${product.stock})`);
                return;
            }
            setCart(cart.map(item => 
                item.id === product.id ? { ...item, qty: item.qty + 1 } : item
            ));
        } else {
            setCart([...cart, { ...product, qty: 1 }]);
        }
    };

    // Update quantity in cart
    const updateQty = (productId, amount, maxStock) => {
        setErrorMsg('');
        const item = cart.find(i => i.id === productId);
        if (!item) return;

        const newQty = item.qty + amount;

        if (newQty <= 0) {
            // Remove from cart
            setCart(cart.filter(i => i.id !== productId));
        } else {
            if (newQty > maxStock) {
                setErrorMsg(`Stok tidak mencukupi untuk ${item.name} (Stok: ${maxStock})`);
                return;
            }
            setCart(cart.map(i => 
                i.id === productId ? { ...i, qty: newQty } : i
            ));
        }
    };

    // Remove product from cart
    const removeFromCart = (productId) => {
        setCart(cart.filter(item => item.id !== productId));
    };

    // Calculate totals
    const totalService = booking ? booking.service_price : 0;
    const totalProduct = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
    const grandTotal = totalService + totalProduct;

    // Handle POS Checkout Submit
    const handleCheckout = (e) => {
        e.preventDefault();
        setProcessing(true);
        setErrorMsg('');

        const payload = {
            booking_id: booking ? booking.id : null,
            payment_type: paymentType,
            products: cart.map(item => ({
                id: item.id,
                qty: item.qty
            }))
        };

        router.post(route('cashier.pos.checkout'), payload, {
            onFinish: () => {
                setProcessing(false);
            },
            onError: (errs) => {
                if (errs.error) {
                    setErrorMsg(errs.error);
                } else {
                    setErrorMsg('Gagal memproses transaksi. Periksa kembali input Anda.');
                }
            }
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold font-sans text-ink leading-tight">
                            Point of Sale (POS) Checkout
                        </h2>
                        <p className="text-xs text-on-light-muted mt-1">
                            {booking ? 'Proses transaksi potong rambut & penjualan produk ritel' : 'Transaksi pembelian produk retail langsung'}
                        </p>
                    </div>
                    <Link
                        href={route('cashier.dashboard')}
                        className="px-4 py-2 border border-hairline-cool text-on-light-muted rounded text-xs font-semibold hover:bg-surface-card"
                    >
                        KEMBALI KE ANTRIAN
                    </Link>
                </div>
            }
        >
            <Head title="Kasir POS" />

            <div className="py-6 px-4 sm:px-6 lg:px-8 bg-surface-canvas-light text-ink min-h-screen">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Left: Product Catalog (Grid of cards) */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white p-5 border border-hairline-cloud rounded-card shadow-card">
                            <h3 className="font-display font-bold text-lg text-ink-deep mb-4">Produk Retail Cabang</h3>
                            
                            {products.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    {products.map((product) => (
                                        <div 
                                            key={product.id}
                                            className="border border-hairline-cloud rounded-lg p-3 bg-surface-card hover:border-accent-violet transition flex flex-col justify-between overflow-hidden"
                                        >
                                            <div>
                                                {product.photo_path ? (
                                                    <div className="aspect-[4/3] w-full rounded bg-primary-deeper border border-hairline-cloud mb-3 overflow-hidden">
                                                        <img src={`/storage/${product.photo_path}`} alt={product.name} className="w-full h-full object-cover" />
                                                    </div>
                                                ) : (
                                                    <div className="aspect-[4/3] w-full rounded bg-primary-deeper border border-hairline-cloud mb-3 flex items-center justify-center">
                                                        <span className="text-xl">🧴</span>
                                                    </div>
                                                )}
                                                <span className="px-2 py-0.5 rounded bg-white border border-hairline-cool text-[9px] uppercase font-bold text-on-light-muted tracking-wider">
                                                    {product.category}
                                                </span>
                                                <h4 className="font-semibold text-sm text-ink-deep mt-2 mb-1 line-clamp-1">{product.name}</h4>
                                                <span className="text-xs text-on-light-muted block mb-3">Stok: {product.stock} pcs</span>
                                            </div>
                                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-hairline-cloud/40">
                                                <span className="font-bold text-sm text-accent-violet-deep">
                                                    Rp {new Intl.NumberFormat('id-ID').format(product.price)}
                                                </span>
                                                <button
                                                    onClick={() => addToCart(product)}
                                                    className="p-1.5 rounded-full bg-primary text-white hover:bg-primary-dark active:scale-95 transition"
                                                    title="Tambah ke Keranjang"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                        <path d="M12 5v14M5 12h14" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-on-light-muted italic text-center py-8">
                                    Stok produk habis atau tidak tersedia di cabang ini saat ini.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Right: Checkout Cart & Submit */}
                    <div className="space-y-6">
                        <div className="bg-white p-6 border border-hairline-cloud rounded-card shadow-card space-y-6 sticky top-24">
                            <h3 className="font-display font-bold text-lg text-ink-deep border-b border-hairline-cloud pb-3">Ringkasan Checkout</h3>
                            
                            {errorMsg && (
                                <div className="p-3 bg-status-danger/10 border border-status-danger/35 rounded text-status-danger text-xs font-semibold leading-relaxed">
                                    ⚠️ {errorMsg}
                                </div>
                            )}

                            {/* Service Section (Auto-loaded from Booking, Cannot delete) */}
                            {booking && (
                                <div className="space-y-3">
                                    <span className="text-[10px] font-bold text-on-light-muted uppercase tracking-widest block">Layanan Potong Rambut</span>
                                    <div className="p-4 bg-primary/5 border border-accent-violet/20 rounded-lg flex justify-between items-center">
                                        <div>
                                            <h4 className="font-bold text-sm text-ink-deep">{booking.service_name}</h4>
                                            <p className="text-xs text-on-light-muted">Barber: {booking.barber_name}</p>
                                        </div>
                                        <span className="font-bold text-sm text-ink">
                                            Rp {new Intl.NumberFormat('id-ID').format(booking.service_price)}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Retail Products Cart Section */}
                            <div className="space-y-3">
                                <span className="text-[10px] font-bold text-on-light-muted uppercase tracking-widest block">Penjualan Produk Retail</span>
                                
                                {cart.length > 0 ? (
                                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                        {cart.map((item) => (
                                            <div key={item.id} className="p-3 border border-hairline-cloud rounded-lg flex justify-between items-center bg-white text-xs">
                                                <div className="flex-1 mr-2">
                                                    <h4 className="font-bold text-ink-deep truncate">{item.name}</h4>
                                                    <span className="text-on-light-muted">Rp {new Intl.NumberFormat('id-ID').format(item.price)}</span>
                                                </div>
                                                <div className="flex items-center space-x-2.5">
                                                    {/* Qty Adjustment */}
                                                    <div className="flex items-center border border-hairline-cool rounded overflow-hidden">
                                                        <button 
                                                            type="button"
                                                            onClick={() => updateQty(item.id, -1, item.stock)}
                                                            className="px-2 py-1 bg-surface-card hover:bg-hairline-cloud text-ink font-bold"
                                                        >
                                                            -
                                                        </button>
                                                        <span className="px-2.5 py-1 text-xs font-bold bg-white text-ink-deep">{item.qty}</span>
                                                        <button 
                                                            type="button"
                                                            onClick={() => updateQty(item.id, 1, item.stock)}
                                                            className="px-2 py-1 bg-surface-card hover:bg-hairline-cloud text-ink font-bold"
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                    {/* Delete button */}
                                                    <button
                                                        type="button"
                                                        onClick={() => removeFromCart(item.id)}
                                                        className="text-status-danger hover:text-red-600 p-1 text-xs font-medium"
                                                    >
                                                        Hapus
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-on-light-muted italic text-center py-4 bg-surface-card rounded border border-hairline-cloud/55">
                                        Tidak ada produk retail ditambahkan.
                                    </p>
                                )}
                            </div>

                            {/* Subtotals & Payment Form */}
                            <form onSubmit={handleCheckout} className="space-y-4 pt-4 border-t border-hairline-cloud">
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between text-on-light-muted">
                                        <span>Total Layanan:</span>
                                        <span>Rp {new Intl.NumberFormat('id-ID').format(totalService)}</span>
                                    </div>
                                    <div className="flex justify-between text-on-light-muted">
                                        <span>Total Produk Retail:</span>
                                        <span>Rp {new Intl.NumberFormat('id-ID').format(totalProduct)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-ink-deep font-bold text-lg border-t border-hairline-cloud/60 pt-2">
                                        <span>GRAND TOTAL:</span>
                                        <span className="text-accent-violet-deep">
                                            Rp {new Intl.NumberFormat('id-ID').format(grandTotal)}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-xs font-bold text-on-light-muted uppercase tracking-wider">Metode Pembayaran</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['cash', 'transfer', 'qris'].map(type => (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => setPaymentType(type)}
                                                className={`py-2 px-3 rounded-md text-xs font-bold border capitalize transition text-center ${
                                                    paymentType === type
                                                    ? 'bg-primary border-primary text-white shadow-sm'
                                                    : 'bg-white border-hairline-cool text-ink hover:border-primary'
                                                }`}
                                            >
                                                {type === 'qris' ? 'QRIS' : type}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full btn-primary py-3.5 flex items-center justify-center space-x-2 text-sm shadow-md"
                                >
                                    {processing ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            <span>MEMPROSES PEMBAYARAN...</span>
                                        </>
                                    ) : (
                                        <span>PROSES TRANSAKSI & SELESAI</span>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
