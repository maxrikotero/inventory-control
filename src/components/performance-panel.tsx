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
  Zap,
  Activity,
  Database,
  Cpu,
  Memory,
  HardDrive,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Info,
  TrendingUp,
  Settings,
  Play,
  Pause,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  performanceOptimizer,
  PerformanceReport,
  PerformanceMetric,
  OptimizationSuggestion,
} from "@/lib/performance-optimizer";

interface PerformancePanelProps {
  className?: string;
}

export function PerformancePanel({ className }: PerformancePanelProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [report, setReport] = useState<PerformanceReport | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Start monitoring on component mount
    startMonitoring();

    // Generate initial report
    generateReport();

    return () => {
      // Cleanup on unmount
      performanceOptimizer.stopMonitoring();
    };
  }, []);

  const startMonitoring = () => {
    performanceOptimizer.startMonitoring();
    setIsMonitoring(true);
    toast.success("Monitoreo de rendimiento iniciado");
  };

  const stopMonitoring = () => {
    performanceOptimizer.stopMonitoring();
    setIsMonitoring(false);
    toast.success("Monitoreo de rendimiento detenido");
  };

  const generateReport = () => {
    setLoading(true);
    try {
      const newReport = performanceOptimizer.generatePerformanceReport();
      setReport(newReport);
    } catch (error) {
      console.error("Error generating performance report:", error);
      toast.error("Error al generar reporte de rendimiento");
    } finally {
      setLoading(false);
    }
  };

  const clearCache = () => {
    performanceOptimizer.clearCache();
    toast.success("Caché limpiado exitosamente");
    generateReport();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "GOOD":
        return "bg-green-100 text-green-800";
      case "WARNING":
        return "bg-yellow-100 text-yellow-800";
      case "CRITICAL":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "GOOD":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "WARNING":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case "CRITICAL":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Info className="h-4 w-4 text-gray-600" />;
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

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case "HIGH":
        return "bg-red-100 text-red-800";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800";
      case "LOW":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getOverallStatusColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 70) return "text-yellow-600";
    if (score >= 50) return "text-orange-600";
    return "text-red-600";
  };

  const getOverallStatusText = (score: number) => {
    if (score >= 90) return "Excelente";
    if (score >= 70) return "Bueno";
    if (score >= 50) return "Regular";
    return "Crítico";
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Analizando rendimiento...</p>
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
          <Zap className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold tracking-tight">
            Optimización de Rendimiento
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={isMonitoring ? stopMonitoring : startMonitoring}
            className="gap-2"
          >
            {isMonitoring ? (
              <>
                <Pause className="h-4 w-4" />
                Detener
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Iniciar
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={generateReport}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Actualizar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={clearCache}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Limpiar Caché
          </Button>
        </div>
      </div>

      {report && (
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Resumen
            </TabsTrigger>
            <TabsTrigger value="metrics" className="flex items-center gap-2">
              <Cpu className="h-4 w-4" />
              Métricas
            </TabsTrigger>
            <TabsTrigger
              value="suggestions"
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Optimizaciones
            </TabsTrigger>
            <TabsTrigger value="cache" className="flex items-center gap-2">
              <HardDrive className="h-4 w-4" />
              Caché
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            {/* Overall Score */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Puntuación General de Rendimiento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div
                    className={`text-6xl font-bold ${getOverallStatusColor(
                      report.overallScore
                    )}`}
                  >
                    {Math.round(report.overallScore)}
                  </div>
                  <p className="text-lg text-gray-600 mt-2">
                    {getOverallStatusText(report.overallScore)}
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-4 mt-4">
                    <div
                      className={`h-4 rounded-full ${
                        report.overallScore >= 90
                          ? "bg-green-500"
                          : report.overallScore >= 70
                          ? "bg-yellow-500"
                          : report.overallScore >= 50
                          ? "bg-orange-500"
                          : "bg-red-500"
                      }`}
                      style={{ width: `${report.overallScore}%` }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Problemas Críticos
                      </p>
                      <p className="text-2xl font-bold text-red-600">
                        {report.summary.criticalIssues}
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
                        Advertencias
                      </p>
                      <p className="text-2xl font-bold text-yellow-600">
                        {report.summary.warnings}
                      </p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-yellow-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Optimizaciones
                      </p>
                      <p className="text-2xl font-bold text-blue-600">
                        {report.summary.optimizations}
                      </p>
                    </div>
                    <Settings className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Performance Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Distribución de Métricas</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        {
                          name: "Bueno",
                          value: report.metrics.filter(
                            (m) => m.status === "GOOD"
                          ).length,
                          color: "#10B981",
                        },
                        {
                          name: "Advertencia",
                          value: report.metrics.filter(
                            (m) => m.status === "WARNING"
                          ).length,
                          color: "#F59E0B",
                        },
                        {
                          name: "Crítico",
                          value: report.metrics.filter(
                            (m) => m.status === "CRITICAL"
                          ).length,
                          color: "#EF4444",
                        },
                      ]}
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
                      {[
                        {
                          name: "Bueno",
                          value: report.metrics.filter(
                            (m) => m.status === "GOOD"
                          ).length,
                          color: "#10B981",
                        },
                        {
                          name: "Advertencia",
                          value: report.metrics.filter(
                            (m) => m.status === "WARNING"
                          ).length,
                          color: "#F59E0B",
                        },
                        {
                          name: "Crítico",
                          value: report.metrics.filter(
                            (m) => m.status === "CRITICAL"
                          ).length,
                          color: "#EF4444",
                        },
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Metrics Tab */}
          <TabsContent value="metrics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="h-5 w-5" />
                  Métricas de Rendimiento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {report.metrics.map((metric, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {getStatusIcon(metric.status)}
                        <div>
                          <h4 className="font-medium">{metric.description}</h4>
                          <p className="text-sm text-gray-600">
                            {metric.name} • Umbral: {metric.threshold}
                            {metric.unit}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold">
                            {metric.value.toFixed(2)}
                            {metric.unit}
                          </span>
                          <Badge className={getStatusColor(metric.status)}>
                            {metric.status}
                          </Badge>
                        </div>
                        {metric.improvement && (
                          <p className="text-xs text-blue-600 mt-1">
                            💡 {metric.improvement}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Performance Trends Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Tendencias de Rendimiento</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={report.metrics.map((metric) => ({
                      name: metric.name.replace(/_/g, " "),
                      value: metric.value,
                      threshold: metric.threshold,
                      status: metric.status,
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      angle={-45}
                      textAnchor="end"
                      height={100}
                    />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8884d8" />
                    <Bar dataKey="threshold" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Suggestions Tab */}
          <TabsContent value="suggestions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Sugerencias de Optimización
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {report.suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-medium text-lg mb-1">
                            {suggestion.title}
                          </h4>
                          <p className="text-sm text-gray-600 mb-2">
                            {suggestion.description}
                          </p>
                          <p className="text-sm text-blue-600 mb-3">
                            💡 {suggestion.implementation}
                          </p>
                        </div>
                        <div className="flex flex-col gap-2 ml-4">
                          <Badge className={getImpactColor(suggestion.impact)}>
                            {suggestion.impact}
                          </Badge>
                          <Badge className={getEffortColor(suggestion.effort)}>
                            {suggestion.effort}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="text-sm">
                            <span className="text-gray-600">
                              Mejora estimada:
                            </span>
                            <span className="font-medium text-green-600 ml-1">
                              +{suggestion.estimatedImprovement}%
                            </span>
                          </div>
                          <div className="text-sm">
                            <span className="text-gray-600">Prioridad:</span>
                            <span className="font-medium ml-1">
                              {suggestion.priority}
                            </span>
                          </div>
                        </div>
                        <Button size="sm" variant="outline">
                          Implementar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cache Tab */}
          <TabsContent value="cache" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HardDrive className="h-5 w-5" />
                  Estadísticas de Caché
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const cacheStats = performanceOptimizer.getCacheStats();
                  return (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">
                            {cacheStats.hitRate.toFixed(1)}%
                          </div>
                          <div className="text-sm text-gray-600">
                            Tasa de Aciertos
                          </div>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">
                            {cacheStats.totalEntries}
                          </div>
                          <div className="text-sm text-gray-600">Entradas</div>
                        </div>
                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                          <div className="text-2xl font-bold text-purple-600">
                            {cacheStats.totalHits}
                          </div>
                          <div className="text-sm text-gray-600">Aciertos</div>
                        </div>
                        <div className="text-center p-4 bg-orange-50 rounded-lg">
                          <div className="text-2xl font-bold text-orange-600">
                            {cacheStats.totalMisses}
                          </div>
                          <div className="text-sm text-gray-600">Fallos</div>
                        </div>
                      </div>

                      <div className="mt-6">
                        <h4 className="font-medium mb-2">
                          Eficiencia del Caché
                        </h4>
                        <div className="w-full bg-gray-200 rounded-full h-4">
                          <div
                            className="bg-blue-600 h-4 rounded-full"
                            style={{ width: `${cacheStats.hitRate}%` }}
                          ></div>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {cacheStats.hitRate >= 80
                            ? "Excelente eficiencia de caché"
                            : cacheStats.hitRate >= 60
                            ? "Buena eficiencia de caché"
                            : "Considerar optimizar la estrategia de caché"}
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
