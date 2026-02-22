# EGI-HUB - Guida Deploy AWS

**Versione**: 2.0
**Data**: 20 febbraio 2026
**Infrastruttura**: AWS EC2 privata dietro ALB

---

## Architettura

```
Internet → Route 53 (hub.florenceegi.com) → ALB (HTTPS:443) → EC2 privata (10.0.3.21)
                                                                    │
                                                          Nginx (vhost routing)
                                                                    │
                                                    ┌───────────────┼───────────────┐
                                                    │                               │
                                              frontend/dist/                 backend/public/
                                              (React SPA)                    (Laravel API)
                                                                                    │
                                                                               PHP 8.3-FPM
                                                                                    │
                                                                            PostgreSQL (RDS)
```

---

## Risorse AWS

| Risorsa | Identificativo |
|---------|---------------|
| EC2 | `i-0940cdb7b955d1632` (florenceegi-private), t3.small, 10.0.3.21 |
| ALB | florenceegi-alb |
| Target Group | tg-florenceegi-prod-http-80 |
| RDS | florenceegi-postgres-dev.c1i0048yu660.eu-north-1.rds.amazonaws.com |
| S3 | florenceegi-media |
| CloudFront | media.florenceegi.com |
| DNS | hub.florenceegi.com → ALB (A Alias) |

---

## Nginx Vhost

```nginx
server {
    listen 80;
    server_name hub.florenceegi.com;

    # Health check per ALB
    location = /health {
        access_log off;
        return 200 'OK';
        add_header Content-Type text/plain;
    }

    # API Laravel (backend)
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

    # Frontend React SPA (catch-all)
    location / {
        root /home/forge/hub.florenceegi.com/frontend/dist;
        try_files $uri $uri/ /index.html;
    }
}
```

---

## Variabili .env (backend)

```env
APP_NAME=EGI-HUB
APP_ENV=production
APP_DEBUG=false
APP_URL=https://hub.florenceegi.com

DB_CONNECTION=pgsql
DB_HOST=florenceegi-postgres-dev.c1i0048yu660.eu-north-1.rds.amazonaws.com
DB_PORT=5432
DB_DATABASE=florenceegi
DB_USERNAME=<username>
DB_PASSWORD=<password>
DB_SEARCH_PATH=core,public

SESSION_DRIVER=database
CACHE_STORE=database
QUEUE_CONNECTION=database

SANCTUM_STATEFUL_DOMAINS=hub.florenceegi.com
SESSION_DOMAIN=.florenceegi.com

FILESYSTEM_DISK=s3
MEDIA_DISK=s3
AWS_ACCESS_KEY_ID=<key>
AWS_SECRET_ACCESS_KEY=<secret>
AWS_DEFAULT_REGION=eu-north-1
AWS_BUCKET=florenceegi-media
```

---

## Deploy Manuale

### Accesso al server
```bash
# Via AWS SSM Session Manager (niente SSH)
# AWS Console → Systems Manager → Session Manager → Start session → florenceegi-private
# Poi: sudo -u forge bash
```

### Primo deploy
```bash
# 1. Clone (gia fatto)
cd /home/forge/hub.florenceegi.com

# 2. Backend
cd backend
cp .env.example .env
# Editare .env con i valori di produzione
composer install --no-dev --optimize-autoloader
php artisan key:generate
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan storage:link

# 3. Permessi
chmod -R 775 storage bootstrap/cache

# 4. Frontend
cd ../frontend
npm install
npm run build

# 5. Restart PHP-FPM
sudo systemctl restart php8.3-fpm
```

### Deploy successivi
```bash
sudo -u forge bash -c "cd /home/forge/hub.florenceegi.com && \
    git pull origin main && \
    cd backend && \
    composer install --no-dev --optimize-autoloader && \
    php artisan migrate --force && \
    php artisan config:cache && \
    php artisan route:cache && \
    php artisan view:cache && \
    cd ../frontend && \
    npm install && \
    npm run build"
sudo systemctl restart php8.3-fpm
```

---

## Verifica

```bash
# Health check (dal server)
curl -H "Host: hub.florenceegi.com" http://localhost/health

# API test
curl -H "Host: hub.florenceegi.com" http://localhost/api/ecosystem

# Da esterno (dopo DNS propagation)
curl https://hub.florenceegi.com/health
curl https://hub.florenceegi.com/api/ecosystem
```

---

## Troubleshooting

| Problema | Causa | Soluzione |
|----------|-------|-----------|
| 502 Bad Gateway | PHP-FPM non running | `sudo systemctl restart php8.3-fpm` |
| 404 su /api/* | Nginx non trova backend | Verificare path in vhost e `alias` directive |
| React blank page | Build non eseguito | `cd frontend && npm run build` |
| DB connection refused | Security group o .env | Verificare SG del RDS permette 10.0.3.21 |
| `cd` fallisce in SSM | ssm-user permessi | Usare `sudo -u forge bash -c "cd ... && ..."` |
| Composer memory | t3.small ha 2GB RAM | `php -d memory_limit=-1 /usr/local/bin/composer install` |
| Permission denied su storage | www-data non accede | `chmod 755 /home/forge && chmod -R 775 storage` |

---

## Note

- **Accesso admin**: Solo via SSM Session Manager (zero porte SSH aperte)
- **Egress**: EC2 → NAT Gateway → Internet (per composer, npm, git, API esterne)
- **Media**: S3 (florenceegi-media) serviti via CloudFront (media.florenceegi.com)
- **Vecchia guida Forge/sslip.io**: Deprecata, sostituita da questo documento
