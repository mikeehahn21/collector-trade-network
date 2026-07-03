export const themeTokens = {
  colors: {
    background: "#0F1115",
    surface: "#171A21",
    surfaceElevated: "#20242D",
    border: "#2A2F3A",
    textPrimary: "#F6F1E8",
    textSecondary: "#B8B0A3",
    accent: "#D6A84F",
    accentMuted: "#3A3120",
    success: "#7EC98A",
    danger: "#E15D5D",
    warning: "#E3B65E",
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
