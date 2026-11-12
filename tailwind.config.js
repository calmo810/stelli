/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
    // The design system (src/styles/system.css) is kept whole, so a class picked
    // at run time (a chip tone, a card tint) is always there.
    safelist: [{ pattern: /^st-/ }],
  theme: {
  	extend: {
  		borderRadius: {
  			'st-xs': 'var(--r-xs)',
  			'st-sm': 'var(--r-sm)',
  			'st-md': 'var(--r-md)',
  			'st-lg': 'var(--r-lg)',
  			'st-xl': 'var(--r-xl)',
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--st-card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--st-primary))',
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
  				DEFAULT: 'hsl(var(--st-accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--st-ring))',
  			ink: 'hsl(var(--ink))',
  			/* Surface-aware colours from the design system (src/styles/system.css):
  			   they read correctly on ink and on paper alike. */
  			fg: {
  				DEFAULT: 'var(--fg)',
  				2: 'var(--fg-2)',
  				3: 'var(--fg-3)'
  			},
  			line: {
  				DEFAULT: 'var(--line)',
  				2: 'var(--line-2)'
  			},
  			fill: {
  				DEFAULT: 'var(--fill)',
  				2: 'var(--fill-2)'
  			},
  			accent2: 'var(--st-accent)',
  			danger: 'var(--danger)',
  			paper: {
  				DEFAULT: '#ffffff',
  				2: '#f4f6fa'
  			},
  			tint: {
  				lime: 'var(--tint-lime)',
  				sky: 'var(--tint-sky)',
  				blush: 'var(--tint-blush)',
  				butter: 'var(--tint-butter)',
  				lilac: 'var(--tint-lilac)',
  				peach: 'var(--tint-peach)'
  			},
  			surface: {
  				DEFAULT: 'hsl(var(--surface))',
  				2: 'hsl(var(--surface-2))'
  			},
  			neon: {
  				lime: 'hsl(var(--neon-lime))',
  				cyan: 'hsl(var(--neon-cyan))',
  				magenta: 'hsl(var(--neon-magenta))'
  			},
  			stelli: {
  				blue: 'hsl(var(--stelli-blue))'
  			},
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
  			},
  			gold: {
  				DEFAULT: 'hsl(var(--gold))',
  				light: 'hsl(var(--gold-light))'
  			},
  			navy: {
  				DEFAULT: 'hsl(var(--navy))',
  				light: 'hsl(var(--navy-light))'
  			},
  			cream: {
  				DEFAULT: 'hsl(var(--cream))',
  				dark: 'hsl(var(--cream-dark))'
  			}
  		},
  		boxShadow: {
  			'st-card': 'var(--shadow-card)',
  			'st-float': 'var(--shadow-float)'
  		},
  		transitionTimingFunction: {
  			st: 'cubic-bezier(0.16, 1, 0.3, 1)'
  		},
  		fontFamily: {
  			heading: ['var(--font-heading)'],
  			body: ['var(--font-body)'],
  			display: ['var(--font-display)'],
  			mono: ['var(--font-mono)'],
  			hand: ['var(--font-hand)'],
  			script: ['var(--font-script)']
  		},
  		keyframes: {
  			'accordion-down': {
  				from: { height: '0' },
  				to: { height: 'var(--radix-accordion-content-height)' }
  			},
  			'accordion-up': {
  				from: { height: 'var(--radix-accordion-content-height)' },
  				to: { height: '0' }
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}
