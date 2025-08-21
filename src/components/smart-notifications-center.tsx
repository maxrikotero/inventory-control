"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  SmartNotification,
  NotificationType,
  NotificationPriority,
} from "@/types/product";
import {
  getSmartNotifications,
  acknowledgeNotification,
  getNotificationStats,
  cleanupOldNotifications,
} from "@/lib/smart-notifications";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  AlertTriangle,
  AlertCircle,
  Clock,
  Package,
  Calendar,
  TrendingUp,
  Bell,
  Search,
  Filter,
  CheckCircle,
  X,
  Archive,
  BarChart3,
  Zap,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface SmartNotificationsCenterProps {
  onNotificationClick?: (notification: SmartNotification) => void;
}

export function SmartNotificationsCenter({
  onNotificationClick,
}: SmartNotificationsCenterProps) {
  const [notifications, setNotifications] = useState<SmartNotification[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<{
    type?: NotificationType;
    priority?: NotificationPriority;
    acknowledged?: boolean;
    search?: string;
  }>({});
  const [searchTerm, setSearchTerm] = useState("");

  const notificationTypeConfig = {
    LOW_STOCK: {
      label: "Stock Bajo",
      icon: AlertTriangle,
      color: "text-orange-500 bg-orange-50 border-orange-200",
    },
    OUT_OF_STOCK: {
      label: "Sin Stock",
      icon: AlertTriangle,
      color: "text-red-500 bg-red-50 border-red-200",
    },
    EXPIRATION_WARNING: {
      label: "Próximo a Vencer",
      icon: Calendar,
      color: "text-yellow-500 bg-yellow-50 border-yellow-200",
    },
    EXPIRATION_CRITICAL: {
      label: "Vencido/Crítico",
      icon: Calendar,
      color: "text-red-500 bg-red-50 border-red-200",
    },
    INACTIVE_PRODUCT: {
      label: "Producto Inactivo",
      icon: Clock,
      color: "text-blue-500 bg-blue-50 border-blue-200",
    },
    AUDIT_DIFFERENCE: {
      label: "Diferencia Auditoría",
      icon: Package,
      color: "text-purple-500 bg-purple-50 border-purple-200",
    },
    OVERSTOCK: {
      label: "Sobrestock",
      icon: TrendingUp,
      color: "text-indigo-500 bg-indigo-50 border-indigo-200",
    },
    RESTOCK_SUGGESTION: {
      label: "Sugerencia Restock",
      icon: Package,
      color: "text-green-500 bg-green-50 border-green-200",
    },
  };

  const priorityConfig = {
    critical: { label: "Crítica", color: "bg-red-100 text-red-800" },
    high: { label: "Alta", color: "bg-orange-100 text-orange-800" },
    medium: { label: "Media", color: "bg-yellow-100 text-yellow-800" },
    low: { label: "Baja", color: "bg-gray-100 text-gray-800" },
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const [notificationsData, statsData] = await Promise.all([
        getSmartNotifications(),
        getNotificationStats(),
      ]);

      setNotifications(notificationsData);
      setStats(statsData);
    } catch (error) {
      console.error("Error loading notifications:", error);
      toast.error("Error al cargar las notificaciones");
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (notificationId: string) => {
    try {
      await acknowledgeNotification(notificationId);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId
            ? { ...n, acknowledged: true, updatedAt: Date.now() }
            : n
        )
      );
      toast.success("Notificación confirmada");
    } catch (error) {
      console.error("Error acknowledging notification:", error);
      toast.error("Error al confirmar la notificación");
    }
  };

  const handleCleanup = async () => {
    try {
      const removed = await cleanupOldNotifications(30);
      toast.success(`${removed} notificaciones antiguas eliminadas`);
      await loadNotifications();
    } catch (error) {
      console.error("Error cleaning up notifications:", error);
      toast.error("Error al limpiar notificaciones");
    }
  };

  const filteredNotifications = notifications.filter((notification) => {
    if (filter.type && notification.type !== filter.type) return false;
    if (filter.priority && notification.priority !== filter.priority)
      return false;
    if (
      filter.acknowledged !== undefined &&
      notification.acknowledged !== filter.acknowledged
    )
      return false;
    if (
      searchTerm &&
      !notification.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !notification.message.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !notification.productName.toLowerCase().includes(searchTerm.toLowerCase())
    )
      return false;
    return true;
  });

  if (loading && notifications.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300 animate-pulse" />
          <p className="text-muted-foreground">
            Cargando notificaciones inteligentes...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-blue-500" />
                <div>
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <div className="text-sm text-muted-foreground">Total</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <div>
                  <div className="text-2xl font-bold">
                    {stats.unacknowledged}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Pendientes
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-orange-500" />
                <div>
                  <div className="text-2xl font-bold">
                    {stats.actionRequired}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Acción Req.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-500" />
                <div>
                  <div className="text-2xl font-bold">
                    {Object.keys(stats.byType).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Tipos</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar notificaciones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={filter.type || ""}
                onChange={(e) =>
                  setFilter((prev) => ({
                    ...prev,
                    type: e.target.value
                      ? (e.target.value as NotificationType)
                      : undefined,
                  }))
                }
                className="border rounded px-2 py-1 text-sm"
              >
                <option value="">Todos los tipos</option>
                {Object.entries(notificationTypeConfig).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={filter.priority || ""}
                onChange={(e) =>
                  setFilter((prev) => ({
                    ...prev,
                    priority: e.target.value
                      ? (e.target.value as NotificationPriority)
                      : undefined,
                  }))
                }
                className="border rounded px-2 py-1 text-sm"
              >
                <option value="">Todas las prioridades</option>
                {Object.entries(priorityConfig).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={
                  filter.acknowledged === undefined
                    ? ""
                    : filter.acknowledged.toString()
                }
                onChange={(e) =>
                  setFilter((prev) => ({
                    ...prev,
                    acknowledged:
                      e.target.value === ""
                        ? undefined
                        : e.target.value === "true",
                  }))
                }
                className="border rounded px-2 py-1 text-sm"
              >
                <option value="">Todas</option>
                <option value="false">No confirmadas</option>
                <option value="true">Confirmadas</option>
              </select>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleCleanup}
              className="gap-2"
            >
              <Archive className="h-4 w-4" />
              Limpiar Antiguas
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificaciones Inteligentes
            <Badge variant="outline">{filteredNotifications.length}</Badge>
          </CardTitle>
          <CardDescription>
            Sistema inteligente de alertas y notificaciones del inventario
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <h3 className="text-lg font-medium text-green-700 mb-2">
                ¡No hay notificaciones pendientes!
              </h3>
              <p className="text-green-600">
                Todas las alertas han sido atendidas o no hay problemas
                detectados.
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              <AnimatePresence>
                {filteredNotifications.map((notification) => {
                  const typeConfig = notificationTypeConfig[notification.type];
                  const priorityConfigItem =
                    priorityConfig[notification.priority];
                  const Icon = typeConfig.icon;

                  return (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      transition={{ duration: 0.3 }}
                      className={`p-4 border rounded-lg ${typeConfig.color} ${
                        notification.acknowledged ? "opacity-60" : ""
                      }`}
                      onClick={() => onNotificationClick?.(notification)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="flex-shrink-0">
                            <Icon className="h-5 w-5" />
                            {notification.priority === "critical" && (
                              <motion.div
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="absolute -top-1 -right-1"
                              >
                                <Zap className="h-3 w-3 text-red-500" />
                              </motion.div>
                            )}
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-sm">
                                {notification.title}
                              </h4>
                              <Badge
                                variant="outline"
                                className={`text-xs ${priorityConfigItem.color}`}
                              >
                                {priorityConfigItem.label}
                              </Badge>
                              {notification.actionRequired && (
                                <Badge
                                  variant="destructive"
                                  className="text-xs"
                                >
                                  Acción Requerida
                                </Badge>
                              )}
                              {notification.acknowledged && (
                                <Badge
                                  variant="outline"
                                  className="text-xs bg-green-50 text-green-700"
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Confirmada
                                </Badge>
                              )}
                            </div>

                            <p className="text-sm text-gray-700 mb-2">
                              {notification.message}
                            </p>

                            {notification.details && (
                              <div className="text-xs text-gray-600 space-y-1">
                                {Object.entries(notification.details).map(
                                  ([key, value]) => (
                                    <div
                                      key={key}
                                      className="flex items-center gap-2"
                                    >
                                      <span className="font-medium capitalize">
                                        {key
                                          .replace(/([A-Z])/g, " $1")
                                          .toLowerCase()}
                                        :
                                      </span>
                                      <span>{String(value)}</span>
                                    </div>
                                  )
                                )}
                              </div>
                            )}

                            <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {format(
                                  notification.createdAt,
                                  "dd/MM/yy HH:mm",
                                  { locale: es }
                                )}
                              </span>
                              <span>Producto: {notification.productName}</span>
                              {notification.expiresAt && (
                                <span className="text-red-600">
                                  Expira:{" "}
                                  {format(notification.expiresAt, "dd/MM/yy", {
                                    locale: es,
                                  })}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-1 ml-2">
                          {!notification.acknowledged && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAcknowledge(notification.id);
                              }}
                              className="h-6 px-2 text-xs"
                            >
                              <CheckCircle className="h-3 w-3" />
                            </Button>
                          )}

                          {notification.actionRequired && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                onNotificationClick?.(notification);
                              }}
                              className="h-6 px-2 text-xs"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
