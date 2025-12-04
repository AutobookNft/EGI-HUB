# 🏛️ FlorenceEGI - Architettura MTS-Core

**Data:** 4 Dicembre 2025  
**Autore:** Fabio Cherici  
**Status:** ✅ DEFINITIVO  
**Versione:** 1.0

---

## 📋 Indice

1. [Executive Summary](#1-executive-summary)
2. [Pattern Architetturale: MTS-Core](#2-pattern-architetturale-mts-core)
3. [I Tre Layer dell'Ecosistema](#3-i-tre-layer-dellecosistema)
4. [EGI Core - Il Cuore del Sistema](#4-egi-core---il-cuore-del-sistema)
5. [EGI-HUB - L'Orchestratore](#5-egi-hub---lorchestatore)
6. [Projects Layer - Le Applicazioni Verticali](#6-projects-layer---le-applicazioni-verticali)
7. [NATAN_LOC - Multi-Tenant Hierarchical Model](#7-natan_loc---multi-tenant-hierarchical-model)
8. [Flusso Dati e Integrazioni](#8-flusso-dati-e-integrazioni)
9. [RAG e Aggregazioni](#9-rag-e-aggregazioni)
10. [Database Architecture](#10-database-architecture)
11. [Roadmap Tecnologica](#11-roadmap-tecnologica)

---

## 1. Executive Summary

**FlorenceEGI** non è un semplice SaaS multi-tenant. È un ecosistema basato su un pattern architetturale avanzato che chiamiamo:

### 👉 MTS-Core Architecture
**M**ono-**T**enant **S**ystem **Core** + **Multi-Tenant Subdomains**

Questo pattern è utilizzato da piattaforme enterprise come:
- **Google Workspace** (Core Google + Apps verticali)
- **Shopify** (Core Commerce + Apps ecosystem)
- **Salesforce** (Core CRM + Clouds verticali)

**La differenza fondamentale:** nel nostro caso il "dato base" non è il CRM o il Commerce, ma l'**EGI** (Encrypted Genuine Item) - l'unità digitale che rappresenta asset autenticati, ancorati su blockchain e validati da AI.

---

## 2. Pattern Architetturale: MTS-Core

### Definizione

```
MTS-Core = Mono-Tenant System Core + Multi-Tenant Subdomains
```

### Caratteristiche Chiave

| Aspetto | Implementazione FlorenceEGI |
|---------|----------------------------|
| **Strato Base Unico** | EGI Core (PostgreSQL) - condiviso da tutti |
| **Applicazioni Verticali** | Projects (NATAN_LOC, FlorenceArtEGI, ...) |
| **Isolamento Configurabile** | Ogni app decide se isolare o condividere |
| **Governance Comune** | EGI-HUB come orchestratore centrale |
| **Audit Comune** | Log centralizzato delle operazioni |
| **Sicurezza Uniforme** | Autenticazione e autorizzazione centralizzate |
| **Blockchain Layer** | Algorand condiviso per tutti gli EGI |

### Vantaggi

1. **Scalabilità Orizzontale**: Nuovi progetti senza modificare il core
2. **Isolamento Garantito**: Dati separati quando serve
3. **Condivisione Controllata**: Aggregazioni P2P configurabili
4. **Evoluzione Indipendente**: Ogni progetto ha il suo ciclo di sviluppo
5. **Costi Ottimizzati**: Infrastruttura core condivisa

---

## 3. I Tre Layer dell'Ecosistema

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                                                                               ║
║                          LAYER 1: EGI CORE                                    ║
║                         (Mono-Tenant System)                                  ║
║                                                                               ║
║   ┌─────────────────────────────────────────────────────────────────────┐    ║
║   │                      PostgreSQL (egi_core)                          │    ║
║   │                                                                     │    ║
║   │   ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────────────┐  │    ║
║   │   │collections│ │   egis    │ │blockchain │ │  ai_validations   │  │    ║
║   │   │           │ │  (CORE)   │ │  anchors  │ │                   │  │    ║
║   │   └───────────┘ └───────────┘ └───────────┘ └───────────────────┘  │    ║
║   │                                                                     │    ║
║   │   • Asset digitali autenticati                                     │    ║
║   │   • Ancoraggi blockchain (Algorand)                                │    ║
║   │   • Validazioni AI                                                 │    ║
║   │   • Ownership tracking                                             │    ║
║   └─────────────────────────────────────────────────────────────────────┘    ║
║                                                                               ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║                          LAYER 2: EGI-HUB                                     ║
║                        (Orchestration Layer)                                  ║
║                                                                               ║
║   ┌─────────────────────────────────────────────────────────────────────┐    ║
║   │                      MariaDB (HUB_EGI)                               │    ║
║   │                                                                     │    ║
║   │   ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────────────┐  │    ║
║   │   │ projects  │ │  project  │ │aggregation│ │      users        │  │    ║
║   │   │           │ │  admins   │ │    s      │ │  (SuperAdmin)     │  │    ║
║   │   └───────────┘ └───────────┘ └───────────┘ └───────────────────┘  │    ║
║   │                                                                     │    ║
║   │   • Gestione Projects (applicazioni SaaS)                          │    ║
║   │   • Project Admins (chi gestisce cosa)                             │    ║
║   │   • Aggregazioni P2P tra tenant                                    │    ║
║   │   • Health monitoring                                              │    ║
║   │   • API Gateway verso i progetti                                   │    ║
║   └─────────────────────────────────────────────────────────────────────┘    ║
║                                                                               ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║                       LAYER 3: PROJECTS                                       ║
║                    (Multi-Tenant Applications)                                ║
║                                                                               ║
║   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐      ║
║   │   NATAN_LOC     │  │  FlorenceArt    │  │     [Future Apps]       │      ║
║   │   (MariaDB)     │  │    EGI          │  │                         │      ║
║   │                 │  │   (MariaDB)     │  │  • E-commerce EGI       │      ║
║   │  Multi-Tenant   │  │                 │  │  • Museum Platform      │      ║
║   │  + Multi-Branch │  │  Mono-Tenant    │  │  • Certification App    │      ║
║   │  + Hierarchical │  │  (Marketplace)  │  │  • ...                  │      ║
║   │                 │  │                 │  │                         │      ║
║   └─────────────────┘  └─────────────────┘  └─────────────────────────┘      ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

---

## 4. EGI Core - Il Cuore del Sistema

### Cos'è un EGI?

**EGI** = **E**ncrypted **G**enuine **I**tem

Un EGI è l'unità fondamentale dell'ecosistema FlorenceEGI. Rappresenta:

- **Asset Digitale Autenticato**: Qualsiasi contenuto digitale con prova di autenticità
- **Ancoraggio Blockchain**: Hash del contenuto scritto su Algorand
- **Validazione AI**: Verifica automatica di autenticità e integrità
- **Ownership Tracciabile**: Storico completo della proprietà

### Casi d'Uso EGI

| Progetto | Tipo EGI | Esempio |
|----------|----------|---------|
| **FlorenceArtEGI** | Opera d'arte digitale | NFT di un dipinto |
| **NATAN_LOC** | Documento PA | Delibera comunale certificata |
| **[Futuro]** | Certificato | Diploma universitario |
| **[Futuro]** | Prodotto | Certificato autenticità Made in Italy |

### Database EGI Core (PostgreSQL)

```sql
-- Il database EGI Core sarà PostgreSQL per:
-- • JSONB per metadata flessibili
-- • Full-text search avanzato
-- • Scalabilità per milioni di EGI
-- • Row-level security

-- Tabelle principali:
-- • collections: raggruppamenti di EGI
-- • egis: gli asset digitali (IL CORE)
-- • blockchain_anchors: riferimenti on-chain
-- • ai_validations: validazioni AI
-- • ownership_history: storico proprietà
```

---

## 5. EGI-HUB - L'Orchestratore

### Ruolo

EGI-HUB è il **control plane** dell'ecosistema. Non contiene business logic delle applicazioni, ma:

1. **Gestisce i Projects**: Registra e monitora le applicazioni SaaS
2. **Gestisce gli Accessi**: Chi può amministrare quale progetto
3. **Aggrega Dati**: Sistema di aggregazioni P2P tra tenant
4. **Monitora la Salute**: Health check di tutti i servizi
5. **Fa da Gateway**: Proxy API verso i progetti

### Utenti EGI-HUB

| Ruolo | Accesso | Può fare |
|-------|---------|----------|
| **SuperAdmin** | Tutti i progetti | Tutto |
| **Project Admin** | Solo il suo progetto | Gestire tenant, utenti, config |
| **Viewer** | Solo lettura | Dashboard, report |

### Schema di Navigazione

```
SuperAdmin Login
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│                    EGI-HUB Dashboard                        │
│                                                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │  NATAN_LOC  │ │ Florence    │ │   [+Nuovo]  │           │
│  │   ● Online  │ │ ArtEGI      │ │   Project   │           │
│  │   [ENTRA]   │ │  ○ Offline  │ │             │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
│                                                             │
│  [Dashboard] [AI Stats] [Tokenomics] [Settings]            │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ Click "ENTRA" su NATAN_LOC
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              PROJECT ADMIN: NATAN_LOC                       │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  👤 Fabio (SuperAdmin) │ Project: NATAN_LOC           │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │  Tenants    │ │   Users     │ │  Settings   │           │
│  │             │ │             │ │             │           │
│  │  Firenze    │ │  Admin1     │ │  API Keys   │           │
│  │  Prato      │ │  Admin2     │ │  Config     │           │
│  │  [+Nuovo]   │ │  [+Nuovo]   │ │             │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
│                                                             │
│  [← Torna a EGI-HUB]                                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Projects Layer - Le Applicazioni Verticali

### Definizione di "Project"

Un **Project** in FlorenceEGI è un'applicazione SaaS verticale che:

- Ha il proprio database
- Ha i propri utenti
- Può essere mono-tenant o multi-tenant
- Si integra con EGI Core per gli asset digitali
- È orchestrato da EGI-HUB

### Projects Attuali

| Project | Tipo | Database | Descrizione |
|---------|------|----------|-------------|
| **NATAN_LOC** | Multi-Tenant Hierarchical | MariaDB (forge) | AI Assistant per PA |
| **FlorenceArtEGI** | Mono-Tenant | MariaDB (egi_db) | NFT Marketplace |

### Projects Futuri (Potenziali)

| Project | Tipo | Descrizione |
|---------|------|-------------|
| **EGI-Certify** | Multi-Tenant | Certificazione documenti |
| **EGI-Museum** | Multi-Tenant | Gestione collezioni museali |
| **EGI-Commerce** | Multi-Tenant | E-commerce prodotti certificati |

---

## 7. NATAN_LOC - Multi-Tenant Hierarchical Model

### Pattern Architetturale

NATAN_LOC implementa un pattern molto avanzato e raro:

### 👉 Multi-Tenant Hierarchical Model

Questo va **oltre** la multi-tenancy classica perché gestisce:

```
┌─────────────────────────────────────────────────────────────────┐
│                         NATAN_LOC                               │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    TENANT (Ente)                         │   │
│  │                  es. Comune di Firenze                   │   │
│  │                                                          │   │
│  │   ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │   │
│  │   │   BRANCH    │ │   BRANCH    │ │   BRANCH    │       │   │
│  │   │  Anagrafe   │ │  Urbanist.  │ │  Cultura    │       │   │
│  │   │             │ │             │ │             │       │   │
│  │   │ ┌─────────┐ │ │ ┌─────────┐ │ │ ┌─────────┐ │       │   │
│  │   │ │  TEAM   │ │ │ │  TEAM   │ │ │ │  TEAM   │ │       │   │
│  │   │ │ Front   │ │ │ │ Edilizia│ │ │ │ Eventi  │ │       │   │
│  │   │ │ Office  │ │ │ │ Privata │ │ │ │         │ │       │   │
│  │   │ └─────────┘ │ │ └─────────┘ │ │ └─────────┘ │       │   │
│  │   └─────────────┘ └─────────────┘ └─────────────┘       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    TENANT (Ente)                         │   │
│  │                   es. Comune di Prato                    │   │
│  │                         ...                              │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Funzionalità Avanzate NATAN_LOC

| Feature | Descrizione |
|---------|-------------|
| **Data Isolation** | Isolamento completo tra tenant |
| **Branch Hierarchy** | Tenant → Branch → Team |
| **Data Aggregation** | Aggregazioni P2P configurabili |
| **RAG Sharing** | Condivisione controllata per AI |
| **Messaging** | Chat e bacheca con visibilità configurabile |
| **Document Policies** | Accesso granulare per documento |
| **Core Integration** | Accesso a EGI senza rompere isolamento |

### Aggregazioni P2P

```
┌─────────────────┐         ┌─────────────────┐
│ Comune Firenze  │◄───────►│  Comune Prato   │
│                 │   P2P   │                 │
│  Documenti:     │  Share  │  Documenti:     │
│  • Delibere     │◄───────►│  • Delibere     │
│  • Regolamenti  │         │  • Regolamenti  │
└─────────────────┘         └─────────────────┘
         │                           │
         │      ┌───────────┐        │
         └─────►│ RAG Query │◄───────┘
                │ Aggregata │
                └───────────┘
```

---

## 8. Flusso Dati e Integrazioni

### Flusso Creazione EGI

```
1. Utente in NATAN_LOC carica documento
                    │
                    ▼
2. NATAN_LOC chiama EGI-HUB API
   POST /api/egi/create
                    │
                    ▼
3. EGI-HUB valida permessi e forwarda a EGI Core
                    │
                    ▼
4. EGI Core (PostgreSQL):
   • Crea record EGI
   • Genera hash contenuto
   • Chiama AI Validation
   • Prepara ancoraggio blockchain
                    │
                    ▼
5. Algorand Blockchain:
   • Transazione con hash EGI
   • Conferma ancoraggio
                    │
                    ▼
6. EGI Core aggiorna stato: "anchored"
                    │
                    ▼
7. Risposta a NATAN_LOC con EGI ID
```

### Flusso Query RAG

```
1. Utente NATAN_LOC fa domanda
                    │
                    ▼
2. Python RAG Service riceve query
                    │
                    ▼
3. Determina scope:
   • Solo mio tenant?
   • Aggregazione P2P attiva?
   • Quali tenant posso interrogare?
                    │
                    ▼
4. Query MongoDB con tenant_ids[]
                    │
                    ▼
5. Retrieval documenti rilevanti
                    │
                    ▼
6. LLM genera risposta
                    │
                    ▼
7. Risposta all'utente (con citazioni)
```

---

## 9. RAG e Aggregazioni

### Sistema di Aggregazioni

Le **Aggregazioni** permettono a tenant diversi di condividere dati per le query RAG:

```sql
-- Tabella aggregations (in EGI-HUB)
CREATE TABLE aggregations (
    id BIGINT PRIMARY KEY,
    name VARCHAR(255),           -- "Comuni Toscana"
    type ENUM('federation', 'consortium', 'network'),
    created_by_tenant_id BIGINT,
    settings JSON,               -- Configurazione condivisione
    status ENUM('active', 'pending', 'dissolved')
);

-- Tabella aggregation_members
CREATE TABLE aggregation_members (
    aggregation_id BIGINT,
    tenant_id BIGINT,
    role ENUM('admin', 'member'),
    data_sharing_level ENUM('full', 'partial', 'metadata_only'),
    joined_at TIMESTAMP,
    status ENUM('active', 'pending', 'left')
);
```

### Livelli di Condivisione

| Livello | Descrizione |
|---------|-------------|
| **full** | Tutti i documenti visibili nel RAG |
| **partial** | Solo documenti con flag "condivisibile" |
| **metadata_only** | Solo metadati, no contenuto |

---

## 10. Database Architecture

### Schema Completo

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DATABASE LAYER                                    │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                    PostgreSQL: egi_core                                │ │
│  │                    (FUTURO - Migrazione)                               │ │
│  │                                                                        │ │
│  │  • collections        • egis              • blockchain_anchors        │ │
│  │  • ai_validations     • ownership_history • metadata_versions         │ │
│  │                                                                        │ │
│  │  Accesso: EGI-HUB API (tutti i progetti)                              │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                     MariaDB: HUB_EGI                                   │ │
│  │                                                                        │ │
│  │  • users              • projects          • project_admins            │ │
│  │  • project_activities • aggregations      • aggregation_members       │ │
│  │                                                                        │ │
│  │  Accesso: Solo EGI-HUB                                                │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌─────────────────────────────┐  ┌─────────────────────────────────────┐ │
│  │     MariaDB: forge          │  │     MariaDB: egi_db                 │ │
│  │     (NATAN_LOC)             │  │     (FlorenceArtEGI)                │ │
│  │                             │  │                                     │ │
│  │  • tenants    • users       │  │  • users       • artworks           │ │
│  │  • branches   • documents   │  │  • collections • transactions       │ │
│  │  • ai_chats   • messages    │  │  • nfts        • wallets            │ │
│  │                             │  │                                     │ │
│  │  Accesso: Solo NATAN_LOC    │  │  Accesso: Solo FlorenceArtEGI       │ │
│  └─────────────────────────────┘  └─────────────────────────────────────┘ │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                     MongoDB: rag_vectors                              │ │
│  │                                                                        │ │
│  │  • document_embeddings (con tenant_id per isolamento)                 │ │
│  │                                                                        │ │
│  │  Accesso: Python RAG Service                                          │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 11. Roadmap Tecnologica

### Fase 1: Project Admin (Attuale) ✅ In Corso

- [x] Tabella `projects` (rinominata da tenants)
- [ ] Tabella `project_admins`
- [ ] Middleware autorizzazione project-level
- [ ] Frontend Project Admin Dashboard
- [ ] API proxy per gestione tenant

### Fase 2: Consolidamento

- [ ] Autenticazione unificata (Sanctum/JWT)
- [ ] Dashboard metriche real-time
- [ ] Sistema notifiche cross-project
- [ ] Audit log centralizzato

### Fase 3: EGI Core Migration

- [ ] Setup PostgreSQL su Forge
- [ ] Migrazione tabelle EGI
- [ ] API EGI Core
- [ ] Integrazione progetti esistenti

### Fase 4: Scaling

- [ ] Cache distribuita (Redis)
- [ ] Queue system (Horizon)
- [ ] Monitoring avanzato
- [ ] Backup strategy cross-database

---

## Glossario

| Termine | Definizione |
|---------|-------------|
| **EGI** | Encrypted Genuine Item - unità digitale autenticata |
| **Project** | Applicazione SaaS nell'ecosistema (NATAN_LOC, EGI, ...) |
| **Tenant** | Cliente finale di un Project (Comune, Galleria, ...) |
| **Branch** | Suddivisione di un Tenant (Settore, Ufficio, ...) |
| **Aggregation** | Federazione P2P tra tenant per condivisione dati |
| **EGI-HUB** | Orchestratore centrale dell'ecosistema |
| **EGI Core** | Database centrale degli asset EGI (PostgreSQL) |

---

## Riferimenti

- `docs/PROJECTS_VS_TENANTS.md` - Chiarimento terminologico
- `docs/ARCHITECTURE.md` - Architettura tecnica EGI-HUB
- `docs/NATAN_LOC_STATO_DELLARTE.md` - Stato progetto NATAN_LOC

---

*Documento generato il 4 Dicembre 2025*  
*FlorenceEGI © 2025 - Tutti i diritti riservati*
