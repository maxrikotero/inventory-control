"use client";

import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/components/auth-provider";
import { toast } from "sonner";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";

const schema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(4, "Mínimo 4 caracteres"),
});

type FormValues = z.infer<typeof schema>;

interface LoginFormProps {
  onSwitchToSignUp?: () => void;
}

export function LoginForm({ onSwitchToSignUp }: LoginFormProps) {
  const { signIn, loading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    try {
      const result = await signIn(values.email, values.password);
      if (result.success) {
        toast.success("¡Bienvenido de vuelta!");
      } else {
        toast.error(result.error || "Error al iniciar sesión");
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "Error inesperado";
      toast.error(message);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Iniciar Sesión</CardTitle>
        <CardDescription>
          Accede a tu sistema de gestión de inventario
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                className="pl-10"
                {...register("email")}
              />
            </div>
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="pl-10 pr-10"
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="remember" className="rounded" />
              <Label htmlFor="remember">Recordarme</Label>
            </div>
            <button
              type="button"
              className="text-blue-600 hover:underline"
              onClick={() => toast.info("Función no implementada aún")}
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          <Button className="w-full" disabled={isSubmitting || loading}>
            {loading ? "Iniciando..." : "Iniciar Sesión"}
          </Button>

          {/* Demo credentials */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Credenciales de demostración:
            </p>
            <div className="text-xs text-gray-600 space-y-1">
              <p>Email: demo@inventario.com</p>
              <p>Contraseña: demo123</p>
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              ¿No tienes una cuenta?{" "}
              <button
                type="button"
                onClick={onSwitchToSignUp}
                className="text-blue-600 hover:underline font-medium"
              >
                Regístrate gratis
              </button>
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
