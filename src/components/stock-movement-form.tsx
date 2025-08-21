"use client";

import { useState } from "react";
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
import { StockMovementType, Product } from "@/types/product";
import {
  processStockEntry,
  processStockExit,
  processStockAdjustment,
  processStockLoss,
  processStockTransfer,
} from "@/lib/stock-movements";
import { updateProduct } from "@/lib/products";
import { useAuth } from "@/components/auth-provider";
import { toast } from "sonner";
import {
  Package,
  PackageMinus,
  Settings,
  AlertTriangle,
  ArrowRightLeft,
  Plus,
} from "lucide-react";

interface StockMovementFormProps {
  product: Product;
  onMovementCreated?: () => void;
}

export function StockMovementForm({
  product,
  onMovementCreated,
}: StockMovementFormProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [movementType, setMovementType] = useState<StockMovementType | null>(
    null
  );
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [location, setLocation] = useState("");
  const [toLocation, setToLocation] = useState("");
  const [loading, setLoading] = useState(false);

  const movementTypes = [
    {
      type: "ENTRADA" as StockMovementType,
      label: "Entrada de Stock",
      description: "Recepción de inventario nuevo",
      icon: Package,
      color: "text-green-600",
    },
    {
      type: "SALIDA" as StockMovementType,
      label: "Salida de Stock",
      description: "Ventas, entregas, consumo",
      icon: PackageMinus,
      color: "text-blue-600",
    },
    {
      type: "AJUSTE" as StockMovementType,
      label: "Ajuste de Inventario",
      description: "Corrección de cantidades",
      icon: Settings,
      color: "text-orange-600",
    },
    {
      type: "MERMA" as StockMovementType,
      label: "Merma/Pérdida",
      description: "Daños, vencimiento, robo",
      icon: AlertTriangle,
      color: "text-red-600",
    },
    {
      type: "TRANSFERENCIA" as StockMovementType,
      label: "Transferencia",
      description: "Movimiento entre ubicaciones",
      icon: ArrowRightLeft,
      color: "text-purple-600",
    },
  ];

  const resetForm = () => {
    setMovementType(null);
    setQuantity("");
    setReason("");
    setLocation("");
    setToLocation("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !movementType || !quantity || !reason) return;

    setLoading(true);
    try {
      const quantityNum = parseInt(quantity);
      if (isNaN(quantityNum) || quantityNum <= 0) {
        toast.error("La cantidad debe ser un número positivo");
        return;
      }

      let newStockLevel = product.stockAvailable;

      switch (movementType) {
        case "ENTRADA":
          await processStockEntry(
            product.id,
            quantityNum,
            reason,
            user.uid,
            user.email || "Usuario",
            { location }
          );
          newStockLevel += quantityNum;
          break;

        case "SALIDA":
          if (quantityNum > product.stockAvailable) {
            toast.error("No hay suficiente stock disponible");
            return;
          }
          await processStockExit(
            product.id,
            quantityNum,
            reason,
            user.uid,
            user.email || "Usuario",
            { location }
          );
          newStockLevel -= quantityNum;
          break;

        case "AJUSTE":
          await processStockAdjustment(
            product.id,
            quantityNum,
            reason,
            user.uid,
            user.email || "Usuario",
            { location }
          );
          newStockLevel = quantityNum; // Adjustment sets absolute value
          break;

        case "MERMA":
          if (quantityNum > product.stockAvailable) {
            toast.error("No hay suficiente stock para registrar la merma");
            return;
          }
          await processStockLoss(
            product.id,
            quantityNum,
            reason,
            user.uid,
            user.email || "Usuario",
            { location }
          );
          newStockLevel -= quantityNum;
          break;

        case "TRANSFERENCIA":
          if (!toLocation) {
            toast.error("Debe especificar la ubicación de destino");
            return;
          }
          if (quantityNum > product.stockAvailable) {
            toast.error("No hay suficiente stock para transferir");
            return;
          }
          await processStockTransfer(
            product.id,
            quantityNum,
            reason,
            user.uid,
            user.email || "Usuario",
            location || "Almacén principal",
            toLocation
          );
          // For transfers, stock level doesn't change (just location)
          break;

        default:
          throw new Error("Tipo de movimiento no válido");
      }

      // Update product stock level (except for transfers)
      if (movementType !== "TRANSFERENCIA") {
        await updateProduct(product.id, {
          stockAvailable: Math.max(0, newStockLevel),
          updatedAt: Date.now(),
        });
      }

      toast.success(
        `Movimiento de ${movementType.toLowerCase()} registrado exitosamente`
      );
      setIsOpen(false);
      resetForm();
      onMovementCreated?.();
    } catch (error) {
      console.error("Error creating movement:", error);
      toast.error("Error al registrar el movimiento");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Movimiento
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Registrar Movimiento de Stock - {product.name}
          </DialogTitle>
        </DialogHeader>

        {!movementType ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Selecciona el tipo de movimiento que quieres registrar:
            </p>
            <div className="grid grid-cols-1 gap-3">
              {movementTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.type}
                    onClick={() => setMovementType(type.type)}
                    className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 text-left transition-colors"
                  >
                    <Icon className={`h-5 w-5 ${type.color}`} />
                    <div>
                      <div className="font-medium">{type.label}</div>
                      <div className="text-sm text-muted-foreground">
                        {type.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Tipo:</span>
              <span className="font-medium">
                {movementTypes.find((t) => t.type === movementType)?.label}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setMovementType(null)}
              >
                Cambiar
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">
                  Cantidad{" "}
                  {movementType === "AJUSTE" ? "(nueva cantidad total)" : ""}
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="0"
                  required
                />
                {movementType !== "AJUSTE" && product.stockAvailable > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Stock actual: {product.stockAvailable}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">
                  {movementType === "TRANSFERENCIA"
                    ? "Ubicación origen"
                    : "Ubicación"}
                </Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Almacén principal"
                />
              </div>
            </div>

            {movementType === "TRANSFERENCIA" && (
              <div className="space-y-2">
                <Label htmlFor="toLocation">Ubicación destino *</Label>
                <Input
                  id="toLocation"
                  value={toLocation}
                  onChange={(e) => setToLocation(e.target.value)}
                  placeholder="Sucursal, almacén..."
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="reason">Motivo/Justificación *</Label>
              <Input
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={
                  movementType === "ENTRADA"
                    ? "Compra, recepción..."
                    : movementType === "SALIDA"
                    ? "Venta, entrega..."
                    : movementType === "AJUSTE"
                    ? "Error de conteo, corrección..."
                    : movementType === "MERMA"
                    ? "Daño, vencimiento, robo..."
                    : "Reorganización, cambio de sucursal..."
                }
                required
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? "Registrando..." : "Registrar Movimiento"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsOpen(false);
                  resetForm();
                }}
              >
                Cancelar
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
