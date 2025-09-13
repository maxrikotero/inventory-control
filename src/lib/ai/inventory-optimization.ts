import { Product } from "@/types/product";
import { Sale } from "@/types/sales";
import { listProducts } from "@/lib/products";
import { listSales } from "@/lib/sales";

// Types for inventory optimization
export type OptimizationRecommendation = {
  productId: string;
  productName: string;
  currentStock: number;
  recommendedStock: number;
  action: "INCREASE" | "DECREASE" | "MAINTAIN";
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  reason: string;
  expectedImpact: number; // 0-100
  costBenefit: {
    cost: number;
    benefit: number;
    roi: number;
  };
  confidence: number;
};

export type InventoryAlert = {
  id: string;
  type:
    | "LOW_STOCK"
    | "OVERSTOCK"
    | "DEAD_STOCK"
    | "SEASONAL_ADJUSTMENT"
    | "DEMAND_SPIKE";
  productId: string;
  productName: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  message: string;
  recommendedAction: string;
  estimatedLoss: number;
  timestamp: number;
};

export type OptimizationReport = {
  totalRecommendations: number;
  criticalAlerts: number;
  potentialSavings: number;
  potentialRevenue: number;
  recommendations: OptimizationRecommendation[];
  alerts: InventoryAlert[];
  summary: {
    overstockedItems: number;
    understockedItems: number;
    deadStockItems: number;
    seasonalAdjustments: number;
  };
};

// Inventory optimization engine
export class InventoryOptimizationEngine {
  private products: Product[] = [];
  private sales: Sale[] = [];
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const [products, sales] = await Promise.all([
        listProducts(),
        listSales(1000),
      ]);

      this.products = products;
      this.sales = sales;
      this.isInitialized = true;
    } catch (error) {
      console.error("Error initializing inventory optimization:", error);
    }
  }

  // Generate comprehensive optimization report
  async generateOptimizationReport(): Promise<OptimizationReport> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const recommendations = await this.generateRecommendations();
    const alerts = await this.generateAlerts();

    const criticalAlerts = alerts.filter(
      (alert) => alert.severity === "CRITICAL"
    ).length;
    const potentialSavings = recommendations.reduce(
      (sum, rec) => sum + rec.costBenefit.benefit,
      0
    );
    const potentialRevenue = recommendations.reduce(
      (sum, rec) => sum + rec.expectedImpact,
      0
    );

    const summary = {
      overstockedItems: recommendations.filter((r) => r.action === "DECREASE")
        .length,
      understockedItems: recommendations.filter((r) => r.action === "INCREASE")
        .length,
      deadStockItems: alerts.filter((a) => a.type === "DEAD_STOCK").length,
      seasonalAdjustments: alerts.filter(
        (a) => a.type === "SEASONAL_ADJUSTMENT"
      ).length,
    };

    return {
      totalRecommendations: recommendations.length,
      criticalAlerts,
      potentialSavings,
      potentialRevenue,
      recommendations,
      alerts,
      summary,
    };
  }

  // Generate optimization recommendations
  private async generateRecommendations(): Promise<
    OptimizationRecommendation[]
  > {
    const recommendations: OptimizationRecommendation[] = [];

    for (const product of this.products) {
      const recommendation = await this.analyzeProduct(product);
      if (recommendation) {
        recommendations.push(recommendation);
      }
    }

    return recommendations.sort((a, b) => b.priority.localeCompare(a.priority));
  }

  // Analyze individual product for optimization
  private async analyzeProduct(
    product: Product
  ): Promise<OptimizationRecommendation | null> {
    const salesData = this.getProductSalesData(product.id);
    const demandAnalysis = this.analyzeDemand(product, salesData);
    const stockAnalysis = this.analyzeStockLevels(product, demandAnalysis);

    if (!stockAnalysis.needsOptimization) {
      return null;
    }

    const action = this.determineAction(product, stockAnalysis);
    const priority = this.calculatePriority(product, stockAnalysis);
    const reason = this.generateReason(product, stockAnalysis, demandAnalysis);
    const expectedImpact = this.calculateExpectedImpact(
      product,
      action,
      stockAnalysis
    );
    const costBenefit = this.calculateCostBenefit(
      product,
      action,
      stockAnalysis
    );
    const confidence = this.calculateConfidence(product, salesData);

    return {
      productId: product.id,
      productName: product.name,
      currentStock: product.stockAvailable,
      recommendedStock: stockAnalysis.recommendedStock,
      action,
      priority,
      reason,
      expectedImpact,
      costBenefit,
      confidence,
    };
  }

  // Get sales data for a product
  private getProductSalesData(productId: string): any[] {
    return this.sales
      .flatMap((sale) => sale.items)
      .filter((item) => item.productId === productId);
  }

  // Analyze demand patterns
  private analyzeDemand(
    product: Product,
    salesData: any[]
  ): {
    averageDailyDemand: number;
    demandVolatility: number;
    seasonalPattern: string;
    trend: "INCREASING" | "DECREASING" | "STABLE";
    leadTime: number;
  } {
    if (salesData.length === 0) {
      return {
        averageDailyDemand: 0,
        demandVolatility: 0,
        seasonalPattern: "NONE",
        trend: "STABLE",
        leadTime: 7, // Default lead time
      };
    }

    // Calculate average daily demand
    const totalQuantity = salesData.reduce(
      (sum, item) => sum + item.quantity,
      0
    );
    const daysWithSales = this.getUniqueSalesDays(product.id);
    const averageDailyDemand = totalQuantity / Math.max(daysWithSales, 1);

    // Calculate demand volatility
    const quantities = salesData.map((item) => item.quantity);
    const mean = quantities.reduce((sum, q) => sum + q, 0) / quantities.length;
    const variance =
      quantities.reduce((sum, q) => sum + Math.pow(q - mean, 2), 0) /
      quantities.length;
    const demandVolatility = Math.sqrt(variance) / mean;

    // Determine trend
    const recentSales = salesData.slice(-10);
    const olderSales = salesData.slice(-20, -10);
    const recentAvg =
      recentSales.reduce((sum, item) => sum + item.quantity, 0) /
      recentSales.length;
    const olderAvg =
      olderSales.reduce((sum, item) => sum + item.quantity, 0) /
      olderSales.length;

    let trend: "INCREASING" | "DECREASING" | "STABLE";
    if (recentAvg > olderAvg * 1.1) {
      trend = "INCREASING";
    } else if (recentAvg < olderAvg * 0.9) {
      trend = "DECREASING";
    } else {
      trend = "STABLE";
    }

    return {
      averageDailyDemand,
      demandVolatility,
      seasonalPattern: this.detectSeasonalPattern(salesData),
      trend,
      leadTime: this.estimateLeadTime(product),
    };
  }

  // Analyze stock levels
  private analyzeStockLevels(
    product: Product,
    demandAnalysis: any
  ): {
    needsOptimization: boolean;
    recommendedStock: number;
    stockoutRisk: number;
    overstockRisk: number;
    optimalReorderPoint: number;
  } {
    const { averageDailyDemand, demandVolatility, leadTime } = demandAnalysis;

    // Calculate safety stock
    const safetyStock = Math.ceil(
      averageDailyDemand * leadTime * (1 + demandVolatility)
    );

    // Calculate optimal stock level
    const optimalStock = Math.ceil(averageDailyDemand * (leadTime + 30)); // 30 days of demand
    const recommendedStock = Math.max(safetyStock, optimalStock);

    // Calculate risks
    const stockoutRisk =
      product.stockAvailable < safetyStock
        ? Math.min(1, (safetyStock - product.stockAvailable) / safetyStock)
        : 0;

    const overstockRisk =
      product.stockAvailable > recommendedStock * 1.5
        ? Math.min(
            1,
            (product.stockAvailable - recommendedStock * 1.5) / recommendedStock
          )
        : 0;

    // Calculate reorder point
    const optimalReorderPoint = Math.ceil(
      averageDailyDemand * leadTime + safetyStock
    );

    const needsOptimization =
      stockoutRisk > 0.3 ||
      overstockRisk > 0.3 ||
      Math.abs(product.stockAvailable - recommendedStock) >
        recommendedStock * 0.2;

    return {
      needsOptimization,
      recommendedStock,
      stockoutRisk,
      overstockRisk,
      optimalReorderPoint,
    };
  }

  // Determine optimization action
  private determineAction(
    product: Product,
    stockAnalysis: any
  ): "INCREASE" | "DECREASE" | "MAINTAIN" {
    const { stockoutRisk, overstockRisk, recommendedStock } = stockAnalysis;

    if (stockoutRisk > 0.5) {
      return "INCREASE";
    } else if (overstockRisk > 0.5) {
      return "DECREASE";
    } else if (
      Math.abs(product.stockAvailable - recommendedStock) >
      recommendedStock * 0.2
    ) {
      return product.stockAvailable < recommendedStock
        ? "INCREASE"
        : "DECREASE";
    }

    return "MAINTAIN";
  }

  // Calculate priority level
  private calculatePriority(
    product: Product,
    stockAnalysis: any
  ): "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" {
    const { stockoutRisk, overstockRisk } = stockAnalysis;
    const maxRisk = Math.max(stockoutRisk, overstockRisk);

    if (maxRisk > 0.8) return "CRITICAL";
    if (maxRisk > 0.6) return "HIGH";
    if (maxRisk > 0.4) return "MEDIUM";
    return "LOW";
  }

  // Generate reason for recommendation
  private generateReason(
    product: Product,
    stockAnalysis: any,
    demandAnalysis: any
  ): string {
    const { stockoutRisk, overstockRisk, recommendedStock } = stockAnalysis;
    const { trend, averageDailyDemand } = demandAnalysis;

    if (stockoutRisk > 0.5) {
      return `Alto riesgo de agotamiento (${Math.round(
        stockoutRisk * 100
      )}%). Demanda promedio: ${averageDailyDemand.toFixed(1)} unidades/día`;
    } else if (overstockRisk > 0.5) {
      return `Exceso de inventario (${Math.round(
        overstockRisk * 100
      )}%). Stock actual: ${
        product.stockAvailable
      }, recomendado: ${recommendedStock}`;
    } else if (trend === "INCREASING") {
      return `Demanda en aumento. Ajustar stock para evitar desabastecimiento`;
    } else if (trend === "DECREASING") {
      return `Demanda en disminución. Reducir stock para evitar obsolescencia`;
    }

    return `Optimización de niveles de stock para mejorar eficiencia`;
  }

  // Calculate expected impact
  private calculateExpectedImpact(
    product: Product,
    action: string,
    stockAnalysis: any
  ): number {
    const { stockoutRisk, overstockRisk } = stockAnalysis;

    if (action === "INCREASE") {
      return Math.round(stockoutRisk * 100); // Percentage of stockout risk reduction
    } else if (action === "DECREASE") {
      return Math.round(overstockRisk * 80); // Percentage of overstock reduction
    }

    return 50; // Default impact for maintain
  }

  // Calculate cost-benefit analysis
  private calculateCostBenefit(
    product: Product,
    action: string,
    stockAnalysis: any
  ): {
    cost: number;
    benefit: number;
    roi: number;
  } {
    const { recommendedStock } = stockAnalysis;
    const stockDifference = Math.abs(recommendedStock - product.stockAvailable);
    const unitCost = product.unitPrice * 0.3; // Assume 30% of price is cost

    let cost = 0;
    let benefit = 0;

    if (action === "INCREASE") {
      cost = stockDifference * unitCost;
      benefit = stockDifference * product.unitPrice * 0.1; // 10% margin
    } else if (action === "DECREASE") {
      cost = 0; // No cost to reduce stock
      benefit = stockDifference * unitCost * 0.8; // 80% of cost recovered
    }

    const roi = cost > 0 ? ((benefit - cost) / cost) * 100 : 0;

    return { cost, benefit, roi };
  }

  // Calculate confidence level
  private calculateConfidence(product: Product, salesData: any[]): number {
    const dataPoints = salesData.length;
    const daysWithSales = this.getUniqueSalesDays(product.id);

    // Higher confidence with more data
    let confidence = Math.min(0.9, dataPoints / 20);

    // Adjust based on sales frequency
    if (daysWithSales > 30) {
      confidence += 0.1;
    }

    return Math.min(0.95, confidence);
  }

  // Generate inventory alerts
  private async generateAlerts(): Promise<InventoryAlert[]> {
    const alerts: InventoryAlert[] = [];

    for (const product of this.products) {
      const productAlerts = await this.generateProductAlerts(product);
      alerts.push(...productAlerts);
    }

    return alerts.sort((a, b) => b.severity.localeCompare(a.severity));
  }

  // Generate alerts for a specific product
  private async generateProductAlerts(
    product: Product
  ): Promise<InventoryAlert[]> {
    const alerts: InventoryAlert[] = [];
    const salesData = this.getProductSalesData(product.id);

    // Low stock alert
    if (product.stockAvailable <= (product.minStock || 0)) {
      alerts.push({
        id: `low-stock-${product.id}`,
        type: "LOW_STOCK",
        productId: product.id,
        productName: product.name,
        severity: "CRITICAL",
        message: `Stock crítico: ${product.stockAvailable} unidades restantes`,
        recommendedAction: "Reabastecer inmediatamente",
        estimatedLoss: product.unitPrice * 10, // Estimate potential lost sales
        timestamp: Date.now(),
      });
    }

    // Overstock alert
    const demandAnalysis = this.analyzeDemand(product, salesData);
    const optimalStock = Math.ceil(demandAnalysis.averageDailyDemand * 60); // 60 days of demand

    if (product.stockAvailable > optimalStock * 2) {
      alerts.push({
        id: `overstock-${product.id}`,
        type: "OVERSTOCK",
        productId: product.id,
        productName: product.name,
        severity: "HIGH",
        message: `Exceso de inventario: ${product.stockAvailable} unidades (óptimo: ${optimalStock})`,
        recommendedAction: "Reducir stock o aplicar descuentos",
        estimatedLoss:
          (product.stockAvailable - optimalStock) * product.unitPrice * 0.1,
        timestamp: Date.now(),
      });
    }

    // Dead stock alert
    const daysSinceLastSale = this.getDaysSinceLastSale(product.id);
    if (daysSinceLastSale > 90 && product.stockAvailable > 0) {
      alerts.push({
        id: `dead-stock-${product.id}`,
        type: "DEAD_STOCK",
        productId: product.id,
        productName: product.name,
        severity: "MEDIUM",
        message: `Stock inactivo: ${daysSinceLastSale} días sin ventas`,
        recommendedAction: "Liquidar o donar stock",
        estimatedLoss: product.stockAvailable * product.unitPrice * 0.5,
        timestamp: Date.now(),
      });
    }

    return alerts;
  }

  // Helper methods
  private getUniqueSalesDays(productId: string): number {
    const salesDays = new Set<string>();

    this.sales.forEach((sale) => {
      const hasProduct = sale.items.some(
        (item) => item.productId === productId
      );
      if (hasProduct) {
        const date = new Date(sale.createdAt).toISOString().split("T")[0];
        salesDays.add(date);
      }
    });

    return salesDays.size;
  }

  private detectSeasonalPattern(salesData: any[]): string {
    // Simple seasonal pattern detection
    if (salesData.length < 12) return "NONE";

    // Group by month and analyze
    const monthlySales = new Map<number, number>();

    salesData.forEach((item) => {
      const month = new Date(item.createdAt || Date.now()).getMonth();
      monthlySales.set(month, (monthlySales.get(month) || 0) + item.quantity);
    });

    // Find peak and low months
    const values = Array.from(monthlySales.values());
    const max = Math.max(...values);
    const min = Math.min(...values);

    if (max > min * 2) {
      return "SEASONAL";
    }

    return "STABLE";
  }

  private estimateLeadTime(product: Product): number {
    // Simple lead time estimation based on product type
    // In a real system, this would come from supplier data
    return 7; // Default 7 days
  }

  private getDaysSinceLastSale(productId: string): number {
    const productSales = this.sales
      .filter((sale) => sale.items.some((item) => item.productId === productId))
      .sort((a, b) => b.createdAt - a.createdAt);

    if (productSales.length === 0) return 999;

    const lastSale = productSales[0];
    return (Date.now() - lastSale.createdAt) / (1000 * 60 * 60 * 24);
  }
}

// Singleton instance
export const inventoryOptimizationEngine = new InventoryOptimizationEngine();
