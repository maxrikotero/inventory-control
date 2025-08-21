export type Product = {
  id: string;
  name: string;
  brand: string;
  quantity: number; // total units ever added
  unitPrice: number;
  createdAt: number;
  updatedAt: number;
  // User ownership
  userId: string;
  // Derived fields
  stockAvailable: number;
  // Stock alerts
  minStock?: number;
  maxStock?: number;
  // Reserved stock for pending orders
  reservedStock: number;
  // Expiration tracking
  expirationDate?: number;
  lotNumber?: string;
  // Notification settings
  notificationSettings?: ProductNotificationSettings;
  // Audit tracking
  lastAuditDate?: number;
  lastAuditCount?: number;
};

export type NewProductInput = {
  name: string;
  brand: string;
  quantity: number;
  unitPrice: number;
  stockAvailable?: number;
  minStock?: number;
  maxStock?: number;
  expirationDate?: number;
  lotNumber?: string;
  notificationSettings?: ProductNotificationSettings;
};

export type StockMovementType =
  | "ENTRADA" // Stock entry - new inventory arriving
  | "SALIDA" // Stock exit - sales, deliveries
  | "AJUSTE" // Inventory adjustment - corrections
  | "MERMA" // Stock loss - damage, expiration, theft
  | "TRANSFERENCIA"; // Transfer between locations/warehouses

export type StockMovement = {
  id: string;
  productId: string;
  type: StockMovementType;
  amount: number; // positive for IN movements, negative for OUT movements
  reason: string; // detailed reason/justification for the movement
  userId: string; // who made the movement
  userName: string; // user display name
  referenceId?: string; // order ID, transfer ID, etc.
  location?: string; // warehouse, store location
  createdAt: number;
  updatedAt: number;
};

export type ProductReservation = {
  id: string;
  productId: string;
  quantity: number;
  orderId: string;
  customerName?: string;
  reason: string; // "Pedido pendiente", "Orden especial", etc.
  expiresAt?: number; // when reservation expires
  userId: string;
  userName: string;
  createdAt: number;
  updatedAt: number;
};

export type StockAlert = {
  id: string;
  productId: string;
  productName: string;
  type: "MIN_STOCK" | "MAX_STOCK" | "OUT_OF_STOCK";
  currentStock: number;
  threshold: number;
  message: string;
  acknowledged: boolean;
  createdAt: number;
  updatedAt: number;
};

// Smart Notifications
export type NotificationType =
  | "LOW_STOCK"
  | "OUT_OF_STOCK"
  | "EXPIRATION_WARNING"
  | "EXPIRATION_CRITICAL"
  | "INACTIVE_PRODUCT"
  | "AUDIT_DIFFERENCE"
  | "OVERSTOCK"
  | "RESTOCK_SUGGESTION";

export type NotificationPriority = "low" | "medium" | "high" | "critical";

export type SmartNotification = {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  productId: string;
  productName: string;
  title: string;
  message: string;
  details?: Record<string, any>;
  actionRequired: boolean;
  acknowledged: boolean;
  createdAt: number;
  updatedAt: number;
  expiresAt?: number;
  userId?: string;
};

export type ProductNotificationSettings = {
  lowStockThreshold?: number; // Custom threshold for this product
  inactivityDays?: number; // Days without movement before alert
  expirationWarningDays?: number; // Days before expiration to warn
  enableLowStockAlerts?: boolean;
  enableExpirationAlerts?: boolean;
  enableInactivityAlerts?: boolean;
  enableAuditAlerts?: boolean;
};

export type InventoryAudit = {
  id: string;
  productId: string;
  expectedCount: number;
  actualCount: number;
  difference: number;
  auditDate: number;
  userId: string;
  userName: string;
  notes?: string;
  status: "pending" | "completed" | "discrepancy_resolved";
  createdAt: number;
  updatedAt: number;
};

export type NotificationRule = {
  id: string;
  name: string;
  type: NotificationType;
  enabled: boolean;
  conditions: Record<string, any>;
  actions: NotificationAction[];
  createdAt: number;
  updatedAt: number;
};

export type NotificationAction = {
  type: "email" | "push" | "sms" | "webhook";
  enabled: boolean;
  config: Record<string, any>;
};
