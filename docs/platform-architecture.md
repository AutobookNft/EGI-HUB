# 🏗️ EGI Platform Architecture

Documento di architettura per l'ecosistema EGI. Pensato per scalare nei prossimi 10+ anni.

---

## 📊 Visione Generale

```mermaid
graph TB
    subgraph "CONTROL PLANE"
        HUB["EGI-HUB<br/>Platform Management"]
        CORE["EGI-CORE<br/>Shared Users & Auth"]
    end
    
    subgraph "FEDERATION LAYERS"
        NATAN["NATAN<br/>Federation Hub"]
    end
    
    subgraph "DATA PLANE - Projects"
        LOC["NATAN_LOC<br/>PA/Comuni"]
        COMPANY["NATAN_COMPANY<br/>Aziende"]
        FLORENCE["florenceArtEgi<br/>Arte/Cultura"]
        TOSCA["Tosca_bandi<br/>Bandi"]
        FUTURE["...altri progetti"]
    end
    
    HUB --> NATAN
    HUB --> FLORENCE
    HUB --> TOSCA
    HUB --> FUTURE
    
    NATAN --> LOC
    NATAN --> COMPANY
    
    CORE -.-> HUB
    CORE -.-> LOC
    CORE -.-> COMPANY
    CORE -.-> FLORENCE
    CORE -.-> TOSCA
    
    style HUB fill:#1a73e8,color:white
    style CORE fill:#34a853,color:white
    style NATAN fill:#fbbc04,color:black
    style LOC fill:#ea4335,color:white
    style COMPANY fill:#ea4335,color:white
    style FLORENCE fill:#9334e6,color:white
    style TOSCA fill:#ff6d01,color:white
```

---

## 🎯 Separation of Concerns

| Layer | Responsabilità | Chi lo usa | Database |
|-------|---------------|------------|----------|
| **EGI-HUB** | Gestione piattaforma, billing, licensing, progetti, tenant | Staff EGI | MariaDB (HUB_EGI) |
| **EGI-CORE** | Utenti centralizzati, autenticazione, SSO | Tutti i progetti | PostgreSQL (fegi_prod) |
| **NATAN** | Aggregazioni cross-tenant per famiglia NATAN_* | Admin tenant | PostgreSQL (natan_federation) |
| **NATAN_LOC** | RAG, chat, bacheca per PA | Utenti PA | MongoDB + PostgreSQL |
| **NATAN_COMPANY** | RAG, chat, bacheca per aziende | Utenti aziende | MongoDB + PostgreSQL |
| **florenceArtEgi** | Gestione opere d'arte, cultura | Utenti cultura | TBD |
| **Tosca_bandi** | Gestione bandi regionali | Utenti bandi | TBD |

---

## 🔄 Flusso di Aggregazione

### NATAN_LOC (PA/Comuni)
```
Aggregazione PREDEFINITA per Regione
├── Voi (staff) create aggregazione "Regione Toscana"
├── Ogni comune aggiunto viene auto-aggregato
└── Utenti comunicano liberamente tra comuni della stessa regione
```

### NATAN_COMPANY (Aziende)
```
Aggregazione SELF-SERVICE per Azienda
├── Admin azienda crea aggregazione "XYZ Corp"
├── Invita/aggiunge le proprie sedi/filiali
└── Solo membri dell'aggregazione possono comunicare
```

---

## 📈 Strategia di Scaling

| Fase | Timeline | Architettura |
|------|----------|--------------|
| **MVP** | Anno 1 | 1 istanza per componente |
| **Growth** | Anno 2-3 | Replica read per DB, CDN, Redis cluster |
| **Scale** | Anno 4-5 | Sharding per regione/cliente grande |
| **Enterprise** | Anno 6+ | Multi-region, disaster recovery, SLA 99.9% |

### Principi di Design

1. **Horizontal over Vertical** - Più server, non server più grandi
2. **Loose Coupling** - Comunicazione via API, non DB condiviso
3. **Stateless Services** - Nessun stato in memoria tra richieste
4. **Tenant Isolation** - Ogni tenant può essere isolato se necessario
5. **Configuration over Code** - Comportamenti configurabili senza deploy

---

## 🗄️ Database Strategy

```mermaid
graph LR
    subgraph "Shared (Single Instance)"
        CORE_DB["EGI-CORE<br/>PostgreSQL<br/>Users, Auth"]
        HUB_DB["HUB<br/>MariaDB<br/>Projects, Tenants"]
    end
    
    subgraph "Per-Project (Scalable)"
        NATAN_FED["NATAN Federation<br/>PostgreSQL"]
        LOC_MONGO["NATAN_LOC<br/>MongoDB<br/>Documents"]
        LOC_PG["NATAN_LOC<br/>PostgreSQL<br/>Metadata"]
    end
    
    CORE_DB --> HUB_DB
    HUB_DB --> NATAN_FED
    NATAN_FED --> LOC_MONGO
    NATAN_FED --> LOC_PG
```

---

## 🔐 Access Control Matrix

| Ruolo | EGI-HUB | EGI-CORE | NATAN | NATAN_LOC |
|-------|---------|----------|-------|-----------|
| Super Admin (Staff) | ✅ Full | ✅ Full | ✅ Read | ✅ Read |
| Project Admin | ❌ | ✅ Own | ✅ Own Project | ✅ Own Project |
| Tenant Admin | ❌ | ✅ Own | ✅ Own Tenant | ✅ Own Tenant |
| Tenant User | ❌ | ✅ Own | ✅ View | ✅ Own Tenant |

---

## 🚀 Progetti Attuali

| Progetto | Status | Descrizione |
|----------|--------|-------------|
| **EGI-HUB** | 🟡 In sviluppo | Piattaforma centrale |
| **NATAN_LOC** | 🟢 Avanzato | RAG per PA/Comuni |
| **florenceArtEgi** | 🟢 Quasi finito | Gestione opere d'arte |
| **Tosca_bandi** | 🟡 50% | Gestione bandi regionali |
| **NATAN_COMPANY** | ⚪ Pianificato | RAG per aziende |

---

*Ultima modifica: 2026-01-01*
