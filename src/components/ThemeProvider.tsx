import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { type ReactNode } from 'react';

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: string;
  storageKey?: string;
}

/**
 * ThemeProvider com Persistência via next-themes.
 * 
 * - attribute="class": Aplica tema via classe CSS no <html>
 * - enableSystem: Detecta preferência do sistema operacional
 * - defaultTheme="system": Segue o tema do sistema por padrão
 * - disableTransitionOnChange: Evita flash de animação ao trocar tema
 * - Persistência automática via localStorage (chave: "fireware-theme")
 */
export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'fireware-theme',
}: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme={defaultTheme}
      enableSystem
      disableTransitionOnChange
      storageKey={storageKey}
    >
      {children}
    </NextThemesProvider>
  );
}

export default ThemeProvider;
