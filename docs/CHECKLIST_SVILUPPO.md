# EGI-HUB Checklist di Sviluppo

Tracciamento dello stato di implementazione per la dashboard SuperAdmin EGI-HUB.
**Ultimo aggiornamento**: 20 febbraio 2026

---

## Architettura & Infrastruttura

- [x] **Monorepo**: `backend/` (Laravel 11) + `frontend/` (React 18) + `src/` (package)
- [x] **Service Provider**: `HubServiceProvider` registrato in `bootstrap/providers.php`
- [x] **Database**: PostgreSQL su AWS RDS (`florenceegi`, schema `core`)
- [x] **Modelli**: 32 modelli creati in `backend/app/Models/`
- [x] **Rotte API**: Tutte le rotte attive in `backend/routes/api.php` (~80 endpoint)
- [x] **Frontend**: 37 pagine React create in `frontend/src/pages/`
- [x] **Auth**: Sanctum token-based (login, register, logout, profile)
- [x] **Package florenceegi/hub**: Aggregation models + HasAggregations trait

---

## Moduli - Stato Implementazione

### Gestione Progetti

| Funzionalita | Backend | Rotta API | Frontend | Stato |
|:---|:---|:---|:---|:---|
| **Lista progetti** | `ProjectController` | `/api/projects` | `ProjectsList.tsx` | Attivo |
| **Dashboard progetto** | `ProjectController` | `/api/projects/{id}` | `ProjectDashboard.tsx` | Attivo |
| **Crea progetto** | `ProjectController` | `POST /api/projects` | `CreateProject.tsx` | Attivo |
| **Health check** | `ProjectController` | `/api/projects/{id}/health` | integrato | Attivo |
| **Start/Stop** | `ProjectController` | `POST /api/projects/{id}/start\|stop` | integrato | Attivo |
| **Admin progetto** | `ProjectAdminController` | `/api/projects/{slug}/admins` | `ProjectAdminsList.tsx` | Attivo |
| **Activity log** | `ProjectActivityController` | `/api/projects/{id}/activities` | `ProjectActivity.tsx` | Attivo |
| **I miei progetti** | `ProjectAdminController` | `/api/my-projects` | `MyProjects.tsx` | Attivo |

### Aggregazioni P2P

| Funzionalita | Backend | Rotta API | Frontend | Stato |
|:---|:---|:---|:---|:---|
| **CRUD aggregazioni** | `AggregationController` | `/api/aggregations` | `Aggregations.tsx` | Attivo |
| **Sistema inviti** | `AggregationController` | `POST /api/aggregations/{id}/invite` | integrato | Attivo |
| **Lista membri** | `AggregationController` | `/api/aggregations/{id}/members` | integrato | Attivo |

### AI Management

| Funzionalita | Backend | Rotta API | Frontend | Stato |
|:---|:---|:---|:---|:---|
| **Consultazioni** | `AiConsultationsController` | `/api/superadmin/ai/consultations` | `ai/Consultations.tsx` | Attivo |
| **Crediti** | `AiCreditsController` | `/api/superadmin/ai/credits` | `ai/Credits.tsx` | Attivo |
| **Features** | `AiFeaturesController` | `/api/superadmin/ai/features` | `ai/Features.tsx` | Attivo |
| **Statistiche** | `AiStatisticsController` | `/api/superadmin/ai/statistics` | `ai/Statistics.tsx` | Attivo |

### Tokenomics

| Funzionalita | Backend | Rotta API | Frontend | Stato |
|:---|:---|:---|:---|:---|
| **Egili** | `EgiliController` | `/api/superadmin/tokenomics/egili` | `tokenomics/Egili.tsx` | Attivo |
| **Equilibrium** | `EquilibriumController` | `/api/superadmin/tokenomics/equilibrium` | `tokenomics/Equilibrium.tsx` | Attivo |

### Platform Management

| Funzionalita | Backend | Rotta API | Frontend | Stato |
|:---|:---|:---|:---|:---|
| **Ruoli** | `RolesController` | `/api/superadmin/platform/roles` | `platform/Roles.tsx` | Attivo |
| **Prezzi** | `FeaturePricingController` | `/api/superadmin/platform/pricing` | `platform/FeaturePricing.tsx` | Attivo |
| **Promozioni** | `PromotionsController` | `/api/superadmin/platform/promotions` | `platform/Promotions.tsx` | Attivo |
| **Calendario** | `FeaturedCalendarController` | `/api/superadmin/platform/featured-calendar` | `platform/FeaturedCalendar.tsx` | Attivo |
| **Ledger** | `ConsumptionLedgerController` | `/api/superadmin/platform/consumption-ledger` | `platform/ConsumptionLedger.tsx` | Attivo |

### Padmin OS3

| Funzionalita | Backend | Rotta API | Frontend | Stato |
|:---|:---|:---|:---|:---|
| **Dashboard** | `PadminDashboardController` | `/api/superadmin/padmin/dashboard` | `padmin/Dashboard.tsx` | Attivo |
| **Violazioni** | `PadminViolationsController` | `/api/superadmin/padmin/violations` | `padmin/Violations.tsx` | Attivo |
| **Simboli** | `PadminSymbolsController` | `/api/superadmin/padmin/symbols` | `padmin/Symbols.tsx` | Attivo |
| **Ricerca** | `PadminSearchController` | `/api/superadmin/padmin/search` | `padmin/Search.tsx` | Attivo |
| **Statistiche** | `PadminStatisticsController` | `/api/superadmin/padmin/statistics` | `padmin/Statistics.tsx` | Attivo |

### Ecosystem API (Pubbliche)

| Funzionalita | Backend | Rotta API | Frontend | Stato |
|:---|:---|:---|:---|:---|
| **Overview** | `EcosystemController` | `/api/ecosystem` | (EGI-HUB-HOME-REACT) | Attivo |
| **Metriche** | `EcosystemController` | `/api/ecosystem/metrics` | (EGI-HUB-HOME-REACT) | Attivo |

### Auth & GDPR

| Funzionalita | Backend | Rotta API | Frontend | Stato |
|:---|:---|:---|:---|:---|
| **Login/Register** | `AuthController` | `/api/auth/login\|register` | `auth/Login.tsx`, `auth/Register.tsx` | Attivo |
| **Profilo** | `AuthController` | `/api/auth/me\|profile` | integrato | Attivo |
| **Export dati** | `GdprController` | `/api/privacy/export` | - | Attivo |
| **Forget me** | `GdprController` | `DELETE /api/privacy/forget-me` | - | Attivo |
| **Consensi** | `ConsentController` | `/api/consents` | - | Attivo |

### Tenant Management

| Funzionalita | Backend | Rotta API | Frontend | Stato |
|:---|:---|:---|:---|:---|
| **Lista tenant** | `TenantController` (legacy) | `/api/tenants` | `tenants/TenantsList.tsx` | Attivo |
| **Piani** | - | - | `tenants/TenantPlans.tsx` | Frontend only |
| **Activity** | `TenantActivityController` | `/api/tenants/{id}/activities` | `tenants/TenantActivity.tsx` | Attivo |
| **Storage** | - | - | `tenants/TenantStorage.tsx` | Frontend only |
| **Config** | - | - | `tenants/TenantConfigurations.tsx` | Frontend only |

### System Config

| Funzionalita | Backend | Rotta API | Frontend | Stato |
|:---|:---|:---|:---|:---|
| **Configurazione** | - | - | `system/SystemConfig.tsx` | Frontend only |
| **Sicurezza** | - | - | `system/SystemSecurity.tsx` | Frontend only |
| **Domini** | - | - | `system/SystemDomains.tsx` | Frontend only |
| **Notifiche** | - | - | `system/SystemNotifications.tsx` | Frontend only |

### Proxy API

| Funzionalita | Backend | Rotta API | Frontend | Stato |
|:---|:---|:---|:---|:---|
| **Aggregate** | `ProjectProxyController` | `/api/proxy/aggregate` | - | Attivo |
| **Proxy singolo** | `ProjectProxyController` | `/api/proxy/{slug}/{path}` | - | Attivo |

---

## Percorso Critico (TODO)

### Priorita 1 - Deploy
- [ ] Deploy su EC2 privata (hub.florenceegi.com)
- [ ] Configurare .env produzione
- [ ] Verificare connessione PostgreSQL RDS

### Priorita 2 - Backend mancante
- [ ] Implementare controller per System Config (4 pagine frontend senza backend)
- [ ] Implementare controller per Tenant Plans/Storage/Config

### Priorita 3 - Middleware & Sicurezza
- [ ] Aggiungere middleware `auth:sanctum` alle rotte superadmin (attualmente aperte)
- [ ] Aggiungere middleware ruolo superadmin
- [ ] Rate limiting sulle API

### Priorita 4 - Pulizia
- [ ] Rimuovere rotte legacy `/api/tenants/*` quando frontend migrato a `/api/projects/*`
- [ ] Verificare duplicazione controller tra `backend/app/` e `src/` (package)
