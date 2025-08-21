"use client";

import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createProduct, updateProduct } from "@/lib/products";
import { toast } from "sonner";
import { Product } from "@/types/product";

const schema = z
  .object({
    name: z.string().min(1, "Requerido"),
    brand: z.string().min(1, "Requerido"),
    quantity: z.coerce.number().int().min(0),
    unitPrice: z.coerce.number().min(0),
    minStock: z.coerce.number().int().min(0).optional(),
    maxStock: z.coerce.number().int().min(0).optional(),
    expirationDate: z.string().optional(),
    lotNumber: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.minStock && data.maxStock) {
        return data.minStock <= data.maxStock;
      }
      return true;
    },
    {
      message: "El stock mínimo debe ser menor o igual al stock máximo",
      path: ["maxStock"],
    }
  );

type FormValues = z.infer<typeof schema>;

export function ProductForm({
  onCreated,
  product,
}: {
  onCreated?: (p: Product) => void;
  product?: Product | null;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: product
      ? {
          name: product.name,
          brand: product.brand,
          quantity: product.quantity,
          unitPrice: product.unitPrice,
          minStock: product.minStock || undefined,
          maxStock: product.maxStock || undefined,
          expirationDate: product.expirationDate
            ? new Date(product.expirationDate).toISOString().split("T")[0]
            : undefined,
          lotNumber: product.lotNumber || undefined,
        }
      : undefined,
  });

  async function onSubmit(values: FormValues) {
    try {
      // Convert date string to timestamp if provided
      const processedValues = {
        ...values,
        expirationDate: values.expirationDate
          ? new Date(values.expirationDate).getTime()
          : undefined,
      };

      if (product) {
        await updateProduct(product.id, processedValues);
        toast.success("Producto actualizado");
        onCreated?.({
          ...product,
          ...processedValues,
          id: product.id,
        } as Product);
      } else {
        const created = await createProduct(processedValues);
        toast.success("Producto creado");
        onCreated?.(created);
        reset();
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "Error";
      toast.error(message);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="name">Producto</Label>
          <Input id="name" placeholder="Nombre" {...register("name")} />
          {errors.name && (
            <p className="text-xs text-red-500">{errors.name.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="brand">Marca</Label>
          <Input id="brand" placeholder="Marca" {...register("brand")} />
          {errors.brand && (
            <p className="text-xs text-red-500">{errors.brand.message}</p>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="quantity">Cantidad</Label>
          <Input
            id="quantity"
            type="number"
            inputMode="numeric"
            {...register("quantity")}
          />
          {errors.quantity && (
            <p className="text-xs text-red-500">{errors.quantity.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="unitPrice">Precio por unidad</Label>
          <Input
            id="unitPrice"
            type="number"
            step="0.01"
            inputMode="decimal"
            {...register("unitPrice")}
          />
          {errors.unitPrice && (
            <p className="text-xs text-red-500">{errors.unitPrice.message}</p>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="minStock">Stock mínimo (opcional)</Label>
          <Input
            id="minStock"
            type="number"
            inputMode="numeric"
            placeholder="0"
            {...register("minStock")}
          />
          {errors.minStock && (
            <p className="text-xs text-red-500">{errors.minStock.message}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Alerta cuando el stock esté por debajo de este valor
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="maxStock">Stock máximo (opcional)</Label>
          <Input
            id="maxStock"
            type="number"
            inputMode="numeric"
            placeholder="0"
            {...register("maxStock")}
          />
          {errors.maxStock && (
            <p className="text-xs text-red-500">{errors.maxStock.message}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Alerta cuando el stock supere este valor
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="expirationDate">
            Fecha de Vencimiento (opcional)
          </Label>
          <Input
            id="expirationDate"
            type="date"
            {...register("expirationDate")}
          />
          {errors.expirationDate && (
            <p className="text-xs text-red-500">
              {errors.expirationDate.message}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Para productos perecederos
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lotNumber">Número de Lote (opcional)</Label>
          <Input
            id="lotNumber"
            placeholder="LOT001"
            {...register("lotNumber")}
          />
          {errors.lotNumber && (
            <p className="text-xs text-red-500">{errors.lotNumber.message}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Para trazabilidad de productos
          </p>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" disabled={isSubmitting}>
          {product ? "Guardar" : "Agregar"}
        </Button>
      </div>
    </form>
  );
}
