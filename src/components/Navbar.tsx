"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  ShoppingCart,
  Package,
  ShoppingBag,
  User,
  LogOut,
  LogIn,
  UserCircle,
  Heart,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "./AuthProvider";
import GlobalSearch from "./GlobalSearch";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAdmin, logout } = useAuth();

  // Close dropdown when clicking outside
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
      router.push("/");
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
          <Link href="/" className="flex items-center space-x-2 flex-shrink-0">
            <Image
              src="/logo.jpg"
              alt="Logo"
              width={64}
              height={64}
              className="rounded-md object-cover"
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
            <Link href="/" className="hover:text-blue-600 transition">
              Home
            </Link>

            {!isAdmin && (
              <>
                <Link
                  href="/product"
                  className="flex items-center space-x-1 hover:text-blue-600 transition"
                >
                  <ShoppingBag size={18} />
                  <span>Produk</span>
                </Link>

                {pathname !== "/cart" ? (
                  <Link
                    href="/cart"
                    className="flex items-center space-x-1 hover:text-blue-600 transition"
                  >
                    <ShoppingCart size={18} />
                    <span>Keranjang</span>
                  </Link>
                ) : (
                  <div className="flex items-center space-x-1 text-blue-600 cursor-default">
                    <ShoppingCart size={18} />
                    <span>Keranjang</span>
                  </div>
                )}

              </>
            )}

            {user && !isAdmin && (
              <>
                <Link
                  href="/wishlist"
                  className="flex items-center space-x-1 hover:text-red-600 transition"
                >
                  <Heart size={18} />
                  <span>Wishlist</span>
                </Link>

                <Link
                  href="/status-pesanan"
                  className="flex items-center space-x-1 hover:text-blue-600 transition"
                >
                  <Package size={18} />
                  <span>Status</span>
                </Link>
              </>
            )}

            {isAdmin && (
              <Link
                href="/admin/dashboard"
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
                        href="/profile"
                        className="flex items-center px-4 py-2 hover:bg-gray-100 space-x-2"
                        onClick={() => setIsOpen(false)}
                      >
                        <UserCircle size={18} />
                        <span>Data Pengguna</span>
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
                        href="/login"
                        className="flex items-center px-4 py-2 hover:bg-gray-100 space-x-2"
                        onClick={() => setIsOpen(false)}
                      >
                        <LogIn size={18} />
                        <span>Login</span>
                      </Link>
                      <Link
                        href="/profile"
                        className="flex items-center px-4 py-2 hover:bg-gray-100 space-x-2"
                        onClick={() => setIsOpen(false)}
                      >
                        <UserCircle size={18} />
                        <span>Lihat Profile</span>
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

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={closeMobileMenu}
          />

          {/* Drawer */}
          <div className="fixed top-0 right-0 w-80 max-w-full h-full bg-white shadow-2xl z-50 lg:hidden overflow-y-auto">
            {/* Header */}
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

            {/* Navigation Links */}
            <div className="py-4">
              <Link
                href="/"
                className="flex items-center gap-3 px-6 py-3 hover:bg-gray-50 transition text-gray-900 min-h-[44px]"
                onClick={closeMobileMenu}
              >
                <ShoppingBag size={20} />
                <span className="font-medium">Home</span>
              </Link>

              {!isAdmin && (
                <>
                  <Link
                    href="/product"
                    className="flex items-center gap-3 px-6 py-3 hover:bg-gray-50 transition text-gray-900 min-h-[44px]"
                    onClick={closeMobileMenu}
                  >
                    <ShoppingBag size={20} />
                    <span className="font-medium">Produk</span>
                  </Link>

                  <Link
                    href="/cart"
                    className="flex items-center gap-3 px-6 py-3 hover:bg-gray-50 transition text-gray-900 min-h-[44px]"
                    onClick={closeMobileMenu}
                  >
                    <ShoppingCart size={20} />
                    <span className="font-medium">Keranjang</span>
                  </Link>
                </>
              )}

              {user && !isAdmin && (
                <>
                  <Link
                    href="/wishlist"
                    className="flex items-center gap-3 px-6 py-3 hover:bg-gray-50 transition text-gray-900 min-h-[44px]"
                    onClick={closeMobileMenu}
                  >
                    <Heart size={20} />
                    <span className="font-medium">Wishlist</span>
                  </Link>

                  <Link
                    href="/status-pesanan"
                    className="flex items-center gap-3 px-6 py-3 hover:bg-gray-50 transition text-gray-900 min-h-[44px]"
                    onClick={closeMobileMenu}
                  >
                    <Package size={20} />
                    <span className="font-medium">Status Pesanan</span>
                  </Link>
                </>
              )}

              {isAdmin && (
                <Link
                  href="/admin/dashboard"
                  className="flex items-center gap-3 px-6 py-3 bg-gray-900 text-white hover:bg-gray-800 transition min-h-[44px] mx-4 rounded-lg"
                  onClick={closeMobileMenu}
                >
                  <Package size={20} />
                  <span className="font-medium">Dashboard Admin</span>
                </Link>
              )}
            </div>

            {/* Profile Section */}
            <div className="border-t pt-4">
              {user ? (
                <>
                  <div className="px-6 py-3 bg-gray-50">
                    <p className="text-sm text-gray-600">Logged in as</p>
                    <p className="font-semibold text-gray-900">{user.email}</p>
                  </div>

                  <Link
                    href="/profile"
                    className="flex items-center gap-3 px-6 py-3 hover:bg-gray-50 transition text-gray-900 min-h-[44px]"
                    onClick={closeMobileMenu}
                  >
                    <UserCircle size={20} />
                    <span className="font-medium">Data Pengguna</span>
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
                    href="/login"
                    className="flex items-center gap-3 px-6 py-3 hover:bg-gray-50 transition text-gray-900 min-h-[44px]"
                    onClick={closeMobileMenu}
                  >
                    <LogIn size={20} />
                    <span className="font-medium">Login</span>
                  </Link>

                  <Link
                    href="/register"
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
