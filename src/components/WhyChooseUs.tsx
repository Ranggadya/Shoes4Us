"use client";

import { Truck, Shield, CreditCard, Headphones } from "lucide-react";

const features = [
  {
    id: 1,
    icon: Truck,
    title: "Gratis Ongkir",
    description: "Untuk pembelian di atas Rp 500.000",
  },
  {
    id: 2,
    icon: Shield,
    title: "Garansi Kualitas",
    description: "100% produk original bergaransi",
  },
  {
    id: 3,
    icon: CreditCard,
    title: "Pembayaran Aman",
    description: "Berbagai metode pembayaran tersedia",
  },
  {
    id: 4,
    icon: Headphones,
    title: "Layanan 24/7",
    description: "Customer service siap membantu Anda",
  },
];

export default function WhyChooseUs() {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Kenapa Memilih Kami?
          </h2>
          <p className="text-gray-600 text-lg">
            Belanja dengan nyaman dan aman
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature) => (
            <div
              key={feature.id}
              className="text-center p-6 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {/* Icon */}
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-900 text-white rounded-full mb-4">
                <feature.icon size={32} />
              </div>

              {/* Title */}
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {feature.title}
              </h3>

              {/* Description */}
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
