import { Route } from "react-router-dom";
import { ModuleGuard } from "@/components/guards/ModuleGuard";
import Orders from "@/pages/Orders";
import OrderDetail from "@/pages/OrderDetail";
import OrderForm from "@/pages/OrderForm";
import Returns from "@/pages/Returns";
import Promotions from "@/pages/Promotions";
import PromotionForm from "@/pages/PromotionForm";

export function CommerceRoutes() {
  return [
    <Route key="orders" path="/orders" element={<ModuleGuard moduleKey="commerce"><Orders /></ModuleGuard>} />,
    <Route key="orders-new" path="/orders/new" element={<ModuleGuard moduleKey="commerce"><OrderForm /></ModuleGuard>} />,
    <Route key="orders-id" path="/orders/:id" element={<ModuleGuard moduleKey="commerce"><OrderDetail /></ModuleGuard>} />,
    <Route key="returns" path="/returns" element={<ModuleGuard moduleKey="commerce"><Returns /></ModuleGuard>} />,
    <Route key="promos" path="/promotions" element={<ModuleGuard moduleKey="commerce"><Promotions /></ModuleGuard>} />,
    <Route key="promos-new" path="/promotions/new" element={<ModuleGuard moduleKey="commerce"><PromotionForm /></ModuleGuard>} />,
    <Route key="promos-id" path="/promotions/:id" element={<ModuleGuard moduleKey="commerce"><PromotionForm /></ModuleGuard>} />,
  ];
}
