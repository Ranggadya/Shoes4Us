import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import MainLayout from "@/components/MainLayout";
import ErrorBoundary from "@/components/ErrorBoundary";
import LoadingSpinner from "@/components/LoadingSpinner";

const HomePage = lazy(() => import("@/pages/HomePage"));
const ProductListPage = lazy(() => import("@/pages/ProductListPage"));
const ProductDetailPage = lazy(() => import("@/pages/ProductDetailPage"));
const CartPage = lazy(() => import("@/pages/CartPage"));
const WishlistPage = lazy(() => import("@/pages/WishlistPage"));
const PaymentPage = lazy(() => import("@/pages/PaymentPage"));
const OrderStatusPage = lazy(() => import("@/pages/OrderStatusPage"));
const OrderHistoryPage = lazy(() => import("@/pages/OrderHistoryPage"));
const LoginPage = lazy(() => import("@/pages/LoginPage"));
const RegisterPage = lazy(() => import("@/pages/RegisterPage"));
const ForgotPasswordPage = lazy(() => import("@/pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("@/pages/ResetPasswordPage"));
const ProfilePage = lazy(() => import("@/pages/ProfilePage"));
const AdminDashboard = lazy(() => import("@/components/AdminDashboard"));
const AdminProductPage = lazy(() => import("@/pages/AdminProductPage"));
const AdminAddProductPage = lazy(() => import("@/pages/AdminAddProductPage"));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"));

function PageLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <LoadingSpinner size="lg" text="Memuat halaman..." />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <WishlistProvider>
            <CartProvider>
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 3000,
                  style: {
                    background: "#363636",
                    color: "#fff",
                  },
                  success: {
                    duration: 3000,
                    iconTheme: {
                      primary: "#10b981",
                      secondary: "#fff",
                    },
                  },
                  error: {
                    duration: 4000,
                    iconTheme: {
                      primary: "#ef4444",
                      secondary: "#fff",
                    },
                  },
                }}
              />
              <MainLayout>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/product" element={<ProductListPage />} />
                    <Route path="/product/:id" element={<ProductDetailPage />} />
                    <Route path="/cart" element={<CartPage />} />
                    <Route path="/wishlist" element={<WishlistPage />} />
                    <Route path="/checkout" element={<PaymentPage />} />
                    <Route path="/payment" element={<PaymentPage />} />
                    <Route path="/status-pesanan" element={<OrderStatusPage />} />
                    <Route path="/order" element={<OrderHistoryPage />} />
                    <Route path="/orders" element={<Navigate to="/order" replace />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                    <Route path="/reset-password" element={<ResetPasswordPage />} />
                    <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/admin/dashboard" element={<AdminDashboard />} />
                    <Route path="/admin/product" element={<AdminProductPage />} />
                    <Route path="/admin/product/add" element={<AdminAddProductPage />} />
                    <Route path="*" element={<NotFoundPage />} />
                  </Routes>
                </Suspense>
              </MainLayout>
            </CartProvider>
          </WishlistProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
