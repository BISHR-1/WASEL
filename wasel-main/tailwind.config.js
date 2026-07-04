/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
  	extend: {
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		colors: {
  			// 🎨 Wasel Brand Palette — الهوية البصرية الجديدة
  			brand: {
  				// أزرق داكن موثوق
  				navy: {
  					DEFAULT: '#0B2545',
  					dark: '#134074',
  					light: '#EEF4F8',
  				},
  				// برتقالي CTA حيوي
  				orange: {
  					DEFAULT: '#FF7F11',
  					dark: '#E16200',
  					light: '#FFF0E5',
  				},
  				// أخضر مريح
  				sage: {
  					DEFAULT: '#A3B18A',
  					dark: '#588157',
  					light: '#F4F7F4',
  				},
  				// ألوان محايدة
  				neutral: {
  					light: '#F8F9FA',
  					dark: '#1A202C',
  				},
  			},
  			// 🎨 Wasel Trust Green Palette — الألوان الأصلية
  			wasel: {
  				cream: '#F9FAF8',
  				gray: '#E5E7EB',
  				green: '#1F7A63',
  				cta: '#2FA36B',
  				dark: '#1F2933',
  			},
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
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		fontFamily: {
  			sans: ['Cairo', 'Inter', 'system-ui', 'sans-serif'],
  			cairo: ['Cairo', 'sans-serif'],
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
  			'slide-up': {
  				from: { transform: 'translateY(100%)', opacity: '0' },
  				to: { transform: 'translateY(0)', opacity: '1' }
  			},
  			'slide-down': {
  				from: { transform: 'translateY(0)', opacity: '1' },
  				to: { transform: 'translateY(100%)', opacity: '0' }
  			},
  			'fade-in': {
  				from: { opacity: '0', transform: 'translateY(8px)' },
  				to: { opacity: '1', transform: 'translateY(0)' }
  			},
  			'pulse-soft': {
  				'0%, 100%': { opacity: '1' },
  				'50%': { opacity: '0.7' }
  			},
  			'shimmer': {
  				'0%': { backgroundPosition: '-200% 0' },
  				'100%': { backgroundPosition: '200% 0' }
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
  			'slide-up': 'slide-up 0.3s ease-out',
  			'slide-down': 'slide-down 0.3s ease-out',
  			'fade-in': 'fade-in 0.4s ease-out',
  			'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
  			'shimmer': 'shimmer 1.5s linear infinite',
  		},
  		boxShadow: {
  			'nav': '0 -4px 20px rgba(11, 37, 69, 0.08)',
  			'card-hover': '0 12px 32px rgba(11, 37, 69, 0.12)',
  			'hero': '0 20px 60px rgba(11, 37, 69, 0.2)',
  			'cta': '0 8px 24px rgba(255, 127, 17, 0.35)',
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}