import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  LayoutGrid,
  Package,
  CreditCard,
  Users,
  BarChart3,
  PlusCircle,
  LogOut,
  Store,
  ChevronDown,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useDialogFocusTrap } from "@/hooks/useDialogFocusTrap";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);
  const openMenuBtnRef = useRef<HTMLButtonElement>(null);
  const closeMenuBtnRef = useRef<HTMLButtonElement>(null);

  const searchParams = new URLSearchParams(location.search);
  const currentTab = searchParams.get("tab") || "overview";

  useEffect(() => {
    const mediaQuery =
      typeof window.matchMedia === "function"
        ? window.matchMedia("(max-width: 1023px)")
        : null;
    if (!mediaQuery) return;
    const syncViewport = () => setIsMobileViewport(mediaQuery.matches);
    syncViewport();
    mediaQuery.addEventListener?.("change", syncViewport);
    return () => mediaQuery.removeEventListener?.("change", syncViewport);
  }, []);

  const closeMobileSidebar = useCallback(() => {
    setMobileSidebarOpen(false);
  }, []);

  useDialogFocusTrap({
    isOpen: mobileSidebarOpen && isMobileViewport,
    onClose: closeMobileSidebar,
    containerRef: sidebarRef,
    initialFocusRef: closeMenuBtnRef,
    restoreFocusRef: openMenuBtnRef,
  });

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
      toast.success("Berhasil logout!");
      navigate("/login", { replace: true });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Gagal logout. Silakan coba lagi."
      );
      setLoggingOut(false);
    }
  };

  const navItems = [
    {
      label: "Dashboard",
      href: "/admin/dashboard",
      icon: LayoutGrid,
      isActive:
        location.pathname === "/admin/dashboard" && currentTab === "overview",
    },
    {
      label: "Products",
      href: "/admin/product",
      icon: Package,
      isActive: location.pathname === "/admin/product",
    },
    {
      label: "Purchases",
      href: "/admin/dashboard?tab=orders",
      icon: CreditCard,
      isActive:
        location.pathname === "/admin/dashboard" && currentTab === "orders",
    },
    {
      label: "Customers",
      href: "/admin/dashboard?tab=customers",
      icon: Users,
      isActive:
        location.pathname === "/admin/dashboard" && currentTab === "customers",
    },
    {
      label: "Analytics",
      href: "/admin/dashboard?tab=analytics",
      icon: BarChart3,
      isActive:
        location.pathname === "/admin/dashboard" && currentTab === "analytics",
    },
    {
      label: "Add Product",
      href: "/admin/product/add",
      icon: PlusCircle,
      isActive: location.pathname === "/admin/product/add",
    },
  ];

  const initials = (user?.name || "Admin")
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen flex bg-[#F4F6F8] text-[#111827] antialiased selection:bg-black selection:text-white">
      {/* Mobile Header Bar */}
      <div className="lg:hidden fixed top-0 inset-x-0 h-16 bg-white border-b border-gray-100 z-30 px-4 flex items-center justify-between">
        <Link to="/admin/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-white shadow-sm">
            <svg
              aria-hidden="true"
              className="w-4 h-4 fill-current"
              viewBox="0 0 24 24"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14.5c0 .83-.67 1.5-1.5 1.5S10 17.33 10 16.5V11c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v5.5zm3.5-3.5c0 .83-.67 1.5-1.5 1.5s-1.5-.67-1.5-1.5V8.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v4z" />
            </svg>
          </div>
          <span className="text-lg font-bold tracking-tight text-gray-900">
            Shoes4Us
          </span>
        </Link>
        <button
          ref={openMenuBtnRef}
          type="button"
          onClick={() => setMobileSidebarOpen(true)}
          className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center p-2 rounded-xl text-gray-700 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950"
          aria-label="Open navigation"
          aria-expanded={mobileSidebarOpen}
          aria-controls="admin-sidebar-nav"
        >
          <Menu className="w-6 h-6" aria-hidden="true" />
        </button>
      </div>

      {/* Mobile Overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Left Sidebar Navigation */}
      <aside
        id="admin-sidebar-nav"
        ref={sidebarRef}
        role={mobileSidebarOpen && isMobileViewport ? "dialog" : undefined}
        aria-modal={mobileSidebarOpen && isMobileViewport ? "true" : undefined}
        aria-label={mobileSidebarOpen && isMobileViewport ? "Menu navigasi admin" : undefined}
        className={`w-64 bg-white border-r border-gray-100 flex-col justify-between shrink-0 fixed inset-y-0 left-0 z-50 transition-transform duration-300 ${
          mobileSidebarOpen
            ? "flex translate-x-0"
            : "hidden lg:flex -translate-x-full lg:translate-x-0"
        }`}
        data-purpose="sidebar-navigation"
      >
        <div className="p-6 overflow-y-auto">
          {/* Brand Logo */}
          <div className="flex items-center justify-between px-2 mb-8">
            <Link
              to="/admin/dashboard"
              className="flex items-center gap-3"
              onClick={() => setMobileSidebarOpen(false)}
            >
              <div className="w-9 h-9 rounded-full bg-black flex items-center justify-center text-white shadow-sm">
                <svg
                  aria-hidden="true"
                  className="w-5 h-5 fill-current"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14.5c0 .83-.67 1.5-1.5 1.5S10 17.33 10 16.5V11c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v5.5zm3.5-3.5c0 .83-.67 1.5-1.5 1.5s-1.5-.67-1.5-1.5V8.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v4z" />
                </svg>
              </div>
              <span className="text-xl font-bold tracking-tight text-gray-900">
                Shoes4Us
              </span>
            </Link>
            <button
              ref={closeMenuBtnRef}
              type="button"
              onClick={() => setMobileSidebarOpen(false)}
              className="lg:hidden min-h-[44px] min-w-[44px] inline-flex items-center justify-center p-1.5 rounded-lg text-gray-500 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950"
              aria-label="Close navigation"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav aria-label="Main Navigation" className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  to={item.href}
                  onClick={() => setMobileSidebarOpen(false)}
                  aria-current={item.isActive ? "page" : undefined}
                  className={`flex items-center gap-3 px-3.5 py-3 rounded-xl font-medium text-sm transition-all min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 ${
                    item.isActive
                      ? "bg-gray-950 text-white shadow-sm"
                      : "text-gray-600 hover:text-gray-950 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="w-5 h-5" aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Bottom Profile Footer */}
        <div className="p-4 border-t border-gray-100 bg-white space-y-2">
          <button
            type="button"
            onClick={() => setProfileMenuOpen((prev) => !prev)}
            aria-expanded={profileMenuOpen}
            aria-controls="admin-profile-actions"
            className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 transition-colors text-left min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950"
          >
            <span className="flex items-center gap-3 overflow-hidden">
              <span
                aria-hidden="true"
                className="w-10 h-10 rounded-full bg-gray-950 text-white flex items-center justify-center font-bold text-xs shrink-0 ring-2 ring-gray-100"
              >
                {initials}
              </span>
              <span className="truncate block">
                <span className="text-sm font-semibold text-gray-900 leading-tight truncate block">
                  {user?.name || "Administrator"}
                </span>
                <span className="text-xs text-gray-500 font-medium block truncate">
                  {user?.email || "Administrator"}
                </span>
              </span>
            </span>
            <ChevronDown
              aria-hidden="true"
              className={`w-4 h-4 shrink-0 text-gray-500 transition-transform ${
                profileMenuOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {profileMenuOpen && (
            <div id="admin-profile-actions" className="pt-1 space-y-1">
              <button
                type="button"
                onClick={() => navigate("/")}
                className="w-full flex items-center gap-2.5 px-3 py-2 min-h-[44px] rounded-xl text-xs font-medium text-gray-700 hover:text-gray-950 hover:bg-gray-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950"
              >
                <Store className="w-4 h-4 text-gray-500" aria-hidden="true" />
                <span>Lihat Etalase Toko</span>
              </button>
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="w-full flex items-center gap-2.5 px-3 py-2 min-h-[44px] rounded-xl text-xs font-semibold text-rose-700 hover:bg-rose-50 transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-700"
              >
                <LogOut className="w-4 h-4" aria-hidden="true" />
                <span>{loggingOut ? "Keluar..." : "Logout"}</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 lg:ml-64 pt-20 lg:pt-8 p-4 sm:p-8 overflow-y-auto min-h-screen">
        <div className="max-w-[1400px] mx-auto space-y-6">{children}</div>
      </main>
    </div>
  );
}

