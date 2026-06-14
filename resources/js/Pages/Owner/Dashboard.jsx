import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

export default function Dashboard({ 
    branchesCount, 
    barbersCount, 
    servicesCount, 
    metrics, 
    recentBookings = [], 
    barbersPerformance = [], 
    chartData = [] 
}) {
    // 1. SVG Chart Calculation
    const maxVal = Math.max(...chartData.map(d => d.revenue), 100000); // fallback to min maxVal
    const svgWidth = 800;
    const svgHeight = 200;
    const padding = 20;

    // Calculate points for the SVG line/area
    const points = chartData.map((d, index) => {
        const x = padding + (index / (chartData.length - 1)) * (svgWidth - padding * 2);
        // Invert Y axis for SVG (0 is top)
        const y = svgHeight - padding - (d.revenue / maxVal) * (svgHeight - padding * 2);
        return { x, y, date: d.date, value: d.revenue };
    });

    const pathData = points.reduce((acc, p, index) => {
        return index === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
    }, '');

    const areaPathData = points.length > 0 
        ? `${pathData} L ${points[points.length - 1].x} ${svgHeight - padding} L ${points[0].x} ${svgHeight - padding} Z`
        : '';

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-bold font-sans text-ink leading-tight">
                    Dashboard Manajemen Owner — Howell Barbershop
                </h2>
            }
        >
            <Head title="Owner Dashboard" />

            <div className="py-6 px-4 sm:px-6 lg:px-8 bg-surface-canvas-light text-ink min-h-screen space-y-8">
                <div className="max-w-7xl mx-auto space-y-6">

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="bg-white p-5 border border-hairline-cloud rounded-card shadow-card">
                            <span className="text-[10px] font-bold text-on-light-muted uppercase tracking-wider block mb-1">Total Omset Bisnis</span>
                            <span className="text-2xl font-bold font-display text-accent-violet-deep">
                                Rp {new Intl.NumberFormat('id-ID').format(metrics.revenue)}
                            </span>
                        </div>
                        <div className="bg-white p-5 border border-hairline-cloud rounded-card shadow-card">
                            <span className="text-[10px] font-bold text-on-light-muted uppercase tracking-wider block mb-1">Grooming Selesai</span>
                            <span className="text-2xl font-bold font-display text-ink-deep">
                                {metrics.bookings_completed} Transaksi
                            </span>
                        </div>
                        <div className="bg-white p-5 border border-hairline-cloud rounded-card shadow-card">
                            <span className="text-[10px] font-bold text-on-light-muted uppercase tracking-wider block mb-1">Produk Retail Terjual</span>
                            <span className="text-2xl font-bold font-display text-ink-deep">
                                {metrics.products_sold} Pcs
                            </span>
                        </div>
                        <div className="bg-white p-5 border border-hairline-cloud rounded-card shadow-card border-l-4 border-l-status-success">
                            <span className="text-[10px] font-bold text-on-light-muted uppercase tracking-wider block mb-1">Komisi Barber Terbayar</span>
                            <span className="text-2xl font-bold font-display text-status-success">
                                Rp {new Intl.NumberFormat('id-ID').format(metrics.commissions)}
                            </span>
                        </div>
                    </div>

                    {/* 30-Day Revenue Chart (Bespoke Pure SVG Chart) */}
                    <div className="bg-white border border-hairline-cloud rounded-card shadow-card p-6">
                        <div className="mb-4">
                            <h3 className="font-display font-bold text-lg text-ink-deep">Tren Omset 30 Hari Terakhir</h3>
                            <p className="text-xs text-on-light-muted">Akumulasi omset harian (layanan + penjualan produk retail).</p>
                        </div>

                        <div className="w-full overflow-x-auto">
                            <div className="min-w-[700px] h-[220px] relative">
                                <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full">
                                    <defs>
                                        <linearGradient id="chart-area-grad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#7C5CBF" stopOpacity="0.25" />
                                            <stop offset="100%" stopColor="#7C5CBF" stopOpacity="0.00" />
                                        </linearGradient>
                                    </defs>

                                    {/* Grid Lines */}
                                    <line x1={padding} y1={padding} x2={svgWidth - padding} y2={padding} stroke="#E5E7EB" strokeWidth="0.5" strokeDasharray="3" />
                                    <line x1={padding} y1={svgHeight / 2} x2={svgWidth - padding} y2={svgHeight / 2} stroke="#E5E7EB" strokeWidth="0.5" strokeDasharray="3" />
                                    <line x1={padding} y1={svgHeight - padding} x2={svgWidth - padding} y2={svgHeight - padding} stroke="#E5E7EB" strokeWidth="1" />

                                    {/* Area path */}
                                    {areaPathData && (
                                        <path d={areaPathData} fill="url(#chart-area-grad)" />
                                    )}

                                    {/* Line path */}
                                    {pathData && (
                                        <path d={pathData} fill="none" stroke="#7C5CBF" strokeWidth="2.5" strokeLinecap="round" />
                                    )}

                                    {/* Points and Tooltips */}
                                    {points.map((p, index) => (
                                        <g key={index}>
                                            <circle cx={p.x} cy={p.y} r="3.5" fill="#ffffff" stroke="#7C5CBF" strokeWidth="2" className="hover:r-5 transition-all duration-150 cursor-pointer" />
                                            
                                            {/* Date labels on x axis for first, middle, last */}
                                            {(index === 0 || index === 14 || index === 29) && (
                                                <text x={p.x} y={svgHeight - 4} textAnchor="middle" fill="#6B5A8E" fontSize="9" fontWeight="bold">
                                                    {p.date}
                                                </text>
                                            )}
                                        </g>
                                    ))}
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        
                        {/* Barber Performance Leaderboard */}
                        <div className="lg:col-span-2 bg-white border border-hairline-cloud rounded-card shadow-card overflow-hidden">
                            <div className="p-5 border-b border-hairline-cloud">
                                <h3 className="font-display font-bold text-lg text-ink-deep">Performa Kerja Barber</h3>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse text-sm">
                                    <thead>
                                        <tr className="bg-surface-card border-b border-hairline-cloud text-[11px] font-bold text-on-light-muted uppercase tracking-wider">
                                            <th className="py-4 px-6">Barber</th>
                                            <th className="py-4 px-6">Cabang</th>
                                            <th className="py-4 px-6 text-center">Kerja Selesai</th>
                                            <th className="py-4 px-6 text-right">Revenue Jasa</th>
                                            <th className="py-4 px-6 text-right">Komisi Diterima</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-hairline-cloud">
                                        {barbersPerformance.length > 0 ? (
                                            barbersPerformance.map((bp) => (
                                                <tr key={bp.id} className="hover:bg-surface-card/40 transition">
                                                    <td className="py-4 px-6 font-bold text-ink-deep">{bp.name}</td>
                                                    <td className="py-4 px-6 text-on-light-muted text-xs">{bp.branch_name}</td>
                                                    <td className="py-4 px-6 text-center font-semibold">{bp.bookings_count} Booking</td>
                                                    <td className="py-4 px-6 text-right font-semibold">
                                                        Rp {new Intl.NumberFormat('id-ID').format(bp.revenue)}
                                                    </td>
                                                    <td className="py-4 px-6 text-right font-bold text-status-success">
                                                        Rp {new Intl.NumberFormat('id-ID').format(bp.commissions)}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="5" className="py-8 text-center text-on-light-muted italic">
                                                    Belum ada data performa barber masuk.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Recent Bookings List (Latest 5) */}
                        <div className="bg-white border border-hairline-cloud rounded-card shadow-card overflow-hidden">
                            <div className="p-5 border-b border-hairline-cloud bg-surface-card">
                                <h3 className="font-display font-bold text-base text-ink-deep">Booking Terbaru</h3>
                            </div>

                            <div className="divide-y divide-hairline-cloud">
                                {recentBookings.length > 0 ? (
                                    recentBookings.map((b) => (
                                        <div key={b.id} className="p-4 space-y-2 text-xs hover:bg-surface-card/25 transition">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <span className="font-bold text-ink-deep block">{b.customer_name}</span>
                                                    <span className="text-[10px] text-on-light-muted">{b.slot_start}</span>
                                                </div>
                                                <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                                                    b.status === 'confirmed' ? 'bg-blue-50 text-booking-confirmed border border-blue-150' :
                                                    b.status === 'in_progress' ? 'bg-amber-50 text-booking-in-progress border border-amber-150' :
                                                    b.status === 'completed' ? 'bg-green-50 text-booking-completed border border-green-150' :
                                                    'bg-red-50 text-booking-cancelled border border-red-150'
                                                }`}>
                                                    {b.status}
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-on-light-muted">
                                                <span>{b.service_name}</span>
                                                <span>Barber: {b.barber_name}</span>
                                            </div>
                                            <span className="text-[9px] text-accent-violet-deep font-semibold block uppercase">
                                                Outlet: {b.branch_name}
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-xs text-on-light-muted italic text-center py-8">
                                        Belum ada aktivitas booking.
                                    </p>
                                )}
                            </div>
                        </div>

                    </div>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
