import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.jsx',
    ],

    theme: {
        extend: {
            colors: {
                // Brand & Accents
                primary: {
                    DEFAULT: '#2D1B69',
                    dark: '#1A0F3D',
                    deeper: '#150B35',
                },
                accent: {
                    lime: {
                        DEFAULT: '#C2EF4E',
                        muted: '#A8D93E',
                    },
                    violet: {
                        DEFAULT: '#7C5CBF',
                        deep: '#4A2D8A',
                        mid: '#8B72B0',
                    },
                    warm: '#9B7FD4',
                },
                // Canvas & Surfaces
                surface: {
                    canvas: {
                        light: '#ffffff',
                        dark: '#2D1B69',
                    },
                    hero: '#1A0F3D',
                    sidebar: '#2D1B69',
                    card: {
                        DEFAULT: '#f8f7ff',
                        dark: '#1A0F3D',
                    },
                    input: '#ffffff',
                },
                // Hairlines (Borders)
                hairline: {
                    violet: {
                        DEFAULT: '#3D2880',
                        light: '#C4B8E8',
                    },
                    cloud: '#E5E7EB',
                    cool: '#D0CAE8',
                },
                // Typography / Ink
                ink: {
                    DEFAULT: '#1A0F3D',
                    deep: '#150B35',
                    press: '#0D0820',
                },
                on: {
                    dark: {
                        primary: '#ffffff',
                        muted: '#C5B8E0',
                        faint: 'rgba(255, 255, 255, 0.15)',
                    },
                    light: {
                        muted: '#6B5A8E',
                        faint: '#9B8FC0',
                    },
                },
                // Booking Statuses
                booking: {
                    confirmed: '#3B82F6',
                    'in-progress': '#F59E0B',
                    completed: '#22C55E',
                    cancelled: '#EF4444',
                },
            },
            fontFamily: {
                display: ['Space Grotesk', ...defaultTheme.fontFamily.sans],
                sans: ['Rubik', ...defaultTheme.fontFamily.sans],
            },
            borderRadius: {
                xs: '4px',
                sm: '6px',
                md: '8px',
                lg: '12px',
                card: '12px',
                xl: '16px',
                xxl: '20px',
            },
            boxShadow: {
                card: '0 1px 3px rgba(45, 27, 105, 0.08), 0 4px 12px rgba(45, 27, 105, 0.06)',
                'card-hover': '0 4px 16px rgba(45, 27, 105, 0.12), 0 8px 24px rgba(45, 27, 105, 0.08)',
                sidebar: '4px 0 24px rgba(21, 11, 53, 0.25)',
                modal: '0 20px 60px rgba(21, 11, 53, 0.3)',
            },
            spacing: {
                xxs: '2px',
                xs: '4px',
                sm: '8px',
                md: '12px',
                lg: '16px',
                xl: '24px',
                xxl: '32px',
                section: '80px',
            },
        },
    },

    plugins: [forms],
};

