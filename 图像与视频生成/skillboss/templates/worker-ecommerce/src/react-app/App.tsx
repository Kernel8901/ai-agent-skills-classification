import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import ProductsPage from "./pages/ProductsPage";
import LoginPage from "./pages/LoginPage";
import AuthCallbackPage from "./pages/AuthCallbackPage";
import CheckoutSuccessPage from "./pages/CheckoutSuccessPage";
import CheckoutCancelPage from "./pages/CheckoutCancelPage";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* OAuth callback - MUST be outside Layout, handles popup flow */}
        <Route path="/auth/callback" element={<AuthCallbackPage />} />

        {/* Login page - public, outside main layout */}
        <Route path="/login" element={<LoginPage />} />

        {/* Main app routes with Layout */}
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="checkout/success" element={<CheckoutSuccessPage />} />
          <Route path="checkout/cancel" element={<CheckoutCancelPage />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
