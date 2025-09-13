"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Brain,
  TrendingUp,
  Users,
  Package,
  AlertTriangle,
  Lightbulb,
  Target,
  Zap,
  RefreshCw,
  Eye,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import {
  ProductRecommendation,
  RecommendationContext,
} from "@/lib/ai/recommendation-engine";
import {
  SalesForecast,
  DemandPrediction,
  SeasonalPattern,
} from "@/lib/ai/predictive-analytics";
import {
  CustomerBehaviorAnalysis,
  CustomerInsight,
} from "@/lib/ai/customer-intelligence";
import { recommendationEngine } from "@/lib/ai/recommendation-engine";
import { predictiveAnalytics } from "@/lib/ai/predictive-analytics";
import { customerIntelligence } from "@/lib/ai/customer-intelligence";

interface AIInsightsPanelProps {
  selectedProducts?: string[];
  selectedCustomer?: string;
  onRecommendationClick?: (productId: string) => void;
}

export function AIInsightsPanel({
  selectedProducts = [],
  selectedCustomer,
  onRecommendationClick,
}: AIInsightsPanelProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<{
    recommendations: ProductRecommendation[];
    salesForecast: SalesForecast[];
    demandPredictions: DemandPrediction[];
    customerInsights: CustomerInsight[];
    seasonalPatterns: SeasonalPattern[];
  }>({
    recommendations: [],
    salesForecast: [],
    demandPredictions: [],
    customerInsights: [],
    seasonalPatterns: [],
  });

  useEffect(() => {
    loadInsights();
  }, [selectedProducts, selectedCustomer]);

  const loadInsights = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadRecommendations(),
        loadSalesForecast(),
        loadDemandPredictions(),
        loadCustomerInsights(),
        loadSeasonalPatterns(),
      ]);
    } catch (error) {
      console.error("Error loading AI insights:", error);
      toast.error("Error al cargar insights de IA");
    } finally {
      setLoading(false);
    }
  };

  const loadRecommendations = async () => {
    try {
      const context: RecommendationContext = {
        currentProducts: selectedProducts,
        customerId: selectedCustomer,
      };

      const recommendations = await recommendationEngine.getRecommendations(
        context,
        8
      );
      setInsights((prev) => ({ ...prev, recommendations }));
    } catch (error) {
      console.error("Error loading recommendations:", error);
    }
  };

  const loadSalesForecast = async () => {
    try {
      const forecast = await predictiveAnalytics.predictSales(7);
      setInsights((prev) => ({ ...prev, salesForecast: forecast }));
    } catch (error) {
      console.error("Error loading sales forecast:", error);
    }
  };

  const loadDemandPredictions = async () => {
    try {
      const dashboard = await predictiveAnalytics.getAnalyticsDashboard();
      setInsights((prev) => ({
        ...prev,
        demandPredictions: dashboard.topDemandPredictions,
      }));
    } catch (error) {
      console.error("Error loading demand predictions:", error);
    }
  };

  const loadCustomerInsights = async () => {
    try {
      const customerInsights =
        await customerIntelligence.generateCustomerInsights(selectedCustomer);
      setInsights((prev) => ({ ...prev, customerInsights }));
    } catch (error) {
      console.error("Error loading customer insights:", error);
    }
  };

  const loadSeasonalPatterns = async () => {
    try {
      const patterns = await predictiveAnalytics.analyzeSeasonalPatterns();
      setInsights((prev) => ({
        ...prev,
        seasonalPatterns: patterns.slice(0, 5),
      }));
    } catch (error) {
      console.error("Error loading seasonal patterns:", error);
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case "OPPORTUNITY":
        return <Target className="h-4 w-4 text-green-600" />;
      case "RISK":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case "TREND":
        return <TrendingUp className="h-4 w-4 text-blue-600" />;
      case "RECOMMENDATION":
        return <Lightbulb className="h-4 w-4 text-yellow-600" />;
      default:
        return <Brain className="h-4 w-4 text-gray-600" />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case "OPPORTUNITY":
        return "bg-green-100 text-green-800";
      case "RISK":
        return "bg-red-100 text-red-800";
      case "TREND":
        return "bg-blue-100 text-blue-800";
      case "RECOMMENDATION":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "CRITICAL":
        return "bg-red-100 text-red-800";
      case "HIGH":
        return "bg-orange-100 text-orange-800";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800";
      case "LOW":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "LOW":
        return "bg-green-100 text-green-800";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800";
      case "HIGH":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Analizando con IA...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold tracking-tight">
            Insights de IA
          </h2>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadInsights}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Actualizar
        </Button>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Resumen
          </TabsTrigger>
          <TabsTrigger
            value="recommendations"
            className="flex items-center gap-2"
          >
            <Target className="h-4 w-4" />
            Recomendaciones
          </TabsTrigger>
          <TabsTrigger value="predictions" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Predicciones
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Insights
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Recomendaciones
                    </p>
                    <p className="text-2xl font-bold">
                      {insights.recommendations.length}
                    </p>
                  </div>
                  <Target className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Predicciones
                    </p>
                    <p className="text-2xl font-bold">
                      {insights.salesForecast.length}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Insights
                    </p>
                    <p className="text-2xl font-bold">
                      {insights.customerInsights.length}
                    </p>
                  </div>
                  <Lightbulb className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Patrones
                    </p>
                    <p className="text-2xl font-bold">
                      {insights.seasonalPatterns.length}
                    </p>
                  </div>
                  <Package className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Insights Rápidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {insights.customerInsights.slice(0, 3).map((insight, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    {getInsightIcon(insight.type)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm">{insight.title}</h4>
                        <Badge className={getPriorityColor(insight.priority)}>
                          {insight.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        {insight.description}
                      </p>
                      {insight.suggestedAction && (
                        <p className="text-xs text-blue-600 mt-1">
                          💡 {insight.suggestedAction}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Recomendaciones Inteligentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {insights.recommendations.length === 0 ? (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    No hay recomendaciones disponibles
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {insights.recommendations.map((rec, index) => (
                    <div
                      key={index}
                      className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => onRecommendationClick?.(rec.productId)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{rec.productName}</h4>
                        <Badge className={getInsightColor(rec.type)}>
                          {rec.type.replace("_", " ")}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{rec.reason}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${rec.confidence * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-600">
                            {Math.round(rec.confidence * 100)}%
                          </span>
                        </div>
                        <span className="text-sm font-medium text-green-600">
                          ${rec.expectedValue.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Predictions Tab */}
        <TabsContent value="predictions" className="space-y-4">
          {/* Sales Forecast */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Pronóstico de Ventas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {insights.salesForecast.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={insights.salesForecast}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => [`${value}`, "Ventas Predichas"]}
                    />
                    <Line
                      type="monotone"
                      dataKey="predictedSales"
                      stroke="#8884d8"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-8">
                  <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    No hay datos de pronóstico disponibles
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Demand Predictions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Predicciones de Demanda
              </CardTitle>
            </CardHeader>
            <CardContent>
              {insights.demandPredictions.length > 0 ? (
                <div className="space-y-3">
                  {insights.demandPredictions.slice(0, 5).map((pred, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{pred.productName}</h4>
                        <Badge className={getRiskColor(pred.riskLevel)}>
                          {pred.riskLevel}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Demanda Predicha</p>
                          <p className="font-medium">
                            {pred.predictedDemand.toFixed(1)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Stock Recomendado</p>
                          <p className="font-medium">{pred.recommendedStock}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Confianza</p>
                          <p className="font-medium">
                            {Math.round(pred.confidence * 100)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    No hay predicciones de demanda disponibles
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Insights de Clientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {insights.customerInsights.length === 0 ? (
                <div className="text-center py-8">
                  <Lightbulb className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    No hay insights de clientes disponibles
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {insights.customerInsights.map((insight, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-start gap-3">
                        {getInsightIcon(insight.type)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium">{insight.title}</h4>
                            <Badge className={getInsightColor(insight.type)}>
                              {insight.type}
                            </Badge>
                            <Badge
                              className={getPriorityColor(insight.priority)}
                            >
                              {insight.priority}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {insight.description}
                          </p>
                          {insight.suggestedAction && (
                            <div className="flex items-center gap-2">
                              <ChevronRight className="h-4 w-4 text-blue-600" />
                              <span className="text-sm text-blue-600 font-medium">
                                {insight.suggestedAction}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center gap-2">
                              <div className="w-20 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full"
                                  style={{ width: `${insight.impact}%` }}
                                ></div>
                              </div>
                              <span className="text-xs text-gray-600">
                                Impacto: {insight.impact}%
                              </span>
                            </div>
                            {insight.actionRequired && (
                              <Badge className="bg-red-100 text-red-800">
                                Acción Requerida
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
