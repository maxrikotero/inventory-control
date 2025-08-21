import {
  collection,
  addDoc,
  doc,
  getDocs,
  query,
  orderBy,
  updateDoc,
  deleteDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { NewProductInput, Product } from "@/types/product";
import {
  listProductsMock,
  createProductMock,
  updateProductMock,
  removeProductMock,
} from "@/lib/products-mock";
import {
  checkStockAlerts,
  getReservations,
  processStockEntry,
} from "@/lib/stock-movements";
import { getAuthenticatedUser } from "@/lib/auth-service";
import { StockAlert } from "@/types/product";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

const COLLECTION = "products";

export async function listProducts(): Promise<Product[]> {
  const user = getAuthenticatedUser();
  if (!user) {
    throw new Error("Usuario no autenticado");
  }

  if (USE_MOCK) return listProductsMock(user.id);

  const q = query(
    collection(db, COLLECTION),
    where("userId", "==", user.id),
    orderBy("updatedAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data() as Omit<Product, "id">;
    return { id: d.id, ...data } as Product;
  });
}

export async function createProduct(
  input: NewProductInput,
  userId?: string,
  userName?: string
): Promise<Product> {
  const user = getAuthenticatedUser();
  if (!user) {
    throw new Error("Usuario no autenticado");
  }

  const actualUserId = userId || user.id;
  const actualUserName = userName || user.name;

  if (USE_MOCK) return createProductMock(input, actualUserId);

  const now = Date.now();
  const payload = {
    ...input,
    userId: actualUserId,
    stockAvailable: input.stockAvailable ?? input.quantity,
    reservedStock: 0,
    createdAt: now,
    updatedAt: now,
  };
  const ref = await addDoc(collection(db, COLLECTION), payload);
  const product = { id: ref.id, ...payload } as Product;

  // Create initial stock entry movement
  if (payload.stockAvailable > 0) {
    await processStockEntry(
      product.id,
      payload.stockAvailable,
      "Stock inicial",
      actualUserId,
      actualUserName
    );
  }

  return product;
}

export async function updateProduct(id: string, updates: Partial<Product>) {
  if (USE_MOCK) return updateProductMock(id, updates);
  const ref = doc(db, COLLECTION, id);
  await updateDoc(ref, {
    ...(updates as Partial<Product>),
    updatedAt: Date.now(),
  });
}

export async function removeProduct(id: string) {
  if (USE_MOCK) return removeProductMock(id);
  await deleteDoc(doc(db, COLLECTION, id));
}

// Enhanced product functions with stock management
export async function getProductWithStockInfo(
  productId: string
): Promise<Product | null> {
  const products = await listProducts();
  const product = products.find((p) => p.id === productId);
  if (!product) return null;

  // Get reservations to calculate available stock
  const reservations = await getReservations(productId);
  const totalReserved = reservations.reduce((sum, r) => sum + r.quantity, 0);

  return {
    ...product,
    reservedStock: totalReserved,
    stockAvailable: Math.max(0, product.stockAvailable - totalReserved),
  };
}

export async function checkProductAlerts(productId: string) {
  const product = await getProductWithStockInfo(productId);
  if (!product) return [];

  return checkStockAlerts(product);
}

export async function getAllProductsWithAlerts(): Promise<
  Array<Product & { alerts: StockAlert[] }>
> {
  const products = await listProducts();
  const productsWithAlerts = await Promise.all(
    products.map(async (product) => {
      const reservations = await getReservations(product.id);
      const totalReserved = reservations.reduce(
        (sum, r) => sum + r.quantity,
        0
      );

      const enhancedProduct = {
        ...product,
        reservedStock: totalReserved,
        stockAvailable: Math.max(0, product.stockAvailable - totalReserved),
      };

      const alerts = await checkStockAlerts(enhancedProduct);

      return {
        ...enhancedProduct,
        alerts,
      };
    })
  );

  return productsWithAlerts;
}
