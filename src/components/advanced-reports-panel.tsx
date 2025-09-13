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
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
} from "recharts";
import {
  FileText,
  TrendingUp,
  Package,
  Users,
  Brain,
  Download,
  RefreshCw,
  Eye,
  AlertTriangle,
  CheckCircle,
  Info,
  Zap,
  Calendar,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import {
  advancedReports,
  ReportData,
  ReportType,
  ReportPeriod,
  ReportFilters,
} from "@/lib/advanced-reports";

interface AdvancedReportsPanelProps {
  className?: string;
}

export function AdvancedReportsPanel({ className }: AdvancedReportsPanelProps) {
  const [activeTab, setActiveTab] = useState("inventory");
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>("MONTHLY");
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState<{
    inventory?: ReportData;
    sales?: ReportData;
    ml?: ReportData;
    executive?: ReportData;
  }>({});

  useEffect(() => {
    loadReports();
  }, [selectedPeriod]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const [inventoryReport, salesReport, mlReport, executiveReport] =
        await Promise.all([
          advancedReports.generateInventoryAnalysisReport(selectedPeriod),
          advancedReports.generateSalesPerformanceReport(selectedPeriod),
          advancedReports.generateMLInsightsReport(selectedPeriod),
          advancedReports.generateExecutiveSummaryReport(selectedPeriod),
        ]);

      setReports({
        inventory: inventoryReport,
        sales: salesReport,
        ml: mlReport,
        executive: executiveReport,
      });
    } catch (error) {
      console.error("Error loading reports:", error);
      toast.error("Error al cargar reportes avanzados");
    } finally {
      setLoading(false);
    }
  };

  const exportReport = (report: ReportData) => {
    const dataStr = JSON.stringify(report, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

    const exportFileDefaultName = `${report.type.toLowerCase()}-${selectedPeriod.toLowerCase()}-${
      new Date().toISOString().split("T")[0]
    }.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();

    toast.success("Reporte exportado exitosamente");
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case "SUCCESS":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "WARNING":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case "ERROR":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case "INFO":
        return <Info className="h-4 w-4 text-blue-600" />;
      default:
        return <Info className="h-4 w-4 text-gray-600" />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case "SUCCESS":
        return "bg-green-100 text-green-800";
      case "WARNING":
        return "bg-yellow-100 text-yellow-800";
      case "ERROR":
        return "bg-red-100 text-red-800";
      case "INFO":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
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

  const renderChart = (chart: any) => {
    const commonProps = {
      width: "100%",
      height: 300,
    };

    switch (chart.type) {
      case "LINE":
        return (
          <ResponsiveContainer {...commonProps}>
            <LineChart data={chart.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={chart.xAxis} />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey={chart.yAxis?.toLowerCase()}
                stroke="#8884d8"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        );
      case "BAR":
        return (
          <ResponsiveContainer {...commonProps}>
            <BarChart data={chart.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="current" fill="#8884d8" />
              <Bar dataKey="minimum" fill="#82ca9d" />
              <Bar dataKey="maximum" fill="#ffc658" />
            </BarChart>
          </ResponsiveContainer>
        );
      case "PIE":
        return (
          <ResponsiveContainer {...commonProps}>
            <PieChart>
              <Pie
                data={chart.data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chart.data.map((entry: any, index: number) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      chart.colors?.[index % chart.colors.length] || "#8884d8"
                    }
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );
      case "AREA":
        return (
          <ResponsiveContainer {...commonProps}>
            <AreaChart data={chart.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={chart.xAxis} />
              <YAxis />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="revenue"
                stackId="1"
                stroke="#8884d8"
                fill="#8884d8"
              />
              <Area
                type="monotone"
                dataKey="profit"
                stackId="1"
                stroke="#82ca9d"
                fill="#82ca9d"
              />
            </AreaChart>
          </ResponsiveContainer>
        );
      case "SCATTER":
        return (
          <ResponsiveContainer {...commonProps}>
            <ScatterChart data={chart.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={chart.xAxis} />
              <YAxis dataKey={chart.yAxis} />
              <Tooltip />
              <Scatter fill="#8884d8" />
            </ScatterChart>
          </ResponsiveContainer>
        );
      default:
        return <div>Chart type not supported</div>;
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">
                Generando reportes avanzados...
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold tracking-tight">
            Reportes Avanzados
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as ReportPeriod)}
            className="px-3 py-1 border rounded-md text-sm"
          >
            <option value="DAILY">Diario</option>
            <option value="WEEKLY">Semanal</option>
            <option value="MONTHLY">Mensual</option>
            <option value="QUARTERLY">Trimestral</option>
            <option value="YEARLY">Anual</option>
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={loadReports}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Actualizar
          </Button>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="inventory" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Inventario
          </TabsTrigger>
          <TabsTrigger value="sales" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Ventas
          </TabsTrigger>
          <TabsTrigger value="ml" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            ML Insights
          </TabsTrigger>
          <TabsTrigger value="executive" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Ejecutivo
          </TabsTrigger>
        </TabsList>

        {/* Inventory Analysis Tab */}
        <TabsContent value="inventory" className="space-y-4">
          {reports.inventory && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Valor Total
                        </p>
                        <p className="text-2xl font-bold">
                          $
                          {reports.inventory.summary.totalRevenue.toLocaleString()}
                        </p>
                      </div>
                      <Package className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Productos
                        </p>
                        <p className="text-2xl font-bold">
                          {reports.inventory.summary.totalProducts}
                        </p>
                      </div>
                      <Package className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Rotación
                        </p>
                        <p className="text-2xl font-bold">
                          {reports.inventory.summary.keyMetrics.turnoverRate?.toFixed(
                            2
                          ) || "N/A"}
                        </p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Stock Bajo
                        </p>
                        <p className="text-2xl font-bold">
                          {reports.inventory.summary.keyMetrics.stockoutRate?.toFixed(
                            1
                          ) || "0"}
                          %
                        </p>
                      </div>
                      <AlertTriangle className="h-8 w-8 text-red-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {reports.inventory.charts.map((chart, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        {chart.title}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => exportReport(reports.inventory!)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>{renderChart(chart)}</CardContent>
                  </Card>
                ))}
              </div>

              {/* Insights */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Insights de Inventario
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {reports.inventory.insights.map((insight, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                      >
                        {getInsightIcon(insight.type)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-sm">
                              {insight.title}
                            </h4>
                            <Badge className={getInsightColor(insight.type)}>
                              {insight.type}
                            </Badge>
                            <Badge className={getImpactColor(insight.impact)}>
                              {insight.impact}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">
                            {insight.description}
                          </p>
                          {insight.value && (
                            <p className="text-xs text-blue-600 mt-1">
                              Valor: {insight.value}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Recomendaciones
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {reports.inventory.recommendations.map(
                      (recommendation, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 p-2 bg-blue-50 rounded"
                        >
                          <CheckCircle className="h-4 w-4 text-blue-600" />
                          <span className="text-sm">{recommendation}</span>
                        </div>
                      )
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Sales Performance Tab */}
        <TabsContent value="sales" className="space-y-4">
          {reports.sales && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Ingresos
                        </p>
                        <p className="text-2xl font-bold">
                          ${reports.sales.summary.totalRevenue.toLocaleString()}
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
                          Ventas
                        </p>
                        <p className="text-2xl font-bold">
                          {reports.sales.summary.totalSales}
                        </p>
                      </div>
                      <FileText className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Ticket Promedio
                        </p>
                        <p className="text-2xl font-bold">
                          ${reports.sales.summary.averageOrderValue.toFixed(2)}
                        </p>
                      </div>
                      <Users className="h-8 w-8 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Crecimiento
                        </p>
                        <p
                          className={`text-2xl font-bold ${
                            reports.sales.summary.growthRate >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {reports.sales.summary.growthRate >= 0 ? "+" : ""}
                          {reports.sales.summary.growthRate.toFixed(1)}%
                        </p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-orange-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {reports.sales.charts.map((chart, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        {chart.title}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => exportReport(reports.sales!)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>{renderChart(chart)}</CardContent>
                  </Card>
                ))}
              </div>

              {/* Insights and Recommendations */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5" />
                      Insights de Ventas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {reports.sales.insights.map((insight, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                        >
                          {getInsightIcon(insight.type)}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-sm">
                                {insight.title}
                              </h4>
                              <Badge className={getInsightColor(insight.type)}>
                                {insight.type}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">
                              {insight.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      Recomendaciones
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {reports.sales.recommendations.map(
                        (recommendation, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 p-2 bg-blue-50 rounded"
                          >
                            <CheckCircle className="h-4 w-4 text-blue-600" />
                            <span className="text-sm">{recommendation}</span>
                          </div>
                        )
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* ML Insights Tab */}
        <TabsContent value="ml" className="space-y-4">
          {reports.ml && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Insights Total
                        </p>
                        <p className="text-2xl font-bold">
                          {reports.ml.summary.keyMetrics.totalInsights}
                        </p>
                      </div>
                      <Brain className="h-8 w-8 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Críticos
                        </p>
                        <p className="text-2xl font-bold text-red-600">
                          {reports.ml.summary.keyMetrics.criticalInsights}
                        </p>
                      </div>
                      <AlertTriangle className="h-8 w-8 text-red-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Precisión ML
                        </p>
                        <p className="text-2xl font-bold">
                          {reports.ml.summary.keyMetrics.averageAccuracy?.toFixed(
                            1
                          ) || "0"}
                          %
                        </p>
                      </div>
                      <Brain className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Modelos
                        </p>
                        <p className="text-2xl font-bold">
                          {reports.ml.summary.keyMetrics.trainedModels}
                        </p>
                      </div>
                      <Brain className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {reports.ml.charts.map((chart, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        {chart.title}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => exportReport(reports.ml!)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>{renderChart(chart)}</CardContent>
                  </Card>
                ))}
              </div>

              {/* ML Insights */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    Insights de Machine Learning
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {reports.ml.insights.map((insight, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                      >
                        {getInsightIcon(insight.type)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-sm">
                              {insight.title}
                            </h4>
                            <Badge className={getInsightColor(insight.type)}>
                              {insight.type}
                            </Badge>
                            <Badge className={getImpactColor(insight.impact)}>
                              {insight.impact}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">
                            {insight.description}
                          </p>
                          {insight.value && (
                            <p className="text-xs text-blue-600 mt-1">
                              Confianza: {insight.value}%
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Recomendaciones ML
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {reports.ml.recommendations.map((recommendation, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-2 bg-purple-50 rounded"
                      >
                        <Brain className="h-4 w-4 text-purple-600" />
                        <span className="text-sm">{recommendation}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Executive Summary Tab */}
        <TabsContent value="executive" className="space-y-4">
          {reports.executive && (
            <>
              {/* Executive Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Ingresos Totales
                        </p>
                        <p className="text-2xl font-bold">
                          $
                          {reports.executive.summary.totalRevenue.toLocaleString()}
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
                          Crecimiento
                        </p>
                        <p
                          className={`text-2xl font-bold ${
                            reports.executive.summary.growthRate >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {reports.executive.summary.growthRate >= 0 ? "+" : ""}
                          {reports.executive.summary.growthRate.toFixed(1)}%
                        </p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Productos Activos
                        </p>
                        <p className="text-2xl font-bold">
                          {reports.executive.summary.totalProducts}
                        </p>
                      </div>
                      <Package className="h-8 w-8 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Clientes Únicos
                        </p>
                        <p className="text-2xl font-bold">
                          {reports.executive.summary.totalCustomers}
                        </p>
                      </div>
                      <Users className="h-8 w-8 text-orange-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Executive Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {reports.executive.charts.map((chart, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        {chart.title}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => exportReport(reports.executive!)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>{renderChart(chart)}</CardContent>
                  </Card>
                ))}
              </div>

              {/* Top Insights */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Insights Ejecutivos Principales
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {reports.executive.insights.map((insight, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                      >
                        {getInsightIcon(insight.type)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-sm">
                              {insight.title}
                            </h4>
                            <Badge className={getInsightColor(insight.type)}>
                              {insight.type}
                            </Badge>
                            <Badge className={getImpactColor(insight.impact)}>
                              {insight.impact}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">
                            {insight.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Executive Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Recomendaciones Ejecutivas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {reports.executive.recommendations.map(
                      (recommendation, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 p-2 bg-green-50 rounded"
                        >
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm">{recommendation}</span>
                        </div>
                      )
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
