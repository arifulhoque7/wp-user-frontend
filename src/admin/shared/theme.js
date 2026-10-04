/**
 * WPUF design tokens for plugin-ui's ThemeProvider: the develop Vue look
 * (openspec design-tokens.md). Dark mode is not offered, so the dark tokens
 * are the light ones.
 */
export const wpufTokens = Object.freeze( {
    background: '#ffffff',
    foreground: '#111827',
    card: '#ffffff',
    cardForeground: '#111827',
    popover: '#ffffff',
    popoverForeground: '#111827',
    primary: '#059669',
    primaryForeground: '#ffffff',
    secondary: '#f3f4f6',
    secondaryForeground: '#374151',
    muted: '#f9fafb',
    mutedForeground: '#6b7280',
    accent: '#f9fafb',
    accentForeground: '#111827',
    destructive: '#dc2626',
    destructiveForeground: '#ffffff',
    success: '#15803d',
    successForeground: '#ffffff',
    warning: '#854d0e',
    warningForeground: '#ffffff',
    info: '#059669',
    infoForeground: '#ffffff',
    border: '#d1d5db',
    input: '#d1d5db',
    ring: '#059669',
    // plugin-ui: rounded-md = radius - 2px (controls 6px), rounded-xl = radius + 4px (cards 12px).
    radius: '0.5rem',
    // The screens' Tailwind 3 stack (v3-theme.css). The provider prints tokens
    // inline on its root, so plugin-ui's default would reach a host screen's
    // markup and change every `font-sans` there (builder, 4.4c). Both start
    // with ui-sans-serif, system-ui: same system font for the wrappers.
    fontSans: 'ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
} );

export const wpufDarkTokens = wpufTokens;

/**
 * WPUF values that plugin-ui has no token for (design-tokens.md "custom"),
 * used by the shared/ui wrappers.
 */
export const wpufExtraTokens = Object.freeze( {
    primaryHover: '#10b981',
    label: '#374151',
    placeholder: '#9ca3af',
    borderSubtle: '#e5e7eb',
    pageBackground: '#ffffff',
} );
