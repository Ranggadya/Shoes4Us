"use client";

import Link from "next/link";
import Image from "next/image";

export default function AuthNavbar() {
  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-center">
          <Link href="/" className="group flex items-center space-x-3 transition-all duration-300">
            <div className="relative">
              <Image
                src="/logo.jpg"
                alt="Logo"
                width={48}
                height={48}
                className="rounded-xl object-cover shadow-md group-hover:shadow-lg transition-shadow duration-300"
              />
              <div className="absolute inset-0 rounded-xl ring-1 ring-black/5 group-hover:ring-black/10 transition-all duration-300" />
            </div>
            <span className="text-2xl font-black tracking-tighter bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent group-hover:to-black transition-all duration-300">
              Shoes4Us
            </span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
