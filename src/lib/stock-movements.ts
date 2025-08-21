import {
  collection,
  addDoc,
  doc,
  getDocs,
  query,
  orderBy,
  where,
  updateDoc,
  deleteDoc,
  limit as limitQuery,
  startAfter,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  StockMovement,
  StockMovementType,
  ProductReservation,
  StockAlert,
  Product,
} from "@/types/product";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

const MOVEMENTS_COLLECTION = "stock_movements";
const RESERVATIONS_COLLECTION = "product_reservations";
const ALERTS_COLLECTION = "stock_alerts";

// Mock storage keys
const MOVEMENTS_STORAGE_KEY = "mock_stock_movements";
const RESERVATIONS_STORAGE_KEY = "mock_product_reservations";
const ALERTS_STORAGE_KEY = "mock_stock_alerts";

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

// Stock Movement Functions
export async function createStockMovement(
  productId: string,
  type: StockMovementType,
  amount: number,
  reason: string,
  userId: string,
  userName: string,
  options?: {
    referenceId?: string;
    location?: string;
  }
): Promise<StockMovement> {
  const now = Date.now();
  const movement: Omit<StockMovement, "id"> = {
    productId,
    type,
    amount: calculateMovementAmount(type, amount),
    reason,
    userId,
    userName,
    referenceId: options?.referenceId,
    location: options?.location,
    createdAt: now,
    updatedAt: now,
  };

  if (USE_MOCK) {
    const newMovement: StockMovement = {
      id: "mov-" + Math.random().toString(36).slice(2),
      ...movement,
    };
    const movements = readMockData<StockMovement>(MOVEMENTS_STORAGE_KEY);
    writeMockData(MOVEMENTS_STORAGE_KEY, [newMovement, ...movements]);
    return newMovement;
  }

  const ref = await addDoc(collection(db, MOVEMENTS_COLLECTION), movement);
  return { id: ref.id, ...movement };
}

function calculateMovementAmount(
  type: StockMovementType,
  amount: number
): number {
  // Ensure correct sign based on movement type
  switch (type) {
    case "ENTRADA":
    case "AJUSTE":
      return Math.abs(amount); // Always positive
    case "SALIDA":
    case "MERMA":
      return -Math.abs(amount); // Always negative
    case "TRANSFERENCIA":
      return amount; // Can be positive or negative depending on direction
    default:
      return amount;
  }
}

export async function getStockMovements(
  productId?: string,
  limit?: number,
  lastMovementId?: string
): Promise<StockMovement[]> {
  if (USE_MOCK) {
    let movements = readMockData<StockMovement>(MOVEMENTS_STORAGE_KEY);

    if (productId) {
      movements = movements.filter((m) => m.productId === productId);
    }

    // Sort by creation date (newest first)
    movements.sort((a, b) => b.createdAt - a.createdAt);

    if (limit) {
      movements = movements.slice(0, limit);
    }

    return movements;
  }

  let q = query(
    collection(db, MOVEMENTS_COLLECTION),
    orderBy("createdAt", "desc")
  );

  if (productId) {
    q = query(q, where("productId", "==", productId));
  }

  if (limit) {
    q = query(q, limitQuery(limit));
  }

  const snap = await getDocs(q);
  return snap.docs.map(
    (d) =>
      ({
        id: d.id,
        ...d.data(),
      } as StockMovement)
  );
}

export async function getStockMovementsByDateRange(
  startDate: Date,
  endDate: Date,
  productId?: string
): Promise<StockMovement[]> {
  if (USE_MOCK) {
    let movements = readMockData<StockMovement>(MOVEMENTS_STORAGE_KEY);

    movements = movements.filter(
      (m) =>
        m.createdAt >= startDate.getTime() && m.createdAt <= endDate.getTime()
    );

    if (productId) {
      movements = movements.filter((m) => m.productId === productId);
    }

    return movements.sort((a, b) => b.createdAt - a.createdAt);
  }

  let q = query(
    collection(db, MOVEMENTS_COLLECTION),
    where("createdAt", ">=", startDate.getTime()),
    where("createdAt", "<=", endDate.getTime()),
    orderBy("createdAt", "desc")
  );

  if (productId) {
    q = query(q, where("productId", "==", productId));
  }

  const snap = await getDocs(q);
  return snap.docs.map(
    (d) =>
      ({
        id: d.id,
        ...d.data(),
      } as StockMovement)
  );
}

// Product Reservation Functions
export async function createReservation(
  productId: string,
  quantity: number,
  orderId: string,
  reason: string,
  userId: string,
  userName: string,
  options?: {
    customerName?: string;
    expiresAt?: number;
  }
): Promise<ProductReservation> {
  const now = Date.now();
  const reservation: Omit<ProductReservation, "id"> = {
    productId,
    quantity,
    orderId,
    customerName: options?.customerName,
    reason,
    expiresAt: options?.expiresAt,
    userId,
    userName,
    createdAt: now,
    updatedAt: now,
  };

  if (USE_MOCK) {
    const newReservation: ProductReservation = {
      id: "res-" + Math.random().toString(36).slice(2),
      ...reservation,
    };
    const reservations = readMockData<ProductReservation>(
      RESERVATIONS_STORAGE_KEY
    );
    writeMockData(RESERVATIONS_STORAGE_KEY, [newReservation, ...reservations]);
    return newReservation;
  }

  const ref = await addDoc(
    collection(db, RESERVATIONS_COLLECTION),
    reservation
  );
  return { id: ref.id, ...reservation };
}

export async function getReservations(
  productId?: string
): Promise<ProductReservation[]> {
  if (USE_MOCK) {
    let reservations = readMockData<ProductReservation>(
      RESERVATIONS_STORAGE_KEY
    );

    if (productId) {
      reservations = reservations.filter((r) => r.productId === productId);
    }

    // Filter out expired reservations
    const now = Date.now();
    reservations = reservations.filter(
      (r) => !r.expiresAt || r.expiresAt > now
    );

    return reservations.sort((a, b) => b.createdAt - a.createdAt);
  }

  let q = query(
    collection(db, RESERVATIONS_COLLECTION),
    orderBy("createdAt", "desc")
  );

  if (productId) {
    q = query(q, where("productId", "==", productId));
  }

  const snap = await getDocs(q);
  const now = Date.now();

  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as ProductReservation))
    .filter((r) => !r.expiresAt || r.expiresAt > now);
}

export async function cancelReservation(reservationId: string): Promise<void> {
  if (USE_MOCK) {
    const reservations = readMockData<ProductReservation>(
      RESERVATIONS_STORAGE_KEY
    );
    const filtered = reservations.filter((r) => r.id !== reservationId);
    writeMockData(RESERVATIONS_STORAGE_KEY, filtered);
    return;
  }

  await deleteDoc(doc(db, RESERVATIONS_COLLECTION, reservationId));
}

// Stock Alert Functions
export async function checkStockAlerts(
  product: Product
): Promise<StockAlert[]> {
  const alerts: StockAlert[] = [];
  const now = Date.now();

  // Check for out of stock
  if (product.stockAvailable <= 0) {
    alerts.push({
      id: `alert-${product.id}-out-of-stock`,
      productId: product.id,
      productName: product.name,
      type: "OUT_OF_STOCK",
      currentStock: product.stockAvailable,
      threshold: 0,
      message: `${product.name} está agotado`,
      acknowledged: false,
      createdAt: now,
      updatedAt: now,
    });
  }

  // Check minimum stock
  if (product.minStock && product.stockAvailable <= product.minStock) {
    alerts.push({
      id: `alert-${product.id}-min-stock`,
      productId: product.id,
      productName: product.name,
      type: "MIN_STOCK",
      currentStock: product.stockAvailable,
      threshold: product.minStock,
      message: `${product.name} está por debajo del stock mínimo (${product.minStock})`,
      acknowledged: false,
      createdAt: now,
      updatedAt: now,
    });
  }

  // Check maximum stock
  if (product.maxStock && product.stockAvailable >= product.maxStock) {
    alerts.push({
      id: `alert-${product.id}-max-stock`,
      productId: product.id,
      productName: product.name,
      type: "MAX_STOCK",
      currentStock: product.stockAvailable,
      threshold: product.maxStock,
      message: `${product.name} ha excedido el stock máximo (${product.maxStock})`,
      acknowledged: false,
      createdAt: now,
      updatedAt: now,
    });
  }

  return alerts;
}

export async function getStockAlerts(): Promise<StockAlert[]> {
  if (USE_MOCK) {
    return readMockData<StockAlert>(ALERTS_STORAGE_KEY);
  }

  const q = query(
    collection(db, ALERTS_COLLECTION),
    where("acknowledged", "==", false),
    orderBy("createdAt", "desc")
  );

  const snap = await getDocs(q);
  return snap.docs.map(
    (d) =>
      ({
        id: d.id,
        ...d.data(),
      } as StockAlert)
  );
}

export async function acknowledgeAlert(alertId: string): Promise<void> {
  if (USE_MOCK) {
    const alerts = readMockData<StockAlert>(ALERTS_STORAGE_KEY);
    const updated = alerts.map((alert) =>
      alert.id === alertId
        ? { ...alert, acknowledged: true, updatedAt: Date.now() }
        : alert
    );
    writeMockData(ALERTS_STORAGE_KEY, updated);
    return;
  }

  await updateDoc(doc(db, ALERTS_COLLECTION, alertId), {
    acknowledged: true,
    updatedAt: Date.now(),
  });
}

// High-level stock operations
export async function processStockEntry(
  productId: string,
  quantity: number,
  reason: string,
  userId: string,
  userName: string,
  options?: { referenceId?: string; location?: string }
): Promise<StockMovement> {
  return createStockMovement(
    productId,
    "ENTRADA",
    quantity,
    reason,
    userId,
    userName,
    options
  );
}

export async function processStockExit(
  productId: string,
  quantity: number,
  reason: string,
  userId: string,
  userName: string,
  options?: { referenceId?: string; location?: string }
): Promise<StockMovement> {
  return createStockMovement(
    productId,
    "SALIDA",
    quantity,
    reason,
    userId,
    userName,
    options
  );
}

export async function processStockAdjustment(
  productId: string,
  adjustmentAmount: number,
  reason: string,
  userId: string,
  userName: string,
  options?: { referenceId?: string; location?: string }
): Promise<StockMovement> {
  return createStockMovement(
    productId,
    "AJUSTE",
    adjustmentAmount,
    reason,
    userId,
    userName,
    options
  );
}

export async function processStockLoss(
  productId: string,
  quantity: number,
  reason: string,
  userId: string,
  userName: string,
  options?: { referenceId?: string; location?: string }
): Promise<StockMovement> {
  return createStockMovement(
    productId,
    "MERMA",
    quantity,
    reason,
    userId,
    userName,
    options
  );
}

export async function processStockTransfer(
  productId: string,
  quantity: number,
  reason: string,
  userId: string,
  userName: string,
  fromLocation: string,
  toLocation: string,
  options?: { referenceId?: string }
): Promise<StockMovement[]> {
  // Create both OUT and IN movements for transfer
  const outMovement = await createStockMovement(
    productId,
    "TRANSFERENCIA",
    -quantity,
    `${reason} - Salida de ${fromLocation}`,
    userId,
    userName,
    { ...options, location: fromLocation }
  );

  const inMovement = await createStockMovement(
    productId,
    "TRANSFERENCIA",
    quantity,
    `${reason} - Entrada a ${toLocation}`,
    userId,
    userName,
    { ...options, location: toLocation }
  );

  return [outMovement, inMovement];
}
