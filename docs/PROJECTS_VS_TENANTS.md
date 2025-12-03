# 📦 Projects vs Tenants - Chiarimento Terminologico

**Data:** 3 Dicembre 2025  
**Status:** ✅ DEFINITIVO

---

## 🎯 Il Problema Originale

EGI-HUB aveva una tabella `tenants` che causava confusione perché:

1. **NATAN_LOC** ha una propria tabella `tenants` (database `forge`) per i clienti finali (Comuni, PA, etc.)
2. **EGI-HUB** aveva una tabella `tenants` (database `HUB_EGI`) per i progetti SaaS

Questo creava ambiguità: cosa sono i "tenants"? I clienti PA o i progetti SaaS?

---

## ✅ La Soluzione: Nomenclatura Chiara

### In EGI-HUB: **PROJECTS** (ex-Tenants)

I **Projects** sono le applicazioni SaaS dell'ecosistema FlorenceEGI:

| Project | Descrizione | Database |
|---------|-------------|----------|
| **NATAN_LOC** | AI Assistant per Pubbliche Amministrazioni | `forge` |
| **FlorenceArtEGI** | Piattaforma NFT per artisti | `egi_db` |
| **[Futuro]** | Nuovi progetti SaaS | `[nuovo_db]` |

**Tabella:** `HUB_EGI.projects` (era `HUB_EGI.tenants`)

### In NATAN_LOC: **TENANTS** (invariato)

I **Tenants** sono i clienti finali all'interno di ogni progetto:

| Tenant | Tipo | Project |
|--------|------|---------|
| Comune di Firenze | PA | NATAN_LOC |
| Comune di Prato | PA | NATAN_LOC |
| Galleria XYZ | Artista | FlorenceArtEGI |
| Museo ABC | Istituzione | FlorenceArtEGI |

**Tabella:** `forge.tenants` (in NATAN_LOC)

---

## 🏗️ Architettura Gerarchica

```
┌─────────────────────────────────────────────────────────────┐
│                        EGI-HUB                              │
│                    (SuperAdmin Central)                     │
│                                                             │
│   Gestisce: PROJECTS (applicazioni SaaS)                    │
│   Database: HUB_EGI                                         │
│   Tabelle: projects, project_activities, aggregations       │
└─────────────────────────────────┬───────────────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
                    ▼                           ▼
    ┌───────────────────────────┐   ┌───────────────────────────┐
    │        NATAN_LOC          │   │      FlorenceArtEGI       │
    │        (PROJECT)          │   │        (PROJECT)          │
    │                           │   │                           │
    │  Database: forge          │   │  Database: egi_db         │
    │                           │   │                           │
    │  Gestisce: TENANTS        │   │  Gestisce: TENANTS        │
    │  (Comuni, PA)             │   │  (Gallerie, Artisti)      │
    │                           │   │                           │
    │  Tabella: tenants         │   │  Tabella: tenants         │
    └───────────────────────────┘   └───────────────────────────┘
              │                               │
    ┌─────────┼─────────┐           ┌─────────┼─────────┐
    │         │         │           │         │         │
    ▼         ▼         ▼           ▼         ▼         ▼
 Comune   Comune   Comune        Galleria  Museo    Artista
 Firenze  Prato    Milano           X         Y        Z
(TENANT) (TENANT) (TENANT)      (TENANT) (TENANT) (TENANT)
```

---

## 📊 Database Schema

### EGI-HUB Database (`HUB_EGI`)

```sql
-- Projects: Le applicazioni SaaS gestite da EGI-HUB
CREATE TABLE projects (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT NULL,
    url VARCHAR(500) NOT NULL,                    -- URL attivo corrente
    production_url VARCHAR(500) NULL,             -- URL produzione
    staging_url VARCHAR(500) NULL,                -- URL staging
    api_key VARCHAR(500) NULL,                    -- Chiave API
    api_secret VARCHAR(500) NULL,                 -- Secret API
    status ENUM('active', 'inactive', 'maintenance') DEFAULT 'active',
    is_healthy BOOLEAN DEFAULT true,
    metadata JSON NULL,
    local_start_script VARCHAR(500) NULL,         -- Script avvio locale
    local_stop_script VARCHAR(500) NULL,          -- Script stop locale
    supervisor_program VARCHAR(255) NULL,         -- Nome programma Supervisor (prod)
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Activity log per i projects
CREATE TABLE project_activities (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    project_id BIGINT UNSIGNED NOT NULL,
    type VARCHAR(50) NOT NULL,                    -- health_check, proxy, error, etc.
    action VARCHAR(255) NOT NULL,
    description TEXT NULL,
    status ENUM('success', 'warning', 'error', 'info') DEFAULT 'info',
    response_time_ms INT UNSIGNED NULL,
    metadata JSON NULL,
    created_at TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);
```

### NATAN_LOC Database (`forge`)

```sql
-- Tenants: I clienti finali di NATAN_LOC
CREATE TABLE tenants (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    domain VARCHAR(255) NULL,
    database_name VARCHAR(255) NULL,
    settings JSON NULL,
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

---

## 🔄 Migration Rinomina

La migration `2025_12_03_000001_rename_tenants_to_projects.php` esegue:

```php
// Da
Schema::table('tenants', ...);
Schema::table('tenant_activities', ...);

// A
Schema::table('projects', ...);
Schema::table('project_activities', ...);
```

---

## 📝 API Endpoints

### EGI-HUB API (gestisce Projects)

```
GET    /api/projects                    # Lista progetti SaaS
POST   /api/projects                    # Crea nuovo progetto
GET    /api/projects/{id}               # Dettaglio progetto
PUT    /api/projects/{id}               # Aggiorna progetto
DELETE /api/projects/{id}               # Elimina progetto
POST   /api/projects/{id}/health-check  # Verifica salute progetto
POST   /api/projects/{id}/start         # Avvia servizi progetto
POST   /api/projects/{id}/stop          # Ferma servizi progetto
GET    /api/projects/health             # Health check tutti i progetti
```

### NATAN_LOC API (gestisce Tenants)

```
GET    /api/tenants                     # Lista tenant (Comuni, PA)
POST   /api/tenants                     # Crea nuovo tenant
GET    /api/tenants/{id}                # Dettaglio tenant
...
```

---

## 💡 Regola Generale

| Contesto | Termine | Significato |
|----------|---------|-------------|
| **EGI-HUB** | Project | Applicazione SaaS (NATAN_LOC, EGI, etc.) |
| **Progetto SaaS** | Tenant | Cliente finale (Comune, Galleria, etc.) |

---

## 📂 File Coinvolti nel Refactoring

### Backend (`/home/fabio/dev/EGI-HUB/backend/`)

- `app/Models/Project.php` - Modello Project (nuovo)
- `app/Models/ProjectActivity.php` - Modello attività (nuovo)
- `app/Http/Controllers/Api/ProjectController.php` - Controller API (nuovo)
- `app/Services/ProjectService.php` - Business logic (nuovo)
- `database/migrations/2025_12_03_000001_rename_tenants_to_projects.php` - Migration
- `database/seeders/ProjectSeeder.php` - Seeder dati iniziali
- `routes/api.php` - Routes API aggiornate

### Frontend (`/home/fabio/dev/EGI-HUB/frontend/src/`)

- `types/project.ts` - TypeScript interfaces
- `services/projectApi.ts` - API client
- `pages/projects/ProjectsList.tsx` - Lista progetti
- `pages/projects/CreateProject.tsx` - Form creazione
- `components/Layout.tsx` - Sidebar aggiornata
- `App.tsx` - Routes aggiornate

### Legacy (deprecato, mantenuto per backward compatibility)

- `app/Models/Tenant.php` - Sarà rimosso
- `routes/api.php` - Routes `/tenants/*` redirect a `/projects/*`

---

## ✅ Checklist Migrazione

- [x] Creare migration rename
- [x] Creare modelli Project e ProjectActivity
- [x] Creare controller e service
- [x] Aggiornare routes API
- [x] Aggiornare frontend types
- [x] Aggiornare frontend pages
- [x] Aggiornare sidebar navigation
- [x] Creare documentazione (questo file)
- [ ] Eseguire migration in locale
- [ ] Eseguire migration in staging
- [ ] Rimuovere file legacy dopo validazione
