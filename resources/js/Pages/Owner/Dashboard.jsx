import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

export default function Dashboard({ 
    branches = [],
    branchesCount, 
    barbersCount, 
    servicesCount, 
    metrics, 
    recentBookings = [], 
    barbersPerformance = [], 
    chartData = [],
    topServices = [],
    filters = {}
}) {
    const [branchId, setBranchId] = useState(filters.branch_id || '');
    const [hoveredIndex, setHoveredIndex] = useState(null);

    const handleBranchChange = (e) => {
        const selectedId = e.target.value;
        setBranchId(selectedId);
        router.get(route('owner.dashboard'), { branch_id: selectedId }, { 
            preserveState: true,
            preserveScroll: true
        });
    };

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
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <h2 className="text-xl font-bold font-sans text-ink leading-tight">
                        Dashboard Manajemen Owner — Howell Barbershop
                    </h2>
                    {/* Branch Filter dropdown */}
                    <div className="flex items-center gap-2 text-xs shrink-0">
                        <label className="font-bold text-on-light-muted uppercase tracking-wider">Cabang:</label>
                        <select
                            value={branchId}
                            onChange={handleBranchChange}
                            className="input-field py-1.5 px-3 text-xs bg-white border border-hairline-cloud rounded-md focus:outline-none focus:ring-1 focus:ring-accent-violet w-48 font-medium"
                        >
                            <option value="">Semua Cabang</option>
                            {branches.map(b => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            }
        >
            <Head title="Owner Dashboard" />

            <div className="py-6 px-4 sm:px-6 lg:px-8 bg-surface-canvas-light text-ink min-h-screen space-y-8">
                <div className="max-w-7xl mx-auto space-y-6">

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="bg-white p-5 border border-hairline-cloud rounded-card shadow-card flex flex-col justify-between">
                            <div>
                                <span className="text-[10px] font-bold text-on-light-muted uppercase tracking-wider block mb-1">Total Omset Bisnis</span>
                                <span className="text-2xl font-bold font-display text-accent-violet-deep">
                                    Rp {new Intl.NumberFormat('id-ID').format(metrics.revenue)}
                                </span>
                            </div>
                            <div className="mt-3 pt-2 border-t border-hairline-cloud/50 flex justify-between text-[10px] text-on-light-muted font-medium">
                                <span>Jasa: <span className="text-ink font-semibold">Rp {new Intl.NumberFormat('id-ID').format(metrics.service_revenue || 0)}</span></span>
                                <span>Retail: <span className="text-ink font-semibold">Rp {new Intl.NumberFormat('id-ID').format(metrics.product_revenue || 0)}</span></span>
                            </div>
                        </div>
                        <div className="bg-white p-5 border border-hairline-cloud rounded-card shadow-card flex flex-col justify-between">
                            <div>
                                <span className="text-[10px] font-bold text-on-light-muted uppercase tracking-wider block mb-1">Grooming Selesai</span>
                                <span className="text-2xl font-bold font-display text-ink-deep">
                                    {metrics.bookings_completed} Transaksi
                                </span>
                            </div>
                            <div className="mt-3 pt-2 border-t border-hairline-cloud/50 text-[10px] text-on-light-muted font-medium">
                                <span>Melalui booking online & walk-in</span>
                            </div>
                        </div>
                        <div className="bg-white p-5 border border-hairline-cloud rounded-card shadow-card flex flex-col justify-between">
                            <div>
                                <span className="text-[10px] font-bold text-on-light-muted uppercase tracking-wider block mb-1">Produk Retail Terjual</span>
                                <span className="text-2xl font-bold font-display text-ink-deep">
                                    {metrics.products_sold} Pcs
                                </span>
                            </div>
                            <div className="mt-3 pt-2 border-t border-hairline-cloud/50 text-[10px] text-on-light-muted font-medium">
                                <span>Penjualan produk pomade, hair styling, dll.</span>
                            </div>
                        </div>
                        <div className="bg-white p-5 border border-hairline-cloud rounded-card shadow-card border-l-4 border-l-booking-completed flex flex-col justify-between">
                            <div>
                                <span className="text-[10px] font-bold text-on-light-muted uppercase tracking-wider block mb-1">Komisi Barber Terbayar</span>
                                <span className="text-2xl font-bold font-display text-booking-completed">
                                    Rp {new Intl.NumberFormat('id-ID').format(metrics.commissions)}
                                </span>
                            </div>
                            <div className="mt-3 pt-2 border-t border-hairline-cloud/50 flex justify-between text-[10px] text-on-light-muted font-medium">
                                <span>Lunas: <span className="text-booking-completed font-semibold">Rp {new Intl.NumberFormat('id-ID').format(metrics.commissions || 0)}</span></span>
                                <span>Pending: <span className="text-booking-cancelled font-semibold">Rp {new Intl.NumberFormat('id-ID').format(metrics.commissions_unpaid || 0)}</span></span>
                            </div>
                        </div>
                    </div>

                    {/* 30-Day Revenue Chart (Bespoke Pure SVG Chart with Tooltip) */}
                    <div className="bg-white border border-hairline-cloud rounded-card shadow-card p-6">
                        <div className="mb-4">
                            <h3 className="font-display font-bold text-lg text-ink-deep">Tren Omset 30 Hari Terakhir</h3>
                            <p className="text-xs text-on-light-muted">Akumulasi omset harian (layanan + penjualan produk retail).</p>
                        </div>

                        <div className="w-full overflow-x-auto">
                            <div className="min-w-[700px] h-[220px] relative">
                                {/* HTML Floating Tooltip */}
                                {hoveredIndex !== null && points[hoveredIndex] && (
                                    <div 
                                        className="absolute z-10 bg-ink-deep text-white text-[11px] p-2.5 rounded-lg shadow-lg border border-hairline-violet pointer-events-none transform -translate-x-1/2 -translate-y-full transition-all duration-150"
                                        style={{ 
                                            left: `${(points[hoveredIndex].x / svgWidth) * 100}%`, 
                                            top: `${(points[hoveredIndex].y / svgHeight) * 100 - 8}%` 
                                        }}
                                    >
                                        <div className="font-bold text-accent-lime">{points[hoveredIndex].date}</div>
                                        <div className="font-mono text-white mt-0.5 font-bold">
                                            Rp {new Intl.NumberFormat('id-ID').format(points[hoveredIndex].value)}
                                        </div>
                                    </div>
                                )}

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
                                            <circle cx={p.x} cy={p.y} r="3.5" fill="#ffffff" stroke="#7C5CBF" strokeWidth="2" />
                                            
                                            {/* Hover zone for triggering tooltip */}
                                            <circle 
                                                cx={p.x} 
                                                cy={p.y} 
                                                r="12" 
                                                fill="transparent" 
                                                className="cursor-pointer"
                                                onMouseEnter={() => setHoveredIndex(index)}
                                                onMouseLeave={() => setHoveredIndex(null)}
                                            />

                                            {/* Accent circle on hover */}
                                            {hoveredIndex === index && (
                                                <circle 
                                                    cx={p.x} 
                                                    cy={p.y} 
                                                    r="5.5" 
                                                    fill="#C2EF4E" 
                                                    stroke="#7C5CBF" 
                                                    strokeWidth="2.5" 
                                                    className="pointer-events-none"
                                                />
                                            )}
                                            
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

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        
                        {/* Barber Performance Leaderboard */}
                        <div className="lg:col-span-5 bg-white border border-hairline-cloud rounded-card shadow-card overflow-hidden">
                            <div className="p-5 border-b border-hairline-cloud">
                                <h3 className="font-display font-bold text-base text-ink-deep">Performa Kerja Barber</h3>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse text-xs">
                                    <thead>
                                        <tr className="bg-surface-card border-b border-hairline-cloud text-[10px] font-bold text-on-light-muted uppercase tracking-wider">
                                            <th className="py-3 px-4">Barber</th>
                                            <th className="py-3 px-4 text-center">Selesai</th>
                                            <th className="py-3 px-4 text-right">Revenue</th>
                                            <th className="py-3 px-4 text-right">Komisi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-hairline-cloud">
                                        {barbersPerformance.length > 0 ? (
                                            barbersPerformance.map((bp) => (
                                                <tr key={bp.id} className="hover:bg-surface-card/40 transition">
                                                    <td className="py-3 px-4">
                                                        <span className="font-bold text-ink-deep block">{bp.name}</span>
                                                        <span className="text-[10px] text-on-light-muted">{bp.branch_name}</span>
                                                    </td>
                                                    <td className="py-3 px-4 text-center font-semibold">{bp.bookings_count} Booking</td>
                                                    <td className="py-3 px-4 text-right font-semibold text-ink-deep">
                                                        Rp {new Intl.NumberFormat('id-ID').format(bp.revenue)}
                                                    </td>
                                                    <td className="py-3 px-4 text-right font-bold text-booking-completed">
                                                        Rp {new Intl.NumberFormat('id-ID').format(bp.commissions)}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="4" className="py-8 text-center text-on-light-muted italic">
                                                    Belum ada data performa barber masuk.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Top Services Booked Card */}
                        <div className="lg:col-span-3 bg-white border border-hairline-cloud rounded-card shadow-card overflow-hidden">
                            <div className="p-5 border-b border-hairline-cloud bg-surface-card">
                                <h3 className="font-display font-bold text-base text-ink-deep">Layanan Terlaris</h3>
                            </div>
                            <div className="p-4 space-y-3">
                                {topServices.length > 0 ? (
                                    topServices.map((s, idx) => (
                                        <div key={idx} className="flex items-center gap-3 p-3 border border-hairline-cloud rounded bg-surface-card/20 hover:bg-surface-card/45 transition">
                                            <div className="w-5 h-5 rounded-full bg-accent-violet/10 text-accent-violet-deep flex items-center justify-center font-bold text-[10px] shrink-0">
                                                {idx + 1}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <span className="font-bold text-xs text-ink-deep block truncate">{s.name}</span>
                                                <span className="text-[9px] text-on-light-muted block">{s.category}</span>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <span className="text-xs font-bold text-accent-violet-deep block">{s.total_qty}x</span>
                                                <span className="text-[8px] text-on-light-muted block">Dipesan</span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-xs text-on-light-muted italic text-center py-8">
                                        Belum ada data layanan dipesan.
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Recent Bookings List (Latest 5) */}
                        <div className="lg:col-span-4 bg-white border border-hairline-cloud rounded-card shadow-card overflow-hidden">
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
