"use client";

import { useState, useEffect } from "react";
import { ProductTable } from "@/components/product-table";
import { Dashboard } from "@/components/dashboard";
import { AlertsWidget } from "@/components/alerts-widget";
import { SmartNotificationsCenter } from "@/components/smart-notifications-center";
import { NotificationSettings } from "@/components/notification-settings";
import { InventoryAudit } from "@/components/inventory-audit";
import { UserProfile } from "@/components/user-profile";
import { AuthWrapper } from "@/components/auth-wrapper";
import { useAuth } from "@/components/auth-provider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { getAllProductsWithAlerts } from "@/lib/products";
import { Product } from "@/types/product";
import {
  BarChart3,
  Package,
  Bell,
  BellRing,
  ClipboardCheck,
  Settings,
  LogOut,
  User,
} from "lucide-react";

export default function Home() {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (user) {
      loadProducts();
    }
  }, [user]);

  const loadProducts = async () => {
    try {
      const productsData = await getAllProductsWithAlerts();
      setProducts(productsData);
    } catch (error) {
      console.error("Error loading products:", error);
    }
  };

  const handleProductUpdate = (updatedProduct: Product) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
    );
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <AuthWrapper>
      <div className="space-y-6">
        {/* Header with user info and logout */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">
              Sistema de Control de Stock
            </h1>
            <p className="text-sm text-muted-foreground">
              Dashboard completo para gestión de inventario, productos y
              analytics.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>
                {user?.name || user?.email}
                {user?.company && (
                  <span className="text-xs ml-1">• {user.company}</span>
                )}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              Cerrar Sesión
            </Button>
          </div>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Productos
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="flex items-center gap-2"
            >
              <BellRing className="h-4 w-4" />
              Notificaciones
            </TabsTrigger>
            <TabsTrigger value="audit" className="flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4" />
              Auditorías
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configuración
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Perfil
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <Dashboard />
          </TabsContent>

          <TabsContent value="products">
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold tracking-tight">
                  Gestión de Productos
                </h2>
                <p className="text-sm text-muted-foreground">
                  Administra tu inventario, registra movimientos y gestiona
                  reservas.
                </p>
              </div>
              <ProductTable />
            </div>
          </TabsContent>

          <TabsContent value="notifications">
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold tracking-tight">
                  Centro de Notificaciones Inteligentes
                </h2>
                <p className="text-sm text-muted-foreground">
                  Sistema avanzado de alertas automáticas y notificaciones
                  personalizadas.
                </p>
              </div>
              <SmartNotificationsCenter />
            </div>
          </TabsContent>

          <TabsContent value="audit">
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold tracking-tight">
                  Sistema de Auditorías
                </h2>
                <p className="text-sm text-muted-foreground">
                  Realiza conteos físicos y ajusta diferencias de inventario.
                </p>
              </div>
              <InventoryAudit
                products={products}
                onProductUpdate={handleProductUpdate}
              />
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold tracking-tight">
                  Configuración de Notificaciones
                </h2>
                <p className="text-sm text-muted-foreground">
                  Personaliza umbrales y tipos de alertas para cada producto.
                </p>
              </div>
              <NotificationSettings
                products={products}
                onProductUpdate={handleProductUpdate}
              />
            </div>
          </TabsContent>

          <TabsContent value="profile">
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold tracking-tight">
                  Perfil de Usuario
                </h2>
                <p className="text-sm text-muted-foreground">
                  Gestiona tu información personal y configuración de cuenta.
                </p>
              </div>
              <UserProfile />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AuthWrapper>
  );
}
