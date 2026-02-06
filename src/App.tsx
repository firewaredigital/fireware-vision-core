import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ModuleGuard } from "@/components/guards/ModuleGuard";
import { ProtectedLayout } from "@/components/guards/ProtectedLayout";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ThemeProvider } from "@/components/ThemeProvider";
import { QUERY_DEFAULTS } from "@/lib/queryConfig";

// Pages
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import AuditLogs from "./pages/AuditLogs";
import Reports from "./pages/Reports";
import CannedResponses from "./pages/CannedResponses";
import Notifications from "./pages/Notifications";

// Route groups
import { SalesRoutes } from "./routes/SalesRoutes";
import { ServiceRoutes } from "./routes/ServiceRoutes";
import { MarketingRoutes } from "./routes/MarketingRoutes";
import { CommerceRoutes } from "./routes/CommerceRoutes";
import { ITRoutes } from "./routes/ITRoutes";
import { DataRoutes } from "./routes/DataRoutes";
import { AutomationRoutes } from "./routes/AutomationRoutes";
import { GovernanceRoutes } from "./routes/GovernanceRoutes";
import { ManagementRoutes } from "./routes/ManagementRoutes";
import { PortalRoutes } from "./routes/PortalRoutes";
import { AdminRoutes } from "./routes/AdminRoutes";
import { AIRoutes } from "./routes/AIRoutes";
import { IntegrationRoutes } from "./routes/IntegrationRoutes";
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
 * Must be inside BrowserRouter to access useLocation.
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
            <RouteAwareErrorBoundary>
              <Routes>
                {/* Root redirect */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                
                {/* Public routes — sem AuthGuard */}
                <Route path="/auth" element={<Auth />} />

                {/* Protected routes — todas dentro de ProtectedLayout */}
                <Route path="/dashboard" element={
                  <ProtectedLayout><Dashboard /></ProtectedLayout>
                } />

                {/* Module-guarded route groups */}
                {SalesRoutes()}
                {ServiceRoutes()}
                {MarketingRoutes()}
                {CommerceRoutes()}
                {ITRoutes()}
                {DataRoutes()}
                {AutomationRoutes()}
                {GovernanceRoutes()}
                {AIRoutes()}
                {IntegrationRoutes()}

                {/* Management (always visible) */}
                {ManagementRoutes()}

                {/* Admin Platform */}
                {AdminRoutes()}

                {/* Portal (Public - Customer) */}
                {PortalRoutes()}

                {/* Portal (Public - Partner) */}
                {PartnerRoutes()}

                {/* Protected utility routes */}
                <Route path="/reports" element={
                  <ProtectedLayout><Reports /></ProtectedLayout>
                } />
                <Route path="/audit-logs" element={
                  <ProtectedLayout><AuditLogs /></ProtectedLayout>
                } />
                <Route path="/notifications" element={
                  <ProtectedLayout><Notifications /></ProtectedLayout>
                } />
                <Route path="/settings" element={
                  <ProtectedLayout><Settings /></ProtectedLayout>
                } />
                <Route path="/settings/canned-responses" element={
                  <ProtectedLayout>
                    <ModuleGuard moduleKey="service">
                      <CannedResponses />
                    </ModuleGuard>
                  </ProtectedLayout>
                } />

                {/* Catch-all */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </RouteAwareErrorBoundary>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
