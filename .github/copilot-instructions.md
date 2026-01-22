# EGI-HUB - AI Agent Instructions (OS3.0)

> **Hub Backend Multi-Tenant per NATAN e Ecosistema FlorenceEGI**
> **"L'AI non pensa. Predice. Non deduce logicamente. Completa statisticamente."**

---

## 🛑 REGOLE P0 - BLOCCANTI (Violazione = STOP immediato)

| # | Regola | Cosa Fare |
|---|--------|-----------|
| **P0-1** | REGOLA ZERO | MAI dedurre. Se non sai → 🛑 CHIEDI |
| **P0-2** | Translation Keys | `__('key')` mai stringhe hardcoded |
| **P0-3** | Statistics Rule | No `->take(10)` nascosti, sempre param espliciti |
| **P0-4** | Anti-Method-Invention | Verifica metodo esiste PRIMA di usarlo |
| **P0-5** | UEM-First | Errori → `$errorManager->handle()`, mai solo ULM |
| **P0-6** | Anti-Service-Method | `read_file` + `grep` prima di usare service |
| **P0-7** | Anti-Enum-Constant | Verifica costanti enum esistono |
| **P0-8** | i18n 6 Lingue | Traduzioni in TUTTE: `it`, `en`, `de`, `es`, `fr`, `pt` |

### 🌍 Lingue Obbligatorie (P0-8)

Ogni traduzione DEVE essere in **tutte e 6** le lingue:

| Codice | Lingua | Path |
|--------|--------|------|
| `it` | Italiano | `backend/resources/lang/it/` |
| `en` | English | `backend/resources/lang/en/` |
| `de` | Deutsch | `backend/resources/lang/de/` |
| `es` | Español | `backend/resources/lang/es/` |
| `fr` | Français | `backend/resources/lang/fr/` |
| `pt` | Português | `backend/resources/lang/pt/` |

❌ **VIETATO** tradurre solo in `it` + `en` → 🛑 BLOCCA

### 🔍 Prima di Ogni Risposta

```
1. Ho TUTTE le info? → NO = 🛑 CHIEDI
2. Metodi VERIFICATI? → NO = 🛑 semantic_search/grep/read_file
3. Pattern simile esiste? → Non so = 🛑 CHIEDI esempio
4. Sto ASSUMENDO? → SÌ = 🛑 DICHIARA e CHIEDI
5. Limiti impliciti? → SÌ = 🛑 RENDI ESPLICITO
```

### 🔧 Processo Verifica Metodi

```bash
semantic_search "UserService class methods"
grep_search "public function" -includePattern="backend/app/Services/UserService.php"
read_file backend/app/Services/UserService.php
# SE non trovo → 🛑 STOP e CHIEDI
```

---

## 🏗️ Architettura

```
Frontend (TS) :5173 → Laravel Backend :7000 → Python FastAPI :8001 → MongoDB Atlas
                              ↓
                         MariaDB :3306 (users, tenants)
```

| Componente | Path |
|------------|------|
| Frontend | `frontend/` (Vanilla TS + Vite + Tailwind, NO React/Vue) |
| Laravel | `backend/` (API REST, auth Sanctum, multi-tenant, GDPR) |
| Python AI | via API (USE Pipeline, RAG-Fortress, embeddings) |
| Docker | `docker/` (MongoDB 7, servizi containerizzati) |

**Flow**: Chat UI → `/api/v1/chat` (Laravel proxy) → Python `/chat` → RAG-Fortress → MongoDB

---

## 🔌 Pattern ULM/UEM/GDPR (Template Obbligatorio)

```php
use Ultra\UltraLogManager\UltraLogManager;
use Ultra\ErrorManager\Interfaces\ErrorManagerInterface;
use App\Services\Gdpr\AuditLogService;
use App\Enums\Gdpr\GdprActivityCategory;

class ExampleController extends Controller
{
    public function __construct(
        private UltraLogManager $logger,
        private ErrorManagerInterface $errorManager,
        private AuditLogService $auditService
    ) {}

    public function update(Request $request): RedirectResponse 
    {
        try {
            $this->logger->info('Operation started', ['user_id' => $user->id]);
            $user->update($validated);
            
            // GDPR Audit (P0-7: enum verificato)
            $this->auditService->logUserAction($user, 'data_updated', $context,
                GdprActivityCategory::PERSONAL_DATA_UPDATE);
            
            return redirect()->with('success', __('messages.updated')); // P0-2
        } catch (\Exception $e) {
            return $this->errorManager->handle('OP_FAILED', [...], $e); // P0-5
        }
    }
}
```

---

## 📁 File Chiave

| Scopo | Path |
|-------|------|
| API Routes | `backend/routes/api.php` |
| GDPR Enums | `backend/app/Enums/Gdpr/` |
| Controller Pattern | `backend/app/Http/Controllers/` |
| Stato progetto | `docs/00_NATAN_LOC_STATO_DELLARTE.md` |
| Architettura | `docs/01_PLATFORME_ARCHITECTURE_03.md` |
| Oracode Docs | `docs/Oracode_Systems/` |

---

## 🧬 Oracode System

**3 Livelli**: OSZ (kernel) → OS3 (AI discipline) → OS4 (human education)

**6+1 Pilastri**: Intenzionalità, Semplicità, Coerenza, Circolarità, Evoluzione, Sicurezza + **REGOLA ZERO**

**Concetti OSZ**:
- **EGI**: `Wrapper<T> + Regole + Audit + Valore`
- **Interface**: Giunture stabili (API, contratti)
- **Instance**: Organi sostituibili (NATAN, Marketplace, PA...)
- **Nerve**: Sistema nervoso AI (governatori, validatori)

---

## ⚡ Priorità

| P | Nome | Conseguenza |
|---|------|-------------|
| **P0** | BLOCKING | 🛑 STOP totale |
| **P1** | MUST | Non production-ready |
| **P2** | SHOULD | Debt tecnico |
| **P3** | REFERENCE | Info only |

---

## 📝 TAG System v2.0

Formato: `[TAG] Descrizione breve`

| Tag | Peso | Tag | Peso | Tag | Peso | Tag | Peso |
|-----|------|-----|------|-----|------|-----|------|
| FEAT | 1.0 | FIX | 1.5 | REFACTOR | 2.0 | TEST | 1.2 |
| DEBUG | 1.3 | DOC | 0.8 | CONFIG | 0.7 | CHORE | 0.6 |
| I18N | 0.7 | PERF | 1.4 | SECURITY | 1.8 | WIP | 0.3 |
| REVERT | 0.5 | MERGE | 0.4 | DEPLOY | 0.8 | UPDATE | 0.6 |

Alias: `[FEAT]` = `feat:` = ✨

---

## 🔒 Git Hooks

| Regola | Trigger | Azione |
|--------|---------|--------|
| R1 | >100 righe rimosse/file | 🛑 BLOCCA |
| R2 | 50-100 righe rimosse | ⚠️ WARNING |
| R3 | >50% contenuto rimosso | 🛑 BLOCCA |
| R4 | >500 righe totali rimosse | 🛑 BLOCCA |

Bypass: `git commit --no-verify` (solo se intenzionale)

---

## 🛠️ Comandi

```bash
./start.sh                           # Avvia tutto
./stop.sh                            # Ferma tutto
cd docker && docker-compose up -d    # Solo Docker
cd backend && php artisan serve --port=7000  # Laravel
cd frontend && npm run dev           # Frontend :5173
```

---

**OS3.0 - "Less talk, more code. Ship it."**
