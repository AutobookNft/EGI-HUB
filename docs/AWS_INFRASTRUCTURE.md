# AWS Infrastructure — FlorenceEGI Ecosystem

> **Versione**: 1.0
> **Aggiornato**: 2026-02-27
> **Scopo**: Reference rapido per nuove sessioni di sviluppo. Contiene tutto il necessario per operare sull'infrastruttura AWS senza dover chiedere conferme basilari.

---

## 1. Mappa generale

```
Internet
  │
  ▼
Route 53 (florenceegi.com)
  │  Hosted Zone ID: Z05052791PPWNJ3NKL131
  │  Region API: us-east-1 (servizio globale)
  │
  ├─ hub.florenceegi.com ──────────────────────┐
  ├─ art.florenceegi.com                       │
  ├─ natan-loc.florenceegi.com                 │
  ├─ info.florenceegi.com                      ▼
  └─ florenceegi.com (apex)         ALB (florenceegi-alb)
                                      │  HTTPS:443 → HTTP:80
                                      ▼
                              EC2 florenceegi-private
                              ID:  i-0940cdb7b955d1632
                              IP:  10.0.3.21 (privata)
                              OS:  Ubuntu, PHP 8.3.30-FPM
                              Region: eu-north-1
                                      │
                              Nginx (vhost routing)
                                      │
                  ┌───────────────────┴───────────────────┐
                  │                                       │
            frontend/dist/                       backend/public/
            (React SPA)                          (Laravel 11 API)
                                                          │
                                                   PostgreSQL RDS
```

**EC2 staging** (non in produzione attiva):
`i-0e50d9a88c7682f20` — florenceegi-staging — 10.0.1.121

---

## 2. Risorse AWS

| Risorsa | Identificativo | Note |
|---------|---------------|------|
| **AWS Account** | `504606041369` | |
| **EC2 prod** | `i-0940cdb7b955d1632` | florenceegi-private, t3.small, 10.0.3.21 |
| **EC2 staging** | `i-0e50d9a88c7682f20` | florenceegi-staging, 10.0.1.121 |
| **EC2 IAM Role** | `florenceegi-ec2-role` | Include: AmazonSSMFullAccess (aggiunto 2026-02-27) |
| **IAM User locale** | `egi-hub-deploy` | Per CLI locale: SSMFullAccess + Route53ReadOnly |
| **ALB** | `florenceegi-alb` | |
| **Target Group** | `tg-florenceegi-prod-http-80` | HTTP:80 su EC2 |
| **RDS** | `florenceegi-postgres-dev.c1i0048yu660.eu-north-1.rds.amazonaws.com` | PostgreSQL, eu-north-1 |
| **S3** | `florenceegi-media` | privato, accesso via CloudFront (OAC) |
| **CloudFront** | `media.florenceegi.com` | CDN per media/asset |
| **Route 53** | Hosted Zone `Z05052791PPWNJ3NKL131` | dominio `florenceegi.com` |

---

## 3. Regioni — regola critica

| Servizio | Region da usare | Perché |
|----------|-----------------|--------|
| Route53Client (PHP) | `us-east-1` | Route53 ha endpoint globale in us-east-1 |
| SsmClient (PHP) | `eu-north-1` | L'EC2 è in eu-north-1 |
| AWS CLI locale (SSM) | `eu-north-1` | |
| AWS CLI locale (Route53) | `us-east-1` | |
| RDS, S3, CloudFront | `eu-north-1` | |

**In `.env` backend sul server:**
```env
AWS_DEFAULT_REGION=us-east-1   ← usato da Route53 e S3 SDK
AWS_EC2_REGION=eu-north-1      ← usato da RemoteCommandService (SSM)
```

> **Attenzione**: NON usare `AWS_DEFAULT_REGION` nel SsmClient, altrimenti cerca l'istanza in us-east-1 dove non esiste. Usare `env('AWS_EC2_REGION', 'eu-north-1')`.

---

## 4. Accesso al server

### Via SSM (unico metodo — niente SSH)
```bash
# Da AWS Console
# IAM → Systems Manager → Session Manager → Start session → florenceegi-private

# Da CLI locale (richiede credenziali egi-hub-deploy)
aws ssm start-session --target i-0940cdb7b955d1632 --region eu-north-1

# Poi:
sudo -u forge bash
cd /home/forge/hub.florenceegi.com
```

### Eseguire comandi remoti (deploy, ecc.)
```bash
# Pattern base
aws ssm send-command \
  --instance-ids "i-0940cdb7b955d1632" \
  --document-name "AWS-RunShellScript" \
  --parameters 'commands=["sudo -u forge bash -c \"cd /path && comando\" 2>&1"]' \
  --timeout-seconds 60 \
  --region eu-north-1 \
  --query 'Command.CommandId' \
  --output text

# Recuperare output (poll)
aws ssm get-command-invocation \
  --command-id "<command-id>" \
  --instance-id "i-0940cdb7b955d1632" \
  --region eu-north-1 \
  --query '{Status:Status,Output:StandardOutputContent,Error:StandardErrorContent}' \
  --output json
```

> **Regola**: `ssm-user` non ha permessi sui file di forge. Usare SEMPRE `sudo -u forge bash -c "..."`.

---

## 5. Progetti — path e stack

| Slug | URL | Deploy Path EC2 | Stack |
|------|-----|-----------------|-------|
| `hub` *(EGI-HUB)* | hub.florenceegi.com | `/home/forge/hub.florenceegi.com` | Laravel (in `backend/`) + React (in `frontend/`) |
| `florenceegi` | florenceegi.com | `/home/forge/florenceegi.com` | Laravel + React |
| `art` | art.florenceegi.com | `/home/forge/art.florenceegi.com` | Laravel + React |
| `natan-loc` | natan-loc.florenceegi.com | `/home/forge/natan-loc.florenceegi.com` | Laravel + React |
| `info` | info.florenceegi.com | `/home/forge/info.florenceegi.com` | React only |

> **EGI-HUB è speciale**: `artisan` si trova in `backend/`, non nella root del repo. Il `composer.lock` è nella root.

### Deploy EGI-HUB (path corretti)
```bash
sudo -u forge bash -c "cd /home/forge/hub.florenceegi.com && git pull"
sudo -u forge bash -c "cd /home/forge/hub.florenceegi.com && composer install --no-dev --optimize-autoloader"
sudo -u forge bash -c "cd /home/forge/hub.florenceegi.com/backend && php artisan migrate --force && php artisan config:cache && php artisan route:cache && php artisan cache:clear"
sudo -u forge bash -c "cd /home/forge/hub.florenceegi.com/frontend && npm install && npm run build"
```

### Deploy altri progetti (struttura standard)
```bash
sudo -u forge bash -c "cd /home/forge/<slug>.florenceegi.com && git pull && composer install --no-dev --optimize-autoloader && php artisan migrate --force && php artisan config:cache && php artisan cache:clear"
```

---

## 6. EGI-HUB — struttura applicazione

```
/home/forge/hub.florenceegi.com/
├── composer.json          ← dipendenze root (florenceegi/hub package)
├── composer.lock          ← ATTENZIONE: PHP server 8.3.30 → symfony max v7.x
├── backend/
│   ├── artisan            ← PHP artisan qui, NON nella root
│   ├── .env               ← configurazione produzione
│   ├── app/
│   │   ├── Services/RemoteCommandService.php   ← deploy via SSM
│   │   ├── Console/Commands/DiscoverProjects.php ← Route53 discovery
│   │   └── Http/Controllers/Api/ProjectController.php
│   └── routes/api.php
└── frontend/
    ├── src/
    │   ├── pages/projects/ProjectDashboard.tsx  ← UI deploy comandi
    │   └── services/projectApi.ts
    └── dist/              ← build produzione (nginx serve da qui)
```

**Backend**: Laravel 11, porta 8001 (dev), PHP 8.3-FPM (prod)
**Frontend**: React 18 + Vite, porta 5174 (dev)
**Database**: PostgreSQL, schema `core`

---

## 7. Database

```
RDS: florenceegi-postgres-dev.c1i0048yu660.eu-north-1.rds.amazonaws.com
Database: florenceegi
Schema: core (EGI-HUB system tables)
Charset: UTF-8
```

**Tabelle chiave EGI-HUB:**
- `core.system_projects` — progetti registrati (scoperto da Route53)
- `core.users` — utenti superadmin
- `core.sessions`, `core.cache`, `core.jobs`

---

## 8. Nginx — configurazione prod

```nginx
# /etc/nginx/sites-available/hub.florenceegi.com
server {
    listen 80;
    server_name hub.florenceegi.com;

    location = /health {
        return 200 'OK';
        add_header Content-Type text/plain;
    }

    location /api {
        alias /home/forge/hub.florenceegi.com/backend/public;
        try_files $uri $uri/ @api_handler;
        location ~ \.php$ {
            fastcgi_pass unix:/run/php/php8.3-fpm.sock;
            fastcgi_param SCRIPT_FILENAME $request_filename;
            include fastcgi_params;
        }
    }

    location @api_handler {
        rewrite ^/api/(.*)$ /api/index.php?$query_string last;
    }

    location / {
        root /home/forge/hub.florenceegi.com/frontend/dist;
        try_files $uri $uri/ /index.html;
    }
}
```

---

## 9. RemoteCommandService — come funziona

Il `RemoteCommandService` (`backend/app/Services/RemoteCommandService.php`) permette di eseguire comandi sull'EC2 da dentro l'applicazione stessa:

1. Chiama `ssm:SendCommand` usando il role EC2 (`florenceegi-ec2-role`)
2. Aspetta il risultato con polling su `ssm:GetCommandInvocation`
3. Timeout: 90s (30 poll × 3s)

**Comandi predefiniti disponibili:**
```
git_pull, composer_install, npm_install, npm_build,
cache_clear, config_cache, migrate, queue_restart, deploy_full
```

**Stack detection** (`POST /api/projects/{id}/detect-stack`):
Verifica la presenza di `artisan`, `composer.json`, `package.json` nella deploy path → filtra i pulsanti nell'UI → cache in `metadata['stack']` per 1h.

---

## 10. IAM — permessi necessari

### EC2 Role (`florenceegi-ec2-role`) — permessi in produzione
```json
{
  "AmazonSSMManagedInstanceCore",    // essere gestito da SSM
  "AmazonSSMFullAccess",             // inviare comandi SSM ad altre istanze (aggiunto 2026-02-27)
  "AmazonRoute53ReadOnlyAccess",     // leggere DNS per projects:discover
  "AmazonS3FullAccess" (o policy custom su florenceegi-media)
}
```

### IAM User `egi-hub-deploy` — per AWS CLI locale
```json
{
  "AmazonSSMFullAccess",
  "AmazonRoute53ReadOnlyAccess"
}
```
> **Non ha**: IAM management (`iam:PutRolePolicy`, ecc.) — modifiche IAM vanno dalla Console.

---

## 11. Troubleshooting rapido

| Sintomo | Causa più probabile | Fix |
|---------|--------------------|----|
| `Instances not in a valid state for account` | SSM client usa `us-east-1` ma istanza è in `eu-north-1` | Verificare `AWS_EC2_REGION=eu-north-1` in `.env` e che `SsmClient` usi `env('AWS_EC2_REGION')` |
| `not authorized to perform: ssm:SendCommand` | EC2 role non ha SSM send permissions | IAM Console → `florenceegi-ec2-role` → Attach `AmazonSSMFullAccess` |
| `Could not open input file: artisan` | Il comando artisan è eseguito nella root, ma `artisan` è in `backend/` | Usare `cd backend && php artisan` per EGI-HUB |
| Composer: symfony v8 richiede PHP 8.4 | Lock file generato su PHP 8.4+ | Eseguire `composer update` sul server (PHP 8.3) per downgrade a symfony v7.x |
| `502 Bad Gateway` | PHP-FPM non running | `sudo systemctl restart php8.3-fpm` |
| Route53 discovery fallisce | Credenziali non disponibili | EC2 role deve avere `AmazonRoute53ReadOnlyAccess` |
| `CORS error` dal frontend | API URL sbagliato o `.env` APP_URL errato | Verificare `SANCTUM_STATEFUL_DOMAINS` in `.env` |
| Git pull fallisce (local changes) | File modificati direttamente sul server | `git checkout -- <file>` poi `git pull` |

---

## 12. Pattern comandi ricorrenti

### Deploy rapido EGI-HUB via CLI locale
```bash
CMDID=$(aws ssm send-command \
  --instance-ids "i-0940cdb7b955d1632" \
  --document-name "AWS-RunShellScript" \
  --parameters 'commands=["sudo -u forge bash -c \"cd /home/forge/hub.florenceegi.com && git pull && cd backend && php artisan migrate --force && php artisan config:cache && php artisan cache:clear && php artisan route:cache && cd ../frontend && npm run build\" 2>&1"]' \
  --timeout-seconds 180 \
  --region eu-north-1 \
  --query 'Command.CommandId' --output text)

sleep 60

aws ssm get-command-invocation \
  --command-id "$CMDID" \
  --instance-id "i-0940cdb7b955d1632" \
  --region eu-north-1 \
  --query '{Status:Status,Output:StandardOutputContent}' \
  --output json
```

### Verificare log Laravel
```bash
aws ssm send-command \
  --instance-ids "i-0940cdb7b955d1632" \
  --document-name "AWS-RunShellScript" \
  --parameters 'commands=["sudo tail -100 /home/forge/hub.florenceegi.com/backend/storage/logs/laravel.log 2>&1"]' \
  --timeout-seconds 30 \
  --region eu-north-1 \
  --query 'Command.CommandId' --output text
```

### Verificare variabile .env sul server
```bash
aws ssm send-command \
  --instance-ids "i-0940cdb7b955d1632" \
  --document-name "AWS-RunShellScript" \
  --parameters 'commands=["grep NOME_VARIABILE /home/forge/hub.florenceegi.com/backend/.env 2>&1"]' \
  --timeout-seconds 30 --region eu-north-1 \
  --query 'Command.CommandId' --output text
```

### Aggiungere variabile al .env sul server
```bash
# Sostituire NOME=valore con la variabile effettiva
aws ssm send-command \
  --instance-ids "i-0940cdb7b955d1632" \
  --document-name "AWS-RunShellScript" \
  --parameters 'commands=["echo NOME=valore >> /home/forge/hub.florenceegi.com/backend/.env && sudo -u forge bash -c \"cd /home/forge/hub.florenceegi.com/backend && php artisan config:cache\""]' \
  --timeout-seconds 30 --region eu-north-1 \
  --query 'Command.CommandId' --output text
```

---

*Documento creato durante la sessione di sviluppo 2026-02-27.*
*Aggiornare questo file ogni volta che cambiano risorse AWS, ID istanze, IAM policies o variabili .env critiche.*
