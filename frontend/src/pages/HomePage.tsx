import HeroCarousel from "@/components/HeroCarousel";
import ShopByCategory from "@/components/ShopByCategory";
import FeaturedProducts from "@/components/FeaturedProducts";
import CategoryShowcase from "@/components/CategoryShowcase";
import WhyChooseUs from "@/components/WhyChooseUs";
import SEO from "@/components/SEO";
import FlashSaleBanner from "@/components/FlashSaleBanner";

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <SEO
        title="Koleksi Sepatu Orisinal & Sneakers Terbaik"
        description="Belanja sepatu Nike, Adidas, New Balance, dan Puma 100% orisinal dengan pengiriman cepat di Shoes4Us."
      />
      <FlashSaleBanner />
      <HeroCarousel />
      <ShopByCategory />
      <FeaturedProducts />
      <CategoryShowcase />
      <WhyChooseUs />
    </main>
  );
}
