# FlorenceEGI — Executive Summary
> Guida completa per capire e spiegare il progetto. Scritta per chi non ha un background tecnico.
> **Aggiornato**: 2026-02-27

---

## Prima di tutto: la visione

FlorenceEGI nasce da una domanda semplice:

> *Nel mondo digitale, come si certifica che qualcosa è autentico? Come si fa sì che chi crea venga riconosciuto e pagato, per sempre, in modo automatico?*

La risposta è **EGI** — un certificato digitale che incapsula qualsiasi "bene frutto dell'ingegno umano" (un'opera d'arte, un brevetto, un diritto, un progetto ambientale) e lo ancora permanentemente su **blockchain Algorand**, rendendolo tracciabile, commerciabile e immutabile.

FlorenceEGI non è un sito. È un **ecosistema di applicazioni** che ruotano tutte attorno a questo concetto: trasformare beni reali in asset digitali certificati, con pagamenti automatici, royalty e governance trasparente.

---

## Cos'è un EGI (il concetto centrale)

**EGI = Ecological Goods Invent** (o *Environment Goods Invent* nei documenti tecnici più recenti).

Pensalo come una **carta di identità digitale permanente** per un'opera o un bene. Dentro ci sono:

- L'identità dell'autore originale (non si cancella mai)
- La traccia di chi ha "attivato" l'opera (il co-creatore)
- Il contributo ambientale collegato (progetto EPP verificato)
- Il valore economico, commerciabile e con royalty automatiche

Tecnicamente, un EGI è un **ASA** (Algorand Standard Asset) — un token sulla blockchain Algorand, con costo di transazione di circa €0,001 e finalità in meno di 5 secondi.

### I tre ruoli del ciclo di vita di un EGI

| Ruolo | Chi è | Cosa fa |
|-------|-------|---------|
| **Creator / Artista** | Chi crea l'opera | Conserva sempre il copyright e i diritti morali |
| **Co-Creatore** | Chi "attiva" l'opera con il minting | La sua firma è permanente sulla blockchain, anche se l'opera viene rivenduta |
| **Collector** | Chi acquista e custodisce l'opera | Possiede l'opera, può rivenderla, ma NON acquisisce il copyright |

Il flusso è: `Creator → Co-Creatore (Minting) → Collector → Memoria Permanente Blockchain`

---

## Le applicazioni dell'ecosistema

L'ecosistema è composto da più applicazioni (chiamate **"verticali"** o **"progetti"**), tutte costruite sullo stesso fondamento EGI. Ognuna serve un mercato diverso.

### 1. FlorenceEGI — `florenceegi.com` e `art.florenceegi.com`
**La piattaforma principale.** Gestisce:
- La creazione e il marketplace degli EGI artistici
- Portfolio degli artisti/creator
- Il sistema di co-creazione e minting
- Royalty automatiche su ogni rivendita
- AI integrata (NATAN) come assistente

### 2. NATAN_LOC — `natan-loc.florenceegi.com`
**Verticale per la localizzazione.** Applica il sistema EGI al mondo della traduzione e localizzazione di contenuti. Stessa infrastruttura tecnica, mercato diverso.

### 3. EGI-INFO — `info.florenceegi.com`
**Sito informativo** del progetto. Spiega la visione, la filosofia e come funziona l'ecosistema. Solo frontend React (nessun backend proprio).

### 4. ART — `art.florenceegi.com`
**Verticale dedicato all'arte**. Parte dell'ecosistema FlorenceEGI ma con focus specifico sul mercato artistico.

### 5. EGI-HUB — `hub.florenceegi.com`
**Il centro di controllo.** Non è visibile agli utenti finali. È il pannello di gestione per il SuperAdmin (Fabio) che:
- Monitora tutti i progetti
- Gestisce i Project Admin (chi amministra ogni verticale)
- Esegue deploy e aggiornamenti sui server
- Controlla la salute dei sistemi
- Gestisce billing, piani, abbonamenti, provider di pagamento

---

## Come sono costruite tecnicamente (in parole semplici)

Ogni applicazione ha due parti, come un iceberg:

```
┌────────────────────────────────────────┐
│         FRONTEND (la parte visibile)   │
│  React 18 + TypeScript                │
│  Quello che l'utente vede nel browser  │
└────────────────┬───────────────────────┘
                 │  parla con →
┌────────────────▼───────────────────────┐
│         BACKEND (il cervello)          │
│  Laravel 11 (PHP)                     │
│  Elabora dati, gestisce pagamenti,    │
│  parla con database e blockchain       │
└────────────────┬───────────────────────┘
                 │  salva su →
┌────────────────▼───────────────────────┐
│         DATABASE                       │
│  PostgreSQL (AWS RDS)                 │
│  Tutti i dati permanenti               │
└────────────────────────────────────────┘
```

**Analogia**: il frontend è la vetrina di un negozio, il backend è il magazzino e la cassa, il database è il registro contabile.

### Stack tecnologico (per chi vuole i dettagli)

| Componente | Tecnologia | Ruolo |
|-----------|-----------|-------|
| Frontend | React 18 + TypeScript + Vite | Interfaccia utente |
| Stile | TailwindCSS + DaisyUI | Design e componenti UI |
| Backend | Laravel 11 (PHP 8.3) | API, logica di business |
| Database | PostgreSQL su AWS RDS | Dati persistenti |
| Blockchain | Algorand | Certificazione EGI immutabile |
| Pagamenti | Stripe (API diretta) | Transazioni, royalty, split |
| AI | NATAN (modelli LLM) | Assistente integrato, RAG |
| Storage media | AWS S3 + CloudFront | File, immagini, documenti |

---

## L'infrastruttura AWS (il "palazzo" dove tutto gira)

Tutta l'infrastruttura è su **Amazon Web Services (AWS)**, in Europa (regione `eu-north-1` = Stoccolma).

### La mappa semplificata

```
Internet
  │
  ▼
Route 53 (DNS — il "rubrica telefonica" di florenceegi.com)
  │
  ▼
ALB — Application Load Balancer (il "portiere" che smista le richieste)
  │
  ▼
EC2 (il "server" — un computer virtuale su AWS)
  ID: i-0940cdb7b955d1632 | Tipo: t3.small | IP privato: 10.0.3.21
  │
  ├── Nginx (il "cameriere" che consegna le pagine giuste)
  │     ├── /api → Laravel (backend PHP)
  │     └── / → React (frontend HTML/JS)
  │
  └── PostgreSQL RDS (database separato, più sicuro)
```

### I componenti AWS e a cosa servono

| Servizio | Nome nel progetto | A cosa serve |
|----------|------------------|-------------|
| **Route 53** | `florenceegi.com` | DNS: traduce i nomi di dominio in indirizzi IP (come una rubrica) |
| **ALB** | `florenceegi-alb` | Riceve le richieste HTTPS e le gira al server giusto |
| **EC2** | `florenceegi-private` | Il server principale dove girano tutte le app |
| **RDS** | `florenceegi-postgres-dev` | Database PostgreSQL (dati degli utenti, EGI, transazioni) |
| **S3** | `florenceegi-media` | Archiviazione file (immagini, documenti) — privato |
| **CloudFront** | `media.florenceegi.com` | CDN: consegna i media velocemente in tutto il mondo |
| **SSM** | Systems Manager | Permette di eseguire comandi sul server senza SSH |
| **IAM** | Gestione accessi | Chi può fare cosa su AWS |

### Regole critiche sulle regioni AWS

> ⚠️ Questo è il punto che ha causato più confusione: AWS ha servizi in regioni diverse.

| Servizio | Regione | Perché |
|---------|---------|--------|
| EC2, RDS, SSM | `eu-north-1` (Stoccolma) | Dove si trovano fisicamente i server |
| Route 53 | `us-east-1` (Virginia) | Route 53 è un servizio globale con endpoint in us-east-1 |

Se si sbaglia regione, si ottengono errori come *"instance not found"* anche se tutto è corretto.

---

## Come si accede al server (sicurezza)

Non esiste accesso SSH tradizionale. Si usa esclusivamente **AWS SSM (Systems Manager)**.

**Perché SSM invece di SSH?**
SSH richiederebbe porte aperte al pubblico (rischio di attacchi). SSM viaggia attraverso AWS in modo sicuro, senza esporre porte.

**Come funziona nella pratica:**

```bash
# Da riga di comando locale (richiede credenziali AWS)
aws ssm start-session --target i-0940cdb7b955d1632 --region eu-north-1

# Una volta dentro, si lavora sempre come utente "forge":
sudo -u forge bash
cd /home/forge/hub.florenceegi.com
```

**Importante**: I file del progetto appartengono all'utente `forge`. L'utente SSM di default non ha permessi su quei file, quindi bisogna sempre eseguire i comandi come `sudo -u forge bash -c "..."`.

### Dove si trovano i file sul server

```
/home/forge/
├── hub.florenceegi.com/        ← EGI-HUB (backend/ + frontend/)
├── florenceegi.com/            ← App principale EGI
├── art.florenceegi.com/        ← Verticale Art
├── natan-loc.florenceegi.com/  ← Verticale NATAN_LOC
└── info.florenceegi.com/       ← Sito informativo (solo React)
```

**Attenzione per EGI-HUB**: È strutturato diversamente dagli altri.
- `artisan` (tool Laravel) è dentro `backend/`, non nella root
- `composer.lock` è nella root del repo
- I comandi vanno sempre fatti dalla directory corretta

---

## Come si fa un "deploy" (come si aggiorna il sito)

Un **deploy** è il processo con cui il codice scritto sul computer dello sviluppatore arriva effettivamente sul server e diventa visibile agli utenti.

Il processo tipico per tutti i progetti (escluso EGI-HUB):

```
1. git pull         → scarica le ultime modifiche dal repository GitHub
2. composer install → installa/aggiorna le librerie PHP
3. npm run build    → compila il frontend React in file HTML/JS statici
4. php artisan migrate → aggiorna il database con le nuove strutture
5. php artisan config:cache → svuota e ricostruisce la cache di configurazione
```

### Deploy via EGI-HUB (la novità recente)

EGI-HUB ora può eseguire questi comandi direttamente dalla dashboard, senza dover aprire un terminale. Funziona così:

```
Dashboard EGI-HUB (browser)
  → clicca "Git Pull" su un progetto
  → backend Laravel chiama AWS SSM
  → SSM esegue il comando sul server
  → mostra il risultato nella dashboard
```

Questo usa il meccanismo **RemoteCommandService**, che manda comandi al server tramite SSM e aspetta il risultato (max 90 secondi di polling).

---

## Il sistema di pagamenti

I pagamenti sono gestiti con **Stripe** (direttamente, senza librerie intermediarie).

### Come funziona

- Ogni utente/creator che vuole ricevere pagamenti si collega un account Stripe (tramite Stripe Connect)
- Quando un collector acquista un EGI, il pagamento viene **diviso automaticamente** (split):
  - Una percentuale va al Creator
  - Una percentuale va alla piattaforma
  - Royalty automatiche ad ogni rivendita

### Stato attuale

Il sistema è in **modalità Sandbox** (simulazione). Passare a Live richiede:
- Nuove API key Stripe di produzione
- Nuovo webhook secret
- Re-onboarding Connect di tutti gli utenti esistenti

---

## Il sistema AI (NATAN)

**NATAN** è l'AI integrata in FlorenceEGI. Non è un'AI esterna "collegata", ma è progettata per essere parte dell'ecosistema.

### Cosa fa

- **AI Sidebar**: Assistente contestuale presente in ogni pagina, conosce il contesto della pagina corrente
- **RAG (Retrieval-Augmented Generation)**: L'AI cerca prima nei documenti del progetto prima di rispondere, per dare risposte accurate e non inventate
- **AI Advisor**: Suggerimenti personalizzati per creator e collector

### Come evita le "allucinazioni"

Il sistema usa una gerarchia di fonti:
1. Contesto della vista corrente (100% accurato)
2. Conoscenza statica della piattaforma
3. RAG (ricerca dinamica nei documenti)

Le fonti più specifiche hanno priorità su quelle generiche.

---

## Gli utenti e i ruoli

Il sistema ha una gerarchia di utenti:

```
SuperAdmin (Fabio)
  │  → accede a hub.florenceegi.com
  │  → gestisce tutto l'ecosistema
  │
  ├── Project Admin (es. admin di NATAN_LOC)
  │     → accede alla dashboard del suo progetto
  │     → gestisce i tenant del suo verticale
  │
  └── Tenant (utente finale)
        → artista, creator, collector
        → usa le app per creare/comprare/vendere EGI
```

**Nota**: "Tenant" in EGI-HUB significa "cliente finale di un verticale", non un tenant di hosting.

---

## La struttura del codice (per chi deve lavorarci)

### Repository GitHub

| Repository locale | URL pubblico | Cosa contiene |
|------------------|-------------|---------------|
| `/home/fabio/EGI` | art.florenceegi.com / florenceegi.com | App principale |
| `/home/fabio/EGI-HUB` | hub.florenceegi.com | Control plane |
| `/home/fabio/NATAN_LOC` | natan-loc.florenceegi.com | Verticale NATAN |
| `/home/fabio/EGI-INFO` | info.florenceegi.com | Sito info |
| `/home/fabio/EGI-HUB-HOME-REACT` | (componente React condiviso) | — |

### Struttura EGI-HUB (la più complessa)

```
EGI-HUB/
├── backend/                    ← Laravel 11 (API-only)
│   ├── app/
│   │   ├── Http/Controllers/Api/   ← 30 controller
│   │   ├── Services/               ← Logica di business
│   │   │   ├── RemoteCommandService.php  ← Deploy via SSM
│   │   │   └── ProjectService.php
│   │   └── Models/                 ← 32 modelli DB
│   ├── routes/api.php              ← Tutte le ~80 rotte
│   └── .env                        ← Configurazione produzione
│
├── frontend/                   ← React 18 SPA
│   ├── src/
│   │   ├── pages/              ← 37 pagine
│   │   ├── components/         ← Componenti riutilizzabili
│   │   └── services/           ← Chiamate API
│   └── dist/                   ← Build produzione (serve Nginx)
│
└── docs/                       ← Documentazione progetto
    ├── AWS_INFRASTRUCTURE.md   ← Reference AWS completo
    ├── EGI_HUB_CONTEXT.md      ← Contesto operativo HUB
    └── questo file
```

### Package speciali usati

EGI-HUB usa 5 pacchetti privati sviluppati internamente (chiamati **Ultra***):
- **UltraLogManager**: sistema di logging avanzato
- **UltraErrorManager**: gestione errori centralizzata
- **UltraUploadManager**: gestione upload file
- **UltraTranslationManager**: traduzioni
- **UltraConfigManager**: configurazioni

Questi pacchetti non sono pubblici — risiedono su GitHub privato e vengono scaricati via SSH.

---

## IAM — Chi ha accesso a cosa su AWS

**IAM** (Identity and Access Management) è il sistema di permessi di AWS. Nel progetto esistono due "identità":

### 1. EC2 Role — `florenceegi-ec2-role`
È il "passaporto" del server EC2. Permette al server di:
- Essere gestito tramite SSM
- Inviare comandi SSM ad altri server (per il deploy remoto)
- Leggere i record DNS da Route 53 (per la funzione "Discover Projects")
- Accedere a S3 per i media

### 2. IAM User — `egi-hub-deploy`
È l'utente AWS per operazioni locali (da terminale sul computer di sviluppo). Permette di:
- Connettersi al server via SSM
- Leggere i record DNS da Route 53

**Non può**: modificare le policy IAM (deve farlo dalla console AWS manualmente).

---

## Problemi noti e come risolverli

| Sintomo | Causa | Soluzione |
|---------|-------|----------|
| "Instance not in valid state" | SSM cerca il server nella regione sbagliata | Verificare `AWS_EC2_REGION=eu-north-1` nel `.env` |
| "Could not open artisan" | Il comando artisan è in `backend/`, non nella root | `cd backend && php artisan ...` per EGI-HUB |
| Composer fallisce (symfony v8) | PHP 8.3 sul server, symfony 8 richiede PHP 8.4 | Eseguire `composer update` sul server |
| 502 Bad Gateway | PHP-FPM non funziona | `sudo systemctl restart php8.3-fpm` |
| 413 Content Too Large | Nginx blocca upload grandi | Verificare `client_max_body_size 50M` in Nginx |
| "not authorized ssm:SendCommand" | EC2 role manca di SSMFullAccess | Console AWS → IAM → florenceegi-ec2-role → aggiungi AmazonSSMFullAccess |

---

## Glossario rapido

| Termine | Significato semplice |
|---------|---------------------|
| **EGI** | Certificato digitale su blockchain per beni dell'ingegno |
| **Minting** | Il processo di "coniare" un EGI sulla blockchain |
| **ASA** | Token su Algorand (il formato tecnico degli EGI) |
| **Blockchain** | Registro digitale immutabile e distribuito |
| **Algorand** | La blockchain usata da FlorenceEGI (veloce, economica, green) |
| **Frontend** | La parte visibile del sito (ciò che vede l'utente) |
| **Backend** | Il "cervello" invisibile (logica, database, API) |
| **API** | Come due sistemi si parlano (come una presa elettrica standardizzata) |
| **Deploy** | Aggiornare il sito in produzione |
| **EC2** | Il server virtuale su Amazon Web Services |
| **RDS** | Il database gestito da Amazon |
| **S3** | Lo storage file di Amazon (come un disco esterno sul cloud) |
| **CloudFront** | Il CDN di Amazon (consegna i file veloce in tutto il mondo) |
| **SSM** | Il sistema che permette di inviare comandi al server senza SSH |
| **Route 53** | Il servizio DNS di Amazon (la "rubrica" dei domini) |
| **ALB** | Il load balancer (smista il traffico verso il server giusto) |
| **IAM** | Il sistema di permessi di AWS |
| **Laravel** | Il framework PHP usato per il backend |
| **React** | Il framework JavaScript usato per il frontend |
| **PostgreSQL** | Il database relazionale usato nel progetto |
| **Stripe** | Il sistema di pagamenti (carte di credito, split, royalty) |
| **Stripe Connect** | Il sistema che permette ai creator di ricevere pagamenti |
| **RAG** | Sistema AI che cerca nei documenti prima di rispondere |
| **Sanctum** | Sistema di autenticazione di Laravel (sessioni, token) |
| **Nginx** | Il server web che gestisce le richieste HTTP (il "portiere") |
| **PHP-FPM** | Il processo che esegue il codice PHP sul server |
| **Vite** | Il tool che compila il frontend React |
| **TanStack Query** | Libreria React per gestire le chiamate API e la cache |
| **Verticale** | Un'applicazione specifica dell'ecosistema (es. NATAN_LOC) |
| **Tenant** | L'utente finale di un verticale (creator, collector) |
| **SuperAdmin** | Chi gestisce l'intero ecosistema tramite EGI-HUB |
| **EPP** | Environmental Protection Project — il contributo ambientale legato all'EGI |

---

## Numeri chiave da ricordare

| Cosa | Valore |
|------|-------|
| Server EC2 (produzione) | `i-0940cdb7b955d1632` |
| IP privato EC2 | `10.0.3.21` |
| PHP sul server | `8.3.30` (importante: non supporta symfony 8!) |
| Porta backend locale (dev) | `8001` |
| Porta frontend locale (dev) | `5174` |
| Regione EC2/SSM | `eu-north-1` (Stoccolma) |
| Regione Route 53 | `us-east-1` (Virginia — sempre, è globale) |
| Account AWS | `504606041369` |
| Hosted Zone Route 53 | `Z05052791PPWNJ3NKL131` |
| Database schema EGI-HUB | `core` |
| Database schema EGI | `rag_natan` (per il sistema AI) |

---

*Documento creato: 2026-02-27*
*Aggiornare quando cambiano architettura, infrastruttura o ruoli.*
