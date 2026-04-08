window.tailwind = window.tailwind || {};
window.tailwind.config = {
    theme: {
        extend: {
            colors: {
                brand: {
                    50: '#f5f3ff', 100: '#ede9fe', 400: '#a78bfa',
                    500: '#8b5cf6', 600: '#7c3aed', 700: '#6d28d9', 900: '#4c1d95',
                }
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                display: ['Outfit', 'sans-serif'],
            },
            animation: {
                'float': 'float 3s ease-in-out infinite',
                'slide-up': 'slideUp 0.5s ease-out forwards',
                'fade-in': 'fadeIn 0.3s ease-out forwards',
                'bounce-sm': 'bounceSmall 1s infinite alternate',
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
                slideUp: {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                bounceSmall: {
                    '0%': { transform: 'translateY(0)' },
                    '100%': { transform: 'translateY(-5px)' },
                }
            }
        }
    }
};