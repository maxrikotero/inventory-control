import { Customer, Sale, CustomerSegment, ChurnRisk } from "@/types/sales";
import { listCustomers } from "@/lib/customers";
import { listSales } from "@/lib/sales";

// Types for customer intelligence
export type CustomerBehaviorAnalysis = {
  customerId: string;
  customerName: string;
  purchasePattern: string;
  preferredTime: string;
  averageBasketSize: number;
  seasonalTrends: string[];
  loyaltyScore: number;
  priceSensitivity: "LOW" | "MEDIUM" | "HIGH";
  communicationStyle: "FORMAL" | "CASUAL" | "TECHNICAL";
  nextPurchasePrediction?: number;
  churnRisk: ChurnRisk;
  lifetimeValue: number;
  recommendedActions: string[];
};

export type CustomerSegmentAnalysis = {
  segment: CustomerSegment;
  count: number;
  averageOrderValue: number;
  averageFrequency: number;
  churnRate: number;
  growthPotential: number;
  characteristics: string[];
  recommendedStrategies: string[];
};

export type CustomerInsight = {
  type: "OPPORTUNITY" | "RISK" | "TREND" | "RECOMMENDATION";
  title: string;
  description: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  actionRequired: boolean;
  suggestedAction?: string;
  impact: number; // 0-100
};

// Customer intelligence engine
export class CustomerIntelligenceEngine {
  private customers: Customer[] = [];
  private sales: Sale[] = [];
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const [customers, sales] = await Promise.all([
        listCustomers(),
        listSales(1000),
      ]);

      this.customers = customers;
      this.sales = sales;
      this.isInitialized = true;
    } catch (error) {
      console.error("Error initializing customer intelligence:", error);
    }
  }

  // Analyze individual customer behavior
  async analyzeCustomerBehavior(
    customerId: string
  ): Promise<CustomerBehaviorAnalysis> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const customer = this.customers.find((c) => c.id === customerId);
    if (!customer) {
      throw new Error("Customer not found");
    }

    const customerSales = this.sales.filter(
      (sale) => sale.customerId === customerId
    );

    if (customerSales.length === 0) {
      return this.getDefaultBehaviorAnalysis(customer);
    }

    // Analyze purchase patterns
    const purchasePattern = this.analyzePurchasePattern(customerSales);
    const preferredTime = this.analyzePreferredTime(customerSales);
    const averageBasketSize = this.calculateAverageBasketSize(customerSales);
    const seasonalTrends = this.analyzeSeasonalTrends(customerSales);
    const loyaltyScore = this.calculateLoyaltyScore(customer, customerSales);
    const priceSensitivity = this.analyzePriceSensitivity(customerSales);
    const communicationStyle = this.determineCommunicationStyle(
      customer,
      customerSales
    );
    const nextPurchasePrediction = this.predictNextPurchase(customerSales);
    const churnRisk = this.calculateChurnRisk(customer, customerSales);
    const lifetimeValue = this.calculateLifetimeValue(customer, customerSales);
    const recommendedActions = this.generateRecommendedActions(
      customer,
      customerSales,
      churnRisk
    );

    return {
      customerId: customer.id,
      customerName: customer.name,
      purchasePattern,
      preferredTime,
      averageBasketSize,
      seasonalTrends,
      loyaltyScore,
      priceSensitivity,
      communicationStyle,
      nextPurchasePrediction,
      churnRisk,
      lifetimeValue,
      recommendedActions,
    };
  }

  // Analyze customer segments
  async analyzeCustomerSegments(): Promise<CustomerSegmentAnalysis[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const segments: CustomerSegment[] = [
      "VIP",
      "FRECUENTE",
      "OCASIONAL",
      "NUEVO",
      "INACTIVO",
    ];
    const analyses: CustomerSegmentAnalysis[] = [];

    segments.forEach((segment) => {
      const segmentCustomers = this.customers.filter(
        (c) => c.segment === segment
      );

      if (segmentCustomers.length === 0) {
        analyses.push({
          segment,
          count: 0,
          averageOrderValue: 0,
          averageFrequency: 0,
          churnRate: 0,
          growthPotential: 0,
          characteristics: [],
          recommendedStrategies: [],
        });
        return;
      }

      const segmentSales = this.sales.filter((sale) =>
        segmentCustomers.some((c) => c.id === sale.customerId)
      );

      const analysis: CustomerSegmentAnalysis = {
        segment,
        count: segmentCustomers.length,
        averageOrderValue: this.calculateAverageOrderValue(segmentSales),
        averageFrequency: this.calculateAverageFrequency(
          segmentCustomers,
          segmentSales
        ),
        churnRate: this.calculateChurnRate(segmentCustomers, segmentSales),
        growthPotential: this.calculateGrowthPotential(
          segment,
          segmentCustomers
        ),
        characteristics: this.getSegmentCharacteristics(
          segment,
          segmentCustomers,
          segmentSales
        ),
        recommendedStrategies: this.getRecommendedStrategies(
          segment,
          segmentCustomers,
          segmentSales
        ),
      };

      analyses.push(analysis);
    });

    return analyses;
  }

  // Generate customer insights
  async generateCustomerInsights(
    customerId?: string
  ): Promise<CustomerInsight[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const insights: CustomerInsight[] = [];

    if (customerId) {
      // Individual customer insights
      const behavior = await this.analyzeCustomerBehavior(customerId);
      insights.push(...this.generateIndividualInsights(behavior));
    } else {
      // Global customer insights
      insights.push(...this.generateGlobalInsights());
    }

    return insights.sort((a, b) => b.priority.localeCompare(a.priority));
  }

  // Helper methods
  private getDefaultBehaviorAnalysis(
    customer: Customer
  ): CustomerBehaviorAnalysis {
    return {
      customerId: customer.id,
      customerName: customer.name,
      purchasePattern: "Sin historial",
      preferredTime: "No disponible",
      averageBasketSize: 0,
      seasonalTrends: [],
      loyaltyScore: 0,
      priceSensitivity: "MEDIUM",
      communicationStyle: "CASUAL",
      churnRisk: "ALTO",
      lifetimeValue: 0,
      recommendedActions: [
        "Incentivar primera compra",
        "Enviar ofertas especiales",
      ],
    };
  }

  private analyzePurchasePattern(sales: Sale[]): string {
    if (sales.length < 3) return "Patrón inicial";

    const intervals = [];
    for (let i = 1; i < sales.length; i++) {
      const interval = sales[i].createdAt - sales[i - 1].createdAt;
      intervals.push(interval);
    }

    const avgInterval =
      intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    const days = avgInterval / (1000 * 60 * 60 * 24);

    if (days <= 7) return "Comprador frecuente";
    if (days <= 30) return "Comprador regular";
    if (days <= 90) return "Comprador ocasional";
    return "Comprador esporádico";
  }

  private analyzePreferredTime(sales: Sale[]): string {
    const timeCounts = { MORNING: 0, AFTERNOON: 0, EVENING: 0, NIGHT: 0 };

    sales.forEach((sale) => {
      const hour = new Date(sale.createdAt).getHours();
      if (hour >= 6 && hour < 12) timeCounts.MORNING++;
      else if (hour >= 12 && hour < 18) timeCounts.AFTERNOON++;
      else if (hour >= 18 && hour < 22) timeCounts.EVENING++;
      else timeCounts.NIGHT++;
    });

    const maxTime = Object.entries(timeCounts).reduce(
      (max, [time, count]) =>
        count > timeCounts[max as keyof typeof timeCounts] ? time : max,
      "MORNING"
    );

    const timeMap = {
      MORNING: "Mañana (6-12h)",
      AFTERNOON: "Tarde (12-18h)",
      EVENING: "Noche (18-22h)",
      NIGHT: "Madrugada (22-6h)",
    };

    return timeMap[maxTime as keyof typeof timeMap];
  }

  private calculateAverageBasketSize(sales: Sale[]): number {
    if (sales.length === 0) return 0;

    const totalItems = sales.reduce(
      (sum, sale) =>
        sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
      0
    );

    return totalItems / sales.length;
  }

  private analyzeSeasonalTrends(sales: Sale[]): string[] {
    const seasonalCounts = { SPRING: 0, SUMMER: 0, FALL: 0, WINTER: 0 };

    sales.forEach((sale) => {
      const month = new Date(sale.createdAt).getMonth();
      if (month >= 2 && month <= 4) seasonalCounts.SPRING++;
      else if (month >= 5 && month <= 7) seasonalCounts.SUMMER++;
      else if (month >= 8 && month <= 10) seasonalCounts.FALL++;
      else seasonalCounts.WINTER++;
    });

    const trends: string[] = [];
    const entries = Object.entries(seasonalCounts);
    const maxCount = Math.max(...entries.map(([, count]) => count));

    entries.forEach(([season, count]) => {
      if (count > maxCount * 0.7) {
        const seasonMap = {
          SPRING: "Primavera",
          SUMMER: "Verano",
          FALL: "Otoño",
          WINTER: "Invierno",
        };
        trends.push(seasonMap[season as keyof typeof seasonMap]);
      }
    });

    return trends;
  }

  private calculateLoyaltyScore(customer: Customer, sales: Sale[]): number {
    let score = 0;

    // Frequency score (0-40 points)
    const daysSinceFirstSale = customer.createdAt
      ? (Date.now() - customer.createdAt) / (1000 * 60 * 60 * 24)
      : 0;
    const frequency = sales.length / Math.max(daysSinceFirstSale / 30, 1);
    score += Math.min(40, frequency * 10);

    // Recency score (0-30 points)
    const daysSinceLastSale = customer.lastPurchaseDate
      ? (Date.now() - customer.lastPurchaseDate) / (1000 * 60 * 60 * 24)
      : 999;
    score += Math.max(0, 30 - daysSinceLastSale);

    // Value score (0-30 points)
    const avgOrderValue = customer.averageOrderValue;
    score += Math.min(30, avgOrderValue / 10);

    return Math.min(100, Math.max(0, score));
  }

  private analyzePriceSensitivity(sales: Sale[]): "LOW" | "MEDIUM" | "HIGH" {
    if (sales.length < 3) return "MEDIUM";

    // Analyze price variations in purchases
    const prices = sales.flatMap((sale) =>
      sale.items.map((item) => item.unitPrice)
    );
    const avgPrice =
      prices.reduce((sum, price) => sum + price, 0) / prices.length;
    const variance =
      prices.reduce((sum, price) => sum + Math.pow(price - avgPrice, 2), 0) /
      prices.length;
    const coefficient = Math.sqrt(variance) / avgPrice;

    if (coefficient < 0.1) return "LOW";
    if (coefficient < 0.3) return "MEDIUM";
    return "HIGH";
  }

  private determineCommunicationStyle(
    customer: Customer,
    sales: Sale[]
  ): "FORMAL" | "CASUAL" | "TECHNICAL" {
    // Simple heuristic based on customer data
    if (customer.email && customer.email.includes("@")) {
      // Check if customer has company info (you might need to add this field to Customer type)
      return "FORMAL";
    }
    return "CASUAL";
  }

  private predictNextPurchase(sales: Sale[]): number | undefined {
    if (sales.length < 2) return undefined;

    const intervals = [];
    for (let i = 1; i < sales.length; i++) {
      const interval = sales[i].createdAt - sales[i - 1].createdAt;
      intervals.push(interval);
    }

    const avgInterval =
      intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    const lastSale = Math.max(...sales.map((s) => s.createdAt));

    return lastSale + avgInterval;
  }

  private calculateChurnRisk(customer: Customer, sales: Sale[]): ChurnRisk {
    if (sales.length === 0) return "CRITICO";

    const daysSinceLastSale = customer.lastPurchaseDate
      ? (Date.now() - customer.lastPurchaseDate) / (1000 * 60 * 60 * 24)
      : 999;

    const avgInterval =
      sales.length > 1
        ? (sales[sales.length - 1].createdAt - sales[0].createdAt) /
          (sales.length - 1) /
          (1000 * 60 * 60 * 24)
        : 30;

    const riskRatio = daysSinceLastSale / avgInterval;

    if (riskRatio > 3) return "CRITICO";
    if (riskRatio > 2) return "ALTO";
    if (riskRatio > 1.5) return "MEDIO";
    return "BAJO";
  }

  private calculateLifetimeValue(customer: Customer, sales: Sale[]): number {
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
    const monthsActive = customer.createdAt
      ? (Date.now() - customer.createdAt) / (1000 * 60 * 60 * 24 * 30)
      : 1;

    return totalRevenue / Math.max(monthsActive, 1);
  }

  private generateRecommendedActions(
    customer: Customer,
    sales: Sale[],
    churnRisk: ChurnRisk
  ): string[] {
    const actions = [];

    if (churnRisk === "CRITICO" || churnRisk === "ALTO") {
      actions.push("Contactar inmediatamente");
      actions.push("Ofrecer descuento especial");
      actions.push("Enviar encuesta de satisfacción");
    }

    if (sales.length === 0) {
      actions.push("Incentivar primera compra");
      actions.push("Enviar catálogo de productos");
    }

    if (customer.segment === "VIP") {
      actions.push("Programa de fidelización premium");
      actions.push("Acceso anticipado a nuevos productos");
    }

    if (sales.length > 5) {
      actions.push("Programa de referidos");
      actions.push("Ofertas personalizadas");
    }

    return actions;
  }

  private calculateAverageOrderValue(sales: Sale[]): number {
    if (sales.length === 0) return 0;
    return sales.reduce((sum, sale) => sum + sale.total, 0) / sales.length;
  }

  private calculateAverageFrequency(
    customers: Customer[],
    sales: Sale[]
  ): number {
    if (customers.length === 0) return 0;

    const customerFrequencies = customers.map((customer) => {
      const customerSales = sales.filter(
        (sale) => sale.customerId === customer.id
      );
      const daysActive = customer.createdAt
        ? (Date.now() - customer.createdAt) / (1000 * 60 * 60 * 24)
        : 1;
      return customerSales.length / Math.max(daysActive / 30, 1);
    });

    return (
      customerFrequencies.reduce((sum, freq) => sum + freq, 0) /
      customers.length
    );
  }

  private calculateChurnRate(customers: Customer[], sales: Sale[]): number {
    if (customers.length === 0) return 0;

    const churnedCustomers = customers.filter((customer) => {
      const daysSinceLastSale = customer.lastPurchaseDate
        ? (Date.now() - customer.lastPurchaseDate) / (1000 * 60 * 60 * 24)
        : 999;
      return daysSinceLastSale > 90; // Consider churned if no purchase in 90 days
    });

    return (churnedCustomers.length / customers.length) * 100;
  }

  private calculateGrowthPotential(
    segment: CustomerSegment,
    customers: Customer[]
  ): number {
    const segmentGrowthMap = {
      NUEVO: 90,
      OCASIONAL: 70,
      FRECUENTE: 50,
      VIP: 30,
      INACTIVO: 10,
    };

    return segmentGrowthMap[segment] || 50;
  }

  private getSegmentCharacteristics(
    segment: CustomerSegment,
    customers: Customer[],
    sales: Sale[]
  ): string[] {
    const characteristics = {
      VIP: ["Alto valor de compra", "Frecuencia alta", "Lealtad establecida"],
      FRECUENTE: ["Compra regular", "Valor medio", "Potencial de crecimiento"],
      OCASIONAL: [
        "Compra esporádica",
        "Oportunidad de fidelización",
        "Necesita incentivos",
      ],
      NUEVO: [
        "Primera compra reciente",
        "Alto potencial",
        "Requiere seguimiento",
      ],
      INACTIVO: [
        "Sin actividad reciente",
        "Riesgo de churn",
        "Necesita reactivación",
      ],
    };

    return characteristics[segment] || [];
  }

  private getRecommendedStrategies(
    segment: CustomerSegment,
    customers: Customer[],
    sales: Sale[]
  ): string[] {
    const strategies = {
      VIP: ["Programa premium", "Acceso exclusivo", "Servicio personalizado"],
      FRECUENTE: [
        "Programa de puntos",
        "Ofertas personalizadas",
        "Cross-selling",
      ],
      OCASIONAL: [
        "Campañas de reactivación",
        "Descuentos atractivos",
        "Recordatorios",
      ],
      NUEVO: ["Onboarding", "Primera compra gratis", "Seguimiento cercano"],
      INACTIVO: [
        "Campaña de win-back",
        "Ofertas especiales",
        "Encuesta de satisfacción",
      ],
    };

    return strategies[segment] || [];
  }

  private generateIndividualInsights(
    behavior: CustomerBehaviorAnalysis
  ): CustomerInsight[] {
    const insights: CustomerInsight[] = [];

    if (behavior.churnRisk === "CRITICO" || behavior.churnRisk === "ALTO") {
      insights.push({
        type: "RISK",
        title: "Riesgo de Pérdida de Cliente",
        description: `Cliente ${
          behavior.customerName
        } tiene un riesgo ${behavior.churnRisk.toLowerCase()} de churn`,
        priority: "CRITICAL",
        actionRequired: true,
        suggestedAction: "Contactar inmediatamente con oferta especial",
        impact: 80,
      });
    }

    if (behavior.loyaltyScore > 80) {
      insights.push({
        type: "OPPORTUNITY",
        title: "Cliente de Alto Valor",
        description: `Cliente con score de lealtad ${behavior.loyaltyScore}/100`,
        priority: "HIGH",
        actionRequired: false,
        suggestedAction: "Incluir en programa VIP",
        impact: 70,
      });
    }

    if (
      behavior.nextPurchasePrediction &&
      behavior.nextPurchasePrediction < Date.now() + 7 * 24 * 60 * 60 * 1000
    ) {
      insights.push({
        type: "OPPORTUNITY",
        title: "Compra Próxima Esperada",
        description:
          "Cliente probablemente realizará compra en los próximos 7 días",
        priority: "MEDIUM",
        actionRequired: false,
        suggestedAction: "Enviar ofertas relevantes",
        impact: 60,
      });
    }

    return insights;
  }

  private generateGlobalInsights(): CustomerInsight[] {
    const insights: CustomerInsight[] = [];

    // Analyze overall customer health
    const totalCustomers = this.customers.length;
    const activeCustomers = this.customers.filter(
      (c) =>
        c.lastPurchaseDate &&
        Date.now() - c.lastPurchaseDate < 90 * 24 * 60 * 60 * 1000
    ).length;

    const activityRate = (activeCustomers / totalCustomers) * 100;

    if (activityRate < 50) {
      insights.push({
        type: "RISK",
        title: "Baja Actividad de Clientes",
        description: `Solo ${activityRate.toFixed(
          1
        )}% de clientes activos en los últimos 90 días`,
        priority: "HIGH",
        actionRequired: true,
        suggestedAction: "Implementar campaña de reactivación",
        impact: 85,
      });
    }

    return insights;
  }
}

// Singleton instance
export const customerIntelligence = new CustomerIntelligenceEngine();
