import { Route } from "react-router-dom";
import { ProtectedLayout } from "@/components/guards/ProtectedLayout";
import Products from "@/pages/Products";
import ProductDetail from "@/pages/ProductDetail";
import ProductForm from "@/pages/ProductForm";
import Territories from "@/pages/Territories";
import Cadences from "@/pages/Cadences";
import Forecast from "@/pages/Forecast";
import Dashboards from "@/pages/Dashboards";
import DashboardBuilder from "@/pages/DashboardBuilder";

export function ManagementRoutes() {
  return [
    <Route key="products" path="/products" element={<ProtectedLayout><Products /></ProtectedLayout>} />,
    <Route key="products-new" path="/products/new" element={<ProtectedLayout><ProductForm /></ProtectedLayout>} />,
    <Route key="products-id" path="/products/:id" element={<ProtectedLayout><ProductDetail /></ProtectedLayout>} />,
    <Route key="products-edit" path="/products/:id/edit" element={<ProtectedLayout><ProductForm /></ProtectedLayout>} />,
    <Route key="territories" path="/territories" element={<ProtectedLayout><Territories /></ProtectedLayout>} />,
    <Route key="cadences" path="/cadences" element={<ProtectedLayout><Cadences /></ProtectedLayout>} />,
    <Route key="forecast" path="/forecast" element={<ProtectedLayout><Forecast /></ProtectedLayout>} />,

    // Dashboard Builder
    <Route key="dashboards" path="/dashboards" element={<ProtectedLayout><Dashboards /></ProtectedLayout>} />,
    <Route key="dashboards-new" path="/dashboards/new" element={<ProtectedLayout><DashboardBuilder /></ProtectedLayout>} />,
    <Route key="dashboards-edit" path="/dashboards/:id" element={<ProtectedLayout><DashboardBuilder /></ProtectedLayout>} />,
  ];
}
