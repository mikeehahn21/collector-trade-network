export const themeTokens = {
  colors: {
    background: "#050505",
    surface: "#111111",
    surfaceElevated: "#171717",
    border: "#3A2A1F",
    textPrimary: "#FFF7EC",
    textSecondary: "#C9B8A4",
    accent: "#FF7A1A",
    accentMuted: "#3B1D0A",
    success: "#53D178",
    danger: "#FF5A3D",
    warning: "#FFB347",
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  radius: {
    sm: 6,
    md: 8,
    lg: 12,
  },
} as const;

export type AppTheme = typeof themeTokens & {
  statusBarStyle: "light" | "dark";
};
