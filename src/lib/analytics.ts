import { Product, StockMovement, StockAlert } from "@/types/product";
import {
  getStockMovements,
  getStockMovementsByDateRange,
} from "@/lib/stock-movements";
import { getAllProductsWithAlerts } from "@/lib/products";

export interface DashboardMetrics {
  totalInventoryValue: number;
  totalProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  totalMovementsToday: number;
  totalMovementsWeek: number;
  averageProductValue: number;
  inventoryTurnover: number;
}

export interface StockTrendData {
  date: string;
  stock: number;
  movements: number;
  value: number;
}

export interface TopProductData {
  name: string;
  movements: number;
  value: number;
  currentStock: number;
}

export interface CategoryData {
  category: string;
  value: number;
  products: number;
  stock: number;
}

export interface MovementAnalytics {
  type: string;
  count: number;
  totalQuantity: number;
  percentage: number;
}

export interface AlertSummary {
  critical: number;
  warning: number;
  info: number;
  total: number;
  criticalProducts: string[];
}

// Calculate dashboard metrics
export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const productsWithAlerts = await getAllProductsWithAlerts();

  // Basic inventory metrics
  const totalInventoryValue = productsWithAlerts.reduce(
    (sum, product) => sum + product.stockAvailable * product.unitPrice,
    0
  );

  const totalProducts = productsWithAlerts.length;
  const lowStockProducts = productsWithAlerts.filter(
    (p) => p.minStock && p.stockAvailable <= p.minStock
  ).length;

  const outOfStockProducts = productsWithAlerts.filter(
    (p) => p.stockAvailable <= 0
  ).length;

  const averageProductValue =
    totalProducts > 0 ? totalInventoryValue / totalProducts : 0;

  // Movement metrics
  const today = new Date();
  const startOfDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

  const todayMovements = await getStockMovementsByDateRange(
    startOfDay,
    endOfDay
  );
  const weekMovements = await getStockMovementsByDateRange(weekAgo, today);

  // Calculate inventory turnover (simplified)
  const totalStockValue = productsWithAlerts.reduce(
    (sum, product) => sum + product.quantity * product.unitPrice,
    0
  );

  const weeklyOutMovements = weekMovements.filter((m) => m.amount < 0);
  const weeklyOutValue = weeklyOutMovements.reduce((sum, movement) => {
    const product = productsWithAlerts.find((p) => p.id === movement.productId);
    return sum + Math.abs(movement.amount) * (product?.unitPrice || 0);
  }, 0);

  const inventoryTurnover =
    totalStockValue > 0 ? (weeklyOutValue * 52) / totalStockValue : 0;

  return {
    totalInventoryValue,
    totalProducts,
    lowStockProducts,
    outOfStockProducts,
    totalMovementsToday: todayMovements.length,
    totalMovementsWeek: weekMovements.length,
    averageProductValue,
    inventoryTurnover,
  };
}

// Get stock trend data for charts
export async function getStockTrendData(
  days: number = 30
): Promise<StockTrendData[]> {
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

  const movements = await getStockMovementsByDateRange(startDate, endDate);
  const products = await getAllProductsWithAlerts();

  const trendData: StockTrendData[] = [];

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
    const dateStart = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
    const dateEnd = new Date(dateStart.getTime() + 24 * 60 * 60 * 1000);

    const dayMovements = movements.filter(
      (m) =>
        m.createdAt >= dateStart.getTime() && m.createdAt < dateEnd.getTime()
    );

    // Calculate stock value for this day (simplified)
    const totalStock = products.reduce((sum, p) => sum + p.stockAvailable, 0);
    const totalValue = products.reduce(
      (sum, p) => sum + p.stockAvailable * p.unitPrice,
      0
    );

    trendData.push({
      date: date.toISOString().split("T")[0],
      stock: totalStock,
      movements: dayMovements.length,
      value: totalValue,
    });
  }

  return trendData;
}

// Get top products by movement activity
export async function getTopProducts(
  limit: number = 10
): Promise<TopProductData[]> {
  const products = await getAllProductsWithAlerts();
  const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const movements = await getStockMovementsByDateRange(last30Days, new Date());

  const productStats = products.map((product) => {
    const productMovements = movements.filter(
      (m) => m.productId === product.id
    );
    const movementCount = productMovements.length;
    const totalValue = product.stockAvailable * product.unitPrice;

    return {
      name: product.name,
      movements: movementCount,
      value: totalValue,
      currentStock: product.stockAvailable,
    };
  });

  return productStats.sort((a, b) => b.movements - a.movements).slice(0, limit);
}

// Get inventory value by category (using brand as category for now)
export async function getCategoryData(): Promise<CategoryData[]> {
  const products = await getAllProductsWithAlerts();

  const categoryMap = new Map<
    string,
    {
      value: number;
      products: number;
      stock: number;
    }
  >();

  products.forEach((product) => {
    const category = product.brand || "Sin categoría";
    const existing = categoryMap.get(category) || {
      value: 0,
      products: 0,
      stock: 0,
    };

    categoryMap.set(category, {
      value: existing.value + product.stockAvailable * product.unitPrice,
      products: existing.products + 1,
      stock: existing.stock + product.stockAvailable,
    });
  });

  return Array.from(categoryMap.entries())
    .map(([category, data]) => ({
      category,
      ...data,
    }))
    .sort((a, b) => b.value - a.value);
}

// Get movement analytics
export async function getMovementAnalytics(
  days: number = 30
): Promise<MovementAnalytics[]> {
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

  const movements = await getStockMovementsByDateRange(startDate, endDate);
  const totalMovements = movements.length;

  const analytics = new Map<string, { count: number; totalQuantity: number }>();

  movements.forEach((movement) => {
    const existing = analytics.get(movement.type) || {
      count: 0,
      totalQuantity: 0,
    };
    analytics.set(movement.type, {
      count: existing.count + 1,
      totalQuantity: existing.totalQuantity + Math.abs(movement.amount),
    });
  });

  return Array.from(analytics.entries())
    .map(([type, data]) => ({
      type,
      count: data.count,
      totalQuantity: data.totalQuantity,
      percentage: totalMovements > 0 ? (data.count / totalMovements) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count);
}

// Get alert summary
export async function getAlertSummary(): Promise<AlertSummary> {
  const productsWithAlerts = await getAllProductsWithAlerts();

  let critical = 0;
  let warning = 0;
  let info = 0;
  const criticalProducts: string[] = [];

  productsWithAlerts.forEach((product) => {
    product.alerts.forEach((alert) => {
      switch (alert.type) {
        case "OUT_OF_STOCK":
          critical++;
          criticalProducts.push(product.name);
          break;
        case "MIN_STOCK":
          warning++;
          break;
        case "MAX_STOCK":
          info++;
          break;
      }
    });
  });

  return {
    critical,
    warning,
    info,
    total: critical + warning + info,
    criticalProducts: [...new Set(criticalProducts)], // Remove duplicates
  };
}

// Get suggested restocking (products below minimum stock)
export async function getRestockingSuggestions(): Promise<
  Array<{
    product: Product;
    suggestedQuantity: number;
    priority: "high" | "medium" | "low";
  }>
> {
  const products = await getAllProductsWithAlerts();

  const suggestions = products
    .filter(
      (product) =>
        product.minStock && product.stockAvailable <= product.minStock
    )
    .map((product) => {
      const shortage = (product.minStock || 0) - product.stockAvailable;
      const maxStock = product.maxStock || (product.minStock || 0) * 3; // Default to 3x min stock
      const suggestedQuantity = Math.max(
        shortage,
        maxStock - product.stockAvailable
      );

      let priority: "high" | "medium" | "low" = "low";
      if (product.stockAvailable <= 0) {
        priority = "high";
      } else if (product.stockAvailable <= (product.minStock || 0) * 0.5) {
        priority = "medium";
      }

      return {
        product,
        suggestedQuantity,
        priority,
      };
    });

  return suggestions.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
}

// Calculate inventory health score (0-100)
export async function getInventoryHealthScore(): Promise<{
  score: number;
  factors: Array<{ name: string; score: number; weight: number }>;
}> {
  const products = await getAllProductsWithAlerts();
  const alertSummary = await getAlertSummary();
  const totalProducts = products.length;

  if (totalProducts === 0) {
    return { score: 100, factors: [] };
  }

  const factors = [
    {
      name: "Stock Availability",
      score: Math.max(0, 100 - (alertSummary.critical / totalProducts) * 100),
      weight: 0.4,
    },
    {
      name: "Stock Levels",
      score: Math.max(0, 100 - (alertSummary.warning / totalProducts) * 100),
      weight: 0.3,
    },
    {
      name: "Inventory Balance",
      score: Math.max(0, 100 - (alertSummary.info / totalProducts) * 50),
      weight: 0.2,
    },
    {
      name: "Product Diversity",
      score: Math.min(100, totalProducts * 2), // Bonus for having more products
      weight: 0.1,
    },
  ];

  const weightedScore = factors.reduce(
    (sum, factor) => sum + factor.score * factor.weight,
    0
  );

  return {
    score: Math.round(weightedScore),
    factors,
  };
}
