/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        /* keep your existing HSL-var colors if you still need them */
        border:      "hsl(var(--border))",
        input:       "hsl(var(--input))",
        ring:        "hsl(var(--ring))",
        background:  "hsl(var(--background))",
        foreground:  "hsl(var(--foreground))",
        primary: {
          DEFAULT:    "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT:    "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT:    "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT:    "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT:    "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT:    "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT:    "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },

        /* ICUICI theme, using your hex-based CSS vars */
        icu: {
          1: "var(--color-primary-1)",
          2: "var(--color-primary-2)",
          3: "var(--color-primary-3)",
          4: "var(--color-primary-4)",
          5: "var(--color-primary-5)",
        },
        accent1: "var(--color-accent-1)",
        accent2: "var(--color-accent-2)",
        gray: {
          10: "var(--gray-10)",
          90: "var(--gray-90)",
        },

        // === THE ROW COLOR PALETTE ===
        row: {
          // Primary neutrals - The Row's signature palette
          black: '#000000',
          white: '#FFFFFF',

          // Grayscale spectrum
          gray: {
            50: '#FAFAFA',   // Lightest gray
            100: '#F5F5F5',  // Near white
            200: '#E8E8E8',  // Light gray
            300: '#D1D1D1',  // Medium light
            400: '#B4B4B4',  // Medium
            500: '#8A8A8A',  // Mid gray
            600: '#666666',  // Dark gray
            700: '#4D4D4D',  // Darker gray
            800: '#333333',  // Almost black
            900: '#1A1A1A',  // Near black
          },

          // Earth tones - Warm neutrals
          sand: {
            50: '#FAF8F5',
            100: '#F5F1EB',
            200: '#EAE3D7',
            300: '#DFD5C3',
            400: '#C9BBA5',
            500: '#B3A087',
            600: '#9D8669',
          },

          // Cream tones
          cream: {
            50: '#FFFEF9',
            100: '#FFFCF0',
            200: '#FFF9E6',
            300: '#FFF5D9',
            400: '#FFEEC2',
            500: '#FFE7AB',
          },

          // Accent - Used sparingly
          accent: '#2D2D2D', // Charcoal for subtle emphasis
        },
      },

      // === TYPOGRAPHY ===
      fontFamily: {
        ashborn: ['Ashborn'],
        // Primary font - Clean, modern serif
        serif: ['var(--font-serif)', 'Georgia', 'Times New Roman', 'serif'],
        // Secondary font - Sans-serif for body
        sans: ['var(--font-sans)', 'Helvetica Neue', 'Arial', 'sans-serif'],
        // Mono for product codes/SKU
        mono: ['Courier New', 'monospace'],
        pixel: ['Press Start 2P', 'monospace'],
      },

      fontSize: {
        // Display sizes - For hero text
        'display-xl': ['6rem', { lineHeight: '1', letterSpacing: '-0.02em' }],      // 96px
        'display-lg': ['4.5rem', { lineHeight: '1', letterSpacing: '-0.02em' }],    // 72px
        'display-md': ['3.5rem', { lineHeight: '1.1', letterSpacing: '-0.01em' }],  // 56px

        // Headings
        'h1': ['2.5rem', { lineHeight: '1.2', letterSpacing: '-0.01em' }],          // 40px
        'h2': ['2rem', { lineHeight: '1.2', letterSpacing: '-0.005em' }],           // 32px
        'h3': ['1.5rem', { lineHeight: '1.3', letterSpacing: '0' }],                // 24px
        'h4': ['1.25rem', { lineHeight: '1.4', letterSpacing: '0' }],               // 20px

        // Body text
        'body-lg': ['1.125rem', { lineHeight: '1.6', letterSpacing: '0' }],         // 18px
        'body': ['1rem', { lineHeight: '1.6', letterSpacing: '0' }],                // 16px
        'body-sm': ['0.875rem', { lineHeight: '1.5', letterSpacing: '0.01em' }],    // 14px

        // UI elements
        'caption': ['0.75rem', { lineHeight: '1.4', letterSpacing: '0.02em' }],     // 12px
        'overline': ['0.75rem', { lineHeight: '1.4', letterSpacing: '0.1em' }],     // 12px uppercase
      },

      fontWeight: {
        thin: '100',
        light: '300',
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
      },

      // === SPACING ===
      spacing: {
        // The Row uses generous spacing
        '18': '4.5rem',   // 72px
        '22': '5.5rem',   // 88px
        '26': '6.5rem',   // 104px
        '30': '7.5rem',   // 120px
        '34': '8.5rem',   // 136px
        '38': '9.5rem',   // 152px
      },

      // === LAYOUT ===
      maxWidth: {
        'row': '1440px',        // Main container
        'row-narrow': '1200px',  // Narrow content
        'row-text': '800px',     // Text content
      },

      // === ASPECT RATIOS ===
      aspectRatio: {
        'product': '3/4',        // Portrait product images
        'hero': '16/9',          // Hero images
        'square': '1/1',         // Square images
        'landscape': '4/3',      // Landscape images
      },

      // === TRANSITIONS ===
      transitionDuration: {
        '400': '400ms',
        '600': '600ms',
        '800': '800ms',
      },

      transitionTimingFunction: {
        'row': 'cubic-bezier(0.4, 0.0, 0.2, 1)',  // Smooth, elegant easing
      },

      borderWidth: {
        '1': '1px',
      },

      borderRadius: {
        lg: "var(--radius)",                // your 24px blob corners
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },

      boxShadow: {
        theme: "0 8px 24px rgba(0,0,0,0.08)",
      },

      keyframes: {
        drift: {
          "0%":   { "background-position": "0% 50%" },
          "100%": { "background-position": "100% 50%" },
        },
      },
      animation: {
        drift: "drift 30s ease-in-out infinite alternate",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
