# 🏗️ FlorenceEGI Platform Architecture v3.0

> **Versione**: 3.0  
> **Data**: 2026-01-12  
> **Autore**: Fabio Cherici + Antigravity AI  
> **Stato**: ✅ APPROVATA - Single Source of Truth  
> **Sostituisce**: v2.1 (01_PLATFORME_ARCHITECTURE_01.md), PROJECTS_VS_TENANTS.md

---

## 📋 Changelog

| Versione | Data | Modifiche |
|----------|------|-----------|
| **3.0** | 2026-01-12 | Architettura unificata, tenants in core, project trasversali, pulizia schema public |
| 2.1 | 2026-01-09 | SSOT, centralizzazione progetti |
| 2.0 | 2025-12-03 | Separazione Projects vs Tenants |

---

## 🎯 Principi Fondamentali

### 1. Single Source of Truth (SSOT)
- **UN SOLO DATABASE**: `florenceegi` (AWS RDS PostgreSQL)
- **UNA SOLA tabella `users`**: in `core` schema
- **UNA SOLA tabella `tenants`**: in `core` schema
- **UNA SOLA tabella `roles/permissions`**: in `core` schema

### 2. Schema PostgreSQL come Isolamento
- Gli schemi PostgreSQL (`core`, `natan`, `partner`, etc.) sostituiscono database separati
- Ogni project verticale ha il suo schema per dati specifici
- I dati condivisi risiedono in `core`

### 3. Project Trasversali
- Alcuni project (es. PartnerHub) accedono trasversalmente ai tenant di altri project
- L'architettura supporta nativamente questo pattern

---

## 📊 Visione Generale

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│                         ┌─────────────────────┐                             │
│                         │      EGI-HUB        │                             │
│                         │   Control Plane     │                             │
│                         │                     │                             │
│                         │  • Gestisce Projects│                             │
│                         │  • Monitora Health  │                             │
│                         │  • Aggregazioni P2P │                             │
│                         └──────────┬──────────┘                             │
│                                    │                                        │
│           ┌────────────────────────┼────────────────────────┐               │
│           │                        │                        │               │
│           ▼                        ▼                        ▼               │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐         │
│  │   NATAN_LOC     │    │   PartnerHub    │    │ FlorenceArtEGI  │         │
│  │                 │    │   (FUTURO)      │    │   (FUTURO)      │         │
│  │  Verticale PA   │    │   Trasversale   │    │  Verticale Art  │         │
│  │  Comuni, Enti   │    │   Billing/CRM   │    │  Gallerie, NFT  │         │
│  └────────┬────────┘    └────────┬────────┘    └────────┬────────┘         │
│           │                      │                      │                   │
│           └──────────────────────┼──────────────────────┘                   │
│                                  │                                          │
│                                  ▼                                          │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                    DATABASE: florenceegi                              │  │
│  │                    (AWS RDS PostgreSQL)                               │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Architettura Database

### Database Unificato

```
Database: florenceegi (AWS RDS PostgreSQL)
│
├── Schema: core (SHARED - Dati Condivisi)
│   │
│   ├── 🏢 ENTITÀ PRINCIPALI
│   │   ├── system_projects     → I project dell'ecosistema (NATAN_LOC, PartnerHub, etc.)
│   │   ├── tenants             → Clienti finali (Comuni, Gallerie, Aziende)
│   │   └── users               → Utenti di tutto l'ecosistema
│   │
│   ├── 🔐 AUTENTICAZIONE & AUTORIZZAZIONE
│   │   ├── roles               → Ruoli (superadmin, pa_entity, company, etc.)
│   │   ├── permissions         → Permessi granulari
│   │   ├── model_has_roles     → Assegnazione ruoli
│   │   └── role_has_permissions
│   │
│   ├── 🤝 AGGREGAZIONI P2P
│   │   ├── aggregations        → Federazioni tra tenant
│   │   └── aggregation_members → Membri delle aggregazioni
│   │
│   ├── 🎨 EGI CORE
│   │   ├── egis                → Asset digitali certificati
│   │   ├── collections         → Collezioni di EGI
│   │   ├── egi_blockchain      → Ancoraggio blockchain
│   │   └── trait_*, coa_*      → Metadata e certificati
│   │
│   ├── 📋 GDPR & COMPLIANCE
│   │   ├── consent_*           → Gestione consensi
│   │   ├── privacy_*           → Privacy policies
│   │   └── gdpr_*              → Audit GDPR
│   │
│   └── 🔧 INFRASTRUTTURA
│       ├── sessions            → Sessioni utente
│       ├── cache               → Cache applicativa
│       ├── migrations          → Tracking migrazioni
│       └── error_logs          → Log errori centralizzato
│
├── Schema: natan (NATAN_LOC Specific)
│   │
│   ├── 💬 AI & CHAT
│   │   ├── natan_chat_messages → Messaggi chat AI (tenant_id → core.tenants)
│   │   ├── natan_user_memories → Memorie utente per AI
│   │   └── natan_faro_queries  → Query al sistema FARO
│   │
│   ├── 🏛️ PA SPECIFIC
│   │   ├── pa_acts             → Atti amministrativi
│   │   └── bulletin_posts      → Bacheca comunicazioni
│   │
│   └── 🔧 INFRASTRUTTURA
│       ├── cache               → Cache specifica NATAN
│       └── migrations          → Migrazioni NATAN
│
├── Schema: partner (PartnerHub - FUTURO)
│   │
│   ├── 💰 BILLING
│   │   ├── invoices            → Fatture
│   │   ├── subscriptions       → Abbonamenti
│   │   └── payments            → Pagamenti
│   │
│   └── 📊 CRM
│       ├── contracts           → Contratti
│       └── leads               → Lead commerciali
│
└── Schema: public
    └── (VUOTO - Solo per compatibilità PostgreSQL)
```

```

### 🧠 Pattern: Monotenant vs Multitenant

Questa architettura unificata rende banale la differenza tra progetti mono e multi tenant. Tutto dipende dalla configurazione e dal numero di record in `tenants`.

| Tipo Progetto | Configurazione | Struttura Dati | Esempio |
|---------------|----------------|----------------|---------|
| **Multitenant** | `is_multitenant: true` | 1 Project → N Tenants | **NATAN_LOC** (Comuni diversi, dati isolati) |
| **Monotenant** | `is_multitenant: false` | 1 Project → 1 Tenant | **FlorenceEGI** (Gestione centrale, users admin) |
| **Ibrido** | `is_multitenant: true` | 1 Project → 1 SysTenant + N ClientTenants | **PartnerHub** (Tenant "Ops" + Clienti) |

**Vantaggio**: Il codice di autenticazione (`WHERE tenant_id = ?`) non cambia mai. Un'app monotenant è semplicemente un'app che accetta user solo da un specifico tenant_id.

---

## 🏷️ Terminologia Definitiva

### Projects (system_projects)

I **Projects** sono le applicazioni SaaS dell'ecosistema FlorenceEGI.

| Project | Tipo | Schema Dati | Descrizione |
|---------|------|-------------|-------------|
| **NATAN_LOC** | Verticale | `natan` | AI Assistant per PA (Comuni, Enti) |
| **FlorenceArtEGI** | Verticale | `art` (futuro) | Piattaforma NFT per artisti |
| **PartnerHub** | Trasversale | `partner` (futuro) | Gestione commerciale ecosistema |
| **EGI-HUB** | Control Plane | `core` | Orchestratore centrale |

### Tenants (core.tenants)

I **Tenants** sono i clienti finali che utilizzano i project.

| Tenant | Tipo | Project Principale | Accesso Da |
|--------|------|-------------------|------------|
| Comune di Firenze | PA | NATAN_LOC | NATAN_LOC |
| Comune di Prato | PA | NATAN_LOC | NATAN_LOC |
| Galleria XYZ | Artista | FlorenceArtEGI | FlorenceArtEGI |
| Partner ABC | Partner | PartnerHub | PartnerHub + NATAN_LOC |

**Nota**: Un tenant appartiene a un `system_project_id` principale, ma può essere accessibile da project trasversali (es. PartnerHub accede ai tenant di NATAN_LOC per billing).

### 💡 Caso Speciale: Florence EGI (System Tenant)

**Domanda**: Perché "Florence EGI" esiste sia come Project (`FEGI`) sia come Tenant (`FEGI`)?

**Risposta**: È una best practice architetturale per garantire uniformità.

1.  **Uniformità User Model**: Tutti gli utenti *devono* avere un `tenant_id`. Gli amministratori di sistema (root, staff centrale) non fanno eccezione. Invece di avere `tenant_id = NULL` e complicare le query con `OR IS NULL`, li assegniamo al "System Tenant" (Florence EGI).
2.  **Isolamento Dati**: Il progetto madre potrebbe avere asset propri (es. una collezione NFT istituzionale). Questi dati devono essere isolati dai tenant dei clienti, proprio come i dati di un cliente sono isolati da quelli di un altro.
3.  **Scalabilità**: Il System Tenant è trattato come un "primo tra pari". Ha permessi speciali, ma strutturalmente è identico agli altri, semplificando la logica del codice.

| Entità | Ruolo | Tabella | Note |
|--------|-------|---------|------|
| **Project FlorenceEGI** | L'Applicazione | `system_projects` | Definisce il software che gira |
| **Tenant Florence EGI** | Il Proprietario | `tenants` | Contiene gli utenti admin e i dati di sistema |

### Aggregazioni P2P

Le **Aggregazioni** sono federazioni consensuali tra tenant **dello stesso project** per condividere dati.

```
┌─────────────────┐         ┌─────────────────┐
│ Comune Firenze  │◄───────►│  Comune Prato   │
│   (tenant 2)    │   P2P   │   (tenant 4)    │
│                 │  Share  │                 │
│  Documenti:     │◄───────►│  Documenti:     │
│  • Delibere     │         │  • Delibere     │
│  • Regolamenti  │         │  • Regolamenti  │
└─────────────────┘         └─────────────────┘
         │                           │
         │      ┌───────────┐        │
         └─────►│ RAG Query │◄───────┘
                │ Aggregata │
                └───────────┘
```

**Tabelle coinvolte**:
- `core.aggregations` → Definizione aggregazione
- `core.aggregation_members` → Tenant partecipanti

---

## 🔗 Relazioni Chiave

### Diagramma ER Semplificato

```
┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│ system_projects  │       │     tenants      │       │      users       │
├──────────────────┤       ├──────────────────┤       ├──────────────────┤
│ id (PK)          │◄──────┤ system_project_id│       │ id (PK)          │
│ name             │   1:N │ id (PK)          │◄──────┤ tenant_id (FK)   │
│ slug             │       │ name             │   1:N │ email            │
│ status           │       │ slug             │       │ name             │
└──────────────────┘       │ entity_type      │       └──────────────────┘
                           │ is_active        │
                           └────────┬─────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
           ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐
           │ aggregations │ │aggregation_  │ │natan_chat_       │
           ├──────────────┤ │   members    │ │    messages      │
           │created_by_   │ ├──────────────┤ ├──────────────────┤
           │ tenant_id(FK)│ │tenant_id(FK) │ │tenant_id (FK)    │
           │name          │ │aggregation_id│ │user_id (FK)      │
           └──────────────┘ └──────────────┘ │message           │
                                             └──────────────────┘
```

---

## ⚙️ Configurazione Connessioni

### DB_SEARCH_PATH per Project

```env
# EGI-HUB (Control Plane - Accesso completo a core)
DB_SEARCH_PATH=core,public

# NATAN_LOC (Verticale PA)
DB_SEARCH_PATH=natan,core,public
# → Prima cerca in natan (dati specifici)
# → Poi in core (users, tenants, roles condivisi)

# PartnerHub (Trasversale - FUTURO)
DB_SEARCH_PATH=partner,core,public
# → Accede a core.tenants di TUTTI i project

# FlorenceArtEGI (Verticale Art - FUTURO)
DB_SEARCH_PATH=art,core,public
```

### Logica di Accesso ai Dati

| Project | core.tenants | core.users | core.roles | Schema specifico |
|---------|--------------|------------|------------|------------------|
| **EGI-HUB** | R/W (tutti) | R/W | R/W | - |
| **NATAN_LOC** | R/W (WHERE system_project_id=2) | R/W | R | natan.* |
| **PartnerHub** | R (tutti - trasversale) | R | R | partner.* |
| **FlorenceArtEGI** | R/W (WHERE system_project_id=X) | R/W | R | art.* |

---

## 🔄 Flussi Principali

### Flusso: Nuovo Tenant in NATAN_LOC

```
1. Admin NATAN_LOC crea tenant "Comune di Milano"
                    │
                    ▼
2. INSERT INTO core.tenants (
     name = 'Comune di Milano',
     system_project_id = 2,  -- NATAN_LOC
     entity_type = 'pa'
   )
                    │
                    ▼
3. Tenant disponibile in NATAN_LOC
   (e visibile da PartnerHub per billing futuro)
```

### Flusso: Aggregazione P2P tra Tenant

```
1. Admin Comune Firenze crea aggregazione "Comuni Toscana"
                    │
                    ▼
2. INSERT INTO core.aggregations (
     name = 'Comuni Toscana',
     created_by_tenant_id = 2  -- Comune Firenze
   )
                    │
                    ▼
3. Invita Comune di Prato (tenant_id = 4)
                    │
                    ▼
4. INSERT INTO core.aggregation_members (
     aggregation_id = 1,
     tenant_id = 4,
     status = 'pending'
   )
                    │
                    ▼
5. Comune Prato accetta → status = 'active'
                    │
                    ▼
6. RAG Query può ora cercare nei documenti
   di ENTRAMBI i tenant aggregati
```

### Flusso: Chat AI in NATAN_LOC

```
1. Utente (user_id=5, tenant_id=2) invia messaggio
                    │
                    ▼
2. INSERT INTO natan.natan_chat_messages (
     user_id = 5,        -- FK → core.users
     tenant_id = 2,      -- FK → core.tenants
     conversation_id = 'uuid',
     message = 'Domanda...'
   )
                    │
                    ▼
3. Python RAG Service riceve query
   - Determina tenant_id = 2
   - Verifica aggregazioni attive
   - Query MongoDB con tenant_ids[]
                    │
                    ▼
4. Risposta salvata in natan.natan_chat_messages
```

---

## 🏛️ Tipi di Project

### 1. Project Verticali

Servono un dominio specifico con tenant propri.

```
NATAN_LOC (Verticale PA)
├── Tenant: Comuni, Regioni, Enti pubblici
├── Dati specifici: natan.* (chat, pa_acts, etc.)
└── Isolamento: Ogni tenant vede solo i suoi dati

FlorenceArtEGI (Verticale Art)
├── Tenant: Gallerie, Artisti, Musei
├── Dati specifici: art.* (artworks, nfts, etc.)
└── Isolamento: Ogni tenant vede solo i suoi dati
```

### 2. Project Trasversali

Accedono ai tenant di altri project per funzioni cross-cutting.

```
PartnerHub (Trasversale Commerciale)
├── Accede a: core.tenants (TUTTI)
├── Funzioni: Billing, Contratti, CRM
├── Dati specifici: partner.* (invoices, subscriptions)
└── Non ha "suoi" tenant, gestisce quelli degli altri
```

### 3. Control Plane

Orchestrazione e governance dell'ecosistema.

```
EGI-HUB (Control Plane)
├── Gestisce: system_projects, aggregations
├── Monitora: Health di tutti i project
├── Amministra: Users, Roles globali
└── Accesso: Completo a core.*
```

---

## 📁 Struttura Codebase

### Repository NATAN_LOC

```
/home/fabio/NATAN_LOC/
├── laravel_backend/
│   ├── app/
│   │   ├── Models/
│   │   │   ├── User.php          → Usa core.users
│   │   │   ├── Tenant.php        → Usa core.tenants
│   │   │   └── NatanChatMessage.php → Usa natan.natan_chat_messages
│   │   └── Services/
│   │       └── NatanChatService.php
│   ├── config/database.php       → search_path: natan,core,public
│   └── .env                      → DB_SEARCH_PATH=natan,core,public
├── python_ai_service/            → RAG, embeddings, AI
├── frontend/                     → Vanilla TS + Vite
└── docs/Core/
    └── 01_PLATFORME_ARCHITECTURE_03.md  ← QUESTO FILE (SSOT)
```

### Repository EGI-HUB

```
/home/fabio/EGI-HUB/
├── backend/
│   ├── app/
│   │   ├── Models/
│   │   │   ├── Project.php       → core.system_projects
│   │   │   └── Aggregation.php   → core.aggregations (via package)
│   │   └── Services/
│   ├── config/database.php       → search_path: core,public
│   └── .env                      → DB_SEARCH_PATH=core,public
├── src/                          → Package FlorenceEgi\Hub
│   ├── Models/
│   │   ├── Aggregation.php
│   │   └── AggregationMember.php
│   └── Traits/
│       └── HasAggregations.php   → Trait per model Tenant
└── frontend/                     → React dashboard
```

---

## 🔐 Sicurezza e Isolamento

### Isolamento Dati Tenant

```php
// In ogni query che tocca dati tenant-specific:
// Il middleware TenantScope aggiunge automaticamente il filtro

// Esempio in NatanChatMessage
protected static function booted()
{
    static::addGlobalScope('tenant', function ($query) {
        if (auth()->check() && auth()->user()->tenant_id) {
            $query->where('tenant_id', auth()->user()->tenant_id);
        }
    });
}
```

### Accesso Cross-Tenant (solo per aggregazioni)

```php
// Il RAG Service può accedere a tenant aggregati
$accessibleTenants = $user->tenant->getAccessibleTenantIds();
// Ritorna: [2, 4] se tenant 2 è aggregato con tenant 4

$messages = NatanChatMessage::whereIn('tenant_id', $accessibleTenants)->get();
```

---

## ✅ Checklist Implementazione

### Database ✅

- [x] Schema `core` con tabelle condivise
- [x] Schema `natan` con tabelle specifiche
- [x] Schema `public` svuotato (solo per compatibilità)
- [x] FK cross-schema funzionanti
- [x] `tenants` in `core` con `system_project_id`

### NATAN_LOC ✅

- [x] DB_SEARCH_PATH=natan,core,public
- [x] Model User punta a core.users
- [x] Model Tenant punta a core.tenants
- [x] NatanChatMessage in natan con FK a core

### EGI-HUB ✅

- [x] DB_SEARCH_PATH=core,public
- [x] Gestione system_projects
- [x] Gestione aggregations
- [x] Package con HasAggregations trait

### Futuro 🔮

- [ ] Schema `partner` per PartnerHub
- [ ] Schema `art` per FlorenceArtEGI
- [ ] Federazione cross-project (se necessaria)

---

## 📚 Documenti Correlati

| Documento | Stato | Note |
|-----------|-------|------|
| `01_PLATFORME_ARCHITECTURE_03.md` | ✅ ATTIVO | Questo file - SSOT |
| `01_PLATFORME_ARCHITECTURE_01.md` | ⚠️ OBSOLETO | Sostituito da v3.0 |
| `02_PROJECTS_VS_TENANTS.md` | ⚠️ OBSOLETO | Integrato in v3.0 |
| `00_NATAN_LOC_STATO_DELLARTE.md` | 🔄 DA VERIFICARE | Aggiornare riferimenti |
| `FLORENCEEGI_ARCHITECTURE.md` | ⚠️ OBSOLETO | Sostituito da v3.0 |

---

## 🔧 Troubleshooting

### Errore: "relation does not exist"

**Causa**: search_path non configurato correttamente.

```bash
# Verifica search_path
php artisan tinker --execute="DB::select('SHOW search_path')"

# Deve mostrare: natan, core, public (per NATAN_LOC)
```

### Errore: FK violation su tenant_id

**Causa**: Tentativo di inserire tenant_id che non esiste in core.tenants.

```sql
-- Verifica tenant esiste
SELECT * FROM core.tenants WHERE id = <tenant_id>;
```

### Chat messages non salvati con tenant_id

**Causa**: `tenant_id` non in `$fillable` del model.

```php
// In NatanChatMessage.php
protected $fillable = [
    'user_id',
    'tenant_id',  // ← DEVE ESSERE PRESENTE
    'conversation_id',
    // ...
];
```

---

*Documento generato il 12 Gennaio 2026 - v3.0*
