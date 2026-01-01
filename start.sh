#!/bin/bash

# EGI-HUB Development Server Startup Script
# Avvia backend (Laravel) e frontend (React) in parallelo

echo "🚀 Avvio EGI-HUB..."
echo ""

# Colori
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Directory base
BASE_DIR="$(cd "$(dirname "$0")" && pwd)"

# Funzione per cleanup al termine
cleanup() {
    echo ""
    echo "🛑 Arresto server..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# Avvia Backend Laravel (porta 8010)
echo -e "${BLUE}📦 Avvio Backend Laravel (porta 8010)...${NC}"
cd "$BASE_DIR/backend"
php artisan serve --port=8010 2>/dev/null &
BACKEND_PID=$!

# Attendi che il backend sia pronto
sleep 2

# Avvia Frontend React (porta 5174)
echo -e "${GREEN}⚛️  Avvio Frontend React (porta 5174)...${NC}"
cd "$BASE_DIR/frontend"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "════════════════════════════════════════════════"
echo -e "${GREEN}✅ EGI-HUB attivo!${NC}"
echo ""
echo -e "   ${BLUE}Backend:${NC}  http://localhost:8010"
echo -e "   ${GREEN}Frontend:${NC} http://localhost:5174"
echo ""
echo "   Premi Ctrl+C per arrestare"
echo "════════════════════════════════════════════════"
echo ""

# Attendi che i processi terminino
wait
