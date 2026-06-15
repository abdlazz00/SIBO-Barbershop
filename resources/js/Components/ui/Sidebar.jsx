import { Link } from '@inertiajs/react';
import React, { useState, useEffect } from 'react';

export default function Sidebar({ user, items, collapsed, onToggleCollapse }) {
    const [openMenus, setOpenMenus] = useState({});

    // Automatically expand parent menus that have active submenus
    useEffect(() => {
        const initialOpen = {};
        items.forEach((item, idx) => {
            if (item.subItems && item.subItems.some(sub => sub.active)) {
                initialOpen[idx] = true;
            }
        });
        setOpenMenus(initialOpen);
    }, [items]);

    const toggleMenu = (idx) => {
        setOpenMenus(prev => ({ ...prev, [idx]: !prev[idx] }));
    };

    return (
        <aside className={`hidden lg:flex min-h-screen bg-[#1F134D] text-white flex-col justify-between border-r border-[#2d1b69] transition-all duration-300 ease-in-out shrink-0 select-none ${collapsed ? 'w-20' : 'w-64'}`}>
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
                {/* Brand / Logo */}
                <div className="flex items-center justify-between px-4 mb-6">
                    <div className={`flex items-center space-x-2 transition-all duration-300 ${collapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'}`}>
                        <span className="font-display font-bold text-xl tracking-tight text-white">
                             HOWELL<span className="text-accent-lime">.</span>
                        </span>
                    </div>
                    {collapsed && (
                        <span className="font-display font-bold text-xl text-accent-lime block mx-auto">
                            H.
                        </span>
                    )}
                    <button
                        onClick={onToggleCollapse}
                        className="p-1.5 rounded-lg bg-[#2D1B69] hover:bg-[#3D2880] text-[#C5B8E0] hover:text-white transition duration-200 cursor-pointer"
                    >
                        {collapsed ? (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                            </svg>
                        )}
                    </button>
                </div>

                {/* Navigation Items */}
                <nav className="mt-5 flex-1 px-3 space-y-1 bg-[#1F134D]">
                    {items.map((item, idx) => {
                        if (item.subItems) {
                            const isParentActive = item.subItems.some(sub => sub.active);
                            const isOpen = !!openMenus[idx];

                            return (
                                <div key={idx} className="space-y-1">
                                    <button
                                        onClick={() => toggleMenu(idx)}
                                        className={`w-full group flex items-center justify-between px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 relative cursor-pointer ${
                                            isParentActive
                                                ? 'bg-[#2D1B69] text-accent-lime shadow-lg shadow-[#150b35]/20'
                                                : 'text-[#C5B8E0] hover:bg-[#2D1B69]/50 hover:text-white'
                                        }`}
                                    >
                                        <div className="flex items-center">
                                            <div className={`flex items-center justify-center shrink-0 ${collapsed ? 'mx-auto' : 'mr-3'}`}>
                                                {item.icon}
                                            </div>
                                            <span className={`transition-all duration-300 text-left ${collapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'}`}>
                                                {item.label}
                                            </span>
                                        </div>

                                        {!collapsed && (
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
                                        )}

                                        {/* Hover Tooltip with subItems when collapsed */}
                                        {collapsed && (
                                            <div className="absolute left-20 scale-0 group-hover:scale-100 transition-all duration-150 origin-left z-50 bg-[#150B35] text-white text-[11px] font-bold py-2 px-3.5 rounded shadow-md border border-[#2d1b69] whitespace-nowrap text-left space-y-1">
                                                <div className="text-accent-lime font-display border-b border-[#2d1b69] pb-1 mb-1 font-bold">{item.label}</div>
                                                {item.subItems.map((sub, sIdx) => (
                                                    <Link
                                                        key={sIdx}
                                                        href={sub.href}
                                                        className={`block py-1 hover:text-white transition ${sub.active ? 'text-accent-lime' : 'text-[#C5B8E0]'}`}
                                                    >
                                                        {sub.label}
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </button>

                                    {isOpen && !collapsed && (
                                        <div className="pl-8 space-y-1 transition-all duration-300">
                                            {item.subItems.map((sub, sIdx) => (
                                                <Link
                                                    key={sIdx}
                                                    href={sub.href}
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
                                className={`group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 relative ${
                                    item.active
                                        ? 'bg-[#2D1B69] text-accent-lime shadow-lg shadow-[#150b35]/20'
                                        : 'text-[#C5B8E0] hover:bg-[#2D1B69]/50 hover:text-white'
                                }`}
                                title={collapsed ? item.label : undefined}
                            >
                                <div className={`flex items-center justify-center shrink-0 ${collapsed ? 'mx-auto' : 'mr-3'}`}>
                                    {item.icon}
                                </div>
                                <span className={`transition-all duration-300 ${collapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'}`}>
                                    {item.label}
                                </span>

                                {/* Tooltip for Collapsed Sidebar */}
                                {collapsed && (
                                    <div className="absolute left-20 scale-0 group-hover:scale-100 transition-all duration-100 origin-left z-50 bg-[#150B35] text-white text-[11px] font-bold py-1.5 px-3 rounded shadow-md border border-[#2d1b69] whitespace-nowrap">
                                        {item.label}
                                    </div>
                                )}
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </aside>
    );
}
