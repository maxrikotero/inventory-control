"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import {
  DollarSign,
  ShoppingCart,
  Users,
  TrendingUp,
  Package,
  Calendar,
  Eye,
  X,
  Brain,
  Settings,
} from "lucide-react";
import { SalesAnalytics, SaleStatus } from "@/types/sales";
import { getSalesAnalytics } from "@/lib/sales";
import { SalesTable } from "./sales-table";
import { SalesForm } from "./sales-form";
import { AIInsightsPanel } from "./ai-insights-panel";
import { AIAutomationPanel } from "./ai-automation-panel";

interface SalesDashboardProps {
  onSaleUpdate?: () => void;
}

export function SalesDashboard({ onSaleUpdate }: SalesDashboardProps) {
  const [analytics, setAnalytics] = useState<SalesAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "overview" | "sales" | "ai" | "automation"
  >("overview");
  const [showSalesForm, setShowSalesForm] = useState(false);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const analyticsData = await getSalesAnalytics();
      setAnalytics(analyticsData);
    } catch (error) {
      console.error("Error loading sales analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaleUpdate = () => {
    loadAnalytics();
    onSaleUpdate?.();
  };

  const handleSaleCreated = () => {
    setShowSalesForm(false);
    handleSaleUpdate();
  };

  // Chart data preparation
  const salesByPeriodData =
    analytics?.salesByPeriod.map((period) => ({
      ...period,
      period: new Date(period.period).toLocaleDateString("es-ES", {
        month: "short",
        day: "numeric",
      }),
    })) || [];

  const topProductsData =
    analytics?.topProducts.slice(0, 5).map((product) => ({
      name:
        product.productName.length > 15
          ? product.productName.substring(0, 15) + "..."
          : product.productName,
      revenue: product.revenue,
      quantity: product.quantitySold,
    })) || [];

  const customerSegmentsData =
    analytics?.customerSegments
      .filter((segment) => segment.count > 0)
      .map((segment) => ({
        name: segment.segment,
        value: segment.count,
        revenue: segment.revenue,
      })) || [];

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (activeTab === "sales") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              Gestión de Ventas
            </h2>
            <p className="text-sm text-muted-foreground">
              Administra todas las ventas y transacciones
            </p>
          </div>
          <Button onClick={() => setActiveTab("overview")} variant="outline">
            <Eye className="h-4 w-4 mr-2" />
            Ver Resumen
          </Button>
        </div>
        <SalesTable onSaleUpdate={handleSaleUpdate} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            Dashboard de Ventas
          </h2>
          <p className="text-sm text-muted-foreground">
            Resumen de ventas y métricas de rendimiento
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setActiveTab("sales")} variant="outline">
            <Package className="h-4 w-4 mr-2" />
            Ver Ventas
          </Button>
          <Button onClick={() => setActiveTab("ai")} variant="outline">
            <Brain className="h-4 w-4 mr-2" />
            IA Insights
          </Button>
          <Button onClick={() => setActiveTab("automation")} variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Automatización
          </Button>
          <Button onClick={() => setShowSalesForm(true)}>
            <ShoppingCart className="h-4 w-4 mr-2" />
            Nueva Venta
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">
                  Total Ventas
                </p>
                <p className="text-2xl font-bold">
                  {analytics?.totalSales || 0}
                </p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <ShoppingCart className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">
                  Ingresos Totales
                </p>
                <p className="text-2xl font-bold text-green-600">
                  ${analytics?.totalRevenue.toFixed(2) || "0.00"}
                </p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">
                  Ticket Promedio
                </p>
                <p className="text-2xl font-bold">
                  ${analytics?.averageOrderValue.toFixed(2) || "0.00"}
                </p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">
                  Total Clientes
                </p>
                <p className="text-2xl font-bold">
                  {analytics?.totalCustomers || 0}
                </p>
              </div>
              <div className="p-2 bg-orange-100 rounded-lg">
                <Users className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales by Period */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Ventas por Período
            </CardTitle>
          </CardHeader>
          <CardContent>
            {salesByPeriodData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={salesByPeriodData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip
                    formatter={(value, name) => [
                      name === "revenue" ? `$${value}` : value,
                      name === "revenue" ? "Ingresos" : "Ventas",
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#8884d8"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                <div className="text-center">
                  <Calendar className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p>No hay datos de ventas</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Customer Segments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Segmentos de Clientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {customerSegmentsData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={customerSegmentsData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} ${((percent || 0) * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {customerSegmentsData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                <div className="text-center">
                  <Users className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p>No hay datos de clientes</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Products */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Productos Más Vendidos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topProductsData.length > 0 ? (
            <div className="space-y-4">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topProductsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip
                    formatter={(value, name) => [
                      name === "revenue" ? `$${value}` : value,
                      name === "revenue" ? "Ingresos" : "Cantidad",
                    ]}
                  />
                  <Bar dataKey="revenue" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                {analytics?.topProducts.slice(0, 6).map((product, index) => (
                  <div
                    key={product.productId}
                    className="p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm">
                        {product.productName}
                      </h4>
                      <Badge variant="secondary">#{index + 1}</Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>{product.quantitySold} unidades vendidas</p>
                      <p className="font-medium text-green-600">
                        ${product.revenue.toFixed(2)} en ingresos
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              <div className="text-center">
                <Package className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p>No hay productos vendidos</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Insights Tab */}
      {activeTab === "ai" && <AIInsightsPanel />}

      {/* Automation Tab */}
      {activeTab === "automation" && <AIAutomationPanel />}

      {/* Sales Form Modal */}
      {showSalesForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Nueva Venta</h3>
                <Button
                  variant="outline"
                  onClick={() => setShowSalesForm(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <SalesForm
                onSaleCreated={handleSaleCreated}
                onCancel={() => setShowSalesForm(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
