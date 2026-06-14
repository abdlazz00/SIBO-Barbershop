import React from 'react';

export default function Card({ variant = 'default', className = '', children, ...props }) {
    const baseStyle = "rounded-card transition-all duration-200";
    const variants = {
        default: "bg-white border border-hairline-cloud shadow-card hover:shadow-card-hover hover:-translate-y-0.5",
        dark: "bg-surface-card-dark border border-hairline-violet text-white",
        featured: "bg-primary text-white"
    };

    return (
        <div
            className={`${baseStyle} ${variants[variant] || variants.default} ${className}`}
            {...props}
        >
            {children}
        </div>
    );
}
