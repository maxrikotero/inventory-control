"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/auth-provider";
import {
  updateUserProfile,
  getUserSubscription,
  getTrialDaysRemaining,
} from "@/lib/auth-service";
import { UserProfile as UserProfileType } from "@/types/user";
import { toast } from "sonner";
import {
  User,
  Mail,
  Building,
  Phone,
  Calendar,
  Crown,
  Shield,
  CheckCircle,
  Clock,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const profileSchema = z.object({
  firstName: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  lastName: z.string().min(2, "El apellido debe tener al menos 2 caracteres"),
  company: z.string().optional(),
  industry: z.string().optional(),
  phone: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export function UserProfile() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      company: user?.company || "",
      industry: user?.industry || "",
      phone: user?.phone || "",
    },
  });

  if (!user) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">
            Debes estar autenticado para ver tu perfil
          </p>
        </CardContent>
      </Card>
    );
  }

  const subscription = getUserSubscription(user);
  const trialDaysRemaining = getTrialDaysRemaining(user);

  const onSubmit = async (data: ProfileFormData) => {
    setIsLoading(true);
    try {
      const profileUpdate: Partial<UserProfileType> = {
        firstName: data.firstName,
        lastName: data.lastName,
        company: data.company,
        industry: data.industry,
        phone: data.phone,
        name: `${data.firstName} ${data.lastName}`,
      };

      const result = await updateUserProfile(user.id, profileUpdate);

      if (result.success) {
        toast.success("Perfil actualizado exitosamente");
      } else {
        toast.error(result.error || "Error al actualizar el perfil");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Error inesperado al actualizar el perfil");
    } finally {
      setIsLoading(false);
    }
  };

  const getPlanBadge = (plan: string) => {
    const config = {
      free: { label: "Gratuito", color: "bg-gray-100 text-gray-800" },
      basic: { label: "Básico", color: "bg-blue-100 text-blue-800" },
      premium: { label: "Premium", color: "bg-purple-100 text-purple-800" },
      enterprise: { label: "Enterprise", color: "bg-gold-100 text-gold-800" },
    };
    const planConfig = config[plan as keyof typeof config] || config.free;

    return (
      <Badge className={planConfig.color}>
        {plan === "premium" || plan === "enterprise" ? (
          <Crown className="h-3 w-3 mr-1" />
        ) : null}
        {planConfig.label}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const config = {
      active: {
        label: "Activa",
        color: "bg-green-100 text-green-800",
        icon: CheckCircle,
      },
      trial: {
        label: "Prueba",
        color: "bg-yellow-100 text-yellow-800",
        icon: Clock,
      },
      inactive: {
        label: "Inactiva",
        color: "bg-red-100 text-red-800",
        icon: Shield,
      },
      cancelled: {
        label: "Cancelada",
        color: "bg-gray-100 text-gray-800",
        icon: Shield,
      },
    };
    const statusConfig =
      config[status as keyof typeof config] || config.inactive;
    const Icon = statusConfig.icon;

    return (
      <Badge className={statusConfig.color}>
        <Icon className="h-3 w-3 mr-1" />
        {statusConfig.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Account Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Información Personal
            </CardTitle>
            <CardDescription>
              Actualiza tu información personal y de contacto
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Nombre</Label>
                  <Input
                    id="firstName"
                    {...register("firstName")}
                    placeholder="Tu nombre"
                  />
                  {errors.firstName && (
                    <p className="text-sm text-red-500">
                      {errors.firstName.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Apellido</Label>
                  <Input
                    id="lastName"
                    {...register("lastName")}
                    placeholder="Tu apellido"
                  />
                  {errors.lastName && (
                    <p className="text-sm text-red-500">
                      {errors.lastName.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={user.email}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-xs text-muted-foreground">
                  El email no se puede cambiar
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company">Empresa</Label>
                  <Input
                    id="company"
                    {...register("company")}
                    placeholder="Nombre de tu empresa"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="industry">Industria</Label>
                  <select
                    id="industry"
                    {...register("industry")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccionar industria</option>
                    <option value="retail">Retail / Comercio</option>
                    <option value="manufacturing">Manufactura</option>
                    <option value="food">Alimentos y Bebidas</option>
                    <option value="pharmacy">Farmacia</option>
                    <option value="automotive">Automotriz</option>
                    <option value="electronics">Electrónicos</option>
                    <option value="clothing">Ropa y Textiles</option>
                    <option value="construction">Construcción</option>
                    <option value="other">Otro</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  type="tel"
                  {...register("phone")}
                  placeholder="+1 234 567 8900"
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting || isLoading}
                className="gap-2"
              >
                {isLoading ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Subscription Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5" />
              Suscripción
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Plan Actual:
              </span>
              {getPlanBadge(subscription.plan)}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Estado:</span>
              {getStatusBadge(subscription.status)}
            </div>

            {subscription.status === "trial" && trialDaysRemaining > 0 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm font-medium text-yellow-800">
                  Prueba gratuita
                </p>
                <p className="text-xs text-yellow-700">
                  {trialDaysRemaining} días restantes
                </p>
              </div>
            )}

            <div className="space-y-2">
              <p className="text-sm font-medium">Funciones incluidas:</p>
              <div className="space-y-1">
                {subscription.features.map((feature: string, index: number) => (
                  <div key={index} className="flex items-center gap-2 text-xs">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span className="capitalize">
                      {feature.replace(/_/g, " ")}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {subscription.plan === "free" && (
              <Button variant="outline" className="w-full" size="sm">
                Actualizar Plan
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Account Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Información de la Cuenta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">
                Cuenta creada
              </div>
              <div className="font-medium">
                {format(user.createdAt, "dd/MM/yyyy", { locale: es })}
              </div>
            </div>

            <div className="text-center p-4 border rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">
                Última actualización
              </div>
              <div className="font-medium">
                {format(user.updatedAt, "dd/MM/yyyy", { locale: es })}
              </div>
            </div>

            <div className="text-center p-4 border rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">
                ID de Usuario
              </div>
              <div className="font-mono text-xs">{user.id}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
