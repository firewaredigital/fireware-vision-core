import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { AppProvider } from "@/hooks/useAppContext";
import { AuthGuard } from "@/components/guards/AuthGuard";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ThemeProvider } from "@/components/ThemeProvider";
import { QUERY_DEFAULTS } from "@/lib/queryConfig";

// Pages
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import AppLauncher from "./pages/AppLauncher";

// Route groups (with prefix support)
import { SalesRoutes } from "./routes/SalesRoutes";
import { ServiceRoutes } from "./routes/ServiceRoutes";
import { MarketingRoutes } from "./routes/MarketingRoutes";
import { CommerceRoutes } from "./routes/CommerceRoutes";
import { ITRoutes } from "./routes/ITRoutes";
import { SharedRoutes } from "./routes/SharedRoutes";
import { RedirectRoutes } from "./routes/RedirectRoutes";
import { PortalRoutes } from "./routes/PortalRoutes";
import { PartnerRoutes } from "./routes/PartnerRoutes";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: QUERY_DEFAULTS.queries.staleTime,
      gcTime: QUERY_DEFAULTS.queries.gcTime,
      retry: QUERY_DEFAULTS.queries.retry,
      retryDelay: QUERY_DEFAULTS.queries.retryDelay,
      refetchOnWindowFocus: QUERY_DEFAULTS.queries.refetchOnWindowFocus,
      refetchOnReconnect: QUERY_DEFAULTS.queries.refetchOnReconnect,
    },
    mutations: {
      retry: QUERY_DEFAULTS.mutations.retry,
    },
  },
});

/**
 * ErrorBoundary wrapper that resets on route change.
 */
function RouteAwareErrorBoundary({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  return (
    <ErrorBoundary resetKeys={[location.pathname]}>
      {children}
    </ErrorBoundary>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="fireware-theme">
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppProvider>
              <RouteAwareErrorBoundary>
                <Routes>
                  {/* Root redirect → App Launcher */}
                  <Route path="/" element={<Navigate to="/apps" replace />} />
                  
                  {/* Public routes */}
                  <Route path="/auth" element={<Auth />} />

                  {/* App Launcher (protected) */}
                  <Route path="/apps" element={<AuthGuard><AppLauncher /></AuthGuard>} />

                  {/* ═══ App-specific routes with /app/{slug} prefix ═══ */}
                  
                  {/* CRM */}
                  {SalesRoutes('/app/crm')}
                  {SharedRoutes('/app/crm')}

                  {/* Service */}
                  {ServiceRoutes('/app/service')}
                  {SharedRoutes('/app/service')}

                  {/* Marketing */}
                  {MarketingRoutes('/app/marketing')}
                  {SharedRoutes('/app/marketing')}

                  {/* Commerce */}
                  {CommerceRoutes('/app/commerce')}
                  {SharedRoutes('/app/commerce')}

                  {/* ITSM */}
                  {ITRoutes('/app/itsm')}
                  {SharedRoutes('/app/itsm')}

                  {/* ═══ Legacy redirect routes (backwards compat) ═══ */}
                  {RedirectRoutes()}

                  {/* Portal (Public - Customer) */}
                  {PortalRoutes()}

                  {/* Portal (Public - Partner) */}
                  {PartnerRoutes()}

                  {/* Catch-all */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </RouteAwareErrorBoundary>
            </AppProvider>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
