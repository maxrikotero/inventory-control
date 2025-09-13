import { Product } from "@/types/product";
import { Sale } from "@/types/sales";

// Types for performance optimization
export type PerformanceMetric = {
  name: string;
  value: number;
  unit: string;
  threshold: number;
  status: "GOOD" | "WARNING" | "CRITICAL";
  description: string;
  improvement?: string;
};

export type OptimizationSuggestion = {
  id: string;
  type:
    | "CACHE"
    | "LAZY_LOADING"
    | "BUNDLE_SPLITTING"
    | "IMAGE_OPTIMIZATION"
    | "DATABASE"
    | "API";
  title: string;
  description: string;
  impact: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  effort: "LOW" | "MEDIUM" | "HIGH";
  estimatedImprovement: number; // percentage
  implementation: string;
  priority: number;
};

export type PerformanceReport = {
  timestamp: Date;
  overallScore: number;
  metrics: PerformanceMetric[];
  suggestions: OptimizationSuggestion[];
  summary: {
    criticalIssues: number;
    warnings: number;
    optimizations: number;
  };
};

export type CacheStrategy = {
  key: string;
  data: any;
  ttl: number; // time to live in milliseconds
  lastUpdated: Date;
  hitCount: number;
  missCount: number;
};

// Performance optimization engine
export class PerformanceOptimizer {
  private cache: Map<string, CacheStrategy> = new Map();
  private metrics: Map<string, PerformanceMetric> = new Map();
  private isMonitoring = false;
  private monitoringInterval?: NodeJS.Timeout;

  // Initialize performance monitoring
  startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
    }, 5000); // Collect metrics every 5 seconds
  }

  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
    this.isMonitoring = false;
  }

  // Cache management
  setCache(key: string, data: any, ttl: number = 300000): void {
    // 5 minutes default
    const cacheEntry: CacheStrategy = {
      key,
      data,
      ttl,
      lastUpdated: new Date(),
      hitCount: 0,
      missCount: 0,
    };

    this.cache.set(key, cacheEntry);
  }

  getCache(key: string): any | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if cache is expired
    const now = new Date();
    const isExpired = now.getTime() - entry.lastUpdated.getTime() > entry.ttl;

    if (isExpired) {
      entry.missCount++;
      this.cache.delete(key);
      return null;
    }

    entry.hitCount++;
    return entry.data;
  }

  clearCache(pattern?: string): void {
    if (pattern) {
      const regex = new RegExp(pattern);
      for (const key of this.cache.keys()) {
        if (regex.test(key)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  getCacheStats(): {
    hitRate: number;
    totalEntries: number;
    totalHits: number;
    totalMisses: number;
  } {
    let totalHits = 0;
    let totalMisses = 0;

    this.cache.forEach((entry) => {
      totalHits += entry.hitCount;
      totalMisses += entry.missCount;
    });

    const totalRequests = totalHits + totalMisses;
    const hitRate = totalRequests > 0 ? (totalHits / totalRequests) * 100 : 0;

    return {
      hitRate,
      totalEntries: this.cache.size,
      totalHits,
      totalMisses,
    };
  }

  // Performance metrics collection
  private collectMetrics(): void {
    // Memory usage
    if (typeof window !== "undefined" && "memory" in performance) {
      const memory = (performance as any).memory;
      if (memory) {
        this.setMetric(
          "memory_used",
          memory.usedJSHeapSize / 1024 / 1024,
          "MB",
          100,
          "Uso de memoria JavaScript"
        );
        this.setMetric(
          "memory_limit",
          memory.jsHeapSizeLimit / 1024 / 1024,
          "MB",
          500,
          "Límite de memoria JavaScript"
        );
        this.setMetric(
          "memory_total",
          memory.totalJSHeapSize / 1024 / 1024,
          "MB",
          200,
          "Memoria total asignada"
        );
      }
    }

    // Navigation timing
    if (typeof window !== "undefined" && performance.timing) {
      const timing = performance.timing;
      const loadTime = timing.loadEventEnd - timing.navigationStart;
      this.setMetric(
        "page_load_time",
        loadTime,
        "ms",
        3000,
        "Tiempo de carga de página"
      );

      const domReady = timing.domContentLoadedEventEnd - timing.navigationStart;
      this.setMetric(
        "dom_ready_time",
        domReady,
        "ms",
        2000,
        "Tiempo de DOM listo"
      );
    }

    // Cache performance
    const cacheStats = this.getCacheStats();
    this.setMetric(
      "cache_hit_rate",
      cacheStats.hitRate,
      "%",
      80,
      "Tasa de aciertos de caché"
    );
    this.setMetric(
      "cache_entries",
      cacheStats.totalEntries,
      "entries",
      1000,
      "Número de entradas en caché"
    );

    // Bundle size estimation (simulated)
    this.setMetric(
      "bundle_size",
      this.estimateBundleSize(),
      "KB",
      500,
      "Tamaño estimado del bundle"
    );
  }

  private setMetric(
    name: string,
    value: number,
    unit: string,
    threshold: number,
    description: string
  ): void {
    let status: "GOOD" | "WARNING" | "CRITICAL" = "GOOD";

    if (value > threshold * 1.5) {
      status = "CRITICAL";
    } else if (value > threshold) {
      status = "WARNING";
    }

    this.metrics.set(name, {
      name,
      value,
      unit,
      threshold,
      status,
      description,
    });
  }

  private estimateBundleSize(): number {
    // Simulate bundle size calculation
    // In a real implementation, this would use webpack-bundle-analyzer or similar
    return Math.random() * 1000 + 200; // 200-1200 KB
  }

  // Data optimization methods
  optimizeProductList(products: Product[]): Product[] {
    // Remove unnecessary fields and optimize data structure
    return products.map((product) => ({
      id: product.id,
      name: product.name,
      currentStock: product.currentStock,
      unitPrice: product.unitPrice,
      category: product.category,
      // Remove heavy fields like description, images, etc. for list views
    })) as Product[];
  }

  optimizeSalesList(sales: Sale[]): Sale[] {
    // Optimize sales data for better performance
    return sales.map((sale) => ({
      id: sale.id,
      customerId: sale.customerId,
      total: sale.total,
      createdAt: sale.createdAt,
      status: sale.status,
      // Remove heavy fields like items for list views
    })) as Sale[];
  }

  // Lazy loading utilities
  createLazyLoader<T>(
    loadFunction: () => Promise<T[]>,
    cacheKey: string,
    ttl: number = 300000
  ): () => Promise<T[]> {
    return async (): Promise<T[]> => {
      // Check cache first
      const cached = this.getCache(cacheKey);
      if (cached) {
        return cached;
      }

      // Load data
      const data = await loadFunction();

      // Cache the result
      this.setCache(cacheKey, data, ttl);

      return data;
    };
  }

  // Debounce utility for search and filtering
  debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;

    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }

  // Throttle utility for scroll events
  throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;

    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }

  // Virtual scrolling helper
  calculateVirtualScrollItems(
    totalItems: number,
    containerHeight: number,
    itemHeight: number,
    scrollTop: number
  ): { startIndex: number; endIndex: number; visibleItems: number } {
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(startIndex + visibleCount + 1, totalItems - 1);

    return {
      startIndex,
      endIndex,
      visibleItems: endIndex - startIndex + 1,
    };
  }

  // Image optimization
  optimizeImageUrl(
    url: string,
    width?: number,
    height?: number,
    quality: number = 80
  ): string {
    // In a real implementation, this would integrate with an image optimization service
    // For now, we'll simulate with query parameters
    const params = new URLSearchParams();

    if (width) params.set("w", width.toString());
    if (height) params.set("h", height.toString());
    params.set("q", quality.toString());
    params.set("f", "webp"); // Use WebP format for better compression

    return `${url}?${params.toString()}`;
  }

  // Bundle splitting suggestions
  generateBundleOptimizationSuggestions(): OptimizationSuggestion[] {
    return [
      {
        id: "bundle-split-vendor",
        type: "BUNDLE_SPLITTING",
        title: "Separar vendor libraries",
        description:
          "Crear un bundle separado para librerías de terceros (React, lodash, etc.)",
        impact: "HIGH",
        effort: "MEDIUM",
        estimatedImprovement: 30,
        implementation:
          "Configurar webpack splitChunks para separar vendor code",
        priority: 1,
      },
      {
        id: "bundle-split-routes",
        type: "BUNDLE_SPLITTING",
        title: "Code splitting por rutas",
        description: "Implementar lazy loading de componentes por ruta",
        impact: "HIGH",
        effort: "MEDIUM",
        estimatedImprovement: 40,
        implementation:
          "Usar React.lazy() y Suspense para cargar componentes bajo demanda",
        priority: 2,
      },
      {
        id: "bundle-tree-shaking",
        type: "BUNDLE_SPLITTING",
        title: "Tree shaking optimizado",
        description: "Eliminar código no utilizado de las librerías",
        impact: "MEDIUM",
        effort: "LOW",
        estimatedImprovement: 15,
        implementation:
          "Configurar webpack para tree shaking y usar imports específicos",
        priority: 3,
      },
    ];
  }

  // API optimization suggestions
  generateAPIOptimizationSuggestions(): OptimizationSuggestion[] {
    return [
      {
        id: "api-pagination",
        type: "API",
        title: "Implementar paginación",
        description:
          "Agregar paginación a las APIs para reducir el tamaño de respuesta",
        impact: "HIGH",
        effort: "MEDIUM",
        estimatedImprovement: 60,
        implementation: "Agregar parámetros limit y offset a las consultas",
        priority: 1,
      },
      {
        id: "api-caching",
        type: "CACHE",
        title: "Cache de respuestas API",
        description:
          "Implementar cache HTTP para respuestas que no cambian frecuentemente",
        impact: "HIGH",
        effort: "LOW",
        estimatedImprovement: 50,
        implementation: "Agregar headers Cache-Control a las respuestas API",
        priority: 2,
      },
      {
        id: "api-compression",
        type: "API",
        title: "Compresión de respuestas",
        description: "Comprimir respuestas API con gzip/brotli",
        impact: "MEDIUM",
        effort: "LOW",
        estimatedImprovement: 70,
        implementation: "Configurar middleware de compresión en el servidor",
        priority: 3,
      },
    ];
  }

  // Database optimization suggestions
  generateDatabaseOptimizationSuggestions(): OptimizationSuggestion[] {
    return [
      {
        id: "db-indexes",
        type: "DATABASE",
        title: "Optimizar índices",
        description: "Agregar índices en campos frecuentemente consultados",
        impact: "HIGH",
        effort: "MEDIUM",
        estimatedImprovement: 80,
        implementation:
          "Crear índices en campos como productId, customerId, createdAt",
        priority: 1,
      },
      {
        id: "db-query-optimization",
        type: "DATABASE",
        title: "Optimizar consultas",
        description: "Revisar y optimizar consultas lentas",
        impact: "HIGH",
        effort: "HIGH",
        estimatedImprovement: 60,
        implementation:
          "Usar EXPLAIN para analizar consultas y optimizar JOINs",
        priority: 2,
      },
      {
        id: "db-connection-pooling",
        type: "DATABASE",
        title: "Connection pooling",
        description: "Implementar pool de conexiones para mejor rendimiento",
        impact: "MEDIUM",
        effort: "MEDIUM",
        estimatedImprovement: 30,
        implementation:
          "Configurar pool de conexiones en la configuración de la base de datos",
        priority: 3,
      },
    ];
  }

  // Generate comprehensive performance report
  generatePerformanceReport(): PerformanceReport {
    const metrics = Array.from(this.metrics.values());
    const suggestions: OptimizationSuggestion[] = [
      ...this.generateBundleOptimizationSuggestions(),
      ...this.generateAPIOptimizationSuggestions(),
      ...this.generateDatabaseOptimizationSuggestions(),
    ];

    // Calculate overall score
    const criticalIssues = metrics.filter(
      (m) => m.status === "CRITICAL"
    ).length;
    const warnings = metrics.filter((m) => m.status === "WARNING").length;
    const goodMetrics = metrics.filter((m) => m.status === "GOOD").length;

    const totalMetrics = metrics.length;
    const overallScore =
      totalMetrics > 0
        ? (goodMetrics * 100 + warnings * 50) / totalMetrics
        : 100;

    // Sort suggestions by priority
    suggestions.sort((a, b) => a.priority - b.priority);

    return {
      timestamp: new Date(),
      overallScore,
      metrics,
      suggestions,
      summary: {
        criticalIssues,
        warnings,
        optimizations: suggestions.length,
      },
    };
  }

  // Performance monitoring utilities
  measurePerformance<T>(name: string, fn: () => T): T {
    const start = performance.now();
    const result = fn();
    const end = performance.now();

    console.log(`Performance: ${name} took ${(end - start).toFixed(2)}ms`);

    // Store performance metric
    this.setMetric(
      `perf_${name}`,
      end - start,
      "ms",
      100,
      `Tiempo de ejecución de ${name}`
    );

    return result;
  }

  async measureAsyncPerformance<T>(
    name: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();

    console.log(`Performance: ${name} took ${(end - start).toFixed(2)}ms`);

    // Store performance metric
    this.setMetric(
      `perf_${name}`,
      end - start,
      "ms",
      1000,
      `Tiempo de ejecución asíncrono de ${name}`
    );

    return result;
  }

  // Memory management
  cleanup(): void {
    this.stopMonitoring();
    this.clearCache();
    this.metrics.clear();
  }

  // Get current performance status
  getPerformanceStatus(): {
    score: number;
    status: "EXCELLENT" | "GOOD" | "WARNING" | "CRITICAL";
    issues: string[];
  } {
    const report = this.generatePerformanceReport();
    const criticalIssues = report.summary.criticalIssues;
    const warnings = report.summary.warnings;

    let status: "EXCELLENT" | "GOOD" | "WARNING" | "CRITICAL";
    const issues: string[] = [];

    if (criticalIssues > 0) {
      status = "CRITICAL";
      issues.push(`${criticalIssues} problemas críticos detectados`);
    } else if (warnings > 3) {
      status = "WARNING";
      issues.push(`${warnings} advertencias de rendimiento`);
    } else if (report.overallScore >= 90) {
      status = "EXCELLENT";
    } else {
      status = "GOOD";
    }

    return {
      score: report.overallScore,
      status,
      issues,
    };
  }
}

// Singleton instance
export const performanceOptimizer = new PerformanceOptimizer();
