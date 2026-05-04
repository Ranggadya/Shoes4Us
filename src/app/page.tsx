import HeroCarousel from "@/components/HeroCarousel";
import FeaturedProducts from "@/components/FeaturedProducts";
import CategoryShowcase from "@/components/CategoryShowcase";
import WhyChooseUs from "@/components/WhyChooseUs";

export default function HomePage() {
  return (
    <main className="min-h-screen">
      {/* Hero Section with Carousel */}
      <HeroCarousel />

      {/* Featured Products */}
      <FeaturedProducts />

      {/* Category Showcase */}
      <CategoryShowcase />

      {/* Why Choose Us */}
      <WhyChooseUs />
    </main>
  );
}