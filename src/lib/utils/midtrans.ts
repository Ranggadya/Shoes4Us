// src/lib/midtrans.ts
import midtransClient from "midtrans-client";

// ✅ Konfigurasi Midtrans
export const snap = new midtransClient.Snap({
  isProduction: process.env.MIDTRANS_PRODUCTION === "true",
  serverKey: process.env.MIDTRANS_SERVER_KEY!,
  clientKey: process.env.MIDTRANS_CLIENT_KEY!,
});
