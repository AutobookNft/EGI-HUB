# 🌐 EGI-HUB - Contesto per Copilot# 🌐 EGI-HUB - Contesto per Copilot



## Ruolo di EGI-HUB## Stato Attuale (Dicembre 2025)



**EGI-HUB è l'applicazione centrale** che sta **SOPRA** tutta la gerarchia dell'ecosistema FlorenceEGI.EGI-HUB è il layer di coordinamento centrale per l'ecosistema FlorenceEGI.



**NON È:**### ✅ Già Implementato

- ❌ Un package Laravel

- ❌ Una libreria da installare via composer1. **Sistema Aggregazioni P2P** - Permette ai tenant (Comuni) di formare federazioni consensuali

- ❌ Un modulo di EGI2. **Modelli creati**:

   - `src/Models/Aggregation.php`

**È:**   - `src/Models/AggregationMember.php`

- ✅ L'applicazione SuperAdmin centrale3. **Trait**: `src/Traits/HasAggregations.php` (già integrato in Tenant.php di NATAN_LOC)

- ✅ Frontend React + Backend Laravel API4. **Migrazioni**: 

- ✅ Aggrega dati da TUTTI i tenant (EGI, NATAN_LOC, futuri)   - `database/migrations/2025_11_28_000001_create_aggregations_table.php`

   - `database/migrations/2025_11_28_000002_create_aggregation_members_table.php`

---5. **Service Provider**: `src/HubServiceProvider.php`



## Architettura### 🔲 Da Implementare (Prossimi Passi)



```1. **API Controller per Aggregazioni**

                    ┌─────────────────────────────────┐   - CRUD aggregazioni

                    │           EGI-HUB               │   - Sistema inviti (invite, accept, reject)

                    │    (SuperAdmin Central App)     │   - Lista membri

                    │                                 │   - Uscita volontaria

                    │  Frontend: React + TS + Vite    │

                    │  Backend: Laravel API-only      │2. **Frontend Selector**

                    │  Porta Frontend: 5174           │   - Widget per scelta fonti dati nelle query

                    │  Porta Backend: 8001            │   - Visualizzazione aggregazioni disponibili

                    └─────────────────┬───────────────┘

                                      │3. **Integrazione Python Service**

                    ┌─────────────────┼─────────────────┐   - Passare `tenant_ids[]` a MongoDB per query multi-tenant

                    │                 │                 │   - Aggiornare RAG service

                    ▼                 ▼                 ▼

           ┌───────────────┐ ┌───────────────┐ ┌───────────────┐4. **NATAN_DDQF** (Document-Driven Question Framework)

           │      EGI      │ │   NATAN_LOC   │ │   (Futuro)    │   - Framework per domande basate su documenti

           │   Porta 8004  │ │   Porta 8000  │ │               │

           │   TENANT      │ │   TENANT      │ │   TENANT      │## Progetti Collegati

           └───────────────┘ └───────────────┘ └───────────────┘

```| Progetto | Path | Descrizione |

|----------|------|-------------|

---| **NATAN_LOC** | `/home/fabio/NATAN_LOC` | AI Assistant per PA - Usa EGI-HUB come dipendenza |

| **EGI** | `/home/fabio/EGI` | FlorenceArtEGI - Piattaforma NFT |

## Struttura Progetto

## Come Usare EGI-HUB

```

EGI-HUB/### Da NATAN_LOC

├── frontend/           # React SPA (SuperAdmin Dashboard)```php

│   ├── src/// Già configurato in composer.json

│   │   ├── components/use FlorenceEgi\Hub\Traits\HasAggregations;

│   │   ├── pages/

│   │   │   ├── ai/class Tenant extends Model {

│   │   │   ├── padmin/    use HasAggregations;

│   │   │   ├── platform/    

│   │   │   ├── tenants/      # Gestione tenant    // Metodi disponibili:

│   │   │   ├── system/       # Impostazioni sistema    // $tenant->getActiveAggregations()

│   │   │   └── tokenomics/    // $tenant->getAccessibleTenantIds()

│   │   └── App.tsx    // $tenant->canAccessTenant($tenantId)

│   ├── vite.config.ts    // $tenant->createAggregation($name, $options)

│   └── package.json}

│```

├── src/                # Laravel API Backend

│   ├── Http/Controllers/Api/## File di Riferimento

│   │   ├── Superadmin/

│   │   │   ├── DashboardController.php- **README principale**: `/home/fabio/EGI-HUB/README.md`

│   │   │   ├── AiConsultationsController.php- **NATAN_LOC stato**: `docs/NATAN_LOC_STATO_DELLARTE.md`

│   │   │   └── ...- **Standard OS3**: `docs/Oracode_Systems/`

│   │   └── AggregationController.php- **Regole enterprise**: `docs/ULTRA_EXCELLENCE_ENTERPRISE_RULES.md`

│   ├── Models/

│   └── HubServiceProvider.php## Database

│

├── routes/api.php      # API routes (JSON only)EGI-HUB usa il **MariaDB condiviso** con NATAN_LOC e EGI:

├── config/- Host: localhost

├── database/- Database: EGI

└── docs/- Tabelle: `aggregations`, `aggregation_members`

    ├── ARCHITECTURE.md
    └── SUPERADMIN_MIGRATION_PLAN.md
```

---

## Fonti Dati

EGI-HUB prende dati da:

| Fonte | Database | Tipo Dati |
|-------|----------|-----------|
| **EGI** | DB EGI | Users, NFTs, AI consultations, etc. |
| **NATAN_LOC** | DB NATAN | Tenants PA, Documents, AI usage |
| **Tabelle Hub** | DB EGI-HUB | Aggregations, Hub settings, API tokens |

---

## Sezioni SuperAdmin

1. **Dashboard** - Overview globale
2. **Gestione AI** - Consultazioni, crediti, features, statistiche
3. **Tokenomics** - Egili, Equilibrium
4. **Gestione Piattaforma** - Ruoli, pricing, promozioni, calendario
5. **Padmin OS3** - Analizzatore violazioni codice
6. **Gestione Tenant** - Lista tenant, configurazioni, piani, attività, storage
7. **Impostazioni Sistema** - Config, domini, sicurezza, notifiche

---

## Riferimenti

- **Architettura dettagliata**: `docs/ARCHITECTURE.md`
- **Piano migrazione**: `docs/SUPERADMIN_MIGRATION_PLAN.md`
- **Standard OS3**: `docs/Oracode_Systems/`
