# 📦 Sistema de Control de Stock - InventoryPro

Sistema profesional de gestión de inventario con notificaciones inteligentes, analytics avanzados y gestión multi-usuario.

## 🚀 Demo en Vivo

**Credenciales de Demo:**

- Email: `demo@inventario.com`
- Contraseña: `demo123`

## ✨ Características Principales

### 🔐 Sistema de Autenticación Completo

- Registro de nuevos usuarios con validación avanzada
- Login seguro con hash de contraseñas
- Gestión de sesiones y perfiles de usuario
- Sistema multi-tenant (cada usuario tiene su inventario independiente)

### 📊 Dashboard y Analytics

- Panel principal con métricas clave en tiempo real
- Gráficos de tendencias de stock y movimientos
- Valor total del inventario y productos más activos
- Reportes de inventario por categoría

### 🔔 Notificaciones Inteligentes

- Alertas automáticas para stock bajo y productos agotados
- Notificaciones de productos próximos a vencer
- Alertas de productos inactivos sin movimientos
- Diferencias detectadas en auditorías de inventario

### 📋 Sistema de Auditorías

- Conteo físico vs. sistema con cálculo automático de diferencias
- Historial completo de auditorías con fechas y usuarios
- Ajuste automático de stock después de auditorías
- Seguimiento de productos sin auditar

### 📦 Gestión Avanzada de Products

- CRUD completo de productos con validaciones
- Control de stock mínimo y máximo por producto
- Fechas de vencimiento y números de lote
- Reservas de stock para pedidos pendientes

### 📈 Movimientos de Stock Detallados

- 5 tipos de movimientos: Entrada, Salida, Ajuste, Merma, Transferencia
- Historial completo con fecha, usuario, motivo y cantidad
- Filtros avanzados por tipo, fecha y usuario
- Exportación a CSV de movimientos

### ⚙️ Configuración Personalizable

- Umbrales de alertas personalizables por producto
- Configuración de días de inactividad
- Días de aviso antes del vencimiento
- Activación/desactivación de tipos de alertas

## 🛠️ Tecnologías Utilizadas

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS, Shadcn UI
- **State Management**: React Hooks, Context API
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts para visualización de datos
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Notifications**: Sonner
- **Date Management**: date-fns
- **Database**: Firebase Firestore (con fallback a localStorage)

## 🏃‍♂️ Inicio Rápido

### Prerrequisitos

- Node.js 18+
- npm o yarn

### Instalación

```bash
# Clonar el repositorio
git clone [tu-repo-url]
cd stock-control

# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

### Variables de Entorno

Copia `env.example` a `.env.local`:

```bash
cp env.example .env.local
```

Por defecto usa datos mock. Para producción con Firebase, configura las variables de Firebase.

## 🚀 Despliegue en Vercel

### Opción 1: Despliegue Automático (Recomendado)

1. Conecta tu repositorio en [vercel.com](https://vercel.com)
2. Configura la variable de entorno: `NEXT_PUBLIC_USE_MOCK=true`
3. ¡Deploy automático!

### Opción 2: CLI

```bash
# Instalar Vercel CLI
npm install -g vercel

# Desplegar
vercel --prod
```

### Opción 3: Script Automatizado

```bash
# Usar el script incluido
./scripts/deploy-vercel.sh
```

Ver [DEPLOYMENT.md](./DEPLOYMENT.md) para guía detallada.

## 📱 Funcionalidades por Pestaña

### 🏠 Dashboard

- Métricas en tiempo real
- Gráficos de tendencias
- Alertas resumidas
- Salud del inventario

### 📦 Productos

- Lista completa con filtros
- Indicadores visuales de stock
- Acciones rápidas (editar, movimientos, auditorías)
- Importar/Exportar CSV

### 🔔 Notificaciones

- Centro de notificaciones inteligentes
- Filtros por tipo y prioridad
- Confirmación de alertas
- Estadísticas de notificaciones

### 📋 Auditorías

- Conteo físico vs. sistema
- Historial de auditorías
- Estadísticas de exactitud
- Productos pendientes de auditar

### ⚙️ Configuración

- Umbrales personalizables
- Tipos de alertas por producto
- Configuración de vencimientos
- Estados de configuración

### 👤 Perfil

- Información personal y empresarial
- Estado de suscripción
- Funciones incluidas
- Estadísticas de cuenta

## 🔒 Autenticación y Seguridad

- Hash de contraseñas con salt
- Validación de email y formato
- Sesiones persistentes seguras
- Segregación total de datos por usuario
- Logout con limpieza completa de datos

## 📊 Métricas y Analytics

- Valor total del inventario
- Productos con stock bajo/alto
- Movimientos por período
- Productos más activos
- Tendencias de stock
- Salud general del inventario

## 🎯 Casos de Uso Ideales

- **Pequeñas y medianas empresas** con inventario de 100-10,000 productos
- **Tiendas retail** con múltiples categorías
- **Restaurantes** con ingredientes y productos perecederos
- **Farmacias** con control de lotes y vencimientos
- **Talleres** con repuestos y consumibles
- **E-commerce** con control de stock y reservas

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 🎉 Demo y Soporte

- **Demo Live**: [Tu URL de Vercel]
- **Documentación**: Ver archivos en `/docs`
- **Issues**: Usa GitHub Issues para reportar bugs
- **Features**: Sugiere nuevas características via Issues

---

Desarrollado con ❤️ usando Next.js y Vercel
