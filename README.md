# 🌐 EGI-HUB — Central Control Application# 🌐 EGI-HUB — Central Coordination Layer



> **L'applicazione centrale di controllo dell'ecosistema FlorenceEGI**> **Il cervello centrale dell'ecosistema FlorenceEGI**



[![React](https://img.shields.io/badge/React-18.x-61DAFB)](https://react.dev)[![Package](https://img.shields.io/badge/package-florenceegi%2Fhub-blue)](https://florenceegi.com)

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6)](https://typescriptlang.org)[![PHP](https://img.shields.io/badge/PHP-%5E8.1-777BB4)](https://php.net)

[![Laravel](https://img.shields.io/badge/Laravel-10%20%7C%2011%20%7C%2012-FF2D20)](https://laravel.com)[![Laravel](https://img.shields.io/badge/Laravel-10%20%7C%2011%20%7C%2012-FF2D20)](https://laravel.com)



------



## 🎯 Cos'è EGI-HUB## 📋 Indice



**EGI-HUB è l'applicazione centrale** che sta **sopra tutta la gerarchia** dell'ecosistema FlorenceEGI.- [Cos'è EGI-HUB](#-cosè-egi-hub)

- [Architettura](#-architettura)

**NON è un package Laravel.** È un'applicazione completa composta da:- [Progetti Collegati](#-progetti-collegati)

- [Funzionalità Implementate](#-funzionalità-implementate)

| Componente | Tecnologia | Path |- [Roadmap](#-roadmap)

|------------|------------|------|- [Installazione](#-installazione)

| **Frontend** | React + TypeScript + Vite | `/frontend/` |- [Changelog](#-changelog)

| **Backend** | Laravel API-only | `/src/`, `/routes/` |

---

---

## 🎯 Cos'è EGI-HUB

## 🏛️ Gerarchia

**EGI-HUB** è il layer di coordinamento centrale per l'intera piattaforma FlorenceEGI. Contiene modelli, servizi e logiche condivise tra tutti i progetti dell'ecosistema.

```

                    ┌─────────────────────────────────┐### Filosofia

                    │           EGI-HUB               │

                    │    (SuperAdmin Central App)     │Invece di duplicare codice tra progetti diversi (NATAN_LOC, EGI/FlorenceArtEGI, futuri progetti), EGI-HUB fornisce una **single source of truth** per:

                    │                                 │

                    │  • React Frontend (SPA)         │- **Modelli condivisi**: Aggregazioni, Tenant base, User base

                    │  • Laravel API Backend          │- **Logiche di business comuni**: Autenticazione, fatturazione, notifiche

                    │  • Tabelle proprietarie         │- **Migrazioni database**: Schema condiviso tra tutti i progetti

                    │  • AGGREGA DATI DA TUTTI        │- **Configurazioni centralizzate**: Impostazioni globali della piattaforma

                    └─────────────────┬───────────────┘

                                      │### Vantaggi

                    ┌─────────────────┼─────────────────┐

                    │                 │                 │| Aspetto | Senza HUB | Con HUB |

                    ▼                 ▼                 ▼|---------|-----------|---------|

           ┌───────────────┐ ┌───────────────┐ ┌───────────────┐| Manutenzione | Modifiche in N progetti | Modifica in 1 posto |

           │      EGI      │ │   NATAN_LOC   │ │   (Futuro)    │| Consistenza | Drift del codice | Sempre allineato |

           │ FlorenceArtEGI│ │  AI Assistant │ │   Progetto    │| Testing | Test duplicati | Test centralizzati |

           │               │ │   for PA      │ │               │| Deploy | Coordinamento complesso | Versionamento semplice |

           │   TENANT      │ │   TENANT      │ │   TENANT      │

           └───────────────┘ └───────────────┘ └───────────────┘---

```

## 🏗 Architettura

**EGI-HUB prende dati da:**

- **EGI** (FlorenceArtEGI) - Database EGI```

- **NATAN_LOC** - Database NATAN┌─────────────────────────────────────────────────────────────────────────┐

- **Tabelle proprietarie** - Database EGI-HUB│                        🌐 EGI-HUB (florenceegi.com)                     │

│                       /home/fabio/EGI-HUB                               │

---│                                                                         │

│  📦 Package: florenceegi/hub                                            │

## 📁 Struttura│  🔗 Namespace: FlorenceEgi\Hub\                                         │

│                                                                         │

```│  ┌─────────────────────────────────────────────────────────────────┐   │

EGI-HUB/│  │                      MODULI ATTIVI                               │   │

├── frontend/                    # React SPA (SuperAdmin Dashboard)│  ├─────────────────────────────────────────────────────────────────┤   │

│   ├── src/│  │  ✅ Aggregations     Sistema P2P per condivisione dati tenant   │   │

│   │   ├── components/│  │  🔲 Auth             (futuro) Autenticazione centralizzata      │   │

│   │   ├── pages/│  │  🔲 Billing          (futuro) Fatturazione condivisa            │   │

│   │   ├── services/           # API client│  │  🔲 Notifications    (futuro) Hub notifiche cross-platform      │   │

│   │   └── App.tsx│  └─────────────────────────────────────────────────────────────────┘   │

│   ├── vite.config.ts│                                                                         │

│   └── package.json└──────────────────────────────┬──────────────────────────────────────────┘

│                               │

├── src/                         # Laravel API Backend           ┌───────────────────┼───────────────────┐

│   ├── Http/Controllers/Api/           │ symlink           │ symlink           │ symlink

│   │   ├── Superadmin/         # Controller SuperAdmin           ▼                   ▼                   ▼

│   │   └── AggregationController.php    ┌─────────────┐     ┌─────────────┐     ┌─────────────┐

│   ├── Models/    │  NATAN_LOC  │     │     EGI     │     │  (futuro)   │

│   └── HubServiceProvider.php    │   (NATAN)   │     │(FlorenceArt)│     │  progetti   │

│    │             │     │    EGI      │     │             │

├── routes/    │ AI Assistant│     │ NFT Platform│     │             │

│   └── api.php                  # API routes (JSON only)    │ for PA/Biz  │     │ & Creator   │     │             │

│    └─────────────┘     └─────────────┘     └─────────────┘

├── config/           │                   │                   │

├── database/migrations/           └───────────────────┼───────────────────┘

└── docs/                               ▼

    ├── ARCHITECTURE.md          # Architettura dettagliata                    ┌───────────────────┐

    └── SUPERADMIN_MIGRATION_PLAN.md                    │     MariaDB       │

```                    │   (Condiviso)     │

                    ├───────────────────┤

---                    │ tenants           │

                    │ users             │

## 🚀 Avvio Development                    │ aggregations  ✅  │

                    │ aggregation_      │

### Backend (Laravel API)                    │   members     ✅  │

```bash                    └───────────────────┘

cd /home/fabio/dev/EGI-HUB```

php artisan serve --port=8001

```### Struttura Directory



### Frontend (React)```

```bashEGI-HUB/

cd /home/fabio/dev/EGI-HUB/frontend├── composer.json           # Package definition

npm run dev  # Vite su porta 5174├── README.md               # Questo file

```├── config/

│   └── egi-hub.php         # Configurazioni centralizzate

---├── database/

│   └── migrations/

## 🔗 Porte│       ├── 2025_11_28_000001_create_aggregations_table.php

│       └── 2025_11_28_000002_create_aggregation_members_table.php

| Servizio | Porta | URL |└── src/

|----------|-------|-----|    ├── HubServiceProvider.php

| EGI-HUB Frontend | 5174 | http://localhost:5174 |    ├── Models/

| EGI-HUB Backend | 8001 | http://localhost:8001 |    │   ├── Aggregation.php

| EGI (tenant) | 8004 | http://localhost:8004 |    │   └── AggregationMember.php

| NATAN_LOC (tenant) | 8000 | http://localhost:8000 |    └── Traits/

        └── HasAggregations.php

---```



## 📄 Licenza---



Proprietary - © 2025 Fabio Cherici / FlorenceEGI## 🔗 Progetti Collegati


| Progetto | Path | Descrizione | Stato Integrazione |
|----------|------|-------------|-------------------|
| **NATAN_LOC** | `/home/fabio/NATAN_LOC` | AI Assistant per PA e Business | ✅ Integrato |
| **EGI** (FlorenceArtEGI) | `/home/fabio/EGI` | Piattaforma NFT e Creator Economy | ✅ Integrato |
| **Altri** | - | Futuri progetti | 🔲 Da fare |

### Come Integrare un Nuovo Progetto

1. Aggiungi il repository al `composer.json`:
```json
{
    "repositories": [
        { "type": "path", "url": "/home/fabio/EGI-HUB", "options": { "symlink": true } }
    ],
    "require": {
        "florenceegi/hub": "@dev"
    }
}
```

2. Aggiungi il trait `HasAggregations` al tuo modello Tenant:
```php
use FlorenceEgi\Hub\Traits\HasAggregations;

class Tenant extends Model
{
    use HasAggregations;
}
```

3. Esegui `composer update florenceegi/hub`

---

## ✅ Funzionalità Implementate

### 1. Sistema Aggregazioni P2P (v1.0.0 - 2025-11-28)

Sistema di federazione consensuale tra tenant. Permette a più tenant di condividere dati senza una struttura gerarchica rigida.

#### Concetto

```
    Comune di Firenze                     Comune di Scandicci
          │                                       │
          │  "Creiamo un'aggregazione?"           │
          └──────────────────────────────────────►│
                                                  │
          │         "Accetto!"                    │
          ◄──────────────────────────────────────┘
          │                                       │
          ▼                                       ▼
    ┌─────────────────────────────────────────────────┐
    │          AGGREGAZIONE "Piana Fiorentina"        │
    │                                                 │
    │   ☑ Firenze    ☑ Scandicci    ☐ Sesto          │
    │                                                 │
    │   Dati condivisi tra membri attivi             │
    └─────────────────────────────────────────────────┘
```

#### Modelli

- **`Aggregation`**: Rappresenta un gruppo di tenant
- **`AggregationMember`**: Gestisce membership e workflow inviti

#### Stati Membership

| Stato | Descrizione |
|-------|-------------|
| `pending` | Invito inviato, in attesa risposta |
| `accepted` | Membro attivo |
| `rejected` | Ha rifiutato l'invito |
| `left` | Ha lasciato volontariamente |
| `removed` | Rimosso dall'admin |
| `expired` | Invito scaduto |

#### API del Trait `HasAggregations`

```php
// Ottieni tutte le aggregazioni attive del tenant
$tenant->getActiveAggregations();

// Ottieni tutti i tenant_id accessibili (incluso se stesso)
$tenant->getAccessibleTenantIds();

// Ottieni tenant raggruppati per aggregazione (per UI)
$tenant->getAccessibleTenantsByAggregation();

// Crea una nuova aggregazione
$tenant->createAggregation('Nome Aggregazione', ['share_documents' => true]);

// Verifica se può accedere ai dati di un altro tenant
$tenant->canAccessTenant($otherTenantId);
```

---

## 🗺 Roadmap

### Q4 2025 (In Corso)

- [x] **Aggregations P2P** - Sistema base
- [ ] **API Controller** - Endpoint REST per aggregazioni
- [ ] **Frontend Selector** - UI per selezione fonti dati
- [ ] **NATAN Integration** - Passaggio tenant_ids a MongoDB

### Q1 2026 (Pianificato)

- [ ] **Auth Hub** - Autenticazione SSO centralizzata
- [ ] **User Base Model** - Modello utente condiviso
- [ ] **Tenant Base Model** - Modello tenant condiviso

### Q2 2026 (Pianificato)

- [ ] **Billing Hub** - Fatturazione centralizzata
- [ ] **Notification Hub** - Sistema notifiche cross-platform
- [ ] **Event Bus** - Comunicazione eventi tra progetti

---

## 📦 Installazione

### Requisiti

- PHP >= 8.1
- Laravel 10.x, 11.x o 12.x
- MariaDB/MySQL

### Via Composer (sviluppo locale)

```bash
# Nel progetto che deve usare EGI-HUB
composer config repositories.egi-hub '{"type": "path", "url": "/home/fabio/EGI-HUB", "options": {"symlink": true}}'
composer require florenceegi/hub:@dev
```

### Migrazioni

Le migrazioni vengono caricate automaticamente dal ServiceProvider.

```bash
php artisan migrate
```

---

## 📝 Changelog

### [1.0.0] - 2025-11-28

#### Aggiunto
- 🎉 **Initial Release**
- ✨ Sistema Aggregazioni P2P
  - Modello `Aggregation` per gruppi di tenant
  - Modello `AggregationMember` per membership
  - Trait `HasAggregations` per modelli Tenant
  - Workflow inviti con stati: pending, accepted, rejected, left, removed, expired
  - Ruoli: admin, member, readonly
- 📁 Migrazioni database
  - `create_aggregations_table`
  - `create_aggregation_members_table`
- ⚙️ Configurazione `egi-hub.php`
- 📚 Documentazione completa

#### Integrato In
- NATAN_LOC (branch: feature/rivoluzione-natan)
- EGI/FlorenceArtEGI

---

## 📄 Licenza

Proprietary - © 2025 Fabio Cherici / FlorenceEGI

---

## 👤 Autore

**Fabio Cherici**
- Email: fabio@florenceegi.com
- Website: https://florenceegi.com
