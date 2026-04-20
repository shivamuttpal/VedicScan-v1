/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
  	extend: {
  		fontFamily: {
  			outfit: ['Outfit', 'sans-serif'],
  			playfair: ['Playfair Display', 'serif'],
  			devanagari: ['Noto Sans Devanagari', 'sans-serif'],
  		},
  		colors: {
  			// Vedic palette
  			vedic: {
  				bg: '#FDFAF6',
  				'bg-warm': '#F9F3EB',
  				input: '#F5F0E8',
  			},
  			saffron: {
  				DEFAULT: '#D4760A',
  				soft: '#F5DFC5',
  				pale: '#FFF7ED',
  				50: '#FFF7ED',
  				100: '#F5DFC5',
  				200: '#F0CC9A',
  				500: '#D4760A',
  				600: '#B56508',
  				700: '#965406',
  			},
  			maroon: {
  				DEFAULT: '#7B1A38',
  				soft: '#F2D8E0',
  				pale: '#FDF2F5',
  				50: '#FDF2F5',
  				100: '#F2D8E0',
  				500: '#7B1A38',
  				600: '#5A1330',
  				700: '#4A0F27',
  			},
  			gold: {
  				DEFAULT: '#B8860B',
  				soft: '#F5E6C8',
  				pale: '#FFFBF0',
  				50: '#FFFBF0',
  				100: '#F5E6C8',
  				500: '#B8860B',
  				600: '#996F09',
  				border: '#D4BA80',
  			},
  			vteal: {
  				DEFAULT: '#0C7C6B',
  				soft: '#D0F0EA',
  				50: '#D0F0EA',
  				500: '#0C7C6B',
  				600: '#0A6858',
  			},
  			vpurple: {
  				DEFAULT: '#6C3FA0',
  				soft: '#EDE3F7',
  				50: '#EDE3F7',
  				500: '#6C3FA0',
  				600: '#5A3488',
  			},
  			vgreen: {
  				DEFAULT: '#1A7D4E',
  				soft: '#D4EFDF',
  				50: '#D4EFDF',
  				500: '#1A7D4E',
  			},
  			vred: {
  				DEFAULT: '#C0392B',
  				soft: '#FADBD8',
  			},
  			vtext: {
  				DEFAULT: '#2C1E12',
  				mid: '#6B5040',
  				muted: '#9A8878',
  				dim: '#C4B8AC',
  			},
  			vborder: {
  				DEFAULT: '#E8DFD2',
  				gold: '#D4BA80',
  			},
  			// shadcn-ui palette (preserved)
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: { height: '0' },
  				to: { height: 'var(--radix-accordion-content-height)' }
  			},
  			'accordion-up': {
  				from: { height: 'var(--radix-accordion-content-height)' },
  				to: { height: '0' }
  			},
  			'fade-in': {
  				from: { opacity: '0', transform: 'translateY(8px)' },
  				to: { opacity: '1', transform: 'translateY(0)' }
  			},
  			'slide-up': {
  				from: { opacity: '0', transform: 'translateY(20px)' },
  				to: { opacity: '1', transform: 'translateY(0)' }
  			},
  			'float': {
  				'0%, 100%': { transform: 'translateY(0)' },
  				'50%': { transform: 'translateY(-6px)' }
  			},
  			'shimmer': {
  				'0%': { backgroundPosition: '-200% 0' },
  				'100%': { backgroundPosition: '200% 0' }
  			},
  			'spin-slow': {
  				from: { transform: 'rotate(0deg)' },
  				to: { transform: 'rotate(360deg)' }
  			},
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
  			'fade-in': 'fade-in 0.4s ease-out forwards',
  			'slide-up': 'slide-up 0.5s ease-out forwards',
  			'float': 'float 3s ease-in-out infinite',
  			'shimmer': 'shimmer 2s linear infinite',
  			'spin-slow': 'spin-slow 20s linear infinite',
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
};