import { Product } from "@/types/product";
import { Sale } from "@/types/sales";
import { listProducts } from "@/lib/products";
import { listSales } from "@/lib/sales";
import { mlEngine, MLInsight } from "@/lib/ai/ml-engine";

// Types for advanced reports
export type ReportType =
  | "INVENTORY_ANALYSIS"
  | "SALES_PERFORMANCE"
  | "CUSTOMER_ANALYTICS"
  | "PROFITABILITY"
  | "SEASONAL_TRENDS"
  | "ML_INSIGHTS"
  | "EXECUTIVE_SUMMARY";

export type ReportPeriod =
  | "DAILY"
  | "WEEKLY"
  | "MONTHLY"
  | "QUARTERLY"
  | "YEARLY"
  | "CUSTOM";

export type ReportData = {
  id: string;
  type: ReportType;
  title: string;
  period: ReportPeriod;
  startDate: Date;
  endDate: Date;
  generatedAt: Date;
  data: any;
  summary: ReportSummary;
  charts: ChartData[];
  insights: ReportInsight[];
  recommendations: string[];
};

export type ReportSummary = {
  totalRevenue: number;
  totalSales: number;
  totalProducts: number;
  totalCustomers: number;
  averageOrderValue: number;
  topSellingProduct: string;
  growthRate: number;
  keyMetrics: { [key: string]: number };
};

export type ChartData = {
  type: "LINE" | "BAR" | "PIE" | "AREA" | "SCATTER";
  title: string;
  data: any[];
  xAxis?: string;
  yAxis?: string;
  colors?: string[];
};

export type ReportInsight = {
  type: "SUCCESS" | "WARNING" | "ERROR" | "INFO";
  title: string;
  description: string;
  impact: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  value?: number;
  trend?: "UP" | "DOWN" | "STABLE";
};

export type ReportFilters = {
  productIds?: string[];
  customerIds?: string[];
  categories?: string[];
  minAmount?: number;
  maxAmount?: number;
  includeMLInsights?: boolean;
};

// Advanced reporting engine
export class AdvancedReportsEngine {
  private products: Product[] = [];
  private sales: Sale[] = [];
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const [products, sales] = await Promise.all([
        listProducts(),
        listSales(5000), // Get more data for comprehensive reports
      ]);

      this.products = products;
      this.sales = sales;
      this.isInitialized = true;
    } catch (error) {
      console.error("Error initializing advanced reports engine:", error);
    }
  }

  // Generate comprehensive inventory analysis report
  async generateInventoryAnalysisReport(
    period: ReportPeriod = "MONTHLY",
    filters?: ReportFilters
  ): Promise<ReportData> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const { startDate, endDate } = this.getDateRange(period);
    const filteredSales = this.filterSales(startDate, endDate, filters);
    const filteredProducts = this.filterProducts(filters);

    // Calculate inventory metrics
    const inventoryMetrics = this.calculateInventoryMetrics(
      filteredProducts,
      filteredSales
    );
    const stockAnalysis = this.analyzeStockLevels(filteredProducts);
    const turnoverAnalysis = this.analyzeInventoryTurnover(
      filteredProducts,
      filteredSales
    );
    const abcAnalysis = this.performABCAnalysis(
      filteredProducts,
      filteredSales
    );

    // Generate charts
    const charts: ChartData[] = [
      {
        type: "BAR",
        title: "Stock Levels by Product",
        data: stockAnalysis.map((item) => ({
          name: item.productName,
          current: item.currentStock,
          minimum: item.minimumStock,
          maximum: item.maximumStock,
        })),
        xAxis: "Product",
        yAxis: "Stock Level",
      },
      {
        type: "PIE",
        title: "ABC Analysis Distribution",
        data: abcAnalysis.map((item) => ({
          name: item.category,
          value: item.percentage,
        })),
        colors: ["#FF6B6B", "#4ECDC4", "#45B7D1"],
      },
      {
        type: "LINE",
        title: "Inventory Turnover Trends",
        data: turnoverAnalysis.map((item) => ({
          period: item.period,
          turnover: item.turnover,
        })),
        xAxis: "Period",
        yAxis: "Turnover Rate",
      },
    ];

    // Generate insights
    const insights: ReportInsight[] = [
      ...this.generateStockInsights(stockAnalysis),
      ...this.generateTurnoverInsights(turnoverAnalysis),
      ...this.generateABCAnalysisInsights(abcAnalysis),
    ];

    // Generate recommendations
    const recommendations = this.generateInventoryRecommendations(
      stockAnalysis,
      turnoverAnalysis,
      abcAnalysis
    );

    return {
      id: `inventory-analysis-${Date.now()}`,
      type: "INVENTORY_ANALYSIS",
      title: "Análisis Avanzado de Inventario",
      period,
      startDate,
      endDate,
      generatedAt: new Date(),
      data: {
        inventoryMetrics,
        stockAnalysis,
        turnoverAnalysis,
        abcAnalysis,
      },
      summary: this.generateInventorySummary(
        inventoryMetrics,
        filteredProducts,
        filteredSales
      ),
      charts,
      insights,
      recommendations,
    };
  }

  // Generate sales performance report
  async generateSalesPerformanceReport(
    period: ReportPeriod = "MONTHLY",
    filters?: ReportFilters
  ): Promise<ReportData> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const { startDate, endDate } = this.getDateRange(period);
    const filteredSales = this.filterSales(startDate, endDate, filters);

    // Calculate sales metrics
    const salesMetrics = this.calculateSalesMetrics(filteredSales);
    const productPerformance = this.analyzeProductPerformance(filteredSales);
    const customerAnalysis = this.analyzeCustomerPerformance(filteredSales);
    const timeAnalysis = this.analyzeSalesByTime(filteredSales, period);

    // Generate charts
    const charts: ChartData[] = [
      {
        type: "LINE",
        title: "Sales Trend Over Time",
        data: timeAnalysis.map((item) => ({
          period: item.period,
          sales: item.totalSales,
          revenue: item.totalRevenue,
        })),
        xAxis: "Period",
        yAxis: "Amount",
      },
      {
        type: "BAR",
        title: "Top Performing Products",
        data: productPerformance.slice(0, 10).map((item) => ({
          name: item.productName,
          sales: item.totalSales,
          revenue: item.totalRevenue,
        })),
        xAxis: "Product",
        yAxis: "Sales",
      },
      {
        type: "PIE",
        title: "Customer Distribution",
        data: customerAnalysis.map((item) => ({
          name: item.segment,
          value: item.percentage,
        })),
      },
    ];

    // Generate insights
    const insights: ReportInsight[] = [
      ...this.generateSalesInsights(salesMetrics),
      ...this.generateProductInsights(productPerformance),
      ...this.generateCustomerInsights(customerAnalysis),
    ];

    // Generate recommendations
    const recommendations = this.generateSalesRecommendations(
      productPerformance,
      customerAnalysis,
      salesMetrics
    );

    return {
      id: `sales-performance-${Date.now()}`,
      type: "SALES_PERFORMANCE",
      title: "Reporte de Rendimiento de Ventas",
      period,
      startDate,
      endDate,
      generatedAt: new Date(),
      data: {
        salesMetrics,
        productPerformance,
        customerAnalysis,
        timeAnalysis,
      },
      summary: this.generateSalesSummary(salesMetrics, filteredSales),
      charts,
      insights,
      recommendations,
    };
  }

  // Generate ML insights report
  async generateMLInsightsReport(
    period: ReportPeriod = "MONTHLY",
    filters?: ReportFilters
  ): Promise<ReportData> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const { startDate, endDate } = this.getDateRange(period);

    // Train ML models if needed
    await mlEngine.trainAllModels();

    // Generate ML insights
    const mlInsights = await mlEngine.generateInsights();
    const modelPerformance = await mlEngine.getModelPerformance();
    const predictions = await this.generateMLPredictions(filters);

    // Generate charts
    const charts: ChartData[] = [
      {
        type: "BAR",
        title: "ML Model Performance",
        data: Object.entries(modelPerformance).map(([name, perf]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          accuracy: Math.round(perf.accuracy * 100),
        })),
        xAxis: "Model",
        yAxis: "Accuracy (%)",
      },
      {
        type: "SCATTER",
        title: "Insights by Impact and Confidence",
        data: mlInsights.map((insight) => ({
          confidence: Math.round(insight.confidence * 100),
          impact:
            insight.impact === "CRITICAL"
              ? 4
              : insight.impact === "HIGH"
              ? 3
              : insight.impact === "MEDIUM"
              ? 2
              : 1,
          type: insight.type,
          product: insight.productName,
        })),
        xAxis: "Confidence (%)",
        yAxis: "Impact Level",
      },
    ];

    // Generate insights
    const insights: ReportInsight[] = mlInsights.map((mlInsight) => ({
      type:
        mlInsight.impact === "CRITICAL"
          ? "ERROR"
          : mlInsight.impact === "HIGH"
          ? "WARNING"
          : "INFO",
      title: mlInsight.description,
      description: mlInsight.recommendation,
      impact: mlInsight.impact,
      value: Math.round(mlInsight.confidence * 100),
    }));

    // Generate recommendations
    const recommendations = this.generateMLRecommendations(
      mlInsights,
      modelPerformance
    );

    return {
      id: `ml-insights-${Date.now()}`,
      type: "ML_INSIGHTS",
      title: "Reporte de Insights de Machine Learning",
      period,
      startDate,
      endDate,
      generatedAt: new Date(),
      data: {
        mlInsights,
        modelPerformance,
        predictions,
      },
      summary: this.generateMLSummary(mlInsights, modelPerformance),
      charts,
      insights,
      recommendations,
    };
  }

  // Generate executive summary report
  async generateExecutiveSummaryReport(
    period: ReportPeriod = "QUARTERLY",
    filters?: ReportFilters
  ): Promise<ReportData> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const { startDate, endDate } = this.getDateRange(period);
    const filteredSales = this.filterSales(startDate, endDate, filters);
    const filteredProducts = this.filterProducts(filters);

    // Generate all sub-reports
    const [inventoryReport, salesReport, mlReport] = await Promise.all([
      this.generateInventoryAnalysisReport(period, filters),
      this.generateSalesPerformanceReport(period, filters),
      this.generateMLInsightsReport(period, filters),
    ]);

    // Combine insights
    const allInsights = [
      ...inventoryReport.insights,
      ...salesReport.insights,
      ...mlReport.insights,
    ].sort((a, b) => {
      const impactOrder = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
      return impactOrder[b.impact] - impactOrder[a.impact];
    });

    // Generate executive charts
    const charts: ChartData[] = [
      {
        type: "AREA",
        title: "Revenue and Profit Trends",
        data: salesReport.data.timeAnalysis.map((item) => ({
          period: item.period,
          revenue: item.totalRevenue,
          profit: item.totalRevenue * 0.3, // Estimated profit margin
        })),
        xAxis: "Period",
        yAxis: "Amount",
      },
      {
        type: "PIE",
        title: "Key Performance Indicators",
        data: [
          { name: "Revenue Growth", value: salesReport.summary.growthRate },
          {
            name: "Inventory Turnover",
            value: inventoryReport.data.inventoryMetrics.turnoverRate,
          },
          {
            name: "ML Accuracy",
            value:
              (Object.values(mlReport.data.modelPerformance).reduce(
                (acc, perf) => acc + perf.accuracy,
                0
              ) /
                Object.keys(mlReport.data.modelPerformance).length) *
              100,
          },
        ],
      },
    ];

    // Generate executive recommendations
    const recommendations = [
      ...inventoryReport.recommendations.slice(0, 3),
      ...salesReport.recommendations.slice(0, 3),
      ...mlReport.recommendations.slice(0, 3),
    ];

    return {
      id: `executive-summary-${Date.now()}`,
      type: "EXECUTIVE_SUMMARY",
      title: "Resumen Ejecutivo",
      period,
      startDate,
      endDate,
      generatedAt: new Date(),
      data: {
        inventoryReport: inventoryReport.data,
        salesReport: salesReport.data,
        mlReport: mlReport.data,
        combinedMetrics: this.combineMetrics(
          inventoryReport.summary,
          salesReport.summary,
          mlReport.summary
        ),
      },
      summary: this.generateExecutiveSummary(
        inventoryReport.summary,
        salesReport.summary,
        mlReport.summary
      ),
      charts,
      insights: allInsights.slice(0, 10), // Top 10 insights
      recommendations,
    };
  }

  // Helper methods
  private getDateRange(period: ReportPeriod): {
    startDate: Date;
    endDate: Date;
  } {
    const now = new Date();
    const endDate = new Date(now);
    let startDate = new Date(now);

    switch (period) {
      case "DAILY":
        startDate.setDate(now.getDate() - 1);
        break;
      case "WEEKLY":
        startDate.setDate(now.getDate() - 7);
        break;
      case "MONTHLY":
        startDate.setMonth(now.getMonth() - 1);
        break;
      case "QUARTERLY":
        startDate.setMonth(now.getMonth() - 3);
        break;
      case "YEARLY":
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    return { startDate, endDate };
  }

  private filterSales(
    startDate: Date,
    endDate: Date,
    filters?: ReportFilters
  ): Sale[] {
    let filtered = this.sales.filter((sale) => {
      const saleDate = new Date(sale.createdAt);
      return saleDate >= startDate && saleDate <= endDate;
    });

    if (filters) {
      if (filters.productIds?.length) {
        filtered = filtered.filter((sale) =>
          sale.items.some((item) =>
            filters.productIds!.includes(item.productId)
          )
        );
      }
      if (filters.customerIds?.length) {
        filtered = filtered.filter((sale) =>
          filters.customerIds!.includes(sale.customerId)
        );
      }
      if (filters.minAmount !== undefined) {
        filtered = filtered.filter((sale) => sale.total >= filters.minAmount!);
      }
      if (filters.maxAmount !== undefined) {
        filtered = filtered.filter((sale) => sale.total <= filters.maxAmount!);
      }
    }

    return filtered;
  }

  private filterProducts(filters?: ReportFilters): Product[] {
    let filtered = this.products;

    if (filters) {
      if (filters.productIds?.length) {
        filtered = filtered.filter((product) =>
          filters.productIds!.includes(product.id)
        );
      }
      if (filters.categories?.length) {
        filtered = filtered.filter((product) =>
          filters.categories!.includes(product.category || "Uncategorized")
        );
      }
    }

    return filtered;
  }

  // Inventory analysis methods
  private calculateInventoryMetrics(products: Product[], sales: Sale[]): any {
    const totalValue = products.reduce(
      (sum, product) => sum + product.currentStock * product.unitPrice,
      0
    );

    const totalCost = products.reduce(
      (sum, product) => sum + product.currentStock * (product.unitPrice * 0.7),
      0 // Assume 30% margin
    );

    const turnoverRate = this.calculateOverallTurnoverRate(products, sales);
    const stockoutRate = this.calculateStockoutRate(products, sales);
    const overstockRate = this.calculateOverstockRate(products);

    return {
      totalValue,
      totalCost,
      turnoverRate,
      stockoutRate,
      overstockRate,
      totalProducts: products.length,
      averageStockValue: totalValue / products.length,
    };
  }

  private analyzeStockLevels(products: Product[]): any[] {
    return products.map((product) => ({
      productId: product.id,
      productName: product.name,
      currentStock: product.currentStock,
      minimumStock: product.minimumStock || 0,
      maximumStock: product.maximumStock || product.currentStock * 2,
      stockStatus: this.getStockStatus(product),
      stockValue: product.currentStock * product.unitPrice,
    }));
  }

  private analyzeInventoryTurnover(products: Product[], sales: Sale[]): any[] {
    const periods = this.generateTimePeriods("MONTHLY", 12);

    return periods.map((period) => {
      const periodSales = this.filterSales(period.start, period.end);
      const turnover = this.calculatePeriodTurnover(products, periodSales);

      return {
        period: period.label,
        turnover,
        start: period.start,
        end: period.end,
      };
    });
  }

  private performABCAnalysis(products: Product[], sales: Sale[]): any[] {
    // Calculate product values (sales * price)
    const productValues = products.map((product) => {
      const productSales = sales
        .flatMap((sale) => sale.items)
        .filter((item) => item.productId === product.id);
      const totalSales = productSales.reduce(
        (sum, item) => sum + item.quantity,
        0
      );
      const value = totalSales * product.unitPrice;

      return {
        productId: product.id,
        productName: product.name,
        value,
        percentage: 0, // Will be calculated below
      };
    });

    // Sort by value descending
    productValues.sort((a, b) => b.value - a.value);

    // Calculate cumulative percentages
    const totalValue = productValues.reduce((sum, item) => sum + item.value, 0);
    let cumulativePercentage = 0;

    productValues.forEach((item) => {
      item.percentage = (item.value / totalValue) * 100;
      cumulativePercentage += item.percentage;

      if (cumulativePercentage <= 80) {
        item.category = "A";
      } else if (cumulativePercentage <= 95) {
        item.category = "B";
      } else {
        item.category = "C";
      }
    });

    // Group by category
    const abcGroups = productValues.reduce((groups, item) => {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push(item);
      return groups;
    }, {} as { [key: string]: any[] });

    return Object.entries(abcGroups).map(([category, items]) => ({
      category,
      count: items.length,
      percentage: items.reduce((sum, item) => sum + item.percentage, 0),
      totalValue: items.reduce((sum, item) => sum + item.value, 0),
    }));
  }

  // Sales analysis methods
  private calculateSalesMetrics(sales: Sale[]): any {
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
    const totalSales = sales.length;
    const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;

    // Calculate growth rate
    const currentPeriod = sales.length;
    const previousPeriod = this.getPreviousPeriodSales(sales).length;
    const growthRate =
      previousPeriod > 0
        ? ((currentPeriod - previousPeriod) / previousPeriod) * 100
        : 0;

    return {
      totalRevenue,
      totalSales,
      averageOrderValue,
      growthRate,
      topCustomer: this.getTopCustomer(sales),
      topProduct: this.getTopProduct(sales),
    };
  }

  private analyzeProductPerformance(sales: Sale[]): any[] {
    const productSales = new Map<
      string,
      { sales: number; revenue: number; quantity: number }
    >();

    sales.forEach((sale) => {
      sale.items.forEach((item) => {
        const existing = productSales.get(item.productId) || {
          sales: 0,
          revenue: 0,
          quantity: 0,
        };
        productSales.set(item.productId, {
          sales: existing.sales + 1,
          revenue: existing.revenue + item.total,
          quantity: existing.quantity + item.quantity,
        });
      });
    });

    return Array.from(productSales.entries())
      .map(([productId, data]) => {
        const product = this.products.find((p) => p.id === productId);
        return {
          productId,
          productName: product?.name || "Unknown Product",
          totalSales: data.sales,
          totalRevenue: data.revenue,
          totalQuantity: data.quantity,
          averagePrice: data.quantity > 0 ? data.revenue / data.quantity : 0,
        };
      })
      .sort((a, b) => b.totalRevenue - a.totalRevenue);
  }

  private analyzeCustomerPerformance(sales: Sale[]): any[] {
    const customerData = new Map<
      string,
      { sales: number; revenue: number; orders: number }
    >();

    sales.forEach((sale) => {
      const existing = customerData.get(sale.customerId) || {
        sales: 0,
        revenue: 0,
        orders: 0,
      };
      customerData.set(sale.customerId, {
        sales: existing.sales + sale.items.length,
        revenue: existing.revenue + sale.total,
        orders: existing.orders + 1,
      });
    });

    // Segment customers
    const segments = {
      VIP: { minRevenue: 10000, count: 0 },
      Premium: { minRevenue: 5000, count: 0 },
      Regular: { minRevenue: 1000, count: 0 },
      New: { minRevenue: 0, count: 0 },
    };

    customerData.forEach((customer) => {
      if (customer.revenue >= segments.VIP.minRevenue) {
        segments.VIP.count++;
      } else if (customer.revenue >= segments.Premium.minRevenue) {
        segments.Premium.count++;
      } else if (customer.revenue >= segments.Regular.minRevenue) {
        segments.Regular.count++;
      } else {
        segments.New.count++;
      }
    });

    const totalCustomers = customerData.size;

    return Object.entries(segments).map(([segment, data]) => ({
      segment,
      count: data.count,
      percentage: totalCustomers > 0 ? (data.count / totalCustomers) * 100 : 0,
    }));
  }

  private analyzeSalesByTime(sales: Sale[], period: ReportPeriod): any[] {
    const timeGroups = this.generateTimePeriods(period, 12);

    return timeGroups.map((group) => {
      const groupSales = sales.filter((sale) => {
        const saleDate = new Date(sale.createdAt);
        return saleDate >= group.start && saleDate <= group.end;
      });

      return {
        period: group.label,
        totalSales: groupSales.length,
        totalRevenue: groupSales.reduce((sum, sale) => sum + sale.total, 0),
        start: group.start,
        end: group.end,
      };
    });
  }

  // ML analysis methods
  private async generateMLPredictions(filters?: ReportFilters): Promise<any[]> {
    const topProducts = this.products
      .filter(
        (product) =>
          !filters?.productIds || filters.productIds.includes(product.id)
      )
      .slice(0, 10);

    const predictions = [];

    for (const product of topProducts) {
      try {
        const demandPrediction = await mlEngine.predictDemand(product.id, 7);
        const pricePrediction = await mlEngine.predictOptimalPrice(product.id);

        predictions.push({
          productId: product.id,
          productName: product.name,
          demandPrediction,
          pricePrediction,
        });
      } catch (error) {
        console.warn(
          `Could not generate prediction for product ${product.id}:`,
          error
        );
      }
    }

    return predictions;
  }

  // Insight generation methods
  private generateStockInsights(stockAnalysis: any[]): ReportInsight[] {
    const insights: ReportInsight[] = [];

    const lowStockItems = stockAnalysis.filter(
      (item) => item.stockStatus === "LOW"
    );
    const overstockItems = stockAnalysis.filter(
      (item) => item.stockStatus === "OVERSTOCK"
    );

    if (lowStockItems.length > 0) {
      insights.push({
        type: "WARNING",
        title: "Productos con Stock Bajo",
        description: `${lowStockItems.length} productos tienen stock por debajo del mínimo recomendado`,
        impact: "HIGH",
        value: lowStockItems.length,
        trend: "DOWN",
      });
    }

    if (overstockItems.length > 0) {
      insights.push({
        type: "WARNING",
        title: "Productos con Exceso de Stock",
        description: `${overstockItems.length} productos tienen exceso de inventario`,
        impact: "MEDIUM",
        value: overstockItems.length,
        trend: "UP",
      });
    }

    return insights;
  }

  private generateTurnoverInsights(turnoverAnalysis: any[]): ReportInsight[] {
    const insights: ReportInsight[] = [];

    if (turnoverAnalysis.length >= 2) {
      const currentTurnover =
        turnoverAnalysis[turnoverAnalysis.length - 1].turnover;
      const previousTurnover =
        turnoverAnalysis[turnoverAnalysis.length - 2].turnover;
      const change =
        ((currentTurnover - previousTurnover) / previousTurnover) * 100;

      insights.push({
        type: change > 0 ? "SUCCESS" : "WARNING",
        title: "Rotación de Inventario",
        description: `La rotación de inventario ${
          change > 0 ? "aumentó" : "disminuyó"
        } un ${Math.abs(change).toFixed(1)}%`,
        impact: Math.abs(change) > 20 ? "HIGH" : "MEDIUM",
        value: Math.abs(change),
        trend: change > 0 ? "UP" : "DOWN",
      });
    }

    return insights;
  }

  private generateABCAnalysisInsights(abcAnalysis: any[]): ReportInsight[] {
    const insights: ReportInsight[] = [];

    const aItems = abcAnalysis.find((item) => item.category === "A");
    if (aItems && aItems.percentage < 70) {
      insights.push({
        type: "INFO",
        title: "Optimización ABC",
        description:
          "Los productos A representan menos del 70% del valor total",
        impact: "MEDIUM",
        value: aItems.percentage,
      });
    }

    return insights;
  }

  private generateSalesInsights(salesMetrics: any): ReportInsight[] {
    const insights: ReportInsight[] = [];

    if (salesMetrics.growthRate > 10) {
      insights.push({
        type: "SUCCESS",
        title: "Crecimiento de Ventas",
        description: `Las ventas crecieron un ${salesMetrics.growthRate.toFixed(
          1
        )}%`,
        impact: "HIGH",
        value: salesMetrics.growthRate,
        trend: "UP",
      });
    } else if (salesMetrics.growthRate < -10) {
      insights.push({
        type: "ERROR",
        title: "Declive en Ventas",
        description: `Las ventas disminuyeron un ${Math.abs(
          salesMetrics.growthRate
        ).toFixed(1)}%`,
        impact: "CRITICAL",
        value: Math.abs(salesMetrics.growthRate),
        trend: "DOWN",
      });
    }

    return insights;
  }

  private generateProductInsights(productPerformance: any[]): ReportInsight[] {
    const insights: ReportInsight[] = [];

    if (productPerformance.length > 0) {
      const topProduct = productPerformance[0];
      const top3Revenue = productPerformance
        .slice(0, 3)
        .reduce((sum, p) => sum + p.totalRevenue, 0);
      const totalRevenue = productPerformance.reduce(
        (sum, p) => sum + p.totalRevenue,
        0
      );
      const concentration = (top3Revenue / totalRevenue) * 100;

      if (concentration > 80) {
        insights.push({
          type: "WARNING",
          title: "Concentración de Ventas",
          description: `Los 3 productos principales representan el ${concentration.toFixed(
            1
          )}% de las ventas`,
          impact: "MEDIUM",
          value: concentration,
        });
      }
    }

    return insights;
  }

  private generateCustomerInsights(customerAnalysis: any[]): ReportInsight[] {
    const insights: ReportInsight[] = [];

    const vipCustomers = customerAnalysis.find(
      (segment) => segment.segment === "VIP"
    );
    if (vipCustomers && vipCustomers.percentage > 0) {
      insights.push({
        type: "SUCCESS",
        title: "Clientes VIP",
        description: `${vipCustomers.percentage.toFixed(
          1
        )}% de los clientes son VIP`,
        impact: "HIGH",
        value: vipCustomers.percentage,
      });
    }

    return insights;
  }

  // Recommendation generation methods
  private generateInventoryRecommendations(
    stockAnalysis: any[],
    turnoverAnalysis: any[],
    abcAnalysis: any[]
  ): string[] {
    const recommendations: string[] = [];

    const lowStockItems = stockAnalysis.filter(
      (item) => item.stockStatus === "LOW"
    );
    if (lowStockItems.length > 0) {
      recommendations.push(
        `Reabastecer ${lowStockItems.length} productos con stock bajo`
      );
    }

    const overstockItems = stockAnalysis.filter(
      (item) => item.stockStatus === "OVERSTOCK"
    );
    if (overstockItems.length > 0) {
      recommendations.push(
        `Considerar promociones para ${overstockItems.length} productos con exceso de stock`
      );
    }

    const aItems = abcAnalysis.find((item) => item.category === "A");
    if (aItems) {
      recommendations.push(
        `Implementar control estricto para ${aItems.count} productos de categoría A`
      );
    }

    return recommendations;
  }

  private generateSalesRecommendations(
    productPerformance: any[],
    customerAnalysis: any[],
    salesMetrics: any
  ): string[] {
    const recommendations: string[] = [];

    if (salesMetrics.growthRate < 0) {
      recommendations.push(
        "Implementar estrategias de crecimiento para revertir la tendencia negativa"
      );
    }

    const topProducts = productPerformance.slice(0, 3);
    recommendations.push(
      `Enfocar esfuerzos de marketing en los productos top: ${topProducts
        .map((p) => p.productName)
        .join(", ")}`
    );

    const newCustomers = customerAnalysis.find(
      (segment) => segment.segment === "New"
    );
    if (newCustomers && newCustomers.percentage > 30) {
      recommendations.push(
        "Desarrollar estrategias de retención para clientes nuevos"
      );
    }

    return recommendations;
  }

  private generateMLRecommendations(
    mlInsights: MLInsight[],
    modelPerformance: any
  ): string[] {
    const recommendations: string[] = [];

    const criticalInsights = mlInsights.filter(
      (insight) => insight.impact === "CRITICAL"
    );
    if (criticalInsights.length > 0) {
      recommendations.push(
        `Actuar inmediatamente en ${criticalInsights.length} insights críticos identificados por ML`
      );
    }

    const lowAccuracyModels = Object.entries(modelPerformance).filter(
      ([_, perf]: [string, any]) => perf.accuracy < 0.7
    );
    if (lowAccuracyModels.length > 0) {
      recommendations.push(
        `Mejorar la precisión de ${lowAccuracyModels.length} modelos de ML`
      );
    }

    const predictions = mlInsights.filter(
      (insight) => insight.type === "PREDICTION"
    );
    if (predictions.length > 0) {
      recommendations.push(
        "Utilizar predicciones de ML para optimizar la planificación de inventario"
      );
    }

    return recommendations;
  }

  // Summary generation methods
  private generateInventorySummary(
    metrics: any,
    products: Product[],
    sales: Sale[]
  ): ReportSummary {
    return {
      totalRevenue: metrics.totalValue,
      totalSales: sales.length,
      totalProducts: products.length,
      totalCustomers: new Set(sales.map((sale) => sale.customerId)).size,
      averageOrderValue:
        sales.length > 0
          ? sales.reduce((sum, sale) => sum + sale.total, 0) / sales.length
          : 0,
      topSellingProduct: this.getTopProduct(sales),
      growthRate: 0, // Will be calculated in context
      keyMetrics: {
        turnoverRate: metrics.turnoverRate,
        stockoutRate: metrics.stockoutRate,
        overstockRate: metrics.overstockRate,
      },
    };
  }

  private generateSalesSummary(metrics: any, sales: Sale[]): ReportSummary {
    return {
      totalRevenue: metrics.totalRevenue,
      totalSales: metrics.totalSales,
      totalProducts: new Set(
        sales.flatMap((sale) => sale.items.map((item) => item.productId))
      ).size,
      totalCustomers: new Set(sales.map((sale) => sale.customerId)).size,
      averageOrderValue: metrics.averageOrderValue,
      topSellingProduct: metrics.topProduct,
      growthRate: metrics.growthRate,
      keyMetrics: {
        averageOrderValue: metrics.averageOrderValue,
        topCustomer: metrics.topCustomer,
      },
    };
  }

  private generateMLSummary(
    mlInsights: MLInsight[],
    modelPerformance: any
  ): ReportSummary {
    const totalInsights = mlInsights.length;
    const criticalInsights = mlInsights.filter(
      (insight) => insight.impact === "CRITICAL"
    ).length;
    const averageAccuracy =
      Object.values(modelPerformance).reduce(
        (acc: number, perf: any) => acc + perf.accuracy,
        0
      ) / Object.keys(modelPerformance).length;

    return {
      totalRevenue: 0,
      totalSales: 0,
      totalProducts: 0,
      totalCustomers: 0,
      averageOrderValue: 0,
      topSellingProduct: "",
      growthRate: averageAccuracy * 100,
      keyMetrics: {
        totalInsights,
        criticalInsights,
        averageAccuracy: averageAccuracy * 100,
        trainedModels: Object.keys(modelPerformance).length,
      },
    };
  }

  private generateExecutiveSummary(
    inventorySummary: ReportSummary,
    salesSummary: ReportSummary,
    mlSummary: ReportSummary
  ): ReportSummary {
    return {
      totalRevenue: salesSummary.totalRevenue,
      totalSales: salesSummary.totalSales,
      totalProducts: Math.max(
        inventorySummary.totalProducts,
        salesSummary.totalProducts
      ),
      totalCustomers: Math.max(
        inventorySummary.totalCustomers,
        salesSummary.totalCustomers
      ),
      averageOrderValue: salesSummary.averageOrderValue,
      topSellingProduct: salesSummary.topSellingProduct,
      growthRate: salesSummary.growthRate,
      keyMetrics: {
        ...inventorySummary.keyMetrics,
        ...salesSummary.keyMetrics,
        ...mlSummary.keyMetrics,
      },
    };
  }

  // Utility methods
  private getStockStatus(product: Product): string {
    if (product.currentStock <= (product.minimumStock || 0)) {
      return "LOW";
    } else if (
      product.currentStock >= (product.maximumStock || product.currentStock * 2)
    ) {
      return "OVERSTOCK";
    } else {
      return "NORMAL";
    }
  }

  private calculateOverallTurnoverRate(
    products: Product[],
    sales: Sale[]
  ): number {
    const totalCost = products.reduce(
      (sum, product) => sum + product.currentStock * product.unitPrice * 0.7,
      0
    );

    const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);

    return totalCost > 0 ? totalSales / totalCost : 0;
  }

  private calculateStockoutRate(products: Product[], sales: Sale[]): number {
    const stockoutProducts = products.filter(
      (product) => product.currentStock <= 0
    );
    return products.length > 0
      ? (stockoutProducts.length / products.length) * 100
      : 0;
  }

  private calculateOverstockRate(products: Product[]): number {
    const overstockProducts = products.filter(
      (product) =>
        product.currentStock >=
        (product.maximumStock || product.currentStock * 2)
    );
    return products.length > 0
      ? (overstockProducts.length / products.length) * 100
      : 0;
  }

  private generateTimePeriods(period: ReportPeriod, count: number): any[] {
    const periods = [];
    const now = new Date();

    for (let i = count - 1; i >= 0; i--) {
      const end = new Date(now);
      const start = new Date(now);

      switch (period) {
        case "DAILY":
          end.setDate(now.getDate() - i);
          start.setDate(now.getDate() - i);
          start.setHours(0, 0, 0, 0);
          end.setHours(23, 59, 59, 999);
          break;
        case "WEEKLY":
          end.setDate(now.getDate() - i * 7);
          start.setDate(now.getDate() - i * 7 - 6);
          break;
        case "MONTHLY":
          end.setMonth(now.getMonth() - i);
          start.setMonth(now.getMonth() - i);
          start.setDate(1);
          end.setMonth(end.getMonth() + 1);
          end.setDate(0);
          break;
        case "QUARTERLY":
          end.setMonth(now.getMonth() - i * 3);
          start.setMonth(now.getMonth() - i * 3 - 2);
          start.setDate(1);
          end.setMonth(end.getMonth() + 1);
          end.setDate(0);
          break;
        case "YEARLY":
          end.setFullYear(now.getFullYear() - i);
          start.setFullYear(now.getFullYear() - i);
          start.setMonth(0, 1);
          end.setMonth(11, 31);
          break;
      }

      periods.push({
        start,
        end,
        label: this.formatPeriodLabel(start, end, period),
      });
    }

    return periods;
  }

  private formatPeriodLabel(
    start: Date,
    end: Date,
    period: ReportPeriod
  ): string {
    switch (period) {
      case "DAILY":
        return start.toLocaleDateString();
      case "WEEKLY":
        return `Semana ${Math.ceil(start.getDate() / 7)}`;
      case "MONTHLY":
        return start.toLocaleDateString("es-ES", {
          month: "short",
          year: "numeric",
        });
      case "QUARTERLY":
        const quarter = Math.ceil((start.getMonth() + 1) / 3);
        return `Q${quarter} ${start.getFullYear()}`;
      case "YEARLY":
        return start.getFullYear().toString();
      default:
        return start.toLocaleDateString();
    }
  }

  private calculatePeriodTurnover(products: Product[], sales: Sale[]): number {
    const totalCost = products.reduce(
      (sum, product) => sum + product.currentStock * product.unitPrice * 0.7,
      0
    );

    const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);

    return totalCost > 0 ? totalSales / totalCost : 0;
  }

  private getPreviousPeriodSales(currentSales: Sale[]): Sale[] {
    if (currentSales.length === 0) return [];

    const currentStart = Math.min(
      ...currentSales.map((sale) => sale.createdAt)
    );
    const periodLength =
      Math.max(...currentSales.map((sale) => sale.createdAt)) - currentStart;
    const previousStart = currentStart - periodLength;
    const previousEnd = currentStart;

    return this.sales.filter(
      (sale) => sale.createdAt >= previousStart && sale.createdAt < previousEnd
    );
  }

  private getTopCustomer(sales: Sale[]): string {
    const customerSales = new Map<string, number>();

    sales.forEach((sale) => {
      const current = customerSales.get(sale.customerId) || 0;
      customerSales.set(sale.customerId, current + sale.total);
    });

    let topCustomer = "";
    let maxSales = 0;

    customerSales.forEach((total, customerId) => {
      if (total > maxSales) {
        maxSales = total;
        topCustomer = customerId;
      }
    });

    return topCustomer;
  }

  private getTopProduct(sales: Sale[]): string {
    const productSales = new Map<string, number>();

    sales.forEach((sale) => {
      sale.items.forEach((item) => {
        const current = productSales.get(item.productId) || 0;
        productSales.set(item.productId, current + item.quantity);
      });
    });

    let topProduct = "";
    let maxSales = 0;

    productSales.forEach((quantity, productId) => {
      if (quantity > maxSales) {
        maxSales = quantity;
        topProduct = productId;
      }
    });

    return topProduct;
  }

  private combineMetrics(
    inventorySummary: ReportSummary,
    salesSummary: ReportSummary,
    mlSummary: ReportSummary
  ): any {
    return {
      inventory: inventorySummary.keyMetrics,
      sales: salesSummary.keyMetrics,
      ml: mlSummary.keyMetrics,
      combined: {
        totalValue: inventorySummary.totalRevenue + salesSummary.totalRevenue,
        efficiency:
          (salesSummary.totalRevenue / inventorySummary.totalRevenue) * 100,
        mlAdoption: mlSummary.keyMetrics.trainedModels || 0,
      },
    };
  }
}

// Singleton instance
export const advancedReports = new AdvancedReportsEngine();
