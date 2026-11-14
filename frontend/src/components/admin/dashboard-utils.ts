import type {
  AdminUserRecord,
  Order,
  OrderItem,
  OrderStatus,
  Product,
} from "@/types";
import { formatCurrency, formatDate, getCategoryName } from "@/utils/format";

export const ALLOWED_ORDER_TRANSITIONS: Record<
  OrderStatus,
  readonly OrderStatus[]
> = {
  PENDING: ["PROCESSING", "PAID", "CANCELLED"],
  PROCESSING: ["PAID", "CANCELLED"],
  PAID: ["PROCESSING", "SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

export interface OrderStatusMeta {
  value: OrderStatus;
  label: string;
  badgeClass: string;
  pillActiveClass: string;
}

export const ORDER_STATUS_META: Record<OrderStatus, OrderStatusMeta> = {
  PENDING: {
    value: "PENDING",
    label: "Pending",
    badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
    pillActiveClass: "bg-amber-700 text-white border-amber-700",
  },
  PROCESSING: {
    value: "PROCESSING",
    label: "Diproses",
    badgeClass: "bg-sky-50 text-sky-800 border-sky-200",
    pillActiveClass: "bg-sky-700 text-white border-sky-700",
  },
  PAID: {
    value: "PAID",
    label: "Dibayar",
    badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
    pillActiveClass: "bg-emerald-700 text-white border-emerald-700",
  },
  SHIPPED: {
    value: "SHIPPED",
    label: "Dikirim",
    badgeClass: "bg-indigo-50 text-indigo-800 border-indigo-200",
    pillActiveClass: "bg-indigo-700 text-white border-indigo-700",
  },
  DELIVERED: {
    value: "DELIVERED",
    label: "Selesai",
    badgeClass: "bg-gray-100 text-gray-800 border-gray-300",
    pillActiveClass: "bg-gray-950 text-white border-gray-950",
  },
  CANCELLED: {
    value: "CANCELLED",
    label: "Dibatalkan",
    badgeClass: "bg-rose-50 text-rose-800 border-rose-200",
    pillActiveClass: "bg-rose-700 text-white border-rose-700",
  },
};

export const ORDER_STATUS_LIST: OrderStatus[] = [
  "PENDING",
  "PROCESSING",
  "PAID",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

export function getAllowedStatusOptions(currentStatus: OrderStatus): OrderStatus[] {
  const next = ALLOWED_ORDER_TRANSITIONS[currentStatus] ?? [];
  return [currentStatus, ...next.filter((st) => st !== currentStatus)];
}

export function getOrderItems(order: Order): OrderItem[] {
  return Array.isArray(order.items) ? order.items : [];
}

export interface PeriodComparison {
  recentRevenue: number;
  previousRevenue: number;
  revenueGrowthPercent: number | null;
  recentOrdersCount: number;
  previousOrdersCount: number;
  ordersGrowthPercent: number | null;
}

export function computePeriodComparison(
  orders: Order[],
  referenceDate = new Date()
): PeriodComparison {
  const nowMs = referenceDate.getTime();
  const ms30Days = 30 * 24 * 60 * 60 * 1000;
  const recentCutoff = nowMs - ms30Days;
  const prevCutoff = nowMs - ms30Days * 2;

  let recentRevenue = 0;
  let previousRevenue = 0;
  let recentOrdersCount = 0;
  let previousOrdersCount = 0;

  for (const order of orders) {
    const createdMs = new Date(order.createdAt).getTime();
    if (Number.isNaN(createdMs)) continue;

    if (createdMs >= recentCutoff && createdMs <= nowMs) {
      recentOrdersCount += 1;
      if (order.status !== "CANCELLED") {
        recentRevenue += order.totalAmount || 0;
      }
    } else if (createdMs >= prevCutoff && createdMs < recentCutoff) {
      previousOrdersCount += 1;
      if (order.status !== "CANCELLED") {
        previousRevenue += order.totalAmount || 0;
      }
    }
  }

  const revenueGrowthPercent =
    previousRevenue > 0
      ? Math.round(((recentRevenue - previousRevenue) / previousRevenue) * 100)
      : null;

  const ordersGrowthPercent =
    previousOrdersCount > 0
      ? Math.round(
          ((recentOrdersCount - previousOrdersCount) / previousOrdersCount) * 100
        )
      : null;

  return {
    recentRevenue,
    previousRevenue,
    revenueGrowthPercent,
    recentOrdersCount,
    previousOrdersCount,
    ordersGrowthPercent,
  };
}

export interface DailyActivityBar {
  isoDate: string;
  label: string;
  orders: number;
  revenue: number;
  isToday: boolean;
  heightPct: number;
}

function toLocalDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function computeWeeklyActivityBars(
  orders: Order[],
  referenceDate = new Date()
): DailyActivityBar[] {
  const buckets = new Map<string, { orders: number; revenue: number; label: string; isToday: boolean }>();
  const dayFormatter = new Intl.DateTimeFormat("id-ID", { weekday: "short" });

  for (let offset = 6; offset >= 0; offset--) {
    const d = new Date(referenceDate);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - offset);
    const key = toLocalDateKey(d);
    buckets.set(key, {
      orders: 0,
      revenue: 0,
      label: dayFormatter.format(d),
      isToday: offset === 0,
    });
  }

  for (const order of orders) {
    const parsed = new Date(order.createdAt);
    if (Number.isNaN(parsed.getTime())) continue;
    const key = toLocalDateKey(parsed);
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.orders += 1;
      if (order.status !== "CANCELLED") {
        bucket.revenue += order.totalAmount || 0;
      }
    }
  }

  const rawList = Array.from(buckets.entries()).map(([isoDate, data]) => ({
    isoDate,
    ...data,
  }));
  const maxOrders = Math.max(...rawList.map((b) => b.orders), 0);

  return rawList.map((entry) => ({
    ...entry,
    heightPct:
      maxOrders > 0 && entry.orders > 0
        ? Math.max(12, Math.round((entry.orders / maxOrders) * 100))
        : 0,
  }));
}

export interface CategoryDistributionItem {
  category: string;
  quantity: number;
  revenue: number;
  percentage: number;
  color: string;
}

const DONUT_PALETTE = [
  "#111827",
  "#4B5563",
  "#9CA3AF",
  "#059669",
  "#D97706",
];

export function computeCategoryDistribution(
  orders: Order[],
  products: Product[]
): CategoryDistributionItem[] {
  const productById = new Map<string, Product>();
  for (const p of products) {
    productById.set(p.id, p);
  }

  const agg = new Map<string, { quantity: number; revenue: number }>();

  for (const order of orders) {
    if (order.status === "CANCELLED") continue;
    for (const item of getOrderItems(order)) {
      const pid = item.productId || item.product?.id || "";
      const matched = pid ? productById.get(pid) : undefined;
      const category = getCategoryName(matched?.category, "Lainnya");
      const qty = Math.max(0, Number(item.quantity) || 0);
      const lineRev = Math.max(0, Number(item.price) || 0) * qty;
      const prev = agg.get(category) ?? { quantity: 0, revenue: 0 };
      agg.set(category, {
        quantity: prev.quantity + qty,
        revenue: prev.revenue + lineRev,
      });
    }
  }

  const sorted = Array.from(agg.entries())
    .sort((a, b) => b[1].quantity - a[1].quantity || b[1].revenue - a[1].revenue)
    .slice(0, 5);

  const totalQty = sorted.reduce((sum, [, val]) => sum + val.quantity, 0);
  if (totalQty === 0) return [];

  return sorted.map(([category, val], index) => ({
    category,
    quantity: val.quantity,
    revenue: val.revenue,
    percentage: Math.round((val.quantity / totalQty) * 100),
    color: DONUT_PALETTE[index % DONUT_PALETTE.length],
  }));
}

export interface MonthlyRevenuePoint {
  monthKey: string;
  label: string;
  revenue: number;
  ordersCount: number;
  heightPct: number;
}

export function computeMonthlyRevenueSeries(
  orders: Order[],
  monthsCount = 6,
  referenceDate = new Date()
): MonthlyRevenuePoint[] {
  const monthFormatter = new Intl.DateTimeFormat("id-ID", { month: "short" });
  const points: Array<{ monthKey: string; label: string; revenue: number; ordersCount: number }> = [];
  const indexByKey = new Map<string, number>();

  for (let i = monthsCount - 1; i >= 0; i--) {
    const d = new Date(
      referenceDate.getFullYear(),
      referenceDate.getMonth() - i,
      1
    );
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    indexByKey.set(key, points.length);
    points.push({
      monthKey: key,
      label: monthFormatter.format(d),
      revenue: 0,
      ordersCount: 0,
    });
  }

  for (const order of orders) {
    if (order.status === "CANCELLED") continue;
    const parsed = new Date(order.createdAt);
    if (Number.isNaN(parsed.getTime())) continue;
    const key = `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}`;
    const idx = indexByKey.get(key);
    if (idx !== undefined) {
      points[idx].revenue += order.totalAmount || 0;
      points[idx].ordersCount += 1;
    }
  }

  const maxRevenue = Math.max(...points.map((p) => p.revenue), 0);

  return points.map((p) => ({
    ...p,
    heightPct:
      maxRevenue > 0 && p.revenue > 0
        ? Math.max(8, Math.round((p.revenue / maxRevenue) * 100))
        : 0,
  }));
}

export interface TopSellingProduct {
  productId: string;
  name: string;
  category: string;
  qtySold: number;
  revenue: number;
  imageUrl?: string | null;
}

export function computeTopSellingProducts(
  orders: Order[],
  products: Product[],
  limit = 5
): TopSellingProduct[] {
  const productById = new Map<string, Product>();
  for (const p of products) {
    productById.set(p.id, p);
  }

  const stats = new Map<string, TopSellingProduct>();

  for (const order of orders) {
    if (order.status === "CANCELLED") continue;
    for (const item of getOrderItems(order)) {
      const pid = item.productId || item.product?.id || item.product?.name || "";
      if (!pid) continue;
      const qty = Math.max(0, Number(item.quantity) || 0);
      if (qty === 0) continue;

      const productInfo = productById.get(pid);
      const rev = Math.max(0, Number(item.price) || 0) * qty;
      const existing = stats.get(pid);

      if (existing) {
        existing.qtySold += qty;
        existing.revenue += rev;
      } else {
        stats.set(pid, {
          productId: pid,
          name: item.product?.name || productInfo?.name || "Produk",
          category: getCategoryName(productInfo?.category, "Umum"),
          qtySold: qty,
          revenue: rev,
          imageUrl: item.product?.imageUrl ?? productInfo?.imageUrl ?? null,
        });
      }
    }
  }

  return Array.from(stats.values())
    .sort((a, b) => b.qtySold - a.qtySold || b.revenue - a.revenue)
    .slice(0, limit);
}

export interface CustomerSummaryRow {
  key: string;
  name: string;
  email: string;
  role: string;
  isRegistered: boolean;
  ordersCount: number;
  totalSpent: number;
  lastActivityAt: string;
}

export function buildCustomerSummaryRows(
  orders: Order[],
  registeredUsers: AdminUserRecord[]
): CustomerSummaryRow[] {
  const byEmailOrId = new Map<string, CustomerSummaryRow>();

  for (const usr of registeredUsers) {
    const normalizedEmail = (usr.email || "").trim().toLowerCase();
    const key = normalizedEmail || usr.id;
    if (!key) continue;
    byEmailOrId.set(key, {
      key,
      name: usr.name || "Pengguna",
      email: usr.email || "-",
      role: usr.role || "USER",
      isRegistered: true,
      ordersCount: 0,
      totalSpent: 0,
      lastActivityAt: usr.createdAt || "",
    });
  }

  for (const order of orders) {
    const email = (order.user?.email || "").trim();
    const normalizedEmail = email.toLowerCase();
    const key = normalizedEmail || order.userId || order.id;
    const orderSpent = order.status === "CANCELLED" ? 0 : order.totalAmount || 0;
    const existing = byEmailOrId.get(key);

    if (existing) {
      existing.ordersCount += 1;
      existing.totalSpent += orderSpent;
      if (
        order.createdAt &&
        (!existing.lastActivityAt ||
          new Date(order.createdAt).getTime() >
            new Date(existing.lastActivityAt).getTime())
      ) {
        existing.lastActivityAt = order.createdAt;
      }
    } else {
      byEmailOrId.set(key, {
        key,
        name: order.user?.name || "Pelanggan",
        email: email || "-",
        role: "USER",
        isRegistered: false,
        ordersCount: 1,
        totalSpent: orderSpent,
        lastActivityAt: order.createdAt || "",
      });
    }
  }

  return Array.from(byEmailOrId.values()).sort((a, b) => {
    if (b.totalSpent !== a.totalSpent) return b.totalSpent - a.totalSpent;
    return (
      new Date(b.lastActivityAt || 0).getTime() -
      new Date(a.lastActivityAt || 0).getTime()
    );
  });
}

/**
 * Escapes CSV fields per RFC 4180 while neutralizing spreadsheet formula injection
 * even when preceded by whitespace or control characters.
 */
export function sanitizeCsvCell(value: unknown): string {
  const raw = String(value ?? "").replace(/[\r\n]+/g, " ");
  const trimmedLeading = raw.replace(/^[\s\u00A0]+/, "");
  const isFormulaRisk =
    trimmedLeading.length > 0 && /^[=+\-@\t]/.test(trimmedLeading);
  const safe = isFormulaRisk ? `'${raw}` : raw;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function buildCsvContent(
  headers: string[],
  rows: Array<Array<unknown>>
): string {
  const headerLine = headers.map(sanitizeCsvCell).join(",");
  const bodyLines = rows.map((row) => row.map(sanitizeCsvCell).join(","));
  return `\uFEFF${[headerLine, ...bodyLines].join("\r\n")}`;
}

export function triggerBlobDownload(
  content: string,
  mimeType: string,
  filename: string
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}

export function downloadOrdersCsv(orders: Order[]): void {
  const headers = [
    "No. Pesanan",
    "Pelanggan",
    "Email",
    "Status",
    "Total (Rp)",
    "Kurir",
    "Kupon",
    "Jumlah Item",
    "Tanggal",
  ];
  const rows = orders.map((order) => {
    const itemsCount = getOrderItems(order).reduce(
      (sum, it) => sum + (Number(it.quantity) || 0),
      0
    );
    return [
      order.orderNumber || order.id,
      order.user?.name || "Pelanggan",
      order.user?.email || "-",
      ORDER_STATUS_META[order.status]?.label || order.status,
      order.totalAmount ?? 0,
      order.shippingCourier || "-",
      order.couponCode || "-",
      itemsCount,
      formatDate(order.createdAt),
    ];
  });
  const csv = buildCsvContent(headers, rows);
  const dateSuffix = new Date().toISOString().slice(0, 10);
  triggerBlobDownload(
    csv,
    "text/csv;charset=utf-8;",
    `shoes4us-orders-${dateSuffix}.csv`
  );
}

export function downloadCustomersCsv(customers: CustomerSummaryRow[]): void {
  const headers = [
    "Nama",
    "Email",
    "Peran",
    "Terdaftar",
    "Total Pesanan",
    "Total Belanja (Rp)",
    "Aktivitas Terakhir",
  ];
  const rows = customers.map((c) => [
    c.name,
    c.email,
    c.role,
    c.isRegistered ? "Ya" : "Order Saja",
    c.ordersCount,
    c.totalSpent,
    formatDate(c.lastActivityAt),
  ]);
  const csv = buildCsvContent(headers, rows);
  const dateSuffix = new Date().toISOString().slice(0, 10);
  triggerBlobDownload(
    csv,
    "text/csv;charset=utf-8;",
    `shoes4us-customers-${dateSuffix}.csv`
  );
}

export function downloadInventoryCsv(products: Product[]): void {
  const headers = [
    "Produk",
    "Brand",
    "Kategori",
    "Segment",
    "Target",
    "Harga (Rp)",
    "Stok Total",
  ];
  const rows = products.map((p) => [
    p.name,
    p.brand || "-",
    getCategoryName(p.category),
    p.segment || "SHOES",
    p.audience || "UNISEX",
    p.price ?? 0,
    p.stock ?? 0,
  ]);
  const csv = buildCsvContent(headers, rows);
  const dateSuffix = new Date().toISOString().slice(0, 10);
  triggerBlobDownload(
    csv,
    "text/csv;charset=utf-8;",
    `shoes4us-inventory-${dateSuffix}.csv`
  );
}

export function downloadOrderReceiptTxt(order: Order): void {
  const items = getOrderItems(order);
  const lines: string[] = [
    "========================================",
    "SHOES4US - STRUK RINCIAN PESANAN",
    "========================================",
    `No. Pesanan : ${order.orderNumber || order.id}`,
    `Tanggal     : ${formatDate(order.createdAt)}`,
    `Status      : ${ORDER_STATUS_META[order.status]?.label || order.status}`,
    `Pelanggan   : ${order.user?.name || "-"} (${order.user?.email || "-"})`,
    "----------------------------------------",
    "DAFTAR PRODUK:",
    ...(items.length > 0
      ? items.map(
          (item, i) =>
            `${i + 1}. ${item.product?.name || "Produk"}${
              item.size ? ` [Ukuran: ${item.size}]` : ""
            } x${item.quantity} = ${formatCurrency(
              (item.price || 0) * (item.quantity || 0)
            )}`
        )
      : ["(Detail produk tidak tersedia)"]),
    "----------------------------------------",
    `Kurir       : ${order.shippingCourier || "-"}`,
    `Ongkos Kirim: ${formatCurrency(order.shippingCost || 0)}`,
    `Kupon       : ${order.couponCode || "-"}`,
    `Diskon      : ${formatCurrency(order.discountAmount || 0)}`,
    `TOTAL BAYAR : ${formatCurrency(order.totalAmount || 0)}`,
    "----------------------------------------",
    `Alamat Kirim: ${order.shippingAddress || "-"}`,
    `Kota / Pos  : ${order.shippingCity || "-"} ${order.shippingPostalCode || ""}`,
    `Telepon     : ${order.shippingPhone || "-"}`,
    `No. Resi    : ${order.trackingNumber || "-"}`,
    "========================================",
  ];

  triggerBlobDownload(
    lines.join("\n"),
    "text/plain;charset=utf-8;",
    `struk-${order.orderNumber || order.id}.txt`
  );
}
