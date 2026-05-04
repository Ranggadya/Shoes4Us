"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import Footer from "./Footer";
import AuthNavbar from "./AuthNavbar";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminPage = pathname?.startsWith("/admin");
  const isAuthPage = pathname === "/login" || pathname === "/register";

  return (
    <>
      {!isAdminPage && !isAuthPage && <Navbar />}
      {isAuthPage && <AuthNavbar />}
      <main className={`flex-grow ${!isAdminPage && !isAuthPage ? "p-6" : ""}`}>
        {children}
      </main>
      {!isAdminPage && <Footer />}
    </>
  );
}
