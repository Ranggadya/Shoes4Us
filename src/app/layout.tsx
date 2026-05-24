import "./globals.css";
import "react-loading-skeleton/dist/skeleton.css";
import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/components/AuthProvider";
import { CartProvider } from "@/components/CartContext"; 
import { WishlistProvider } from "@/components/WishlistContext";
import ErrorBoundaryWrapper from "@/components/ErrorBoundary";
import MainLayout from "@/components/MainLayout";

export const metadata: Metadata = {
  title: "Shoes4Us",
  description: "E-commerce sepatu stylish",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="flex flex-col min-h-screen">
        <ErrorBoundaryWrapper>
          <AuthProvider>
            <WishlistProvider>
              <CartProvider>
                <Toaster 
                  position="top-right"
                  toastOptions={{
                    duration: 3000,
                    style: {
                      background: '#363636',
                      color: '#fff',
                    },
                    success: {
                      duration: 3000,
                      iconTheme: {
                        primary: '#10b981',
                        secondary: '#fff',
                      },
                    },
                    error: {
                      duration: 4000,
                      iconTheme: {
                        primary: '#ef4444',
                        secondary: '#fff',
                      },
                    },
                  }}
                />
                <MainLayout>{children}</MainLayout>
              </CartProvider>
            </WishlistProvider>
          </AuthProvider>
        </ErrorBoundaryWrapper>
      </body>
    </html>
  );
}
