# 🚀 Guía de Despliegue en Vercel

Esta guía te mostrará cómo desplegar tu aplicación de Stock Control en Vercel completamente gratis.

## 📋 Prerrequisitos

1. Cuenta de GitHub con tu código subido
2. Cuenta gratuita de Vercel (registrate en [vercel.com](https://vercel.com))

## 🎯 Opción 1: Despliegue Automático (Recomendado)

### Paso 1: Conectar con Vercel

1. Ve a [vercel.com](https://vercel.com) e inicia sesión con GitHub
2. Haz clic en "Add New Project"
3. Selecciona tu repositorio `stock-control`
4. Haz clic en "Import"

### Paso 2: Configurar el Proyecto

Vercel detectará automáticamente que es un proyecto Next.js. Configura:

- **Project Name**: `stock-control` (o el nombre que prefieras)
- **Framework Preset**: Next.js (detectado automáticamente)
- **Root Directory**: `./` (raíz del proyecto)
- **Build Command**: `npm run build` (automático)
- **Output Directory**: `.next` (automático)
- **Install Command**: `npm install` (automático)

### Paso 3: Variables de Entorno

En la sección "Environment Variables", agrega:

```
NEXT_PUBLIC_USE_MOCK = true
```

### Paso 4: Desplegar

1. Haz clic en "Deploy"
2. Vercel construirá y desplegará tu aplicación automáticamente
3. ¡Tu aplicación estará lista en 1-2 minutos!

## 🔄 Opción 2: GitHub Actions (Automático)

Ya tienes configurado GitHub Actions. Solo necesitas configurar los secrets:

### Configurar Secrets en GitHub

1. Ve a tu repositorio en GitHub
2. Settings > Secrets and variables > Actions
3. Agrega estos secrets:

```bash
VERCEL_TOKEN=tu_token_de_vercel
ORG_ID=tu_org_id_de_vercel
PROJECT_ID=tu_project_id_de_vercel
```

### Obtener los valores:

1. **VERCEL_TOKEN**:

   - Ve a Vercel Dashboard > Settings > Tokens
   - Crea un nuevo token

2. **ORG_ID y PROJECT_ID**:
   - Instala Vercel CLI: `npm install -g vercel`
   - Ejecuta: `vercel link`
   - Los IDs aparecerán en `.vercel/project.json`

## 🎯 Opción 3: CLI Manual

### Instalación

```bash
npm install -g vercel
```

### Despliegue

```bash
# Primera vez
vercel

# Despliegues posteriores
vercel --prod
```

## 🌐 URLs de tu Aplicación

Después del despliegue tendrás:

- **URL de producción**: `https://stock-control-tu-username.vercel.app`
- **URLs de preview**: Para cada pull request automáticamente

## ⚙️ Configuración Automática

Tu aplicación ya está configurada con:

### Variables de Entorno

- `NEXT_PUBLIC_USE_MOCK=true` - Usa datos mock (perfecto para demo)

### Optimizaciones de Vercel

- Next.js Image Optimization habilitada
- Compresión automática
- CDN global
- HTTPS automático
- Package imports optimizados

### Funcionalidades Incluidas

- ✅ Sistema de autenticación completo
- ✅ Gestión multi-usuario
- ✅ Dashboard y analytics
- ✅ Notificaciones inteligentes
- ✅ Sistema de auditorías
- ✅ Datos persistentes en localStorage

## 🔧 Configuración Avanzada

### Dominios Personalizados

1. Ve a tu proyecto en Vercel
2. Settings > Domains
3. Agrega tu dominio personalizado

### Analytics

Vercel incluye analytics gratuitos:

- Core Web Vitals
- Métricas de rendimiento
- Logs en tiempo real

### Monitoreo

- Uptime monitoring automático
- Error tracking integrado
- Performance insights

## 🚨 Solución de Problemas

### Build Fails

```bash
# Verifica que el build funcione localmente
npm run build

# Si hay errores de TypeScript
npm run type-check
```

### Environment Variables

Asegúrate de que `NEXT_PUBLIC_USE_MOCK=true` esté configurado en Vercel.

### Performance

Tu aplicación ya está optimizada para Vercel con:

- Code splitting automático
- Image optimization
- Font optimization
- Bundle analyzer

## 📊 Métricas Incluidas

Tu aplicación tendrá acceso a:

- **Lighthouse Score**: Automático en cada deploy
- **Core Web Vitals**: LCP, FID, CLS
- **Bundle Size**: Tracking automático
- **Build Time**: Optimización continua

## 🎉 ¡Listo!

Con cualquiera de estos métodos, tu aplicación estará live en Vercel con:

- SSL automático
- CDN global
- Despliegues automáticos en cada push
- Preview deployments para PRs
- Analytics integrados

Tu Sistema de Control de Stock estará disponible 24/7 con el plan gratuito de Vercel que incluye:

- 100GB bandwidth/mes
- 1000 serverless functions executions/día
- Dominios personalizados
- Preview deployments ilimitados

¡Tu aplicación está lista para ser usada en producción! 🚀
