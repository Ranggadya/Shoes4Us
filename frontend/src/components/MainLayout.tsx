import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import AuthNavbar from "./AuthNavbar";
import ErrorBoundary from "./ErrorBoundary";

export default function MainLayout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const isAdminPage = pathname.startsWith("/admin");
  const isAuthPage =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password" ||
    pathname.startsWith("/reset-password");

  return (
    <div className="flex flex-col min-h-screen">
      {!isAdminPage && !isAuthPage && <Navbar />}
      {isAuthPage && <AuthNavbar />}
      <main className="flex-grow">
        <ErrorBoundary resetKey={pathname}>{children}</ErrorBoundary>
      </main>
      {!isAdminPage && !isAuthPage && <Footer />}
    </div>
  );
}
