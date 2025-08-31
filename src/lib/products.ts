import {
  collection,
  addDoc,
  doc,
  getDocs,
  query,
  updateDoc,
  deleteDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { NewProductInput, Product } from "@/types/product";
import {
  checkStockAlerts,
  getReservations,
  processStockEntry,
} from "@/lib/stock-movements";
import { getAuthenticatedUser } from "@/lib/auth-service";
import { StockAlert } from "@/types/product";

const COLLECTION = "products";

export async function listProducts(): Promise<Product[]> {
  const user = getAuthenticatedUser();
  if (!user) {
    throw new Error("Usuario no autenticado");
  }

  const productQuery = query(
    collection(db, COLLECTION),
    where("userId", "==", user.id)
  );
  try {
    const snapDocument = await getDocs(productQuery);
    return snapDocument.docs.map((dataItem) => {
      const data = dataItem.data() as Omit<Product, "id">;
      return { id: dataItem.id, ...data } as Product;
    });
  } catch (error) {
    console.error("Error listing products:", error);
    return [];
  }
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
  const ref = doc(db, COLLECTION, id);
  await updateDoc(ref, {
    ...(updates as Partial<Product>),
    updatedAt: Date.now(),
  });
}

export async function removeProduct(id: string) {
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
        (sum, reservation) => sum + reservation.quantity,
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
