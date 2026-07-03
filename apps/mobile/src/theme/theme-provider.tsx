import { createContext, useContext } from "react";
import type { PropsWithChildren } from "react";

import { type AppTheme, themeTokens } from "./tokens";

const theme: AppTheme = {
  ...themeTokens,
  statusBarStyle: "light",
};

const ThemeContext = createContext<AppTheme>(theme);

export function ThemeProvider({ children }: PropsWithChildren) {
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): AppTheme {
  return useContext(ThemeContext);
}
