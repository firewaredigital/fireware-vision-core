import { Route } from "react-router-dom";
import { ModuleGuard } from "@/components/guards/ModuleGuard";
import { ProtectedLayout } from "@/components/guards/ProtectedLayout";
import Orders from "@/pages/Orders";
import OrderDetail from "@/pages/OrderDetail";
import OrderForm from "@/pages/OrderForm";
import Returns from "@/pages/Returns";
import Promotions from "@/pages/Promotions";
import PromotionForm from "@/pages/PromotionForm";

export function CommerceRoutes() {
  return [
    <Route key="orders" path="/orders" element={<ProtectedLayout><ModuleGuard moduleKey="commerce"><Orders /></ModuleGuard></ProtectedLayout>} />,
    <Route key="orders-new" path="/orders/new" element={<ProtectedLayout><ModuleGuard moduleKey="commerce"><OrderForm /></ModuleGuard></ProtectedLayout>} />,
    <Route key="orders-id" path="/orders/:id" element={<ProtectedLayout><ModuleGuard moduleKey="commerce"><OrderDetail /></ModuleGuard></ProtectedLayout>} />,
    <Route key="returns" path="/returns" element={<ProtectedLayout><ModuleGuard moduleKey="commerce"><Returns /></ModuleGuard></ProtectedLayout>} />,
    <Route key="promos" path="/promotions" element={<ProtectedLayout><ModuleGuard moduleKey="commerce"><Promotions /></ModuleGuard></ProtectedLayout>} />,
    <Route key="promos-new" path="/promotions/new" element={<ProtectedLayout><ModuleGuard moduleKey="commerce"><PromotionForm /></ModuleGuard></ProtectedLayout>} />,
    <Route key="promos-id" path="/promotions/:id" element={<ProtectedLayout><ModuleGuard moduleKey="commerce"><PromotionForm /></ModuleGuard></ProtectedLayout>} />,
  ];
}
