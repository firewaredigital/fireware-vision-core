import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ModuleGuard } from "@/components/guards/ModuleGuard";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import AuditLogs from "./pages/AuditLogs";
import Reports from "./pages/Reports";
// Lazy route groups
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />

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

            {/* Management (always visible) */}
            {ManagementRoutes()}

            {/* Admin Platform */}
            {AdminRoutes()}

            {/* Portal (Public) */}
            {PortalRoutes()}

            {/* Settings */}
            <Route path="/reports" element={<Reports />} />
            <Route path="/audit-logs" element={<AuditLogs />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/settings/canned-responses" element={
              <ModuleGuard moduleKey="service">
                {/* Lazy import would go here; for now inline */}
                <CannedResponsesLazy />
              </ModuleGuard>
            } />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

// Inline lazy wrapper for canned responses
import CannedResponses from "./pages/CannedResponses";
function CannedResponsesLazy() {
  return <CannedResponses />;
}

export default App;
