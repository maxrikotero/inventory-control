import { Product } from "@/types/product";
import { Sale } from "@/types/sales";
import { listProducts } from "@/lib/products";
import { listSales } from "@/lib/sales";

// Types for recommendation system
export type ProductRecommendation = {
  productId: string;
  productName: string;
  confidence: number;
  reason: string;
  type: "CROSS_SELL" | "UP_SELL" | "REPLACEMENT" | "TRENDING";
  expectedValue: number;
};

export type RecommendationContext = {
  customerId?: string;
  currentProducts: string[];
  customerHistory?: Sale[];
  season?: string;
  timeOfDay?: string;
};

// Product similarity matrix (will be built from sales data)
type ProductSimilarity = {
  [productId: string]: {
    [similarProductId: string]: number;
  };
};

// Recommendation engine class
export class RecommendationEngine {
  private productSimilarity: ProductSimilarity = {};
  private productStats: Map<string, ProductStats> = new Map();
  private isInitialized = false;

  // Initialize the recommendation engine with sales data
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const [products, sales] = await Promise.all([
        listProducts(),
        listSales(1000), // Get more sales for better recommendations
      ]);

      this.buildProductStats(products, sales);
      this.buildSimilarityMatrix(sales);
      this.isInitialized = true;
    } catch (error) {
      console.error("Error initializing recommendation engine:", error);
    }
  }

  // Build product statistics from sales data
  private buildProductStats(products: Product[], sales: Sale[]): void {
    const stats = new Map<string, ProductStats>();

    // Initialize stats for all products
    products.forEach((product) => {
      stats.set(product.id, {
        productId: product.id,
        totalSold: 0,
        totalRevenue: 0,
        averagePrice: product.unitPrice,
        frequency: 0,
        lastSold: 0,
        coOccurrences: new Map(),
        seasonalPattern: new Map(),
        timePattern: new Map(),
      });
    });

    // Calculate stats from sales
    sales.forEach((sale) => {
      const saleDate = new Date(sale.createdAt);
      const season = this.getSeason(saleDate);
      const timeOfDay = this.getTimeOfDay(saleDate);

      sale.items.forEach((item) => {
        const productStat = stats.get(item.productId);
        if (productStat) {
          productStat.totalSold += item.quantity;
          productStat.totalRevenue += item.total;
          productStat.frequency += 1;
          productStat.lastSold = Math.max(productStat.lastSold, sale.createdAt);

          // Track co-occurrences with other products in the same sale
          sale.items.forEach((otherItem) => {
            if (otherItem.productId !== item.productId) {
              const current =
                productStat.coOccurrences.get(otherItem.productId) || 0;
              productStat.coOccurrences.set(otherItem.productId, current + 1);
            }
          });

          // Track seasonal patterns
          const seasonCount = productStat.seasonalPattern.get(season) || 0;
          productStat.seasonalPattern.set(season, seasonCount + 1);

          // Track time patterns
          const timeCount = productStat.timePattern.get(timeOfDay) || 0;
          productStat.timePattern.set(timeOfDay, timeCount + 1);
        }
      });
    });

    this.productStats = stats;
  }

  // Build product similarity matrix using collaborative filtering
  private buildSimilarityMatrix(sales: Sale[]): void {
    const productIds = Array.from(this.productStats.keys());

    // Initialize similarity matrix
    productIds.forEach((id) => {
      this.productSimilarity[id] = {};
    });

    // Calculate Jaccard similarity between products
    productIds.forEach((productA) => {
      productIds.forEach((productB) => {
        if (productA !== productB) {
          const similarity = this.calculateJaccardSimilarity(
            productA,
            productB,
            sales
          );
          this.productSimilarity[productA][productB] = similarity;
        }
      });
    });
  }

  // Calculate Jaccard similarity between two products
  private calculateJaccardSimilarity(
    productA: string,
    productB: string,
    sales: Sale[]
  ): number {
    const customersA = new Set<string>();
    const customersB = new Set<string>();
    const customersBoth = new Set<string>();

    sales.forEach((sale) => {
      const hasA = sale.items.some((item) => item.productId === productA);
      const hasB = sale.items.some((item) => item.productId === productB);

      if (hasA) customersA.add(sale.customerId);
      if (hasB) customersB.add(sale.customerId);
      if (hasA && hasB) customersBoth.add(sale.customerId);
    });

    const intersection = customersBoth.size;
    const union = customersA.size + customersB.size - intersection;

    return union > 0 ? intersection / union : 0;
  }

  // Get product recommendations based on context
  async getRecommendations(
    context: RecommendationContext,
    limit: number = 5
  ): Promise<ProductRecommendation[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const recommendations: ProductRecommendation[] = [];

    // Cross-sell recommendations based on current products
    if (context.currentProducts.length > 0) {
      const crossSellRecs = await this.getCrossSellRecommendations(
        context.currentProducts
      );
      recommendations.push(...crossSellRecs);
    }

    // Customer-based recommendations
    if (context.customerId && context.customerHistory) {
      const customerRecs = await this.getCustomerBasedRecommendations(context);
      recommendations.push(...customerRecs);
    }

    // Trending products
    const trendingRecs = await this.getTrendingRecommendations(context);
    recommendations.push(...trendingRecs);

    // Remove duplicates and sort by confidence
    const uniqueRecs = this.removeDuplicateRecommendations(recommendations);
    return uniqueRecs
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, limit);
  }

  // Get cross-sell recommendations
  private async getCrossSellRecommendations(
    currentProducts: string[]
  ): Promise<ProductRecommendation[]> {
    const recommendations: ProductRecommendation[] = [];
    const products = await listProducts();

    currentProducts.forEach((productId) => {
      const similarities = this.productSimilarity[productId] || {};

      Object.entries(similarities).forEach(([similarProductId, similarity]) => {
        if (similarity > 0.1 && !currentProducts.includes(similarProductId)) {
          const product = products.find((p) => p.id === similarProductId);
          if (product) {
            const productStat = this.productStats.get(similarProductId);
            const expectedValue = productStat
              ? productStat.totalRevenue / productStat.frequency
              : product.unitPrice;

            recommendations.push({
              productId: similarProductId,
              productName: product.name,
              confidence: similarity,
              reason: `Frecuentemente comprado junto con ${
                products.find((p) => p.id === productId)?.name
              }`,
              type: "CROSS_SELL",
              expectedValue,
            });
          }
        }
      });
    });

    return recommendations;
  }

  // Get customer-based recommendations
  private async getCustomerBasedRecommendations(
    context: RecommendationContext
  ): Promise<ProductRecommendation[]> {
    const recommendations: ProductRecommendation[] = [];
    const products = await listProducts();

    if (!context.customerHistory || context.customerHistory.length === 0) {
      return recommendations;
    }

    // Analyze customer's purchase history
    const customerProducts = new Set<string>();

    context.customerHistory.forEach((sale) => {
      sale.items.forEach((item) => {
        customerProducts.add(item.productId);
        // You could add category analysis here if you have product categories
      });
    });

    // Find similar customers and their preferences
    const similarCustomers = await this.findSimilarCustomers(
      context.customerId!,
      context.customerHistory
    );

    similarCustomers.forEach(
      ({ customerId: similarCustomerId, similarity }) => {
        // Get products that similar customers bought but current customer hasn't
        // This is a simplified version - in a real system you'd have more customer data
        console.log(
          `Similar customer ${similarCustomerId} with similarity ${similarity}`
        );
      }
    );

    return recommendations;
  }

  // Get trending products
  private async getTrendingRecommendations(
    context: RecommendationContext
  ): Promise<ProductRecommendation[]> {
    const recommendations: ProductRecommendation[] = [];
    const products = await listProducts();

    // Get products with high recent sales
    const recentProducts = Array.from(this.productStats.values())
      .filter((stat) => {
        const daysSinceLastSold =
          (Date.now() - stat.lastSold) / (1000 * 60 * 60 * 24);
        return daysSinceLastSold <= 30; // Products sold in last 30 days
      })
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);

    recentProducts.forEach((stat) => {
      const product = products.find((p) => p.id === stat.productId);
      if (product && !context.currentProducts.includes(stat.productId)) {
        const confidence = Math.min(stat.frequency / 10, 1); // Normalize frequency to 0-1

        recommendations.push({
          productId: stat.productId,
          productName: product.name,
          confidence,
          reason: `Producto en tendencia - ${stat.frequency} ventas recientes`,
          type: "TRENDING",
          expectedValue: stat.totalRevenue / stat.frequency,
        });
      }
    });

    return recommendations;
  }

  // Find similar customers (simplified collaborative filtering)
  private async findSimilarCustomers(
    _customerId: string,
    _customerHistory: Sale[]
  ): Promise<Array<{ customerId: string; similarity: number }>> {
    // This is a simplified implementation
    // In a real system, you'd compare customer purchase patterns more thoroughly
    return [];
  }

  // Remove duplicate recommendations
  private removeDuplicateRecommendations(
    recommendations: ProductRecommendation[]
  ): ProductRecommendation[] {
    const seen = new Set<string>();
    return recommendations.filter((rec) => {
      if (seen.has(rec.productId)) {
        return false;
      }
      seen.add(rec.productId);
      return true;
    });
  }

  // Utility functions
  private getSeason(date: Date): string {
    const month = date.getMonth();
    if (month >= 2 && month <= 4) return "SPRING";
    if (month >= 5 && month <= 7) return "SUMMER";
    if (month >= 8 && month <= 10) return "FALL";
    return "WINTER";
  }

  private getTimeOfDay(date: Date): string {
    const hour = date.getHours();
    if (hour >= 6 && hour < 12) return "MORNING";
    if (hour >= 12 && hour < 18) return "AFTERNOON";
    if (hour >= 18 && hour < 22) return "EVENING";
    return "NIGHT";
  }

  // Get product insights
  async getProductInsights(productId: string): Promise<{
    popularity: number;
    trend: "INCREASING" | "DECREASING" | "STABLE";
    bestSellingPeriod: string;
    averageOrderValue: number;
    crossSellOpportunities: string[];
  }> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const stat = this.productStats.get(productId);
    if (!stat) {
      throw new Error("Product not found");
    }

    const popularity = Math.min(stat.frequency / 10, 1); // Normalize to 0-1

    // Determine trend (simplified)
    const trend =
      stat.frequency > 5
        ? "INCREASING"
        : stat.frequency > 2
        ? "STABLE"
        : "DECREASING";

    // Find best selling period
    let bestPeriod = "MORNING";
    let maxCount = 0;
    stat.timePattern.forEach((count, period) => {
      if (count > maxCount) {
        maxCount = count;
        bestPeriod = period;
      }
    });

    // Get cross-sell opportunities
    const crossSellOpportunities = Array.from(stat.coOccurrences.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([productId]) => productId);

    return {
      popularity,
      trend,
      bestSellingPeriod: bestPeriod,
      averageOrderValue: stat.totalRevenue / stat.frequency,
      crossSellOpportunities,
    };
  }
}

// Product statistics type
type ProductStats = {
  productId: string;
  totalSold: number;
  totalRevenue: number;
  averagePrice: number;
  frequency: number;
  lastSold: number;
  coOccurrences: Map<string, number>;
  seasonalPattern: Map<string, number>;
  timePattern: Map<string, number>;
};

// Singleton instance
export const recommendationEngine = new RecommendationEngine();
