"use client";

import { useEffect, useState } from "react";
import { StockMovement, StockMovementType } from "@/types/product";
import {
  getStockMovements,
  getStockMovementsByDateRange,
} from "@/lib/stock-movements";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  History,
  Filter,
  Download,
  Package,
  PackageMinus,
  Settings,
  AlertTriangle,
  ArrowRightLeft,
} from "lucide-react";
import { toast } from "sonner";

interface StockHistoryProps {
  productId?: string;
  productName?: string;
}

export function StockHistory({ productId, productName }: StockHistoryProps) {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [filterType, setFilterType] = useState<StockMovementType | "ALL">(
    "ALL"
  );
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [userFilter, setUserFilter] = useState("");

  const movementTypeConfig = {
    ENTRADA: {
      label: "Entrada",
      icon: Package,
      color: "text-green-600 bg-green-50",
      sign: "+",
    },
    SALIDA: {
      label: "Salida",
      icon: PackageMinus,
      color: "text-blue-600 bg-blue-50",
      sign: "-",
    },
    AJUSTE: {
      label: "Ajuste",
      icon: Settings,
      color: "text-orange-600 bg-orange-50",
      sign: "=",
    },
    MERMA: {
      label: "Merma",
      icon: AlertTriangle,
      color: "text-red-600 bg-red-50",
      sign: "-",
    },
    TRANSFERENCIA: {
      label: "Transferencia",
      icon: ArrowRightLeft,
      color: "text-purple-600 bg-purple-50",
      sign: "↔",
    },
  };

  useEffect(() => {
    if (isOpen) {
      loadMovements();
    }
  }, [isOpen, productId]);

  const loadMovements = async () => {
    setLoading(true);

    try {
      let data: StockMovement[];

      if (startDate && endDate) {
        data = await getStockMovementsByDateRange(
          new Date(startDate),
          new Date(endDate),
          productId
        );
      } else {
        data = await getStockMovements(productId, 100);
      }

      setMovements(data);
    } catch (error) {
      console.error("Error loading movements:", error);
      toast.error("Error al cargar el historial");
    } finally {
      setLoading(false);
    }
  };

  const filteredMovements = movements.filter((movement) => {
    if (filterType !== "ALL" && movement.type !== filterType) return false;
    if (
      userFilter &&
      !movement.userName.toLowerCase().includes(userFilter.toLowerCase())
    )
      return false;
    return true;
  });

  const exportToCSV = () => {
    const headers = [
      "Fecha",
      "Tipo",
      "Cantidad",
      "Motivo",
      "Usuario",
      "Ubicación",
      "Referencia",
    ];

    const csvData = [
      headers.join(","),
      ...filteredMovements.map((movement) =>
        [
          format(movement.createdAt, "dd/MM/yyyy HH:mm", { locale: es }),
          movement.type,
          movement.amount,
          `"${movement.reason}"`,
          movement.userName,
          movement.location || "",
          movement.referenceId || "",
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `historial-stock-${productName || "todos"}-${format(
      new Date(),
      "yyyy-MM-dd"
    )}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getMovementSummary = () => {
    const summary = filteredMovements.reduce((acc, movement) => {
      acc[movement.type] = (acc[movement.type] || 0) + 1;
      return acc;
    }, {} as Record<StockMovementType, number>);

    return summary;
  };

  const getTotalQuantityChange = () => {
    return filteredMovements.reduce((total, movement) => {
      return total + movement.amount;
    }, 0);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <History className="h-4 w-4" />
          {productName ? "Historial" : "Ver Historial"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Historial de Movimientos
            {productName && (
              <span className="text-sm font-normal text-muted-foreground">
                - {productName}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 flex-1 overflow-hidden">
          {/* Filters and Summary */}
          <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <Label htmlFor="type-filter">Tipo:</Label>
              <select
                id="type-filter"
                value={filterType}
                onChange={(e) =>
                  setFilterType(e.target.value as StockMovementType | "ALL")
                }
                className="border rounded px-2 py-1 text-sm"
              >
                <option value="ALL">Todos</option>
                {Object.entries(movementTypeConfig).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Label htmlFor="start-date">Desde:</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-auto"
              />
            </div>

            <div className="flex items-center gap-2">
              <Label htmlFor="end-date">Hasta:</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-auto"
              />
            </div>

            <div className="flex items-center gap-2">
              <Label htmlFor="user-filter">Usuario:</Label>
              <Input
                id="user-filter"
                placeholder="Filtrar por usuario..."
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                className="w-auto"
              />
            </div>

            <Button onClick={loadMovements} disabled={loading} size="sm">
              {loading ? "Cargando..." : "Filtrar"}
            </Button>

            <Button
              onClick={exportToCSV}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Exportar CSV
            </Button>
          </div>

          {/* Summary Cards */}
          {filteredMovements.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-sm text-blue-600 font-medium">
                  Total Movimientos
                </div>
                <div className="text-xl font-bold text-blue-900">
                  {filteredMovements.length}
                </div>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="text-sm text-green-600 font-medium">
                  Cambio Neto
                </div>
                <div
                  className={`text-xl font-bold ${
                    getTotalQuantityChange() >= 0
                      ? "text-green-900"
                      : "text-red-900"
                  }`}
                >
                  {getTotalQuantityChange() > 0 ? "+" : ""}
                  {getTotalQuantityChange()}
                </div>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg">
                <div className="text-sm text-orange-600 font-medium">
                  Período
                </div>
                <div className="text-sm font-medium text-orange-900">
                  {filteredMovements.length > 0 && (
                    <>
                      {format(
                        Math.min(...filteredMovements.map((m) => m.createdAt)),
                        "dd/MM/yy"
                      )}{" "}
                      -{" "}
                      {format(
                        Math.max(...filteredMovements.map((m) => m.createdAt)),
                        "dd/MM/yy"
                      )}
                    </>
                  )}
                </div>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <div className="text-sm text-purple-600 font-medium">
                  Usuarios Únicos
                </div>
                <div className="text-xl font-bold text-purple-900">
                  {new Set(filteredMovements.map((m) => m.userName)).size}
                </div>
              </div>
            </div>
          )}

          {/* Movements Table */}
          <div className="flex-1 overflow-auto border rounded-lg">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">
                Cargando historial...
              </div>
            ) : filteredMovements.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No se encontraron movimientos
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Cantidad</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Ubicación</TableHead>
                    <TableHead>Referencia</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMovements.map((movement) => {
                    const config = movementTypeConfig[movement.type];
                    const Icon = config.icon;

                    return (
                      <TableRow key={movement.id}>
                        <TableCell className="whitespace-nowrap">
                          {format(movement.createdAt, "dd/MM/yy HH:mm", {
                            locale: es,
                          })}
                        </TableCell>
                        <TableCell>
                          <div
                            className={`inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}
                          >
                            <Icon className="h-3 w-3" />
                            {config.label}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          <span
                            className={
                              movement.amount > 0
                                ? "text-green-600"
                                : "text-red-600"
                            }
                          >
                            {movement.amount > 0 ? "+" : ""}
                            {movement.amount}
                          </span>
                        </TableCell>
                        <TableCell
                          className="max-w-xs truncate"
                          title={movement.reason}
                        >
                          {movement.reason}
                        </TableCell>
                        <TableCell>{movement.userName}</TableCell>
                        <TableCell>{movement.location || "-"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {movement.referenceId || "-"}
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
