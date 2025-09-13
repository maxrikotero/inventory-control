import { Sale, SalesAnalytics } from "@/types/sales";
import { Product } from "@/types/product";
import { listSales } from "@/lib/sales";
import { listProducts } from "@/lib/products";
import * as tf from "@tensorflow/tfjs";

// Types for predictive analytics
export type SalesForecast = {
  period: string;
  predictedSales: number;
  confidence: number;
  factors: string[];
  trend: "INCREASING" | "DECREASING" | "STABLE";
};

export type DemandPrediction = {
  productId: string;
  productName: string;
  predictedDemand: number;
  confidence: number;
  recommendedStock: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  factors: string[];
};

export type SeasonalPattern = {
  productId: string;
  productName: string;
  pattern: {
    [season: string]: number;
  };
  peakSeason: string;
  lowSeason: string;
  seasonality: number; // 0-1, how seasonal the product is
};

// Predictive analytics engine
export class PredictiveAnalyticsEngine {
  private salesData: Sale[] = [];
  private products: Product[] = [];
  private isInitialized = false;
  private model: tf.LayersModel | null = null;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const [sales, products] = await Promise.all([
        listSales(1000),
        listProducts(),
      ]);

      this.salesData = sales;
      this.products = products;
      this.isInitialized = true;
    } catch (error) {
      console.error("Error initializing predictive analytics:", error);
    }
  }

  // Predict sales for the next period using time series analysis
  async predictSales(periods: number = 7): Promise<SalesForecast[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const forecasts: SalesForecast[] = [];

    // Group sales by day
    const dailySales = this.groupSalesByDay();
    const salesValues = Array.from(dailySales.values());

    if (salesValues.length < 7) {
      // Not enough data for prediction
      return forecasts;
    }

    // Simple moving average prediction
    for (let i = 0; i < periods; i++) {
      const recentSales = salesValues.slice(-7); // Last 7 days
      const average =
        recentSales.reduce((sum, val) => sum + val, 0) / recentSales.length;

      // Add some trend analysis
      const trend = this.calculateTrend(salesValues.slice(-14));
      const predictedValue = average * (1 + trend * 0.1);

      const date = new Date();
      date.setDate(date.getDate() + i + 1);

      forecasts.push({
        period: date.toISOString().split("T")[0],
        predictedSales: Math.max(0, predictedValue),
        confidence: Math.max(0.3, 1 - i * 0.1), // Confidence decreases over time
        factors: this.getSalesFactors(),
        trend:
          trend > 0.1 ? "INCREASING" : trend < -0.1 ? "DECREASING" : "STABLE",
      });
    }

    return forecasts;
  }

  // Predict demand for specific products
  async predictProductDemand(
    productId: string,
    days: number = 30
  ): Promise<DemandPrediction> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const product = this.products.find((p) => p.id === productId);
    if (!product) {
      throw new Error("Product not found");
    }

    // Get historical sales for this product
    const productSales = this.salesData
      .flatMap((sale) => sale.items)
      .filter((item) => item.productId === productId);

    if (productSales.length === 0) {
      return {
        productId,
        productName: product.name,
        predictedDemand: 0,
        confidence: 0,
        recommendedStock: 0,
        riskLevel: "HIGH",
        factors: ["Sin datos históricos"],
      };
    }

    // Calculate average daily demand
    const totalQuantity = productSales.reduce(
      (sum, item) => sum + item.quantity,
      0
    );
    const salesDays = this.getUniqueSalesDays(productId);
    const averageDailyDemand = totalQuantity / Math.max(salesDays, 1);

    // Predict demand for the specified period
    const predictedDemand = averageDailyDemand * days;

    // Calculate confidence based on data consistency
    const confidence = Math.min(0.9, Math.max(0.3, productSales.length / 10));

    // Determine risk level
    const riskLevel = this.calculateDemandRisk(
      product,
      predictedDemand,
      confidence
    );

    // Calculate recommended stock (with safety buffer)
    const safetyBuffer =
      riskLevel === "HIGH" ? 1.5 : riskLevel === "MEDIUM" ? 1.2 : 1.1;
    const recommendedStock = Math.ceil(predictedDemand * safetyBuffer);

    return {
      productId,
      productName: product.name,
      predictedDemand,
      confidence,
      recommendedStock,
      riskLevel,
      factors: this.getDemandFactors(product, productSales),
    };
  }

  // Analyze seasonal patterns
  async analyzeSeasonalPatterns(): Promise<SeasonalPattern[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const patterns: SeasonalPattern[] = [];

    this.products.forEach((product) => {
      const productSales = this.salesData
        .flatMap((sale) => sale.items)
        .filter((item) => item.productId === product.id);

      if (productSales.length < 4) return; // Need at least some data

      // Group sales by season
      const seasonalData = this.groupSalesBySeason(productSales);

      // Calculate seasonality
      const values = Object.values(seasonalData);
      const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
      const variance =
        values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
        values.length;
      const seasonality = Math.min(1, Math.sqrt(variance) / mean);

      // Find peak and low seasons
      const entries = Object.entries(seasonalData);
      const peakSeason = entries.reduce(
        (max, [season, value]) => (value > seasonalData[max] ? season : max),
        entries[0][0]
      );
      const lowSeason = entries.reduce(
        (min, [season, value]) => (value < seasonalData[min] ? season : min),
        entries[0][0]
      );

      patterns.push({
        productId: product.id,
        productName: product.name,
        pattern: seasonalData,
        peakSeason,
        lowSeason,
        seasonality,
      });
    });

    return patterns.sort((a, b) => b.seasonality - a.seasonality);
  }

  // Predict optimal pricing using simple demand elasticity
  async predictOptimalPricing(productId: string): Promise<{
    currentPrice: number;
    suggestedPrice: number;
    expectedDemandChange: number;
    expectedRevenueChange: number;
    confidence: number;
  }> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const product = this.products.find((p) => p.id === productId);
    if (!product) {
      throw new Error("Product not found");
    }

    const productSales = this.salesData
      .flatMap((sale) => sale.items)
      .filter((item) => item.productId === productId);

    if (productSales.length < 5) {
      return {
        currentPrice: product.unitPrice,
        suggestedPrice: product.unitPrice,
        expectedDemandChange: 0,
        expectedRevenueChange: 0,
        confidence: 0,
      };
    }

    // Simple price elasticity calculation
    const avgQuantity =
      productSales.reduce((sum, item) => sum + item.quantity, 0) /
      productSales.length;
    const avgPrice =
      productSales.reduce((sum, item) => sum + item.unitPrice, 0) /
      productSales.length;

    // Estimate elasticity (simplified)
    const elasticity = -0.5; // Assume moderate elasticity
    const priceChange = 0.1; // 10% price change
    const demandChange = elasticity * priceChange;

    const suggestedPrice = avgPrice * (1 + priceChange);
    const expectedDemand = avgQuantity * (1 + demandChange);
    const expectedRevenue = suggestedPrice * expectedDemand;
    const currentRevenue = avgPrice * avgQuantity;

    return {
      currentPrice: avgPrice,
      suggestedPrice,
      expectedDemandChange: demandChange * 100,
      expectedRevenueChange:
        ((expectedRevenue - currentRevenue) / currentRevenue) * 100,
      confidence: Math.min(0.7, productSales.length / 20),
    };
  }

  // Helper methods
  private groupSalesByDay(): Map<string, number> {
    const dailySales = new Map<string, number>();

    this.salesData.forEach((sale) => {
      const date = new Date(sale.createdAt).toISOString().split("T")[0];
      const total = sale.items.reduce((sum, item) => sum + item.quantity, 0);
      const current = dailySales.get(date) || 0;
      dailySales.set(date, current + total);
    });

    return dailySales;
  }

  private getUniqueSalesDays(productId: string): number {
    const salesDays = new Set<string>();

    this.salesData.forEach((sale) => {
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

  private groupSalesBySeason(productSales: any[]): {
    [season: string]: number;
  } {
    const seasonalData: { [season: string]: number } = {
      SPRING: 0,
      SUMMER: 0,
      FALL: 0,
      WINTER: 0,
    };

    productSales.forEach((sale) => {
      const saleDate = new Date(sale.createdAt || Date.now());
      const season = this.getSeason(saleDate);
      seasonalData[season] += sale.quantity || 1;
    });

    return seasonalData;
  }

  private getSeason(date: Date): string {
    const month = date.getMonth();
    if (month >= 2 && month <= 4) return "SPRING";
    if (month >= 5 && month <= 7) return "SUMMER";
    if (month >= 8 && month <= 10) return "FALL";
    return "WINTER";
  }

  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;

    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));

    const firstAvg =
      firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg =
      secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;

    return (secondAvg - firstAvg) / firstAvg;
  }

  private calculateDemandRisk(
    product: Product,
    predictedDemand: number,
    confidence: number
  ): "LOW" | "MEDIUM" | "HIGH" {
    const stockRatio = product.stockAvailable / Math.max(predictedDemand, 1);

    if (confidence < 0.5 || stockRatio < 0.5) return "HIGH";
    if (confidence < 0.7 || stockRatio < 1) return "MEDIUM";
    return "LOW";
  }

  private getSalesFactors(): string[] {
    const factors = [];

    // Analyze recent trends
    const recentSales = this.salesData.filter(
      (sale) => Date.now() - sale.createdAt < 7 * 24 * 60 * 60 * 1000
    );

    if (recentSales.length > 0) {
      factors.push("Ventas recientes positivas");
    }

    // Add more sophisticated factor analysis here
    factors.push("Patrón estacional");
    factors.push("Tendencias del mercado");

    return factors;
  }

  private getDemandFactors(product: Product, productSales: any[]): string[] {
    const factors = [];

    if (productSales.length > 10) {
      factors.push("Datos históricos sólidos");
    }

    if (product.stockAvailable < 10) {
      factors.push("Stock bajo - alta demanda esperada");
    }

    if (product.minStock && product.stockAvailable <= product.minStock) {
      factors.push("Alerta de stock mínimo");
    }

    return factors;
  }

  // Get comprehensive analytics dashboard data
  async getAnalyticsDashboard(): Promise<{
    salesForecast: SalesForecast[];
    topDemandPredictions: DemandPrediction[];
    seasonalInsights: SeasonalPattern[];
    pricingInsights: Array<{
      productId: string;
      productName: string;
      currentPrice: number;
      suggestedPrice: number;
      expectedRevenueChange: number;
    }>;
  }> {
    const [salesForecast, seasonalInsights] = await Promise.all([
      this.predictSales(7),
      this.analyzeSeasonalPatterns(),
    ]);

    // Get demand predictions for top products
    const topProducts = this.products
      .filter((p) => p.stockAvailable > 0)
      .slice(0, 10);

    const topDemandPredictions = await Promise.all(
      topProducts.map((product) => this.predictProductDemand(product.id, 30))
    );

    // Get pricing insights for products with good sales history
    const pricingInsights = await Promise.all(
      topProducts.map(async (product) => {
        const pricing = await this.predictOptimalPricing(product.id);
        return {
          productId: product.id,
          productName: product.name,
          currentPrice: pricing.currentPrice,
          suggestedPrice: pricing.suggestedPrice,
          expectedRevenueChange: pricing.expectedRevenueChange,
        };
      })
    );

    return {
      salesForecast,
      topDemandPredictions,
      seasonalInsights: seasonalInsights.slice(0, 5),
      pricingInsights: pricingInsights.filter(
        (p) => p.expectedRevenueChange > 0
      ),
    };
  }
}

// Singleton instance
export const predictiveAnalytics = new PredictiveAnalyticsEngine();
