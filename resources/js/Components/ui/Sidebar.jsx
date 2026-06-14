import { Link } from '@inertiajs/react';
import Dropdown from '@/Components/Dropdown';
import React from 'react';

export default function Sidebar({ user, items, collapsed, onToggleCollapse }) {
    return (
        <aside className={`min-h-screen bg-[#1F134D] text-white flex flex-col justify-between border-r border-[#2d1b69] transition-all duration-300 ease-in-out shrink-0 select-none ${collapsed ? 'w-20' : 'w-64'}`}>
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
                    {items.map((item, idx) => (
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
                    ))}
                </nav>
            </div>

        </aside>
    );
}
