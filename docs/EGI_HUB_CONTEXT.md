# 🌐 EGI-HUB - Contesto Operativo

**Versione**: 2.0  
**Data**: 2026-01-12  
**Riferimento Architettura**: `01_PLATFORME_ARCHITECTURE_03.md`

---

## Ruolo di EGI-HUB

**EGI-HUB è il Control Plane** dell'ecosistema FlorenceEGI.

**È:**

- ✅ L'applicazione SuperAdmin centrale
- ✅ Frontend React + Backend Laravel API
- ✅ Orchestratore di tutti i project verticali
- ✅ Gestore delle aggregazioni P2P tra tenant

**NON È:**

- ❌ Un package Laravel da installare via composer
- ❌ Una libreria
- ❌ Un modulo di EGI

---

## Stato Attuale (Gennaio 2026)

### ✅ Già Implementato

1. **Sistema Aggregazioni P2P** - Permette ai tenant di formare federazioni consensuali
2. **Modelli creati**:
   - `src/Models/Aggregation.php`
   - `src/Models/AggregationMember.php`
3. **Trait**: `src/Traits/HasAggregations.php` (usato da Tenant.php nei verticali)
4. **Migrazioni**:
   - `2025_11_28_000001_create_aggregations_table.php`
   - `2025_11_28_000002_create_aggregation_members_table.php`
5. **Service Provider**: `src/HubServiceProvider.php`

### 🔲 Da Implementare

1. **API Controller per Aggregazioni**

   - CRUD aggregazioni
   - Sistema inviti (invite, accept, reject)
   - Lista membri
   - Uscita volontaria

2. **Frontend Selector**

   - Widget per scelta fonti dati nelle query
   - Visualizzazione aggregazioni disponibili

3. **Integrazione Python Service**
   - Passare `tenant_ids[]` a MongoDB per query multi-tenant
   - Aggiornare RAG service

---

## Architettura

```
                    ┌─────────────────────────────────┐
                    │           EGI-HUB               │
                    │      (Control Plane)            │
                    │                                 │
                    │  Frontend: React + TS + Vite    │
                    │  Backend: Laravel API-only      │
                    │  DB: florenceegi (schema core)  │
                    └─────────────────┬───────────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    │                 │                 │
                    ▼                 ▼                 ▼
           ┌───────────────┐ ┌───────────────┐ ┌───────────────┐
           │   NATAN_LOC   │ │  PartnerHub   │ │   (Futuro)    │
           │ (Verticale PA)│ │ (Trasversale) │ │               │
           │   :7000       │ │               │ │               │
           └───────────────┘ └───────────────┘ └───────────────┘
```

---

## Database

EGI-HUB accede al **database unificato** PostgreSQL:

- **Host**: AWS RDS
- **Database**: `florenceegi`
- **Schema**: `core` (primario)
- **DB_SEARCH_PATH**: `core,public`

### Tabelle Gestite

| Tabella               | Schema | Descrizione             |
| --------------------- | ------ | ----------------------- |
| `system_projects`     | core   | Project dell'ecosistema |
| `aggregations`        | core   | Federazioni P2P         |
| `aggregation_members` | core   | Membri aggregazioni     |
| `users`               | core   | Utenti (SSOT)           |
| `roles`               | core   | Ruoli (SSOT)            |
| `tenants`             | core   | Tenant (SSOT)           |

---

## Progetti Collegati

| Progetto      | Path                    | Relazione                             |
| ------------- | ----------------------- | ------------------------------------- |
| **NATAN_LOC** | `/home/fabio/NATAN_LOC` | Verticale PA - usa EGI-HUB traits     |
| **EGI**       | `/home/fabio/EGI`       | FlorenceArtEGI - futuro verticale Art |

---

## Come Usare EGI-HUB da Verticali

### Da NATAN_LOC

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

## Struttura Progetto

```
EGI-HUB/
├── frontend/               # React SPA (SuperAdmin Dashboard)
│   ├── src/
│   │   ├── components/
│   │   └── pages/
│   └── package.json
│
├── backend/                # Laravel Backend
│   ├── app/
│   ├── routes/
│   └── config/
│
├── src/                    # Package FlorenceEgi\Hub
│   ├── Models/
│   │   ├── Aggregation.php
│   │   └── AggregationMember.php
│   ├── Traits/
│   │   └── HasAggregations.php
│   └── HubServiceProvider.php
│
├── database/
│   └── migrations/
│
└── docs/
    ├── 01_PLATFORME_ARCHITECTURE_03.md  ← SSOT
    └── EGI_HUB_CONTEXT.md               ← Questo file
```

---

## Sezioni SuperAdmin (Roadmap)

1. **Dashboard** - Overview globale
2. **Gestione Projects** - Verticali dell'ecosistema
3. **Gestione Tenants** - Clienti finali (cross-project view)
4. **Aggregazioni** - Federazioni P2P
5. **Gestione AI** - Crediti, features, statistiche
6. **Impostazioni Sistema** - Config, sicurezza

---

## Riferimenti

- **Architettura SSOT**: `docs/01_PLATFORME_ARCHITECTURE_03.md`
- **Piano migrazione**: `docs/SUPERADMIN_MIGRATION_PLAN.md`
- **Standard OS3**: `docs/Oracode_Systems/`
