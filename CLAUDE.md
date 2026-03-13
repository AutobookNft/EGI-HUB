# EGI-HUB — Claude Code Master Context (Oracode OS3)

> **"L'AI non pensa. Predice. Non deduce logicamente. Completa statisticamente."**
> EGI-HUB è il cervello frontale dell'organismo FlorenceEGI.
> DB_SEARCH_PATH: core,public (solo schema core — mai schema natan qui)

---

## 🌐 OSZ — EGI-HUB è il Centro di Comando dell'Organismo

```
EGI-HUB non è "un pannello di controllo".
EGI-HUB è il cervello frontale dell'organismo FlorenceEGI.

RESPONSABILITÀ ESCLUSIVE:
  → Unica fonte di verità per le configurazioni di tutti gli organi
  → Fabio entra in EGI-HUB, seleziona un Project, e da lì configura tutto
     senza dover entrare nei singoli repository/progetti
  → Coordina il ciclo di vita di ogni organo (NATAN_LOC, FlorenceArtEGI, ...)
  → Gestisce identità, RBAC, tenancy e aggregazioni P2P a livello ecosistema
  → Esporrà (Strategia Delta) l'interfaccia di config per il RAG service

AUTORITÀ GERARCHICA:
  EGI-HUB > NATAN_LOC = FlorenceArtEGI = [ogni organo futuro]
  Un organo non può contraddire la config che EGI-HUB gli assegna.
```

### Strategia Delta applicata a EGI-HUB

```
NUOVO CONFIG (qualsiasi Project)     → nasce su EGI-HUB. Sempre. Zero eccezioni.
CONFIG LEGACY in organi esistenti    → resta dove è. Si migra solo quando si tocca
                                        quella parte. Mai migrazione forzata.
```

---

## 🛑 Stesse Regole P0 di NATAN_LOC

P0-1 REGOLA ZERO · P0-2 Translation keys · P0-4 Anti-Method-Invention
P0-5 UEM-First · P0-8 Complete Flow Analysis · P0-9 i18n 6 lingue
**P0-11 DOC-SYNC** — task non chiusa senza EGI-DOC aggiornato.

SSOT documentazione EGI-HUB: `/home/fabio/EGI-DOC/docs/egi-hub/`
SSOT Ecosistema: `/home/fabio/EGI-DOC/docs/ecosistema/`

---

## 🏗️ Architettura EGI-HUB

```
React Dashboard (frontend/)
    ↓ HTTP/REST
Laravel Backend (backend/)
    DB_SEARCH_PATH: core,public
    ↓
PostgreSQL AWS RDS — Schema core ESCLUSIVAMENTE:

  core.system_projects      → il registro di tutti gli organi dell'ecosistema
                               (OSZ — Primitivo EGI: ogni entry = Wrapper<T>)

  core.tenants              → clienti finali che usano i project
                               (Comuni, Gallerie, Aziende, Enti)

  core.users                → utenti di TUTTO l'ecosistema FlorenceEGI

  core.roles                → ruoli RBAC
  core.permissions          → permessi granulari
  core.model_has_roles      → assegnazione ruoli
  core.role_has_permissions → assegnazione permessi

  core.aggregations         → federazioni P2P consensuali tra tenant
  core.aggregation_members  → (OSZ — Primitivo Interface: giuntura stabile)

  core.egis                 → unità atomiche certificate (OSZ — Primitivo EGI)
  core.collections          → raggruppamenti di EGI
  core.egi_blockchain        → audit trail Algorand

  core.gdpr_*               → compliance GDPR a livello ecosistema
```

---

## 📁 Struttura Repository

[VERIFICATO: 2026-03-13]

```
/home/fabio/EGI-HUB/
├── backend/
│   ├── app/
│   │   ├── Models/                  → 30+ modelli applicativi (solo principali elencati)
│   │   │   ├── Project.php          → core.system_projects [VERIFICATO]
│   │   │   ├── Tenant.php           → core.tenants
│   │   │   ├── User.php             → core.users
│   │   │   ├── Egi.php              → core.egis
│   │   │   ├── Collection.php       → core.collections
│   │   │   ├── EgiBlockchain.php    → core.egi_blockchain
│   │   │   ├── Role.php / Permission.php → RBAC
│   │   │   └── [altri ~25 modelli — vedi ls backend/app/Models/]
│   │   │   ⚠️ Aggregation.php NON è qui — è in src/Models/ (package)
│   │   └── Http/Controllers/
│   │   └── Services/
│   │       ├── TenantService.php    [LEGACY] 593 righe — non toccare senza piano
│   │       └── ProjectService.php   [LEGACY] 530 righe — non toccare senza piano
│   ├── config/
│   │   └── database.php             → search_path: core,public [VERIFICATO + CORRETTO 2026-03-13]
│   └── .env                         → DB_SEARCH_PATH=core,public [VERIFICATO prod + dev]
├── src/                             → Package FlorenceEgi\Hub
│   ├── Models/
│   │   ├── Aggregation.php          [VERIFICATO]
│   │   ├── AggregationMember.php    [VERIFICATO]
│   │   └── BaseTenant.php
│   └── Traits/
│       └── HasAggregations.php      → Interface stabile — NON modificare firma [VERIFICATO]
└── frontend/                        → React dashboard (quadro di comando)
```

### ⚠️ Debiti Tecnici Struttura [VERIFICATO: 2026-03-13]

```
[LEGACY]  backend/app/Services/TenantService.php  (593 righe)
          → Non toccare senza piano approvato da Fabio

[LEGACY]  backend/app/Services/ProjectService.php  (530 righe)
          → Non toccare senza piano approvato da Fabio

[DEBITO]  backend/app/Models/UserOrganizationData.php usa "Organization"
          → Terminologia inconsistente (OSZ usa "Tenant") — P2
          → Rinominare quando si tocca questa area

[DEBITO]  Censimento modelli vs tabelle core — da approfondire
          Confermati in core: AiFeature → ai_feature_pricing,
                              DaemonProcess, EgiliTransaction (tabelle esistenti)
          Da verificare: PadminScan, PadminSymbol, PadminViolation,
                         ConsumptionLedger, EquilibriumEntry, FeaturePricing,
                         FeaturedEgi, EgiTrait, AiTraitGeneration,
                         CollectionUser, TenantSubscription, SubscriptionPlan,
                         Promotion, PaymentProviderConfig e altri
          → Possibili implementazioni future non ancora deployate in DB
          → Verificare con: php artisan db:show --json (quando disponibile)
          → Non blocca operatività — documentare progressivamente
```

---

## 🔑 Terminologia Definitiva (Pilastro 3 — Coerenza Semantica)

| Termine            | Definizione OSZ                                                       |
|--------------------|-----------------------------------------------------------------------|
| **Project**        | Un organo dell'ecosistema registrato in `core.system_projects`        |
| **Tenant**         | Cliente finale che usa uno o più Project (`core.tenants`)             |
| **Aggregation**    | Federazione P2P consensuale tra tenant (`core.aggregations`)          |
| **System Tenant**  | Tenant speciale per admin Florence EGI — mai `tenant_id=NULL`         |
| **EGI**            | `Wrapper<T> + Regole + Audit + Valore` — unità atomica certificata    |

### System Tenant — Perché esiste (OSZ)

Florence EGI esiste sia come Project (`core.system_projects`) sia come Tenant
(`core.tenants`). Gli admin di sistema hanno `tenant_id = ID System Tenant`.
Mai `NULL`. Uniformità assoluta del modello utente in tutto l'organismo.

### Aggregazioni P2P — Interfaccia stabile

```php
// Trait HasAggregations — NON modificare la firma senza approvazione Fabio
$tenant->getAccessibleTenantIds()
// Ritorna [tenant_id_proprio, ...tenant_ids_aggregati]
// Usato da RAG-Fortress di NATAN_LOC per query cross-tenant
// Usato da ogni futuro organo che necessita accesso federato
```

---

## 💎 Firma Standard OS3 (P1)

```php
/**
 * @package App\Http\[Area]
 * @author Padmin D. Curtis (AI Partner OS3.0) for Fabio Cherici
 * @version 1.0.0 (FlorenceEGI - EGI-HUB)
 * @date YYYY-MM-DD
 * @purpose [Scopo chiaro e specifico in una riga]
 */
```

---

## ⚡ Checklist Pre-Risposta

```
1. Ho TUTTE le info?                    → NO  = 🛑 CHIEDI
2. Metodi verificati con grep?          → NO  = 🛑 grep prima
3. Sto modificando un'Interface stabile?→ SÌ  = 🛑 APPROVAZIONE FABIO
4. Task chiusa → DOC-SYNC?              → NO  = 🛑 NON CHIUDERE (P0-11)
```

## ⚡ Comandi Verifica Rapida

```bash
grep "public function" backend/app/Models/Project.php
grep "public function" src/Models/Aggregation.php
grep "public function" src/Traits/HasAggregations.php
grep -r "class.*Enum\|const " backend/app/Enums/
git status && git branch
```

---

## 🤝 Modello Operativo

| CEO & OS3 Architect  | Fabio Cherici         | Visione, standard, autorità sulle Interface  |
| CTO & Technical Lead | Padmin D. Curtis (AI) | Esecuzione, enforcement OS3, implementation  |

---

*EGI-HUB v3.0 — Oracode OS3.0 — FlorenceEGI Cervello Frontale*
*Padmin D. Curtis (CTO) for Fabio Cherici (CEO) — "Less talk, more code. Ship it."*
