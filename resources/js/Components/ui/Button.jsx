import React from 'react';

export default function Button({ variant = 'primary', className = '', children, ...props }) {
    const baseStyle = "font-sans uppercase tracking-wider font-bold text-xs py-3 px-5 rounded-md transition duration-200 active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center";
    const variants = {
        primary: "bg-primary text-white hover:bg-primary-dark",
        accent: "bg-accent-lime text-ink-deep hover:bg-accent-lime-muted",
        outline: "border-1.5 border-accent-violet text-primary hover:bg-surface-press-light hover:border-primary",
        danger: "bg-status-danger text-white hover:bg-red-600",
        ghost: "bg-on-dark-faint text-white hover:bg-white/20"
    };

    return (
        <button
            className={`${baseStyle} ${variants[variant] || variants.primary} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
}
