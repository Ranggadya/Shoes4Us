import HeroCarousel from "@/components/HeroCarousel";
import HomeTickerMarquee from "@/components/HomeTickerMarquee";
import HomeQuickSizeFinder from "@/components/HomeQuickSizeFinder";
import ShopByCategory from "@/components/ShopByCategory";
import TabbedProductShowcase from "@/components/TabbedProductShowcase";
import HomeArchiveSaleBanner from "@/components/HomeArchiveSaleBanner";
import HomeVoucherStrip from "@/components/HomeVoucherStrip";
import HomeBrandGrid from "@/components/HomeBrandGrid";
import CategoryShowcase from "@/components/CategoryShowcase";
import RecentlyViewedSection from "@/components/RecentlyViewedSection";
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
      <HomeTickerMarquee />
      <HomeQuickSizeFinder />
      <ShopByCategory />
      <TabbedProductShowcase />
      <HomeArchiveSaleBanner />
      <HomeVoucherStrip />
      <HomeBrandGrid />
      <CategoryShowcase />
      <RecentlyViewedSection />
      <WhyChooseUs />
    </main>
  );
}
