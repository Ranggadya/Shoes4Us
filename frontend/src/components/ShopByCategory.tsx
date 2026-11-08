import { Link } from "react-router-dom";

type CategorySubLink = {
  label: string;
  href: string;
};

type AudienceCategoryCard = {
  id: string;
  title: string;
  href: string;
  image: string;
  fallbackImage: string;
  links: CategorySubLink[];
};

const AUDIENCE_CATEGORIES: AudienceCategoryCard[] = [
  {
    id: "mens",
    title: "SHOP MEN'S",
    href: "/product?audience=MEN",
    image: "/shop-mens.jpg",
    fallbackImage: "/Sneakers.png",
    links: [
      { label: "Men's Footwear", href: "/product?audience=MEN&segment=SHOES" },
      { label: "Men's Clothing", href: "/product?audience=MEN&segment=APPAREL" },
      { label: "Men's Accessories", href: "/product?audience=MEN&segment=ACCESSORIES" },
    ],
  },
  {
    id: "womens",
    title: "SHOP WOMEN'S",
    href: "/product?audience=WOMEN",
    image: "/shop-womens.jpg",
    fallbackImage: "/Sneakers2.png",
    links: [
      { label: "Women's Footwear", href: "/product?audience=WOMEN&segment=SHOES" },
      { label: "Women's Clothing", href: "/product?audience=WOMEN&segment=APPAREL" },
      { label: "Women's Accessories", href: "/product?audience=WOMEN&segment=ACCESSORIES" },
    ],
  },
  {
    id: "kids",
    title: "SHOP KIDS'",
    href: "/product?audience=KIDS",
    image: "/shop-kids.jpg",
    fallbackImage: "/Sport.png",
    links: [
      { label: "Kids' Footwear", href: "/product?audience=KIDS&segment=SHOES" },
      { label: "Kids' Clothing", href: "/product?audience=KIDS&segment=APPAREL" },
      { label: "Kids' Accessories", href: "/product?audience=KIDS&segment=ACCESSORIES" },
    ],
  },
];

export default function ShopByCategory() {
  return (
    <section className="pt-12 pb-4 bg-white" aria-labelledby="shop-by-category-heading">
      <div className="container mx-auto px-6">
        <h2
          id="shop-by-category-heading"
          className="text-2xl sm:text-[26px] font-bold tracking-tight text-slate-900 mb-5"
        >
          Shop by Category
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
          {AUDIENCE_CATEGORIES.map((card) => (
            <div
              key={card.id}
              className="group relative overflow-hidden bg-slate-900 aspect-[3/4] flex flex-col justify-end"
            >
              <img
                src={card.image}
                alt={card.title}
                onError={(e) => {
                  const target = e.currentTarget;
                  if (!target.src.endsWith(card.fallbackImage)) {
                    target.src = card.fallbackImage;
                  }
                }}
                className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                loading="lazy"
              />

              {/* Bottom gradient for crisp headline contrast */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent pointer-events-none" />

              <div className="relative z-10 w-full px-4 sm:px-5 pb-4 sm:pb-5">
                <Link
                  to={card.href}
                  className="block text-center text-white text-2xl sm:text-[28px] lg:text-[30px] font-extrabold uppercase tracking-tight mb-3.5 drop-shadow-sm hover:opacity-90 transition-opacity focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                >
                  {card.title}
                </Link>

                <div className="flex flex-col gap-2.5">
                  {card.links.map((item) => (
                    <Link
                      key={item.label}
                      to={item.href}
                      className="block w-full bg-white text-slate-900 text-center py-3 px-4 text-sm sm:text-[15px] font-medium tracking-normal transition-colors duration-200 hover:bg-slate-900 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

