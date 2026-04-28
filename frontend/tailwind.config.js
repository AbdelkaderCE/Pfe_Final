module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Surface elevation — driven by CSS variables for theming
        canvas:      'var(--color-canvas)',
        surface: {
          DEFAULT: 'var(--color-surface)',
          100:     'var(--color-surface-100)',
          200:     'var(--color-surface-200)',
          300:     'var(--color-surface-300)',
        },
        // Foreground — 4-level text hierarchy
        ink: {
          DEFAULT:   'var(--color-ink)',
          secondary: 'var(--color-ink-secondary)',
          tertiary:  'var(--color-ink-tertiary)',
          muted:     'var(--color-ink-muted)',
        },
        // Borders — subtle progression
        edge: {
          DEFAULT: 'var(--color-edge)',
          subtle:  'var(--color-edge-subtle)',
          strong:  'var(--color-edge-strong)',
        },
        // Brand — driven by accent theme
        brand: {
          DEFAULT: 'var(--color-brand)',
          light:   'var(--color-brand-light)',
          dark:    'var(--color-brand-dark)',
          hover:   'var(--color-brand-hover)',
        },
        // Semantic
        success:   'var(--color-success)',
        warning:   'var(--color-warning)',
        danger:    'var(--color-danger)',
        // Control
        control: {
          bg:     'var(--color-control-bg)',
          border: 'var(--color-control-border)',
          focus:  'var(--color-control-focus)',
        },
        // Sidebar palette — driven by global sidebar color theme
        sidebar: {
          DEFAULT: 'var(--color-sidebar-bg)',
          edge: 'var(--color-sidebar-edge)',
          'edge-subtle': 'var(--color-sidebar-edge-subtle)',
          hover: 'var(--color-sidebar-hover)',
          active: 'var(--color-sidebar-active)',
          'active-text': 'var(--color-sidebar-active-text)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        sm:  '4px',
        md:  '8px',
        lg:  '12px',
        xl:  '16px',
      },
      boxShadow: {
        soft: 'var(--shadow-soft)',
        card: 'var(--shadow-card)',
        'card-hover': 'var(--shadow-card-hover)',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
    },
  },
  plugins: [],
}
