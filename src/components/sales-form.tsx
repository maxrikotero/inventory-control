"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Plus,
  Trash2,
  Calculator,
  User,
  Package,
  Save,
  X,
  Brain,
} from "lucide-react";
import { toast } from "sonner";
import { NewSaleInput, Customer } from "@/types/sales";
import { Product } from "@/types/product";
import { createSale, calculateSaleTotal } from "@/lib/sales";
import { listProducts } from "@/lib/products";
import { listCustomers, searchCustomers } from "@/lib/customers";
import {
  recommendationEngine,
  ProductRecommendation,
} from "@/lib/ai/recommendation-engine";
import { AIInsightsPanel } from "./ai-insights-panel";

// Form validation schema
const saleItemSchema = z.object({
  productId: z.string().min(1, "Selecciona un producto"),
  productName: z.string().min(1, "Nombre del producto requerido"),
  quantity: z.number().min(1, "Cantidad debe ser mayor a 0"),
  unitPrice: z.number().min(0, "Precio debe ser mayor o igual a 0"),
  discount: z.number().min(0).optional(),
});

const saleFormSchema = z.object({
  customerId: z.string().optional(),
  customerName: z.string().min(1, "Nombre del cliente es requerido"),
  customerEmail: z.string().email().optional().or(z.literal("")),
  customerPhone: z.string().optional(),
  items: z.array(saleItemSchema).min(1, "Agrega al menos un producto"),
  paymentMethod: z.enum([
    "EFECTIVO",
    "TARJETA_CREDITO",
    "TARJETA_DEBITO",
    "TRANSFERENCIA",
    "CHEQUE",
    "CREDITO",
    "OTRO",
  ]),
  notes: z.string().optional(),
  discount: z.number().min(0).optional(),
  tax: z.number().min(0).optional(),
});

type SaleFormData = z.infer<typeof saleFormSchema>;

interface SalesFormProps {
  onSaleCreated?: (saleId: string) => void;
  onCancel?: () => void;
  initialCustomer?: Customer;
}

export function SalesForm({
  onSaleCreated,
  onCancel,
  initialCustomer,
}: SalesFormProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAIInsights, setShowAIInsights] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState<
    ProductRecommendation[]
  >([]);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<SaleFormData>({
    resolver: zodResolver(saleFormSchema),
    defaultValues: {
      customerName: initialCustomer?.name || "",
      customerEmail: initialCustomer?.email || "",
      customerPhone: initialCustomer?.phone || "",
      customerId: initialCustomer?.id || "",
      items: [{ productId: "", productName: "", quantity: 1, unitPrice: 0 }],
      paymentMethod: "EFECTIVO",
      discount: 0,
      tax: 0,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const watchedItems = watch("items");
  const watchedDiscount = watch("discount") || 0;
  const watchedTax = watch("tax") || 0;
  const watchedCustomerId = watch("customerId");

  // Calculate totals
  const subtotal = watchedItems.reduce((sum, item) => {
    const itemTotal = item.quantity * item.unitPrice;
    const itemDiscount = item.discount || 0;
    return sum + (itemTotal - itemDiscount);
  }, 0);

  const total = calculateSaleTotal(watchedItems, watchedDiscount, watchedTax);

  useEffect(() => {
    loadProducts();
    loadCustomers();
  }, []);

  const loadAIRecommendations = useCallback(async () => {
    try {
      const currentProducts = watchedItems
        .filter((item) => item.productId)
        .map((item) => item.productId);

      if (currentProducts.length > 0) {
        const recommendations = await recommendationEngine.getRecommendations(
          {
            currentProducts,
            customerId: watchedCustomerId,
          },
          5
        );
        setAiRecommendations(recommendations);
      }
    } catch (error) {
      console.error("Error loading AI recommendations:", error);
    }
  }, [watchedItems, watchedCustomerId]);

  // Load AI recommendations when items or customer changes
  useEffect(() => {
    if (watchedItems.length > 0) {
      loadAIRecommendations();
    }
  }, [watchedItems, watchedCustomerId, loadAIRecommendations]);

  const loadProducts = async () => {
    try {
      const productsData = await listProducts();
      setProducts(productsData);
    } catch (error) {
      console.error("Error loading products:", error);
      toast.error("Error al cargar productos");
    }
  };

  const loadCustomers = async () => {
    try {
      await listCustomers();
    } catch (error) {
      console.error("Error loading customers:", error);
    }
  };

  const handleCustomerSearch = async (searchTerm: string) => {
    if (searchTerm.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const results = await searchCustomers(searchTerm);
      setSearchResults(results);
    } catch (error) {
      console.error("Error searching customers:", error);
    }
  };

  const selectCustomer = (customer: Customer) => {
    setValue("customerId", customer.id);
    setValue("customerName", customer.name);
    setValue("customerEmail", customer.email || "");
    setValue("customerPhone", customer.phone || "");
    setSearchResults([]);
  };

  const selectProduct = (index: number, product: Product) => {
    setValue(`items.${index}.productId`, product.id);
    setValue(`items.${index}.productName`, product.name);
    setValue(`items.${index}.unitPrice`, product.unitPrice);
  };

  const addRecommendedProduct = (recommendation: ProductRecommendation) => {
    const product = products.find((p) => p.id === recommendation.productId);
    if (product) {
      append({
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unitPrice: product.unitPrice,
        discount: 0,
      });
    }
  };

  const addItem = () => {
    append({ productId: "", productName: "", quantity: 1, unitPrice: 0 });
  };

  const removeItem = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  const onSubmit = async (data: SaleFormData) => {
    setIsSubmitting(true);
    try {
      const saleInput: NewSaleInput = {
        customerId: data.customerId || undefined,
        customerName: data.customerName,
        customerEmail: data.customerEmail || undefined,
        customerPhone: data.customerPhone || undefined,
        items: data.items.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount || 0,
        })),
        paymentMethod: data.paymentMethod,
        notes: data.notes || undefined,
        discount: data.discount || 0,
        tax: data.tax || 0,
      };

      const sale = await createSale(saleInput);
      toast.success("Venta creada exitosamente");
      reset();
      onSaleCreated?.(sale.id);
    } catch (error) {
      console.error("Error creating sale:", error);
      toast.error("Error al crear la venta");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Nueva Venta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Customer Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <Label className="text-sm font-medium">
                  Información del Cliente
                </Label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customerName">Nombre del Cliente *</Label>
                  <Input
                    id="customerName"
                    {...register("customerName")}
                    placeholder="Nombre completo del cliente"
                    onChange={(e) => {
                      register("customerName").onChange(e);
                      handleCustomerSearch(e.target.value);
                    }}
                  />
                  {errors.customerName && (
                    <p className="text-sm text-red-600">
                      {errors.customerName.message}
                    </p>
                  )}

                  {/* Customer search results */}
                  {searchResults.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto">
                      {searchResults.map((customer) => (
                        <div
                          key={customer.id}
                          className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                          onClick={() => selectCustomer(customer)}
                        >
                          <div className="font-medium">{customer.name}</div>
                          <div className="text-sm text-gray-600">
                            {customer.email || customer.phone || "Sin contacto"}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customerEmail">Email</Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    {...register("customerEmail")}
                    placeholder="email@ejemplo.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customerPhone">Teléfono</Label>
                  <Input
                    id="customerPhone"
                    {...register("customerPhone")}
                    placeholder="+1 234 567 8900"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">Método de Pago *</Label>
                  <select
                    id="paymentMethod"
                    {...register("paymentMethod")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="EFECTIVO">Efectivo</option>
                    <option value="TARJETA_CREDITO">Tarjeta de Crédito</option>
                    <option value="TARJETA_DEBITO">Tarjeta de Débito</option>
                    <option value="TRANSFERENCIA">Transferencia</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="CREDITO">Crédito</option>
                    <option value="OTRO">Otro</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Products */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  <Label className="text-sm font-medium">Productos</Label>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addItem}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Agregar Producto
                </Button>
              </div>

              <div className="space-y-3">
                {fields.map((field, index) => (
                  <Card key={field.id} className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
                      <div className="md:col-span-2 space-y-2">
                        <Label>Producto *</Label>
                        <select
                          {...register(`items.${index}.productId`)}
                          onChange={(e) => {
                            const product = products.find(
                              (p) => p.id === e.target.value
                            );
                            if (product) {
                              selectProduct(index, product);
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Seleccionar producto</option>
                          {products.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.name} - Stock: {product.stockAvailable}
                            </option>
                          ))}
                        </select>
                        {errors.items?.[index]?.productId && (
                          <p className="text-sm text-red-600">
                            {errors.items[index]?.productId?.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>Cantidad *</Label>
                        <Input
                          type="number"
                          min="1"
                          {...register(`items.${index}.quantity`, {
                            valueAsNumber: true,
                          })}
                        />
                        {errors.items?.[index]?.quantity && (
                          <p className="text-sm text-red-600">
                            {errors.items[index]?.quantity?.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>Precio Unit. *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          {...register(`items.${index}.unitPrice`, {
                            valueAsNumber: true,
                          })}
                        />
                        {errors.items?.[index]?.unitPrice && (
                          <p className="text-sm text-red-600">
                            {errors.items[index]?.unitPrice?.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>Descuento</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          {...register(`items.${index}.discount`, {
                            valueAsNumber: true,
                          })}
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeItem(index)}
                          disabled={fields.length === 1}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Totals */}
            <Card className="p-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  <Label className="text-sm font-medium">Totales</Label>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Descuento General</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      {...register("discount", { valueAsNumber: true })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Impuestos</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      {...register("tax", { valueAsNumber: true })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Subtotal</Label>
                    <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
                      ${subtotal.toFixed(2)}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Total</Label>
                    <div className="px-3 py-2 bg-blue-50 border border-blue-200 rounded-md font-semibold text-blue-900">
                      ${total.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <textarea
                id="notes"
                {...register("notes")}
                placeholder="Notas adicionales sobre la venta..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>

            {/* AI Recommendations */}
            {aiRecommendations.length > 0 && (
              <Card className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Brain className="h-4 w-4 text-blue-600" />
                    <Label className="text-sm font-medium">
                      Recomendaciones de IA
                    </Label>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {aiRecommendations.map((rec, index) => (
                      <div
                        key={index}
                        className="p-2 border rounded-lg hover:bg-gray-50 cursor-pointer"
                        onClick={() => addRecommendedProduct(rec)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">
                              {rec.productName}
                            </p>
                            <p className="text-xs text-gray-600">
                              {rec.reason}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-green-600">
                              ${rec.expectedValue.toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {Math.round(rec.confidence * 100)}% confianza
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {/* Actions */}
            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAIInsights(!showAIInsights)}
                className="gap-2"
              >
                <Brain className="h-4 w-4" />
                {showAIInsights ? "Ocultar IA" : "Ver Insights IA"}
              </Button>

              <div className="flex gap-3">
                {onCancel && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    className="gap-2"
                  >
                    <X className="h-4 w-4" />
                    Cancelar
                  </Button>
                )}
                <Button type="submit" disabled={isSubmitting} className="gap-2">
                  <Save className="h-4 w-4" />
                  {isSubmitting ? "Creando..." : "Crear Venta"}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* AI Insights Panel */}
      {showAIInsights && (
        <AIInsightsPanel
          selectedProducts={watchedItems
            .filter((item) => item.productId)
            .map((item) => item.productId)}
          selectedCustomer={watchedCustomerId}
          onRecommendationClick={(productId) => {
            const product = products.find((p) => p.id === productId);
            if (product) {
              addRecommendedProduct({
                productId: product.id,
                productName: product.name,
                confidence: 0.8,
                reason: "Recomendado por IA",
                type: "CROSS_SELL",
                expectedValue: product.unitPrice,
              });
            }
          }}
        />
      )}
    </div>
  );
}
