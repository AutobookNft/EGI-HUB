# EGI-HUB — Central Control Plane

> **Il centro di comando dell'ecosistema FlorenceEGI**

[![React](https://img.shields.io/badge/React-18.x-61DAFB)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6)](https://typescriptlang.org)
[![Laravel](https://img.shields.io/badge/Laravel-11-FF2D20)](https://laravel.com)
[![PHP](https://img.shields.io/badge/PHP-8.2+-777BB4)](https://php.net)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-AWS_RDS-336791)](https://postgresql.org)

---

## Cos'è EGI-HUB

**EGI-HUB** è la dashboard SuperAdmin che orchestra, monitora e gestisce tutte le applicazioni SaaS dell'ecosistema FlorenceEGI. È il Control Plane: sta sopra tutti i progetti verticali.

**E:**
- Il centro di comando per tutti i progetti (NATAN_LOC, FlorenceArtEGI, futuri)
- Un monorepo con `backend/` (Laravel 11 API) + `frontend/` (React 18 SPA) + `src/` (package)
- L'orchestratore delle aggregazioni P2P tra tenant di progetti diversi
- Il provider del package `florenceegi/hub` usato dai verticali

**NON E:**
- Un'app rivolta all'utente finale
- Un modulo di EGI (FlorenceArtEGI)
- Un semplice pannello admin

---

## Architettura

```
                    ┌─────────────────────────────────┐
                    │           EGI-HUB               │
                    │      (Control Plane)            │
                    │  hub.florenceegi.com            │
                    │                                 │
                    │  Backend: Laravel 11 API        │
                    │  Frontend: React 18 SPA         │
                    │  Package: florenceegi/hub       │
                    └────────────┬────────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
         ▼                       ▼                       ▼
┌────────────────┐     ┌────────────────┐     ┌────────────────┐
│   NATAN_LOC    │     │ FlorenceArtEGI │     │  PartnerHub    │
│ (Verticale PA) │     │(Verticale Art) │     │ (Trasversale)  │
│ natan-loc.     │     │ art.           │     │   (FUTURO)     │
│ florenceegi.com│     │ florenceegi.com│     │                │
└────────────────┘     └────────────────┘     └────────────────┘
         │                       │
         └───────────────────────┘
                       │
         ┌─────────────▼──────────────┐
         │  PostgreSQL (AWS RDS)       │
         │  DB: florenceegi           │
         │  Schema: core, natan, ...  │
         └────────────────────────────┘
```

---

## Stack Tecnico

| Componente | Tecnologia | Dettaglio |
|------------|-----------|-----------|
| **Backend** | Laravel 11 | PHP 8.2+, API-only (JSON), Sanctum auth |
| **Frontend** | React 18 | TypeScript 5.x, Vite 5.0, TailwindCSS 3.4, DaisyUI 5.5 |
| **Database** | PostgreSQL | AWS RDS, DB `florenceegi`, schema `core` |
| **State Management** | TanStack Query | React Query 5.17 |
| **Routing** | React Router DOM | 6.21 |
| **HTTP Client** | Axios | |
| **Permissions** | Spatie | laravel-permission |

### Porte di sviluppo

| Servizio | Porta | URL |
|----------|-------|-----|
| EGI-HUB Backend | `8001` | http://localhost:8001 |
| EGI-HUB Frontend | `5174` | http://localhost:5174 |
| EGI (FlorenceArtEGI) | `8004` | http://localhost:8004 |
| NATAN_LOC | `8000` | http://localhost:8000 |

### Dipendenze speciali

- **`florenceegi/hub`**: package path dalla directory parent (`..`), contiene modelli Aggregation e trait HasAggregations
- **5 pacchetti Ultra\***: VCS privati da GitHub SSH (UltraUploadManager, UltraErrorManager, UltraTranslationManager, UltraLogManager, UltraConfigManager)

---

## Struttura Monorepo

```
EGI-HUB/
├── backend/                    # Laravel 11 API
│   ├── app/
│   │   ├── Http/Controllers/Api/
│   │   │   ├── AuthController.php
│   │   │   ├── ProjectController.php
│   │   │   ├── AggregationController.php
│   │   │   ├── EcosystemController.php
│   │   │   ├── GdprController.php
│   │   │   └── Superadmin/          # 16 controller
│   │   └── Models/                  # 32 modelli
│   ├── routes/api.php               # ~80 endpoint
│   └── composer.json
│
├── frontend/                   # React 18 SPA
│   ├── src/
│   │   ├── pages/              # 37 pagine
│   │   │   ├── projects/
│   │   │   ├── tenants/
│   │   │   ├── ai/
│   │   │   ├── tokenomics/
│   │   │   ├── platform/
│   │   │   ├── billing/
│   │   │   ├── padmin/
│   │   │   └── system/
│   │   ├── components/
│   │   └── App.tsx
│   └── package.json
│
├── src/                        # Package florenceegi/hub
│   ├── Models/
│   │   ├── Aggregation.php
│   │   └── AggregationMember.php
│   ├── Traits/
│   │   └── HasAggregations.php
│   └── HubServiceProvider.php
│
├── docs/                       # Documentazione
│   ├── EGI_HUB_CONTEXT.md      # Contesto operativo (SSOT)
│   ├── 01_PLATFORME_ARCHITECTURE_03.md
│   ├── CHECKLIST_SVILUPPO.md
│   └── BILLING_MANAGEMENT_PLAN.md
└── composer.json               # Package definition
```

---

## Moduli Funzionali

| Modulo | Controller | Pagine | Stato |
|--------|-----------|--------|-------|
| Gestione Progetti | `ProjectController` + 2 | 6 | Attivo |
| Aggregazioni P2P | `AggregationController` | 1 | Attivo |
| AI Management | 4 controller | 4 | Attivo |
| Tokenomics (Egili/Equilibrium) | 2 controller | 2 | Attivo |
| Platform Management | 5 controller | 5 | Attivo |
| Padmin / Oracode OS3 | 5 controller | 5 | Attivo |
| Billing | 6 controller | 4 | Attivo |
| Ecosystem API (pubbliche) | `EcosystemController` | - | Attivo |
| Proxy API | `ProjectProxyController` | - | Attivo |
| Auth & GDPR | `AuthController`, `GdprController` | 2 | Attivo |
| Tenant Management | `TenantController` (legacy) | 6 (3 frontend-only) | Parziale |
| System Config | - | 4 (frontend-only) | Da implementare |

---

## Package florenceegi/hub

I progetti verticali includono il package via composer:

```json
{
    "require": { "florenceegi/hub": "@dev" },
    "repositories": [
        { "type": "path", "url": "../EGI-HUB" }
    ]
}
```

### Trait HasAggregations

```php
use FlorenceEgi\Hub\Traits\HasAggregations;

class Tenant extends Model {
    use HasAggregations;

    // $tenant->getActiveAggregations()
    // $tenant->getAccessibleTenantIds()
    // $tenant->getAccessibleTenantsByAggregation()
    // $tenant->canAccessTenant($tenantId)
    // $tenant->createAggregation('Nome', ['share_documents' => true])
}
```

### Stati Membership

| Stato | Descrizione |
|-------|-------------|
| `pending` | Invito inviato, in attesa risposta |
| `accepted` | Membro attivo |
| `rejected` | Ha rifiutato l'invito |
| `left` | Ha lasciato volontariamente |
| `removed` | Rimosso dall'admin |
| `expired` | Invito scaduto |

**Ruoli**: `admin`, `member`, `readonly`

---

## Avvio Development

```bash
# Backend
cd /home/fabio/EGI-HUB/backend
php artisan serve --port=8001

# Frontend
cd /home/fabio/EGI-HUB/frontend
npm run dev   # Vite su porta 5174
```

---

## Deploy (Produzione)

- **Dominio**: `hub.florenceegi.com`
- **Server**: EC2 privata `i-0940cdb7b955d1632` (10.0.3.21)
- **Accesso**: Solo via AWS SSM Session Manager (niente SSH)
- **Web root**: `/home/forge/hub.florenceegi.com/`

```bash
sudo -u forge bash -c "cd /home/forge/hub.florenceegi.com && \
    git pull origin main && \
    cd backend && composer install --no-dev --optimize-autoloader && \
    php artisan migrate --force && \
    php artisan config:cache && php artisan route:cache && php artisan view:cache && \
    cd ../frontend && npm install && npm run build"
sudo systemctl restart php8.3-fpm
```

Guida completa: `docs/staging-deployment-guide.md`

---

## Progetti Collegati

| App | Dominio | Stato |
|-----|---------|-------|
| **EGI-HUB** | hub.florenceegi.com | Da deployare |
| **EGI** (FlorenceArtEGI) | art.florenceegi.com | LIVE |
| **NATAN_LOC** | natan-loc.florenceegi.com | Da deployare |
| **EGI-HUB-HOME-REACT** | florenceegi.com | LIVE |
| **EGI-INFO** | info.florenceegi.com | LIVE |

---

## Licenza

Proprietary — © 2025-2026 Fabio Cherici / FlorenceEGI
