export type SaleStatus =
  | "PENDIENTE" // Sale created but not confirmed
  | "CONFIRMADA" // Sale confirmed and stock reserved
  | "EN_PROCESO" // Sale being processed
  | "COMPLETADA" // Sale completed and stock updated
  | "CANCELADA" // Sale cancelled
  | "DEVUELTA"; // Sale returned

export type PaymentMethod =
  | "EFECTIVO"
  | "TARJETA_CREDITO"
  | "TARJETA_DEBITO"
  | "TRANSFERENCIA"
  | "CHEQUE"
  | "CREDITO"
  | "OTRO";

export type CustomerSegment =
  | "VIP" // High value customers
  | "FRECUENTE" // Regular customers
  | "OCASIONAL" // Occasional customers
  | "NUEVO" // New customers
  | "INACTIVO"; // Inactive customers

export type ChurnRisk = "BAJO" | "MEDIO" | "ALTO" | "CRITICO";

export type Sale = {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  items: SaleItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  status: SaleStatus;
  notes?: string;
  userId: string;
  userName: string;
  createdAt: number;
  updatedAt: number;
  // AI Fields (for future implementation)
  aiInsights?: SaleAIInsights;
  predictedRepeat?: boolean;
  customerSegment?: CustomerSegment;
};

export type SaleItem = {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  total: number;
  // AI Fields (for future implementation)
  aiRecommendation?: boolean;
  crossSellSuccess?: boolean;
};

export type NewSaleInput = {
  customerId?: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  items: Omit<SaleItem, "total">[];
  paymentMethod: PaymentMethod;
  notes?: string;
  discount?: number;
  tax?: number;
};

export type Address = {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
};

export type Customer = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: Address;
  segment: CustomerSegment;
  totalPurchases: number;
  averageOrderValue: number;
  lastPurchaseDate?: number;
  purchaseFrequency: number;
  preferences: CustomerPreferences;
  userId: string;
  createdAt: number;
  updatedAt: number;
  // AI Fields (for future implementation)
  aiProfile?: CustomerAIProfile;
  predictedLifetimeValue?: number;
  churnRisk?: ChurnRisk;
  nextPurchasePrediction?: number;
};

export type CustomerPreferences = {
  preferredPaymentMethod?: PaymentMethod;
  preferredProducts?: string[]; // Product IDs
  communicationPreferences?: {
    email: boolean;
    sms: boolean;
    phone: boolean;
  };
  notes?: string;
};

export type NewCustomerInput = {
  name: string;
  email?: string;
  phone?: string;
  address?: Address;
  preferences?: CustomerPreferences;
};

// AI Types (for future implementation)
export type SaleAIInsights = {
  customerBehavior: CustomerBehaviorAnalysis;
  productRecommendations: ProductRecommendation[];
  pricingOptimization: PricingInsight[];
  salesForecast: SalesForecast;
  riskAssessment: RiskAssessment;
  crossSellOpportunities: CrossSellOpportunity[];
};

export type CustomerBehaviorAnalysis = {
  purchasePattern: string;
  preferredTime: string;
  averageBasketSize: number;
  seasonalTrends: string[];
};

export type ProductRecommendation = {
  productId: string;
  productName: string;
  confidence: number;
  reason: string;
  type: "CROSS_SELL" | "UP_SELL" | "REPLACEMENT";
};

export type PricingInsight = {
  productId: string;
  currentPrice: number;
  suggestedPrice: number;
  confidence: number;
  reason: string;
};

export type SalesForecast = {
  period: string;
  predictedSales: number;
  confidence: number;
  factors: string[];
};

export type RiskAssessment = {
  paymentRisk: "LOW" | "MEDIUM" | "HIGH";
  fraudRisk: "LOW" | "MEDIUM" | "HIGH";
  churnRisk: ChurnRisk;
  factors: string[];
};

export type CrossSellOpportunity = {
  productId: string;
  productName: string;
  probability: number;
  expectedValue: number;
  reason: string;
};

export type CustomerAIProfile = {
  behaviorScore: number;
  loyaltyScore: number;
  priceSensitivity: "LOW" | "MEDIUM" | "HIGH";
  preferredCategories: string[];
  communicationStyle: "FORMAL" | "CASUAL" | "TECHNICAL";
};

// Sales Analytics Types
export type SalesAnalytics = {
  totalSales: number;
  totalRevenue: number;
  averageOrderValue: number;
  totalCustomers: number;
  newCustomers: number;
  repeatCustomers: number;
  topProducts: TopProduct[];
  salesByPeriod: SalesByPeriod[];
  customerSegments: CustomerSegmentData[];
};

export type TopProduct = {
  productId: string;
  productName: string;
  quantitySold: number;
  revenue: number;
  percentage: number;
};

export type SalesByPeriod = {
  period: string;
  sales: number;
  revenue: number;
  orders: number;
};

export type CustomerSegmentData = {
  segment: CustomerSegment;
  count: number;
  revenue: number;
  averageOrderValue: number;
};

// Sales Report Types
export type SalesReport = {
  id: string;
  name: string;
  type: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY" | "CUSTOM";
  startDate: number;
  endDate: number;
  data: SalesAnalytics;
  generatedAt: number;
  generatedBy: string;
};

export type SalesReportFilter = {
  startDate?: number;
  endDate?: number;
  customerId?: string;
  productId?: string;
  status?: SaleStatus;
  paymentMethod?: PaymentMethod;
  userId?: string;
};
