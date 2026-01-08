# NATAN_LOC - AI Agent Instructions (OS3.0)

> **"L'AI non pensa. Predice. Non deduce logicamente. Completa statisticamente."**
> Questo file disciplina il comportamento AI per evitare il 40% di bug da assunzioni sbagliate.

---

## 🏗️ Architettura (Big Picture)

```
Frontend (TS) :5173 → Laravel Backend :7000 → Python FastAPI :8001 → MongoDB Atlas
                               ↓
                          MariaDB :3306 (users, tenants)
```

| Componente | Path | Responsabilità |
|------------|------|----------------|
| **Frontend** | `frontend/` | Vanilla TS + Vite + Tailwind, NO React/Vue |
| **Laravel** | `laravel_backend/` | API REST, auth Sanctum, multi-tenant, GDPR |
| **Python AI** | `python_ai_service/` | USE Pipeline, RAG-Fortress, embeddings |
| **Docker** | `docker/` | MongoDB 7, servizi containerizzati |

**Flow principale**: Chat UI → `/api/v1/chat` (Laravel proxy) → Python `/chat` → RAG-Fortress → MongoDB vector search

---

## 🚫 REGOLA ZERO - IL FONDAMENTO

**MAI DEDURRE | MAI COMPLETARE LACUNE | SE NON SAI, CHIEDI**

```
Mancano info? → 🔍 semantic_search / grep_search / read_file
Tutto fallito? → 🛑 STOP e CHIEDI
Info ambigue? → 🛑 STOP e CHIEDI chiarimenti
```

### 5 Domande Obbligatorie (PRIMA di ogni risposta)

1. ❓ Ho TUTTE le info necessarie? → NO = 🛑 STOP e CHIEDI
2. ❓ Metodi/classi VERIFICATI con tools? → NO = 🛑 VERIFICA prima
3. ❓ Esiste pattern SIMILE da replicare? → Non so = 🛑 CHIEDI esempio
4. ❓ Sto facendo ASSUNZIONI? → SÌ = 🛑 DICHIARA e CHIEDI conferma
5. ❓ Limiti IMPLICITI (take/limit senza param)? → SÌ = 🛑 VIOLATION P0-3

---

## 🚨 P0 - REGOLE BLOCCANTI (Violazione = STOP totale)

### P0-1: REGOLA ZERO (Anti-Deduzione)
### P0-2: Translation Keys Only
```php
❌ 'message' => 'Success'           // HARDCODED!
✅ 'message' => __('profile.updated')
```

### P0-3: Statistics Rule (No Hidden Limits)
```php
❌ ->take(10)->get()                // NASCOSTO!
✅ ->limit($limit ?? null)->get()   // ESPLICITO
```

### P0-4/6: Anti-Method-Invention
```php
// PRIMA di usare $service->metodo():
// read_file laravel_backend/app/Services/NomeService.php
// grep_search "public function" in NomeService.php
// USA il nome ESATTO trovato
```

### P0-7: Anti-Enum-Invention
```php
// PRIMA di usare GdprActivityCategory::COSTANTE:
// read_file laravel_backend/app/Enums/Gdpr/GdprActivityCategory.php
// Costanti valide: AUTHENTICATION, DATA_ACCESS, CONTENT_CREATION, ADMIN_ACTION, etc.
```

### P0-5: UEM-First (Error Handling Sacred)
- **UEM** = errori strutturati (alert team) → `$this->errorManager->handle()`
- **ULM** = logging generico (trace) → `$this->logger->info()`
- **MAI** sostituire UEM con ULM

---

## 🔌 Pattern ULM/UEM/GDPR (Laravel)

```php
// Dependency Injection pattern standard
use Ultra\UltraLogManager\UltraLogManager;
use Ultra\ErrorManager\Interfaces\ErrorManagerInterface;

public function __construct(
    UltraLogManager $logger,
    ErrorManagerInterface $errorManager
) { ... }

public function update(Request $request): RedirectResponse {
    try {
        $this->logger->info('Operation started', ['user_id' => $user->id]);
        $user->update($validated);
        $this->auditService->logUserAction($user, 'data_updated', $context,
            GdprActivityCategory::PERSONAL_DATA_UPDATE);
        return redirect()->with('success', __('key'));
    } catch (\Exception $e) {
        return $this->errorManager->handle('OP_FAILED', [...], $e);
    }
}
```

---

## 🛠️ Comandi Sviluppo

```bash
# Avvia tutti i servizi (Docker + Laravel + Frontend)
./start_services.sh

# Ferma servizi
./stop_services.sh

# Solo Docker (MongoDB + Python FastAPI)
cd docker && docker-compose up -d mongodb python_fastapi

# Laravel backend (porta 7000)
cd laravel_backend && php artisan serve --port=7000

# Frontend dev (porta 5173)
cd frontend && npm run dev

# Test Python
cd python_ai_service && python -m pytest tests/
```

---

## 📁 File Chiave da Consultare

| Scopo | File |
|-------|------|
| Stato progetto | `docs/Core/00_NATAN_LOC_STATO_DELLARTE.md` |
| Architettura | `docs/Core/01_PLATFORME_ARCHITECTURE.md` |
| Anti-hallucination | `docs/Core/03_ANTI_HALLUCINATION_TECH.md` |
| API Routes | `laravel_backend/routes/api.php` |
| Chat Service | `laravel_backend/app/Services/NatanChatService.php` |
| USE Pipeline | `python_ai_service/app/services/use_pipeline.py` |
| RAG-Fortress | `python_ai_service/app/services/rag_fortress/` |
| GDPR Enums | `laravel_backend/app/Enums/Gdpr/` |

---

## 📝 Commit Format

```
[TAG] Descrizione breve

- Dettaglio 1
- Dettaglio 2

Tags: [FEAT] [FIX] [REFACTOR] [DOC] [TEST] [CHORE]
```

---

## 🎯 Processo Operativo

1. **LEGGO** il problema
2. **VERIFICO** info complete (REGOLA ZERO)
3. **CERCO** con tools (semantic_search, grep, read_file)
4. **CHIEDO** se manca qualcosa
5. **PRODUCO** soluzione completa (un file per volta)

**Frasi corrette:**
- ✅ "Non trovo [X]. Dove si trova?"
- ✅ "Devo usare [metodo]. Prima verifico che esista..."
- ✅ "Sto assumendo [X]. Confermi?"

**Frasi bandite:**
- ❌ "Probabilmente ha un metodo..."
- ❌ "Tipicamente in Laravel..."
- ❌ "Assumo che..."
