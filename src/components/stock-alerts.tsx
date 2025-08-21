"use client";

import { useEffect, useState } from "react";
import { StockAlert } from "@/types/product";
import { getStockAlerts, acknowledgeAlert } from "@/lib/stock-movements";
import { getAllProductsWithAlerts } from "@/lib/products";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertTriangle,
  AlertCircle,
  TrendingUp,
  Package,
  Bell,
  X,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface StockAlertsProps {
  trigger?: React.ReactNode;
}

export function StockAlerts({ trigger }: StockAlertsProps) {
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadAlerts();
    }
  }, [isOpen]);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      // Get stored alerts
      const storedAlerts = await getStockAlerts();

      // Get real-time alerts from products
      const productsWithAlerts = await getAllProductsWithAlerts();
      const realTimeAlerts = productsWithAlerts.flatMap(
        (product) => product.alerts
      );

      // Combine and deduplicate alerts
      const allAlerts = [...storedAlerts, ...realTimeAlerts];
      const uniqueAlerts = allAlerts.filter(
        (alert, index, self) =>
          index === self.findIndex((a) => a.id === alert.id)
      );

      // Sort by severity and creation date
      uniqueAlerts.sort((a, b) => {
        const severityOrder = { OUT_OF_STOCK: 3, MIN_STOCK: 2, MAX_STOCK: 1 };
        const severityDiff = severityOrder[b.type] - severityOrder[a.type];
        if (severityDiff !== 0) return severityDiff;
        return b.createdAt - a.createdAt;
      });

      setAlerts(uniqueAlerts);
    } catch (error) {
      console.error("Error loading alerts:", error);
      toast.error("Error al cargar las alertas");
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (alertId: string) => {
    try {
      await acknowledgeAlert(alertId);
      setAlerts((prev) => prev.filter((alert) => alert.id !== alertId));
      toast.success("Alerta confirmada");
    } catch (error) {
      console.error("Error acknowledging alert:", error);
      toast.error("Error al confirmar la alerta");
    }
  };

  const getAlertIcon = (type: StockAlert["type"]) => {
    switch (type) {
      case "OUT_OF_STOCK":
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case "MIN_STOCK":
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
      case "MAX_STOCK":
        return <TrendingUp className="h-5 w-5 text-blue-500" />;
      default:
        return <Package className="h-5 w-5 text-gray-500" />;
    }
  };

  const getAlertBadgeColor = (type: StockAlert["type"]) => {
    switch (type) {
      case "OUT_OF_STOCK":
        return "bg-red-100 text-red-800 border-red-200";
      case "MIN_STOCK":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "MAX_STOCK":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getAlertTypeLabel = (type: StockAlert["type"]) => {
    switch (type) {
      case "OUT_OF_STOCK":
        return "Sin Stock";
      case "MIN_STOCK":
        return "Stock Bajo";
      case "MAX_STOCK":
        return "Stock Alto";
      default:
        return "Alerta";
    }
  };

  const criticalAlerts = alerts.filter(
    (alert) => alert.type === "OUT_OF_STOCK"
  );
  const warningAlerts = alerts.filter((alert) => alert.type === "MIN_STOCK");
  const infoAlerts = alerts.filter((alert) => alert.type === "MAX_STOCK");

  const defaultTrigger = (
    <Button
      variant="outline"
      size="sm"
      className={`gap-2 relative ${
        alerts.length > 0 ? "border-orange-300 text-orange-700" : ""
      }`}
    >
      <Bell className="h-4 w-4" />
      Alertas
      {alerts.length > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
          {alerts.length}
        </span>
      )}
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Alertas de Stock
            {alerts.length > 0 && (
              <span className="text-sm font-normal text-muted-foreground">
                ({alerts.length} pendientes)
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto space-y-4">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">
              Cargando alertas...
            </div>
          ) : alerts.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay alertas pendientes
              </h3>
              <p className="text-gray-500">
                Todos los productos están dentro de los rangos de stock
                establecidos.
              </p>
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    <span className="font-medium text-red-900">Críticas</span>
                  </div>
                  <div className="text-2xl font-bold text-red-900 mt-1">
                    {criticalAlerts.length}
                  </div>
                  <p className="text-sm text-red-600">Sin stock disponible</p>
                </div>

                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-orange-500" />
                    <span className="font-medium text-orange-900">
                      Advertencias
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-orange-900 mt-1">
                    {warningAlerts.length}
                  </div>
                  <p className="text-sm text-orange-600">
                    Stock por debajo del mínimo
                  </p>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-500" />
                    <span className="font-medium text-blue-900">
                      Información
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-blue-900 mt-1">
                    {infoAlerts.length}
                  </div>
                  <p className="text-sm text-blue-600">
                    Stock por encima del máximo
                  </p>
                </div>
              </div>

              {/* Alerts List */}
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-4 border rounded-lg ${getAlertBadgeColor(
                      alert.type
                    )} bg-opacity-50`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        {getAlertIcon(alert.type)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{alert.productName}</h4>
                            <span
                              className={`px-2 py-1 text-xs font-medium border rounded-full ${getAlertBadgeColor(
                                alert.type
                              )}`}
                            >
                              {getAlertTypeLabel(alert.type)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {alert.message}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>Stock actual: {alert.currentStock}</span>
                            {alert.threshold > 0 && (
                              <span>
                                {alert.type === "MIN_STOCK"
                                  ? "Mínimo"
                                  : "Máximo"}
                                : {alert.threshold}
                              </span>
                            )}
                            <span>
                              {format(alert.createdAt, "dd/MM/yy HH:mm", {
                                locale: es,
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAcknowledge(alert.id)}
                          className="gap-1"
                        >
                          <Check className="h-3 w-3" />
                          Confirmar
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <Button onClick={loadAlerts} disabled={loading} variant="outline">
            {loading ? "Actualizando..." : "Actualizar"}
          </Button>
          <Button onClick={() => setIsOpen(false)}>Cerrar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
