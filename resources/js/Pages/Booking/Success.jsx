import { Head, Link } from '@inertiajs/react';

export default function Success({ booking }) {
    return (
        <>
            <Head title="Booking Berhasil | Howell Barbershop" />
            <div className="min-h-screen bg-primary-deeper text-white font-sans flex flex-col justify-between selection:bg-accent-lime selection:text-ink-deep">
                
                {/* Header */}
                <header className="border-b border-hairline-violet bg-primary-deeper/90 sticky top-0 z-40">
                    <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
                        <Link href="/" className="font-display font-bold text-sm tracking-widest text-accent-lime">
                            HOWELL BARBERSHOP
                        </Link>
                        <span className="font-display font-bold tracking-tight text-xs text-on-dark-muted uppercase">
                            Booking Berhasil
                        </span>
                        <div className="w-12 h-1" />
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 max-w-lg w-full mx-auto px-4 py-12 flex flex-col justify-center items-center">
                    
                    {/* Success Icon */}
                    <div className="w-20 h-20 rounded-full bg-status-success/10 border border-status-success/30 flex items-center justify-center text-status-success mb-8 shadow-lg shadow-status-success/10">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                    </div>

                    <h1 className="font-display font-bold text-3xl text-center mb-2">Booking Terkonfirmasi!</h1>
                    <p className="text-sm text-on-dark-muted text-center mb-8 max-w-sm">
                        Terima kasih. Pesanan Anda telah diterima sistem dan siap dilayani. Silahkan tunjukkan tiket digital ini saat tiba di outlet.
                    </p>

                    {/* Ticket Design */}
                    <div className="w-full bg-primary-dark/80 border border-hairline-violet rounded-card overflow-hidden shadow-2xl relative">
                        {/* Decorative side cuts */}
                        <div className="absolute top-1/2 -left-3 w-6 h-6 bg-primary-deeper rounded-full border-r border-hairline-violet -translate-y-1/2" />
                        <div className="absolute top-1/2 -right-3 w-6 h-6 bg-primary-deeper rounded-full border-l border-hairline-violet -translate-y-1/2" />

                        {/* Top Ticket Section */}
                        <div className="p-6 border-b border-dashed border-hairline-violet/50">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <span className="text-[10px] font-bold text-on-dark-muted uppercase tracking-widest block mb-1">Kode Booking</span>
                                    <span className="font-display font-bold text-lg text-accent-lime uppercase">
                                        {booking.uuid.substring(0, 8)}...
                                    </span>
                                </div>
                                <div className="text-right">
                                    <span className="px-2.5 py-0.5 rounded bg-status-success/20 border border-status-success/30 text-[10px] font-bold text-status-success uppercase tracking-wider">
                                        Confirmed
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-3 text-sm">
                                <div>
                                    <span className="text-[10px] font-bold text-on-dark-muted uppercase tracking-widest block mb-0.5">Nama Pelanggan</span>
                                    <span className="font-semibold text-white">{booking.customer_name}</span>
                                    <span className="block text-xs text-on-dark-muted">{booking.customer_phone}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-on-dark-muted uppercase tracking-widest block mb-0.5">Outlet Cabang</span>
                                    <span className="font-semibold text-white">{booking.branch_name}</span>
                                    <span className="block text-xs text-on-dark-muted">{booking.branch_address}</span>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Ticket Section */}
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-[10px] font-bold text-on-dark-muted uppercase tracking-widest block mb-0.5">Layanan</span>
                                    <span className="font-semibold text-white">{booking.service_name}</span>
                                    <span className="block text-xs text-on-dark-muted">{booking.service_duration} Menit</span>
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-on-dark-muted uppercase tracking-widest block mb-0.5">Barber</span>
                                    <span className="font-semibold text-white">{booking.barber_name}</span>
                                </div>
                            </div>

                            <div className="border-t border-hairline-violet/30 pt-4 grid grid-cols-2 gap-4 items-center">
                                <div>
                                    <span className="text-[10px] font-bold text-on-dark-muted uppercase tracking-widest block mb-0.5">Jadwal Janji</span>
                                    <span className="font-semibold text-white block">{booking.slot_start} WIB</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] font-bold text-on-dark-muted uppercase tracking-widest block mb-0.5">Estimasi Harga</span>
                                    <span className="font-display font-bold text-xl text-accent-lime">
                                        Rp {new Intl.NumberFormat('id-ID').format(booking.price)}
                                    </span>
                                </div>
                            </div>

                            {/* Pseudo Barcode/QR Code for Premium Look */}
                            <div className="border-t border-hairline-violet/30 pt-6 flex flex-col items-center">
                                <div className="bg-white p-3 rounded-md shadow-md">
                                    {/* Inline SVG QR Code Placeholder */}
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-24 h-24 text-ink" viewBox="0 0 100 100">
                                        {/* Outer border */}
                                        <rect width="100" height="100" fill="white" />
                                        {/* Finder Patterns */}
                                        <rect x="5" y="5" width="25" height="25" fill="black" />
                                        <rect x="9" y="9" width="17" height="17" fill="white" />
                                        <rect x="13" y="13" width="9" height="9" fill="black" />

                                        <rect x="70" y="5" width="25" height="25" fill="black" />
                                        <rect x="74" y="9" width="17" height="17" fill="white" />
                                        <rect x="78" y="13" width="9" height="9" fill="black" />

                                        <rect x="5" y="70" width="25" height="25" fill="black" />
                                        <rect x="9" y="74" width="17" height="17" fill="white" />
                                        <rect x="13" y="78" width="9" height="9" fill="black" />
                                        
                                        {/* Random bits mock */}
                                        <rect x="35" y="5" width="10" height="10" fill="black" />
                                        <rect x="50" y="15" width="15" height="5" fill="black" />
                                        <rect x="40" y="25" width="5" height="15" fill="black" />
                                        <rect x="5" y="35" width="15" height="10" fill="black" />
                                        <rect x="25" y="45" width="20" height="5" fill="black" />
                                        <rect x="55" y="35" width="10" height="20" fill="black" />
                                        
                                        <rect x="75" y="35" width="15" height="5" fill="black" />
                                        <rect x="70" y="45" width="5" height="15" fill="black" />
                                        <rect x="85" y="55" width="10" height="10" fill="black" />
                                        
                                        <rect x="35" y="70" width="5" height="20" fill="black" />
                                        <rect x="50" y="80" width="15" height="10" fill="black" />
                                        <rect x="45" y="60" width="10" height="5" fill="black" />
                                        <rect x="75" y="75" width="20" height="5" fill="black" />
                                        <rect x="70" y="85" width="15" height="10" fill="black" />
                                    </svg>
                                </div>
                                <span className="text-[9px] text-on-dark-muted uppercase tracking-widest mt-2">
                                    UUID: {booking.uuid}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Navigation Buttons */}
                    <div className="mt-8 flex flex-col sm:flex-row gap-4 w-full justify-center">
                        <Link
                            href="/"
                            className="text-center px-6 py-3 rounded-md border border-hairline-violet text-white text-sm font-semibold hover:bg-white/5 transition duration-200"
                        >
                            KEMBALI KE BERANDA
                        </Link>
                        <Link
                            href={route('booking.index')}
                            className="text-center px-6 py-3 rounded-md bg-accent-lime text-ink-deep font-display font-bold text-sm hover:bg-accent-lime-muted transition duration-200 shadow-md"
                        >
                            BUAT BOOKING BARU
                        </Link>
                    </div>

                </main>

                {/* Footer */}
                <footer className="border-t border-hairline-violet bg-primary-deeper py-6 text-center text-xs text-on-dark-muted">
                    &copy; {new Date().getFullYear()} Howell Barbershop. All Rights Reserved.
                </footer>
            </div>
        </>
    );
}
