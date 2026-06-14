import { Head, Link } from '@inertiajs/react';

export default function Welcome({ auth, branches = [], services = [], barbers = [] }) {
    return (
        <>
            <Head title="Howell Barbershop - Premium Grooming Experience" />
            <div className="min-h-screen bg-primary-deeper text-white font-sans selection:bg-accent-lime selection:text-ink-deep">
                
                {/* Navbar */}
                <header className="sticky top-0 z-50 backdrop-blur-md bg-primary-deeper/80 border-b border-hairline-violet">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                        {/* Logo */}
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-lg bg-accent-lime flex items-center justify-center shadow-lg shadow-accent-lime/20">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-ink-deep" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M3 7V5a2 2 0 0 1 2-2h2" />
                                    <path d="M17 3h2a2 2 0 0 1 2 2v2" />
                                    <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
                                    <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
                                    <path d="M9.5 12h5" />
                                    <circle cx="12" cy="12" r="3" />
                                </svg>
                            </div>
                            <span className="font-display font-bold text-xl tracking-tight bg-gradient-to-r from-white to-on-dark-muted bg-clip-text text-transparent">
                                HOWELL <span className="text-accent-lime">BARBERSHOP</span>
                            </span>
                        </div>

                        {/* Nav Links */}
                        <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-on-dark-muted">
                            <a href="#about" className="hover:text-white transition duration-200">Tentang Kami</a>
                            <a href="#services" className="hover:text-white transition duration-200">Layanan</a>
                            <a href="#barbers" className="hover:text-white transition duration-200">Barber</a>
                            <a href="#branches" className="hover:text-white transition duration-200">Cabang</a>
                        </nav>

                        {/* CTAs */}
                        <div className="flex items-center space-x-4">
                            {auth.user ? (
                                <div className="flex items-center space-x-3">
                                    {auth.user.role === 'customer' ? (
                                        <Link
                                            href={route('profile.edit')}
                                            className="px-4 py-2 text-sm font-semibold rounded-md border border-accent-lime text-accent-lime hover:bg-accent-lime hover:text-ink-deep transition duration-200 shadow-md shadow-accent-lime/10"
                                        >
                                            Profil Saya
                                        </Link>
                                    ) : (
                                        <Link
                                            href={route('dashboard')}
                                            className="px-4 py-2 text-sm font-semibold rounded-md border border-accent-lime text-accent-lime hover:bg-accent-lime hover:text-ink-deep transition duration-200 shadow-md shadow-accent-lime/10"
                                        >
                                            Dashboard
                                        </Link>
                                    )}
                                    <Link
                                        method="post"
                                        as="button"
                                        href={route('logout')}
                                        className="text-sm font-medium text-on-dark-muted hover:text-white transition duration-200"
                                    >
                                        Keluar
                                    </Link>
                                </div>
                            ) : (
                                <>
                                    <Link
                                        href={route('login')}
                                        className="text-sm font-medium text-on-dark-muted hover:text-white transition duration-200"
                                    >
                                        Masuk
                                    </Link>
                                    <Link
                                        href={route('register')}
                                        className="hidden sm:inline-block text-sm font-medium px-4 py-2 rounded-md border border-hairline-violet text-white hover:bg-white/5 transition duration-200"
                                    >
                                        Daftar
                                    </Link>
                                </>
                            )}
                            <Link
                                href={route('booking.index')}
                                className="px-5 py-2.5 rounded-md bg-accent-lime text-ink-deep font-display font-bold text-sm hover:bg-accent-lime-muted active:scale-98 transition duration-200 shadow-lg shadow-accent-lime/20"
                            >
                                BOOK NOW
                            </Link>
                        </div>
                    </div>
                </header>

                {/* Hero Section */}
                <section className="relative overflow-hidden pt-20 pb-32 lg:pt-32 lg:pb-40 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary via-primary-deeper to-primary-deeper">
                    {/* Decorative Elements */}
                    <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accent-violet/10 rounded-full blur-3xl -z-10" />
                    
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full border border-hairline-violet bg-primary-dark/80 text-xs font-semibold text-accent-lime tracking-wide uppercase mb-8">
                            <span>★</span>
                            <span>Barbershop Premium Multi-Cabang</span>
                            <span>★</span>
                        </div>
                        
                        <h1 className="font-display font-bold text-5xl md:text-7xl lg:text-8xl tracking-tight leading-none mb-8">
                            Premium Grooming<br />
                            For The <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-lime to-accent-lime-muted">Gentlemen</span>
                        </h1>
                        
                        <p className="max-w-2xl mx-auto text-on-dark-muted text-base md:text-lg lg:text-xl leading-relaxed mb-12">
                            Rasakan standar ketampanan baru dengan layanan premium di Howell Barbershop. Pangkas rambut presisi, pijat relaksasi kepala, dan pewarnaan kelas dunia oleh barber ahli.
                        </p>

                        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                            <Link
                                href={route('booking.index')}
                                className="w-full sm:w-auto px-8 py-4 rounded-md bg-accent-lime text-ink-deep font-display font-bold text-base hover:bg-accent-lime-muted hover:shadow-xl hover:shadow-accent-lime/30 active:scale-98 transition duration-200"
                            >
                                BUAT JANJI SEKARANG
                            </Link>
                            <a
                                href="#services"
                                className="w-full sm:w-auto px-8 py-4 rounded-md border border-hairline-violet text-white font-medium hover:bg-white/5 transition duration-200"
                            >
                                LIHAT LAYANAN
                            </a>
                        </div>
                    </div>
                </section>

                {/* About Section */}
                <section id="about" className="py-24 border-t border-b border-hairline-violet bg-primary-dark/50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                            <div>
                                <span className="text-xs font-semibold tracking-widest text-accent-lime uppercase block mb-4">Filosofi Kami</span>
                                <h2 className="font-display font-bold text-3xl md:text-4xl lg:text-5xl leading-tight mb-8">
                                    Bukan Sekadar Potong Rambut, Ini Adalah Seni & Relaksasi
                                </h2>
                                <p className="text-on-dark-muted leading-relaxed mb-6">
                                    Howell Barbershop hadir dengan dedikasi tinggi untuk menghadirkan pengalaman potong rambut terbaik. Kami menggabungkan keterampilan klasik barbering tradisional dengan gaya modern terkini untuk memberikan hasil presisi yang sesuai karakter Anda.
                                </p>
                                <p className="text-on-dark-muted leading-relaxed">
                                    Dari cuci rambut dengan air hangat hingga pijat relaksasi yang menyegarkan, setiap menit kunjungan Anda dirancang untuk menghadirkan kenyamanan maksimal.
                                </p>
                            </div>
                            <div className="relative">
                                {/* Decorative frame */}
                                <div className="absolute -top-4 -left-4 w-full h-full border-2 border-dashed border-hairline-violet rounded-xxl -z-10" />
                                <div className="aspect-[4/3] rounded-xxl overflow-hidden bg-primary-deeper flex items-center justify-center border border-hairline-violet shadow-2xl">
                                    <div className="text-center p-8">
                                        <div className="w-16 h-16 rounded-full bg-accent-lime/10 flex items-center justify-center mx-auto mb-4 border border-accent-lime/30">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-accent-lime" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M6 3h12" />
                                                <path d="M12 3v18" />
                                                <path d="M8 7h8" />
                                                <path d="M10 12h4" />
                                                <path d="m8 21 4-4 4 4" />
                                            </svg>
                                        </div>
                                        <h3 className="font-display font-semibold text-xl mb-2 text-white">Higienitas Terjamin</h3>
                                        <p className="text-sm text-on-dark-muted">Semua alat disterilisasi sebelum dan sesudah penggunaan untuk kenyamanan dan kesehatan Anda.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Services Section */}
                <section id="services" className="py-24">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-16">
                            <span className="text-xs font-semibold tracking-widest text-accent-lime uppercase block mb-4">Layanan Kami</span>
                            <h2 className="font-display font-bold text-3xl md:text-5xl mb-6">Menu Grooming Premium</h2>
                            <p className="max-w-2xl mx-auto text-on-dark-muted">
                                Pilih layanan berkualitas dari barber ahli kami. Setiap perawatan dirancang dengan standar kualitas tinggi.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            {services.length > 0 ? (
                                services.map((service) => (
                                    <div 
                                        key={service.id} 
                                        className="rounded-card bg-primary-dark/40 border border-hairline-violet p-6 hover:border-accent-violet hover:-translate-y-1 transition duration-300 flex flex-col justify-between overflow-hidden"
                                    >
                                        <div>
                                            {service.photo_path ? (
                                                <div className="aspect-[16/10] w-full rounded-lg overflow-hidden bg-primary-deeper border border-hairline-violet mb-4">
                                                    <img 
                                                        src={`/storage/${service.photo_path}`} 
                                                        alt={service.name} 
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="aspect-[16/10] w-full rounded-lg overflow-hidden bg-primary-deeper border border-hairline-violet mb-4 flex items-center justify-center">
                                                    <span className="text-3xl">✂️</span>
                                                </div>
                                            )}
                                            <div className="flex items-center justify-between mb-4">
                                                <span className="px-2.5 py-1 rounded bg-primary-deeper border border-hairline-violet text-[10px] uppercase font-bold text-accent-lime tracking-wider">
                                                    {service.category}
                                                </span>
                                                <span className="text-xs text-on-dark-muted flex items-center">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <circle cx="12" cy="12" r="10" />
                                                        <polyline points="12 6 12 12 16 14" />
                                                    </svg>
                                                    {service.duration_minutes} Menit
                                                </span>
                                            </div>
                                            <h3 className="font-display font-semibold text-lg text-white mb-2">{service.name}</h3>
                                            <p className="text-sm text-on-dark-muted mb-6 line-clamp-3 leading-relaxed">{service.description}</p>
                                        </div>
                                        <div className="border-t border-hairline-violet/50 pt-4 flex items-center justify-between">
                                            <span className="text-xs text-on-dark-muted">Mulai dari</span>
                                            <span className="font-display font-bold text-lg text-accent-lime">
                                                Rp {new Intl.NumberFormat('id-ID').format(service.default_price)}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-full text-center py-8 text-on-dark-muted">
                                    Belum ada layanan tersedia saat ini.
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* Barbers Section */}
                <section id="barbers" className="py-24 border-t border-hairline-violet bg-primary-dark/30">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-16">
                            <span className="text-xs font-semibold tracking-widest text-accent-lime uppercase block mb-4">Tim Barber Kami</span>
                            <h2 className="font-display font-bold text-3xl md:text-5xl mb-6">Barber Professional Kami</h2>
                            <p className="max-w-2xl mx-auto text-on-dark-muted">
                                Temui para ahli pangkas rambut presisi yang siap melayani Anda di outlet-outlet kami.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-8">
                            {barbers.length > 0 ? (
                                barbers.map((barber) => (
                                    <div 
                                        key={barber.id} 
                                        className="flex flex-col items-center text-center p-6 rounded-card bg-primary-dark/40 border border-hairline-violet hover:border-accent-violet hover:-translate-y-1 transition duration-300"
                                    >
                                        <div className="w-28 h-28 rounded-full overflow-hidden bg-primary-deeper border-2 border-hairline-violet mb-4 shrink-0 flex items-center justify-center">
                                            {barber.photo_path ? (
                                                <img 
                                                    src={`/storage/${barber.photo_path}`} 
                                                    alt={barber.name} 
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <span className="text-3xl font-bold text-accent-lime">{barber.name.substring(0, 1)}</span>
                                            )}
                                        </div>
                                        <h3 className="font-display font-semibold text-lg text-white mb-1">{barber.name}</h3>
                                        <p className="text-xs text-accent-lime mb-3 font-semibold">
                                            {barber.commission_percentage >= 45 ? 'Senior Barber' : 'Junior Barber'}
                                        </p>
                                        <span className="inline-block px-3 py-1 rounded-full bg-primary-deeper border border-hairline-violet text-[10px] text-on-dark-muted uppercase font-bold tracking-wider">
                                            📍 {barber.branch_name}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-full text-center py-8 text-on-dark-muted">
                                    Belum ada barber terdaftar saat ini.
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* Branches Section */}
                <section id="branches" className="py-24 border-t border-hairline-violet bg-primary-dark/20">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-16">
                            <span className="text-xs font-semibold tracking-widest text-accent-lime uppercase block mb-4">Lokasi Kami</span>
                            <h2 className="font-display font-bold text-3xl md:text-5xl mb-6">Pilih Cabang Howell</h2>
                            <p className="max-w-2xl mx-auto text-on-dark-muted">
                                Kunjungi outlet terdekat kami untuk mendapatkan perawatan grooming kelas satu.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                            {branches.length > 0 ? (
                                branches.map((branch) => (
                                    <div 
                                        key={branch.id} 
                                        className="rounded-card bg-primary-dark/60 border border-hairline-violet p-8 hover:border-accent-lime/30 transition duration-300 relative overflow-hidden group"
                                    >
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-accent-lime/5 rounded-full blur-2xl group-hover:bg-accent-lime/10 transition duration-300" />
                                        <h3 className="font-display font-bold text-xl text-white mb-4 group-hover:text-accent-lime transition duration-200">{branch.name}</h3>
                                        
                                        <div className="space-y-3 text-sm text-on-dark-muted mb-8">
                                            <div className="flex items-start">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-accent-lime mr-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                                                    <circle cx="12" cy="10" r="3" />
                                                </svg>
                                                <span>{branch.address}</span>
                                            </div>
                                            <div className="flex items-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-accent-lime mr-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                                                </svg>
                                                <span>{branch.phone}</span>
                                            </div>
                                        </div>

                                        <Link
                                            href={route('booking.index', { branch_id: branch.id })}
                                            className="inline-flex items-center font-display font-bold text-xs uppercase tracking-wider text-accent-lime group-hover:translate-x-1.5 transition-transform duration-200"
                                        >
                                            BOOK CABANG INI <span className="ml-2">→</span>
                                        </Link>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-2 text-center py-8 text-on-dark-muted">
                                    Belum ada cabang terdaftar.
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* CTA Booking Banner */}
                <section className="py-24 relative overflow-hidden bg-gradient-to-r from-primary-dark to-primary-deeper">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
                    
                    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                        <h2 className="font-display font-bold text-3xl md:text-5xl leading-tight mb-6">
                            Siap Tampil Beda Hari Ini?
                        </h2>
                        <p className="max-w-2xl mx-auto text-on-dark-muted mb-10 text-base md:text-lg">
                            Amankan slot Anda dengan barber terfavorit untuk pangkas rambut berkualitas tinggi tanpa perlu antre lama di outlet.
                        </p>
                        <Link
                            href={route('booking.index')}
                            className="inline-block px-10 py-5 rounded-md bg-accent-lime text-ink-deep font-display font-bold text-base hover:bg-accent-lime-muted shadow-xl shadow-accent-lime/20 transition duration-200"
                        >
                            BUAT JANJI SEKARANG
                        </Link>
                    </div>
                </section>

                {/* Footer */}
                <footer className="border-t border-hairline-violet bg-primary-deeper py-12 text-sm text-on-dark-muted">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded bg-accent-lime flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-ink-deep" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="3" />
                                    <path d="M9.5 12h5" />
                                </svg>
                            </div>
                            <span className="font-display font-bold text-base text-white tracking-tight">
                                HOWELL BARBERSHOP
                            </span>
                        </div>
                        <p className="text-center md:text-left text-xs">
                            &copy; {new Date().getFullYear()} Howell Barbershop. All Rights Reserved. Premium Grooming Systems.
                        </p>
                    </div>
                </footer>
            </div>
        </>
    );
}
