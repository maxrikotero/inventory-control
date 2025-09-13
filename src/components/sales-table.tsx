"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Search,
  Eye,
  Edit,
  Trash2,
  Plus,
  Filter,
  Download,
  Calendar,
  User,
  CreditCard,
  Package,
} from "lucide-react";
import { toast } from "sonner";
import { Sale, SaleStatus, PaymentMethod } from "@/types/sales";
import {
  listSales,
  getSalesByStatus,
  deleteSale,
  updateSaleStatus,
  formatSaleNumber,
  getSaleStatusColor,
  getSaleStatusText,
} from "@/lib/sales";
import { SalesForm } from "./sales-form";
import { SaleDetails } from "./sale-details";

interface SalesTableProps {
  onSaleUpdate?: () => void;
}

export function SalesTable({ onSaleUpdate }: SalesTableProps) {
  const [sales, setSales] = useState<Sale[]>([]);
  const [filteredSales, setFilteredSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<SaleStatus | "ALL">("ALL");
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [showSaleForm, setShowSaleForm] = useState(false);
  const [showSaleDetails, setShowSaleDetails] = useState(false);

  useEffect(() => {
    loadSales();
  }, []);

  useEffect(() => {
    filterSales();
  }, [sales, searchTerm, statusFilter]);

  const loadSales = async () => {
    try {
      setLoading(true);
      const salesData = await listSales(100);
      setSales(salesData);
    } catch (error) {
      console.error("Error loading sales:", error);
      toast.error("Error al cargar ventas");
    } finally {
      setLoading(false);
    }
  };

  const filterSales = () => {
    let filtered = sales;

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (sale) =>
          sale.customerName.toLowerCase().includes(term) ||
          sale.customerEmail?.toLowerCase().includes(term) ||
          sale.customerPhone?.includes(term) ||
          formatSaleNumber(sale.id).toLowerCase().includes(term)
      );
    }

    // Filter by status
    if (statusFilter !== "ALL") {
      filtered = filtered.filter((sale) => sale.status === statusFilter);
    }

    setFilteredSales(filtered);
  };

  const handleDeleteSale = async (saleId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta venta?")) {
      return;
    }

    try {
      await deleteSale(saleId);
      toast.success("Venta eliminada exitosamente");
      loadSales();
      onSaleUpdate?.();
    } catch (error) {
      console.error("Error deleting sale:", error);
      toast.error("Error al eliminar la venta");
    }
  };

  const handleUpdateStatus = async (saleId: string, newStatus: SaleStatus) => {
    try {
      await updateSaleStatus(saleId, newStatus);
      toast.success("Estado de venta actualizado");
      loadSales();
      onSaleUpdate?.();
    } catch (error) {
      console.error("Error updating sale status:", error);
      toast.error("Error al actualizar estado de venta");
    }
  };

  const handleSaleCreated = (saleId: string) => {
    setShowSaleForm(false);
    loadSales();
    onSaleUpdate?.();
    toast.success("Venta creada exitosamente");
  };

  const getPaymentMethodText = (method: PaymentMethod): string => {
    const methods = {
      EFECTIVO: "Efectivo",
      TARJETA_CREDITO: "Tarjeta Crédito",
      TARJETA_DEBITO: "Tarjeta Débito",
      TRANSFERENCIA: "Transferencia",
      CHEQUE: "Cheque",
      CREDITO: "Crédito",
      OTRO: "Otro",
    };
    return methods[method] || method;
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusActions = (sale: Sale) => {
    const actions = [];

    switch (sale.status) {
      case "PENDIENTE":
        actions.push(
          <Button
            key="confirm"
            size="sm"
            variant="outline"
            onClick={() => handleUpdateStatus(sale.id, "CONFIRMADA")}
            className="text-blue-600 hover:text-blue-700"
          >
            Confirmar
          </Button>
        );
        break;
      case "CONFIRMADA":
        actions.push(
          <Button
            key="process"
            size="sm"
            variant="outline"
            onClick={() => handleUpdateStatus(sale.id, "EN_PROCESO")}
            className="text-purple-600 hover:text-purple-700"
          >
            Procesar
          </Button>
        );
        break;
      case "EN_PROCESO":
        actions.push(
          <Button
            key="complete"
            size="sm"
            variant="outline"
            onClick={() => handleUpdateStatus(sale.id, "COMPLETADA")}
            className="text-green-600 hover:text-green-700"
          >
            Completar
          </Button>
        );
        break;
    }

    if (sale.status === "PENDIENTE") {
      actions.push(
        <Button
          key="cancel"
          size="sm"
          variant="outline"
          onClick={() => handleUpdateStatus(sale.id, "CANCELADA")}
          className="text-red-600 hover:text-red-700"
        >
          Cancelar
        </Button>
      );
    }

    return actions;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Cargando ventas...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Ventas</h2>
          <p className="text-sm text-muted-foreground">
            Gestiona todas las ventas y transacciones
          </p>
        </div>
        <Dialog open={showSaleForm} onOpenChange={setShowSaleForm}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nueva Venta
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nueva Venta</DialogTitle>
            </DialogHeader>
            <SalesForm
              onSaleCreated={handleSaleCreated}
              onCancel={() => setShowSaleForm(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por cliente, email, teléfono o número de venta..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as SaleStatus | "ALL")
                }
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">Todos los estados</option>
                <option value="PENDIENTE">Pendiente</option>
                <option value="CONFIRMADA">Confirmada</option>
                <option value="EN_PROCESO">En Proceso</option>
                <option value="COMPLETADA">Completada</option>
                <option value="CANCELADA">Cancelada</option>
                <option value="DEVUELTA">Devuelta</option>
              </select>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                Exportar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sales Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Venta</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Productos</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Método de Pago</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="text-center">
                      <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No hay ventas
                      </h3>
                      <p className="text-gray-600 mb-4">
                        {searchTerm || statusFilter !== "ALL"
                          ? "No se encontraron ventas con los filtros aplicados"
                          : "Comienza creando tu primera venta"}
                      </p>
                      {!searchTerm && statusFilter === "ALL" && (
                        <Button
                          onClick={() => setShowSaleForm(true)}
                          className="gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Crear Primera Venta
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredSales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell>
                      <div className="font-medium">
                        {formatSaleNumber(sale.id)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{sale.customerName}</div>
                        {sale.customerEmail && (
                          <div className="text-sm text-gray-600">
                            {sale.customerEmail}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {sale.items.length} producto
                        {sale.items.length !== 1 ? "s" : ""}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        ${sale.total.toFixed(2)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {getPaymentMethodText(sale.paymentMethod)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getSaleStatusColor(sale.status)}>
                        {getSaleStatusText(sale.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-600">
                        {formatDate(sale.createdAt)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedSale(sale);
                            setShowSaleDetails(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>

                        {getStatusActions(sale)}

                        {sale.status === "PENDIENTE" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteSale(sale.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Sale Details Dialog */}
      <Dialog open={showSaleDetails} onOpenChange={setShowSaleDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalles de Venta</DialogTitle>
          </DialogHeader>
          {selectedSale && (
            <SaleDetails
              sale={selectedSale}
              onClose={() => setShowSaleDetails(false)}
              onStatusUpdate={handleUpdateStatus}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
