#!/usr/bin/env node

/**
 * Setup script for GitHub Pages deployment
 * This script configures the necessary settings for deploying to GitHub Pages
 */

const fs = require("fs");
const path = require("path");

// Get repository name from package.json or command line
const packageJson = require("../package.json");
const repoName = process.argv[2] || packageJson.name;

console.log(`🔧 Configurando GitHub Pages para el repositorio: ${repoName}`);

// Update next.config.ts for GitHub Pages
const nextConfigPath = path.join(__dirname, "../next.config.ts");
let nextConfig = fs.readFileSync(nextConfigPath, "utf8");

// Enable basePath and assetPrefix for GitHub Pages
nextConfig = nextConfig.replace(
  "// basePath: '/stock-control',",
  `basePath: '/${repoName}',`
);
nextConfig = nextConfig.replace(
  "// assetPrefix: '/stock-control/',",
  `assetPrefix: '/${repoName}/',`
);

fs.writeFileSync(nextConfigPath, nextConfig);

// Create .nojekyll file to prevent Jekyll processing
const nojekyllPath = path.join(__dirname, "../public/.nojekyll");
fs.writeFileSync(nojekyllPath, "");

// Update package.json scripts
packageJson.scripts["build:github-pages"] =
  "node scripts/setup-github-pages.js && npm run build";
packageJson.scripts["deploy:github-pages"] =
  "npm run build:github-pages && gh-pages -d out";

fs.writeFileSync(
  path.join(__dirname, "../package.json"),
  JSON.stringify(packageJson, null, 2)
);

console.log("✅ Configuración de GitHub Pages completada!");
console.log(
  `🌐 Tu aplicación estará disponible en: https://[tu-usuario].github.io/${repoName}`
);
console.log("");
console.log("📋 Pasos siguientes:");
console.log("1. Haz commit y push de estos cambios");
console.log("2. Ve a Settings > Pages en tu repositorio de GitHub");
console.log('3. Selecciona "GitHub Actions" como fuente');
console.log("4. El deployment se ejecutará automáticamente en el próximo push");
