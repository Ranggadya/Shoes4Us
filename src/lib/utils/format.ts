export const formatCurrency = (value: number, locale = "id-ID") =>
  new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
