#!/bin/bash
#
# INSTALL GIT HOOKS - EGI-HUB
# Copia gli hook dalla directory sorgente a .git/hooks
#
# Versione: 2.0.0
# Data: 2026-01-22
#

# Colori
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "🔧 Installazione Git Hooks per EGI-HUB..."
echo ""

# Trova la root del progetto
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Verifica che siamo in un repo git
if [ ! -d "$PROJECT_ROOT/.git" ]; then
    echo -e "${RED}❌ Errore: Non trovata directory .git in $PROJECT_ROOT${NC}"
    echo "   Assicurati di essere nella root del progetto"
    exit 1
fi

# Directory sorgente e destinazione
HOOKS_SOURCE="$PROJECT_ROOT/git-hooks"
HOOKS_DEST="$PROJECT_ROOT/.git/hooks"

# Verifica esistenza directory sorgente
if [ ! -d "$HOOKS_SOURCE" ]; then
    echo -e "${RED}❌ Errore: Directory sorgente non trovata: $HOOKS_SOURCE${NC}"
    exit 1
fi

# Lista degli hook da installare
HOOKS="pre-commit pre-push"

# Installa ogni hook
for hook in $HOOKS; do
    SOURCE_FILE="$HOOKS_SOURCE/$hook"
    DEST_FILE="$HOOKS_DEST/$hook"
    
    if [ -f "$SOURCE_FILE" ]; then
        # Copia il file
        cp "$SOURCE_FILE" "$DEST_FILE"
        
        # Rendi eseguibile
        chmod +x "$DEST_FILE"
        
        echo -e "${GREEN}✅ Installato:${NC} $hook"
    else
        echo -e "${YELLOW}⚠️  Non trovato:${NC} $hook (skip)"
    fi
done

echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Git Hooks installati con successo!${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"
echo ""
echo "Gli hook sono ora attivi. Proteggeranno il codice da:"
echo "  • Eliminazione accidentale di >100 righe per file"
echo "  • Rimozione di >50% del contenuto di un file"
echo "  • Commit che rimuovono >500 righe totali"
echo ""
echo "Per bypassare (solo se intenzionale):"
echo -e "  ${YELLOW}git commit --no-verify${NC}"
echo -e "  ${YELLOW}git push --no-verify${NC}"
echo ""
