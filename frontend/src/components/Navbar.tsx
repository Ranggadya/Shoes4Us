import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ShoppingCart,
  Package,
  User,
  LogOut,
  LogIn,
  UserCircle,
  Heart,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { megaMenuSections } from "@/constants/navigation";
import GlobalSearch from "./GlobalSearch";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user, isAdmin, logout } = useAuth();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleLogout = async () => {
    setIsOpen(false);
    setMobileMenuOpen(false);
    try {
      await logout();
      toast.success("Berhasil logout!");
      navigate("/");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Gagal logout. Silakan coba lagi."
      );
    }
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between gap-6">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 flex-shrink-0">
            <img
              src="/logo.jpg"
              alt="Logo"
              className="w-12 h-12 rounded-md object-cover"
            />
            <h1 className="text-xl font-bold text-black hidden lg:block">
              Shoes Commerce
            </h1>
          </Link>

          {/* Global Search - Always visible */}
          <div className="hidden md:block flex-1 max-w-2xl">
            <GlobalSearch />
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Open menu"
          >
            <Menu size={24} />
          </button>

          {/* Navigation Links */}
          <div className="hidden lg:flex items-center space-x-6 text-black">
            {!isAdmin && (
              <Link
                to="/cart"
                className="flex items-center space-x-1 hover:text-blue-600 transition"
              >
                <ShoppingCart size={18} />
                <span>Keranjang</span>
              </Link>
            )}

            {user && !isAdmin && (
              <Link
                to="/wishlist"
                className="flex items-center space-x-1 hover:text-red-600 transition"
              >
                <Heart size={18} />
                <span>Wishlist</span>
              </Link>
            )}

            {isAdmin && (
              <Link
                to="/admin/dashboard"
                className="flex items-center space-x-1 px-3 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition"
              >
                <Package size={18} />
                <span>Dashboard Admin</span>
              </Link>
            )}

            {/* Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition text-black flex items-center space-x-2"
              >
                <User size={18} />
                <span className="hidden xl:inline">Profile</span>
              </button>

              {isOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border rounded-lg shadow-lg text-black z-50">
                  {user ? (
                    <>
                      <Link
                        to="/profile"
                        className="flex items-center px-4 py-2 hover:bg-gray-100 space-x-2"
                        onClick={() => setIsOpen(false)}
                      >
                        <UserCircle size={18} />
                        <span>Profile</span>
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full text-left px-4 py-2 hover:bg-gray-100 space-x-2"
                      >
                        <LogOut size={18} />
                        <span>Logout</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        to="/login"
                        className="flex items-center px-4 py-2 hover:bg-gray-100 space-x-2"
                        onClick={() => setIsOpen(false)}
                      >
                        <LogIn size={18} />
                        <span>Login</span>
                      </Link>
                      <Link
                        to="/register"
                        className="flex items-center px-4 py-2 hover:bg-gray-100 space-x-2"
                        onClick={() => setIsOpen(false)}
                      >
                        <UserCircle size={18} />
                        <span>Register</span>
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden mt-4">
          <GlobalSearch />
        </div>
      </div>

      {!isAdmin && (
        <div className="hidden lg:block border-t border-gray-100 bg-white">
          <div className="mx-auto max-w-[1440px] px-8">
            <div className="flex h-12 items-center justify-center gap-12 xl:gap-16">
              {megaMenuSections.map((section) => (
                <div key={section.label} className="group h-full">
                  <Link
                    to={section.href}
                    className={`relative inline-flex h-full items-center text-[15px] font-extrabold uppercase tracking-normal transition ${
                      section.accent
                        ? "text-red-600 hover:text-red-700"
                        : "text-black hover:text-gray-700"
                    }`}
                  >
                    {section.label}
                    <span
                      className="absolute bottom-0 left-0 right-0 h-[3px] bg-black opacity-0 transition-opacity group-hover:opacity-100"
                    />
                  </Link>

                  <div className="invisible absolute left-0 right-0 top-full z-40 border-y border-gray-100 bg-white opacity-0 shadow-[0_18px_30px_rgba(15,23,42,0.06)] transition group-hover:visible group-hover:opacity-100">
                    <div className="mx-auto max-w-[1440px] px-8 py-8">
                      <div className="grid min-h-[270px] grid-cols-4 gap-x-20">
                        {section.columns.map((column) => (
                          <div key={column.title}>
                            <h3 className="mb-6 text-[16px] font-extrabold uppercase text-black">
                              {column.title}
                            </h3>
                            <div className="space-y-4">
                              {column.links.map((item) => (
                                <Link
                                  key={`${column.title}-${item.label}`}
                                  to={item.href}
                                  className="block text-[19px] leading-5 text-gray-600 transition hover:text-black"
                                >
                                  {item.label}
                                </Link>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={closeMobileMenu}
          />

          <div className="fixed top-0 right-0 w-80 max-w-full h-full bg-white shadow-2xl z-50 lg:hidden overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Menu</h2>
              <button
                onClick={closeMobileMenu}
                className="p-2 hover:bg-gray-100 rounded-lg transition min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Close menu"
              >
                <X size={24} />
              </button>
            </div>

            <div className="py-4">
              <Link
                to="/"
                className="flex items-center gap-3 px-6 py-3 hover:bg-gray-50 transition text-gray-900 min-h-[44px]"
                onClick={closeMobileMenu}
              >
                <Package size={20} />
                <span className="font-medium">Home</span>
              </Link>

              {!isAdmin && (
                <>
                  <div className="px-6 pt-4 pb-2 text-xs font-bold uppercase tracking-wide text-gray-400">
                    Belanja
                  </div>

                  {megaMenuSections.map((section) => (
                    <details key={section.label} className="group">
                      <summary
                        className={`flex cursor-pointer list-none items-center justify-between gap-3 px-6 py-3 hover:bg-gray-50 transition min-h-[44px] ${
                          section.accent ? "text-red-600" : "text-gray-900"
                        }`}
                      >
                        <span className="font-semibold uppercase text-sm">
                          {section.label}
                        </span>
                        <span className="text-lg leading-none group-open:rotate-45 transition">
                          +
                        </span>
                      </summary>
                      <div className="bg-gray-50 px-6 py-3">
                        <Link
                          to={section.href}
                          onClick={closeMobileMenu}
                          className="block text-sm font-semibold text-gray-900 mb-3"
                        >
                          Lihat Semua {section.label}
                        </Link>
                        <div className="grid grid-cols-2 gap-x-5 gap-y-3">
                          {section.columns.slice(0, 2).map((column) => (
                            <div key={column.title}>
                              <p className="text-xs font-bold text-gray-900 mb-2">
                                {column.title}
                              </p>
                              <div className="space-y-2">
                                {column.links.slice(0, 4).map((item) => (
                                  <Link
                                    key={`${section.label}-${item.label}`}
                                    to={item.href}
                                    onClick={closeMobileMenu}
                                    className="block text-sm text-gray-600"
                                  >
                                    {item.label}
                                  </Link>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </details>
                  ))}

                  <Link
                    to="/cart"
                    className="flex items-center gap-3 px-6 py-3 hover:bg-gray-50 transition text-gray-900 min-h-[44px]"
                    onClick={closeMobileMenu}
                  >
                    <ShoppingCart size={20} />
                    <span className="font-medium">Keranjang</span>
                  </Link>

                  <Link
                    to="/wishlist"
                    className="flex items-center gap-3 px-6 py-3 hover:bg-gray-50 transition text-gray-900 min-h-[44px]"
                    onClick={closeMobileMenu}
                  >
                    <Heart size={20} />
                    <span className="font-medium">Wishlist</span>
                  </Link>
                </>
              )}

              {isAdmin && (
                <Link
                  to="/admin/dashboard"
                  className="flex items-center gap-3 px-6 py-3 bg-gray-900 text-white hover:bg-gray-800 transition min-h-[44px] mx-4 rounded-lg"
                  onClick={closeMobileMenu}
                >
                  <Package size={20} />
                  <span className="font-medium">Dashboard Admin</span>
                </Link>
              )}
            </div>

            <div className="border-t pt-4">
              {user ? (
                <>
                  <div className="px-6 py-3 bg-gray-50">
                    <p className="text-sm text-gray-600">Logged in as</p>
                    <p className="font-semibold text-gray-900">{user.email}</p>
                  </div>

                  <Link
                    to="/profile"
                    className="flex items-center gap-3 px-6 py-3 hover:bg-gray-50 transition text-gray-900 min-h-[44px]"
                    onClick={closeMobileMenu}
                  >
                    <UserCircle size={20} />
                    <span className="font-medium">Profile</span>
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-6 py-3 hover:bg-gray-50 transition text-red-600 min-h-[44px]"
                  >
                    <LogOut size={20} />
                    <span className="font-medium">Logout</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="flex items-center gap-3 px-6 py-3 hover:bg-gray-50 transition text-gray-900 min-h-[44px]"
                    onClick={closeMobileMenu}
                  >
                    <LogIn size={20} />
                    <span className="font-medium">Login</span>
                  </Link>

                  <Link
                    to="/register"
                    className="flex items-center gap-3 px-6 py-3 hover:bg-gray-50 transition text-gray-900 min-h-[44px]"
                    onClick={closeMobileMenu}
                  >
                    <UserCircle size={20} />
                    <span className="font-medium">Register</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </nav>
  );
}
