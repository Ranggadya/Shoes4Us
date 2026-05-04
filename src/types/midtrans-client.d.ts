// src/types/midtrans-client.d.ts
declare module "midtrans-client" {
  /** Kelas utama Midtrans Client */
  export default class midtransClient {
    static Snap: typeof Snap;
    static CoreApi: typeof CoreApi;
    static Iris: unknown;
  }

  /** Tipe konfigurasi dasar */
  export interface MidtransConfig {
    isProduction: boolean;
    serverKey: string;
    clientKey: string;
  }

  /** Parameter transaksi Midtrans */
  export interface TransactionParams {
    transaction_details: {
      order_id: string;
      gross_amount: number;
    };
    item_details?: Array<{
      id?: string;
      name?: string;
      price: number;
      quantity: number;
    }>;
    customer_details?: {
      first_name?: string;
      last_name?: string;
      email?: string;
      phone?: string;
    };
    [key: string]: unknown;
  }

  /** Snap API (pembayaran Midtrans) */
  export class Snap {
    constructor(config: MidtransConfig);

    createTransaction(
      params: TransactionParams
    ): Promise<{
      token: string;
      redirect_url: string;
    }>;

    createTransactionToken(params: TransactionParams): Promise<string>;
  }

  /** Core API (pembayaran server-to-server Midtrans) */
  export class CoreApi {
    constructor(config: MidtransConfig);

    charge(params: Record<string, unknown>): Promise<unknown>;
    capture(params: Record<string, unknown>): Promise<unknown>;
  }
}
