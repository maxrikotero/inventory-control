import { NewProductInput, Product } from "@/types/product";

const STORAGE_KEY = "mock_products";

function read(): Product[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Product[];
  } catch {
    return [];
  }
}

function write(items: Product[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export async function listProductsMock(userId: string): Promise<Product[]> {
  const allProducts = read();
  return allProducts.filter((p) => (p as any).userId === userId);
}

export async function createProductMock(
  input: NewProductInput,
  userId: string
): Promise<Product> {
  const now = Date.now();
  const p: Product = {
    id: "mock-" + Math.random().toString(36).slice(2),
    name: input.name,
    brand: input.brand,
    quantity: input.quantity,
    unitPrice: input.unitPrice,
    stockAvailable: input.stockAvailable ?? input.quantity,
    minStock: input.minStock,
    maxStock: input.maxStock,
    reservedStock: 0,
    userId,
    createdAt: now,
    updatedAt: now,
  } as Product;
  const items = [p, ...read()];
  write(items);
  return p;
}

export async function updateProductMock(
  id: string,
  updates: Partial<Product>
): Promise<void> {
  const items = read().map((x) =>
    x.id === id ? { ...x, ...updates, updatedAt: Date.now() } : x
  );
  write(items);
}

export async function removeProductMock(id: string): Promise<void> {
  write(read().filter((x) => x.id !== id));
}
