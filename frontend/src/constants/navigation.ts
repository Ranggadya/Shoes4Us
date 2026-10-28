export type MegaMenuColumn = {
  title: string;
  links: Array<{ label: string; href: string }>;
};

export type MegaMenuSection = {
  label: string;
  href: string;
  accent?: boolean;
  columns: MegaMenuColumn[];
};

export const megaMenuSections: MegaMenuSection[] = [
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
