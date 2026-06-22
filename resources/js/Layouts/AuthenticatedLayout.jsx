import ApplicationLogo from '@/Components/ApplicationLogo';
import Sidebar from '@/Components/ui/Sidebar';
import Dropdown from '@/Components/Dropdown';
import NavLink from '@/Components/NavLink';
import ResponsiveNavLink from '@/Components/ResponsiveNavLink';
import { Link, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';

export default function AuthenticatedLayout({ header, children }) {
    const { auth } = usePage().props;
    const user = auth.user;
    const branches = auth.branches || [];

    const [notifications, setNotifications] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(`notifications_${user.id}`);
            return saved ? JSON.parse(saved) : [];
        }
        return [];
    });

    const [unreadCount, setUnreadCount] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(`notifications_${user.id}`);
            if (saved) {
                const parsed = JSON.parse(saved);
                return parsed.filter(n => !n.read).length;
            }
        }
        return 0;
    });

    const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem(`notifications_${user.id}`, JSON.stringify(notifications));
            setUnreadCount(notifications.filter(n => !n.read).length);
        }
    }, [notifications, user.id]);

    useEffect(() => {
        if (!window.Echo) return;

        const activeChannels = [];

        branches.forEach(branchId => {
            const channelName = `branch.${branchId}`;
            
            const channel = window.Echo.private(channelName)
                .listen('.BookingEvent', (e) => {
                    const newNotification = {
                        id: Date.now() + Math.random().toString(36).substr(2, 9),
                        type: e.type,
                        message: e.message,
                        booking: e.booking,
                        created_at: new Date().toISOString(),
                        read: false
                    };
                    
                    setNotifications(prev => [newNotification, ...prev].slice(0, 50));
                    
                    if (Notification.permission === 'granted') {
                        new Notification('Howell Barbershop', { body: e.message });
                    }

                    // Auto-refresh the current dashboard page to pull fresh database status changes
                    import('@inertiajs/react').then(({ router }) => {
                        router.reload({ preserveScroll: true });
                    });
                });
                
            activeChannels.push({ name: channelName, channel });
        });

        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }

        return () => {
            activeChannels.forEach(c => {
                window.Echo.leave(c.name);
            });
        };
    }, [JSON.stringify(branches)]);

    const markAsRead = (id) => {
        setNotifications(prev => 
            prev.map(n => n.id === id ? { ...n, read: true } : n)
        );
    };

    const markAllAsRead = () => {
        setNotifications(prev => 
            prev.map(n => ({ ...n, read: true }))
        );
    };
    
    // Collapsible sidebar state (persisted to localStorage)
    const [collapsed, setCollapsed] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('sidebar-collapsed');
            return saved === 'true';
        }
        return false;
    });

    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [mobileOpenMenus, setMobileOpenMenus] = useState({});

    useEffect(() => {
        localStorage.setItem('sidebar-collapsed', collapsed);
    }, [collapsed]);

    useEffect(() => {
        const initialOpen = {};
        const items = getMenuItems();
        items.forEach((item, idx) => {
            if (item.subItems && item.subItems.some(sub => sub.active)) {
                initialOpen[idx] = true;
            }
        });
        setMobileOpenMenus(initialOpen);
    }, [user.role]);

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
                    label: 'Inventory',
                    icon: (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                        </svg>
                    ),
                    subItems: [
                        {
                            label: 'Produk',
                            href: route('owner.products.index'),
                            active: route().current('owner.products.index')
                        },
                        {
                            label: 'Stok Masuk',
                            href: route('owner.products.restock.form'),
                            active: route().current('owner.products.restock.form')
                        },
                        {
                            label: 'Stok Opname',
                            href: route('owner.products.adjust.form'),
                            active: route().current('owner.products.adjust.form')
                        },
                        {
                            label: 'Riwayat Transaksi',
                            href: route('owner.transactions.index'),
                            active: route().current('owner.transactions.index')
                        }
                    ]
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
                    label: 'POS & Transaksi',
                    icon: (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                        </svg>
                    ),
                    subItems: [
                        {
                            label: 'POS Checkout',
                            href: route('cashier.pos.index'),
                            active: route().current('cashier.pos.index') || route().current('cashier.transactions.receipt')
                        },
                        {
                            label: 'Riwayat Transaksi',
                            href: route('cashier.transactions.index'),
                            active: route().current('cashier.transactions.index')
                        }
                    ]
                },
                {
                    label: 'Inventory',
                    icon: (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                        </svg>
                    ),
                    subItems: [
                        {
                            label: 'Produk & Stok',
                            href: route('cashier.products.index'),
                            active: route().current('cashier.products.index')
                        },
                        {
                            label: 'Stok Masuk',
                            href: route('cashier.products.restock.form'),
                            active: route().current('cashier.products.restock.form')
                        },
                        {
                            label: 'Stok Opname',
                            href: route('cashier.products.adjust.form'),
                            active: route().current('cashier.products.adjust.form')
                        }
                    ]
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
                    label: 'Jadwal Saya',
                    href: route('barber.schedules.index'),
                    active: route().current('barber.schedules.index'),
                    icon: (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
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

            {/* Mobile Drawer Backdrop */}
            {mobileMenuOpen && (
                <div 
                    onClick={() => setMobileMenuOpen(false)} 
                    className="fixed inset-0 z-50 bg-[#150B35]/60 backdrop-blur-sm lg:hidden transition-opacity duration-300"
                />
            )}

            {/* Mobile Slide-out Drawer */}
            <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#1F134D] text-white flex flex-col justify-between border-r border-[#2d1b69] transition-transform duration-300 ease-in-out lg:hidden select-none ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
                    {/* Brand / Logo & Close Button */}
                    <div className="flex items-center justify-between px-6 mb-6">
                        <span className="font-display font-bold text-xl tracking-tight text-white">
                             HOWELL<span className="text-accent-lime">.</span>
                        </span>
                        <button
                            onClick={() => setMobileMenuOpen(false)}
                            className="p-1.5 rounded-lg bg-[#2D1B69] hover:bg-[#3D2880] text-[#C5B8E0] hover:text-white transition duration-200 cursor-pointer"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Mobile Navigation Items */}
                    <nav className="mt-5 flex-1 px-4 space-y-1 bg-[#1F134D]">
                        {menuItems.map((item, idx) => {
                            if (item.subItems) {
                                const isParentActive = item.subItems.some(sub => sub.active);
                                const isOpen = !!mobileOpenMenus[idx];

                                return (
                                    <div key={idx} className="space-y-1">
                                        <button
                                            onClick={() => setMobileOpenMenus(prev => ({ ...prev, [idx]: !prev[idx] }))}
                                            className={`w-full group flex items-center justify-between px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 relative cursor-pointer ${
                                                isParentActive
                                                    ? 'bg-[#2D1B69] text-accent-lime shadow-lg shadow-[#150b35]/20'
                                                    : 'text-[#C5B8E0] hover:bg-[#2D1B69]/50 hover:text-white'
                                            }`}
                                        >
                                            <div className="flex items-center">
                                                <div className="flex items-center justify-center shrink-0 mr-3">
                                                    {item.icon}
                                                </div>
                                                <span className="text-left font-medium">
                                                    {item.label}
                                                </span>
                                            </div>

                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth={2.5}
                                                stroke="currentColor"
                                                className={`w-3.5 h-3.5 transition-transform duration-200 text-[#C5B8E0] group-hover:text-white ${isOpen ? 'rotate-180' : ''}`}
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                                            </svg>
                                        </button>

                                        {isOpen && (
                                            <div className="pl-8 space-y-1 transition-all duration-300">
                                                {item.subItems.map((sub, sIdx) => (
                                                    <Link
                                                        key={sIdx}
                                                        href={sub.href}
                                                        onClick={() => setMobileMenuOpen(false)}
                                                        className={`block px-3 py-2 text-xs font-medium rounded-md transition duration-150 ${
                                                            sub.active
                                                                ? 'text-accent-lime bg-[#2D1B69]/30 font-semibold'
                                                                : 'text-[#C5B8E0] hover:text-white hover:bg-[#2D1B69]/20'
                                                        }`}
                                                    >
                                                        {sub.label}
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            }

                            return (
                                <Link
                                    key={idx}
                                    href={item.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 relative ${
                                        item.active
                                            ? 'bg-[#2D1B69] text-accent-lime shadow-lg shadow-[#150b35]/20'
                                            : 'text-[#C5B8E0] hover:bg-[#2D1B69]/50 hover:text-white'
                                    }`}
                                >
                                    <div className="flex items-center justify-center shrink-0 mr-3">
                                        {item.icon}
                                    </div>
                                    <span className="font-medium">{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>
                
                {/* Mobile Drawer User Footer */}
                <div className="p-4 border-t border-[#2d1b69] bg-[#1a0f3d]">
                    <div className="flex items-center space-x-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-[#7C5CBF] flex items-center justify-center font-bold text-sm text-white shadow">
                            {user.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                        </div>
                        <div className="text-left">
                            <h4 className="font-semibold text-sm leading-none text-white">{user.name}</h4>
                            <span className="text-[10px] text-[#C5B8E0] font-bold uppercase tracking-wider block mt-0.5">{user.role}</span>
                        </div>
                    </div>
                    <Link
                        href={route('logout')}
                        method="post"
                        as="button"
                        className="w-full flex items-center justify-center space-x-2 py-2 px-4 rounded-lg bg-[#2D1B69] hover:bg-[#3D2880] text-white font-medium text-xs transition duration-200 cursor-pointer"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
                        </svg>
                        <span>Keluar</span>
                    </Link>
                </div>
            </div>

            {/* Main Area */}
            <div className="flex-1 flex flex-col min-w-0 bg-surface-canvas-light text-ink overflow-hidden h-screen">
                {/* Global Topbar Header */}
                <header className="bg-white border-b border-hairline-cloud shrink-0 sticky top-0 z-40 h-16 flex items-center justify-between px-6 sm:px-8">
                    {/* Left: Mobile hamburger menu toggle & Breadcrumbs */}
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => setMobileMenuOpen(true)}
                            className="lg:hidden mr-2.5 p-1.5 rounded-lg hover:bg-surface-press-light text-on-light-muted hover:text-primary transition duration-200 cursor-pointer focus:outline-none"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                            </svg>
                        </button>
                        <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-on-light-muted">
                                {user.role}
                            </span>
                            <span className="text-xs text-on-light-faint">/</span>
                            <span className="text-xs font-semibold text-ink-deep capitalize">
                                {route().current() ? route().current().split('.').slice(-1)[0] : 'dashboard'}
                            </span>
                        </div>
                    </div>

                    {/* Right: Notifications & Profile Dropdown */}
                    <div className="flex items-center space-x-6">
                        {/* Notifications Bell */}
                        <div className="relative">
                            <button 
                                onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                                className="relative p-1.5 rounded-full hover:bg-surface-press-light text-on-light-muted hover:text-primary transition duration-200 cursor-pointer focus:outline-none"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5.5 h-5.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                                </svg>
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full bg-status-danger text-[9px] font-bold text-white flex items-center justify-center animate-pulse">
                                        {unreadCount}
                                    </span>
                                )}
                            </button>

                            {notifDropdownOpen && (
                                <>
                                    <div 
                                        className="fixed inset-0 z-40" 
                                        onClick={() => setNotifDropdownOpen(false)}
                                    />
                                    <div className="absolute right-0 mt-2.5 w-80 bg-white border border-hairline-cloud rounded-xl shadow-xl z-50 overflow-hidden py-1">
                                        <div className="px-4 py-2.5 border-b border-hairline-cloud flex justify-between items-center bg-surface-card">
                                            <h4 className="font-semibold text-xs text-ink-deep">Notifikasi ({unreadCount})</h4>
                                            {notifications.length > 0 && (
                                                <button 
                                                    onClick={markAllAsRead}
                                                    className="text-[10px] font-bold text-[#7C5CBF] hover:text-[#4A2D8A] cursor-pointer"
                                                >
                                                    Tandai semua dibaca
                                                </button>
                                            )}
                                        </div>
                                        <div className="max-h-72 overflow-y-auto">
                                            {notifications.length === 0 ? (
                                                <div className="px-4 py-8 text-center text-xs text-on-light-faint">
                                                    Tidak ada notifikasi baru
                                                </div>
                                            ) : (
                                                notifications.map((notif) => (
                                                    <div 
                                                        key={notif.id}
                                                        onClick={() => {
                                                            markAsRead(notif.id);
                                                            setNotifDropdownOpen(false);
                                                        }}
                                                        className={`px-4 py-3 border-b border-hairline-cloud last:border-none cursor-pointer transition duration-150 hover:bg-surface-press-light ${!notif.read ? 'bg-[#2d1b69]/5 font-medium' : ''}`}
                                                    >
                                                        <p className="text-xs text-ink-deep leading-relaxed">{notif.message}</p>
                                                        <span className="text-[9px] text-on-light-faint mt-1 block">
                                                            {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

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

