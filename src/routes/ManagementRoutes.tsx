import { Route } from "react-router-dom";
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
    <Route key="products" path="/products" element={<Products />} />,
    <Route key="products-new" path="/products/new" element={<ProductForm />} />,
    <Route key="products-id" path="/products/:id" element={<ProductDetail />} />,
    <Route key="products-edit" path="/products/:id/edit" element={<ProductForm />} />,
    <Route key="territories" path="/territories" element={<Territories />} />,
    <Route key="cadences" path="/cadences" element={<Cadences />} />,
    <Route key="forecast" path="/forecast" element={<Forecast />} />,

    // Block 8 — Dashboard Builder
    <Route key="dashboards" path="/dashboards" element={<Dashboards />} />,
    <Route key="dashboards-new" path="/dashboards/new" element={<DashboardBuilder />} />,
    <Route key="dashboards-edit" path="/dashboards/:id" element={<DashboardBuilder />} />,
  ];
}
