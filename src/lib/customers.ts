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
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Customer,
  NewCustomerInput,
  CustomerSegment,
  CustomerPreferences,
} from "@/types/sales";
import { getAuthenticatedUser } from "@/lib/auth-service";
import { getSalesByDateRange } from "@/lib/sales";

const CUSTOMERS_COLLECTION = "customers";

// Customer CRUD Operations
export async function createCustomer(
  input: NewCustomerInput
): Promise<Customer> {
  const user = getAuthenticatedUser();
  if (!user) {
    throw new Error("Usuario no autenticado");
  }

  const now = Date.now();

  const customer: Omit<Customer, "id"> = {
    name: input.name,
    email: input.email,
    phone: input.phone,
    address: input.address,
    segment: "NUEVO",
    totalPurchases: 0,
    averageOrderValue: 0,
    purchaseFrequency: 0,
    preferences: input.preferences || {},
    userId: user.id,
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await addDoc(collection(db, CUSTOMERS_COLLECTION), customer);
  return { id: docRef.id, ...customer };
}

export async function updateCustomer(
  customerId: string,
  updates: Partial<Customer>
): Promise<void> {
  const user = getAuthenticatedUser();
  if (!user) {
    throw new Error("Usuario no autenticado");
  }

  // Verify ownership
  const customer = await getCustomer(customerId);
  if (!customer || customer.userId !== user.id) {
    throw new Error("No autorizado para actualizar este cliente");
  }

  const customerRef = doc(db, CUSTOMERS_COLLECTION, customerId);
  await updateDoc(customerRef, {
    ...updates,
    updatedAt: Date.now(),
  });
}

export async function getCustomer(
  customerId: string
): Promise<Customer | null> {
  const customerRef = doc(db, CUSTOMERS_COLLECTION, customerId);
  const customerSnap = await getDoc(customerRef);

  if (!customerSnap.exists()) {
    return null;
  }

  return { id: customerSnap.id, ...customerSnap.data() } as Customer;
}

export async function listCustomers(): Promise<Customer[]> {
  const user = getAuthenticatedUser();
  if (!user) {
    throw new Error("Usuario no autenticado");
  }

  const q = query(
    collection(db, CUSTOMERS_COLLECTION),
    where("userId", "==", user.id),
    orderBy("name", "asc")
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Customer[];
}

export async function searchCustomers(searchTerm: string): Promise<Customer[]> {
  const user = getAuthenticatedUser();
  if (!user) {
    throw new Error("Usuario no autenticado");
  }

  const customers = await listCustomers();

  // Simple search implementation
  const term = searchTerm.toLowerCase();
  return customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(term) ||
      customer.email?.toLowerCase().includes(term) ||
      customer.phone?.includes(term)
  );
}

export async function getCustomersBySegment(
  segment: CustomerSegment
): Promise<Customer[]> {
  const user = getAuthenticatedUser();
  if (!user) {
    throw new Error("Usuario no autenticado");
  }

  const q = query(
    collection(db, CUSTOMERS_COLLECTION),
    where("userId", "==", user.id),
    where("segment", "==", segment),
    orderBy("name", "asc")
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Customer[];
}

export async function deleteCustomer(customerId: string): Promise<void> {
  const user = getAuthenticatedUser();
  if (!user) {
    throw new Error("Usuario no autenticado");
  }

  // Verify ownership
  const customer = await getCustomer(customerId);
  if (!customer || customer.userId !== user.id) {
    throw new Error("No autorizado para eliminar este cliente");
  }

  await deleteDoc(doc(db, CUSTOMERS_COLLECTION, customerId));
}

// Customer Analytics and Updates
export async function updateCustomerStats(customerId: string): Promise<void> {
  const user = getAuthenticatedUser();
  if (!user) {
    throw new Error("Usuario no autenticado");
  }

  // Get customer sales from last 30 days
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const sales = await getSalesByDateRange(thirtyDaysAgo, Date.now());
  const customerSales = sales.filter((sale) => sale.customerId === customerId);

  if (customerSales.length === 0) {
    return;
  }

  // Calculate stats
  const totalPurchases = customerSales.length;
  const totalRevenue = customerSales.reduce((sum, sale) => sum + sale.total, 0);
  const averageOrderValue = totalRevenue / totalPurchases;

  // Calculate purchase frequency (simplified)
  const firstSale = Math.min(...customerSales.map((s) => s.createdAt));
  const daysSinceFirstSale = (Date.now() - firstSale) / (1000 * 60 * 60 * 24);
  const purchaseFrequency =
    daysSinceFirstSale > 0 ? totalPurchases / daysSinceFirstSale : 0;

  // Determine segment based on stats
  let segment: CustomerSegment = "OCASIONAL";
  if (totalPurchases >= 10 && averageOrderValue >= 1000) {
    segment = "VIP";
  } else if (totalPurchases >= 5 || purchaseFrequency >= 0.1) {
    segment = "FRECUENTE";
  } else if (totalPurchases === 1) {
    segment = "NUEVO";
  }

  // Update customer
  await updateCustomer(customerId, {
    totalPurchases,
    averageOrderValue,
    purchaseFrequency,
    segment,
    lastPurchaseDate: Math.max(...customerSales.map((s) => s.createdAt)),
  });
}

export async function getCustomerAnalytics(): Promise<{
  totalCustomers: number;
  customersBySegment: Record<CustomerSegment, number>;
  averageOrderValue: number;
  topCustomers: Customer[];
}> {
  const customers = await listCustomers();

  const totalCustomers = customers.length;
  const customersBySegment = customers.reduce((acc, customer) => {
    acc[customer.segment] = (acc[customer.segment] || 0) + 1;
    return acc;
  }, {} as Record<CustomerSegment, number>);

  const averageOrderValue =
    customers.length > 0
      ? customers.reduce((sum, c) => sum + c.averageOrderValue, 0) /
        customers.length
      : 0;

  const topCustomers = customers
    .filter((c) => c.totalPurchases > 0)
    .sort((a, b) => b.averageOrderValue - a.averageOrderValue)
    .slice(0, 10);

  return {
    totalCustomers,
    customersBySegment,
    averageOrderValue,
    topCustomers,
  };
}

// Utility functions
export function getCustomerSegmentColor(segment: CustomerSegment): string {
  const colors = {
    VIP: "bg-purple-100 text-purple-800",
    FRECUENTE: "bg-green-100 text-green-800",
    OCASIONAL: "bg-blue-100 text-blue-800",
    NUEVO: "bg-yellow-100 text-yellow-800",
    INACTIVO: "bg-gray-100 text-gray-800",
  };
  return colors[segment] || "bg-gray-100 text-gray-800";
}

export function getCustomerSegmentText(segment: CustomerSegment): string {
  const texts = {
    VIP: "VIP",
    FRECUENTE: "Frecuente",
    OCASIONAL: "Ocasional",
    NUEVO: "Nuevo",
    INACTIVO: "Inactivo",
  };
  return texts[segment] || segment;
}

export function formatCustomerName(customer: Customer): string {
  return customer.name;
}

export function getCustomerDisplayInfo(customer: Customer): {
  name: string;
  contact: string;
  segment: string;
  stats: string;
} {
  const contact = customer.email || customer.phone || "Sin contacto";
  const segment = getCustomerSegmentText(customer.segment);
  const stats = `${
    customer.totalPurchases
  } compras • $${customer.averageOrderValue.toFixed(0)} promedio`;

  return {
    name: customer.name,
    contact,
    segment,
    stats,
  };
}
