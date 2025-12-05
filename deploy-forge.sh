#!/bin/bash

# ==============================================================================
# EGI-HUB Deploy Script per Laravel Forge (Zero-Downtime)
# ==============================================================================
# 
# ISTRUZIONI PER FORGE:
# In Forge -> Site -> Deploy Script, incolla TUTTO questo script:
#
# cd /home/forge/egi-hub.13.48.57.194.sslip.io
# git pull origin $FORGE_SITE_BRANCH
# bash deploy-forge.sh
# 
# ==============================================================================

set -e

# Determina il percorso corretto
# Se eseguito da Forge, siamo già nella root del sito
if [ -n "$FORGE_SITE_PATH" ]; then
    SITE_ROOT="$FORGE_SITE_PATH"
else
    SITE_ROOT="/home/forge/egi-hub.13.48.57.194.sslip.io"
fi

# Per zero-downtime, current punta alla release attiva
# Ma durante il deploy, lavoriamo sulla nuova release
if [ -d "$SITE_ROOT/current/backend" ]; then
    RELEASE_PATH="$SITE_ROOT/current/backend"
elif [ -d "$SITE_ROOT/backend" ]; then
    # Fallback: struttura senza zero-downtime
    RELEASE_PATH="$SITE_ROOT/backend"
else
    echo "❌ Errore: non trovo la directory backend"
    exit 1
fi

echo "🚀 Deploy EGI-HUB Backend..."
echo "   Site root: $SITE_ROOT"
echo "   Release path: $RELEASE_PATH"

# ------------------------------------------------------------------------------
# 1. Crea directory persistenti (solo la prima volta)
# ------------------------------------------------------------------------------
echo "📁 Verifico directory persistenti..."

# Storage persistente
if [ ! -d "$SITE_ROOT/storage" ]; then
    echo "   Creo storage persistente..."
    mkdir -p "$SITE_ROOT/storage/framework/"{cache,sessions,views}
    mkdir -p "$SITE_ROOT/storage/logs"
    mkdir -p "$SITE_ROOT/storage/app/public"
    chmod -R 775 "$SITE_ROOT/storage"
fi

# Bootstrap cache persistente
if [ ! -d "$SITE_ROOT/bootstrap-cache" ]; then
    echo "   Creo bootstrap-cache persistente..."
    mkdir -p "$SITE_ROOT/bootstrap-cache"
    chmod -R 775 "$SITE_ROOT/bootstrap-cache"
fi

# ------------------------------------------------------------------------------
# 2. Rimuovi directory dalla release e crea symlink
# ------------------------------------------------------------------------------
echo "🔗 Configuro symlink..."

# Symlink .env
rm -f "$RELEASE_PATH/.env"
ln -sf "$SITE_ROOT/.env" "$RELEASE_PATH/.env"
echo "   ✓ .env"

# Symlink storage
rm -rf "$RELEASE_PATH/storage"
ln -sf "$SITE_ROOT/storage" "$RELEASE_PATH/storage"
echo "   ✓ storage"

# Symlink bootstrap/cache
rm -rf "$RELEASE_PATH/bootstrap/cache"
ln -sf "$SITE_ROOT/bootstrap-cache" "$RELEASE_PATH/bootstrap/cache"
echo "   ✓ bootstrap/cache"

# ------------------------------------------------------------------------------
# 3. Composer install
# ------------------------------------------------------------------------------
echo "📦 Composer install..."
cd "$RELEASE_PATH"
composer install --no-dev --optimize-autoloader --no-interaction

# ------------------------------------------------------------------------------
# 4. Laravel ottimizzazioni
# ------------------------------------------------------------------------------
echo "⚡ Ottimizzazioni Laravel..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

# ------------------------------------------------------------------------------
# 5. Migrazioni (opzionale, decommentare se necessario)
# ------------------------------------------------------------------------------
# echo "🗄️ Migrazioni..."
# php artisan migrate --force

# ------------------------------------------------------------------------------
# 6. Frontend build (se presente)
# ------------------------------------------------------------------------------
FRONTEND_PATH="$SITE_ROOT/current/frontend"
if [ -d "$FRONTEND_PATH" ]; then
    echo "🎨 Build frontend..."
    cd "$FRONTEND_PATH"
    npm ci
    npm run build
fi

echo "✅ Deploy completato!"
