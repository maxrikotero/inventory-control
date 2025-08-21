"use client";

import { useEffect, useState } from "react";
import { ProductReservation } from "@/types/product";
import {
  getReservations,
  createReservation,
  cancelReservation,
} from "@/lib/stock-movements";
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
import { useAuth } from "@/components/auth-provider";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  BookmarkPlus,
  Clock,
  User,
  Package,
  X,
  Calendar,
  Plus,
} from "lucide-react";
import { toast } from "sonner";

interface ProductReservationsProps {
  productId: string;
  productName: string;
  availableStock: number;
}

export function ProductReservations({
  productId,
  productName,
  availableStock,
}: ProductReservationsProps) {
  const { user } = useAuth();
  const [reservations, setReservations] = useState<ProductReservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [quantity, setQuantity] = useState("");
  const [orderId, setOrderId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [reason, setReason] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadReservations();
    }
  }, [isOpen, productId]);

  const loadReservations = async () => {
    setLoading(true);
    try {
      const data = await getReservations(productId);
      setReservations(data);
    } catch (error) {
      console.error("Error loading reservations:", error);
      toast.error("Error al cargar las reservas");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setQuantity("");
    setOrderId("");
    setCustomerName("");
    setReason("");
    setExpiresAt("");
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const quantityNum = parseInt(quantity);
    if (isNaN(quantityNum) || quantityNum <= 0) {
      toast.error("La cantidad debe ser un número positivo");
      return;
    }

    if (quantityNum > availableStock) {
      toast.error("No hay suficiente stock disponible para reservar");
      return;
    }

    setSubmitting(true);
    try {
      const options: any = {};
      if (customerName) options.customerName = customerName;
      if (expiresAt) options.expiresAt = new Date(expiresAt).getTime();

      await createReservation(
        productId,
        quantityNum,
        orderId,
        reason || "Reserva de stock",
        user.id,
        user.name || "Usuario",
        options
      );

      toast.success("Reserva creada exitosamente");
      resetForm();
      await loadReservations();
    } catch (error) {
      console.error("Error creating reservation:", error);
      toast.error("Error al crear la reserva");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (reservationId: string) => {
    try {
      await cancelReservation(reservationId);
      toast.success("Reserva cancelada");
      await loadReservations();
    } catch (error) {
      console.error("Error canceling reservation:", error);
      toast.error("Error al cancelar la reserva");
    }
  };

  const totalReserved = reservations.reduce((sum, r) => sum + r.quantity, 0);
  const expiredReservations = reservations.filter(
    (r) => r.expiresAt && r.expiresAt < Date.now()
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <BookmarkPlus className="h-4 w-4" />
          Reservas
          {totalReserved > 0 && (
            <span className="bg-blue-100 text-blue-800 text-xs px-1.5 py-0.5 rounded-full">
              {totalReserved}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookmarkPlus className="h-5 w-5" />
            Reservas de Stock - {productName}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-sm text-blue-600 font-medium">
                Stock Disponible
              </div>
              <div className="text-xl font-bold text-blue-900">
                {availableStock}
              </div>
            </div>
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="text-sm text-orange-600 font-medium">
                Total Reservado
              </div>
              <div className="text-xl font-bold text-orange-900">
                {totalReserved}
              </div>
            </div>
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-sm text-green-600 font-medium">
                Reservas Activas
              </div>
              <div className="text-xl font-bold text-green-900">
                {reservations.length}
              </div>
            </div>
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="text-sm text-red-600 font-medium">Vencidas</div>
              <div className="text-xl font-bold text-red-900">
                {expiredReservations.length}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={() => setShowForm(!showForm)}
              className="gap-2"
              disabled={availableStock <= 0}
            >
              <Plus className="h-4 w-4" />
              Nueva Reserva
            </Button>
            <Button
              onClick={loadReservations}
              variant="outline"
              disabled={loading}
            >
              {loading ? "Actualizando..." : "Actualizar"}
            </Button>
          </div>

          {/* New Reservation Form */}
          {showForm && (
            <div className="p-4 border rounded-lg bg-gray-50">
              <h3 className="font-medium mb-4">Nueva Reserva</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Cantidad *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      max={availableStock}
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder="0"
                      required
                    />
                    <p className="text-sm text-muted-foreground">
                      Máximo disponible: {availableStock}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="orderId">ID de Pedido *</Label>
                    <Input
                      id="orderId"
                      value={orderId}
                      onChange={(e) => setOrderId(e.target.value)}
                      placeholder="PED-001"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customerName">Cliente</Label>
                    <Input
                      id="customerName"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Nombre del cliente"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expiresAt">Fecha de Vencimiento</Label>
                    <Input
                      id="expiresAt"
                      type="datetime-local"
                      value={expiresAt}
                      onChange={(e) => setExpiresAt(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason">Motivo</Label>
                  <Input
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Pedido especial, separación para cliente..."
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "Creando..." : "Crear Reserva"}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Reservations Table */}
          <div className="border rounded-lg">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">
                Cargando reservas...
              </div>
            ) : reservations.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No hay reservas activas
                </h3>
                <p className="text-gray-500">
                  Crea una nueva reserva para separar stock para pedidos
                  pendientes.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pedido</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="text-right">Cantidad</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead>Creada</TableHead>
                    <TableHead>Vence</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reservations.map((reservation) => {
                    const isExpired =
                      reservation.expiresAt &&
                      reservation.expiresAt < Date.now();

                    return (
                      <TableRow
                        key={reservation.id}
                        className={isExpired ? "bg-red-50" : ""}
                      >
                        <TableCell className="font-medium">
                          {reservation.orderId}
                          {isExpired && (
                            <span className="ml-2 text-xs bg-red-100 text-red-800 px-1.5 py-0.5 rounded">
                              Vencida
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400" />
                            {reservation.customerName || "-"}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {reservation.quantity}
                        </TableCell>
                        <TableCell
                          className="max-w-xs truncate"
                          title={reservation.reason}
                        >
                          {reservation.reason}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          {format(reservation.createdAt, "dd/MM/yy HH:mm", {
                            locale: es,
                          })}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          {reservation.expiresAt ? (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-gray-400" />
                              {format(reservation.expiresAt, "dd/MM/yy HH:mm", {
                                locale: es,
                              })}
                            </div>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {reservation.userName}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCancel(reservation.id)}
                            className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="h-3 w-3" />
                            Cancelar
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
