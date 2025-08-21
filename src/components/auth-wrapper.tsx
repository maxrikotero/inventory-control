"use client";

import { useState } from "react";
import { LoginForm } from "@/components/login-form";
import { SignUpForm } from "@/components/signup-form";
import { useAuth } from "@/components/auth-provider";
import { Package, TrendingUp, Users, Shield } from "lucide-react";

export function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="flex">
          {/* Left side - Branding and Features */}
          <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-12 flex-col justify-center">
            <div className="max-w-md">
              <div className="flex items-center gap-3 mb-8">
                <Package className="h-10 w-10" />
                <h1 className="text-3xl font-bold">InventoryPro</h1>
              </div>

              <h2 className="text-2xl font-bold mb-4">
                Gestiona tu inventario como un profesional
              </h2>

              <p className="text-lg text-blue-100 mb-8">
                Sistema completo de control de stock con notificaciones
                inteligentes, analytics avanzados y auditorías automáticas.
              </p>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="bg-blue-500 p-2 rounded-lg">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Analytics Avanzados</h3>
                    <p className="text-blue-100 text-sm">
                      Dashboard completo con métricas en tiempo real y reportes
                      detallados
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-blue-500 p-2 rounded-lg">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Multi-usuario</h3>
                    <p className="text-blue-100 text-sm">
                      Cada usuario tiene su propio inventario independiente y
                      seguro
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-blue-500 p-2 rounded-lg">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">
                      Notificaciones Inteligentes
                    </h3>
                    <p className="text-blue-100 text-sm">
                      Alertas automáticas para stock bajo, vencimientos y
                      auditorías
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-12 p-4 bg-blue-500/20 rounded-lg">
                <p className="text-sm text-blue-100">
                  <strong>¡Prueba gratuita de 30 días!</strong>
                  <br />
                  Sin compromiso, sin tarjeta de crédito requerida.
                </p>
              </div>
            </div>
          </div>

          {/* Right side - Auth Form */}
          <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
            <div className="w-full max-w-md">
              {/* Mobile branding */}
              <div className="lg:hidden text-center mb-8">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <Package className="h-8 w-8 text-blue-600" />
                  <h1 className="text-2xl font-bold text-gray-900">
                    InventoryPro
                  </h1>
                </div>
                <p className="text-gray-600">
                  Sistema profesional de gestión de inventario
                </p>
              </div>

              {authMode === "login" ? (
                <LoginForm onSwitchToSignUp={() => setAuthMode("signup")} />
              ) : (
                <SignUpForm
                  onSuccess={() => {
                    // User is automatically logged in after successful signup
                  }}
                  onSwitchToLogin={() => setAuthMode("login")}
                />
              )}

              {/* Features for mobile */}
              <div className="lg:hidden mt-8 text-center text-sm text-gray-600">
                <p>
                  ✓ Dashboard completo • ✓ Notificaciones inteligentes • ✓
                  Reportes avanzados
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
