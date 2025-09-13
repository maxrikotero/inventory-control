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
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import {
  TestTube,
  Play,
  Pause,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Activity,
  Code,
  Zap,
  Database,
  Cpu,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import {
  testingFramework,
  TestReport,
  TestSuite,
  TestResult,
  ProductTests,
  SalesTests,
  PerformanceTests,
  IntegrationTests,
} from "@/lib/testing-framework";

interface TestingPanelProps {
  className?: string;
}

export function TestingPanel({ className }: TestingPanelProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [isRunning, setIsRunning] = useState(false);
  const [report, setReport] = useState<TestReport | null>(null);
  const [selectedSuite, setSelectedSuite] = useState<string | null>(null);

  useEffect(() => {
    // Run initial test suite
    runAllTests();
  }, []);

  const runAllTests = async () => {
    setIsRunning(true);
    try {
      testingFramework.reset();

      // Run all test suites
      await Promise.all([
        ProductTests.runAll(),
        SalesTests.runAll(),
        PerformanceTests.runAll(),
        IntegrationTests.runAll(),
      ]);

      const newReport = testingFramework.generateReport();
      setReport(newReport);

      toast.success("Tests ejecutados exitosamente");
    } catch (error) {
      console.error("Error running tests:", error);
      toast.error("Error al ejecutar tests");
    } finally {
      setIsRunning(false);
    }
  };

  const runSpecificSuite = async (suiteName: string) => {
    setIsRunning(true);
    try {
      testingFramework.reset();

      switch (suiteName) {
        case "products":
          await ProductTests.runAll();
          break;
        case "sales":
          await SalesTests.runAll();
          break;
        case "performance":
          await PerformanceTests.runAll();
          break;
        case "integration":
          await IntegrationTests.runAll();
          break;
      }

      const newReport = testingFramework.generateReport();
      setReport(newReport);

      toast.success(`Tests de ${suiteName} ejecutados exitosamente`);
    } catch (error) {
      console.error("Error running specific suite:", error);
      toast.error("Error al ejecutar tests específicos");
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PASS":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "FAIL":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "SKIP":
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PASS":
        return "bg-green-100 text-green-800";
      case "FAIL":
        return "bg-red-100 text-red-800";
      case "SKIP":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getSuiteStatusColor = (status: string) => {
    switch (status) {
      case "PASS":
        return "bg-green-100 text-green-800";
      case "FAIL":
        return "bg-red-100 text-red-800";
      case "PARTIAL":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getCoverageColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-600";
    if (percentage >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getCoverageStatus = (percentage: number) => {
    if (percentage >= 80) return "Excelente";
    if (percentage >= 60) return "Buena";
    if (percentage >= 40) return "Regular";
    return "Baja";
  };

  if (isRunning) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Ejecutando tests...</p>
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
          <TestTube className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold tracking-tight">
            Testing y Calidad
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => runSpecificSuite("products")}
            className="gap-2"
          >
            <Database className="h-4 w-4" />
            Productos
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => runSpecificSuite("sales")}
            className="gap-2"
          >
            <Activity className="h-4 w-4" />
            Ventas
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => runSpecificSuite("performance")}
            className="gap-2"
          >
            <Zap className="h-4 w-4" />
            Rendimiento
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => runSpecificSuite("integration")}
            className="gap-2"
          >
            <Code className="h-4 w-4" />
            Integración
          </Button>
          <Button onClick={runAllTests} className="gap-2">
            <Play className="h-4 w-4" />
            Ejecutar Todos
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
              <Eye className="h-4 w-4" />
              Resumen
            </TabsTrigger>
            <TabsTrigger value="suites" className="flex items-center gap-2">
              <TestTube className="h-4 w-4" />
              Suites
            </TabsTrigger>
            <TabsTrigger value="coverage" className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              Cobertura
            </TabsTrigger>
            <TabsTrigger
              value="performance"
              className="flex items-center gap-2"
            >
              <Cpu className="h-4 w-4" />
              Rendimiento
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            {/* Overall Results */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Resultados Generales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {report.passedTests}
                    </div>
                    <div className="text-sm text-gray-600">Tests Exitosos</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {report.failedTests}
                    </div>
                    <div className="text-sm text-gray-600">Tests Fallidos</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">
                      {report.skippedTests}
                    </div>
                    <div className="text-sm text-gray-600">Tests Omitidos</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {report.totalTests}
                    </div>
                    <div className="text-sm text-gray-600">Total Tests</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Test Results Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Distribución de Resultados</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        {
                          name: "Exitosos",
                          value: report.passedTests,
                          color: "#10B981",
                        },
                        {
                          name: "Fallidos",
                          value: report.failedTests,
                          color: "#EF4444",
                        },
                        {
                          name: "Omitidos",
                          value: report.skippedTests,
                          color: "#F59E0B",
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
                          name: "Exitosos",
                          value: report.passedTests,
                          color: "#10B981",
                        },
                        {
                          name: "Fallidos",
                          value: report.failedTests,
                          color: "#EF4444",
                        },
                        {
                          name: "Omitidos",
                          value: report.skippedTests,
                          color: "#F59E0B",
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

            {/* Test Suites Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Resumen de Suites</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {report.suites.map((suite, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => {
                        setSelectedSuite(suite.name);
                        setActiveTab("suites");
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <TestTube className="h-5 w-5 text-blue-600" />
                        <div>
                          <h4 className="font-medium">{suite.name}</h4>
                          <p className="text-sm text-gray-600">
                            {suite.passedTests}/{suite.totalTests} tests
                            exitosos
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getSuiteStatusColor(suite.status)}>
                          {suite.status}
                        </Badge>
                        <span className="text-sm text-gray-600">
                          {suite.duration.toFixed(2)}ms
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Suites Tab */}
          <TabsContent value="suites" className="space-y-4">
            {report.suites.map((suite, suiteIndex) => (
              <Card key={suiteIndex}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TestTube className="h-5 w-5" />
                      {suite.name}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getSuiteStatusColor(suite.status)}>
                        {suite.status}
                      </Badge>
                      <span className="text-sm text-gray-600">
                        {suite.duration.toFixed(2)}ms
                      </span>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {suite.tests.map((test, testIndex) => (
                      <div
                        key={testIndex}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          {getStatusIcon(test.status)}
                          <div>
                            <h5 className="font-medium text-sm">{test.name}</h5>
                            {test.error && (
                              <p className="text-xs text-red-600 mt-1">
                                {test.error}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(test.status)}>
                            {test.status}
                          </Badge>
                          <span className="text-xs text-gray-600">
                            {test.duration.toFixed(2)}ms
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Coverage Tab */}
          <TabsContent value="coverage" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  Cobertura de Código
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div
                      className={`text-2xl font-bold ${getCoverageColor(
                        report.coverage.lines.percentage
                      )}`}
                    >
                      {report.coverage.lines.percentage.toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600">Líneas</div>
                    <div className="text-xs text-gray-500">
                      {report.coverage.lines.covered}/
                      {report.coverage.lines.total}
                    </div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div
                      className={`text-2xl font-bold ${getCoverageColor(
                        report.coverage.functions.percentage
                      )}`}
                    >
                      {report.coverage.functions.percentage.toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600">Funciones</div>
                    <div className="text-xs text-gray-500">
                      {report.coverage.functions.covered}/
                      {report.coverage.functions.total}
                    </div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div
                      className={`text-2xl font-bold ${getCoverageColor(
                        report.coverage.branches.percentage
                      )}`}
                    >
                      {report.coverage.branches.percentage.toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600">Ramas</div>
                    <div className="text-xs text-gray-500">
                      {report.coverage.branches.covered}/
                      {report.coverage.branches.total}
                    </div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div
                      className={`text-2xl font-bold ${getCoverageColor(
                        report.coverage.statements.percentage
                      )}`}
                    >
                      {report.coverage.statements.percentage.toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600">Declaraciones</div>
                    <div className="text-xs text-gray-500">
                      {report.coverage.statements.covered}/
                      {report.coverage.statements.total}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Coverage Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Distribución de Cobertura</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={[
                      {
                        name: "Líneas",
                        covered: report.coverage.lines.covered,
                        total: report.coverage.lines.total,
                        percentage: report.coverage.lines.percentage,
                      },
                      {
                        name: "Funciones",
                        covered: report.coverage.functions.covered,
                        total: report.coverage.functions.total,
                        percentage: report.coverage.functions.percentage,
                      },
                      {
                        name: "Ramas",
                        covered: report.coverage.branches.covered,
                        total: report.coverage.branches.total,
                        percentage: report.coverage.branches.percentage,
                      },
                      {
                        name: "Declaraciones",
                        covered: report.coverage.statements.covered,
                        total: report.coverage.statements.total,
                        percentage: report.coverage.statements.percentage,
                      },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip
                      formatter={(value, name) => [
                        `${value}`,
                        name === "covered" ? "Cubierto" : "Total",
                      ]}
                    />
                    <Bar dataKey="covered" fill="#10B981" />
                    <Bar dataKey="total" fill="#E5E7EB" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Coverage Status */}
            <Card>
              <CardHeader>
                <CardTitle>Estado de Cobertura</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium">Líneas de Código</h4>
                      <p className="text-sm text-gray-600">
                        {getCoverageStatus(report.coverage.lines.percentage)}{" "}
                        cobertura
                      </p>
                    </div>
                    <div className="text-right">
                      <div
                        className={`text-lg font-bold ${getCoverageColor(
                          report.coverage.lines.percentage
                        )}`}
                      >
                        {report.coverage.lines.percentage.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium">Funciones</h4>
                      <p className="text-sm text-gray-600">
                        {getCoverageStatus(
                          report.coverage.functions.percentage
                        )}{" "}
                        cobertura
                      </p>
                    </div>
                    <div className="text-right">
                      <div
                        className={`text-lg font-bold ${getCoverageColor(
                          report.coverage.functions.percentage
                        )}`}
                      >
                        {report.coverage.functions.percentage.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium">Ramas</h4>
                      <p className="text-sm text-gray-600">
                        {getCoverageStatus(report.coverage.branches.percentage)}{" "}
                        cobertura
                      </p>
                    </div>
                    <div className="text-right">
                      <div
                        className={`text-lg font-bold ${getCoverageColor(
                          report.coverage.branches.percentage
                        )}`}
                      >
                        {report.coverage.branches.percentage.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="h-5 w-5" />
                  Tests de Rendimiento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {report.performance.averageResponseTime.toFixed(2)}ms
                    </div>
                    <div className="text-sm text-gray-600">Tiempo Promedio</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {report.performance.throughput.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-600">Req/seg</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {report.performance.errorRate.toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600">Tasa de Error</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {report.performance.memoryUsage.toFixed(2)}MB
                    </div>
                    <div className="text-sm text-gray-600">Memoria</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Métricas de Rendimiento</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={[
                      {
                        name: "Tiempo Promedio",
                        value: report.performance.averageResponseTime,
                      },
                      {
                        name: "Tiempo Máximo",
                        value: report.performance.maxResponseTime,
                      },
                      {
                        name: "Tiempo Mínimo",
                        value: report.performance.minResponseTime,
                      },
                      {
                        name: "Throughput",
                        value: report.performance.throughput,
                      },
                      {
                        name: "Memoria",
                        value: report.performance.memoryUsage,
                      },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
