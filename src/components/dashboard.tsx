"use client";

import { useEffect, useState } from "react";
import {
  getDashboardMetrics,
  getStockTrendData,
  getTopProducts,
  getCategoryData,
  getMovementAnalytics,
  getAlertSummary,
  getRestockingSuggestions,
  getInventoryHealthScore,
  type DashboardMetrics,
  type StockTrendData,
  type TopProductData,
  type CategoryData,
  type MovementAnalytics,
  type AlertSummary,
} from "@/lib/analytics";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  TrendingDown,
  Package,
  AlertTriangle,
  DollarSign,
  BarChart3,
  PieChart as PieChartIcon,
  RefreshCw,
  ShoppingCart,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82CA9D",
  "#FFC658",
  "#FF7C7C",
];

export function Dashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [trendData, setTrendData] = useState<StockTrendData[]>([]);
  const [topProducts, setTopProducts] = useState<TopProductData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [movementAnalytics, setMovementAnalytics] = useState<
    MovementAnalytics[]
  >([]);
  const [alertSummary, setAlertSummary] = useState<AlertSummary | null>(null);
  const [restockingSuggestions, setRestockingSuggestions] = useState<any[]>([]);
  const [healthScore, setHealthScore] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [
        metricsData,
        trendDataResult,
        topProductsResult,
        categoryDataResult,
        movementAnalyticsResult,
        alertSummaryResult,
        restockingSuggestionsResult,
        healthScoreResult,
      ] = await Promise.all([
        getDashboardMetrics(),
        getStockTrendData(30),
        getTopProducts(10),
        getCategoryData(),
        getMovementAnalytics(30),
        getAlertSummary(),
        getRestockingSuggestions(),
        getInventoryHealthScore(),
      ]);

      setMetrics(metricsData);
      setTrendData(trendDataResult);
      setTopProducts(topProductsResult);
      setCategoryData(categoryDataResult);
      setMovementAnalytics(movementAnalyticsResult);
      setAlertSummary(alertSummaryResult);
      setRestockingSuggestions(restockingSuggestionsResult);
      setHealthScore(healthScoreResult);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  if (loading || !metrics || !alertSummary || !healthScore) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("es-ES").format(value);
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getHealthScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (score >= 60) return <AlertCircle className="h-5 w-5 text-yellow-600" />;
    return <XCircle className="h-5 w-5 text-red-600" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Análisis completo del inventario y métricas clave
          </p>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <p className="text-sm text-muted-foreground">
              Actualizado:{" "}
              {format(lastUpdated, "dd/MM/yy HH:mm", { locale: es })}
            </p>
          )}
          <Button onClick={loadDashboardData} disabled={loading}>
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Valor Total Inventario
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(metrics.totalInventoryValue)}
            </div>
            <p className="text-xs text-muted-foreground">
              Promedio por producto:{" "}
              {formatCurrency(metrics.averageProductValue)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Productos Totales
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(metrics.totalProducts)}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.outOfStockProducts} sin stock •{" "}
              {metrics.lowStockProducts} stock bajo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Movimientos</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.totalMovementsToday}
            </div>
            <p className="text-xs text-muted-foreground">
              Hoy • {metrics.totalMovementsWeek} esta semana
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Salud del Inventario
            </CardTitle>
            {getHealthScoreIcon(healthScore.score)}
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${getHealthScoreColor(
                healthScore.score
              )}`}
            >
              {healthScore.score}%
            </div>
            <p className="text-xs text-muted-foreground">
              Rotación anual: {(metrics.inventoryTurnover * 100).toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Summary */}
      {alertSummary.total > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="h-5 w-5" />
              Alertas Activas ({alertSummary.total})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-sm">
                  <strong>{alertSummary.critical}</strong> Críticas (sin stock)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span className="text-sm">
                  <strong>{alertSummary.warning}</strong> Advertencias (stock
                  bajo)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm">
                  <strong>{alertSummary.info}</strong> Información (stock alto)
                </span>
              </div>
            </div>
            {alertSummary.criticalProducts.length > 0 && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                <p className="text-sm font-medium text-red-800 mb-1">
                  Productos sin stock:
                </p>
                <p className="text-sm text-red-700">
                  {alertSummary.criticalProducts.join(", ")}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stock Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Tendencia de Stock (30 días)</CardTitle>
            <CardDescription>
              Evolución del stock total y movimientos diarios
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(date) => format(new Date(date), "dd/MM")}
                />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip
                  labelFormatter={(date) =>
                    format(new Date(date), "dd/MM/yyyy", { locale: es })
                  }
                  formatter={(value, name) => [
                    name === "value"
                      ? formatCurrency(Number(value))
                      : formatNumber(Number(value)),
                    name === "stock"
                      ? "Stock Total"
                      : name === "movements"
                      ? "Movimientos"
                      : "Valor",
                  ]}
                />
                <Legend />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="stock"
                  stroke="#8884d8"
                  fill="#8884d8"
                  fillOpacity={0.6}
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="movements"
                  stroke="#82ca9d"
                  fill="#82ca9d"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Movement Analytics */}
        <Card>
          <CardHeader>
            <CardTitle>Análisis de Movimientos (30 días)</CardTitle>
            <CardDescription>
              Distribución por tipo de movimiento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={movementAnalytics}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ type, percentage }) =>
                    `${type} (${percentage.toFixed(1)}%)`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {movementAnalytics.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [
                    `${value} movimientos`,
                    "Cantidad",
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>Productos Más Activos</CardTitle>
            <CardDescription>
              Por número de movimientos en los últimos 30 días
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topProducts.slice(0, 8)} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={80} />
                <Tooltip
                  formatter={(value, name) => [
                    name === "value" ? formatCurrency(Number(value)) : value,
                    name === "movements"
                      ? "Movimientos"
                      : name === "value"
                      ? "Valor Total"
                      : "Stock Actual",
                  ]}
                />
                <Legend />
                <Bar dataKey="movements" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribución por Categoría</CardTitle>
            <CardDescription>
              Valor de inventario por marca/categoría
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData.slice(0, 6)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="category"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip
                  formatter={(value, name) => [
                    name === "value" ? formatCurrency(Number(value)) : value,
                    name === "value"
                      ? "Valor Total"
                      : name === "products"
                      ? "Productos"
                      : "Stock Total",
                  ]}
                />
                <Legend />
                <Bar dataKey="value" fill="#00C49F" />
                <Bar dataKey="products" fill="#FFBB28" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Restocking Suggestions */}
      {restockingSuggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Sugerencias de Reposición ({restockingSuggestions.length})
            </CardTitle>
            <CardDescription>
              Productos que necesitan restock basado en stock mínimo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {restockingSuggestions.slice(0, 5).map((suggestion, index) => (
                <div
                  key={index}
                  className={`p-3 border rounded-lg ${
                    suggestion.priority === "high"
                      ? "border-red-200 bg-red-50"
                      : suggestion.priority === "medium"
                      ? "border-orange-200 bg-orange-50"
                      : "border-gray-200 bg-gray-50"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium">{suggestion.product.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Stock actual: {suggestion.product.stockAvailable} •
                        Mínimo: {suggestion.product.minStock}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        Reponer: {suggestion.suggestedQuantity} unidades
                      </div>
                      <div
                        className={`text-sm font-medium ${
                          suggestion.priority === "high"
                            ? "text-red-600"
                            : suggestion.priority === "medium"
                            ? "text-orange-600"
                            : "text-gray-600"
                        }`}
                      >
                        Prioridad:{" "}
                        {suggestion.priority === "high"
                          ? "Alta"
                          : suggestion.priority === "medium"
                          ? "Media"
                          : "Baja"}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {restockingSuggestions.length > 5 && (
                <p className="text-sm text-muted-foreground text-center">
                  ... y {restockingSuggestions.length - 5} productos más
                  necesitan reposición
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
