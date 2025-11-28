# 🌐 EGI-HUB — Central Coordination Layer

> **Il cervello centrale dell'ecosistema FlorenceEGI**

[![Package](https://img.shields.io/badge/package-florenceegi%2Fhub-blue)](https://florenceegi.com)
[![PHP](https://img.shields.io/badge/PHP-%5E8.1-777BB4)](https://php.net)
[![Laravel](https://img.shields.io/badge/Laravel-10%20%7C%2011%20%7C%2012-FF2D20)](https://laravel.com)

---

## 📋 Indice

- [Cos'è EGI-HUB](#-cosè-egi-hub)
- [Architettura](#-architettura)
- [Progetti Collegati](#-progetti-collegati)
- [Funzionalità Implementate](#-funzionalità-implementate)
- [Roadmap](#-roadmap)
- [Installazione](#-installazione)
- [Changelog](#-changelog)

---

## 🎯 Cos'è EGI-HUB

**EGI-HUB** è il layer di coordinamento centrale per l'intera piattaforma FlorenceEGI. Contiene modelli, servizi e logiche condivise tra tutti i progetti dell'ecosistema.

### Filosofia

Invece di duplicare codice tra progetti diversi (NATAN_LOC, EGI/FlorenceArtEGI, futuri progetti), EGI-HUB fornisce una **single source of truth** per:

- **Modelli condivisi**: Aggregazioni, Tenant base, User base
- **Logiche di business comuni**: Autenticazione, fatturazione, notifiche
- **Migrazioni database**: Schema condiviso tra tutti i progetti
- **Configurazioni centralizzate**: Impostazioni globali della piattaforma

### Vantaggi

| Aspetto | Senza HUB | Con HUB |
|---------|-----------|---------|
| Manutenzione | Modifiche in N progetti | Modifica in 1 posto |
| Consistenza | Drift del codice | Sempre allineato |
| Testing | Test duplicati | Test centralizzati |
| Deploy | Coordinamento complesso | Versionamento semplice |

---

## 🏗 Architettura

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        🌐 EGI-HUB (florenceegi.com)                     │
│                       /home/fabio/EGI-HUB                               │
│                                                                         │
│  📦 Package: florenceegi/hub                                            │
│  🔗 Namespace: FlorenceEgi\Hub\                                         │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                      MODULI ATTIVI                               │   │
│  ├─────────────────────────────────────────────────────────────────┤   │
│  │  ✅ Aggregations     Sistema P2P per condivisione dati tenant   │   │
│  │  🔲 Auth             (futuro) Autenticazione centralizzata      │   │
│  │  🔲 Billing          (futuro) Fatturazione condivisa            │   │
│  │  🔲 Notifications    (futuro) Hub notifiche cross-platform      │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
           ┌───────────────────┼───────────────────┐
           │ symlink           │ symlink           │ symlink
           ▼                   ▼                   ▼
    ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
    │  NATAN_LOC  │     │     EGI     │     │  (futuro)   │
    │   (NATAN)   │     │(FlorenceArt)│     │  progetti   │
    │             │     │    EGI      │     │             │
    │ AI Assistant│     │ NFT Platform│     │             │
    │ for PA/Biz  │     │ & Creator   │     │             │
    └─────────────┘     └─────────────┘     └─────────────┘
           │                   │                   │
           └───────────────────┼───────────────────┘
                               ▼
                    ┌───────────────────┐
                    │     MariaDB       │
                    │   (Condiviso)     │
                    ├───────────────────┤
                    │ tenants           │
                    │ users             │
                    │ aggregations  ✅  │
                    │ aggregation_      │
                    │   members     ✅  │
                    └───────────────────┘
```

### Struttura Directory

```
EGI-HUB/
├── composer.json           # Package definition
├── README.md               # Questo file
├── config/
│   └── egi-hub.php         # Configurazioni centralizzate
├── database/
│   └── migrations/
│       ├── 2025_11_28_000001_create_aggregations_table.php
│       └── 2025_11_28_000002_create_aggregation_members_table.php
└── src/
    ├── HubServiceProvider.php
    ├── Models/
    │   ├── Aggregation.php
    │   └── AggregationMember.php
    └── Traits/
        └── HasAggregations.php
```

---

## 🔗 Progetti Collegati

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
