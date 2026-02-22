# SUPERADMIN MIGRATION PLAN - EGI → EGI-HUB

**Data Inizio**: 1 Dicembre 2025
**Ultimo aggiornamento**: 20 Febbraio 2026
**Status**: MIGRAZIONE COMPLETATA (Frontend React, non Blade)

---

## Strategia

> **"Non eliminare niente da EGI, creare solo il clone in EGI-HUB. Quando tutto funzionera come in EGI, lo elimineremo da EGI."**
> — Fabio Cherici, 1 Dicembre 2025

### Approccio: CLONE → VERIFY → DELETE

La migrazione ha cambiato approccio rispetto al piano originale: invece di migrare le viste Blade da EGI, tutto il frontend SuperAdmin e stato riscritto come **React SPA** con backend **Laravel API-only**.

---

## Stato Migrazione

### Controller Migrati (da EGI a EGI-HUB)

| Controller Originale (EGI) | Nuovo Controller (EGI-HUB) | Stato |
|:---|:---|:---|
| `SuperadminDashboardController` | `Api\Superadmin\DashboardController` | Migrato |
| `SuperadminAiConsultationsController` | `Api\Superadmin\AiConsultationsController` | Migrato |
| `SuperadminAiCreditsController` | `Api\Superadmin\AiCreditsController` | Migrato |
| `SuperadminAiFeaturesController` | `Api\Superadmin\AiFeaturesController` | Migrato |
| `SuperadminAiStatisticsController` | `Api\Superadmin\AiStatisticsController` | Migrato |
| `SuperadminEgiliController` | `Api\Superadmin\EgiliController` | Migrato |
| `SuperadminEquilibriumController` | `Api\Superadmin\EquilibriumController` | Migrato |
| `SuperadminRolesController` | `Api\Superadmin\RolesController` | Migrato |
| `SuperadminFeaturePricingController` | `Api\Superadmin\FeaturePricingController` | Migrato |
| `PadminController` (34 KB) | 5 controller separati (Dashboard, Violations, Symbols, Search, Statistics) | Migrato + Refactored |
| `SuperadminPermissionsController` | Incluso in `RolesController` | Migrato |
| `MigrationOrchestratorController` | Non migrato (non necessario su HUB) | Rimosso |
| `SuperadminNatanConfigController` | Non migrato (specifico NATAN_LOC) | Rimane in EGI |

### Nuovi Controller (non esistevano in EGI)

| Controller | Funzione |
|:---|:---|
| `ProjectController` | Gestione progetti SaaS (sostituisce vecchio concetto "tenant") |
| `ProjectAdminController` | Admin per progetto (owner/admin/viewer) |
| `ProjectActivityController` | Activity log progetti |
| `ProjectProxyController` | Proxy API verso backend progetti |
| `AggregationController` | Aggregazioni P2P |
| `EcosystemController` | API pubbliche per HUB-HOME 3D |
| `GdprController` | Export dati, forget me |
| `ConsentController` | Gestione consensi GDPR |
| `PromotionsController` | Campagne promozionali |
| `FeaturedCalendarController` | Calendario in evidenza |
| `ConsumptionLedgerController` | Registro consumi |

### Viste: Blade → React

Le 21 viste Blade originali **non sono state migrate**: tutto il frontend e stato riscritto come React SPA (37 pagine).

---

## Cosa resta da fare

### Su EGI-HUB
1. **Deploy su EC2** (hub.florenceegi.com)
2. **Middleware auth**: Le rotte superadmin mancano di `auth:sanctum` + ruolo superadmin
3. **System Config**: 4 pagine frontend senza backend (Config, Security, Domains, Notifications)
4. **Test end-to-end**: Verificare tutti gli endpoint con dati reali su RDS

### Su EGI (FlorenceArtEGI)
5. **Rimozione codice superadmin**: Dopo che HUB funziona, eliminare i 13 controller + 21 viste da EGI
6. **Redirect**: Aggiungere redirect da `/superadmin` su EGI verso `hub.florenceegi.com`

---

## Archivio: Inventario Originale

<details>
<summary>Controller originali in EGI (13 file, ~121 KB)</summary>

```
/home/fabio/EGI/app/Http/Controllers/Superadmin/
├── MigrationOrchestratorController.php      (18 KB)
├── PadminController.php                      (34 KB)
├── SuperadminAiConsultationsController.php   (11 KB)
├── SuperadminAiCreditsController.php         ( 4 KB)
├── SuperadminAiFeaturesController.php        ( 5 KB)
├── SuperadminAiStatisticsController.php      ( 3 KB)
├── SuperadminDashboardController.php         ( 1 KB)
├── SuperadminEgiliController.php             ( 4 KB)
├── SuperadminEquilibriumController.php       ( 3 KB)
├── SuperadminFeaturePricingController.php    ( 9 KB)
├── SuperadminNatanConfigController.php       (12 KB)
├── SuperadminPermissionsController.php       ( 6 KB)
└── SuperadminRolesController.php             (11 KB)
```
</details>

<details>
<summary>Viste Blade originali in EGI (21 file)</summary>

```
/home/fabio/EGI/resources/views/superadmin/
├── dashboard.blade.php
├── ai/ (4 file)
├── egili/ (1 file)
├── equilibrium/ (1 file)
├── migration-orchestrator/ (1 file)
├── natan/ (1 file)
├── padmin/ (5 file)
├── permissions/ (1 file)
├── pricing/ (3 file)
└── roles/ (3 file)
```
</details>
