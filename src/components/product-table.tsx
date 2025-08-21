"use client";

import { useEffect, useState } from "react";
import { listProducts, removeProduct } from "@/lib/products";
import { Product } from "@/types/product";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ProductForm } from "@/components/product-form";
import { StockMovementForm } from "@/components/stock-movement-form";
import { StockHistory } from "@/components/stock-history";
import { StockAlerts } from "@/components/stock-alerts";
import { ProductReservations } from "@/components/product-reservations";
import { toast } from "sonner";
import {
  FileDown,
  FileUp,
  Plus,
  Trash2,
  Pencil,
  AlertTriangle,
  AlertCircle,
  TrendingUp,
  BookmarkPlus,
} from "lucide-react";
import Papa from "papaparse";
import { format } from "date-fns";

export function ProductTable() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [editing, setEditing] = useState<Product | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const items = await listProducts();
        setProducts(items);
      } catch (e) {
        const message = e instanceof Error ? e.message : "Error cargando";
        toast.error(message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function addLocal(p: Product) {
    setProducts((prev) => [p, ...prev]);
  }

  async function remove(id: string) {
    try {
      await removeProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      toast.success("Eliminado");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Error eliminando";
      toast.error(message);
    }
  }

  function exportCSV() {
    const csv = Papa.unparse(
      products.map(
        ({ id, name, brand, quantity, unitPrice, stockAvailable }) => ({
          id,
          name,
          brand,
          quantity,
          unitPrice,
          stockAvailable,
        })
      )
    );
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "products.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  type CSVRow = {
    id?: string;
    name?: string;
    brand?: string;
    quantity?: string | number;
    unitPrice?: string | number;
    stockAvailable?: string | number;
  };

  function importCSV(file: File) {
    Papa.parse(file, {
      header: true,
      complete: async (results) => {
        try {
          const rows = results.data as CSVRow[];
          for (const row of rows) {
            if (!row.name) continue;
            const payload = {
              name: String(row.name),
              brand: String(row.brand ?? ""),
              quantity:
                typeof row.quantity === "string"
                  ? Number(row.quantity)
                  : Number(row.quantity ?? 0),
              unitPrice:
                typeof row.unitPrice === "string"
                  ? Number(row.unitPrice)
                  : Number(row.unitPrice ?? 0),
              stockAvailable:
                typeof row.stockAvailable === "string"
                  ? Number(row.stockAvailable)
                  : Number(row.stockAvailable ?? row.quantity ?? 0),
            };
            // Naive upsert: create new or ignore if exists by id
            addLocal({
              id: Math.random().toString(36).slice(2),
              createdAt: Date.now(),
              updatedAt: Date.now(),
              userId: "import-user", // Temporary user ID for imported products
              reservedStock: 0,
              ...payload,
            });
          }
          toast.success("Importación lista (local)");
        } catch (e) {
          const message = e instanceof Error ? e.message : "Error importando";
          toast.error(message);
        }
      },
    });
  }

  if (loading) {
    return <div className="text-sm text-muted-foreground">Cargando…</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Agregar producto
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nuevo producto</DialogTitle>
              </DialogHeader>
              <ProductForm onCreated={addLocal} />
            </DialogContent>
          </Dialog>
          <StockAlerts />
          <StockHistory />
          <Button variant="outline" className="gap-2" onClick={exportCSV}>
            <FileDown className="h-4 w-4" /> Exportar CSV
          </Button>
          <label className="inline-flex items-center gap-2 text-sm font-medium cursor-pointer border rounded-md px-3 h-9 hover:bg-foreground/5">
            <FileUp className="h-4 w-4" /> Importar CSV
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => e.target.files && importCSV(e.target.files[0])}
            />
          </label>
        </div>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead>Marca</TableHead>
              <TableHead className="text-right">Cantidad Total</TableHead>
              <TableHead className="text-right">Stock Disponible</TableHead>
              <TableHead className="text-right">Min/Max</TableHead>
              <TableHead className="text-right">Precio/unit</TableHead>
              <TableHead className="text-right">Ingreso</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((p) => {
              // Calculate stock status
              const hasMinStockAlert =
                p.minStock && p.stockAvailable <= p.minStock;
              const hasMaxStockAlert =
                p.maxStock && p.stockAvailable >= p.maxStock;
              const isOutOfStock = p.stockAvailable <= 0;

              return (
                <TableRow
                  key={p.id}
                  className={isOutOfStock ? "bg-red-50" : ""}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {p.name}
                      {isOutOfStock && (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      )}
                      {hasMinStockAlert && !isOutOfStock && (
                        <AlertCircle className="h-4 w-4 text-orange-500" />
                      )}
                      {hasMaxStockAlert && (
                        <TrendingUp className="h-4 w-4 text-blue-500" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{p.brand}</TableCell>
                  <TableCell className="text-right">{p.quantity}</TableCell>
                  <TableCell className="text-right">
                    <div
                      className={`font-mono ${
                        isOutOfStock ? "text-red-600 font-bold" : ""
                      }`}
                    >
                      {p.stockAvailable}
                      {p.reservedStock > 0 && (
                        <div className="text-xs text-muted-foreground">
                          {p.reservedStock} reservado
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {p.minStock || p.maxStock ? (
                      <div className="space-y-1">
                        {p.minStock && (
                          <div
                            className={`${
                              hasMinStockAlert
                                ? "text-orange-600 font-medium"
                                : "text-muted-foreground"
                            }`}
                          >
                            Min: {p.minStock}
                          </div>
                        )}
                        {p.maxStock && (
                          <div
                            className={`${
                              hasMaxStockAlert
                                ? "text-blue-600 font-medium"
                                : "text-muted-foreground"
                            }`}
                          >
                            Max: {p.maxStock}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    ${p.unitPrice.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    {format(p.createdAt, "dd/MM/yy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1 flex-wrap">
                      <StockMovementForm
                        product={p}
                        onMovementCreated={() => {
                          // Refresh products list
                          (async () => {
                            try {
                              const items = await listProducts();
                              setProducts(items);
                            } catch (e) {
                              console.error("Error refreshing products:", e);
                            }
                          })();
                        }}
                      />
                      <StockHistory productId={p.id} productName={p.name} />
                      <ProductReservations
                        productId={p.id}
                        productName={p.name}
                        availableStock={p.stockAvailable}
                      />
                      <Dialog
                        onOpenChange={(o) => !o && setEditing(null)}
                        open={!!editing && editing.id === p.id}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditing(p)}
                            title="Editar producto"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Editar producto</DialogTitle>
                          </DialogHeader>
                          <ProductForm
                            product={editing ?? undefined}
                            onCreated={(updated) => {
                              setProducts((prev) =>
                                prev.map((x) =>
                                  x.id === updated.id ? { ...x, ...updated } : x
                                )
                              );
                              setEditing(null);
                            }}
                          />
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(p.id)}
                        title="Eliminar producto"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
