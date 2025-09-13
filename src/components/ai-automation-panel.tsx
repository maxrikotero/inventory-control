"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  Settings,
  Play,
  Pause,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  TrendingUp,
  Users,
  Package,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import {
  AutomationRule,
  AutomationExecution,
  AutomationDashboard,
  automationRulesEngine,
} from "@/lib/ai/automation-rules";
import {
  OptimizationReport,
  inventoryOptimizationEngine,
} from "@/lib/ai/inventory-optimization";
import {
  SentimentResult,
  sentimentAnalysisEngine,
} from "@/lib/ai/sentiment-analysis";

interface AIAutomationPanelProps {
  className?: string;
}

export function AIAutomationPanel({ className }: AIAutomationPanelProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  const [dashboard, setDashboard] = useState<AutomationDashboard | null>(null);
  const [optimizationReport, setOptimizationReport] =
    useState<OptimizationReport | null>(null);
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [executions, setExecutions] = useState<AutomationExecution[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [dashboardData, optimizationData, rulesData, executionsData] =
        await Promise.all([
          Promise.resolve(automationRulesEngine.getDashboard()),
          inventoryOptimizationEngine.generateOptimizationReport(),
          Promise.resolve(automationRulesEngine.getAllRules()),
          Promise.resolve(automationRulesEngine.getExecutions(20)),
        ]);

      setDashboard(dashboardData);
      setOptimizationReport(optimizationData);
      setRules(rulesData);
      setExecutions(executionsData);
    } catch (error) {
      console.error("Error loading automation data:", error);
      toast.error("Error al cargar datos de automatización");
    } finally {
      setLoading(false);
    }
  };

  const toggleRule = async (ruleId: string) => {
    const rule = rules.find((r) => r.id === ruleId);
    if (rule) {
      const updated = automationRulesEngine.updateRule(ruleId, {
        enabled: !rule.enabled,
      });
      if (updated) {
        setRules(automationRulesEngine.getAllRules());
        toast.success(`Regla ${rule.enabled ? "desactivada" : "activada"}`);
      }
    }
  };

  const deleteRule = async (ruleId: string) => {
    const deleted = automationRulesEngine.deleteRule(ruleId);
    if (deleted) {
      setRules(automationRulesEngine.getAllRules());
      toast.success("Regla eliminada");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return "bg-green-100 text-green-800";
      case "FAILED":
        return "bg-red-100 text-red-800";
      case "PENDING":
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

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">
                Cargando automatización...
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
          <Settings className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold tracking-tight">
            Automatización IA
          </h2>
        </div>
        <Button
          onClick={loadData}
          variant="outline"
          size="sm"
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
          <TabsTrigger value="rules" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Reglas
          </TabsTrigger>
          <TabsTrigger value="executions" className="flex items-center gap-2">
            <Play className="h-4 w-4" />
            Ejecuciones
          </TabsTrigger>
          <TabsTrigger value="optimization" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Optimización
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
                      Reglas Activas
                    </p>
                    <p className="text-2xl font-bold">
                      {dashboard?.activeRules || 0}
                    </p>
                  </div>
                  <Settings className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Ejecuciones Hoy
                    </p>
                    <p className="text-2xl font-bold">
                      {dashboard?.executionsToday || 0}
                    </p>
                  </div>
                  <Play className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Tasa de Éxito
                    </p>
                    <p className="text-2xl font-bold">
                      {dashboard ? Math.round(dashboard.successRate * 100) : 0}%
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Ahorro Potencial
                    </p>
                    <p className="text-2xl font-bold text-green-600">
                      ${optimizationReport?.potentialSavings.toFixed(0) || 0}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart className="h-5 w-5" />
                  Ejecuciones por Regla
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dashboard?.topRules && dashboard.topRules.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dashboard.topRules}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="ruleName" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="executionCount" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-8">
                    <BarChart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No hay datos de ejecuciones</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Estado de Ejecuciones
                </CardTitle>
              </CardHeader>
              <CardContent>
                {executions.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={[
                          {
                            name: "Exitosas",
                            value: executions.filter(
                              (e) => e.status === "SUCCESS"
                            ).length,
                          },
                          {
                            name: "Fallidas",
                            value: executions.filter(
                              (e) => e.status === "FAILED"
                            ).length,
                          },
                          {
                            name: "Pendientes",
                            value: executions.filter(
                              (e) => e.status === "PENDING"
                            ).length,
                          },
                        ]}
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
                        {[0, 1, 2].map((entry, index) => (
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
                  <div className="text-center py-8">
                    <PieChart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No hay datos de ejecuciones</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Rules Tab */}
        <TabsContent value="rules" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Reglas de Automatización</h3>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nueva Regla
            </Button>
          </div>

          <div className="space-y-4">
            {rules.map((rule) => (
              <Card key={rule.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">{rule.name}</h4>
                        <Badge
                          className={getPriorityColor(rule.priority.toString())}
                        >
                          Prioridad {rule.priority}
                        </Badge>
                        <Badge
                          className={
                            rule.enabled
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }
                        >
                          {rule.enabled ? "Activa" : "Inactiva"}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {rule.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Ejecuciones: {rule.metadata.executionCount}</span>
                        <span>
                          Éxito: {Math.round(rule.metadata.successRate * 100)}%
                        </span>
                        <span>Trigger: {rule.trigger.event}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleRule(rule.id)}
                      >
                        {rule.enabled ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteRule(rule.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Executions Tab */}
        <TabsContent value="executions" className="space-y-4">
          <h3 className="text-lg font-semibold">Historial de Ejecuciones</h3>

          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {executions.map((execution) => (
                <Card key={execution.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{execution.ruleName}</h4>
                          <Badge className={getStatusColor(execution.status)}>
                            {execution.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          {new Date(execution.executedAt).toLocaleString()}
                        </p>
                        {execution.error && (
                          <p className="text-sm text-red-600 mt-1">
                            {execution.error}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">
                          {execution.results.length} acciones
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Optimization Tab */}
        <TabsContent value="optimization" className="space-y-4">
          <h3 className="text-lg font-semibold">Optimización de Inventario</h3>

          {optimizationReport && (
            <div className="space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Recomendaciones
                        </p>
                        <p className="text-2xl font-bold">
                          {optimizationReport.totalRecommendations}
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
                          Alertas Críticas
                        </p>
                        <p className="text-2xl font-bold text-red-600">
                          {optimizationReport.criticalAlerts}
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
                          Ahorro Potencial
                        </p>
                        <p className="text-2xl font-bold text-green-600">
                          ${optimizationReport.potentialSavings.toFixed(0)}
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
                          Ingresos Potenciales
                        </p>
                        <p className="text-2xl font-bold text-blue-600">
                          ${optimizationReport.potentialRevenue.toFixed(0)}
                        </p>
                      </div>
                      <Zap className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Top Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle>Recomendaciones Principales</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {optimizationReport.recommendations
                      .slice(0, 5)
                      .map((rec, index) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{rec.productName}</h4>
                            <Badge className={getPriorityColor(rec.priority)}>
                              {rec.priority}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {rec.reason}
                          </p>
                          <div className="flex items-center justify-between text-sm">
                            <span>Stock actual: {rec.currentStock}</span>
                            <span>Recomendado: {rec.recommendedStock}</span>
                            <span>Impacto: {rec.expectedImpact}%</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
