import {
  SmartNotification,
  NotificationType,
  NotificationPriority,
  Product,
  InventoryAudit,
  ProductNotificationSettings,
  NotificationRule,
} from "@/types/product";
import {
  getStockMovements,
  getStockMovementsByDateRange,
} from "@/lib/stock-movements";
import { getAllProductsWithAlerts } from "@/lib/products";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

// Storage keys for mock data
const NOTIFICATIONS_STORAGE_KEY = "smart_notifications";
const AUDITS_STORAGE_KEY = "inventory_audits";
const NOTIFICATION_RULES_STORAGE_KEY = "notification_rules";

// Utility functions for mock storage
function readMockData<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(key);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as T[];
  } catch {
    return [];
  }
}

function writeMockData<T>(key: string, items: T[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(items));
}

// Default notification settings
const DEFAULT_NOTIFICATION_SETTINGS: Required<ProductNotificationSettings> = {
  lowStockThreshold: 10,
  inactivityDays: 30,
  expirationWarningDays: 7,
  enableLowStockAlerts: true,
  enableExpirationAlerts: true,
  enableInactivityAlerts: true,
  enableAuditAlerts: true,
};

// Generate smart notifications
export async function generateSmartNotifications(): Promise<
  SmartNotification[]
> {
  const products = await getAllProductsWithAlerts();

  const notifications: SmartNotification[] = [];

  for (const product of products) {
    const settings = {
      ...DEFAULT_NOTIFICATION_SETTINGS,
      ...product.notificationSettings,
    };

    // Low stock notifications
    if (settings.enableLowStockAlerts) {
      const threshold = settings.lowStockThreshold || product.minStock || 10;
      if (product.stockAvailable <= threshold && product.stockAvailable > 0) {
        notifications.push(
          createNotification({
            type: "LOW_STOCK",
            priority:
              product.stockAvailable <= threshold * 0.5 ? "high" : "medium",
            productId: product.id,
            productName: product.name,
            title: "Stock Bajo",
            message: `${product.name} tiene ${product.stockAvailable} unidades (umbral: ${threshold})`,
            details: {
              currentStock: product.stockAvailable,
              threshold,
              suggestedReorder: Math.max(
                threshold * 2,
                product.maxStock || threshold * 3
              ),
            },
            actionRequired: true,
          })
        );
      }
    }

    // Out of stock notifications
    if (product.stockAvailable <= 0) {
      notifications.push(
        createNotification({
          type: "OUT_OF_STOCK",
          priority: "critical",
          productId: product.id,
          productName: product.name,
          title: "Sin Stock",
          message: `${product.name} está completamente agotado`,
          details: {
            currentStock: product.stockAvailable,
            lastMovementDate: await getLastMovementDate(product.id),
          },
          actionRequired: true,
        })
      );
    }

    // Expiration warnings
    if (settings.enableExpirationAlerts && product.expirationDate) {
      const daysUntilExpiration = Math.ceil(
        (product.expirationDate - Date.now()) / (1000 * 60 * 60 * 24)
      );

      if (daysUntilExpiration <= settings.expirationWarningDays) {
        const isCritical = daysUntilExpiration <= 1;
        notifications.push(
          createNotification({
            type: isCritical ? "EXPIRATION_CRITICAL" : "EXPIRATION_WARNING",
            priority: isCritical ? "critical" : "high",
            productId: product.id,
            productName: product.name,
            title: isCritical
              ? "Producto Vencido/Venciendo"
              : "Próximo a Vencer",
            message: `${product.name} ${
              isCritical
                ? daysUntilExpiration <= 0
                  ? "ya está vencido"
                  : "vence hoy"
                : `vence en ${daysUntilExpiration} días`
            }`,
            details: {
              expirationDate: product.expirationDate,
              daysUntilExpiration,
              lotNumber: product.lotNumber,
              currentStock: product.stockAvailable,
            },
            actionRequired: true,
            expiresAt: product.expirationDate,
          })
        );
      }
    }

    // Inactive product notifications
    if (settings.enableInactivityAlerts) {
      const lastMovementDate = await getLastMovementDate(product.id);
      if (lastMovementDate) {
        const daysSinceLastMovement = Math.ceil(
          (Date.now() - lastMovementDate) / (1000 * 60 * 60 * 24)
        );

        if (daysSinceLastMovement >= settings.inactivityDays) {
          notifications.push(
            createNotification({
              type: "INACTIVE_PRODUCT",
              priority:
                daysSinceLastMovement > settings.inactivityDays * 2
                  ? "high"
                  : "medium",
              productId: product.id,
              productName: product.name,
              title: "Producto Inactivo",
              message: `${product.name} no ha tenido movimientos en ${daysSinceLastMovement} días`,
              details: {
                daysSinceLastMovement,
                lastMovementDate,
                currentStock: product.stockAvailable,
                suggestedAction:
                  product.stockAvailable > 0 ? "promocion" : "descontinuar",
              },
              actionRequired: false,
            })
          );
        }
      }
    }

    // Overstock notifications
    if (product.maxStock && product.stockAvailable > product.maxStock) {
      notifications.push(
        createNotification({
          type: "OVERSTOCK",
          priority: "low",
          productId: product.id,
          productName: product.name,
          title: "Sobrestock",
          message: `${product.name} supera el stock máximo (${product.stockAvailable}/${product.maxStock})`,
          details: {
            currentStock: product.stockAvailable,
            maxStock: product.maxStock,
            excess: product.stockAvailable - product.maxStock,
          },
          actionRequired: false,
        })
      );
    }
  }

  // Check for audit differences
  const auditNotifications = await generateAuditNotifications();
  notifications.push(...auditNotifications);

  // Sort by priority and date
  notifications.sort((a, b) => {
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return b.createdAt - a.createdAt;
  });

  return notifications;
}

// Helper function to create notification
function createNotification(params: {
  type: NotificationType;
  priority: NotificationPriority;
  productId: string;
  productName: string;
  title: string;
  message: string;
  details?: Record<string, any>;
  actionRequired: boolean;
  expiresAt?: number;
}): SmartNotification {
  return {
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    ...params,
    acknowledged: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

// Get last movement date for a product
async function getLastMovementDate(productId: string): Promise<number | null> {
  const movements = await getStockMovements(productId, 1);
  return movements.length > 0 ? movements[0].createdAt : null;
}

// Generate audit-related notifications
async function generateAuditNotifications(): Promise<SmartNotification[]> {
  const notifications: SmartNotification[] = [];
  const audits = await getRecentAudits(7); // Last 7 days

  for (const audit of audits) {
    if (audit.status === "completed" && Math.abs(audit.difference) > 0) {
      const product = (await getAllProductsWithAlerts()).find(
        (p) => p.id === audit.productId
      );

      if (product?.notificationSettings?.enableAuditAlerts !== false) {
        notifications.push(
          createNotification({
            type: "AUDIT_DIFFERENCE",
            priority: Math.abs(audit.difference) > 10 ? "high" : "medium",
            productId: audit.productId,
            productName: product?.name || "Producto Desconocido",
            title: "Diferencia en Auditoría",
            message: `Auditoría de ${
              product?.name || "producto"
            } encontró diferencia de ${audit.difference > 0 ? "+" : ""}${
              audit.difference
            } unidades`,
            details: {
              expectedCount: audit.expectedCount,
              actualCount: audit.actualCount,
              difference: audit.difference,
              auditDate: audit.auditDate,
              auditId: audit.id,
            },
            actionRequired: true,
          })
        );
      }
    }
  }

  return notifications;
}

// Get stored notifications
export async function getSmartNotifications(): Promise<SmartNotification[]> {
  // TODO: Implement Firebase storage
  return generateSmartNotifications();
}

// Acknowledge notification
export async function acknowledgeNotification(
  notificationId: string
): Promise<void> {
  if (USE_MOCK) {
    const notifications = readMockData<SmartNotification>(
      NOTIFICATIONS_STORAGE_KEY
    );
    const updated = notifications.map((n) =>
      n.id === notificationId
        ? { ...n, acknowledged: true, updatedAt: Date.now() }
        : n
    );
    writeMockData(NOTIFICATIONS_STORAGE_KEY, updated);
    return;
  }

  // TODO: Implement Firebase update
}

// Create inventory audit
export async function createInventoryAudit(
  productId: string,
  expectedCount: number,
  actualCount: number,
  userId: string,
  userName: string,
  notes?: string
): Promise<InventoryAudit> {
  const audit: InventoryAudit = {
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    productId,
    expectedCount,
    actualCount,
    difference: actualCount - expectedCount,
    auditDate: Date.now(),
    userId,
    userName,
    notes,
    status: Math.abs(actualCount - expectedCount) > 0 ? "pending" : "completed",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  if (USE_MOCK) {
    const audits = readMockData<InventoryAudit>(AUDITS_STORAGE_KEY);
    writeMockData(AUDITS_STORAGE_KEY, [audit, ...audits]);
  }

  // TODO: Implement Firebase storage

  return audit;
}

// Get recent audits
export async function getRecentAudits(
  days: number = 30
): Promise<InventoryAudit[]> {
  const cutoffDate = Date.now() - days * 24 * 60 * 60 * 1000;

  if (USE_MOCK) {
    const audits = readMockData<InventoryAudit>(AUDITS_STORAGE_KEY);
    return audits.filter((a) => a.auditDate >= cutoffDate);
  }

  // TODO: Implement Firebase query
  return [];
}

// Update product notification settings
export async function updateProductNotificationSettings(
  productId: string,
  settings: Partial<ProductNotificationSettings>
): Promise<void> {
  // This would update the product's notification settings
  // Implementation depends on your product update system
  console.log(
    `Updating notification settings for product ${productId}:`,
    settings
  );
  // TODO: Implement via product update API
}

// Get notification statistics
export async function getNotificationStats(): Promise<{
  total: number;
  byType: Record<NotificationType, number>;
  byPriority: Record<NotificationPriority, number>;
  unacknowledged: number;
  actionRequired: number;
}> {
  const notifications = await getSmartNotifications();

  const stats = {
    total: notifications.length,
    byType: {} as Record<NotificationType, number>,
    byPriority: {} as Record<NotificationPriority, number>,
    unacknowledged: notifications.filter((n) => !n.acknowledged).length,
    actionRequired: notifications.filter((n) => n.actionRequired).length,
  };

  // Count by type
  notifications.forEach((n) => {
    stats.byType[n.type] = (stats.byType[n.type] || 0) + 1;
    stats.byPriority[n.priority] = (stats.byPriority[n.priority] || 0) + 1;
  });

  return stats;
}

// Cleanup old notifications
export async function cleanupOldNotifications(
  daysToKeep: number = 30
): Promise<number> {
  const cutoffDate = Date.now() - daysToKeep * 24 * 60 * 60 * 1000;

  if (USE_MOCK) {
    const notifications = readMockData<SmartNotification>(
      NOTIFICATIONS_STORAGE_KEY
    );
    const filtered = notifications.filter(
      (n) => n.createdAt >= cutoffDate || (!n.acknowledged && n.actionRequired)
    );
    const removed = notifications.length - filtered.length;
    writeMockData(NOTIFICATIONS_STORAGE_KEY, filtered);
    return removed;
  }

  // TODO: Implement Firebase cleanup
  return 0;
}

// Get notification rules
export async function getNotificationRules(): Promise<NotificationRule[]> {
  if (USE_MOCK) {
    return readMockData<NotificationRule>(NOTIFICATION_RULES_STORAGE_KEY);
  }

  // TODO: Implement Firebase query
  return [];
}

// Create or update notification rule
export async function upsertNotificationRule(
  rule: Omit<NotificationRule, "id" | "createdAt" | "updatedAt">
): Promise<NotificationRule> {
  const newRule: NotificationRule = {
    ...rule,
    id: `rule-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  if (USE_MOCK) {
    const rules = readMockData<NotificationRule>(
      NOTIFICATION_RULES_STORAGE_KEY
    );
    writeMockData(NOTIFICATION_RULES_STORAGE_KEY, [newRule, ...rules]);
  }

  // TODO: Implement Firebase storage

  return newRule;
}
