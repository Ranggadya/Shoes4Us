"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
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
import { useAuth } from "./AuthProvider";
import GlobalSearch from "./GlobalSearch";

type MegaMenuColumn = {
  title: string;
  links: Array<{ label: string; href: string }>;
};

type MegaMenuSection = {
  label: string;
  href: string;
  accent?: boolean;
  columns: MegaMenuColumn[];
};

const megaMenuSections: MegaMenuSection[] = [
  {
    label: "New Arrivals",
    href: "/product?collection=new-arrivals",
    columns: [
      {
        title: "Sepatu",
        links: [
          { label: "Semua New Arrivals", href: "/product?collection=new-arrivals" },
          { label: "Sepatu Baru", href: "/product?collection=new-arrivals&segment=SHOES" },
          { label: "Olahraga Baru", href: "/product?collection=new-arrivals&category=sport" },
          { label: "Casual Baru", href: "/product?collection=new-arrivals&category=casual" },
          { label: "Running Baru", href: "/product?collection=new-arrivals&category=running" },
          { label: "Lifestyle Baru", href: "/product?collection=new-arrivals&category=sneakers" },
        ],
      },
      {
        title: "Pakaian",
        links: [
          { label: "Semua Pakaian Baru", href: "/product?collection=new-arrivals&segment=APPAREL" },
          { label: "Kaos", href: "/product?collection=new-arrivals&segment=APPAREL&search=kaos" },
          { label: "Hoodie", href: "/product?collection=new-arrivals&segment=APPAREL&search=hoodie" },
          { label: "Jaket", href: "/product?collection=new-arrivals&segment=APPAREL&search=jaket" },
          { label: "Celana", href: "/product?collection=new-arrivals&segment=APPAREL&search=celana" },
        ],
      },
      {
        title: "Aksesoris",
        links: [
          { label: "Semua Aksesoris Baru", href: "/product?collection=new-arrivals&segment=ACCESSORIES" },
          { label: "Topi", href: "/product?collection=new-arrivals&segment=ACCESSORIES&search=topi" },
          { label: "Tas", href: "/product?collection=new-arrivals&segment=ACCESSORIES&search=tas" },
          { label: "Kaos Kaki", href: "/product?collection=new-arrivals&segment=ACCESSORIES&search=kaos%20kaki" },
          { label: "Perawatan Sepatu", href: "/product?collection=new-arrivals&segment=ACCESSORIES&search=perawatan%20sepatu" },
        ],
      },
      {
        title: "Icons",
        links: [
          { label: "Nike", href: "/product?brand=Nike" },
          { label: "Adidas", href: "/product?brand=Adidas" },
          { label: "New Balance", href: "/product?brand=New%20Balance" },
          { label: "Puma", href: "/product?brand=Puma" },
          { label: "Best Seller", href: "/product?collection=new-arrivals" },
          { label: "Rilis Minggu Ini", href: "/product?collection=new-arrivals" },
        ],
      },
    ],
  },
  {
    label: "Eksklusif",
    href: "/product?collection=exclusive",
    columns: [
      {
        title: "Sepatu",
        links: [
          { label: "Semua Eksklusif", href: "/product?collection=exclusive" },
          { label: "Limited Edition", href: "/product?collection=exclusive&search=limited" },
          { label: "Premium Picks", href: "/product?collection=exclusive&search=premium" },
          { label: "Online Only", href: "/product?collection=exclusive" },
          { label: "Sneakers Eksklusif", href: "/product?collection=exclusive&category=sneakers" },
          { label: "Sport Eksklusif", href: "/product?collection=exclusive&category=sport" },
        ],
      },
      {
        title: "Pakaian",
        links: [
          { label: "Semua Pakaian Eksklusif", href: "/product?collection=exclusive&segment=APPAREL" },
          { label: "Kaos Eksklusif", href: "/product?collection=exclusive&segment=APPAREL&search=kaos" },
          { label: "Hoodie Eksklusif", href: "/product?collection=exclusive&segment=APPAREL&search=hoodie" },
          { label: "Jaket Eksklusif", href: "/product?collection=exclusive&segment=APPAREL&search=jaket" },
        ],
      },
      {
        title: "Aksesoris",
        links: [
          { label: "Semua Aksesoris Eksklusif", href: "/product?collection=exclusive&segment=ACCESSORIES" },
          { label: "Topi", href: "/product?collection=exclusive&segment=ACCESSORIES&search=topi" },
          { label: "Tas", href: "/product?collection=exclusive&segment=ACCESSORIES&search=tas" },
          { label: "Kaos Kaki", href: "/product?collection=exclusive&segment=ACCESSORIES&search=kaos%20kaki" },
        ],
      },
      {
        title: "Icons",
        links: [
          { label: "Nike Air Max", href: "/product?search=Nike%20Air%20Max" },
          { label: "Adidas Samba", href: "/product?search=Adidas%20Samba" },
          { label: "Vans Classic", href: "/product?search=Vans%20Classic" },
          { label: "New Balance 530", href: "/product?search=New%20Balance%20530" },
          { label: "Puma Palermo", href: "/product?search=Puma%20Palermo" },
        ],
      },
    ],
  },
  {
    label: "Pria",
    href: "/product?audience=MEN",
    columns: [
      {
        title: "Sepatu",
        links: [
          { label: "Semua Koleksi Pria", href: "/product?audience=MEN&segment=SHOES" },
          { label: "Lari", href: "/product?audience=MEN&category=running" },
          { label: "Bola Basket", href: "/product?audience=MEN&category=sport&search=basket" },
          { label: "Kasual", href: "/product?audience=MEN&category=casual" },
          { label: "Sandal & Fit Flop", href: "/product?audience=MEN&search=sandal" },
          { label: "All Black shoes", href: "/product?audience=MEN&search=black" },
          { label: "All White shoes", href: "/product?audience=MEN&search=white" },
        ],
      },
      {
        title: "Pakaian",
        links: [
          { label: "Semua Koleksi Pria", href: "/product?audience=MEN&segment=APPAREL" },
          { label: "Kaos", href: "/product?audience=MEN&segment=APPAREL&search=kaos" },
          { label: "Celana Pendek", href: "/product?audience=MEN&segment=APPAREL&search=celana%20pendek" },
          { label: "Celana Panjang", href: "/product?audience=MEN&segment=APPAREL&search=celana%20panjang" },
          { label: "Hoodie", href: "/product?audience=MEN&segment=APPAREL&search=hoodie" },
          { label: "Jaket", href: "/product?audience=MEN&segment=APPAREL&search=jaket" },
        ],
      },
      {
        title: "Aksesoris",
        links: [
          { label: "Semua Koleksi Pria", href: "/product?audience=MEN&segment=ACCESSORIES" },
          { label: "Topi", href: "/product?audience=MEN&segment=ACCESSORIES&search=topi" },
          { label: "Tas", href: "/product?audience=MEN&segment=ACCESSORIES&search=tas" },
          { label: "Kaos Kaki", href: "/product?audience=MEN&segment=ACCESSORIES&search=kaos%20kaki" },
          { label: "Perawatan Sepatu", href: "/product?audience=MEN&segment=ACCESSORIES&search=perawatan%20sepatu" },
          { label: "Alat Olahraga", href: "/product?audience=MEN&segment=ACCESSORIES&search=alat%20olahraga" },
          { label: "Crocs Jibbitz", href: "/product?audience=MEN&segment=ACCESSORIES&search=jibbitz" },
        ],
      },
      {
        title: "Icons",
        links: [
          { label: "Nike Air Max", href: "/product?search=Nike%20Air%20Max" },
          { label: "New Balance 530", href: "/product?search=New%20Balance%20530" },
          { label: "adidas Adilette", href: "/product?search=adidas%20Adilette" },
          { label: "Asics GT-2160", href: "/product?search=Asics%20GT-2160" },
          { label: "Vans Classic", href: "/product?search=Vans%20Classic" },
          { label: "Adidas Evo SL", href: "/product?search=Adidas%20Evo%20SL" },
        ],
      },
    ],
  },
  {
    label: "Wanita",
    href: "/product?audience=WOMEN",
    columns: [
      {
        title: "Sepatu",
        links: [
          { label: "Semua Koleksi Wanita", href: "/product?audience=WOMEN&segment=SHOES" },
          { label: "Sneakers", href: "/product?audience=WOMEN&category=sneakers" },
          { label: "Running", href: "/product?audience=WOMEN&category=running" },
          { label: "Casual", href: "/product?audience=WOMEN&category=casual" },
          { label: "Sandal", href: "/product?audience=WOMEN&search=sandal" },
        ],
      },
      {
        title: "Pakaian",
        links: [
          { label: "Kaos", href: "/product?audience=WOMEN&segment=APPAREL&search=kaos" },
          { label: "Hoodie", href: "/product?audience=WOMEN&segment=APPAREL&search=hoodie" },
          { label: "Jaket", href: "/product?audience=WOMEN&segment=APPAREL&search=jaket" },
          { label: "Legging", href: "/product?audience=WOMEN&segment=APPAREL&search=legging" },
        ],
      },
      {
        title: "Aksesoris",
        links: [
          { label: "Tas", href: "/product?audience=WOMEN&segment=ACCESSORIES&search=tas" },
          { label: "Topi", href: "/product?audience=WOMEN&segment=ACCESSORIES&search=topi" },
          { label: "Kaos Kaki", href: "/product?audience=WOMEN&segment=ACCESSORIES&search=kaos%20kaki" },
          { label: "Perawatan Sepatu", href: "/product?audience=WOMEN&segment=ACCESSORIES&search=perawatan%20sepatu" },
        ],
      },
      {
        title: "Icons",
        links: [
          { label: "Nike Cortez", href: "/product?search=Nike%20Cortez" },
          { label: "Adidas Gazelle", href: "/product?search=Adidas%20Gazelle" },
          { label: "New Balance 327", href: "/product?search=New%20Balance%20327" },
          { label: "Puma Palermo", href: "/product?search=Puma%20Palermo" },
        ],
      },
    ],
  },
  {
    label: "Anak-Anak",
    href: "/product?audience=KIDS",
    columns: [
      {
        title: "Sepatu",
        links: [
          { label: "Semua Koleksi Anak", href: "/product?audience=KIDS&segment=SHOES" },
          { label: "Boys", href: "/product?audience=KIDS&category=sneakers" },
          { label: "Girls", href: "/product?audience=KIDS&category=casual" },
          { label: "Toddler", href: "/product?audience=KIDS&category=sneakers" },
          { label: "School Shoes", href: "/product?audience=KIDS&category=formal" },
        ],
      },
      {
        title: "Pakaian",
        links: [
          { label: "Semua Pakaian Anak", href: "/product?audience=KIDS&segment=APPAREL" },
          { label: "Kaos Anak", href: "/product?audience=KIDS&segment=APPAREL&search=kaos" },
          { label: "Hoodie Anak", href: "/product?audience=KIDS&segment=APPAREL&search=hoodie" },
          { label: "Jaket Anak", href: "/product?audience=KIDS&segment=APPAREL&search=jaket" },
          { label: "Celana Anak", href: "/product?audience=KIDS&segment=APPAREL&search=celana" },
        ],
      },
      {
        title: "Aksesoris",
        links: [
          { label: "Semua Aksesoris Anak", href: "/product?audience=KIDS&segment=ACCESSORIES" },
          { label: "Topi Anak", href: "/product?audience=KIDS&segment=ACCESSORIES&search=topi" },
          { label: "Tas Anak", href: "/product?audience=KIDS&segment=ACCESSORIES&search=tas" },
          { label: "Kaos Kaki Anak", href: "/product?audience=KIDS&segment=ACCESSORIES&search=kaos%20kaki" },
          { label: "Perawatan Sepatu", href: "/product?audience=KIDS&segment=ACCESSORIES&search=perawatan%20sepatu" },
        ],
      },
      {
        title: "Icons",
        links: [
          { label: "Running", href: "/product?search=running%20anak" },
          { label: "Basket", href: "/product?search=basket%20anak" },
          { label: "Casual", href: "/product?category=casual" },
          { label: "Nike Kids", href: "/product?search=Nike%20Kids" },
          { label: "Adidas Kids", href: "/product?search=Adidas%20Kids" },
          { label: "Skechers Kids", href: "/product?search=Skechers%20Kids" },
        ],
      },
    ],
  },
  {
    label: "Coming Soon",
    href: "/product?collection=coming-soon",
    columns: [
      {
        title: "Sepatu",
        links: [
          { label: "Semua Coming Soon", href: "/product?collection=coming-soon" },
          { label: "Rilis Nike", href: "/product?collection=coming-soon&brand=Nike" },
          { label: "Rilis Adidas", href: "/product?collection=coming-soon&brand=Adidas" },
          { label: "Rilis New Balance", href: "/product?collection=coming-soon&brand=New%20Balance" },
          { label: "Sneakers", href: "/product?collection=coming-soon&category=sneakers" },
          { label: "Sport", href: "/product?collection=coming-soon&category=sport" },
        ],
      },
      {
        title: "Pakaian",
        links: [
          { label: "Semua Pakaian Coming Soon", href: "/product?collection=coming-soon&segment=APPAREL" },
          { label: "Kaos", href: "/product?collection=coming-soon&segment=APPAREL&search=kaos" },
          { label: "Hoodie", href: "/product?collection=coming-soon&segment=APPAREL&search=hoodie" },
          { label: "Jaket", href: "/product?collection=coming-soon&segment=APPAREL&search=jaket" },
        ],
      },
      {
        title: "Aksesoris",
        links: [
          { label: "Semua Aksesoris Coming Soon", href: "/product?collection=coming-soon&segment=ACCESSORIES" },
          { label: "Topi", href: "/product?collection=coming-soon&segment=ACCESSORIES&search=topi" },
          { label: "Tas", href: "/product?collection=coming-soon&segment=ACCESSORIES&search=tas" },
          { label: "Kaos Kaki", href: "/product?collection=coming-soon&segment=ACCESSORIES&search=kaos%20kaki" },
        ],
      },
      {
        title: "Icons",
        links: [
          { label: "Nike Air Max", href: "/product?search=Nike%20Air%20Max" },
          { label: "Adidas Originals", href: "/product?search=Adidas%20Originals" },
          { label: "New Balance 530", href: "/product?search=New%20Balance%20530" },
          { label: "Vans Classic", href: "/product?search=Vans%20Classic" },
        ],
      },
    ],
  },
  {
    label: "Brands",
    href: "/product",
    columns: [
      {
        title: "Sepatu",
        links: [
          { label: "Semua Sepatu Brand", href: "/product" },
          { label: "Nike", href: "/product?brand=Nike" },
          { label: "Adidas", href: "/product?brand=Adidas" },
          { label: "New Balance", href: "/product?brand=New%20Balance" },
          { label: "Puma", href: "/product?brand=Puma" },
          { label: "Vans", href: "/product?brand=Vans" },
        ],
      },
      {
        title: "Pakaian",
        links: [
          { label: "Semua Pakaian Brand", href: "/product?search=pakaian%20brand" },
          { label: "Nike Apparel", href: "/product?brand=Nike&segment=APPAREL" },
          { label: "Adidas Apparel", href: "/product?brand=Adidas&segment=APPAREL" },
          { label: "Puma Apparel", href: "/product?brand=Puma&segment=APPAREL" },
          { label: "Jordan Apparel", href: "/product?brand=Jordan&segment=APPAREL" },
        ],
      },
      {
        title: "Aksesoris",
        links: [
          { label: "Semua Aksesoris Brand", href: "/product?search=aksesoris%20brand" },
          { label: "Asics", href: "/product?brand=Asics" },
          { label: "Reebok", href: "/product?brand=Reebok" },
          { label: "Converse", href: "/product?brand=Converse" },
          { label: "Skechers", href: "/product?brand=Skechers" },
        ],
      },
      {
        title: "Brand Icons",
        links: [
          { label: "Air Jordan", href: "/product?search=Air%20Jordan" },
          { label: "Nike Dunk", href: "/product?search=Nike%20Dunk" },
          { label: "Adidas Originals", href: "/product?search=Adidas%20Originals" },
          { label: "Converse Chuck", href: "/product?search=Converse%20Chuck" },
        ],
      },
    ],
  },
  {
    label: "Sale",
    href: "/product?collection=sale&sortBy=price-asc",
    accent: true,
    columns: [
      {
        title: "Sepatu",
        links: [
          { label: "Semua Sale", href: "/product?collection=sale&sortBy=price-asc" },
          { label: "Sepatu Sale", href: "/product?collection=sale&segment=SHOES&sortBy=price-asc" },
          { label: "Sport Sale", href: "/product?collection=sale&category=sport&sortBy=price-asc" },
          { label: "Casual Sale", href: "/product?collection=sale&category=casual&sortBy=price-asc" },
          { label: "Running Sale", href: "/product?collection=sale&category=running&sortBy=price-asc" },
        ],
      },
      {
        title: "Pakaian",
        links: [
          { label: "Semua Pakaian Sale", href: "/product?collection=sale&segment=APPAREL&sortBy=price-asc" },
          { label: "Kaos Sale", href: "/product?collection=sale&segment=APPAREL&search=kaos&sortBy=price-asc" },
          { label: "Hoodie Sale", href: "/product?collection=sale&segment=APPAREL&search=hoodie&sortBy=price-asc" },
          { label: "Jaket Sale", href: "/product?collection=sale&segment=APPAREL&search=jaket&sortBy=price-asc" },
        ],
      },
      {
        title: "Aksesoris",
        links: [
          { label: "Semua Aksesoris Sale", href: "/product?collection=sale&segment=ACCESSORIES&sortBy=price-asc" },
          { label: "Topi Sale", href: "/product?collection=sale&segment=ACCESSORIES&search=topi&sortBy=price-asc" },
          { label: "Tas Sale", href: "/product?collection=sale&segment=ACCESSORIES&search=tas&sortBy=price-asc" },
          { label: "Kaos Kaki Sale", href: "/product?collection=sale&segment=ACCESSORIES&search=kaos%20kaki&sortBy=price-asc" },
        ],
      },
      {
        title: "Icons",
        links: [
          { label: "Di bawah 500K", href: "/product?collection=sale&maxPrice=500000&sortBy=price-asc" },
          { label: "500K - 1 Juta", href: "/product?collection=sale&minPrice=500000&maxPrice=1000000" },
          { label: "Harga Terendah", href: "/product?collection=sale&sortBy=price-asc" },
          { label: "Best Deal", href: "/product?collection=sale&sortBy=price-asc" },
        ],
      },
    ],
  },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
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
            suppressHydrationWarning
          >
            <Menu size={24} />
          </button>

          {/* Navigation Links */}
          <div className="hidden lg:flex items-center space-x-6 text-black">
            {!isAdmin && (
              <>
                <Link
                  href="/cart"
                  className="flex items-center space-x-1 hover:text-blue-600 transition"
                >
                  <ShoppingCart size={18} />
                  <span>Keranjang</span>
                </Link>
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
                suppressHydrationWarning
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

      {!isAdmin && (
        <div className="hidden lg:block border-t border-gray-100 bg-white">
          <div className="mx-auto max-w-[1440px] px-8">
            <div className="flex h-12 items-center justify-center gap-12 xl:gap-16">
              {megaMenuSections.map((section) => (
                <div key={section.label} className="group h-full">
                  <Link
                    href={section.href}
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
                                  href={item.href}
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
                          href={section.href}
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
                                    href={item.href}
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
