#!/bin/bash

# 🚀 Script de Despliegue Rápido para Vercel
# Este script automatiza el proceso de despliegue

echo "🚀 Iniciando despliegue en Vercel..."

# Verificar si estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: No se encuentra package.json. Ejecuta este script desde la raíz del proyecto."
    exit 1
fi

# Verificar si Vercel CLI está instalado
if ! command -v vercel &> /dev/null; then
    echo "📦 Instalando Vercel CLI..."
    npm install -g vercel
fi

# Verificar que no hay cambios sin commit
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  Hay cambios sin commit. ¿Deseas continuar? (y/n)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        echo "❌ Despliegue cancelado."
        exit 1
    fi
fi

# Ejecutar build local para verificar
echo "🔧 Verificando build local..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Error en el build. Revisa los errores antes de desplegar."
    exit 1
fi

echo "✅ Build exitoso!"

# Preguntar tipo de despliegue
echo "🎯 ¿Qué tipo de despliegue quieres realizar?"
echo "1) Preview (desarrollo)"
echo "2) Production (producción)"
read -p "Selecciona (1-2): " choice

case $choice in
    1)
        echo "🔄 Desplegando preview..."
        vercel
        ;;
    2)
        echo "🚀 Desplegando a producción..."
        vercel --prod
        ;;
    *)
        echo "❌ Opción inválida. Ejecutando preview por defecto..."
        vercel
        ;;
esac

echo "✅ Despliegue completado!"
echo "🌐 Tu aplicación está disponible en la URL mostrada arriba."
echo "📊 Puedes ver métricas y logs en: https://vercel.com/dashboard"
