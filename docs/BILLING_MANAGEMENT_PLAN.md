# Billing & Payments Management — Piano Implementazione EGI-HUB

**Creato**: 2026-02-25
**Autore**: Padmin D. Curtis (AI Partner OS3.0) for Fabio Cherici
**Status**: 🔴 IN PIANIFICAZIONE

---

## Contesto e Obiettivo

EGI-HUB è la **AWS Console dell'ecosistema FlorenceEGI** — unico punto di controllo
per gestire prezzi, piani, provider pagamento e abbonamenti di tutti i progetti
(EGI, NATAN-LOC, e futuri).

**Principio architetturale**: i dati stanno nel DB condiviso (PostgreSQL su AWS RDS).
I progetti leggono da EGI-HUB via API. EGI-HUB fornisce le interfacce di gestione.

**Strategia (da `SUPERADMIN_MIGRATION_PLAN.md`)**:

> Non eliminare niente da EGI, creare solo il clone in EGI-HUB.
> Quando tutto funzionerà come in EGI, lo elimineremo da EGI.

---

## Stato Attuale — Inventario Codebase

### Tabelle DB già esistenti (in EGI, DB condiviso)

| Tabella                           | Scopo                                                 | Gestita da                                       |
| --------------------------------- | ----------------------------------------------------- | ------------------------------------------------ |
| `ai_feature_pricing`              | Catalogo feature AI: prezzi Egili + EUR               | EGI Superadmin (`/superadmin/pricing`)           |
| `platform_settings`               | Parametri tecnici: tasso USD/EUR, ratio Egili, soglie | EGI Superadmin (`/superadmin/platform-settings`) |
| `user_feature_purchases`          | Acquisti feature per utente                           | Solo lettura                                     |
| `feature_consumption_ledger`      | Log consumo feature per utente                        | Solo lettura                                     |
| `feature_promotions`              | Promozioni e sconti feature                           | EGI Admin                                        |
| `recurring_subscriptions`         | Abbonamenti ricorrenti utenti EGI                     | EGI                                              |
| `egi_living_subscriptions`        | Abbonamenti EGI Living                                | EGI                                              |
| `orders`                          | Ordini di acquisto EGI                                | EGI                                              |
| `invoices` / `invoice_items`      | Fatturazione                                          | EGI                                              |
| `payment_distributions`           | Split ricavi creator/EPP/platform                     | EGI                                              |
| `egili_transactions`              | Transazioni token Egili                               | EGI                                              |
| `wallets` / `wallet_destinations` | Wallet Stripe/PayPal per creator                      | EGI                                              |

### Tabelle DB mancanti (da creare in EGI-HUB)

| Tabella                    | Scopo                                                                |
| -------------------------- | -------------------------------------------------------------------- |
| `subscription_plans`       | Piani abbonamento per NATAN-LOC (Free/Starter/Pro/Enterprise per PA) |
| `tenant_subscriptions`     | Stato abbonamento per ogni tenant NATAN-LOC                          |
| `payment_provider_configs` | Config Stripe/PayPal per progetto (API keys, enabled)                |

### Controller EGI-HUB già esistenti (stub/parziali)

| Controller                    | Path                                             | Stato                                |
| ----------------------------- | ------------------------------------------------ | ------------------------------------ |
| `FeaturePricingController`    | `Api/Superadmin/FeaturePricingController.php`    | ⚠️ STUB — dati hardcoded, non usa DB |
| `AiCreditsController`         | `Api/Superadmin/AiCreditsController.php`         | Stato ignoto                         |
| `ConsumptionLedgerController` | `Api/Superadmin/ConsumptionLedgerController.php` | Stato ignoto                         |
| `PromotionsController`        | `Api/Superadmin/PromotionsController.php`        | Stato ignoto                         |

---

## Piano Implementazione — Checklist

### FASE 1 — Feature Pricing (priorità MASSIMA — blocca modal acquisto EGI)

> **Contesto**: I 4 pacchetti AI (`ai_package_starter/professional/business/enterprise`)
> sono in DB con `is_active=false` e `cost_fiat_eur=NULL`. La modal di acquisto in EGI
> non mostra nulla finché non vengono attivati e prezzati da EGI-HUB.

- [x] **1.1** ✅ 2026-02-25 — Verificato: stub con `getDefaultPricing()` hardcoded + model `FeaturePricing` inesistente + field names errati (`price_egili`/`enabled` invece di `cost_egili`/`is_active`)
- [x] **1.2** ✅ 2026-02-25 — Creato `backend/app/Models/AiFeaturePricing.php` — punta a tabella `ai_feature_pricing`, copia fedele del model EGI, nessuna migration
- [x] **1.3** ✅ 2026-02-25 — Refactor `FeaturePricingController`: CRUD reale con `AiFeaturePricing`. Aggiunto `index()` (filtri: category/bundle_type/is_active/is_bundle), `show()`, `store()`, `update()` parziale, `destroy()` (soft delete). Rimosso stub `getDefaultPricing()`.
- [x] **1.4** ✅ 2026-02-25 — Aggiunte route `POST pricing` (store), `GET pricing/{id}` (show), `DELETE pricing/{id}` (destroy) in `backend/routes/api.php`. Commit: `6554cc8`
- [x] **1.5** ✅ 2026-02-25 — UI `frontend/src/pages/platform/FeaturePricing.tsx` in EGI-HUB `frontend/`. Tabella con filtri (categoria/stato/bundle_type), toggle `is_active` inline, edit `cost_egili`/`cost_fiat_eur` inline, delete con `window.confirm`, colonna `total_purchases`. Commit: `5ea0e57`

### FASE 2 — Platform Settings (parametri tecnici globali)

> **Contesto**: `platform_settings` in EGI ha 19 record (gruppo `ai_credits`):
> tasso USD/EUR, ratio Egili, tier limits, Claude pricing, alert soglie.
> Gestibile ora solo da EGI Superadmin (`/superadmin/platform-settings`).

- [x] **2.1** ✅ 2026-02-25 — Creato `backend/app/Models/PlatformSetting.php`. Metodi statici: `get()`, `set()`, `invalidateCache()`, `allGrouped()`. Cache 1h.
- [x] **2.2** ✅ 2026-02-25 — Creato `PlatformSettingsController`: `index()` (tutti i setting raggruppati), `update()` (singolo), `updateGroup()` (bulk per gruppo, solo `is_editable=true`).
- [x] **2.3** ✅ 2026-02-25 — Route aggiunte: `GET settings`, `PUT settings/{id}`, `PUT settings/group/{group}` in `backend/routes/api.php`.
- [x] **2.4** ✅ 2026-02-25 — UI `frontend/src/pages/platform/PlatformSettings.tsx`. Vista raggruppata per gruppo con collapsible, edit inline per ogni valore, badge tipo (integer/decimal/boolean/string), lock su `is_editable=false`. Commit: `0370619`

### FASE 3 — Subscription Plans per NATAN-LOC

> **Contesto**: NATAN-LOC serve clienti PA con abbonamento mensile.
> Non esiste ancora nessuna tabella per i piani NATAN-LOC.

- [ ] **3.1** Definire schema tabella `subscription_plans`
  - Campi: `id`, `project_id` (FK system_projects), `name`, `slug`, `description`,
    `price_monthly_eur`, `price_annual_eur`, `max_users`, `max_documents`,
    `max_queries_monthly`, `features` (JSON), `is_active`, `display_order`
- [ ] **3.2** Creare migration `subscription_plans` in EGI-HUB
- [ ] **3.3** Creare migration `tenant_subscriptions` in EGI-HUB
  - Campi: `id`, `tenant_id` (FK tenants), `plan_id` (FK subscription_plans),
    `status` (active/trial/suspended/cancelled), `starts_at`, `ends_at`,
    `trial_ends_at`, `price_paid_eur`, `billing_cycle` (monthly/annual),
    `stripe_subscription_id`, `paypal_subscription_id`
- [ ] **3.4** Creare Model + Controller per Plans e Subscriptions
- [ ] **3.5** UI React: tabella piani + gestione abbonamento per tenant

### FASE 4 — Payment Provider Config

> **Contesto**: ogni progetto ha configurazioni Stripe/PayPal diverse.
> Oggi sono in `.env` di ogni progetto. Centralizzarle in EGI-HUB.

- [ ] **4.1** Creare migration `payment_provider_configs`
  - Campi: `project_id`, `provider` (stripe/paypal/crypto), `is_enabled`,
    `config` (JSON encrypted: api_key, webhook_secret, ecc.), `environment` (sandbox/live)
- [ ] **4.2** Creare Model + Controller
- [ ] **4.3** UI React: per ogni progetto, toggle provider + form config

### FASE 5 — Dashboard Economica Aggregata (read-only)

> Vista d'insieme sull'economia dell'ecosistema.

- [ ] **5.1** `RevenueAggregationController`: totale ordini per progetto, per periodo
- [ ] **5.2** `ConsumptionAggregationController`: utilizzo feature per progetto/tenant
- [ ] **5.3** `EgiliEconomicsController`: Egili in circolazione, conversioni, top-up
- [ ] **5.4** UI React: dashboard con grafici (Recharts già usato in EGI-HUB-HOME-REACT)

---

## File Chiave da Conoscere

### EGI-HUB

| File                                           | Scopo                                   |
| ---------------------------------------------- | --------------------------------------- |
| `backend/routes/api.php`                       | Tutte le route API                      |
| `backend/app/Http/Controllers/Api/Superadmin/` | Controller superadmin                   |
| `backend/app/Models/`                          | Models                                  |
| `backend/database/migrations/`                 | Migrazioni                              |
| `docs/SUPERADMIN_MIGRATION_PLAN.md`            | Piano migrazione generale EGI → EGI-HUB |

### EGI (riferimento)

| File                                                                       | Scopo                                                     |
| -------------------------------------------------------------------------- | --------------------------------------------------------- |
| `app/Models/AiFeaturePricing.php`                                          | Model da replicare in EGI-HUB                             |
| `app/Models/PlatformSetting.php`                                           | Model da replicare in EGI-HUB                             |
| `app/Http/Controllers/Superadmin/SuperadminFeaturePricingController.php`   | Controller Blade da sostituire con API                    |
| `app/Http/Controllers/Superadmin/SuperadminPlatformSettingsController.php` | Controller Blade da sostituire con API                    |
| `database/seeders/AiServicePackagesSeeder.php`                             | 4 pacchetti AI (starter/professional/business/enterprise) |
| `database/seeders/PlatformSettingsSeeder.php`                              | 19 settings gruppo ai_credits                             |

---

## Note Operative

### Come Partire in una Nuova Sessione

1. Leggere questo file
2. Controllare lo stato dei checkbox
3. Identificare il primo `[ ]` non spuntato nella FASE corrente
4. Prima di modificare qualsiasi file EGI-HUB, eseguire:
   ```bash
   grep "public function" backend/app/Http/Controllers/Api/Superadmin/[Controller].php
   grep -A 20 "fillable" backend/app/Models/[Model].php
   ```

### Comandi Utili EGI-HUB

```bash
cd /home/fabio/EGI-HUB/backend && php artisan serve --port=7000   # Laravel API
cd /home/fabio/EGI-HUB/frontend && npm run dev                    # Frontend :5173
php artisan route:list --path=api/superadmin                       # Verifica route
php artisan migrate                                                # Esegue migrazioni
```

### Regola Deploy

Il DB è condiviso con EGI. Qualsiasi migration va eseguita UNA VOLTA SOLA,
non su entrambi i progetti. Le migration nuove vanno in EGI-HUB.
Le migration esistenti (create da EGI) non vanno duplicate.
