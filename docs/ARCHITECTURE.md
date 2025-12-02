# 🏗️ EGI-HUB Architecture

**Data:** 1 Dicembre 2025  
**Autore:** Fabio Cherici + Padmin D. Curtis  
**Status:** ✅ DEFINITIVO

---

## 🎯 Ruolo di EGI-HUB

EGI-HUB è il **layer di coordinamento centrale** dell'ecosistema FlorenceEGI.

**NON è un monolito Laravel con views.** È:

1. **API Backend** (Laravel) - Serve i progetti via REST API
2. **React Frontend** (SPA) - Dashboard Superadmin centralizzata
3. **Database Hub-specific** - Solo tabelle specifiche per funzionalità hub

---

## 📐 Stack Tecnologico

### Frontend
| Tecnologia | Versione | Ruolo |
|------------|----------|-------|
| **React** | 18.x | UI Framework |
| **TypeScript** | 5.x | Type Safety |
| **Vite** | 5.x | Build Tool |
| **Tailwind CSS** | 3.x | Styling |

### Backend
| Tecnologia | Versione | Ruolo |
|------------|----------|-------|
| **Laravel** | 10/11/12 | API Framework |
| **PHP** | 8.1+ | Runtime |
| **MariaDB** | 10.x | Database (tabelle hub-specific) |

---

## 🏛️ Architettura

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           EGI-HUB                                       │
│                                                                         │
│  ┌─────────────────────────┐    ┌─────────────────────────────────┐    │
│  │   REACT FRONTEND (SPA)  │    │      LARAVEL API BACKEND        │    │
│  │   /frontend             │    │      /src, /routes, /config     │    │
│  │                         │    │                                 │    │
│  │   - Vite + React + TS   │◄──►│   - API-only (JSON responses)  │    │
│  │   - Tailwind CSS        │    │   - No Blade views              │    │
│  │   - Superadmin Dashboard│    │   - Sanctum/Token auth          │    │
│  │                         │    │                                 │    │
│  │   Porta: 5174 (dev)     │    │   Consumed by projects          │    │
│  └─────────────────────────┘    └─────────────────────────────────┘    │
│                                              │                          │
│                                              │ REST API                 │
└──────────────────────────────────────────────┼──────────────────────────┘
                                               │
                    ┌──────────────────────────┼──────────────────────────┐
                    │                          │                          │
                    ▼                          ▼                          ▼
           ┌───────────────┐          ┌───────────────┐          ┌───────────────┐
           │   NATAN_LOC   │          │      EGI      │          │   (Futuro)    │
           │               │          │ FlorenceArtEGI│          │   Progetto    │
           │  Backend:     │          │               │          │               │
           │  Laravel +    │          │  Backend:     │          │               │
           │  Python       │          │  Laravel      │          │               │
           │               │          │               │          │               │
           │  Proprio DB   │          │  Proprio DB   │          │               │
           │  + Hub tables │          │  + Hub tables │          │               │
           └───────────────┘          └───────────────┘          └───────────────┘
```

---

## 📁 Struttura Directory

```
EGI-HUB/
├── frontend/                    # 🆕 React SPA
│   ├── src/
│   │   ├── components/
│   │   │   └── superadmin/
│   │   │       ├── Dashboard.tsx
│   │   │       ├── AIManagement/
│   │   │       ├── PadminAnalyzer/
│   │   │       ├── Platform/
│   │   │       └── Tokenomics/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/           # API client
│   │   ├── types/
│   │   └── App.tsx
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── package.json
│
├── src/                         # Laravel API Backend
│   ├── Http/
│   │   └── Controllers/
│   │       └── Api/            # 🔄 API-only controllers
│   │           └── Superadmin/
│   │               ├── DashboardController.php
│   │               └── ...
│   ├── Models/
│   │   ├── Aggregation.php
│   │   └── AggregationMember.php
│   ├── Services/
│   └── HubServiceProvider.php
│
├── routes/
│   ├── api.php                  # 🔄 API routes (JSON)
│   └── superadmin.php           # Superadmin API routes
│
├── config/
│   ├── egi-hub.php
│   └── superadmin.php
│
├── database/
│   └── migrations/              # Solo tabelle hub-specific
│
├── docs/
│   ├── ARCHITECTURE.md          # 🆕 Questo file
│   └── ...
│
└── composer.json
```

---

## 🔑 Principi Chiave

### 1. Backend nei Rispettivi Progetti
```
❌ SBAGLIATO: EGI-HUB contiene business logic di NATAN o EGI
✅ CORRETTO: EGI-HUB espone API che i progetti consumano
```

### 2. Database Hub-Specific
```
EGI-HUB Database Tables:
├── aggregations           # Federazioni tra tenant
├── aggregation_members    # Membership
├── hub_settings          # Configurazioni globali
├── api_tokens            # Token per progetti
└── audit_logs            # Log centralizzato

NON contiene:
├── users                 # Ogni progetto ha i suoi
├── tenants               # Ogni progetto ha i suoi
└── [business tables]     # Specifiche per progetto
```

### 3. API-First
```php
// ❌ SBAGLIATO
return view('superadmin.dashboard', $data);

// ✅ CORRETTO
return response()->json([
    'stats' => $stats,
    'features' => $features,
]);
```

### 4. Frontend SPA Separato
```
Frontend React:
- Build separato (Vite)
- Comunica con backend via API
- Può essere deployato su CDN
- Sviluppo indipendente
```

---

## 🔌 Come i Progetti Consumano EGI-HUB

### Installazione (Package PHP)
```json
// composer.json del progetto (es. NATAN_LOC)
{
    "repositories": [
        { "type": "path", "url": "/home/fabio/dev/EGI-HUB" }
    ],
    "require": {
        "florenceegi/hub": "@dev"
    }
}
```

### Uso Modelli Condivisi
```php
// Nel progetto consumer
use FlorenceEgi\Hub\Models\Aggregation;
use FlorenceEgi\Hub\Traits\HasAggregations;

class Tenant extends Model {
    use HasAggregations;
}
```

### Chiamate API all'Hub
```typescript
// Dal frontend del progetto consumer
const response = await fetch('https://hub.florenceegi.com/api/aggregations', {
    headers: { 'Authorization': `Bearer ${hubToken}` }
});
```

---

## 🚀 Development Workflow

### Avvio Backend (Laravel)
```bash
cd /home/fabio/dev/EGI-HUB
php artisan serve --port=8001
```

### Avvio Frontend (React)
```bash
cd /home/fabio/dev/EGI-HUB/frontend
npm run dev  # Vite su porta 5174
```

### Build Production
```bash
# Frontend
cd frontend && npm run build

# I file compilati vanno in frontend/dist/
# Da servire via Nginx/Apache o CDN
```

---

## 📋 Checklist Migrazione da Blade a React

- [ ] Rimuovere `resources/views/`
- [ ] Rimuovere `loadViewsFrom()` dal ServiceProvider
- [ ] Creare `frontend/` con Vite + React + TS
- [ ] Convertire controller da view a JSON response
- [ ] Spostare routes da `web` a `api`
- [ ] Implementare autenticazione API (Sanctum)

---

## 📅 Changelog Architettura

| Data | Modifica |
|------|----------|
| 2025-12-01 | Definita architettura React + API-only |
| 2025-11-28 | Creazione iniziale (package Laravel) |
