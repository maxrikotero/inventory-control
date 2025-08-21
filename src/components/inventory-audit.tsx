"use client";

import { useState, useEffect } from "react";
import { Product, InventoryAudit } from "@/types/product";
import {
  createInventoryAudit,
  getRecentAudits,
} from "@/lib/smart-notifications";
import { updateProduct } from "@/lib/products";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/auth-provider";
import { toast } from "sonner";
import {
  ClipboardCheck,
  Package,
  AlertTriangle,
  CheckCircle,
  Calendar,
  User,
  Search,
  Plus,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface InventoryAuditProps {
  products: Product[];
  onProductUpdate?: (product: Product) => void;
}

export function InventoryAudit({
  products,
  onProductUpdate,
}: InventoryAuditProps) {
  const { user } = useAuth();
  const [audits, setAudits] = useState<InventoryAudit[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [expectedCount, setExpectedCount] = useState("");
  const [actualCount, setActualCount] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadAudits();
  }, []);

  const loadAudits = async () => {
    try {
      const recentAudits = await getRecentAudits(30);
      setAudits(recentAudits);
    } catch (error) {
      console.error("Error loading audits:", error);
      toast.error("Error al cargar las auditorías");
    }
  };

  const handleStartAudit = (product: Product) => {
    setSelectedProduct(product);
    setExpectedCount(product.stockAvailable.toString());
    setActualCount("");
    setNotes("");
    setIsOpen(true);
  };

  const handleSubmitAudit = async () => {
    if (!selectedProduct || !user || !actualCount) return;

    setLoading(true);
    try {
      const expectedCountNum = parseInt(expectedCount);
      const actualCountNum = parseInt(actualCount);

      if (isNaN(expectedCountNum) || isNaN(actualCountNum)) {
        toast.error("Las cantidades deben ser números válidos");
        return;
      }

      // Create audit record
      const audit = await createInventoryAudit(
        selectedProduct.id,
        expectedCountNum,
        actualCountNum,
        user.uid,
        user.email || "Usuario",
        notes || undefined
      );

      // Update product with audit information and corrected stock
      const updatedProduct = {
        ...selectedProduct,
        stockAvailable: actualCountNum,
        lastAuditDate: audit.auditDate,
        lastAuditCount: actualCountNum,
        updatedAt: Date.now(),
      };

      await updateProduct(selectedProduct.id, updatedProduct);

      toast.success(
        audit.difference === 0
          ? "Auditoría completada sin diferencias"
          : `Auditoría completada. Diferencia: ${
              audit.difference > 0 ? "+" : ""
            }${audit.difference}`
      );

      setIsOpen(false);
      onProductUpdate?.(updatedProduct);
      await loadAudits();
    } catch (error) {
      console.error("Error submitting audit:", error);
      toast.error("Error al procesar la auditoría");
    } finally {
      setLoading(false);
    }
  };

  const getAuditStatusColor = (audit: InventoryAudit) => {
    if (audit.difference === 0) return "bg-green-100 text-green-800";
    if (Math.abs(audit.difference) <= 2) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const getAuditStatusIcon = (audit: InventoryAudit) => {
    if (audit.difference === 0) return <CheckCircle className="h-4 w-4" />;
    if (audit.difference > 0) return <TrendingUp className="h-4 w-4" />;
    return <TrendingDown className="h-4 w-4" />;
  };

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.brand.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const auditStats = audits.reduce(
    (acc, audit) => {
      acc.total++;
      if (audit.difference === 0) acc.exact++;
      else if (audit.difference > 0) acc.surplus++;
      else acc.shortage++;
      return acc;
    },
    { total: 0, exact: 0, surplus: 0, shortage: 0 }
  );

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{auditStats.total}</div>
                <div className="text-sm text-muted-foreground">
                  Auditorías (30d)
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{auditStats.exact}</div>
                <div className="text-sm text-muted-foreground">
                  Sin Diferencias
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{auditStats.surplus}</div>
                <div className="text-sm text-muted-foreground">Sobrantes</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-500" />
              <div>
                <div className="text-2xl font-bold">{auditStats.shortage}</div>
                <div className="text-sm text-muted-foreground">Faltantes</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Products to Audit */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Productos para Auditoría
          </CardTitle>
          <CardDescription>
            Selecciona productos para realizar conteo físico y ajustar
            inventario
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar productos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                />
              </div>
            </div>

            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>Stock Sistema</TableHead>
                    <TableHead>Última Auditoría</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => {
                    const lastAudit = audits.find(
                      (a) => a.productId === product.id
                    );
                    const daysSinceAudit = product.lastAuditDate
                      ? Math.ceil(
                          (Date.now() - product.lastAuditDate) /
                            (1000 * 60 * 60 * 24)
                        )
                      : null;

                    return (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">
                          <div>
                            <div>{product.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {product.brand}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-mono">
                            {product.stockAvailable}
                          </div>
                        </TableCell>
                        <TableCell>
                          {product.lastAuditDate ? (
                            <div>
                              <div className="text-sm">
                                {format(product.lastAuditDate, "dd/MM/yy", {
                                  locale: es,
                                })}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Hace {daysSinceAudit} días
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              Nunca auditado
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {!product.lastAuditDate ? (
                            <Badge
                              variant="outline"
                              className="bg-gray-100 text-gray-800"
                            >
                              Pendiente
                            </Badge>
                          ) : daysSinceAudit && daysSinceAudit > 90 ? (
                            <Badge variant="destructive">
                              Auditoría Vencida
                            </Badge>
                          ) : daysSinceAudit && daysSinceAudit > 30 ? (
                            <Badge className="bg-yellow-100 text-yellow-800">
                              Necesita Auditoría
                            </Badge>
                          ) : (
                            <Badge className="bg-green-100 text-green-800">
                              Actualizado
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStartAudit(product)}
                            className="gap-2"
                          >
                            <ClipboardCheck className="h-4 w-4" />
                            Auditar
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Audits */}
      {audits.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Auditorías Recientes
            </CardTitle>
            <CardDescription>
              Historial de auditorías realizadas en los últimos 30 días
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead>Esperado</TableHead>
                    <TableHead>Actual</TableHead>
                    <TableHead>Diferencia</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {audits.slice(0, 10).map((audit) => {
                    const product = products.find(
                      (p) => p.id === audit.productId
                    );

                    return (
                      <TableRow key={audit.id}>
                        <TableCell>
                          <div className="text-sm">
                            {format(audit.auditDate, "dd/MM/yy HH:mm", {
                              locale: es,
                            })}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {product?.name || "Producto eliminado"}
                        </TableCell>
                        <TableCell className="font-mono">
                          {audit.expectedCount}
                        </TableCell>
                        <TableCell className="font-mono">
                          {audit.actualCount}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {getAuditStatusIcon(audit)}
                            <span
                              className={`font-mono ${
                                audit.difference > 0
                                  ? "text-blue-600"
                                  : audit.difference < 0
                                  ? "text-red-600"
                                  : "text-green-600"
                              }`}
                            >
                              {audit.difference > 0 ? "+" : ""}
                              {audit.difference}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3 text-gray-400" />
                            <span className="text-sm">{audit.userName}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getAuditStatusColor(audit)}>
                            {audit.difference === 0
                              ? "Exacto"
                              : audit.difference > 0
                              ? "Sobrante"
                              : "Faltante"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Audit Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Auditoría de Inventario - {selectedProduct?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">
                Información del Producto
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-700">Marca:</span>
                  <span className="ml-2">{selectedProduct?.brand}</span>
                </div>
                <div>
                  <span className="text-blue-700">Stock Sistema:</span>
                  <span className="ml-2 font-mono">
                    {selectedProduct?.stockAvailable}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expectedCount">Cantidad Esperada</Label>
                <Input
                  id="expectedCount"
                  type="number"
                  value={expectedCount}
                  onChange={(e) => setExpectedCount(e.target.value)}
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground">
                  Cantidad según el sistema
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="actualCount">Cantidad Real *</Label>
                <Input
                  id="actualCount"
                  type="number"
                  value={actualCount}
                  onChange={(e) => setActualCount(e.target.value)}
                  placeholder="0"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Cantidad contada físicamente
                </p>
              </div>
            </div>

            {expectedCount && actualCount && (
              <div className="p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  {parseInt(actualCount) === parseInt(expectedCount) ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : parseInt(actualCount) > parseInt(expectedCount) ? (
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                  <span className="font-medium">
                    Diferencia:{" "}
                    <span
                      className={`font-mono ${
                        parseInt(actualCount) === parseInt(expectedCount)
                          ? "text-green-600"
                          : parseInt(actualCount) > parseInt(expectedCount)
                          ? "text-blue-600"
                          : "text-red-600"
                      }`}
                    >
                      {parseInt(actualCount) - parseInt(expectedCount) > 0
                        ? "+"
                        : ""}
                      {parseInt(actualCount) - parseInt(expectedCount)}
                    </span>
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Notas (opcional)</Label>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observaciones sobre la auditoría..."
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleSubmitAudit}
                disabled={loading || !actualCount}
                className="gap-2"
              >
                <ClipboardCheck className="h-4 w-4" />
                {loading ? "Procesando..." : "Completar Auditoría"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
