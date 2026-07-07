export const primitiveColors = {
  navy950: '#071426',
  navy900: '#0B1B31',
  navy800: '#10233A',
  navy700: '#162C45',
  ink50: '#F4F7FB',
  ink300: '#AAB8CA',
  ink500: '#6F7F95',
  coral: '#D96B68',
  sky: '#67A9C9',
  mint: '#71B797',
  sun: '#D8B65F',
  plum: '#9A729E',
  focus: '#DCE8F7',
} as const;

export const colors = {
  background: primitiveColors.navy950,
  backgroundGlow: primitiveColors.navy900,
  surface: primitiveColors.navy800,
  surfaceRaised: primitiveColors.navy700,
  text: primitiveColors.ink50,
  textMuted: primitiveColors.ink300,
  textSubtle: primitiveColors.ink500,
  primary: primitiveColors.sky,
  primaryPressed: '#5799B9',
  secondary: primitiveColors.navy700,
  border: 'rgba(244, 247, 251, 0.12)',
  focus: primitiveColors.focus,
  disabled: 'rgba(170, 184, 202, 0.42)',
  danger: primitiveColors.coral,
  coral: primitiveColors.coral,
  sky: primitiveColors.sky,
  mint: primitiveColors.mint,
  sun: primitiveColors.sun,
  plum: primitiveColors.plum,
} as const;

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 40 } as const;
export const radii = { control: 14, card: 22, tile: 16, sheet: 28, pill: 999 } as const;
export const typography = {
  family: 'Manrope',
  titleSpacing: 3,
  buttonSpacing: 0.4,
} as const;

export const componentTokens = {
  button: {
    minHeight: 48,
    paddingHorizontal: spacing.lg,
    radius: radii.control,
  },
  sheet: {
    radius: radii.sheet,
    padding: spacing.lg,
  },
  playerCard: {
    minHeight: 64,
    radius: radii.card,
  },
} as const;
