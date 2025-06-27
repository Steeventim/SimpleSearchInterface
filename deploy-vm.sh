#!/bin/bash
# Script d'installation et de lancement du build Next.js sur la VM

set -e

# Décompresser l'archive
unzip build-next.zip
cd build-next

# Installer les dépendances (production uniquement)
if [ -f pnpm-lock.yaml ]; then
  if command -v pnpm >/dev/null 2>&1; then
    pnpm install --prod
  else
    echo "pnpm n'est pas installé. Installez-le ou utilisez npm."
    exit 1
  fi
elif [ -f package-lock.json ]; then
  npm install --production
elif [ -f yarn.lock ]; then
  yarn install --production
else
  echo "Aucun gestionnaire de paquets détecté."
  exit 1
fi

# Lancer l'application Next.js en mode production
pnpm start || npm start || yarn start
