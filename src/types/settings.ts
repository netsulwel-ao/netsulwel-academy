export interface PlatformSettings {
  plans: {
    smart: { price: number; label: string; description: string; features: string[] };
    golden: { price: number; label: string; description: string; features: string[] };
  };
  paymentMethods: {
    bankTransfer: { enabled: boolean; bankName: string; iban: string; accountHolder: string; reference: string };
    multicaixa: { enabled: boolean; entity: string; reference: string };
    paypal: { enabled: boolean; email: string; clientId: string };
    stripe: { enabled: boolean; publicKey: string };
  };

  socials: {
    instagram: string;
    youtube: string;
    facebook: string;
    twitter: string;
    linkedin: string;
    discord: string;
    whatsapp: string;
    tiktok: string;
  };

  contact: {
    email: string;
    phone: string;
    address: string;
    supportEmail: string;
  };

  meta: {
    description: string;
    keywords: string;
  };

  fees: {
    defaultCourseFee: number;
    defaultVideoFee: number;
  };

  updatedAt?: unknown;
}

export interface Sale {
  id?: string;
  userId: string;
  userName: string;
  userEmail: string;
  type: "standalone" | "smart" | "golden";
  itemId?: string;
  itemTitle?: string;
  amount: number;
  fee: number;
  netAmount: number;
  sellerId?: string;
  sellerName?: string;
  sellerType?: "teacher" | "institution";
  paymentMethod: string;
  status: "pending" | "confirmed" | "cancelled";
  reference?: string;
  receiptUrl?: string;
  notes?: string;
  paypalTransactionId?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Wallet {
  userId: string;
  userName: string;
  balance: number;
  totalSales: number;
  totalFees: number;
  sales: Sale[];
  updatedAt?: unknown;
}
