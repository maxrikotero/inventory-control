"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  AlertCircle,
  TrendingUp,
  Package,
  Clock,
  Zap,
  X,
  Bell,
  CheckCircle,
} from "lucide-react";
import { getAlertSummary, getRestockingSuggestions } from "@/lib/analytics";
import { getAllProductsWithAlerts } from "@/lib/products";
import { acknowledgeAlert } from "@/lib/stock-movements";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Alert {
  id: string;
  type: "critical" | "warning" | "info" | "restock";
  title: string;
  message: string;
  productName?: string;
  value?: number;
  timestamp: number;
  priority: "high" | "medium" | "low";
  actionable: boolean;
}

export function AlertsWidget() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const [alertSummary, restockingSuggestions, productsWithAlerts] =
        await Promise.all([
          getAlertSummary(),
          getRestockingSuggestions(),
          getAllProductsWithAlerts(),
        ]);

      const newAlerts: Alert[] = [];

      // Critical stock alerts (out of stock)
      productsWithAlerts.forEach((product) => {
        if (product.stockAvailable <= 0) {
          newAlerts.push({
            id: `critical-${product.id}`,
            type: "critical",
            title: "Sin Stock",
            message: `${product.name} está completamente agotado`,
            productName: product.name,
            value: product.stockAvailable,
            timestamp: Date.now(),
            priority: "high",
            actionable: true,
          });
        }
      });

      // Warning alerts (low stock)
      productsWithAlerts.forEach((product) => {
        if (
          product.minStock &&
          product.stockAvailable > 0 &&
          product.stockAvailable <= product.minStock
        ) {
          newAlerts.push({
            id: `warning-${product.id}`,
            type: "warning",
            title: "Stock Bajo",
            message: `${product.name} está por debajo del mínimo (${product.stockAvailable}/${product.minStock})`,
            productName: product.name,
            value: product.stockAvailable,
            timestamp: Date.now(),
            priority: "medium",
            actionable: true,
          });
        }
      });

      // Info alerts (high stock)
      productsWithAlerts.forEach((product) => {
        if (product.maxStock && product.stockAvailable >= product.maxStock) {
          newAlerts.push({
            id: `info-${product.id}`,
            type: "info",
            title: "Stock Excesivo",
            message: `${product.name} supera el máximo recomendado (${product.stockAvailable}/${product.maxStock})`,
            productName: product.name,
            value: product.stockAvailable,
            timestamp: Date.now(),
            priority: "low",
            actionable: false,
          });
        }
      });

      // Restocking suggestions
      restockingSuggestions.slice(0, 3).forEach((suggestion, index) => {
        newAlerts.push({
          id: `restock-${suggestion.product.id}`,
          type: "restock",
          title: "Reposición Sugerida",
          message: `Se recomienda reponer ${suggestion.suggestedQuantity} unidades de ${suggestion.product.name}`,
          productName: suggestion.product.name,
          value: suggestion.suggestedQuantity,
          timestamp: Date.now() - index, // Slight variation for sorting
          priority: suggestion.priority,
          actionable: true,
        });
      });

      // Sort by priority and timestamp
      newAlerts.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const priorityDiff =
          priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return b.timestamp - a.timestamp;
      });

      setAlerts(newAlerts);
    } catch (error) {
      console.error("Error loading alerts:", error);
      toast.error("Error al cargar las alertas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
    const interval = setInterval(loadAlerts, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const getAlertIcon = (type: Alert["type"]) => {
    switch (type) {
      case "critical":
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case "warning":
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
      case "info":
        return <TrendingUp className="h-5 w-5 text-blue-500" />;
      case "restock":
        return <Package className="h-5 w-5 text-purple-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getAlertColor = (type: Alert["type"]) => {
    switch (type) {
      case "critical":
        return "border-red-200 bg-red-50";
      case "warning":
        return "border-orange-200 bg-orange-50";
      case "info":
        return "border-blue-200 bg-blue-50";
      case "restock":
        return "border-purple-200 bg-purple-50";
      default:
        return "border-gray-200 bg-gray-50";
    }
  };

  const getPriorityColor = (priority: Alert["priority"]) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-orange-100 text-orange-800";
      case "low":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const dismissAlert = (alertId: string) => {
    setDismissed((prev) => new Set([...prev, alertId]));
    toast.success("Alerta desestimada");
  };

  const acknowledgeStockAlert = async (alertId: string) => {
    try {
      await acknowledgeAlert(alertId);
      dismissAlert(alertId);
      toast.success("Alerta confirmada");
    } catch (error) {
      console.error("Error acknowledging alert:", error);
      toast.error("Error al confirmar la alerta");
    }
  };

  const visibleAlerts = alerts.filter((alert) => !dismissed.has(alert.id));

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 animate-pulse" />
            Alertas del Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="text-muted-foreground mt-2">Cargando alertas...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (visibleAlerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Sistema en Orden
          </CardTitle>
          <CardDescription>
            No hay alertas activas en este momento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <p className="text-green-700 font-medium">
              ¡Todo está funcionando correctamente!
            </p>
            <p className="text-muted-foreground text-sm mt-1">
              El inventario está dentro de los parámetros normales
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Alertas del Sistema
          <Badge variant="destructive" className="ml-auto">
            {visibleAlerts.length}
          </Badge>
        </CardTitle>
        <CardDescription>
          Monitoreo en tiempo real del estado del inventario
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          <AnimatePresence>
            {visibleAlerts.slice(0, 10).map((alert) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.3 }}
                className={`p-4 border rounded-lg ${getAlertColor(alert.type)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {getAlertIcon(alert.type)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm">{alert.title}</h4>
                        <Badge
                          variant="outline"
                          className={`text-xs ${getPriorityColor(
                            alert.priority
                          )}`}
                        >
                          {alert.priority === "high"
                            ? "Alta"
                            : alert.priority === "medium"
                            ? "Media"
                            : "Baja"}
                        </Badge>
                        {alert.type === "critical" && (
                          <motion.div
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                          >
                            <Zap className="h-3 w-3 text-red-500" />
                          </motion.div>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 mb-2">
                        {alert.message}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(alert.timestamp, "HH:mm", { locale: es })}
                        </span>
                        {alert.productName && (
                          <span>Producto: {alert.productName}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1 ml-2">
                    {alert.actionable && alert.type !== "restock" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => acknowledgeStockAlert(alert.id)}
                        className="h-6 px-2 text-xs"
                      >
                        <CheckCircle className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => dismissAlert(alert.id)}
                      className="h-6 px-1 text-xs"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {visibleAlerts.length > 10 && (
          <div className="mt-3 text-center">
            <p className="text-sm text-muted-foreground">
              ... y {visibleAlerts.length - 10} alertas más
            </p>
          </div>
        )}

        <div className="mt-4 flex justify-between items-center">
          <Button
            variant="outline"
            onClick={loadAlerts}
            disabled={loading}
            className="text-xs"
          >
            Actualizar
          </Button>
          <p className="text-xs text-muted-foreground">
            Última actualización: {format(new Date(), "HH:mm", { locale: es })}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
