import type { Config } from 'tailwindcss';

export default {
    content: ['./app/**/*.{js,jsx,ts,tsx}'],
    darkMode: ['class'],
    theme: {
        container: {
            center: true,
            padding: '2rem',
            screens: {
                '2xl': '1400px',
            },
        },
        extend: {
            colors: {
                border: 'hsl(var(--border))',
                input: 'hsl(var(--input))',
                ring: 'hsl(var(--ring))',
                background: 'hsl(var(--background))',
                foreground: 'hsl(var(--foreground))',
                primary: {
                    DEFAULT: 'hsl(var(--primary))',
                    foreground: 'hsl(var(--primary-foreground))',
                },
                secondary: {
                    DEFAULT: 'hsl(var(--secondary))',
                    foreground: 'hsl(var(--secondary-foreground))',
                },
                destructive: {
                    DEFAULT: 'hsl(var(--destructive))',
                    foreground: 'hsl(var(--destructive-foreground))',
                },
                muted: {
                    DEFAULT: 'hsl(var(--muted))',
                    foreground: 'hsl(var(--muted-foreground))',
                },
                accent: {
                    DEFAULT: 'hsl(var(--accent))',
                    foreground: 'hsl(var(--accent-foreground))',
                },
                popover: {
                    DEFAULT: 'hsl(var(--popover))',
                    foreground: 'hsl(var(--popover-foreground))',
                },
                card: {
                    DEFAULT: 'hsl(var(--card))',
                    foreground: 'hsl(var(--card-foreground))',
                },
                brand: {
                    50: 'hsl(var(--brand-50))',
                    100: 'hsl(var(--brand-100))',
                    200: 'hsl(var(--brand-200))',
                    300: 'hsl(var(--brand-300))',
                    400: 'hsl(var(--brand-400))',
                    500: 'hsl(var(--brand-500))',
                    600: 'hsl(var(--brand-600))',
                    700: 'hsl(var(--brand-700))',
                    800: 'hsl(var(--brand-800))',
                    900: 'hsl(var(--brand-900))',
                    950: 'hsl(var(--brand-950))',
                },
            },
            borderRadius: {
                lg: `var(--radius)`,
                md: `calc(var(--radius) - 2px)`,
                sm: 'calc(var(--radius) - 4px)',
            },
            fontFamily: {
                inter: ['Inter', 'sans-serif'],
            },
            keyframes: {
                'accordion-down': {
                    from: { height: '0' },
                    to: { height: 'var(--radix-accordion-content-height)' },
                },
                'accordion-up': {
                    from: { height: 'var(--radix-accordion-content-height)' },
                    to: { height: '0' },
                },
                'spinner-fade-in': {
                    '0%': {
                        opacity: '0',
                        transform: 'scale(0.8)',
                    },
                    '100%': {
                        opacity: '1',
                        transform: 'scale(1)',
                    },
                },
                'spinner-fade-out': {
                    '0%': {
                        opacity: '1',
                        transform: 'scale(1)',
                    },
                    '100%': {
                        opacity: '0',
                        transform: 'scale(0.8)',
                    },
                },
                'spinner-spin': {
                    '0%': {
                        opacity: '1',
                    },
                    '100%': {
                        opacity: '0.15',
                    },
                },
            },
            animation: {
                'accordion-down': 'accordion-down 0.2s ease-out',
                'accordion-up': 'accordion-up 0.2s ease-out',
                'spinner-loading-bar': 'spinner-spin 1.2s linear infinite',
            },
        },
    },
    plugins: [],
} satisfies Config;
