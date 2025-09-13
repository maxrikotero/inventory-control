"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  User,
  CreditCard,
  Package,
  FileText,
  X,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { Sale, SaleStatus } from "@/types/sales";
import {
  formatSaleNumber,
  getSaleStatusColor,
  getSaleStatusText,
} from "@/lib/sales";

interface SaleDetailsProps {
  sale: Sale;
  onClose: () => void;
  onStatusUpdate: (saleId: string, status: SaleStatus) => void;
}

export function SaleDetails({
  sale,
  onClose,
  onStatusUpdate,
}: SaleDetailsProps) {
  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPaymentMethodText = (method: string): string => {
    const methods = {
      EFECTIVO: "Efectivo",
      TARJETA_CREDITO: "Tarjeta de Crédito",
      TARJETA_DEBITO: "Tarjeta de Débito",
      TRANSFERENCIA: "Transferencia",
      CHEQUE: "Cheque",
      CREDITO: "Crédito",
      OTRO: "Otro",
    };
    return methods[method as keyof typeof methods] || method;
  };

  const getStatusIcon = (status: SaleStatus) => {
    switch (status) {
      case "PENDIENTE":
        return <Clock className="h-4 w-4" />;
      case "CONFIRMADA":
        return <CheckCircle className="h-4 w-4" />;
      case "EN_PROCESO":
        return <Clock className="h-4 w-4" />;
      case "COMPLETADA":
        return <CheckCircle className="h-4 w-4" />;
      case "CANCELADA":
        return <X className="h-4 w-4" />;
      case "DEVUELTA":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getNextStatusAction = (currentStatus: SaleStatus) => {
    switch (currentStatus) {
      case "PENDIENTE":
        return {
          status: "CONFIRMADA" as SaleStatus,
          label: "Confirmar Venta",
          variant: "default" as const,
          icon: <CheckCircle className="h-4 w-4" />,
        };
      case "CONFIRMADA":
        return {
          status: "EN_PROCESO" as SaleStatus,
          label: "Procesar Venta",
          variant: "default" as const,
          icon: <Clock className="h-4 w-4" />,
        };
      case "EN_PROCESO":
        return {
          status: "COMPLETADA" as SaleStatus,
          label: "Completar Venta",
          variant: "default" as const,
          icon: <CheckCircle className="h-4 w-4" />,
        };
      default:
        return null;
    }
  };

  const nextAction = getNextStatusAction(sale.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{formatSaleNumber(sale.id)}</h3>
          <p className="text-sm text-gray-600">
            Creada el {formatDate(sale.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={`${getSaleStatusColor(sale.status)} gap-1`}>
            {getStatusIcon(sale.status)}
            {getSaleStatusText(sale.status)}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4" />
              Información del Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-600">
                Nombre
              </label>
              <p className="text-sm">{sale.customerName}</p>
            </div>
            {sale.customerEmail && (
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Email
                </label>
                <p className="text-sm">{sale.customerEmail}</p>
              </div>
            )}
            {sale.customerPhone && (
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Teléfono
                </label>
                <p className="text-sm">{sale.customerPhone}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CreditCard className="h-4 w-4" />
              Información de Pago
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-600">
                Método de Pago
              </label>
              <p className="text-sm">
                {getPaymentMethodText(sale.paymentMethod)}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Total</label>
              <p className="text-lg font-semibold text-green-600">
                ${sale.total.toFixed(2)}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <label className="text-gray-600">Subtotal</label>
                <p>${sale.subtotal.toFixed(2)}</p>
              </div>
              <div>
                <label className="text-gray-600">Descuento</label>
                <p>${sale.discount.toFixed(2)}</p>
              </div>
              <div>
                <label className="text-gray-600">Impuestos</label>
                <p>${sale.tax.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Products */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="h-4 w-4" />
            Productos ({sale.items.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sale.items.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex-1">
                  <h4 className="font-medium">{item.productName}</h4>
                  <p className="text-sm text-gray-600">
                    Cantidad: {item.quantity} × ${item.unitPrice.toFixed(2)}
                    {item.discount && item.discount > 0 && (
                      <span className="text-green-600 ml-2">
                        (Descuento: ${item.discount.toFixed(2)})
                      </span>
                    )}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">${item.total.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      {sale.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4" />
              Notas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{sale.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t">
        <div className="text-sm text-gray-600">
          <p>Venta creada por: {sale.userName}</p>
          <p>Última actualización: {formatDate(sale.updatedAt)}</p>
        </div>

        <div className="flex items-center gap-3">
          {nextAction && (
            <Button
              onClick={() => onStatusUpdate(sale.id, nextAction.status)}
              className="gap-2"
            >
              {nextAction.icon}
              {nextAction.label}
            </Button>
          )}

          {sale.status === "PENDIENTE" && (
            <Button
              variant="outline"
              onClick={() => onStatusUpdate(sale.id, "CANCELADA")}
              className="gap-2 text-red-600 hover:text-red-700"
            >
              <X className="h-4 w-4" />
              Cancelar Venta
            </Button>
          )}

          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
}
