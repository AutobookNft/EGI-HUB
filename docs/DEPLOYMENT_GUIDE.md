# EGI-HUB Deployment Guide

## Architettura Multi-Environment

```
┌─────────────────────────────────────────────────────────────────┐
│                        PRODUZIONE                               │
│  florenceegi.com (EGI-HUB)                                      │
│     ├── natan.florenceegi.com    → NATAN LOC                    │
│     ├── art.florenceegi.com      → FlorenceArt (futuro)         │
│     └── [altri].florenceegi.com  → Altri tenant                 │
├─────────────────────────────────────────────────────────────────┤
│                         STAGING                                 │
│  egi-hub.13.48.57.194.sslip.io (EGI-HUB)                       │
│     ├── natan_loc.13.48.57.194.sslip.io  → NATAN LOC           │
│     ├── app.13.48.57.194.sslip.io        → FlorenceArtEGI      │
│     └── [altri].13.48.57.194.sslip.io    → Altri tenant        │
├─────────────────────────────────────────────────────────────────┤
│                         LOCALE                                  │
│  localhost:8002 (EGI-HUB)                                       │
│     ├── localhost:7000  → NATAN LOC                             │
│     ├── localhost:8004  → FlorenceArtEGI                        │
│     └── localhost:XXXX  → Altri tenant                          │
└─────────────────────────────────────────────────────────────────┘
```

## Gestione Servizi per Ambiente

### Locale (APP_ENV=local)
- Start/Stop tramite **script bash**
- Configurazione: `local_start_script`, `local_stop_script` nel DB

### Staging/Produzione (APP_ENV=staging/production)
- Start/Stop tramite **Supervisor** (Laravel Forge)
- Configurazione: `supervisor_program` nel DB

## Configurazione Supervisor su Forge

Per ogni tenant, crea un programma Supervisor in Forge:

### Esempio: NATAN LOC (tenant-natan)

```ini
[program:tenant-natan]
command=/usr/bin/php /home/forge/natan.florenceegi.com/artisan serve --host=0.0.0.0 --port=8000
autostart=true
autorestart=true
user=forge
redirect_stderr=true
stdout_logfile=/home/forge/.forge/tenant-natan.log
stopwaitsecs=3600

[program:tenant-natan-queue]
command=/usr/bin/php /home/forge/natan.florenceegi.com/artisan queue:work
autostart=true
autorestart=true
user=forge
redirect_stderr=true
stdout_logfile=/home/forge/.forge/tenant-natan-queue.log
stopwaitsecs=3600
```

### Comandi da EGI-HUB

Il TenantService esegue:
```bash
# Start
sudo supervisorctl start tenant-natan:*

# Stop  
sudo supervisorctl stop tenant-natan:*
```

## Tabella Tenants

| Campo | Descrizione | Esempio |
|-------|-------------|---------|
| `slug` | Identificativo univoco | `natan` |
| `url` | URL attivo (cambia per env) | `http://localhost:7000` |
| `staging_url` | URL staging sslip.io | `https://natan_loc.13.48.57.194.sslip.io` |
| `production_url` | URL produzione | `https://natan.florenceegi.com` |
| `local_start_script` | Script bash per dev | `/home/fabio/dev/NATAN_LOC/start_services.sh` |
| `local_stop_script` | Script bash per dev | `/home/fabio/dev/NATAN_LOC/stop_services.sh` |
| `supervisor_program` | Nome programma Supervisor | `tenant-natan` |

## Deploy Checklist

### 1. Prima del Deploy

```bash
# Build frontend
cd frontend && npm run build

# Test migration
php artisan migrate --pretend
```

### 2. Su Forge/Server

```bash
# Pull code
git pull origin main

# Install dependencies
composer install --no-dev --optimize-autoloader
cd frontend && npm ci && npm run build

# Run migrations
php artisan migrate --force

# Seed tenants (solo prima volta o per aggiornare)
php artisan db:seed --class=TenantSeeder

# Clear caches
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Restart queue workers
php artisan queue:restart
```

### 3. Configurare Supervisor per ogni Tenant

In Forge Dashboard → Server → Daemons:
- Aggiungi un daemon per ogni tenant
- Nomina: `tenant-{slug}` (es: `tenant-natan`)

### 4. Verificare Health Check

```bash
curl https://egi-hub.13.48.57.194.sslip.io/api/tenants/health
```

## Variabili Environment

### .env (Staging)
```env
APP_ENV=staging
APP_URL=https://egi-hub.13.48.57.194.sslip.io
```

### .env (Produzione)
```env
APP_ENV=production
APP_URL=https://florenceegi.com
```

## Note Importanti

1. **Permessi Supervisor**: L'utente web (forge/www-data) deve poter eseguire `supervisorctl`. Configura in `/etc/sudoers.d/`:
   ```
   forge ALL=(ALL) NOPASSWD: /usr/bin/supervisorctl
   ```

2. **URL Dinamico**: Il campo `url` dovrebbe essere aggiornato in base all'ambiente. Usa il seeder o un comando artisan per questo.

3. **Health Check**: Gli endpoint `/api/health` dovrebbero essere implementati su ogni tenant per un monitoraggio accurato.
