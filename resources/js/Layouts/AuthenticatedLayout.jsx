import ApplicationLogo from '@/Components/ApplicationLogo';
import Sidebar from '@/Components/ui/Sidebar';
import Dropdown from '@/Components/Dropdown';
import NavLink from '@/Components/NavLink';
import ResponsiveNavLink from '@/Components/ResponsiveNavLink';
import { Link, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';

export default function AuthenticatedLayout({ header, children }) {
    const user = usePage().props.auth.user;
    
    // Collapsible sidebar state (persisted to localStorage)
    const [collapsed, setCollapsed] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('sidebar-collapsed');
            return saved === 'true';
        }
        return false;
    });

    useEffect(() => {
        localStorage.setItem('sidebar-collapsed', collapsed);
    }, [collapsed]);

    // Sidebar menu items based on role
    const getMenuItems = () => {
        if (user.role === 'owner') {
            return [
                {
                    label: 'Dashboard',
                    href: route('owner.dashboard'),
                    active: route().current('owner.dashboard'),
                    icon: (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z" />
                        </svg>
                    )
                },
                {
                    label: 'Staff',
                    href: route('owner.staff.index'),
                    active: route().current('owner.staff.index'),
                    icon: (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                        </svg>
                    )
                },
                {
                    label: 'Layanan',
                    href: route('owner.services.index'),
                    active: route().current('owner.services.index'),
                    icon: (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m7.875 14.25 1.214 1.942a2.25 2.25 0 0 0 3.82 0l1.214-1.942M7.875 14.25a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Zm0 0 3-3m0 0h3m-3 0V5.25m6.125 9a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Zm0 0-3-3" />
                        </svg>
                    )
                },
                {
                    label: 'Produk',
                    href: route('owner.products.index'),
                    active: route().current('owner.products.index'),
                    icon: (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                        </svg>
                    )
                },
                {
                    label: 'Jadwal',
                    href: route('owner.schedules.index'),
                    active: route().current('owner.schedules.index'),
                    icon: (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                        </svg>
                    )
                },
                {
                    label: 'Komisi',
                    href: route('owner.commissions.index'),
                    active: route().current('owner.commissions.index'),
                    icon: (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                        </svg>
                    )
                }
            ];
        } else if (user.role === 'cashier') {
            return [
                {
                    label: 'Antrean Booking',
                    href: route('cashier.dashboard'),
                    active: route().current('cashier.dashboard'),
                    icon: (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                        </svg>
                    )
                },
                {
                    label: 'POS Transaksi',
                    href: route('cashier.pos.index'),
                    active: route().current('cashier.pos.index') || route().current('cashier.transactions.*'),
                    icon: (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                        </svg>
                    )
                }
            ];
        } else if (user.role === 'barber') {
            return [
                {
                    label: 'Dashboard Barber',
                    href: route('barber.dashboard'),
                    active: route().current('barber.dashboard'),
                    icon: (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.375M9 18h3.375m-6.375-3h.008v.008H6V15Zm0 3h.008v.008H6V18Zm0-6h.008v.008H6V12m-.008-6h.008v.008H6V6Zm6 0h.008v.008h-.008V6Zm0 3h.008v.008h-.008V9Zm6 3h.008v.008h-.008V12Zm0 3h.008v.008h-.008V15Zm0 3h.008v.008h-.008V18Zm0-12h.008v.008h-.008V6Zm-9 3h.008v.008H6V9Zm6 0h.008v.008h-.008V9Z" />
                        </svg>
                    )
                },
                {
                    label: 'Komisi Saya',
                    href: route('barber.commissions.index'),
                    active: route().current('barber.commissions.index'),
                    icon: (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                        </svg>
                    )
                }
            ];
        }
        return [];
    };

    if (user.role === 'customer') {
        // Render simple top navigation for customers
        return (
            <div className="min-h-screen bg-surface-canvas-light text-ink">
                <nav className="sticky top-0 z-50 bg-[#1A0F3D] text-white border-b border-[#2d1b69]">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <Link href="/" className="font-display font-bold text-lg tracking-tight text-white">
                                HOWELL<span className="text-accent-lime">.</span>
                            </Link>
                        </div>
                        <div className="flex items-center space-x-4">
                            {/* Avatar Dropdown for Customer */}
                            <div className="relative">
                                <Dropdown>
                                    <Dropdown.Trigger>
                                        <button className="flex items-center space-x-2.5 hover:text-accent-lime text-white transition duration-200 cursor-pointer">
                                            <div className="w-8 h-8 rounded-full bg-[#7C5CBF] flex items-center justify-center font-bold text-xs text-white shadow border border-[#3D2880]">
                                                {user.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                                            </div>
                                            <span className="text-sm font-medium hidden sm:inline-block">{user.name}</span>
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5 opacity-70">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                                            </svg>
                                        </button>
                                    </Dropdown.Trigger>
                                    <Dropdown.Content align="right">
                                        <Dropdown.Link href={route('profile.edit')}>
                                            Profil Saya
                                        </Dropdown.Link>
                                        <Dropdown.Link href={route('logout')} method="post" as="button">
                                            Keluar
                                        </Dropdown.Link>
                                    </Dropdown.Content>
                                </Dropdown>
                            </div>
                        </div>
                    </div>
                </nav>
                {header && (
                    <header className="bg-white border-b border-hairline-cloud">
                        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
                            {header}
                        </div>
                    </header>
                )}
                <main>{children}</main>
            </div>
        );
    }

    const menuItems = getMenuItems();

    return (
        <div className="h-screen overflow-hidden flex bg-surface-canvas-light text-ink">
            {/* Sidebar Left */}
            <Sidebar
                user={user}
                items={menuItems}
                collapsed={collapsed}
                onToggleCollapse={() => setCollapsed(!collapsed)}
            />

            {/* Main Area */}
            <div className="flex-1 flex flex-col min-w-0 bg-surface-canvas-light text-ink overflow-hidden h-screen">
                {/* Global Topbar Header */}
                <header className="bg-white border-b border-hairline-cloud shrink-0 sticky top-0 z-40 h-16 flex items-center justify-between px-6 sm:px-8">
                    {/* Left: Breadcrumbs or section path */}
                    <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-on-light-muted">
                            {user.role}
                        </span>
                        <span className="text-xs text-on-light-faint">/</span>
                        <span className="text-xs font-semibold text-ink-deep capitalize">
                            {route().current() ? route().current().split('.').slice(-1)[0] : 'dashboard'}
                        </span>
                    </div>

                    {/* Right: Notifications & Profile Dropdown */}
                    <div className="flex items-center space-x-6">
                        {/* Notifications Bell */}
                        <button className="relative p-1.5 rounded-full hover:bg-surface-press-light text-on-light-muted hover:text-primary transition duration-200 cursor-pointer">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5.5 h-5.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                            </svg>
                            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-status-danger animate-pulse" />
                        </button>

                        <div className="h-6 w-px bg-hairline-cloud" />

                        {/* Profile Dropdown */}
                        <div className="relative">
                            <Dropdown>
                                <Dropdown.Trigger>
                                    <button className="flex items-center space-x-2.5 hover:text-primary transition duration-200 cursor-pointer text-ink">
                                        <div className="w-9 h-9 rounded-full bg-[#7C5CBF] flex items-center justify-center font-bold text-sm text-white shadow">
                                            {user.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                                        </div>
                                        <div className="text-left hidden md:block">
                                            <h4 className="font-semibold text-xs leading-none text-ink-deep">{user.name}</h4>
                                            <span className="text-[9px] text-on-light-muted font-bold uppercase tracking-wider block mt-0.5">{user.role}</span>
                                        </div>
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5 text-on-light-muted">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                                        </svg>
                                    </button>
                                </Dropdown.Trigger>
                                <Dropdown.Content align="right">
                                    <Dropdown.Link href={route('profile.edit')}>
                                        Ubah Profil
                                    </Dropdown.Link>
                                    <Dropdown.Link href={route('logout')} method="post" as="button">
                                        Keluar
                                    </Dropdown.Link>
                                </Dropdown.Content>
                            </Dropdown>
                        </div>
                    </div>
                </header>

                {/* Page-Specific Action Header */}
                {header && (
                    <header className="bg-white border-b border-hairline-cloud shrink-0">
                        <div className="max-w-7xl mx-auto px-6 py-5 sm:px-8">
                            {header}
                        </div>
                    </header>
                )}

                {/* Main Content Viewport */}
                <main className="flex-1 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}

