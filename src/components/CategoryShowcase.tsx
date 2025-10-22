"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

const categories = [
  {
    id: 1,
    name: "Sneakers",
    description: "Gaya casual untuk setiap hari",
    image: "/sepatu4.jpeg",
    link: "/product?category=sneakers",
  },
  {
    id: 2,
    name: "Sport",
    description: "Performa maksimal untuk olahraga",
    image: "/sepatu5.jpeg",
    link: "/product?category=sport",
  },
  {
    id: 3,
    name: "Formal",
    description: "Tampil profesional dan elegan",
    image: "/sepatu6.jpeg",
    link: "/product?category=formal",
  },
  {
    id: 4,
    name: "Casual",
    description: "Nyaman untuk aktivitas harian",
    image: "/sepatu7.jpeg",
    link: "/product?category=casual",
  },
];

export default function CategoryShowcase() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Jelajahi Kategori
          </h2>
          <p className="text-gray-600 text-lg">
            Temukan sepatu sesuai kebutuhan Anda
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={category.link}
              className="group relative overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
            >
              {/* Image */}
              <div className="relative h-64 w-full">
                <Image
                  src={category.image}
                  alt={category.name}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                />
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
              </div>

              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <h3 className="text-2xl font-bold mb-2">{category.name}</h3>
                <p className="text-sm text-gray-200 mb-3">
                  {category.description}
                </p>
                <div className="flex items-center gap-2 text-sm font-semibold group-hover:gap-3 transition-all">
                  <span>Lihat Produk</span>
                  <ArrowRight size={16} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
