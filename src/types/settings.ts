export interface PlatformSettings {
  // Planos e preços
  plans: {
    smart: { price: number; label: string; description: string; features: string[] };
    golden: { price: number; label: string; description: string; features: string[] };
  };

  // Métodos de pagamento
  paymentMethods: {
    bankTransfer: { enabled: boolean; bankName: string; iban: string; accountHolder: string; reference: string };
    multicaixa: { enabled: boolean; entity: string; reference: string };
    paypal: { enabled: boolean; email: string };
    stripe: { enabled: boolean; publicKey: string };
  };

  // Redes sociais
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

  // Contacto
  contact: {
    email: string;
    phone: string;
    address: string;
    supportEmail: string;
  };

  // SEO / Meta
  meta: {
    description: string;
    keywords: string;
  };

  updatedAt?: unknown;
}

export interface Sale {
  id?: string;
  userId: string;
  userName: string;
  userEmail: string;
  type: "standalone" | "smart" | "golden";
  itemId?: string;       // courseId se standalone
  itemTitle?: string;
  amount: number;        // em Kz
  paymentMethod: string;
  status: "pending" | "confirmed" | "cancelled";
  reference?: string;    // referência de pagamento
  notes?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}
