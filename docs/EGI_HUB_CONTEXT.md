# EGI-HUB - Contesto Operativo

**Versione**: 3.0
**Data**: 2026-02-20
**Riferimento Architettura**: `01_PLATFORME_ARCHITECTURE_03.md`

---

## Ruolo di EGI-HUB

**EGI-HUB e il Control Plane** dell'ecosistema FlorenceEGI: una dashboard SuperAdmin full-stack che orchestra, monitora e gestisce tutte le applicazioni SaaS dell'ecosistema.

**E:**
- Il centro di comando per tutti i progetti verticali (NATAN_LOC, FlorenceArtEGI, ecc.)
- Un monorepo con `backend/` (Laravel 11 API) + `frontend/` (React 18 SPA)
- L'orchestratore delle aggregazioni P2P tra tenant di progetti diversi
- Il provider del package `florenceegi/hub` usato dai verticali

**NON E:**
- Un'app rivolta all'utente finale
- Un modulo di EGI (FlorenceArtEGI)
- Un semplice pannello admin

---

## Stack Tecnico

| Componente | Tecnologia | Dettaglio |
|------------|-----------|-----------|
| **Backend** | Laravel 11 | PHP 8.2+, API-only (JSON), Sanctum auth |
| **Frontend** | React 18 | TypeScript 5.3, Vite 5.0, TailwindCSS 3.4, DaisyUI 5.5 |
| **Database** | PostgreSQL | AWS RDS, DB `florenceegi`, schema `core` |
| **State Management** | TanStack Query | React Query 5.17 |
| **Routing** | React Router | DOM 6.21 |
| **HTTP Client** | Axios | |
| **Permissions** | Spatie | laravel-permission |

### Porte di sviluppo
- Backend: `8001` (`php artisan serve --port=8001`)
- Frontend: `5174` (`npm run dev`), proxy `/api` → `localhost:8010`

### Dipendenze speciali
- **`florenceegi/hub`**: package path dalla directory parent (`..`), contiene modelli Aggregation e trait
- **5 pacchetti Ultra***: VCS privati da GitHub SSH (UltraUploadManager, UltraErrorManager, UltraTranslationManager, UltraLogManager, UltraConfigManager)

---

## Struttura Monorepo

```
EGI-HUB/
├── backend/                    # Laravel 11 API
│   ├── app/
│   │   ├── Http/Controllers/Api/
│   │   │   ├── AuthController.php
│   │   │   ├── ProjectController.php
│   │   │   ├── ProjectAdminController.php
│   │   │   ├── ProjectProxyController.php
│   │   │   ├── ProjectActivityController.php
│   │   │   ├── AggregationController.php
│   │   │   ├── EcosystemController.php
│   │   │   ├── GdprController.php
│   │   │   ├── ConsentController.php
│   │   │   ├── TenantController.php (legacy)
│   │   │   └── Superadmin/          # 16 controller
│   │   │       ├── DashboardController.php
│   │   │       ├── Ai*.php          (4 controller)
│   │   │       ├── Egili/Equilibrium (2 controller)
│   │   │       ├── Padmin*.php      (5 controller)
│   │   │       └── Platform*.php    (5 controller)
│   │   └── Models/                  # 32 modelli
│   │       ├── Project.php, ProjectAdmin.php, ProjectActivity.php
│   │       ├── User.php, Role.php, Permission.php
│   │       ├── Egi.php, Collection.php, EgiBlockchain.php
│   │       ├── AiFeature.php, PadminViolation.php, PadminSymbol.php
│   │       ├── EgiliTransaction.php, EquilibriumEntry.php
│   │       ├── Promotion.php, FeaturedEgi.php, FeaturePricing.php
│   │       └── UserConsent.php, UserProfile.php, ...
│   ├── routes/api.php              # Tutte le rotte API
│   ├── config/
│   └── composer.json
│
├── frontend/                   # React 18 SPA
│   ├── src/
│   │   ├── pages/              # 37 pagine
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Aggregations.tsx
│   │   │   ├── ComingSoon.tsx
│   │   │   ├── auth/           (Login, Register)
│   │   │   ├── projects/       (List, Dashboard, Activity, Admins, Create, My)
│   │   │   ├── tenants/        (List, Plans, Activity, Storage, Config, Create)
│   │   │   ├── ai/             (Consultations, Credits, Features, Statistics)
│   │   │   ├── tokenomics/     (Egili, Equilibrium)
│   │   │   ├── platform/       (Roles, Pricing, Promotions, Calendar, Ledger)
│   │   │   ├── padmin/         (Dashboard, Violations, Symbols, Search, Statistics)
│   │   │   └── system/         (Config, Security, Domains, Notifications)
│   │   ├── components/
│   │   └── App.tsx
│   ├── vite.config.ts
│   └── package.json
│
├── src/                        # Package florenceegi/hub (condiviso)
│   ├── Models/
│   │   ├── Aggregation.php
│   │   └── AggregationMember.php
│   ├── Traits/
│   │   └── HasAggregations.php
│   ├── Http/Controllers/       # Controller duplicati nel package
│   └── HubServiceProvider.php
│
├── docs/                       # Documentazione
└── composer.json               # Package definition
```

---

## Moduli Funzionali

### 1. Gestione Progetti
**Rotte**: `/api/projects/*`
**Controller**: `ProjectController`, `ProjectAdminController`, `ProjectActivityController`

Gestisce le applicazioni SaaS dell'ecosistema. Ogni "progetto" e un'app indipendente (NATAN_LOC, FlorenceArtEGI, ecc.).

Funzionalita:
- CRUD progetti
- Health check singolo e globale
- Start/stop servizi
- Gestione admin per progetto (owner/admin/viewer)
- Activity log
- Statistiche (attivi/inattivi/maintenance/errore)

### 2. Aggregazioni P2P
**Rotte**: `/api/aggregations/*`
**Controller**: `AggregationController`
**Package**: `florenceegi/hub` (trait `HasAggregations`)

Federazioni consensuali tra tenant di progetti diversi. Es: Comune di Firenze + Comune di Prato creano "Piana Fiorentina" per condividere documenti.

Funzionalita:
- CRUD aggregazioni
- Sistema inviti (invite, accept, reject)
- Gestione membri
- Configurazione condivisione dati

### 3. AI Management
**Rotte**: `/api/superadmin/ai/*`
**Controller**: 4 (Consultations, Credits, Features, Statistics)
**Pagine**: 4

Gestione centralizzata delle funzionalita AI per tutto l'ecosistema.

| Modulo | Funzione |
|--------|----------|
| Consultations | Visualizza/gestisci conversazioni AI cross-project |
| Credits | Allocazione e reset crediti AI per utente |
| Features | Feature flags AI (toggle per slug) |
| Statistics | Analytics d'uso, costi, token consumati |

### 4. Tokenomics
**Rotte**: `/api/superadmin/tokenomics/*`
**Controller**: 2 (Egili, Equilibrium)
**Pagine**: 2

| Modulo | Funzione |
|--------|----------|
| Egili | Mint/burn token Egili, circolazione, storico |
| Equilibrium | Monitoraggio equilibrio economico, ricalcolo |

### 5. Platform Management
**Rotte**: `/api/superadmin/platform/*`
**Controller**: 5 (Roles, Pricing, Promotions, Calendar, Ledger)
**Pagine**: 5

| Modulo | Funzione |
|--------|----------|
| Roles | Gestione ruoli RBAC (Spatie) |
| Feature Pricing | Prezzi per funzionalita piattaforma |
| Promotions | Campagne promozionali |
| Featured Calendar | Calendario contenuti in evidenza |
| Consumption Ledger | Registro consumi risorse, export |

### 6. Padmin / Oracode OS3
**Rotte**: `/api/superadmin/padmin/*`
**Controller**: 5 (Dashboard, Violations, Symbols, Search, Statistics)
**Pagine**: 5

Analisi qualita codice basata su Oracode System 3.0.

| Modulo | Funzione |
|--------|----------|
| Dashboard | Overview metriche + trigger scan |
| Violations | Violazioni regole OS3, severity P0-P3, auto-fix |
| Symbols | Analisi simboli codice (classi, funzioni) |
| Search | Ricerca pattern nel codebase |
| Statistics | Metriche qualita nel tempo |

### 7. Proxy API
**Rotte**: `/api/proxy/*`
**Controller**: `ProjectProxyController`

EGI-HUB fa da intermediario: il frontend invia richieste al HUB, che le inoltra ai backend dei progetti verticali. Supporta GET/POST/PUT/PATCH/DELETE.

### 8. Ecosystem API (Pubbliche)
**Rotte**: `/api/ecosystem/*`
**Controller**: `EcosystemController`

API pubbliche consumate da EGI-HUB-HOME-REACT (florenceegi.com) per visualizzare metriche e stato dell'ecosistema nel 3D.

### 9. Auth & GDPR
**Rotte**: `/api/auth/*`, `/api/privacy/*`, `/api/consents/*`
**Controller**: `AuthController`, `GdprController`, `ConsentController`

- Login/register/logout (Sanctum token-based)
- Profilo utente
- Export dati (diritto alla portabilita)
- Forget me (diritto all'oblio)
- Gestione consensi con version history

### 10. Tenant Management (per Progetto)
**Rotte**: `/api/tenants/*` (legacy)
**Pagine**: 6 (List, Plans, Activity, Storage, Config, Create)

Gestione clienti finali dei progetti. Es: "Comune di Firenze" e un tenant di NATAN_LOC.

### 11. System Config
**Pagine**: 4 (Config, Security, Domains, Notifications)

Configurazione globale piattaforma (frontend predisposto, backend da implementare).

---

## Database

Database unificato PostgreSQL su AWS RDS:

- **Host**: `florenceegi-postgres-dev.c1i0048yu660.eu-north-1.rds.amazonaws.com`
- **Database**: `florenceegi`
- **Schema HUB**: `core` (DB_SEARCH_PATH: `core,public`)

### Tabelle principali (schema core)

| Tabella | Descrizione |
|---------|-------------|
| `system_projects` | Progetti SaaS dell'ecosistema |
| `users` | Utenti (SSOT per tutto l'ecosistema) |
| `roles` / `permissions` | RBAC (Spatie) |
| `tenants` | Clienti finali (cross-project) |
| `aggregations` | Federazioni P2P |
| `aggregation_members` | Membership con status tracking |
| `egis` | Asset NFT |
| `collections` | Collezioni EGI |
| `egi_blockchains` | Dati blockchain |
| `egili_transactions` | Transazioni token Egili |
| `equilibrium_entries` | Storico equilibrio economico |
| `ai_features` | Feature flags AI |
| `padmin_violations` | Violazioni OS3 |
| `padmin_symbols` | Simboli codice analizzati |
| `padmin_scans` | Scansioni qualita |
| `feature_pricings` | Prezzi funzionalita |
| `promotions` | Promozioni |
| `featured_egis` | Calendario in evidenza |
| `consumption_ledgers` | Registro consumi |
| `user_consents` | Consensi GDPR |

### Schema per progetto

| Progetto | Search Path |
|----------|-------------|
| EGI-HUB | `core,public` |
| NATAN_LOC | `natan,core,public` |
| FlorenceArtEGI | `art,core,public` |
| PartnerHub (futuro) | `partner,core,public` |

---

## Relazione con l'Ecosistema

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
```

### Mappa completa app

| App | Dominio | Relazione con HUB | Stato |
|-----|---------|-------------------|-------|
| **EGI-HUB** | hub.florenceegi.com | E' il HUB stesso | Da deployare |
| **EGI-HUB-HOME-REACT** | florenceegi.com | Consuma `/api/ecosystem/` per visualizzazione 3D | LIVE |
| **EGI** (FlorenceArtEGI) | art.florenceegi.com | Progetto registrato, usa package `florenceegi/hub` | LIVE |
| **NATAN_LOC** | natan-loc.florenceegi.com | Progetto registrato, usa package `florenceegi/hub` | Da deployare |
| **EGI-INFO** | info.florenceegi.com | Sito informativo standalone, nessuna integrazione | LIVE |

---

## Come Usare EGI-HUB dai Verticali

### Package florenceegi/hub

I progetti verticali includono il package via composer:
```json
{
    "require": {
        "florenceegi/hub": "@dev"
    },
    "repositories": [
        {"type": "path", "url": "../EGI-HUB"}
    ]
}
```

### Trait HasAggregations

```php
use FlorenceEgi\Hub\Traits\HasAggregations;

class Tenant extends Model {
    use HasAggregations;

    // Metodi disponibili:
    // $tenant->getActiveAggregations()
    // $tenant->getAccessibleTenantIds()
    // $tenant->canAccessTenant($tenantId)
    // $tenant->createAggregation($name, $options)
}
```

---

## Numeri

| Metrica | Valore |
|---------|--------|
| Controller backend | 30 |
| Modelli | 32 |
| Pagine frontend | 37 |
| Rotte API | ~80 |
| Moduli funzionali | 11 |

---

## Deploy

**Dominio**: `hub.florenceegi.com`
**Server**: EC2 privata (`i-0940cdb7b955d1632`, IP 10.0.3.21)
**Web root**: `/home/forge/hub.florenceegi.com/`

Nginx serve:
- Frontend React SPA da `frontend/dist/`
- API Laravel da `backend/public/` (PHP-FPM)

```bash
# Deploy manuale
sudo -u forge bash -c "cd /home/forge/hub.florenceegi.com && \
    git pull origin main && \
    cd backend && composer install --no-dev --optimize-autoloader && \
    php artisan config:cache && php artisan route:cache && php artisan view:cache && \
    cd ../frontend && npm install && npm run build"
sudo systemctl restart php8.3-fpm
```

---

## Riferimenti

- **Architettura SSOT**: `docs/01_PLATFORME_ARCHITECTURE_03.md`
- **Checklist sviluppo**: `docs/CHECKLIST_SVILUPPO.md`
- **Standard OS3**: `docs/Oracode_Systems/`
- **Ecosistema**: `docs/00_ECOSISTEMA.md`
- **Runbook migrazione**: `/home/fabio/EGI/docs/FlorenceEGI/florenceegi_migrazione_ec2_privata_runbook_v1.md`
