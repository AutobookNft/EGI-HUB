# **PADMIN D. CURTIS OS3.0 - ULM/UEM/GDPR INTEGRATION GUIDE**

**Part of:** OS3.0 Integrated Identity Documentation  
**Prerequisites:** Read CORE + P1 + P2 + P3 first

**Related:**

- Core: `PADMIN_IDENTITY_OS3_CORE.md`
- P1: `PADMIN_IDENTITY_OS3_P1_PRINCIPLES.md`
- P2: `PADMIN_IDENTITY_OS3_P2_PATTERNS.md`
- P3: `PADMIN_IDENTITY_OS3_P3_REFERENCE.md`

---

## 🔌 ULTRA ECOSYSTEM INTEGRATION PATTERNS

**This guide provides complete patterns for integrating ULM, UEM, and GDPR.**

---

## **📋 ULM vs UEM - WHEN TO USE WHAT**

| System         | Purpose                                                    | When to use                                       | Example                                               |
| -------------- | ---------------------------------------------------------- | ------------------------------------------------- | ----------------------------------------------------- |
| **UEM**        | **Structured error handling** with codes, messages, alerts | App errors, business failures, team alerts needed | `$this->errorManager->handle('OP_FAILED', [...], $e)` |
| **ULM**        | **Generic logging** for debug, trace, monitoring           | Debug flows, performance tracking, trace          | `$this->logger->info('Op started', [...])`            |
| **GDPR Audit** | **Compliance logging** for regulations                     | Any user data access/modification                 | `$this->auditService->logUserAction(...)`             |

**CRITICAL RULE:** UEM and ULM COEXIST. Never replace UEM with ULM.

---

## **🎯 COMPLETE CONTROLLER PATTERN**

```php
<?php

namespace App\Http\Controllers;

use App\Enums\Gdpr\GdprActivityCategory;
use App\Services\Gdpr\AuditLogService;
use App\Services\Gdpr\ConsentService;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Ultra\UltraLogManager\UltraLogManager;
use Ultra\ErrorManager\Interfaces\ErrorManagerInterface;

/**
 * @Oracode Controller: User Profile Data Management
 * 🎯 Purpose: Handles user profile modifications with GDPR compliance
 * 🛡️ Privacy: Manages personal data with complete audit trail
 * 🧱 Core Logic: Updates profile, logs actions, handles consents
 */
class ProfileController extends Controller
{
    protected UltraLogManager $logger;
    protected ErrorManagerInterface $errorManager;
    protected AuditLogService $auditService;
    protected ConsentService $consentService;

    public function __construct(
        UltraLogManager $logger,
        ErrorManagerInterface $errorManager,
        AuditLogService $auditService,
        ConsentService $consentService
    ) {
        $this->logger = $logger;
        $this->errorManager = $errorManager;
        $this->auditService = $auditService;
        $this->consentService = $consentService;
        $this->middleware('auth');
    }

    /**
     * Update user personal data with full GDPR compliance
     */
    public function updatePersonalData(Request $request): RedirectResponse
    {
        try {
            $user = Auth::user();
            $validated = $request->validate([
                'first_name' => 'required|string|max:255',
                'last_name' => 'required|string|max:255',
                'email' => 'required|email|unique:users,email,' . $user->id,
            ]);

            // 1. ULM: Log operation start
            $this->logger->info('Personal data update initiated', [
                'user_id' => $user->id,
                'fields_to_update' => array_keys($validated),
                'log_category' => 'PERSONAL_DATA_UPDATE_START'
            ]);

            // 2. Store previous values for audit
            $previousData = [
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'email' => $user->email,
            ];

            // 3. Perform data modification
            $user->update($validated);

            // 4. GDPR: Log user action with AuditLogService
            $this->auditService->logUserAction($user, 'personal_data_updated', [
                'fields_updated' => array_keys($validated),
                'previous_values' => $previousData,
                'new_values' => $validated,
            ], GdprActivityCategory::PERSONAL_DATA_UPDATE);

            // 5. ULM: Log successful completion
            $this->logger->info('Personal data update completed', [
                'user_id' => $user->id,
                'log_category' => 'PERSONAL_DATA_UPDATE_SUCCESS'
            ]);

            return redirect()->route('profile.edit')
                ->with('success', __('profile.personal_data_updated_successfully'));

        } catch (\Illuminate\Validation\ValidationException $e) {
            // 6. ULM: Log validation errors
            $this->logger->warning('Personal data update validation failed', [
                'user_id' => Auth::id(),
                'validation_errors' => $e->errors(),
                'log_category' => 'PERSONAL_DATA_UPDATE_VALIDATION'
            ]);

            return redirect()->back()
                ->withErrors($e->errors())
                ->withInput();

        } catch (\Exception $e) {
            // 7. UEM: Handle unexpected errors
            return $this->errorManager->handle('PERSONAL_DATA_UPDATE_FAILED', [
                'user_id' => Auth::id(),
                'error_message' => $e->getMessage(),
                'fields_attempted' => array_keys($request->all()),
            ], $e);
        }
    }
}
```

---

## **⚙️ COMPLETE SERVICE PATTERN**

```php
<?php

namespace App\Services\Gdpr;

use App\Enums\Gdpr\GdprActivityCategory;
use App\Models\User;
use App\Models\UserConsent;
use Illuminate\Support\Facades\DB;
use Ultra\UltraLogManager\UltraLogManager;
use Ultra\ErrorManager\Interfaces\ErrorManagerInterface;

/**
 * @Oracode Service: Consent Management System
 * 🎯 Purpose: Manages user consents with versioning and audit trail
 */
class ConsentService
{
    protected UltraLogManager $logger;
    protected ErrorManagerInterface $errorManager;

    public function __construct(
        UltraLogManager $logger,
        ErrorManagerInterface $errorManager
    ) {
        $this->logger = $logger;
        $this->errorManager = $errorManager;
    }

    /**
     * Update user consents with versioning and audit trail
     */
    public function updateUserConsents(User $user, array $consents): array
    {
        try {
            // 1. ULM: Log service operation start
            $this->logger->info('ConsentService: Processing consent update', [
                'user_id' => $user->id,
                'consent_types' => array_keys($consents),
                'log_category' => 'CONSENT_SERVICE_UPDATE_START'
            ]);

            // 2. Get current consents for comparison
            $previousConsents = $this->getCurrentConsents($user);

            // 3. Start database transaction
            return DB::transaction(function () use ($user, $consents, $previousConsents) {
                // Update logic here...

                // 4. ULM: Log successful consent update
                $this->logger->info('ConsentService: Consent update completed', [
                    'user_id' => $user->id,
                    'log_category' => 'CONSENT_SERVICE_UPDATE_SUCCESS'
                ]);

                return [
                    'previous' => $previousConsents,
                    'current' => $consents,
                ];
            });

        } catch (\Exception $e) {
            // 5. ULM: Log service-level error
            $this->logger->error('ConsentService: Consent update failed', [
                'user_id' => $user->id,
                'error_message' => $e->getMessage(),
                'log_category' => 'CONSENT_SERVICE_ERROR'
            ]);

            // 6. Re-throw for controller UEM handling
            throw new \Exception("Consent update failed: " . $e->getMessage(), 0, $e);
        }
    }
}
```

---

## **📊 GDPR ACTIVITY CATEGORIES - PRACTICAL EXAMPLES**

### **Complete Enum Reference (from `/home/fabio/EGI/app/Enums/Gdpr/GdprActivityCategory.php`)**

**Available Categories:**

| Category                  | Privacy Level | Retention | GDPR Audit | Use Case                        |
| ------------------------- | ------------- | --------- | ---------- | ------------------------------- |
| `AUTHENTICATION`          | HIGH          | 3 years   | ✅         | General auth operations         |
| `AUTHENTICATION_LOGIN`    | HIGH          | 3 years   | ✅         | User login activities           |
| `AUTHENTICATION_LOGOUT`   | HIGH          | 3 years   | ✅         | User logout activities          |
| `REGISTRATION`            | HIGH          | 3 years   | ✅         | User registration               |
| `GDPR_ACTIONS`            | CRITICAL      | 7 years   | ✅         | GDPR compliance actions         |
| `DATA_ACCESS`             | STANDARD      | 2 years   | ❌         | Viewing/downloading data        |
| `DATA_DELETION`           | CRITICAL      | 7 years   | ✅         | Data erasure operations         |
| `CONTENT_CREATION`        | STANDARD      | 2 years   | ✅         | Biographies, posts, articles    |
| `CONTENT_MODIFICATION`    | STANDARD      | 2 years   | ✅         | Content updates                 |
| `PLATFORM_USAGE`          | STANDARD      | 2 years   | ❌         | General platform interaction    |
| `SYSTEM_INTERACTION`      | STANDARD      | 2 years   | ❌         | UI operations                   |
| `SECURITY_EVENTS`         | HIGH          | 3 years   | ✅         | Security incidents              |
| `ADMIN_ACCESS`            | HIGH          | 3 years   | ✅         | Back-office access              |
| `ADMIN_ACTION`            | HIGH          | 3 years   | ✅         | Admin configuration changes     |
| `BLOCKCHAIN_ACTIVITY`     | STANDARD      | 2 years   | ❌         | NFT/blockchain operations       |
| `MEDIA_MANAGEMENT`        | STANDARD      | 2 years   | ✅         | File uploads, media ops         |
| `PRIVACY_MANAGEMENT`      | CRITICAL      | 7 years   | ✅         | Privacy settings, consents      |
| `PERSONAL_DATA_UPDATE`    | CRITICAL      | 7 years   | ✅         | Personal data modifications     |
| `WALLET_MANAGEMENT`       | CRITICAL      | 7 years   | ✅         | Wallet operations               |
| `WALLET_CREATED`          | CRITICAL      | 7 years   | ✅         | Wallet creation (registration)  |
| `WALLET_SECRET_ACCESSED`  | CRITICAL      | 7 years   | ✅         | Mnemonic export                 |
| `NOTIFICATION_MANAGEMENT` | STANDARD      | 2 years   | ❌         | Notification interactions       |
| `AI_PROCESSING`           | STANDARD      | 2 years   | ❌         | AI analysis activities          |
| `AI_CREDITS_USAGE`        | CRITICAL      | 7 years   | ✅         | Financial AI credit tracking    |
| `EGI_TRAIT_MANAGEMENT`    | STANDARD      | 2 years   | ❌         | EGI trait creation/modification |

### **Practical Usage Examples**

```php
// Import obbligatorio
use App\Enums\Gdpr\GdprActivityCategory;

// 1. AUTHENTICATION - Login/Logout
$this->auditService->logUserAction($user, 'user_logged_in', [
    'login_method' => 'email_password',
    'ip_address' => request()->ip(),
], GdprActivityCategory::AUTHENTICATION_LOGIN);

$this->auditService->logUserAction($user, 'user_logged_out', [
    'session_duration_minutes' => 45,
], GdprActivityCategory::AUTHENTICATION_LOGOUT);

// 2. REGISTRATION - New user sign-up
$this->auditService->logUserAction($user, 'user_registered', [
    'registration_method' => 'email',
    'referral_code' => $referralCode ?? null,
], GdprActivityCategory::REGISTRATION);

// 3. GDPR_ACTIONS - Consent updates, data export, deletion requests
$this->auditService->logUserAction($user, 'consents_updated', [
    'consent_changes' => ['marketing' => true, 'analytics' => false],
], GdprActivityCategory::GDPR_ACTIONS);

$this->auditService->logUserAction($user, 'data_export_requested', [
    'export_format' => 'json',
], GdprActivityCategory::GDPR_ACTIONS);

// 4. DATA_ACCESS - Viewing/downloading data
$this->auditService->logUserAction($user, 'profile_viewed', [
    'viewed_user_id' => $viewedUser->id,
], GdprActivityCategory::DATA_ACCESS);

// 5. DATA_DELETION - Erasure operations
$this->auditService->logUserAction($user, 'account_deleted', [
    'deletion_reason' => 'user_request',
    'data_retained' => false,
], GdprActivityCategory::DATA_DELETION);

// 6. CONTENT_CREATION - Biographies, posts, articles
$this->auditService->logUserAction($user, 'biography_created', [
    'biography_id' => $biography->id,
    'biography_type' => 'standard',
], GdprActivityCategory::CONTENT_CREATION);

// 7. CONTENT_MODIFICATION - Content updates
$this->auditService->logUserAction($user, 'biography_updated', [
    'biography_id' => $biography->id,
    'fields_changed' => ['title', 'content'],
], GdprActivityCategory::CONTENT_MODIFICATION);

// 8. SECURITY_EVENTS - Password changes, 2FA
$this->auditService->logUserAction($user, 'password_changed', [
    'password_strength' => 'strong',
    'forced_reset' => false,
], GdprActivityCategory::SECURITY_EVENTS);

// 9. ADMIN_ACCESS - Back-office access
$this->auditService->logUserAction($user, 'admin_panel_accessed', [
    'admin_role' => 'superadmin',
    'accessed_section' => 'user_management',
], GdprActivityCategory::ADMIN_ACCESS);

// 10. ADMIN_ACTION - Configuration changes
$this->auditService->logUserAction($user, 'system_config_updated', [
    'config_key' => 'maintenance_mode',
    'old_value' => false,
    'new_value' => true,
], GdprActivityCategory::ADMIN_ACTION);

// 11. BLOCKCHAIN_ACTIVITY - NFT operations
$this->auditService->logUserAction($user, 'nft_minted', [
    'nft_id' => $nft->id,
    'blockchain' => 'ethereum',
], GdprActivityCategory::BLOCKCHAIN_ACTIVITY);

// 12. MEDIA_MANAGEMENT - File uploads
$this->auditService->logUserAction($user, 'profile_image_uploaded', [
    'file_type' => 'image/jpeg',
    'file_size_kb' => 234,
], GdprActivityCategory::MEDIA_MANAGEMENT);

// 13. PRIVACY_MANAGEMENT - Privacy settings
$this->auditService->logUserAction($user, 'privacy_settings_updated', [
    'visibility' => 'private',
], GdprActivityCategory::PRIVACY_MANAGEMENT);

// 14. PERSONAL_DATA_UPDATE - Profile updates
$this->auditService->logUserAction($user, 'personal_data_updated', [
    'fields_updated' => ['first_name', 'last_name', 'email'],
], GdprActivityCategory::PERSONAL_DATA_UPDATE);

// 15. WALLET_MANAGEMENT - Wallet operations
$this->auditService->logUserAction($user, 'wallet_connected', [
    'wallet_address' => $maskedAddress,
    'wallet_type' => 'metamask',
], GdprActivityCategory::WALLET_MANAGEMENT);

// 16. WALLET_CREATED - Registration wallet creation
$this->auditService->logUserAction($user, 'wallet_created', [
    'wallet_address' => $maskedAddress,
], GdprActivityCategory::WALLET_CREATED);

// 17. WALLET_SECRET_ACCESSED - Mnemonic export (CRITICAL)
$this->auditService->logUserAction($user, 'mnemonic_exported', [
    'export_method' => 'manual_copy',
    'ip_address' => request()->ip(),
], GdprActivityCategory::WALLET_SECRET_ACCESSED);

// 18. NOTIFICATION_MANAGEMENT - Notification interactions
$this->auditService->logUserAction($user, 'notification_preferences_updated', [
    'email_enabled' => true,
    'push_enabled' => false,
], GdprActivityCategory::NOTIFICATION_MANAGEMENT);

// 19. AI_PROCESSING - AI analysis
$this->auditService->logUserAction($user, 'biography_analyzed_by_ai', [
    'biography_id' => $biography->id,
    'ai_model' => 'gpt-4',
], GdprActivityCategory::AI_PROCESSING);

// 20. AI_CREDITS_USAGE - Financial AI tracking (CRITICAL)
$this->auditService->logUserAction($user, 'ai_credits_consumed', [
    'credits_used' => 50,
    'operation' => 'biography_generation',
    'cost_eur' => 0.25,
], GdprActivityCategory::AI_CREDITS_USAGE);

// 21. EGI_TRAIT_MANAGEMENT - Trait management
$this->auditService->logUserAction($user, 'egi_trait_created', [
    'trait_id' => $trait->id,
    'trait_name' => 'Leadership',
], GdprActivityCategory::EGI_TRAIT_MANAGEMENT);
```

### **Privacy Level Methods**

```php
// Get privacy level for a category
$category = GdprActivityCategory::WALLET_SECRET_ACCESSED;
$privacyLevel = $category->privacyLevel(); // Returns PrivacyLevel::CRITICAL

// Get retention period in days
$retentionDays = $category->retentionDays(); // Returns 2555 days (7 years)

// Check if requires GDPR audit
$requiresAudit = $category->requiresGdprAudit(); // Returns true

// Get human-readable label
$label = $category->label(); // Returns "Wallet Secret Accessed (Mnemonic Export)"
```

---

## **🔥 UEM ERROR CONFIGURATION COMPLETE EXAMPLE**

### **UEM ERROR STRUCTURE**

**Every UEM error requires TWO components:**

1. Error Configuration (config/error-manager.php)
2. Translation Messages (resources/lang/vendor/error-manager/it/errors_2.php)

#### **ERROR TYPE VALUES:**

```
'warning'  → Non-critical issues, logged but don't block operations
'error'    → Errors that need attention, operations may be affected
'critical' → Severe errors, immediate attention required, operations blocked
```

#### **BLOCKING LEVEL VALUES:**

```
'not'           → Operation continues, error logged
'semi-blocking' → Operation continues with warnings, user notified
'blocking'      → Operation stops immediately, user must take action
```

#### **MSG_TO VALUES:**

```
'toast'    → Show browser toast notification
'email'    → Send email to admin/dev team
'slack'    → Send Slack notification to channel
'multiple' → Combine multiple notification channels (toast + email + slack)
```

---

### **Step 1: Define Error in config/error-manager.php**

```php
'CONSENT_UPDATE_FAILED' => [
    'type' => 'error',
    'blocking' => 'semi-blocking',
    'dev_message_key' => 'error-manager::errors_2.dev.consent_update_failed',
    'user_message_key' => 'error-manager::errors_2.user.consent_update_failed',
    'http_status_code' => 500,
    'msg_to' => 'toast',
],

'GDPR_DATA_EXPORT_FAILED' => [
    'type' => 'critical',
    'blocking' => 'blocking',
    'dev_message_key' => 'error-manager::errors_2.dev.gdpr_data_export_failed',
    'user_message_key' => 'error-manager::errors_2.user.gdpr_data_export_failed',
    'http_status_code' => 500,
    'msg_to' => 'multiple', // toast + email + slack
],
```

### **Step 2: Define Messages in resources/lang/vendor/error-manager/it/errors_2.php**

```php
return [
    'dev' => [
        'consent_update_failed' => 'Failed to update user consent for user_id: :user_id. Database error: :error_message',
        'gdpr_data_export_failed' => 'Critical GDPR export failure for user_id: :user_id. Export format: :format. Error: :error_message',
    ],
    'user' => [
        'consent_update_failed' => 'Non è stato possibile aggiornare le tue preferenze sui consensi. Riprova più tardi.',
        'gdpr_data_export_failed' => 'Si è verificato un errore durante l\'esportazione dei tuoi dati. Il nostro team è stato notificato.',
    ]
];
```

### **Step 3: Use in Code**

```php
try {
    $this->consentService->updateUserConsents($user, $consents);
} catch (\Exception $e) {
    // UEM: Handle with configured error code
    return $this->errorManager->handle('CONSENT_UPDATE_FAILED', [
        'user_id' => $user->id,
        'error_message' => $e->getMessage(),
        'consents_attempted' => $consents,
        'ip_address' => request()->ip()
    ], $e);

    // UEM automatically:
    // 1. Logs error with context
    // 2. Sends toast notification to user (user_message_key)
    // 3. Logs technical details for dev (dev_message_key)
    // 4. Returns HTTP 500 response
    // 5. Tracks error for monitoring
}
```

#### **PLACEHOLDER REPLACEMENT:**

UEM automatically replaces `:placeholder` in messages with values from context array:

```php
// Context array
[
    'user_id' => 123,
    'error_message' => 'Database connection failed'
]

// Dev message: "Failed for user_id: :user_id. Error: :error_message"
// Becomes: "Failed for user_id: 123. Error: Database connection failed"
```

#### **BEFORE USING errorManager->handle():**

```
[ ] Error code defined in config/error-manager.php?
[ ] Dev message defined in errors_2.php?
[ ] User message defined in errors_2.php?
[ ] Correct type selected (warning|error|critical)?
[ ] Correct blocking level (not|semi-blocking|blocking)?
[ ] Correct http_status_code?
[ ] Correct msg_to channel?
[ ] All placeholders in messages match context keys?

IF ANY CHECKBOX IS EMPTY → 🛑 DEFINE ERROR CODE FIRST
```

---

## **✅ INTEGRATION CHECKLIST**

```
Before using ULM/UEM/GDPR:

[ ] ULM for debug/trace?
    └─ Use logger->info/debug/warning

[ ] UEM for business errors?
    └─ Error defined in config?
    └─ Messages defined in errors_2.php?
    └─ Placeholders match context keys?

[ ] GDPR audit needed?
    └─ User data accessed/modified?
    └─ Correct GdprActivityCategory?
    └─ AuditLogService available?

[ ] UEM + ULM together?
    └─ Not replacing UEM with ULM?

IF ANY UNCLEAR → ASK BEFORE PROCEEDING
```

---

**Version:** OS3.0 Integration Guide  
**Date:** November 23, 2025  
**Status:** PRODUCTION READY  
**Complete:** This concludes OS3.0 identity documentation
