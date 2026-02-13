import { Route } from "react-router-dom";
import { ModuleGuard } from "@/components/guards/ModuleGuard";
import { ProtectedLayout } from "@/components/guards/ProtectedLayout";
import Orders from "@/pages/Orders";
import OrderDetail from "@/pages/OrderDetail";
import OrderForm from "@/pages/OrderForm";
import Returns from "@/pages/Returns";
import Promotions from "@/pages/Promotions";
import PromotionForm from "@/pages/PromotionForm";
import CommerceDashboard from "@/pages/CommerceDashboard";

export function CommerceRoutes(prefix = '') {
  const p = prefix;
  return [
    <Route key={`${p}-com-dash`} path={`${p}/dashboard`} element={<ProtectedLayout><ModuleGuard moduleKey="commerce"><CommerceDashboard /></ModuleGuard></ProtectedLayout>} />,
    <Route key={`${p}-orders`} path={`${p}/orders`} element={<ProtectedLayout><ModuleGuard moduleKey="commerce"><Orders /></ModuleGuard></ProtectedLayout>} />,
    <Route key={`${p}-orders-new`} path={`${p}/orders/new`} element={<ProtectedLayout><ModuleGuard moduleKey="commerce"><OrderForm /></ModuleGuard></ProtectedLayout>} />,
    <Route key={`${p}-orders-id`} path={`${p}/orders/:id`} element={<ProtectedLayout><ModuleGuard moduleKey="commerce"><OrderDetail /></ModuleGuard></ProtectedLayout>} />,
    <Route key={`${p}-returns`} path={`${p}/returns`} element={<ProtectedLayout><ModuleGuard moduleKey="commerce"><Returns /></ModuleGuard></ProtectedLayout>} />,
    <Route key={`${p}-promos`} path={`${p}/promotions`} element={<ProtectedLayout><ModuleGuard moduleKey="commerce"><Promotions /></ModuleGuard></ProtectedLayout>} />,
    <Route key={`${p}-promos-new`} path={`${p}/promotions/new`} element={<ProtectedLayout><ModuleGuard moduleKey="commerce"><PromotionForm /></ModuleGuard></ProtectedLayout>} />,
    <Route key={`${p}-promos-id`} path={`${p}/promotions/:id`} element={<ProtectedLayout><ModuleGuard moduleKey="commerce"><PromotionForm /></ModuleGuard></ProtectedLayout>} />,
  ];
}
