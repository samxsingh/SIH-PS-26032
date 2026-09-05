/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'warm-ivory': '#FAF8F5',
        'warm-card': '#FFFFFF',
        'forest-green': {
          DEFAULT: '#1B4D3E',
          hover: '#143B2F',
          light: '#E8F3EE',
          border: '#22252A'
        },
        'wheat-accent': {
          DEFAULT: '#D4A373',
          light: '#FBF3EB',
          dark: '#B07E4D'
        },
        'dark-neutral': {
          DEFAULT: '#22252A',
          muted: '#475569',
          light: '#F1F5F9'
        },
        'info-blue': {
          DEFAULT: '#2563EB',
          light: '#EFF6FF',
          border: '#22252A'
        },
        'warning-amber': {
          DEFAULT: '#D97706',
          light: '#FFFBEB',
          border: '#22252A'
        }
      },
      boxShadow: {
        'brutal-sm': '3px 3px 0px #22252A',
        'brutal': '5px 5px 0px #22252A',
        'brutal-lg': '8px 8px 0px #22252A',
        'brutal-xl': '12px 12px 0px #22252A',
        'brutal-green': '5px 5px 0px #1B4D3E',
        'brutal-wheat': '5px 5px 0px #B07E4D',
        'brutal-blue': '5px 5px 0px #1D4ED8',
        'brutal-amber': '5px 5px 0px #B45309',
        'brutal-inset': 'inset 2px 2px 0px #22252A'
      },
      borderWidth: {
        '3': '3px',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        heading: ['Outfit', 'Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      minHeight: {
        'touch': '48px',
      },
      minWidth: {
        'touch': '48px',
      },
      transitionTimingFunction: {
        'tactile': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'cinematic': 'cubic-bezier(0.22, 0.61, 0.36, 1)',
      },
      transitionDuration: {
        'micro': '150ms',
        'normal': '220ms',
        'page': '300ms',
      },
      keyframes: {
        pageEnter: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        viewEnter: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        stepEnterForward: {
          '0%': { opacity: '0', transform: 'translateX(8px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        modalBackdrop: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        modalDialog: {
          '0%': { opacity: '0', transform: 'scale(0.97) translateY(6px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        toastEnter: {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleCheck: {
          '0%': { opacity: '0', transform: 'scale(0.85)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        fadeSlideIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        badgeSuccess: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        }
      },
      animation: {
        'page-enter': 'pageEnter 300ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'view-enter': 'viewEnter 250ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'step-enter': 'stepEnterForward 250ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'modal-backdrop': 'modalBackdrop 200ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'modal-dialog': 'modalDialog 220ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'toast-enter': 'toastEnter 200ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'scale-check': 'scaleCheck 300ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'fade-slide': 'fadeSlideIn 200ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'badge-success': 'badgeSuccess 350ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
      }
    },
  },
  plugins: [],
}
