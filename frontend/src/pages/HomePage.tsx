import HeroCarousel from "@/components/HeroCarousel";
import ShopByCategory from "@/components/ShopByCategory";
import FeaturedProducts from "@/components/FeaturedProducts";
import CategoryShowcase from "@/components/CategoryShowcase";
import WhyChooseUs from "@/components/WhyChooseUs";

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <HeroCarousel />
      <ShopByCategory />
      <FeaturedProducts />
      <CategoryShowcase />
      <WhyChooseUs />
    </main>
  );
}
