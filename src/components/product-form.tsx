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
    costPrice: z.coerce.number().min(0),
    listPrice: z.coerce.number().min(0),
    listPrice2: z.coerce.number().min(0),
    unitPrice: z.coerce.number().min(0),
    minStock: z.coerce.number().int().min(0).optional(),
    maxStock: z.coerce.number().int().min(0).optional(),
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
  )
  .refine(
    (data) => {
      return (
        data.costPrice <= data.listPrice && data.costPrice <= data.listPrice2
      );
    },
    {
      message:
        "El precio de costo debe ser menor o igual a los precios de lista",
      path: ["costPrice"],
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
          costPrice: product.costPrice,
          listPrice: product.listPrice,
          listPrice2: product.listPrice2,
          unitPrice: product.unitPrice,
          minStock: product.minStock || undefined,
          maxStock: product.maxStock || undefined,
        }
      : undefined,
  });

  async function onSubmit(values: FormValues) {
    try {
      if (product) {
        await updateProduct(product.id, values);
        toast.success("Producto actualizado");
        onCreated?.({
          ...product,
          ...values,
          id: product.id,
        } as Product);
      } else {
        const created = await createProduct(values);
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
          <Label htmlFor="costPrice">Precio de Costo</Label>
          <Input
            id="costPrice"
            type="number"
            step="0.01"
            inputMode="decimal"
            placeholder="0.00"
            {...register("costPrice")}
          />
          {errors.costPrice && (
            <p className="text-xs text-red-500">{errors.costPrice.message}</p>
          )}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="listPrice">Precio de Lista</Label>
          <Input
            id="listPrice"
            type="number"
            step="0.01"
            inputMode="decimal"
            placeholder="0.00"
            {...register("listPrice")}
          />
          {errors.listPrice && (
            <p className="text-xs text-red-500">{errors.listPrice.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="listPrice2">Precio Lista 2</Label>
          <Input
            id="listPrice2"
            type="number"
            step="0.01"
            inputMode="decimal"
            placeholder="0.00"
            {...register("listPrice2")}
          />
          {errors.listPrice2 && (
            <p className="text-xs text-red-500">{errors.listPrice2.message}</p>
          )}
          <p className="text-xs text-muted-foreground">Precio con descuento</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="unitPrice">Precio de Venta</Label>
          <Input
            id="unitPrice"
            type="number"
            step="0.01"
            inputMode="decimal"
            placeholder="0.00"
            {...register("unitPrice")}
          />
          {errors.unitPrice && (
            <p className="text-xs text-red-500">{errors.unitPrice.message}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Precio actual de venta
          </p>
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
      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" disabled={isSubmitting}>
          {product ? "Guardar" : "Agregar"}
        </Button>
      </div>
    </form>
  );
}
