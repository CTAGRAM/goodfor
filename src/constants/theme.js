/**
 * GoodFor Mobile App Theme Configuration
 * Based on Tailwind CSS v4 theme from web design
 */

export const colors = {
  background: "#F2F5F3",
  foreground: "#1A1D1C",
  primary: "#243628",
  primaryForeground: "#FFFFFF",
  secondary: "#E4E9E6",
  secondaryForeground: "#243628",
  muted: "#F0F2F1",
  mutedForeground: "#6C7570",
  accent: "#D6E4DA",
  accentForeground: "#1A1D1C",
  destructive: "#D93025",
  card: "#FFFFFF",
  cardForeground: "#1A1D1C",
  popover: "#FFFFFF",
  popoverForeground: "#1A1D1C",
  border: "#E1E6E3",
  input: "#EFF2F0",
  ring: "#243628",
  chart1: "#34A853",
  chart2: "#FBBC04",
  chart3: "#EA4335",
  chart4: "#5F6368",
  chart5: "#8AB4F8",
};

export const fonts = {
  sans: "Rubik_400Regular",
  sansMedium: "Rubik_500Medium",
  sansSemiBold: "Rubik_600SemiBold",
  sansBold: "Rubik_700Bold",
  sansExtraBold: "Rubik_800ExtraBold",
  heading: "Rubik_700Bold",
  headingExtraBold: "Rubik_800ExtraBold",
};

export const fontSizes = {
  xs: 10,
  sm: 12,
  base: 14,
  lg: 16,
  xl: 18,
  '2xl': 20,
  '3xl': 24,
  '4xl': 28,
  '5xl': 34,
};

export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  10: 40,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
  24: 96,
  32: 128,
};

export const radius = {
  sm: 12,
  md: 14,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  full: 9999,
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
};

// Default export with all theme values
const theme = {
  colors,
  fonts,
  fontSizes,
  spacing,
  radius,
  shadows,
};

export default theme;
