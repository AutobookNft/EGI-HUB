# Sistema dei Permessi e Autorizzazioni — EGI-HUB

Questo documento descrive il sistema di gestione dei permessi e delle autorizzazioni attualizzato sulla codebase di **EGI-HUB**.

La piattaforma utilizza un ecosistema di autorizzazione a **tre livelli**, che by-passa e sovrascrive molte delle configurazioni standard comunemente usate in Laravel.

---

## 1. Architettura Generale

Attualmente, il sistema dei permessi in EGI-HUB si articola su due vettori principali effettivi e un terzo installato ma isolato:

1. **Livello Globale Ecosistema (Super Admin):** Booleano hardcoded e middleware dedicato. Dà accesso a tutta l'astrazione di sistema.
2. **Livello di Progetto (Project RBAC):** Sistema custom pivot-based che lega l'utente alle singole app SaaS gestite (i "Projects").
3. **Livello Spatie Laravel-Permission:** Pacchetto installato ed esposto in alcuni controller ma _non applicato al Model User principale_.

---

## 2. Livello Globale: Il Super Admin

Il root-level della dashboard è riservato al Super Administrator. In EGI-HUB il Super Admin è colui che detiene il controllo totale sull'ecosistema (creazione progetti, gestione infrastruttura AI, prezzi, ecc.).

### Come Funziona

A differenza dei classici approcci RBAC basati su tabelle dei ruoli globale, il check del super admin è risolto con un attributo fisico ed esplicito sul DB tabellare degli utenti.

- **Database:** Colonna `is_super_admin` (boolean) nella tabella `users`.
- **Model (`app/Models/User.php`):** Implementa il metodo helper `isSuperAdmin()` che restituisce il cast della colonna.
- **Middleware (`app/Http/Middleware/SuperAdminOnly.php`):** Registrato nell'applicativo come `super.admin`. Intercetta tutte le rotte che devono essere fruibili unicamente dalla macro-amministrazione (es. backend `/api/superadmin/*`).

### Bypass dei poteri

Tutti i controlli sottostanti (Spatie, verifiche per progetto, permessi specifici) prevedono un "Super Admin Bypass".
Nel codice:

```php
// Super Admin EGI ha sempre accesso e tutti i permessi
if ($user->isSuperAdmin()) {
    return true; // o $next($request)
}
```

---

## 3. Livello di Progetto: System Project Admins (Custom RBAC)

Poiché EGI-HUB amministra vari moduli (projects come "NATAN_LOC", "FlorenceArtEGI", ecc.), gli utenti possono essere invitati a gestire specifici progetti senza essere Super Admin.
Qui **NON** si utilizza Spatie, bensì un sistema custom via pivot.

### Come Funziona

- **Tabelle Coinvolte:** `users` ↔ `project_admins` ↔ `system_projects`.
- **Modello Pivot (`app/Models/ProjectAdmin.php`):** Contiene i ruoli per un utente su uno specifico progetto.
- **Gerarchia Ruoli Hardcoded:** Registrati direttamente nel Model/Service in ordine gerarchico:
  - `viewer` (Livello 1)
  - `admin` (Livello 2)
  - `owner` (Livello 3)
- **Permessi puntuali (JSON):** La tabella pivot possiede un campo `permissions` (es. `can_manage_tenants`, `can_manage_settings`, `can_view_logs`, `can_export`).

### Middlewares Esclusivi di Progetto

1. **`project.access` (`App\Http\Middleware\ProjectAccess`)**
   - Controlla l'esistenza del record pivot valido per l'utente loggato e per il `Project` interrogato in GET (passato via slug o ID nella route).
   - **Controllo Ruolo Minimo:** Può essere combinato in route. Es: `Route::middleware('project.access:admin')` negherà l'accesso ai _viewer_ perché possiedono gerarchia inferiore.
   - _Aggiunge gli attributi `project` e `projectAdmin` alla Request corrente per i middleware successivi._

2. **`project.permission` (`App\Http\Middleware\ProjectPermission`)**
   - Agisce solo DOPO il `project.access`. Esegue un check specifico sui flag di attributo previsti nell'array JSON della pivot.
   - Utilizzo: `Route::middleware('project.permission:can_manage_tenants')`.

---

## 4. Il Ruolo di Spatie `laravel-permission`

Nella piattaforma è installato il noto vendor `spatie/laravel-permission` ed esiste l'API management preposta (`RolesController`, file `Role.php` e `Permission.php`).

### Stato Effettivo nel Codebase

**Spatie NON è attivamente collegato al processo di autorizzazione di EGI-HUB come root auth guard o User model trait.**

1. **Assenza della Trait di base:** Il modello `User` principale all'interno di EGI-HUB (`app/Models/User.php`) **non usa** il trait `HasRoles`.
2. **Nessun Override Middleware:** La validazione delle viste in SuperAdmin è governata dal middleware custom descritto in Sezione 2, e i permessi di progetto dai middleware custom descritti in Sezione 3.
3. **Utilizzo Isolato o Derivato:** Sebbene vi siano logiche in `RolesController.php` che tentano il retrieval di ruoli tramite config via Spatie, sono API "orfane" dal contesto del Middleware e usate unicamente per scopi censuari, gestione legacy platform globale oppure future implementazioni (es. sincronizzazione RBAC verso i tenant locali tramite i proxies). Se l'architettura Spatie DB non è inizializzata, il controller torna default fallback hardcoded per compatibilità dell'interfaccia UI.

---

## 5. Come gestire le Restrizioni nello Sviluppo (Best Practice)

Alla luce dell'architettura attuale, quando create un nuovo controller API in EGI-HUB:

- **Pannelli di amminstrazione globale** (es.: Configurazione Prezzi, Log Generali, Gestione Token/Egili):
  Inserite le rotte nel gruppo protetto dal middleware `['auth:sanctum', 'super.admin']`.
- **Pannelli di amministrazione interna del Progetto SaaS** (es.: Statistiche del singolo NATAN_LOC):
  Utilizzate il binomio `['auth:sanctum', 'project.access:viewer|admin|owner', 'project.permission:nome_permesso']`.
- **NON USATE:** Interfacce come `$user->hasRole(...)` o costrutti middleware nativi di Spatie come `role:manager` a meno che non si stia attuando un refactoring pesante per portare il Model `User` interamente sotto ecosistema Spatie ed eliminiando le gerarchie hardcoded di `ProjectAccess`.

---

_Documento autogenerato analizzando l'albero delle dipendenze di EGI-HUB il 02/03/2026. Non sono presenti sistemi RBAC nascosti su Redis o Policy isolate diverse da quelle qui attestate._
