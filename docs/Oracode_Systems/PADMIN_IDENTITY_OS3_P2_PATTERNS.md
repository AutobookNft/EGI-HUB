# **PADMIN D. CURTIS OS3.0 - P2 ARCHITECTURE PATTERNS**

**Part of:** OS3.0 Integrated Identity Documentation  
**Prerequisites:** Read CORE + P1 first

**Related:**

- Core: `PADMIN_IDENTITY_OS3_CORE.md`
- P1: `PADMIN_IDENTITY_OS3_P1_PRINCIPLES.md`
- P3: `PADMIN_IDENTITY_OS3_P3_REFERENCE.md`
- Integration: `PADMIN_IDENTITY_OS3_INTEGRATION_GUIDE.md`

---

## ⚙️ P2 - SHOULD FOLLOW (IMPORTANT PATTERNS)

**P2 rules are IMPORTANT but not blocking.**  
Follow unless you have good reason not to.

---

## **🏗️ P2-1: ARCHITECTURE PATTERNS**

### **OOP PURO & DESIGN PATTERNS**

```php
// ✅ SOLID Principles

// Single Responsibility
class ConsentService {
    // Only consent management, not logging/notifications
}

// Dependency Injection
public function __construct(
    private ConsentRepository $repository,
    private AuditLogService $auditLog,
    private ErrorManagerInterface $errorManager
) {}

// Interface Segregation
interface ConsentServiceInterface {
    public function hasConsent(User $user, string $type): bool;
    public function grantConsent(User $user, string $type): void;
    public function revokeConsent(User $user, string $type): void;
}
```

### **ULTRA ECOSYSTEM INTEGRATION**

```php
// UEM for structured error handling
try {
    // Business logic
} catch (\Exception $e) {
    $this->errorManager->handle('CONSENT_UPDATE_FAILED', [
        'user_id' => $user->id,
        'consent_type' => $consentType
    ], $e);
}

// ULM for general logging
$this->logger->info('Consent updated', [
    'user_id' => $user->id,
    'consent_type' => $consentType,
    'log_category' => 'GDPR_CONSENT'
]);
```

---

## **🎨 P2-2: FRONTEND PATTERNS**

### **❌ COMPLETELY BANNED**

- **Alpine.js** - FORBIDDEN
- **Livewire** - FORBIDDEN
- **jQuery** - DEPRECATED

### **✅ ALLOWED**

**Vanilla JavaScript (PREFERRED):**

```javascript
// Modern ES6+ syntax
document.getElementById("myBtn").addEventListener("click", async (e) => {
  const res = await fetch("/api/endpoint", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]').content,
    },
    body: JSON.stringify({ data: "value" }),
  });
  const json = await res.json();
  console.log(json);
});
```

**TypeScript (RECOMMENDED for complex logic):**

- Type safety
- Better IDE support
- Compiled to modern JS
- Used in `resources/ts/` folder

---

## **🤖 P2-3: AI-READABLE CODE PRINCIPLES**

### **Self-Documenting Architecture**

```php
// ✅ Self-explanatory naming
class ItemPurchaseService
{
    public function __construct(
        private ConsentService $consentService, // GDPR compliance
        private PaymentGateway $paymentGateway, // Stripe/PayPal
        private AuditLogService $auditLogService, // Transaction tracking
    ) {}

    /**
     * Process secure item purchase with atomic transaction
     *
     * Ensures GDPR compliance, payment processing,
     * and ownership transfer happen atomically or not at all.
     */
    public function purchaseItemSecurely(User $buyer, Item $item): Transaction
    {
        // GDPR: Verify buyer consent for payment processing
        if (!$this->consentService->hasConsent($buyer, 'payment-processing')) {
            throw new GdprConsentRequiredException(
                'Buyer must consent to payment processing before purchase'
            );
        }

        // Calculate total with platform fees
        $priceInEur = $item->price_eur;
        $fees = $this->calculatePlatformFees($priceInEur);

        // Atomic transaction: payment + ownership + audit
        return DB::transaction(function () use ($buyer, $item, $priceInEur, $fees) {
            $transaction = $this->processPayment($buyer, $priceInEur, $fees);
            $this->transferOwnership($item, $buyer);
            $this->auditLogService->log('item-purchased', [...]);

            return $transaction;
        });
    }
}
```

---

## **📝 P2-4: COMMIT MESSAGE RULES**

### **MANDATORY TAGS**

```
[FEAT]     - nuova feature o funzionalità
[FIX]      - bug risolto
[REFACTOR] - refactoring del codice
[DOC]      - documentazione aggiunta/aggiornata
[TEST]     - aggiunta o modifica di test
[CHORE]    - attività di manutenzione
```

### **MANDATORY FORMAT**

```
[TAG] Descrizione breve e chiara

- Dettaglio 1 (cosa modificato)
- Dettaglio 2 (perché fatto)
- Dettaglio 3 (effetti/note)
- Max 4-5 punti
```

### **EXAMPLES OF GOOD COMMITS**

```
[FEAT] Aggiunto sistema di gestione consensi GDPR

- Implementato ConsentService per gestione consensi utente
- Aggiunta integrazione ULM/UEM per audit trail completo
- Creato enum GdprActivityCategory per categorizzazione
- Tutti i metodi verificati e testati
```

```
[FIX] Risolto bug caricamento immagini profilo

- Corretto validation size_limit da 2MB a 5MB
- Aggiunto error handling per formati non supportati
- Implementato logging UEM per errori upload
- Testato con file PNG, JPEG, WebP
```

```
[REFACTOR] Ottimizzato ConsentService per performance

- Ridotto query N+1 con eager loading
- Implementato caching per consent version
- Migliorata leggibilità metodi privati
- Performance improvement: -40% execution time
```

```
[DOC] Aggiornata documentazione GDPR integration

- Aggiunto esempi pratici ULM/UEM patterns
- Documentato tutti i GdprActivityCategory
- Creato diagrammi flusso per export dati
- Aggiunti test examples per ogni service
```

### **COMMIT CHECKLIST**

```
Prima di ogni commit, verifica:

[ ] Tag corretto applicato?
[ ] Descrizione breve e chiara?
[ ] Almeno 2 punti di dettaglio?
[ ] Max 5 punti di dettaglio?
[ ] Tutti i file correlati inclusi?
[ ] Test eseguiti e passati?
[ ] Codice reviewed?
[ ] No console.log o debug code?
```

### **❌ BAD EXAMPLES**

```
❌ "fix" (no tag, no details)
❌ "updated files" (non-descriptive)
❌ "[FEAT] cosa" (no details)
❌ "[FIX] Fixed bug in controller that was causing issues with the user profile update when email was changed and also updated some other stuff" (too long, no bullet points)
```

---

## **🔒 P2-5: GIT HOOKS PROTECTION**

### **Automated Code Protection**

Il progetto utilizza **Git Hooks** per prevenire eliminazioni accidentali di codice.

**Hook Attivi:**

- **pre-commit** - Verifica modifiche prima del commit
- **pre-push** - Verifica commit prima del push

### **Pre-Commit Hook - 4 Regole di Protezione**

#### **Regola 1: Blocco eliminazioni massive per file**

```
TRIGGER: File rimuove più di 100 righe
ACTION: BLOCCA commit
BYPASS: git commit --no-verify
```

#### **Regola 2: Warning eliminazioni moderate**

```
TRIGGER: File rimuove tra 50 e 100 righe
ACTION: WARNING (commit permesso, verifica richiesta)
```

#### **Regola 3: Blocco eliminazioni percentuali**

```
TRIGGER: File rimuove più del 50% del contenuto
ACTION: BLOCCA commit
BYPASS: git commit --no-verify
```

#### **Regola 4: Blocco eliminazioni globali**

```
TRIGGER: Commit rimuove più di 500 righe totali
ACTION: BLOCCA commit
BYPASS: git commit --no-verify
```

### **Pre-Push Hook - Doppia Verifica**

```
TRIGGER: Commit da pushare rimuove più di 500 righe
ACTION: BLOCCA push
BYPASS: git push --no-verify
```

### **Azioni in Caso di Blocco**

```bash
# 1. Verifica cosa stai committando
git diff --cached

# 2. Verifica statistiche dettagliate
git diff --cached --stat

# 3. Se è un errore, rimuovi file dallo stage
git restore --staged <file>

# 4. Se è intenzionale, bypassa il check
git commit --no-verify -m "[TAG] Messaggio"
git push --no-verify
```

### **Installazione Hook**

```bash
# Dalla root del progetto
cd /home/fabio/EGI
bash scripts/install-git-hooks.sh
```

**Nota:** Gli hook sono versionati in `/home/fabio/EGI/git-hooks/`

### **Best Practices con Hook**

✅ **DO:**

- Verifica sempre `git diff --stat` prima del commit
- Commit incrementali piccoli e frequenti
- Documenta bypass con commit message esplicito
- Update hook quando modificati (pull + reinstalla)

❌ **DON'T:**

- Non bypassare hook di routine
- Non modificare `.git/hooks/` direttamente (usa `git-hooks/` sorgente)
- Non disabilitare hook permanentemente
- Non ignorare warning (anche se commit procede)

### **Troubleshooting Hook**

```bash
# Verifica hook installati
ls -la .git/hooks/pre-commit
ls -la .git/hooks/pre-push

# Test manuale hook
.git/hooks/pre-commit

# Reinstalla hook se non funzionano
bash scripts/install-git-hooks.sh
```

**Documentazione Completa:** `/home/fabio/EGI/docs/git-hooks/README.md`

---

## **✅ P2 CHECKLIST**

```
Before committing:

[ ] Applied SOLID principles?
[ ] Followed OOP pure patterns?
[ ] Used Ultra Ecosystem correctly?
[ ] Frontend: Vanilla JS or TypeScript?
[ ] Code is AI-readable?
[ ] Self-documenting names?
[ ] Commit message has tag?
[ ] Commit has 2-5 detail points?
[ ] No console.log or debug code?

IF UNCHECKED → REVIEW BEFORE COMMIT
```

---

**Version:** OS3.0 P2 Patterns  
**Date:** November 23, 2025  
**Status:** PRODUCTION READY  
**Next:** Read P3 Reference for advanced context
