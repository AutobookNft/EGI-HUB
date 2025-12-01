# **PROJECT INDEPENDENT - DEVELOPMENT STANDARDS**

**Version**: 1.0.0
**Date**: 2025-10-28
**Context**: Universal Development Standards
**Foundation**: OS3.0 Standards (see `docs/Standards/cursorrules_*.md` files for universal rules)

---

> **NOTE:** Questo file contiene le regole di sviluppo universali applicabili a qualsiasi progetto.
> Per le regole universali OS3.0 (REGOLA ZERO, I18N, STATISTICS, UEM-FIRST, etc.) fare riferimento ai file `docs/Standards/cursorrules_*.md`

---

# **🏗️ STANDARD DI SVILUPPO UNIVERSALI**

## **LIVELLO APPLICAZIONE:**

**Standard enterprise-grade applicabili a piattaforme mission-critical:**

-   🏢 **Standard richiesti**: Enterprise-grade, audit-ready, compliance-first
-   📊 **Criticità dati**: Ogni dato mostrato deve essere accurato e completo
-   🔒 **Sicurezza**: GDPR mandatory, audit trail completo, privacy by design
-   📈 **Scalabilità**: Architettura per migliaia di utenti concorrenti

## **IMPLICAZIONI OPERATIVE:**

### **🚨 CREDIBILITÀ ENTERPRISE:**

-   **Zero tolleranza errori**: Una statistica sbagliata = fiducia persa = progetto a rischio
-   **Trasparenza totale**: Ogni operazione deve essere tracciabile e verificabile
-   **Dati completi**: Mai mostrare dati parziali come se fossero completi
-   **Professionalità**: Codice enterprise-grade, no shortcuts, no workarounds

### **🔒 COMPLIANCE:**

-   **GDPR obbligatorio**: Non optional, non "nice to have" - è BLOCKING
-   **Audit trail**: Ogni modifica dati personali deve essere loggata
-   **Consent management**: Check esplicito prima di ogni operazione su dati sensibili
-   **Error handling**: Mai esporre errori tecnici agli utenti finali

### **📊 QUALITÀ CODICE:**

-   **OOP puro**: No procedural spaghetti code
-   **Design patterns**: Repository, Service, DTO quando appropriati
-   **Type safety**: Type hints sempre, strict types quando possibile
-   **Testing mindset**: Codice deve essere testabile (anche se test non sempre scritti)

### **🎯 USER EXPERIENCE ENTERPRISE:**

-   **Interfaccia professionale**: No colori sgargianti, no animazioni eccessive
-   **Accessibilità WCAG 2.1 AA**: Obbligatoria per compliance enterprise
-   **Performance**: Caricamenti rapidi, no lag percepibile
-   **Affidabilità**: Sistema deve essere percepito come solido e stabile

## **⚠️ COSA SIGNIFICA IN PRATICA:**

**Quando scrivi codice enterprise:**

1. ❓ **"Questo codice resisterebbe ad un audit di compliance?"**
2. ❓ **"Se questo dato fosse sbagliato, perderemmo il cliente?"**
3. ❓ **"Questa soluzione è enterprise-grade o è un workaround?"**
4. ❓ **"Il GDPR officer approverebbe questo flusso?"**

**Se la risposta a qualsiasi domanda è NO → 🛑 STOP e ripensa l'approccio**

---

# **🎨 BRAND GUIDELINES OBBLIGATORIE**

**Documenti di riferimento**: Brand guidelines e design system del progetto  
**Leggere SEMPRE prima di creare/modificare UI, layout, colori**

## **PALETTE COLORI:**

```css
#D4A574 - Oro Fiorentino (CTA, premium, evidenziazioni)
#2D5016 - Verde Rinascita (sostenibilità, EPP, ambiente)
#1B365D - Blu Algoritmo (tecnologia, blockchain, trust)
#6B6B6B - Grigio Pietra (testi secondari, bordi)
#C13120 - Rosso Urgenza (alert, azioni critiche)
#E67E22 - Arancio Energia (notifiche positive)
#8E44AD - Viola Innovazione (premium, futuristico)
```

## **TIPOGRAFIA:**

-   **Titoli**: Playfair Display / Crimson Text (eleganza rinascimentale)
-   **Corpo**: Source Sans Pro / Open Sans (leggibilità moderna)
-   **Mono**: JetBrains Mono / Fira Code (codice, dati tecnici)

## **PRINCIPI UI/UX FONDAMENTALI:**

-   ✅ Eleganza rinascimentale - spazi bianchi, proporzioni auree
-   ✅ Zero friction - ogni azione chiara e immediata
-   ✅ Trasparenza - fee, royalty, impatti sempre visibili
-   ✅ Accessibilità WCAG 2.1 AA obbligatoria
-   ❌ NO colori sgargianti - no crypto-hype style
-   ❌ NO gergo tecnico/crypto - linguaggio nobile accessibile
-   ❌ NO animazioni eccessive - eleganza e sobrietà

## **QUANDO LAVORI SU UI:**

1. 📖 Leggi Brand Guidelines complete
2. 🎨 Verifica palette colori usata
3. 📐 Rispetta principi layout rinascimentale
4. ♿ Testa accessibilità WCAG 2.1 AA

---

# **🏛️ REGOLA MiCA-SAFE - COMPLIANCE EUROPEA OBBLIGATORIA**

## **🚨 FLORENCE EGI DEVE RIMANERE 100% MiCA-SAFE 🚨**

**PRINCIPIO FONDAMENTALE:** Le piattaforme crypto NON devono mai richiedere licenze europee (CASP/EMI).

## **✅ COSA È PERMESSO (MiCA-SAFE):**

-   **Emettere NFT/ASA** per conto dell'utente (minting service)
-   **Custodire temporaneamente** NFT in wallet della piattaforma
-   **Trasferire NFT** a wallet utenti su richiesta
-   **Gestire pagamenti FIAT** tramite PSP tradizionali (Stripe, PayPal)
-   **Fornire servizi tecnologici** blockchain senza toccare crypto-asset per conto terzi

## **❌ COSA È VIETATO (RICHIEDE LICENZA):**

-   **Custodire criptovalute** (ALGO, USDC, etc.) per conto degli utenti
-   **Fare da exchange** crypto/fiat
-   **Processare pagamenti crypto** direttamente
-   **Fornire wallet custodial** per crypto-asset degli utenti
-   **Gestire chiavi private** di wallet utenti contenenti crypto

## **📋 IMPLICAZIONI OPERATIVE:**

### **LIVELLO 1 - Nessun wallet (100% tradizionale):**

-   ✅ Cliente paga in EUR via PSP
-   ✅ Piattaforma minta EGI su wallet proprio
-   ✅ Cliente riceve certificato PDF + QR verifica
-   ❌ **NO wallet custodial per il cliente**
-   ❌ **NO gestione crypto per conto del cliente**

### **LIVELLO 2 - Ho un wallet, pago in FIAT:**

-   ✅ Cliente paga in EUR via PSP
-   ✅ Cliente fornisce indirizzo wallet proprio
-   ✅ Piattaforma trasferisce EGI al wallet cliente
-   ❌ **NO gestione del wallet cliente**
-   ❌ **NO custodia crypto per il cliente**

### **LIVELLO 3 - Pagamenti Crypto (Partner esterni):**

-   ✅ Partner CASP/EMI gestisce pagamenti crypto
-   ✅ Piattaforma riceve solo notifica di pagamento completato
-   ❌ **NO gestione diretta pagamenti crypto**
-   ❌ **NO custodia crypto anche temporanea**

## **🛡️ CONTROLLI AUTOMATICI:**

**PRIMA DI IMPLEMENTARE QUALSIASI FEATURE BLOCKCHAIN:**

1. ❓ **"Questa funzione richiede custodia crypto per utenti?"** → SE SÌ: ❌ STOP
2. ❓ **"Questa funzione tocca crypto-asset di proprietà utenti?"** → SE SÌ: ❌ STOP
3. ❓ **"Questa funzione richiede licenza CASP/EMI?"** → SE SÌ: ❌ STOP
4. ❓ **"Posso implementarla solo con NFT/ASA + FIAT?"** → SE NO: ❌ STOP

## **🚨 SE VIOLI MiCA-SAFE:**

```
🛑 VIOLAZIONE MiCA-SAFE RILEVATA!

Funzione proposta: [nome funzione]
Violazione: [descrizione]
Licenza richiesta: [CASP/EMI/ALTRO]

AZIONI OBBLIGATORIE:
1. STOP implementazione immediato
2. Propongo alternative MiCA-safe
3. Documento il rischio di compliance
4. Aspetto conferma esplicita per procedere
```

## **🎯 ARCHITECTURE PATTERN MiCA-SAFE:**

**SEMPRE APPLICARE:**

-   **Gateway PSP** per tutti i pagamenti fiat
-   **Microservizio blockchain** separato per operazioni tecniche
-   **Wallet piattaforma** per custodia temporanea EGI
-   **Transfer automatici** EGI → wallet utenti
-   **Zero gestione crypto** proprietà utenti

**Questa regola è BLOCKING: se violi MiCA-safe, tutto il progetto è a rischio normativo.**

---

# **📋 WORKFLOW DI SVILUPPO ENTERPRISE**

## **APPROCCIO STRUTTURATO ALLO SVILUPPO:**

### **STEP 1: ANALISI CONTESTUALE**

Prima di ogni modifica:

-   ✅ Comprendi il dominio applicativo e i requisiti di compliance
-   ✅ Identifica gli stakeholder e i loro bisogni
-   ✅ Valuta l'impatto sui sistemi esistenti
-   ✅ Considera scalabilità e performance

### **STEP 2: PIANIFICAZIONE TECNICA**

Per ogni feature/task:

-   ✅ Definisci acceptance criteria chiari
-   ✅ Identifica pattern architetturali appropriati
-   ✅ Pianifica testing e quality assurance
-   ✅ Considera sicurezza e compliance (GDPR, audit trail)

### **STEP 3: IMPLEMENTAZIONE**

Durante lo sviluppo:

-   ✅ Segui standard enterprise-grade
-   ✅ Mantieni qualità codice elevata
-   ✅ Documenta decisioni architetturali
-   ✅ Implementa logging e monitoring appropriati

### **STEP 4: VALIDAZIONE E DEPLOYMENT**

Prima del rilascio:

```
📋 ENTERPRISE DEVELOPMENT CHECKLIST:
- Current Phase: FASE [X]
- Current Task: [Task ID e nome]
- Status: [completati]/[totali] task
- Dependencies: [✅ OK | ⚠️ MANCANTI: lista]

🎯 PROPOSED ACTION:
[Descrizione task da fare]

Procedo? [SI/NO/MODIFICHE]
```

## **✅ VALIDATION CHECKLIST:**

```
🛑 VALIDATION CHECKLIST - Prima del commit:

- [ ] Codice rispetta standard enterprise-grade?
- [ ] GDPR compliance verificata?
- [ ] Error handling implementato correttamente?
- [ ] Performance e scalabilità considerate?
- [ ] Testing mindset applicato?
- [ ] Documentazione aggiornata?
```

## **🔄 BEST PRACTICES PER PROGETTI ENTERPRISE:**

### **Project Management:**

-   ✅ Pianifica sempre prima di implementare
-   ✅ Documenta decisioni architetturali
-   ✅ Mantieni traceability tra requisiti e codice
-   ✅ Collabora attivamente con il team

### **Quality Assurance:**

-   ✅ Code review obbligatoria per feature critiche
-   ✅ Testing automatizzato dove possibile
-   ✅ Monitoraggio e logging appropriati
-   ✅ Backup e recovery procedures

### **Communication:**

-   ✅ Documenta ogni modifica significativa
-   ✅ Mantieni changelog aggiornato
-   ✅ Segnala rischi e dipendenze tempestivamente
-   ✅ Collabora con stakeholder per validazione

**Queste pratiche sono essenziali per progetti enterprise mission-critical.**

---

# **📂 STRUTTURA PROGETTO FLORENCEEGI**

## **MODULI PRINCIPALI:**

-   **EGI System**: Core blockchain integration (NFT/ASA management)
-   **Biography System**: Cultural heritage content management
-   **Marketplace**: Trading platform for digital assets
-   **GDPR Compliance**: Consent management, audit trail, data export
-   **Enterprise Integration**: Specialized features for enterprise clients

## **SERVIZI CHIAVE:**

-   `ConsentService`: GDPR consent management
-   `AuditLogService`: Complete audit trail for compliance
-   `EgiService`: EGI NFT/ASA operations
-   `BiographyService`: Content management for cultural assets
-   `MarketplaceService`: Trading operations

## **DOCUMENTAZIONE DI RIFERIMENTO:**

-   `docs/core/Oracode/*.md`: Technical architecture and patterns
-   `docs/compliance/GDPR/*.md`: Compliance and security documentation
-   `docs/guides/Backend/*.md`: Implementation guides

---

# **🎯 QUANDO APPLICARE QUESTE REGOLE**

**Applica queste regole enterprise quando:**

-   ✅ Sviluppi piattaforme enterprise mission-critical
-   ✅ Implementi funzionalità blockchain (MiCA-SAFE obbligatorio)
-   ✅ Gestisci dati sensibili o compliance GDPR
-   ✅ Crei componenti che richiedono alta affidabilità
-   ✅ Lavori su sistemi che necessitano audit trail completo

**NON applicare quando:**

-   ❌ Sviluppi progetti personali o prototipi rapidi
-   ❌ Fix minori su codice esistente non critico
-   ❌ Test o esperimenti in ambienti isolati

---

# **🔗 RIFERIMENTI**

**Regole universali OS3.0:**

-   `docs/Standards/cursorrules_PADMIN_D_CURTIS_OS3_INTEGRATED.md` - Documento master completo
-   `docs/Standards/cursorrules_OS3_QUICK_REFERENCE_CARD.md` - Quick reference rapida
-   `docs/Standards/cursorrules_CURSOR_COPILOT_ROLES.md` - Partnership Fabio/Padmin

**Documentazione tecnica:**

-   `docs/core/Oracode/` - Architecture patterns e technical docs
-   `docs/ai/context/` - Context e implementation guides
-   `docs/ai/marketing/` - Brand guidelines e marketing docs

---

**Version**: 1.0.0
**Date**: 2025-10-28
**Status**: PRODUCTION READY
**Scope**: Enterprise Development Standards

---

**Note:**

-   Questo file completa le regole universali OS3.0 con standard enterprise
-   In caso di conflitto, le regole enterprise hanno precedenza nei progetti mission-critical
-   Le regole P0 universali (REGOLA ZERO, I18N, etc.) rimangono sempre valide
