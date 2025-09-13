import {
  collection,
  addDoc,
  doc,
  getDocs,
  query,
  updateDoc,
  deleteDoc,
  where,
  orderBy,
  limit,
  startAfter,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Sale,
  NewSaleInput,
  SaleStatus,
  SaleItem,
  SalesAnalytics,
  SalesReportFilter,
} from "@/types/sales";
import { getAuthenticatedUser } from "@/lib/auth-service";
import { Product } from "@/types/product";
import { processStockExit } from "@/lib/stock-movements";

const SALES_COLLECTION = "sales";
const CUSTOMERS_COLLECTION = "customers";

// Sales CRUD Operations
export async function createSale(input: NewSaleInput): Promise<Sale> {
  const user = getAuthenticatedUser();
  if (!user) {
    throw new Error("Usuario no autenticado");
  }

  const now = Date.now();

  // Calculate totals
  const subtotal = input.items.reduce((sum, item) => {
    const itemTotal = item.quantity * item.unitPrice;
    const discount = item.discount || 0;
    return sum + (itemTotal - discount);
  }, 0);

  const discount = input.discount || 0;
  const tax = input.tax || 0;
  const total = subtotal - discount + tax;

  // Create sale items with totals
  const items: SaleItem[] = input.items.map((item) => ({
    ...item,
    total: item.quantity * item.unitPrice - (item.discount || 0),
  }));

  const sale: Omit<Sale, "id"> = {
    customerId: input.customerId || `temp-${Date.now()}`,
    customerName: input.customerName,
    customerEmail: input.customerEmail,
    customerPhone: input.customerPhone,
    items,
    subtotal,
    tax,
    discount,
    total,
    paymentMethod: input.paymentMethod,
    status: "PENDIENTE",
    notes: input.notes,
    userId: user.id,
    userName: user.name,
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await addDoc(collection(db, SALES_COLLECTION), sale);
  return { id: docRef.id, ...sale };
}

export async function updateSaleStatus(
  saleId: string,
  status: SaleStatus,
  notes?: string
): Promise<void> {
  const user = getAuthenticatedUser();
  if (!user) {
    throw new Error("Usuario no autenticado");
  }

  const saleRef = doc(db, SALES_COLLECTION, saleId);
  const updateData: Partial<Sale> = {
    status,
    updatedAt: Date.now(),
  };

  if (notes) {
    updateData.notes = notes;
  }

  await updateDoc(saleRef, updateData);

  // If sale is completed, process stock exit
  if (status === "COMPLETADA") {
    const sale = await getSale(saleId);
    if (sale) {
      await processCompletedSale(sale);
    }
  }
}

export async function getSale(saleId: string): Promise<Sale | null> {
  const saleRef = doc(db, SALES_COLLECTION, saleId);
  const saleSnap = await getDoc(saleRef);

  if (!saleSnap.exists()) {
    return null;
  }

  return { id: saleSnap.id, ...saleSnap.data() } as Sale;
}

export async function listSales(
  limitCount: number = 50,
  lastDoc?: any
): Promise<Sale[]> {
  const user = getAuthenticatedUser();
  if (!user) {
    throw new Error("Usuario no autenticado");
  }

  let q = query(
    collection(db, SALES_COLLECTION),
    where("userId", "==", user.id),
    orderBy("createdAt", "desc"),
    limit(limitCount)
  );

  if (lastDoc) {
    q = query(q, startAfter(lastDoc));
  }

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Sale[];
}

export async function getSalesByDateRange(
  startDate: number,
  endDate: number
): Promise<Sale[]> {
  const user = getAuthenticatedUser();
  if (!user) {
    throw new Error("Usuario no autenticado");
  }

  const q = query(
    collection(db, SALES_COLLECTION),
    where("userId", "==", user.id),
    where("createdAt", ">=", startDate),
    where("createdAt", "<=", endDate),
    orderBy("createdAt", "desc")
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Sale[];
}

export async function getSalesByStatus(status: SaleStatus): Promise<Sale[]> {
  const user = getAuthenticatedUser();
  if (!user) {
    throw new Error("Usuario no autenticado");
  }

  const q = query(
    collection(db, SALES_COLLECTION),
    where("userId", "==", user.id),
    where("status", "==", status),
    orderBy("createdAt", "desc")
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Sale[];
}

export async function deleteSale(saleId: string): Promise<void> {
  const user = getAuthenticatedUser();
  if (!user) {
    throw new Error("Usuario no autenticado");
  }

  // Verify ownership
  const sale = await getSale(saleId);
  if (!sale || sale.userId !== user.id) {
    throw new Error("No autorizado para eliminar esta venta");
  }

  // Only allow deletion of pending sales
  if (sale.status !== "PENDIENTE") {
    throw new Error("Solo se pueden eliminar ventas pendientes");
  }

  await deleteDoc(doc(db, SALES_COLLECTION, saleId));
}

// Process completed sale - update stock
async function processCompletedSale(sale: Sale): Promise<void> {
  const user = getAuthenticatedUser();
  if (!user) {
    throw new Error("Usuario no autenticado");
  }

  for (const item of sale.items) {
    await processStockExit(
      item.productId,
      item.quantity,
      `Venta #${sale.id} - ${item.productName}`,
      user.id,
      user.name,
      { referenceId: sale.id }
    );
  }
}

// Sales Analytics
export async function getSalesAnalytics(
  filter?: SalesReportFilter
): Promise<SalesAnalytics> {
  const user = getAuthenticatedUser();
  if (!user) {
    throw new Error("Usuario no autenticado");
  }

  let sales: Sale[] = [];

  if (filter?.startDate && filter?.endDate) {
    sales = await getSalesByDateRange(filter.startDate, filter.endDate);
  } else {
    sales = await listSales(1000); // Get more sales for analytics
  }

  // Apply additional filters
  if (filter?.status) {
    sales = sales.filter((sale) => sale.status === filter.status);
  }
  if (filter?.customerId) {
    sales = sales.filter((sale) => sale.customerId === filter.customerId);
  }

  // Calculate analytics
  const totalSales = sales.length;
  const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
  const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;

  // Get unique customers
  const uniqueCustomers = new Set(sales.map((sale) => sale.customerId));
  const totalCustomers = uniqueCustomers.size;

  // Calculate new vs repeat customers (simplified)
  const newCustomers = 0; // TODO: Implement proper new customer detection
  const repeatCustomers = totalCustomers - newCustomers;

  // Top products
  const productSales = new Map<
    string,
    { quantity: number; revenue: number; name: string }
  >();

  sales.forEach((sale) => {
    sale.items.forEach((item) => {
      const existing = productSales.get(item.productId) || {
        quantity: 0,
        revenue: 0,
        name: item.productName,
      };
      productSales.set(item.productId, {
        quantity: existing.quantity + item.quantity,
        revenue: existing.revenue + item.total,
        name: item.productName,
      });
    });
  });

  const topProducts = Array.from(productSales.entries())
    .map(([productId, data]) => ({
      productId,
      productName: data.name,
      quantitySold: data.quantity,
      revenue: data.revenue,
      percentage: totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  // Sales by period (daily for now)
  const salesByPeriod = new Map<
    string,
    { sales: number; revenue: number; orders: number }
  >();

  sales.forEach((sale) => {
    const date = new Date(sale.createdAt).toISOString().split("T")[0];
    const existing = salesByPeriod.get(date) || {
      sales: 0,
      revenue: 0,
      orders: 0,
    };
    salesByPeriod.set(date, {
      sales: existing.sales + 1,
      revenue: existing.revenue + sale.total,
      orders: existing.orders + 1,
    });
  });

  const salesByPeriodArray = Array.from(salesByPeriod.entries())
    .map(([period, data]) => ({
      period,
      sales: data.sales,
      revenue: data.revenue,
      orders: data.orders,
    }))
    .sort((a, b) => a.period.localeCompare(b.period));

  // Customer segments (simplified)
  const customerSegments = [
    { segment: "VIP" as const, count: 0, revenue: 0, averageOrderValue: 0 },
    {
      segment: "FRECUENTE" as const,
      count: 0,
      revenue: 0,
      averageOrderValue: 0,
    },
    {
      segment: "OCASIONAL" as const,
      count: 0,
      revenue: 0,
      averageOrderValue: 0,
    },
    { segment: "NUEVO" as const, count: 0, revenue: 0, averageOrderValue: 0 },
    {
      segment: "INACTIVO" as const,
      count: 0,
      revenue: 0,
      averageOrderValue: 0,
    },
  ];

  return {
    totalSales,
    totalRevenue,
    averageOrderValue,
    totalCustomers,
    newCustomers,
    repeatCustomers,
    topProducts,
    salesByPeriod: salesByPeriodArray,
    customerSegments,
  };
}

// Utility functions
export function calculateSaleTotal(
  items: Omit<SaleItem, "total">[],
  discount: number = 0,
  tax: number = 0
): number {
  const subtotal = items.reduce((sum, item) => {
    const itemTotal = item.quantity * item.unitPrice;
    const itemDiscount = item.discount || 0;
    return sum + (itemTotal - itemDiscount);
  }, 0);

  return subtotal - discount + tax;
}

export function formatSaleNumber(saleId: string): string {
  return `V-${saleId.slice(-8).toUpperCase()}`;
}

export function getSaleStatusColor(status: SaleStatus): string {
  const colors = {
    PENDIENTE: "bg-yellow-100 text-yellow-800",
    CONFIRMADA: "bg-blue-100 text-blue-800",
    EN_PROCESO: "bg-purple-100 text-purple-800",
    COMPLETADA: "bg-green-100 text-green-800",
    CANCELADA: "bg-red-100 text-red-800",
    DEVUELTA: "bg-orange-100 text-orange-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
}

export function getSaleStatusText(status: SaleStatus): string {
  const texts = {
    PENDIENTE: "Pendiente",
    CONFIRMADA: "Confirmada",
    EN_PROCESO: "En Proceso",
    COMPLETADA: "Completada",
    CANCELADA: "Cancelada",
    DEVUELTA: "Devuelta",
  };
  return texts[status] || status;
}
