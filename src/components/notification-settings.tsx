"use client";

import { useState, useEffect } from "react";
import { Product, ProductNotificationSettings } from "@/types/product";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { updateProduct } from "@/lib/products";
import { updateProductNotificationSettings } from "@/lib/smart-notifications";
import { toast } from "sonner";
import {
  Settings,
  Bell,
  Clock,
  AlertTriangle,
  Package,
  Calendar,
  Save,
  RotateCcw,
} from "lucide-react";

interface NotificationSettingsProps {
  products: Product[];
  onProductUpdate?: (product: Product) => void;
}

export function NotificationSettings({
  products,
  onProductUpdate,
}: NotificationSettingsProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [settings, setSettings] = useState<ProductNotificationSettings>({});
  const [saving, setSaving] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Default settings
  const defaultSettings: Required<ProductNotificationSettings> = {
    lowStockThreshold: 10,
    inactivityDays: 30,
    expirationWarningDays: 7,
    enableLowStockAlerts: true,
    enableExpirationAlerts: true,
    enableInactivityAlerts: true,
    enableAuditAlerts: true,
  };

  useEffect(() => {
    if (selectedProduct) {
      setSettings({
        ...defaultSettings,
        ...selectedProduct.notificationSettings,
      });
    }
  }, [selectedProduct]);

  const handleSave = async () => {
    if (!selectedProduct) return;

    setSaving(true);
    try {
      // Update product with new notification settings
      await updateProduct(selectedProduct.id, {
        notificationSettings: settings,
        updatedAt: Date.now(),
      });

      // Update notification system
      await updateProductNotificationSettings(selectedProduct.id, settings);

      toast.success("Configuración de notificaciones guardada");
      setIsOpen(false);

      // Update parent component
      onProductUpdate?.({
        ...selectedProduct,
        notificationSettings: settings,
      });
    } catch (error) {
      console.error("Error saving notification settings:", error);
      toast.error("Error al guardar la configuración");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSettings({ ...defaultSettings });
    toast.info("Configuración restablecida a valores por defecto");
  };

  const getNotificationStatus = (product: Product): string => {
    const settings = {
      ...defaultSettings,
      ...product.notificationSettings,
    };

    const activeAlerts = [
      settings.enableLowStockAlerts && "Stock Bajo",
      settings.enableExpirationAlerts && "Vencimiento",
      settings.enableInactivityAlerts && "Inactividad",
      settings.enableAuditAlerts && "Auditorías",
    ].filter(Boolean);

    return activeAlerts.length > 0
      ? `${activeAlerts.length} tipos activos`
      : "Deshabilitadas";
  };

  const getStatusColor = (product: Product): string => {
    const settings = {
      ...defaultSettings,
      ...product.notificationSettings,
    };

    const activeCount = [
      settings.enableLowStockAlerts,
      settings.enableExpirationAlerts,
      settings.enableInactivityAlerts,
      settings.enableAuditAlerts,
    ].filter(Boolean).length;

    if (activeCount === 0) return "bg-gray-100 text-gray-800";
    if (activeCount <= 2) return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Configuración de Notificaciones
        </CardTitle>
        <CardDescription>
          Configura umbrales y alertas personalizadas para cada producto
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-sm text-blue-600 font-medium">
                Total Productos
              </div>
              <div className="text-xl font-bold text-blue-900">
                {products.length}
              </div>
            </div>
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-sm text-green-600 font-medium">
                Con Alertas
              </div>
              <div className="text-xl font-bold text-green-900">
                {
                  products.filter((p) =>
                    Object.values(p.notificationSettings || {}).some(Boolean)
                  ).length
                }
              </div>
            </div>
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="text-sm text-orange-600 font-medium">
                Con Vencimiento
              </div>
              <div className="text-xl font-bold text-orange-900">
                {products.filter((p) => p.expirationDate).length}
              </div>
            </div>
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="text-sm text-purple-600 font-medium">
                Stock Personalizado
              </div>
              <div className="text-xl font-bold text-purple-900">
                {
                  products.filter(
                    (p) => p.notificationSettings?.lowStockThreshold
                  ).length
                }
              </div>
            </div>
          </div>

          {/* Products Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Estado de Alertas</TableHead>
                  <TableHead>Umbral Stock</TableHead>
                  <TableHead>Días Inactividad</TableHead>
                  <TableHead>Vencimiento</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => {
                  const settings = {
                    ...defaultSettings,
                    ...product.notificationSettings,
                  };

                  return (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-gray-400" />
                          <div>
                            <div>{product.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {product.brand}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(product)}>
                          {getNotificationStatus(product)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3 text-orange-500" />
                          {settings.lowStockThreshold || "Default (10)"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-blue-500" />
                          {settings.inactivityDays} días
                        </div>
                      </TableCell>
                      <TableCell>
                        {product.expirationDate ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-red-500" />
                            {settings.expirationWarningDays} días aviso
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            Sin fecha
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Dialog
                          open={isOpen && selectedProduct?.id === product.id}
                          onOpenChange={(open) => {
                            setIsOpen(open);
                            if (!open) setSelectedProduct(null);
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedProduct(product)}
                            >
                              <Settings className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>
                                Configurar Notificaciones - {product.name}
                              </DialogTitle>
                            </DialogHeader>

                            <div className="space-y-6">
                              {/* Alert Toggles */}
                              <div className="space-y-4">
                                <h3 className="font-medium">
                                  Tipos de Alertas
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="flex items-center justify-between p-3 border rounded-lg">
                                    <div className="flex items-center gap-2">
                                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                                      <Label htmlFor="lowStock">
                                        Stock Bajo
                                      </Label>
                                    </div>
                                    <Switch
                                      id="lowStock"
                                      checked={settings.enableLowStockAlerts}
                                      onCheckedChange={(checked) =>
                                        setSettings((prev) => ({
                                          ...prev,
                                          enableLowStockAlerts: checked,
                                        }))
                                      }
                                    />
                                  </div>

                                  <div className="flex items-center justify-between p-3 border rounded-lg">
                                    <div className="flex items-center gap-2">
                                      <Calendar className="h-4 w-4 text-red-500" />
                                      <Label htmlFor="expiration">
                                        Vencimiento
                                      </Label>
                                    </div>
                                    <Switch
                                      id="expiration"
                                      checked={settings.enableExpirationAlerts}
                                      onCheckedChange={(checked) =>
                                        setSettings((prev) => ({
                                          ...prev,
                                          enableExpirationAlerts: checked,
                                        }))
                                      }
                                    />
                                  </div>

                                  <div className="flex items-center justify-between p-3 border rounded-lg">
                                    <div className="flex items-center gap-2">
                                      <Clock className="h-4 w-4 text-blue-500" />
                                      <Label htmlFor="inactivity">
                                        Inactividad
                                      </Label>
                                    </div>
                                    <Switch
                                      id="inactivity"
                                      checked={settings.enableInactivityAlerts}
                                      onCheckedChange={(checked) =>
                                        setSettings((prev) => ({
                                          ...prev,
                                          enableInactivityAlerts: checked,
                                        }))
                                      }
                                    />
                                  </div>

                                  <div className="flex items-center justify-between p-3 border rounded-lg">
                                    <div className="flex items-center gap-2">
                                      <Package className="h-4 w-4 text-purple-500" />
                                      <Label htmlFor="audit">Auditorías</Label>
                                    </div>
                                    <Switch
                                      id="audit"
                                      checked={settings.enableAuditAlerts}
                                      onCheckedChange={(checked) =>
                                        setSettings((prev) => ({
                                          ...prev,
                                          enableAuditAlerts: checked,
                                        }))
                                      }
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Threshold Settings */}
                              <div className="space-y-4">
                                <h3 className="font-medium">
                                  Umbrales Personalizados
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="lowStockThreshold">
                                      Umbral Stock Bajo
                                    </Label>
                                    <Input
                                      id="lowStockThreshold"
                                      type="number"
                                      min="0"
                                      value={settings.lowStockThreshold || ""}
                                      onChange={(e) =>
                                        setSettings((prev) => ({
                                          ...prev,
                                          lowStockThreshold:
                                            parseInt(e.target.value) || 0,
                                        }))
                                      }
                                      placeholder="10"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                      Alertar cuando el stock esté por debajo de
                                      este valor
                                    </p>
                                  </div>

                                  <div className="space-y-2">
                                    <Label htmlFor="inactivityDays">
                                      Días de Inactividad
                                    </Label>
                                    <Input
                                      id="inactivityDays"
                                      type="number"
                                      min="1"
                                      value={settings.inactivityDays || ""}
                                      onChange={(e) =>
                                        setSettings((prev) => ({
                                          ...prev,
                                          inactivityDays:
                                            parseInt(e.target.value) || 30,
                                        }))
                                      }
                                      placeholder="30"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                      Alertar si no hay movimientos en X días
                                    </p>
                                  </div>

                                  <div className="space-y-2">
                                    <Label htmlFor="expirationWarningDays">
                                      Días Aviso Vencimiento
                                    </Label>
                                    <Input
                                      id="expirationWarningDays"
                                      type="number"
                                      min="1"
                                      value={
                                        settings.expirationWarningDays || ""
                                      }
                                      onChange={(e) =>
                                        setSettings((prev) => ({
                                          ...prev,
                                          expirationWarningDays:
                                            parseInt(e.target.value) || 7,
                                        }))
                                      }
                                      placeholder="7"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                      Alertar X días antes del vencimiento
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="flex justify-between pt-4 border-t">
                                <Button
                                  variant="outline"
                                  onClick={handleReset}
                                  className="gap-2"
                                >
                                  <RotateCcw className="h-4 w-4" />
                                  Restablecer
                                </Button>
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    onClick={() => setIsOpen(false)}
                                  >
                                    Cancelar
                                  </Button>
                                  <Button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="gap-2"
                                  >
                                    <Save className="h-4 w-4" />
                                    {saving ? "Guardando..." : "Guardar"}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
