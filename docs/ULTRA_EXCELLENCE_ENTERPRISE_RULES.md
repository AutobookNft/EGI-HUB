# 🏆 NATAN_LOC - ULTRA ECCELLENZA ENTERPRISE

**Version**: 1.0.0  
**Date**: 2025-11-22  
**Author**: Padmin D. Curtis (AI Partner OS3.0) for Fabio Cherici  
**Purpose**: Enterprise-grade implementation guidelines for NATAN_LOC  
**Philosophy**: "Excellence is not an act, but a habit" - Aristotle

---

## 📋 TABLE OF CONTENTS

1. [Logging & Debugging Excellence](#1-logging--debugging-excellence)
2. [Security Excellence](#2-security-excellence)
3. [Performance Excellence](#3-performance-excellence)
4. [Testing Excellence](#4-testing-excellence)
5. [Documentation Excellence](#5-documentation-excellence)
6. [Monitoring & Observability Excellence](#6-monitoring--observability-excellence)
7. [Database Excellence](#7-database-excellence)
8. [Code Quality Excellence](#8-code-quality-excellence)

---

## 1️⃣ LOGGING & DEBUGGING EXCELLENCE

### ⚠️ IL PROBLEMA

**Query cross-tenant con boost/priority è complessa da debuggare:**
- User interroga 50 tenant contemporaneamente
- Boost diversi per tenant (1.5 project, 1.2 own, 1.0 group)
- RAG retrieval da MongoDB con vector search
- Risultati aggregati e ranked
- **Impossibile capire PERCHÉ un documento è stato scelto o escluso**

### ✅ LA SOLUZIONE ENTERPRISE

**Structured Logging + Correlation ID + Query Tracing**

#### 🛠️ IMPLEMENTAZIONE PRATICA

##### **1.1 Correlation ID per ogni Request**

```php
// app/Http/Middleware/AddCorrelationId.php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;

class AddCorrelationId
{
    public function handle(Request $request, Closure $next)
    {
        $correlationId = $request->header('X-Correlation-ID') 
            ?? Str::uuid()->toString();
        
        // Store in request for access throughout the app
        $request->attributes->set('correlation_id', $correlationId);
        
        // Add to all logs
        Log::withContext([
            'correlation_id' => $correlationId,
            'user_id' => auth()->id(),
            'tenant_id' => auth()->user()?->tenant_id,
        ]);
        
        $response = $next($request);
        
        // Add to response headers for client tracking
        $response->headers->set('X-Correlation-ID', $correlationId);
        
        return $response;
    }
}
```

##### **1.2 Structured Query Logging**

```php
// app/Services/QueryLogger.php
<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;

class QueryLogger
{
    /**
     * Log multi-tenant query with full context
     */
    public static function logMultiTenantQuery(array $context): void
    {
        Log::channel('natan_queries')->info('Multi-tenant query executed', [
            'correlation_id' => request()->attributes->get('correlation_id'),
            'query_id' => $context['query_id'] ?? null,
            'user_query' => $context['user_query'],
            'query_config' => [
                'target_mode' => $context['target_mode'],
                'target_tenant_ids' => $context['target_tenant_ids'],
                'boost_config' => $context['boost_config'],
            ],
            'retrieval_stats' => [
                'total_documents_searched' => $context['total_searched'],
                'documents_retrieved' => $context['documents_retrieved'],
                'by_tenant' => $context['results_by_tenant'],
            ],
            'performance' => [
                'query_time_ms' => $context['query_time_ms'],
                'ai_response_time_ms' => $context['ai_time_ms'],
                'total_time_ms' => $context['total_time_ms'],
            ],
            'result_sources' => array_map(function($source) {
                return [
                    'doc_id' => $source['doc_id'],
                    'tenant_id' => $source['tenant_id'],
                    'score' => $source['score'],
                    'boost_applied' => $source['boost'],
                    'final_score' => $source['final_score'],
                ];
            }, $context['sources']),
        ]);
    }
    
    /**
     * Log query decision (why a document was selected/rejected)
     */
    public static function logDocumentDecision(string $docId, array $decision): void
    {
        Log::channel('natan_decisions')->debug('Document ranking decision', [
            'correlation_id' => request()->attributes->get('correlation_id'),
            'doc_id' => $docId,
            'base_score' => $decision['base_score'],
            'boost_applied' => $decision['boost'],
            'final_score' => $decision['final_score'],
            'threshold' => $decision['threshold'],
            'selected' => $decision['selected'],
            'reason' => $decision['reason'],
        ]);
    }
}
```

##### **1.3 Logging Configuration**

```php
// config/logging.php (add custom channels)
'channels' => [
    // ... existing channels ...
    
    'natan_queries' => [
        'driver' => 'daily',
        'path' => storage_path('logs/natan_queries.log'),
        'level' => env('LOG_LEVEL', 'info'),
        'days' => 30,
        'formatter' => \Monolog\Formatter\JsonFormatter::class, // JSON for parsing
    ],
    
    'natan_decisions' => [
        'driver' => 'daily',
        'path' => storage_path('logs/natan_decisions.log'),
        'level' => 'debug',
        'days' => 7, // Debug logs kept 7 days
        'formatter' => \Monolog\Formatter\JsonFormatter::class,
    ],
    
    'natan_performance' => [
        'driver' => 'daily',
        'path' => storage_path('logs/natan_performance.log'),
        'level' => 'info',
        'days' => 30,
        'formatter' => \Monolog\Formatter\JsonFormatter::class,
    ],
],
```

##### **1.4 Usage in Controller**

```php
// app/Http/Controllers/NatanUseProxyController.php
public function proxyChat(Request $request): JsonResponse
{
    $startTime = microtime(true);
    $queryId = Str::uuid()->toString();
    
    try {
        // Log query start
        QueryLogger::logMultiTenantQuery([
            'query_id' => $queryId,
            'user_query' => $request->input('messages')[0]['content'] ?? '',
            'target_mode' => $request->input('query_config.target_mode'),
            'target_tenant_ids' => $request->input('query_config.target_tenant_ids', []),
            // ... rest of context
        ]);
        
        // Execute query
        $response = $this->pythonService->chat($request->all());
        
        // Log results
        QueryLogger::logMultiTenantQuery([
            'query_id' => $queryId,
            'total_searched' => $response['stats']['total_searched'],
            'documents_retrieved' => count($response['sources']),
            'query_time_ms' => (microtime(true) - $startTime) * 1000,
            'sources' => $response['sources'],
        ]);
        
        return response()->json($response);
        
    } catch (\Exception $e) {
        Log::channel('natan_queries')->error('Query failed', [
            'correlation_id' => request()->attributes->get('correlation_id'),
            'query_id' => $queryId,
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString(),
        ]);
        
        throw $e;
    }
}
```

##### **1.5 Python FastAPI Logging Integration**

```python
# python_ai_service/app/services/logging_service.py
import logging
import json
from datetime import datetime
from typing import Dict, Any

class StructuredLogger:
    """Structured logger for NATAN queries"""
    
    def __init__(self):
        self.logger = logging.getLogger('natan.queries')
        handler = logging.FileHandler('/app/logs/natan_queries.log')
        handler.setFormatter(logging.Formatter('%(message)s'))  # JSON only
        self.logger.addHandler(handler)
        self.logger.setLevel(logging.INFO)
    
    def log_retrieval(self, context: Dict[str, Any]):
        """Log RAG retrieval with full context"""
        log_entry = {
            'timestamp': datetime.utcnow().isoformat(),
            'correlation_id': context.get('correlation_id'),
            'event': 'rag_retrieval',
            'query': context.get('query'),
            'tenant_ids': context.get('tenant_ids', []),
            'project_id': context.get('project_id'),
            'retrieval': {
                'method': context.get('method'),
                'total_candidates': context.get('total_candidates'),
                'after_filtering': context.get('after_filtering'),
                'final_selected': context.get('final_selected'),
            },
            'boost_config': context.get('boost_config', {}),
            'performance': {
                'embedding_ms': context.get('embedding_ms'),
                'search_ms': context.get('search_ms'),
                'ranking_ms': context.get('ranking_ms'),
            }
        }
        
        self.logger.info(json.dumps(log_entry))
    
    def log_document_score(self, doc_id: str, scores: Dict[str, float]):
        """Log individual document scoring decision"""
        log_entry = {
            'timestamp': datetime.utcnow().isoformat(),
            'event': 'document_score',
            'doc_id': doc_id,
            'scores': {
                'base_similarity': scores.get('base'),
                'tenant_boost': scores.get('tenant_boost'),
                'project_boost': scores.get('project_boost'),
                'recency_boost': scores.get('recency_boost'),
                'final_score': scores.get('final'),
            },
            'decision': 'selected' if scores.get('final') > scores.get('threshold') else 'rejected',
        }
        
        self.logger.debug(json.dumps(log_entry))

# Usage in retriever
from app.services.logging_service import StructuredLogger

logger = StructuredLogger()

def retrieve_with_logging(query: str, tenant_ids: List[int], **kwargs):
    start = time.time()
    
    # ... retrieval logic ...
    
    logger.log_retrieval({
        'correlation_id': kwargs.get('correlation_id'),
        'query': query,
        'tenant_ids': tenant_ids,
        'total_candidates': len(candidates),
        'final_selected': len(results),
        'search_ms': (time.time() - start) * 1000,
    })
    
    return results
```

#### ✓ CHECKLIST VERIFICA LOGGING

```
☐ Correlation ID presente in tutti i log
☐ Structured logging (JSON) configurato
☐ Canali log separati (queries, decisions, performance)
☐ Log retention policy configurata (30gg queries, 7gg debug)
☐ Python FastAPI integrato con stesso formato
☐ Performance metrics loggati per ogni query
☐ Document scoring decisions loggati (debug level)
☐ Error tracking con correlation_id
☐ Log rotation configurato (daily)
☐ Middleware correlation_id registrato in routes
```

---

## 2️⃣ SECURITY EXCELLENCE

### ⚠️ IL PROBLEMA

**Generated HTML/JS apps = massive XSS/injection risk:**
- AI genera codice HTML+JavaScript
- Codice salvato su file system
- Servito agli utenti via browser
- **Un singolo `<script>alert('XSS')</script>` compromette tutto**
- **Codice malevolo può rubare session, cookie, token**
- **Iniezione di API calls non autorizzate**

### ✅ LA SOLUZIONE ENTERPRISE

**Defense in Depth: Sanitization + CSP + Sandboxing + Validation**

#### 🛠️ IMPLEMENTAZIONE PRATICA

##### **2.1 HTML Sanitization (DOMPurify + Server-side)**

```php
// app/Services/HtmlSanitizerService.php
<?php

namespace App\Services;

use voku\helper\HtmlDomParser;

class HtmlSanitizerService
{
    /**
     * Allowed HTML tags for generated apps
     */
    private const ALLOWED_TAGS = [
        'div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'table', 'thead', 'tbody', 'tr', 'td', 'th',
        'input', 'button', 'label', 'select', 'option', 'textarea',
        'canvas', 'svg', 'path', 'circle', 'rect', 'line',
        'form', 'fieldset', 'legend',
    ];
    
    /**
     * Allowed attributes (whitelist)
     */
    private const ALLOWED_ATTRIBUTES = [
        'id', 'class', 'style', 'data-*',
        'type', 'name', 'value', 'placeholder',
        'min', 'max', 'step',
        'width', 'height', 'viewBox',
    ];
    
    /**
     * Forbidden patterns (blacklist)
     */
    private const FORBIDDEN_PATTERNS = [
        '/on\w+\s*=/',              // onclick, onerror, etc.
        '/javascript:/i',            // javascript: protocol
        '/data:text\/html/i',        // data: protocol
        '/<script/i',                // <script> tags
        '/<iframe/i',                // <iframe> tags
        '/<object/i',                // <object> tags
        '/<embed/i',                 // <embed> tags
        '/eval\s*\(/i',              // eval() calls
        '/setTimeout\s*\(/i',        // setTimeout
        '/setInterval\s*\(/i',       // setInterval
        '/Function\s*\(/i',          // Function constructor
        '/\.innerHTML\s*=/i',        // innerHTML assignment
        '/document\.write/i',        // document.write
        '/window\.location/i',       // window.location redirect
    ];
    
    /**
     * Sanitize generated HTML
     * 
     * @param string $html Raw HTML from AI
     * @return string Sanitized HTML
     * @throws \Exception If dangerous patterns detected
     */
    public function sanitize(string $html): string
    {
        // 1. Check for forbidden patterns FIRST
        foreach (self::FORBIDDEN_PATTERNS as $pattern) {
            if (preg_match($pattern, $html)) {
                throw new \Exception("Forbidden pattern detected: {$pattern}");
            }
        }
        
        // 2. Parse and clean HTML
        $dom = HtmlDomParser::str_get_html($html);
        
        // 3. Remove disallowed tags
        foreach ($dom->find('*') as $element) {
            $tagName = strtolower($element->tag);
            
            if (!in_array($tagName, self::ALLOWED_TAGS)) {
                $element->outertext = ''; // Remove element
                continue;
            }
            
            // 4. Remove disallowed attributes
            $attributes = $element->getAllAttributes();
            foreach ($attributes as $attr => $value) {
                $allowed = false;
                
                // Check exact match
                if (in_array($attr, self::ALLOWED_ATTRIBUTES)) {
                    $allowed = true;
                }
                
                // Check data-* wildcard
                if (str_starts_with($attr, 'data-')) {
                    $allowed = true;
                }
                
                if (!$allowed) {
                    $element->removeAttribute($attr);
                }
            }
        }
        
        // 5. Return sanitized HTML
        return $dom->save();
    }
    
    /**
     * Sanitize JavaScript code
     * 
     * @param string $js Raw JavaScript from AI
     * @return string Sanitized JavaScript
     */
    public function sanitizeJavaScript(string $js): string
    {
        // Check for dangerous patterns
        $dangerousPatterns = [
            '/eval\s*\(/i',
            '/Function\s*\(/i',
            '/setTimeout\s*\(\s*["\']/',  // setTimeout with string
            '/setInterval\s*\(\s*["\']/', // setInterval with string
            '/\.innerHTML\s*=/i',
            '/document\.write/i',
            '/document\.writeln/i',
            '/window\.location\s*=/i',
            '/document\.location\s*=/i',
            '/XMLHttpRequest/i',  // Force fetch API instead
            '/ActiveXObject/i',
        ];
        
        foreach ($dangerousPatterns as $pattern) {
            if (preg_match($pattern, $js)) {
                throw new \Exception("Dangerous JavaScript pattern detected: {$pattern}");
            }
        }
        
        // Wrap in strict mode
        $js = "'use strict';\n\n" . $js;
        
        // Add security wrapper
        $js = "(function() {\n{$js}\n})();";
        
        return $js;
    }
}
```

##### **2.2 Content Security Policy (CSP)**

```php
// app/Http/Middleware/ContentSecurityPolicy.php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class ContentSecurityPolicy
{
    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);
        
        // Strict CSP for generated apps
        if ($request->is('apps/*')) {
            $csp = [
                "default-src 'self'",
                "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",  // Only trusted CDNs
                "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
                "img-src 'self' data: https:",
                "font-src 'self' data: https://fonts.gstatic.com",
                "connect-src 'self'",  // No external API calls
                "frame-ancestors 'none'",  // Cannot be embedded
                "base-uri 'self'",
                "form-action 'self'",
                "upgrade-insecure-requests",
            ];
            
            $response->headers->set('Content-Security-Policy', implode('; ', $csp));
            
            // Additional security headers
            $response->headers->set('X-Content-Type-Options', 'nosniff');
            $response->headers->set('X-Frame-Options', 'DENY');
            $response->headers->set('X-XSS-Protection', '1; mode=block');
            $response->headers->set('Referrer-Policy', 'no-referrer');
            $response->headers->set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
        }
        
        return $response;
    }
}
```

##### **2.3 Sandboxed iframe Serving**

```php
// app/Http/Controllers/GeneratedAppController.php
<?php

namespace App\Http\Controllers;

use App\Models\GeneratedApp;
use App\Services\HtmlSanitizerService;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;

class GeneratedAppController extends Controller
{
    public function __construct(
        private HtmlSanitizerService $sanitizer
    ) {}
    
    /**
     * Serve generated app in sandboxed iframe
     */
    public function show(string $appId): Response
    {
        $app = GeneratedApp::where('app_id', $appId)->firstOrFail();
        
        // Check permissions
        $this->authorize('view', $app);
        
        // Load sanitized HTML
        $html = Storage::disk('apps')->get($app->html_path);
        
        // Re-sanitize on serve (defense in depth)
        $sanitizedHtml = $this->sanitizer->sanitize($html);
        
        // Wrap in sandboxed template
        $wrappedHtml = view('apps.sandbox-wrapper', [
            'app' => $app,
            'content' => $sanitizedHtml,
        ])->render();
        
        return response($wrappedHtml)
            ->header('Content-Type', 'text/html; charset=UTF-8')
            ->header('X-Content-Type-Options', 'nosniff')
            ->header('X-Frame-Options', 'SAMEORIGIN') // Can be embedded only in same origin
            ->header('Content-Security-Policy', "sandbox allow-scripts allow-forms"); // Strict sandbox
    }
}
```

```blade
{{-- resources/views/apps/sandbox-wrapper.blade.php --}}
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-Content-Type-Options" content="nosniff">
    <title>{{ $app->title }} - NATAN App</title>
    <style>
        /* Minimal styles - app provides its own */
        body { margin: 0; padding: 20px; font-family: system-ui, sans-serif; }
        #app-container { max-width: 1200px; margin: 0 auto; }
        .natan-watermark { 
            margin-top: 40px; 
            text-align: center; 
            opacity: 0.5; 
            font-size: 12px; 
        }
    </style>
</head>
<body>
    <div id="app-container">
        {{-- Sanitized content from AI --}}
        {!! $content !!}
    </div>
    
    <div class="natan-watermark">
        Generated by NATAN AI • {{ $app->created_at->format('Y-m-d') }} • 
        <a href="{{ route('apps.info', $app->app_id) }}">Info</a>
    </div>
    
    <script>
        // Prevent app from escaping sandbox
        Object.freeze(window.top);
        Object.freeze(window.parent);
        
        // Override dangerous functions
        window.eval = function() { throw new Error('eval() is disabled'); };
        window.Function = function() { throw new Error('Function() is disabled'); };
        
        // Log attempts to access parent
        try {
            Object.defineProperty(window, 'parent', {
                get: function() { 
                    console.warn('Attempt to access parent window blocked');
                    return window; 
                }
            });
        } catch(e) {}
    </script>
</body>
</html>
```

##### **2.4 AI Prompt for Safe Code Generation**

```php
// app/Services/AppGeneratorService.php
private function buildSecurePrompt(string $userRequest): string
{
    return <<<PROMPT
Generate a secure, standalone HTML application for: {$userRequest}

STRICT SECURITY REQUIREMENTS:
1. NO inline event handlers (onclick, onerror, etc.) - use addEventListener only
2. NO eval(), Function(), setTimeout/setInterval with strings
3. NO innerHTML assignment - use textContent or createElement
4. NO external API calls - all data must be client-side
5. NO localStorage/sessionStorage access
6. NO window.location modifications
7. Use ONLY these libraries from CDN:
   - Chart.js (https://cdn.jsdelivr.net/npm/chart.js)
   - (specify others if needed)

CODE STRUCTURE:
- Complete HTML5 document
- All CSS in <style> tag
- All JavaScript in <script> tag at end of <body>
- Use modern ES6+ JavaScript
- All JavaScript in strict mode
- No external dependencies except approved CDN libraries

USER EXPERIENCE:
- Mobile responsive (use CSS Grid/Flexbox)
- Accessible (ARIA labels, semantic HTML)
- Clean, modern UI
- Interactive controls for parameters
- Clear labeling and instructions

Generate ONLY the HTML code, no explanations.
PROMPT;
}
```

##### **2.5 Validation Pipeline**

```php
// app/Services/GeneratedAppValidator.php
<?php

namespace App\Services;

class GeneratedAppValidator
{
    /**
     * Validate generated app before saving
     * 
     * @throws \Exception if validation fails
     */
    public function validate(string $html, string $js): array
    {
        $errors = [];
        
        // 1. Size check
        if (strlen($html) > 500_000) { // 500KB max
            $errors[] = 'HTML exceeds 500KB limit';
        }
        
        if (strlen($js) > 200_000) { // 200KB max
            $errors[] = 'JavaScript exceeds 200KB limit';
        }
        
        // 2. Syntax check (basic)
        if (substr_count($html, '<html') > 1) {
            $errors[] = 'Multiple <html> tags detected';
        }
        
        // 3. Dangerous patterns check
        $dangerousPatterns = [
            '/<script[^>]*src\s*=\s*["\'](?!https:\/\/cdn\.jsdelivr\.net)/i' => 'Unauthorized external script',
            '/fetch\s*\(/i' => 'Unauthorized API call (fetch)',
            '/XMLHttpRequest/i' => 'Unauthorized API call (XHR)',
            '/websocket/i' => 'Unauthorized WebSocket',
        ];
        
        foreach ($dangerousPatterns as $pattern => $message) {
            if (preg_match($pattern, $html . $js)) {
                $errors[] = $message;
            }
        }
        
        // 4. Required elements check
        if (!preg_match('/<meta[^>]*charset/i', $html)) {
            $errors[] = 'Missing charset meta tag';
        }
        
        if (!preg_match('/<meta[^>]*viewport/i', $html)) {
            $errors[] = 'Missing viewport meta tag (required for mobile)';
        }
        
        if (!empty($errors)) {
            throw new \Exception('Generated app validation failed: ' . implode(', ', $errors));
        }
        
        return [
            'valid' => true,
            'html_size' => strlen($html),
            'js_size' => strlen($js),
            'external_deps' => $this->extractExternalDependencies($html),
        ];
    }
    
    private function extractExternalDependencies(string $html): array
    {
        $deps = [];
        
        // Extract CDN scripts
        preg_match_all('/<script[^>]*src\s*=\s*["\']([^"\']+)["\']/i', $html, $matches);
        foreach ($matches[1] as $src) {
            if (str_starts_with($src, 'http')) {
                $deps[] = $src;
            }
        }
        
        return $deps;
    }
}
```

##### **2.6 Rate Limiting for App Generation**

```php
// config/natan.php
return [
    'generated_apps' => [
        'max_per_user_per_day' => 10,
        'max_per_conversation' => 5,
        'max_file_size_kb' => 500,
        'allowed_cdn_hosts' => [
            'cdn.jsdelivr.net',
            'cdnjs.cloudflare.com',
        ],
    ],
];

// app/Services/AppGeneratorService.php
public function generate(string $userRequest, Conversation $conversation): GeneratedApp
{
    // Check daily limit
    $todayCount = GeneratedApp::where('user_id', auth()->id())
        ->whereDate('created_at', today())
        ->count();
    
    if ($todayCount >= config('natan.generated_apps.max_per_user_per_day')) {
        throw new \Exception('Daily app generation limit reached');
    }
    
    // Check conversation limit
    $convCount = GeneratedApp::where('conversation_id', $conversation->id)->count();
    
    if ($convCount >= config('natan.generated_apps.max_per_conversation')) {
        throw new \Exception('Max apps per conversation reached');
    }
    
    // Generate app with AI
    // ... rest of logic
}
```

#### ✓ CHECKLIST VERIFICA SECURITY

```
☐ HtmlSanitizerService implementato e testato
☐ JavaScript sanitization con pattern blacklist
☐ CSP middleware configurato per /apps/*
☐ Sandboxed iframe serving implementato
☐ Security headers configurati (X-Frame-Options, X-XSS-Protection, etc.)
☐ AI prompt include security requirements
☐ Validation pipeline implementata (size, syntax, patterns)
☐ Rate limiting configurato (10/day per user, 5/conversation)
☐ External dependencies whitelist configurata
☐ Re-sanitization on serve (defense in depth)
☐ eval(), Function(), setTimeout con string bloccati
☐ inline event handlers bloccati (onclick, onerror, etc.)
☐ Nessun accesso a localStorage/sessionStorage
☐ Nessun accesso a window.location
☐ Test XSS payload eseguiti (OWASP Top 10)
```

---

## 3️⃣ PERFORMANCE EXCELLENCE

### ⚠️ IL PROBLEMA

**Query con 1000+ tenant in un gruppo:**
- `SELECT * FROM documents WHERE tenant_id IN (1,2,3,...,1000)`
- Vector search su MongoDB con 10M+ documenti
- Score calculation per ogni documento
- Sorting e ranking
- **Query time: 10-30 secondi** (inaccettabile)

### ✅ LA SOLUZIONE ENTERPRISE

**Caching Aggressivo + Indexing + Query Optimization + Pagination**

#### 🛠️ IMPLEMENTAZIONE PRATICA

##### **3.1 Redis Caching Layer**

```php
// config/cache.php (ensure Redis configured)
'stores' => [
    'redis' => [
        'driver' => 'redis',
        'connection' => 'cache',
        'lock_connection' => 'default',
    ],
],

// .env
CACHE_DRIVER=redis
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379
REDIS_DB=1
```

```php
// app/Services/TenantGroupCache.php
<?php

namespace App\Services;

use App\Models\TenantGroup;
use Illuminate\Support\Facades\Cache;

class TenantGroupCache
{
    private const CACHE_TTL = 3600; // 1 hour
    
    /**
     * Get tenant IDs for group (cached)
     */
    public function getTenantIds(int $groupId): array
    {
        $cacheKey = "tenant_group:{$groupId}:tenant_ids";
        
        return Cache::remember($cacheKey, self::CACHE_TTL, function() use ($groupId) {
            $group = TenantGroup::findOrFail($groupId);
            return json_decode($group->tenant_ids, true);
        });
    }
    
    /**
     * Get group metadata (cached)
     */
    public function getGroupMetadata(int $groupId): array
    {
        $cacheKey = "tenant_group:{$groupId}:metadata";
        
        return Cache::remember($cacheKey, self::CACHE_TTL, function() use ($groupId) {
            $group = TenantGroup::findOrFail($groupId);
            return [
                'id' => $group->id,
                'code' => $group->code,
                'name' => $group->name,
                'tenant_count' => count(json_decode($group->tenant_ids, true)),
                'category' => $group->category,
            ];
        });
    }
    
    /**
     * Invalidate cache when group changes
     */
    public function invalidate(int $groupId): void
    {
        Cache::forget("tenant_group:{$groupId}:tenant_ids");
        Cache::forget("tenant_group:{$groupId}:metadata");
    }
}
```

##### **3.2 Query Results Caching**

```php
// app/Services/QueryResultsCache.php
<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;

class QueryResultsCache
{
    private const CACHE_TTL = 1800; // 30 minutes
    
    /**
     * Generate cache key for query
     */
    private function getCacheKey(string $query, array $tenantIds, ?int $projectId): string
    {
        $hash = md5($query . implode(',', $tenantIds) . ($projectId ?? 'null'));
        return "query_results:{$hash}";
    }
    
    /**
     * Get cached results or execute query
     */
    public function remember(
        string $query, 
        array $tenantIds, 
        ?int $projectId,
        callable $callback
    ): array {
        $cacheKey = $this->getCacheKey($query, $tenantIds, $projectId);
        
        return Cache::remember($cacheKey, self::CACHE_TTL, function() use ($callback) {
            $startTime = microtime(true);
            $results = $callback();
            $executionTime = (microtime(true) - $startTime) * 1000;
            
            return [
                'results' => $results,
                'cached' => false,
                'execution_time_ms' => $executionTime,
                'cached_at' => now()->toIso8601String(),
            ];
        });
    }
    
    /**
     * Invalidate query cache for tenant
     */
    public function invalidateForTenant(int $tenantId): void
    {
        // Use cache tags if Redis supports them
        Cache::tags(['tenant:' . $tenantId])->flush();
    }
}
```

##### **3.3 Database Indexing Strategy**

```sql
-- Migration: optimize tenant_groups table
CREATE INDEX idx_tenant_groups_category ON tenant_groups(category);
CREATE INDEX idx_tenant_groups_is_system ON tenant_groups(is_system);

-- JSON indexing for tenant_ids (MySQL 5.7+)
ALTER TABLE tenant_groups 
ADD COLUMN tenant_count INT GENERATED ALWAYS AS (JSON_LENGTH(tenant_ids)) STORED;
CREATE INDEX idx_tenant_groups_count ON tenant_groups(tenant_count);

-- Composite indexes for conversations
CREATE INDEX idx_conversations_user_last_message 
    ON conversations(user_id, last_message_at DESC);
    
CREATE INDEX idx_conversations_tenant_project 
    ON conversations(tenant_id, project_id);

CREATE INDEX idx_conversations_project_last_message 
    ON conversations(project_id, last_message_at DESC) 
    WHERE project_id IS NOT NULL;

-- Composite indexes for messages
CREATE INDEX idx_messages_conversation_created 
    ON messages(conversation_id, created_at ASC);
    
CREATE INDEX idx_messages_conversation_role 
    ON messages(conversation_id, role);

-- Optimize generated_apps
CREATE INDEX idx_generated_apps_conversation 
    ON generated_apps(conversation_id, created_at DESC);
    
CREATE INDEX idx_generated_apps_user_tenant 
    ON generated_apps(user_id, tenant_id);
    
CREATE INDEX idx_generated_apps_public_type 
    ON generated_apps(is_public, app_type) 
    WHERE is_public = TRUE;

-- Full-text search index for app titles
ALTER TABLE generated_apps 
ADD FULLTEXT INDEX idx_generated_apps_fulltext (title, description);
```

##### **3.4 MongoDB Atlas Indexing**

```javascript
// MongoDB indexes for documents collection
db.documents.createIndex(
    { "tenant_id": 1, "created_at": -1 },
    { name: "idx_tenant_created" }
);

db.documents.createIndex(
    { "tenant_id": 1, "doc_type": 1 },
    { name: "idx_tenant_type" }
);

db.documents.createIndex(
    { "tenant_id": 1, "embedding": "vector" },
    { 
        name: "idx_tenant_vector",
        vectorSearchIndex: {
            dimension: 1536,
            similarity: "cosine"
        }
    }
);

// Compound index for multi-tenant queries
db.documents.createIndex(
    { 
        "tenant_id": 1, 
        "metadata.act_type": 1, 
        "created_at": -1 
    },
    { name: "idx_tenant_acttype_created" }
);
```

##### **3.5 Query Pagination & Chunking**

```php
// app/Services/RagService.php
public function retrieveDocuments(
    string $query,
    array $tenantIds,
    int $limit = 20,
    int $offset = 0
): array {
    // Don't search ALL tenants at once
    // Chunk into batches of 10 tenants max
    $chunks = array_chunk($tenantIds, 10);
    $allResults = [];
    
    foreach ($chunks as $chunk) {
        $chunkResults = $this->retrieveFromTenants($query, $chunk, $limit);
        $allResults = array_merge($allResults, $chunkResults);
    }
    
    // Sort by score
    usort($allResults, fn($a, $b) => $b['score'] <=> $a['score']);
    
    // Paginate
    return array_slice($allResults, $offset, $limit);
}
```

##### **3.6 Lazy Loading & Eager Loading**

```php
// app/Http/Controllers/ConversationController.php
public function index()
{
    // BAD: N+1 problem
    // $conversations = Conversation::where('user_id', auth()->id())->get();
    // foreach ($conversations as $conv) {
    //     echo $conv->project->name; // N+1 query!
    // }
    
    // GOOD: Eager loading
    $conversations = Conversation::where('user_id', auth()->id())
        ->with(['project:id,collection_name,icon,color'])  // Only needed fields
        ->select(['id', 'session_id', 'title', 'project_id', 'last_message_at'])
        ->orderBy('last_message_at', 'desc')
        ->limit(20)
        ->get();
    
    return response()->json($conversations);
}

public function show(int $id)
{
    $conversation = Conversation::with([
        'messages' => fn($q) => $q->orderBy('created_at', 'asc'),
        'project' => fn($q) => $q->select('id', 'collection_name', 'icon', 'color'),
    ])->findOrFail($id);
    
    return response()->json($conversation);
}
```

##### **3.7 Background Processing for Heavy Queries**

```php
// app/Jobs/ProcessMultiTenantQuery.php
<?php

namespace App\Jobs;

use App\Models\Conversation;
use App\Services\RagService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class ProcessMultiTenantQuery implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;
    
    public $timeout = 120; // 2 minutes max
    
    public function __construct(
        public int $conversationId,
        public string $query,
        public array $tenantIds,
        public ?int $projectId = null,
    ) {}
    
    public function handle(RagService $ragService): void
    {
        $results = $ragService->retrieveDocuments(
            $this->query,
            $this->tenantIds,
            $this->projectId
        );
        
        // Cache results
        Cache::put(
            "query_results:{$this->conversationId}:pending",
            $results,
            now()->addMinutes(10)
        );
        
        // Notify user via WebSocket/Pusher
        event(new QueryResultsReady($this->conversationId, $results));
    }
}

// Usage
ProcessMultiTenantQuery::dispatch($conversation->id, $query, $tenantIds, $projectId);
```

##### **3.8 Performance Monitoring**

```php
// app/Http/Middleware/PerformanceMonitor.php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PerformanceMonitor
{
    public function handle(Request $request, Closure $next)
    {
        $startTime = microtime(true);
        $startMemory = memory_get_usage();
        
        $response = $next($request);
        
        $executionTime = (microtime(true) - $startTime) * 1000;
        $memoryUsed = (memory_get_usage() - $startMemory) / 1024 / 1024;
        
        // Log slow requests
        if ($executionTime > 1000) { // > 1 second
            Log::channel('natan_performance')->warning('Slow request detected', [
                'url' => $request->fullUrl(),
                'method' => $request->method(),
                'execution_time_ms' => $executionTime,
                'memory_mb' => round($memoryUsed, 2),
                'user_id' => auth()->id(),
            ]);
        }
        
        // Add timing header
        $response->headers->set('X-Execution-Time', round($executionTime, 2) . 'ms');
        
        return $response;
    }
}
```

#### ✓ CHECKLIST VERIFICA PERFORMANCE

```
☐ Redis cache configurato e funzionante
☐ TenantGroupCache implementato (TTL 1h)
☐ QueryResultsCache implementato (TTL 30min)
☐ Database indexes creati e ottimizzati
☐ MongoDB Atlas vector search index configurato
☐ Query pagination implementata (chunking tenants)
☐ Eager loading usato per relationships (no N+1)
☐ Background jobs per query pesanti (>10 tenants)
☐ Performance monitoring middleware attivo
☐ Slow query logging configurato (>1s)
☐ Cache invalidation strategy definita
☐ Load testing eseguito (Apache Bench o k6)
☐ Database query profiling eseguito (EXPLAIN ANALYZE)
☐ MongoDB query profiling eseguito (explain())
☐ Response time < 500ms per query standard
```

---

## 4️⃣ TESTING EXCELLENCE

### ⚠️ IL PROBLEMA

**Codice complesso senza test = time bomb:**
- Multi-tenant queries
- Generated apps con sanitization
- RAG retrieval con boost
- Permissions granulari
- **Un bug in produzione costa 10x rispetto a trovarlo in test**

### ✅ LA SOLUZIONE ENTERPRISE

**Test Pyramid: Unit → Integration → E2E + Load Testing**

#### 🛠️ IMPLEMENTAZIONE PRATICA

##### **4.1 PHPUnit Configuration**

```xml
<!-- phpunit.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<phpunit xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:noNamespaceSchemaLocation="vendor/phpunit/phpunit/phpunit.xsd"
         bootstrap="vendor/autoload.php"
         colors="true">
    <testsuites>
        <testsuite name="Unit">
            <directory>tests/Unit</directory>
        </testsuite>
        <testsuite name="Feature">
            <directory>tests/Feature</directory>
        </testsuite>
        <testsuite name="Integration">
            <directory>tests/Integration</directory>
        </testsuite>
    </testsuites>
    <coverage processUncoveredFiles="true">
        <include>
            <directory suffix=".php">app</directory>
        </include>
        <exclude>
            <directory>app/Console</directory>
            <file>app/Exceptions/Handler.php</file>
        </exclude>
        <report>
            <html outputDirectory="coverage-report"/>
            <text outputFile="php://stdout"/>
        </report>
    </coverage>
    <php>
        <env name="APP_ENV" value="testing"/>
        <env name="CACHE_DRIVER" value="array"/>
        <env name="SESSION_DRIVER" value="array"/>
        <env name="QUEUE_CONNECTION" value="sync"/>
        <env name="DB_CONNECTION" value="sqlite"/>
        <env name="DB_DATABASE" value=":memory:"/>
    </php>
</phpunit>
```

##### **4.2 Unit Tests - Sanitization**

```php
// tests/Unit/Services/HtmlSanitizerServiceTest.php
<?php

namespace Tests\Unit\Services;

use App\Services\HtmlSanitizerService;
use PHPUnit\Framework\TestCase;

class HtmlSanitizerServiceTest extends TestCase
{
    private HtmlSanitizerService $sanitizer;
    
    protected function setUp(): void
    {
        parent::setUp();
        $this->sanitizer = new HtmlSanitizerService();
    }
    
    /** @test */
    public function it_removes_script_tags()
    {
        $html = '<div>Safe content</div><script>alert("XSS")</script>';
        
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Forbidden pattern detected');
        
        $this->sanitizer->sanitize($html);
    }
    
    /** @test */
    public function it_removes_inline_event_handlers()
    {
        $html = '<button onclick="alert(1)">Click</button>';
        
        $this->expectException(\Exception::class);
        
        $this->sanitizer->sanitize($html);
    }
    
    /** @test */
    public function it_removes_javascript_protocol()
    {
        $html = '<a href="javascript:alert(1)">Link</a>';
        
        $this->expectException(\Exception::class);
        
        $this->sanitizer->sanitize($html);
    }
    
    /** @test */
    public function it_allows_safe_html()
    {
        $html = '<div class="container"><h1>Title</h1><p>Content</p></div>';
        
        $result = $this->sanitizer->sanitize($html);
        
        $this->assertStringContainsString('<div', $result);
        $this->assertStringContainsString('<h1>Title</h1>', $result);
        $this->assertStringContainsString('<p>Content</p>', $result);
    }
    
    /** @test */
    public function it_removes_disallowed_tags()
    {
        $html = '<div>Safe</div><iframe src="evil.com"></iframe>';
        
        $this->expectException(\Exception::class);
        
        $this->sanitizer->sanitize($html);
    }
    
    /** @test */
    public function it_sanitizes_javascript_eval()
    {
        $js = 'const x = 10; eval("alert(1)");';
        
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Dangerous JavaScript pattern');
        
        $this->sanitizer->sanitizeJavaScript($js);
    }
}
```

##### **4.3 Feature Tests - Conversation API**

```php
// tests/Feature/ConversationControllerTest.php
<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Conversation;
use App\Models\NatanProject;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ConversationControllerTest extends TestCase
{
    use RefreshDatabase;
    
    /** @test */
    public function user_can_create_conversation_without_project()
    {
        $user = User::factory()->create();
        
        $response = $this->actingAs($user)
            ->postJson('/natan/conversations', [
                'title' => 'Test Conversation',
            ]);
        
        $response->assertStatus(201)
            ->assertJsonStructure([
                'id',
                'session_id',
                'title',
                'project_id',
            ]);
        
        $this->assertDatabaseHas('conversations', [
            'user_id' => $user->id,
            'title' => 'Test Conversation',
            'project_id' => null,
        ]);
    }
    
    /** @test */
    public function user_can_create_conversation_with_project()
    {
        $user = User::factory()->create();
        $project = NatanProject::factory()->create(['creator_id' => $user->id]);
        
        $response = $this->actingAs($user)
            ->postJson('/natan/conversations', [
                'title' => 'Project Chat',
                'project_id' => $project->id,
            ]);
        
        $response->assertStatus(201);
        
        $this->assertDatabaseHas('conversations', [
            'user_id' => $user->id,
            'project_id' => $project->id,
        ]);
    }
    
    /** @test */
    public function user_cannot_create_conversation_with_others_project()
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $project = NatanProject::factory()->create(['creator_id' => $otherUser->id]);
        
        $response = $this->actingAs($user)
            ->postJson('/natan/conversations', [
                'project_id' => $project->id,
            ]);
        
        $response->assertStatus(403);
    }
    
    /** @test */
    public function user_can_list_own_conversations()
    {
        $user = User::factory()->create();
        Conversation::factory()->count(5)->create(['user_id' => $user->id]);
        Conversation::factory()->count(3)->create(); // Other users
        
        $response = $this->actingAs($user)
            ->getJson('/natan/conversations');
        
        $response->assertStatus(200)
            ->assertJsonCount(5, 'data');
    }
}
```

##### **4.4 Integration Tests - Multi-Tenant Query**

```php
// tests/Integration/MultiTenantQueryTest.php
<?php

namespace Tests\Integration;

use App\Models\User;
use App\Models\Tenant;
use App\Models\TenantGroup;
use App\Services\RagService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MultiTenantQueryTest extends TestCase
{
    use RefreshDatabase;
    
    private RagService $ragService;
    
    protected function setUp(): void
    {
        parent::setUp();
        $this->ragService = app(RagService::class);
    }
    
    /** @test */
    public function it_retrieves_documents_from_multiple_tenants()
    {
        $tenant1 = Tenant::factory()->create(['id' => 1]);
        $tenant2 = Tenant::factory()->create(['id' => 2]);
        
        // Mock MongoDB documents
        $this->mockMongoDocuments([
            ['tenant_id' => 1, 'title' => 'Doc from Tenant 1', 'score' => 0.95],
            ['tenant_id' => 2, 'title' => 'Doc from Tenant 2', 'score' => 0.88],
        ]);
        
        $results = $this->ragService->retrieveDocuments(
            'test query',
            [1, 2],
            limit: 10
        );
        
        $this->assertCount(2, $results);
        $this->assertEquals(1, $results[0]['tenant_id']);
        $this->assertEquals(0.95, $results[0]['score']);
    }
    
    /** @test */
    public function it_applies_boost_to_own_tenant()
    {
        $results = $this->ragService->retrieveWithBoost(
            'test query',
            tenantIds: [1, 2, 3],
            ownTenantId: 1,
            boostConfig: [
                'own_tenant' => 1.5,
                'group' => 1.0,
            ]
        );
        
        // Documents from tenant 1 should have boosted scores
        $tenant1Docs = array_filter($results, fn($doc) => $doc['tenant_id'] === 1);
        $this->assertNotEmpty($tenant1Docs);
        
        foreach ($tenant1Docs as $doc) {
            $this->assertEquals(1.5, $doc['boost_applied']);
        }
    }
}
```

##### **4.5 Load Testing with k6**

```javascript
// tests/Performance/k6-multi-tenant-query.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    stages: [
        { duration: '30s', target: 10 },   // Ramp up to 10 users
        { duration: '1m', target: 50 },    // Ramp up to 50 users
        { duration: '2m', target: 50 },    // Stay at 50 users
        { duration: '30s', target: 0 },    // Ramp down
    ],
    thresholds: {
        http_req_duration: ['p(95)<2000'], // 95% of requests < 2s
        http_req_failed: ['rate<0.01'],    // <1% failure rate
    },
};

export default function () {
    const url = 'http://localhost:8000/api/v1/chat';
    
    const payload = JSON.stringify({
        messages: [
            { role: 'user', content: 'Quali sono i bandi attivi?' }
        ],
        tenant_id: 2,
        query_config: {
            target_mode: 'group',
            target_group_id: 1, // Tutti i comuni toscana
        },
    });
    
    const params = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer TEST_TOKEN',
            'X-Correlation-ID': `k6-test-${__VU}-${__ITER}`,
        },
    };
    
    const response = http.post(url, payload, params);
    
    check(response, {
        'status is 200': (r) => r.status === 200,
        'response time < 2s': (r) => r.timings.duration < 2000,
        'has answer': (r) => JSON.parse(r.body).answer !== undefined,
        'has sources': (r) => JSON.parse(r.body).sources.length > 0,
    });
    
    sleep(1);
}
```

```bash
# Run load test
k6 run tests/Performance/k6-multi-tenant-query.js

# Run with custom VUs and duration
k6 run --vus 100 --duration 5m tests/Performance/k6-multi-tenant-query.js
```

##### **4.6 E2E Testing with Laravel Dusk**

```php
// tests/Browser/ChatWorkflowTest.php
<?php

namespace Tests\Browser;

use App\Models\User;
use App\Models\NatanProject;
use Laravel\Dusk\Browser;
use Tests\DuskTestCase;

class ChatWorkflowTest extends DuskTestCase
{
    /** @test */
    public function user_can_start_chat_with_project()
    {
        $user = User::factory()->create();
        $project = NatanProject::factory()->create(['creator_id' => $user->id]);
        
        $this->browse(function (Browser $browser) use ($user, $project) {
            $browser->loginAs($user)
                ->visit('/natan/chat')
                ->assertSee('Nuova Chat')
                ->click('@new-chat-button')
                ->assertPathIs('/natan/chat')
                ->select('@project-selector', $project->id)
                ->assertSee($project->name)
                ->type('@message-input', 'Quali sono i documenti disponibili?')
                ->click('@send-button')
                ->waitForText('documenti disponibili', 10)
                ->assertSee('documenti disponibili')
                ->assertPresent('@source-document');
        });
    }
}
```

#### ✓ CHECKLIST VERIFICA TESTING

```
☐ PHPUnit configurato con coverage reporting
☐ Unit tests per HtmlSanitizerService (>90% coverage)
☐ Unit tests per QueryResultsCache
☐ Feature tests per ConversationController CRUD
☐ Feature tests per MessageController
☐ Feature tests per GeneratedAppController
☐ Integration tests per multi-tenant queries
☐ Integration tests per RAG retrieval con boost
☐ Permission tests con Spatie
☐ Load testing script k6 creato e testato
☐ E2E tests con Laravel Dusk per workflow principali
☐ Test database seeding configurato
☐ CI/CD pipeline con test automatici (GitHub Actions)
☐ Code coverage > 80% per componenti critici
☐ Performance benchmarks documentati (baseline)
```

---

## 5️⃣ DOCUMENTATION EXCELLENCE

### ⚠️ IL PROBLEMA

**Sistema complesso senza documentazione = maintenance nightmare:**
- Multi-tenancy gerarchico
- Generated apps workflow
- Query boost logic
- Fra 6 mesi nessuno ricorda **perché** è stato fatto così

### ✅ LA SOLUZIONE ENTERPRISE

**ADR (Architecture Decision Records) + API Docs + Runbooks**

#### 🛠️ IMPLEMENTAZIONE PRATICA

##### **5.1 Architecture Decision Records (ADR)**

```markdown
<!-- docs/adr/0001-multi-tenant-query-architecture.md -->
# ADR-0001: Multi-Tenant Query Architecture

**Date**: 2025-11-22  
**Status**: Accepted  
**Deciders**: Fabio Cherici, Padmin D. Curtis  

## Context

NATAN_LOC needs to support queries across multiple tenants (PA entities).
Users should be able to:
1. Query only their own tenant (default)
2. Query a group of tenants (e.g., all Tuscan municipalities)
3. Query specific tenants with explicit permission

The system must handle 1000+ tenants efficiently.

## Decision

We will implement a **3-tier architecture**:

1. **TenantGroup** model for grouping tenants by category
2. **Query configuration** in conversation for flexible tenant targeting
3. **Boost scoring** to prioritize results:
   - Project documents: 1.5x
   - Own tenant: 1.2x
   - Group tenants: 1.0x
   - External tenants: 0.8x

### Data Model

```sql
tenant_groups
├─ id
├─ code (e.g., 'pa_comuni_toscana')
├─ tenant_ids (JSON array)
└─ category

conversations
├─ query_config (JSON)
   {
     "target_mode": "single|group|multi",
     "target_tenant_ids": [1,2,3],
     "boost_config": {...}
   }
```

### Query Execution

1. Resolve `target_tenant_ids` from group or explicit list
2. Chunk into batches of 10 tenants (performance)
3. Execute vector search with tenant filter
4. Apply boost scores
5. Sort and paginate results

## Consequences

### Positive
- Flexible: supports all query modes
- Scalable: chunking prevents performance issues
- Extensible: easy to add new boost factors

### Negative
- Complex query logic (needs extensive testing)
- Caching strategy critical for performance
- Debug difficulty (requires structured logging)

## Alternatives Considered

### Alternative 1: Single unified index
- **Rejected**: Cannot efficiently filter by tenant in vector search

### Alternative 2: Separate index per tenant
- **Rejected**: 1000+ indexes = maintenance nightmare

## References
- Ticket: NATAN-123
- Discussion: [Link to Slack/Email]
```

##### **5.2 API Documentation (OpenAPI/Swagger)**

```yaml
# docs/openapi/natan-api.yaml
openapi: 3.0.3
info:
  title: NATAN_LOC API
  description: Multi-tenant RAG chatbot for PA entities
  version: 1.0.0
  contact:
    name: Fabio Cherici
    email: fabio@florenceegi.com

servers:
  - url: https://natan.florenceegi.com/api/v1
    description: Production
  - url: http://localhost:8000/api/v1
    description: Development

tags:
  - name: Conversations
    description: Chat conversations management
  - name: Messages
    description: Chat messages
  - name: Projects
    description: Document projects
  - name: Generated Apps
    description: AI-generated applications

paths:
  /natan/conversations:
    get:
      summary: List user conversations
      tags: [Conversations]
      security:
        - bearerAuth: []
      parameters:
        - name: limit
          in: query
          schema:
            type: integer
            default: 20
        - name: offset
          in: query
          schema:
            type: integer
            default: 0
      responses:
        '200':
          description: List of conversations
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/Conversation'
                  meta:
                    $ref: '#/components/schemas/Pagination'
    
    post:
      summary: Create new conversation
      tags: [Conversations]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                title:
                  type: string
                  example: "Analisi bandi 2025"
                project_id:
                  type: integer
                  nullable: true
                  example: 42
                query_config:
                  $ref: '#/components/schemas/QueryConfig'
      responses:
        '201':
          description: Conversation created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Conversation'

components:
  schemas:
    Conversation:
      type: object
      properties:
        id:
          type: integer
          example: 123
        session_id:
          type: string
          format: uuid
          example: "550e8400-e29b-41d4-a716-446655440000"
        user_id:
          type: integer
          example: 1
        tenant_id:
          type: integer
          example: 2
        project_id:
          type: integer
          nullable: true
          example: 42
        title:
          type: string
          example: "Analisi bandi 2025"
        query_config:
          $ref: '#/components/schemas/QueryConfig'
        message_count:
          type: integer
          example: 15
        last_message_at:
          type: string
          format: date-time
          example: "2025-11-22T10:30:00Z"
    
    QueryConfig:
      type: object
      properties:
        target_mode:
          type: string
          enum: [single, group, multi]
          example: "group"
        target_tenant_ids:
          type: array
          items:
            type: integer
          example: [1, 2, 5, 8]
        target_group_id:
          type: integer
          nullable: true
          example: 3
        boost_config:
          type: object
          properties:
            project_documents:
              type: number
              format: float
              example: 1.5
            own_tenant:
              type: number
              format: float
              example: 1.2
            group_tenants:
              type: number
              format: float
              example: 1.0

  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
```

```bash
# Generate API docs HTML
npx @redocly/cli build-docs docs/openapi/natan-api.yaml \
    --output public/api-docs/index.html
```

##### **5.3 Runbooks for Operations**

```markdown
<!-- docs/runbooks/multi-tenant-query-troubleshooting.md -->
# Runbook: Multi-Tenant Query Troubleshooting

## Symptom: Slow queries (>5 seconds)

### Diagnosis Steps

1. **Check correlation ID in logs**
   ```bash
   tail -f storage/logs/natan_queries.log | grep "correlation_id:ABC123"
   ```

2. **Identify bottleneck**
   - **Embedding generation**: >500ms → Check OpenAI API status
   - **Vector search**: >2s → Check MongoDB Atlas cluster health
   - **Boost calculation**: >500ms → Check tenant count in query

3. **Check cache hit rate**
   ```bash
   redis-cli INFO stats | grep keyspace_hits
   redis-cli INFO stats | grep keyspace_misses
   # Hit rate should be >80%
   ```

### Resolution

#### If cache miss rate high (>30%)
```bash
# Increase cache TTL
# Edit config/cache.php
'ttl' => 7200, // 2 hours instead of 1 hour

# Warm cache for common queries
php artisan cache:warm-tenant-groups
```

#### If vector search slow
```bash
# Check MongoDB Atlas cluster metrics
# https://cloud.mongodb.com/v2/<project>/metrics/replicaSet/<cluster>

# If CPU >80%, scale cluster tier
# If memory >80%, add RAM or enable compression

# Check vector index
mongosh "mongodb+srv://cluster.mongodb.net/natan_ai_core"
db.documents.getIndexes()
# Ensure idx_tenant_vector exists
```

#### If too many tenants (>50)
```bash
# Enable background processing
# In .env
QUEUE_CONNECTION=redis

# Run queue worker
php artisan queue:work --queue=multi-tenant-queries
```

## Symptom: No results returned

### Diagnosis Steps

1. **Check tenant IDs resolution**
   ```bash
   # In natan_decisions.log
   grep "tenant_ids" storage/logs/natan_decisions.log
   ```

2. **Check document count per tenant**
   ```javascript
   // In MongoDB
   db.documents.aggregate([
       { $match: { tenant_id: { $in: [1,2,3] } } },
       { $group: { _id: "$tenant_id", count: { $sum: 1 } } }
   ])
   ```

3. **Check relevance threshold**
   ```python
   # In Python retriever.py
   # Default threshold: 0.5
   # If no results, threshold might be too high
   ```

### Resolution

```python
# Lower relevance threshold temporarily
# retriever.py
self.relevance_threshold = 0.3  # Was 0.5
```

## Escalation

If issue persists after above steps:
1. **Create GitHub issue** with correlation ID and logs
2. **Notify on Slack**: #natan-incidents
3. **Contact**: fabio@florenceegi.com

## Post-Incident

1. **Update ADR** if architectural change needed
2. **Add monitoring** for this scenario
3. **Update runbook** with new findings
```

##### **5.4 Code Documentation Standards**

```php
/**
 * Retrieve documents with multi-tenant query and boost scoring
 * 
 * This method implements the multi-tenant query architecture defined in ADR-0001.
 * It resolves tenant IDs, applies boost scoring, and returns ranked results.
 * 
 * @param string $query User's natural language query
 * @param array<int> $tenantIds List of tenant IDs to search
 * @param int|null $projectId Optional project ID for project-scoped search
 * @param array $boostConfig Boost multipliers for different sources
 *        [
 *            'project_documents' => 1.5,
 *            'own_tenant' => 1.2,
 *            'group_tenants' => 1.0
 *        ]
 * @param int $limit Maximum number of results to return (default: 20)
 * @param int $offset Pagination offset (default: 0)
 * 
 * @return array<int, array{
 *     doc_id: string,
 *     title: string,
 *     content: string,
 *     tenant_id: int,
 *     score: float,
 *     boost_applied: float,
 *     final_score: float,
 *     source_type: string
 * }> List of retrieved documents with scores
 * 
 * @throws \Exception If tenant IDs exceed limit (>100)
 * @throws \MongoDB\Driver\Exception\Exception If MongoDB connection fails
 * 
 * @see ADR-0001 Multi-Tenant Query Architecture
 * @see https://docs.natan-loc.com/query-boost-algorithm
 * 
 * @example
 * ```php
 * $results = $ragService->retrieveDocuments(
 *     query: "bandi mobilità sostenibile",
 *     tenantIds: [1, 2, 5],
 *     projectId: 42,
 *     boostConfig: ['project_documents' => 1.5, 'own_tenant' => 1.2],
 *     limit: 10
 * );
 * ```
 * 
 * @performance Average execution time: 800ms for 10 tenants, 2-3s for 50 tenants
 * @caching Results cached for 30 minutes (see QueryResultsCache)
 * @logging Logs to natan_queries.log with correlation_id
 */
public function retrieveDocuments(
    string $query,
    array $tenantIds,
    ?int $projectId = null,
    array $boostConfig = [],
    int $limit = 20,
    int $offset = 0
): array {
    // Implementation...
}
```

#### ✓ CHECKLIST VERIFICA DOCUMENTATION

```
☐ ADR template creato (docs/adr/template.md)
☐ ADR scritti per decisioni architetturali maggiori (almeno 5)
☐ OpenAPI/Swagger spec completa (>80% endpoints)
☐ API docs HTML pubblicate (/public/api-docs)
☐ Runbooks creati per scenari comuni (troubleshooting)
☐ Onboarding guide per nuovi developer (README)
☐ Database schema documentation (ER diagrams)
☐ Code documentation standards definiti
☐ PHPDoc completo per metodi pubblici (>90%)
☐ Inline comments per logica complessa
☐ Example usage in docblocks
☐ Performance characteristics documentati
☐ Security considerations documentate
☐ Architecture overview diagram (docs/architecture.md)
☐ Changelog mantenuto (CHANGELOG.md)
```

---

## 6️⃣ MONITORING & OBSERVABILITY EXCELLENCE

### ⚠️ IL PROBLEMA

**Sistema in produzione senza monitoring = flying blind:**
- Query lente ma nessuno se ne accorge
- Errori silenziosi che si accumulano
- Performance che degrada gradualmente
- **Problema scoperto solo quando utente si lamenta** (troppo tardi!)

### ✅ LA SOLUZIONE ENTERPRISE

**Proactive Monitoring + Alerting + Dashboards + APM**

#### 🛠️ IMPLEMENTAZIONE PRATICA

##### **6.1 Application Performance Monitoring (Laravel Telescope)**

```bash
# Install Laravel Telescope
composer require laravel/telescope --dev

# Publish config
php artisan telescope:install
php artisan migrate

# Publish assets
php artisan telescope:publish
```

```php
// config/telescope.php
return [
    'enabled' => env('TELESCOPE_ENABLED', true),
    
    'storage' => [
        'database' => [
            'connection' => env('DB_CONNECTION', 'mysql'),
            'chunk' => 1000,
        ],
    ],
    
    'watchers' => [
        Watchers\CacheWatcher::class => env('TELESCOPE_CACHE_WATCHER', true),
        Watchers\CommandWatcher::class => env('TELESCOPE_COMMAND_WATCHER', true),
        Watchers\DumpWatcher::class => env('TELESCOPE_DUMP_WATCHER', true),
        Watchers\EventWatcher::class => env('TELESCOPE_EVENT_WATCHER', true),
        Watchers\ExceptionWatcher::class => env('TELESCOPE_EXCEPTION_WATCHER', true),
        Watchers\JobWatcher::class => env('TELESCOPE_JOB_WATCHER', true),
        Watchers\LogWatcher::class => env('TELESCOPE_LOG_WATCHER', true),
        Watchers\MailWatcher::class => env('TELESCOPE_MAIL_WATCHER', true),
        Watchers\ModelWatcher::class => env('TELESCOPE_MODEL_WATCHER', true),
        Watchers\NotificationWatcher::class => env('TELESCOPE_NOTIFICATION_WATCHER', true),
        Watchers\QueryWatcher::class => [
            'enabled' => env('TELESCOPE_QUERY_WATCHER', true),
            'slow' => 100, // Log queries > 100ms
        ],
        Watchers\RedisWatcher::class => env('TELESCOPE_REDIS_WATCHER', true),
        Watchers\RequestWatcher::class => [
            'enabled' => env('TELESCOPE_REQUEST_WATCHER', true),
            'size_limit' => 64,
        ],
        Watchers\ScheduleWatcher::class => env('TELESCOPE_SCHEDULE_WATCHER', true),
    ],
    
    'ignore_paths' => [
        'nova-api*',
        'telescope*',
    ],
    
    'ignore_commands' => [
        'schedule:run',
        'schedule:finish',
    ],
];
```

##### **6.2 Error Tracking (Sentry Integration)**

```bash
# Install Sentry SDK
composer require sentry/sentry-laravel

# Publish config
php artisan vendor:publish --provider="Sentry\Laravel\ServiceProvider"
```

```php
// config/sentry.php
return [
    'dsn' => env('SENTRY_LARAVEL_DSN'),
    
    'environment' => env('APP_ENV', 'production'),
    
    'release' => env('SENTRY_RELEASE'),
    
    'breadcrumbs' => [
        'logs' => true,
        'cache' => true,
        'livewire' => true,
        'sql_queries' => true,
        'sql_bindings' => true,
        'sql_transactions' => true,
        'command_info' => true,
    ],
    
    'tracing' => [
        'enabled' => true,
        'sample_rate' => env('SENTRY_TRACES_SAMPLE_RATE', 0.2), // 20% of requests
        'queue_job_transactions' => true,
        'queue_jobs' => true,
        'sql_queries' => true,
        'sql_origin' => true,
        'views' => true,
    ],
    
    'send_default_pii' => false, // GDPR compliant
    
    'context_lines' => 5,
    
    'integrations' => [
        'breadcrumbs' => true,
        'breadcrumbs.sql_queries' => true,
    ],
];

// app/Exceptions/Handler.php
public function register(): void
{
    $this->reportable(function (Throwable $e) {
        if (app()->bound('sentry') && $this->shouldReport($e)) {
            app('sentry')->captureException($e);
        }
    });
}
```

##### **6.3 Custom Metrics (Prometheus + Grafana)**

```php
// app/Services/MetricsService.php
<?php

namespace App\Services;

use Illuminate\Support\Facades\Redis;

class MetricsService
{
    /**
     * Increment counter metric
     */
    public function increment(string $metric, array $labels = [], int $value = 1): void
    {
        $key = $this->buildMetricKey($metric, $labels);
        Redis::incrby("metrics:counter:{$key}", $value);
    }
    
    /**
     * Record histogram (timing) metric
     */
    public function histogram(string $metric, float $value, array $labels = []): void
    {
        $key = $this->buildMetricKey($metric, $labels);
        
        // Store in Redis sorted set for percentile calculations
        Redis::zadd("metrics:histogram:{$key}", $value, microtime(true));
        
        // Keep only last 10k measurements
        Redis::zremrangebyrank("metrics:histogram:{$key}", 0, -10001);
    }
    
    /**
     * Set gauge metric
     */
    public function gauge(string $metric, float $value, array $labels = []): void
    {
        $key = $this->buildMetricKey($metric, $labels);
        Redis::set("metrics:gauge:{$key}", $value);
    }
    
    /**
     * Record multi-tenant query metrics
     */
    public function recordQueryMetrics(array $context): void
    {
        $labels = [
            'tenant_count' => count($context['tenant_ids']),
            'has_project' => $context['project_id'] ? 'true' : 'false',
            'query_mode' => $context['query_mode'],
        ];
        
        // Increment query counter
        $this->increment('natan_queries_total', $labels);
        
        // Record query time
        $this->histogram('natan_query_duration_ms', $context['query_time_ms'], $labels);
        
        // Record documents retrieved
        $this->histogram('natan_documents_retrieved', $context['documents_count'], $labels);
        
        // Record cache hit/miss
        if ($context['from_cache']) {
            $this->increment('natan_cache_hits_total', $labels);
        } else {
            $this->increment('natan_cache_misses_total', $labels);
        }
    }
    
    /**
     * Build metric key with labels
     */
    private function buildMetricKey(string $metric, array $labels): string
    {
        ksort($labels);
        $labelStr = http_build_query($labels, '', ',');
        return "{$metric}{{$labelStr}}";
    }
    
    /**
     * Export metrics in Prometheus format
     */
    public function export(): string
    {
        $output = '';
        
        // Export counters
        $counters = Redis::keys('metrics:counter:*');
        foreach ($counters as $key) {
            $value = Redis::get($key);
            $metricName = str_replace('metrics:counter:', '', $key);
            $output .= "{$metricName} {$value}\n";
        }
        
        // Export gauges
        $gauges = Redis::keys('metrics:gauge:*');
        foreach ($gauges as $key) {
            $value = Redis::get($key);
            $metricName = str_replace('metrics:gauge:', '', $key);
            $output .= "{$metricName} {$value}\n";
        }
        
        // Export histograms (p50, p95, p99)
        $histograms = Redis::keys('metrics:histogram:*');
        foreach ($histograms as $key) {
            $values = Redis::zrange($key, 0, -1);
            if (!empty($values)) {
                sort($values);
                $count = count($values);
                
                $metricName = str_replace('metrics:histogram:', '', $key);
                $p50 = $values[(int)($count * 0.50)];
                $p95 = $values[(int)($count * 0.95)];
                $p99 = $values[(int)($count * 0.99)];
                
                $output .= "{$metricName}_p50 {$p50}\n";
                $output .= "{$metricName}_p95 {$p95}\n";
                $output .= "{$metricName}_p99 {$p99}\n";
            }
        }
        
        return $output;
    }
}

// routes/web.php (metrics endpoint)
Route::get('/metrics', function (MetricsService $metrics) {
    return response($metrics->export())
        ->header('Content-Type', 'text/plain; version=0.0.4');
})->middleware('auth.metrics'); // Protect with basic auth
```

##### **6.4 Health Check Endpoint**

```php
// app/Http/Controllers/HealthCheckController.php
<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;

class HealthCheckController extends Controller
{
    /**
     * Basic health check (liveness probe)
     */
    public function liveness(): JsonResponse
    {
        return response()->json([
            'status' => 'ok',
            'timestamp' => now()->toIso8601String(),
        ]);
    }
    
    /**
     * Detailed health check (readiness probe)
     */
    public function readiness(): JsonResponse
    {
        $checks = [
            'database' => $this->checkDatabase(),
            'redis' => $this->checkRedis(),
            'python_service' => $this->checkPythonService(),
            'mongodb' => $this->checkMongoDB(),
        ];
        
        $healthy = collect($checks)->every(fn($check) => $check['healthy']);
        
        return response()->json([
            'status' => $healthy ? 'healthy' : 'unhealthy',
            'checks' => $checks,
            'timestamp' => now()->toIso8601String(),
        ], $healthy ? 200 : 503);
    }
    
    private function checkDatabase(): array
    {
        try {
            DB::select('SELECT 1');
            return ['healthy' => true, 'message' => 'Connected'];
        } catch (\Exception $e) {
            return ['healthy' => false, 'message' => $e->getMessage()];
        }
    }
    
    private function checkRedis(): array
    {
        try {
            Redis::ping();
            return ['healthy' => true, 'message' => 'Connected'];
        } catch (\Exception $e) {
            return ['healthy' => false, 'message' => $e->getMessage()];
        }
    }
    
    private function checkPythonService(): array
    {
        try {
            $response = Http::timeout(5)->get(config('services.python_fastapi.url') . '/health');
            
            if ($response->successful()) {
                return ['healthy' => true, 'message' => 'Available'];
            }
            
            return ['healthy' => false, 'message' => 'HTTP ' . $response->status()];
        } catch (\Exception $e) {
            return ['healthy' => false, 'message' => $e->getMessage()];
        }
    }
    
    private function checkMongoDB(): array
    {
        try {
            $client = new \MongoDB\Client(env('MONGODB_URI'));
            $client->listDatabases();
            
            return ['healthy' => true, 'message' => 'Connected'];
        } catch (\Exception $e) {
            return ['healthy' => false, 'message' => $e->getMessage()];
        }
    }
}

// routes/web.php
Route::get('/health/liveness', [HealthCheckController::class, 'liveness']);
Route::get('/health/readiness', [HealthCheckController::class, 'readiness']);
```

##### **6.5 Alert Rules (Example for Prometheus Alertmanager)**

```yaml
# docker/prometheus/alert_rules.yml
groups:
  - name: natan_alerts
    interval: 30s
    rules:
      # Slow queries
      - alert: SlowQueries
        expr: natan_query_duration_ms_p95 > 3000
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Slow queries detected (p95 > 3s)"
          description: "95th percentile query time is {{ $value }}ms"
      
      # High error rate
      - alert: HighErrorRate
        expr: rate(natan_errors_total[5m]) > 0.05
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected (>5%)"
          description: "Error rate: {{ $value | humanizePercentage }}"
      
      # Cache miss rate
      - alert: HighCacheMissRate
        expr: |
          rate(natan_cache_misses_total[5m]) / 
          (rate(natan_cache_hits_total[5m]) + rate(natan_cache_misses_total[5m])) 
          > 0.5
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "High cache miss rate (>50%)"
          description: "Consider warming cache or increasing TTL"
      
      # Service unavailable
      - alert: PythonServiceDown
        expr: up{job="python_fastapi"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Python FastAPI service is down"
          description: "Service has been down for 1 minute"
      
      # Database connection pool exhausted
      - alert: DatabaseConnectionPoolExhausted
        expr: mysql_global_status_threads_connected > 100
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Database connection pool near exhaustion"
          description: "{{ $value }} connections active (limit: 150)"
```

##### **6.6 Logging to External Service (Papertrail/Loggly)**

```php
// config/logging.php
'channels' => [
    // ... existing channels ...
    
    'papertrail' => [
        'driver' => 'monolog',
        'level' => env('LOG_LEVEL', 'info'),
        'handler' => SyslogUdpHandler::class,
        'handler_with' => [
            'host' => env('PAPERTRAIL_URL'),
            'port' => env('PAPERTRAIL_PORT'),
            'connectionString' => 'tls://'.env('PAPERTRAIL_URL').':'.env('PAPERTRAIL_PORT'),
        ],
        'processors' => [
            PsrLogMessageProcessor::class,
            IntrospectionProcessor::class,
            WebProcessor::class,
        ],
    ],
    
    'stack' => [
        'driver' => 'stack',
        'channels' => ['daily', 'papertrail'], // Log to both
        'ignore_exceptions' => false,
    ],
],

// .env
PAPERTRAIL_URL=logs.papertrailapp.com
PAPERTRAIL_PORT=12345
```

##### **6.7 Uptime Monitoring (External)**

```bash
# Use services like:
# - UptimeRobot (free tier: 50 monitors, 5min intervals)
# - Pingdom
# - StatusCake
# - Better Uptime

# Monitor these endpoints:
# - https://natan.florenceegi.com/health/liveness (every 1min)
# - https://natan.florenceegi.com/health/readiness (every 5min)
# - https://natan.florenceegi.com/api/v1/chat (synthetic query every 15min)

# Alert channels:
# - Email: fabio@florenceegi.com
# - SMS: +39 XXX XXXXXXX (critical only)
# - Slack: #natan-alerts
```

#### ✓ CHECKLIST VERIFICA MONITORING

```
☐ Laravel Telescope installato e configurato
☐ Sentry integrato per error tracking
☐ Custom metrics service implementato
☐ Prometheus metrics endpoint (/metrics)
☐ Health check endpoints (liveness + readiness)
☐ Alert rules configurate (Prometheus Alertmanager)
☐ External logging configurato (Papertrail/Loggly)
☐ Uptime monitoring configurato (UptimeRobot)
☐ Dashboards creati (Grafana)
☐ Alert channels configurati (Email, Slack, SMS)
☐ On-call rotation definita
☐ Runbooks aggiornati con alert response
☐ Performance baselines documentate
☐ SLO/SLA definiti (es: 99.9% uptime, p95 < 2s)
```

---

## 7️⃣ DATABASE EXCELLENCE (Advanced)

### ⚠️ IL PROBLEMA

**Database performance degrada con crescita dati:**
- Query lente con 1M+ records
- Index bloat dopo molti INSERT/DELETE
- Lock contention su tabelle hot
- **Backup lenti che bloccano applicazione**

### ✅ LA SOLUZIONE ENTERPRISE

**Advanced Indexing + Partitioning + Replication + Backup Strategy**

#### 🛠️ IMPLEMENTAZIONE PRATICA

##### **7.1 Index Optimization Strategy**

```sql
-- Analyze table to update statistics
ANALYZE TABLE conversations;
ANALYZE TABLE messages;
ANALYZE TABLE generated_apps;

-- Check index usage
SELECT 
    table_name,
    index_name,
    cardinality,
    index_type
FROM information_schema.statistics
WHERE table_schema = 'natan_db'
ORDER BY table_name, seq_in_index;

-- Find unused indexes
SELECT 
    s.table_name,
    s.index_name,
    s.cardinality
FROM information_schema.statistics s
LEFT JOIN information_schema.index_statistics i 
    ON s.table_name = i.table_name 
    AND s.index_name = i.index_name
WHERE s.table_schema = 'natan_db'
  AND i.index_name IS NULL
  AND s.index_name != 'PRIMARY';

-- Drop unused indexes (after verification)
-- ALTER TABLE conversations DROP INDEX idx_unused_field;
```

##### **7.2 Table Partitioning (for large tables)**

```sql
-- Partition messages table by month (time-series data)
ALTER TABLE messages 
PARTITION BY RANGE (YEAR(created_at) * 100 + MONTH(created_at)) (
    PARTITION p202411 VALUES LESS THAN (202412),
    PARTITION p202412 VALUES LESS THAN (202501),
    PARTITION p202501 VALUES LESS THAN (202502),
    PARTITION p202502 VALUES LESS THAN (202503),
    PARTITION p202503 VALUES LESS THAN (202504),
    PARTITION p_future VALUES LESS THAN MAXVALUE
);

-- Add new partition monthly (cron job)
ALTER TABLE messages ADD PARTITION (
    PARTITION p202504 VALUES LESS THAN (202505)
);

-- Archive old partitions
ALTER TABLE messages DROP PARTITION p202411;
```

##### **7.3 Query Optimization with EXPLAIN**

```php
// app/Console/Commands/OptimizeQueries.php
<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class OptimizeQueries extends Command
{
    protected $signature = 'db:optimize-queries';
    protected $description = 'Analyze slow queries and suggest optimizations';
    
    public function handle(): void
    {
        $this->info('Analyzing slow queries...');
        
        // Get slow queries from log
        $slowQueries = $this->getSlowQueries();
        
        foreach ($slowQueries as $query) {
            $this->info("\nQuery: {$query['sql']}");
            $this->info("Execution time: {$query['time']}ms");
            
            // Run EXPLAIN
            $explain = DB::select("EXPLAIN {$query['sql']}");
            
            $this->table(
                ['id', 'select_type', 'table', 'type', 'possible_keys', 'key', 'rows', 'Extra'],
                $explain
            );
            
            // Suggest optimizations
            $this->suggestOptimizations($explain);
        }
    }
    
    private function getSlowQueries(): array
    {
        // Parse Laravel query log or MySQL slow query log
        return DB::select("
            SELECT 
                query_time,
                sql_text
            FROM mysql.slow_log
            WHERE query_time > 1
            ORDER BY query_time DESC
            LIMIT 10
        ");
    }
    
    private function suggestOptimizations(array $explain): void
    {
        foreach ($explain as $row) {
            if ($row->type === 'ALL') {
                $this->warn("⚠️ Full table scan on {$row->table}! Consider adding index.");
            }
            
            if ($row->rows > 10000) {
                $this->warn("⚠️ Scanning {$row->rows} rows! Consider adding WHERE clause or index.");
            }
            
            if (str_contains($row->Extra, 'Using filesort')) {
                $this->warn("⚠️ Using filesort on {$row->table}! Consider adding index for ORDER BY.");
            }
            
            if (str_contains($row->Extra, 'Using temporary')) {
                $this->warn("⚠️ Using temporary table! Consider optimizing GROUP BY or DISTINCT.");
            }
        }
    }
}
```

##### **7.4 Database Replication (Read Replicas)**

```php
// config/database.php
'mysql' => [
    'read' => [
        'host' => [
            env('DB_READ_HOST_1', '127.0.0.1'),
            env('DB_READ_HOST_2', '127.0.0.1'),
        ],
    ],
    'write' => [
        'host' => env('DB_WRITE_HOST', '127.0.0.1'),
    ],
    'sticky' => true, // Ensure writes are visible on subsequent reads
    'driver' => 'mysql',
    'database' => env('DB_DATABASE', 'natan_db'),
    'username' => env('DB_USERNAME', 'root'),
    'password' => env('DB_PASSWORD', ''),
    'charset' => 'utf8mb4',
    'collation' => 'utf8mb4_unicode_ci',
    'prefix' => '',
    'strict' => true,
    'engine' => 'InnoDB',
];

// Usage: Force read from replica
$conversations = DB::connection('mysql')->table('conversations')
    ->where('user_id', $userId)
    ->get();

// Usage: Force write to master
DB::connection('mysql')->table('conversations')->insert([
    'user_id' => $userId,
    'title' => 'New chat',
]);
```

##### **7.5 Backup Strategy**

```bash
#!/bin/bash
# scripts/backup-database.sh

# Configuration
DB_HOST="${DB_HOST:-localhost}"
DB_USER="${DB_USERNAME:-root}"
DB_PASS="${DB_PASSWORD}"
DB_NAME="${DB_DATABASE:-natan_db}"
BACKUP_DIR="/backups/mysql"
RETENTION_DAYS=30

# Create backup directory
mkdir -p $BACKUP_DIR

# Timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.sql.gz"

# Backup with mysqldump (compressed)
mysqldump \
    --host=$DB_HOST \
    --user=$DB_USER \
    --password=$DB_PASS \
    --single-transaction \
    --quick \
    --lock-tables=false \
    --routines \
    --triggers \
    --events \
    $DB_NAME | gzip > $BACKUP_FILE

# Check if backup succeeded
if [ $? -eq 0 ]; then
    echo "Backup completed: $BACKUP_FILE"
    
    # Upload to S3 (optional)
    aws s3 cp $BACKUP_FILE s3://natan-backups/mysql/
    
    # Remove old backups
    find $BACKUP_DIR -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete
else
    echo "Backup failed!"
    exit 1
fi
```

```bash
# Crontab entry (daily backup at 3 AM)
0 3 * * * /path/to/scripts/backup-database.sh >> /var/log/backup.log 2>&1
```

##### **7.6 Database Maintenance Tasks**

```php
// app/Console/Commands/DatabaseMaintenance.php
<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class DatabaseMaintenance extends Command
{
    protected $signature = 'db:maintenance {--optimize} {--vacuum} {--analyze}';
    protected $description = 'Perform database maintenance tasks';
    
    public function handle(): void
    {
        if ($this->option('optimize')) {
            $this->optimizeTables();
        }
        
        if ($this->option('vacuum')) {
            $this->vacuumTables();
        }
        
        if ($this->option('analyze')) {
            $this->analyzeTables();
        }
        
        $this->info('Database maintenance completed!');
    }
    
    private function optimizeTables(): void
    {
        $this->info('Optimizing tables...');
        
        $tables = ['conversations', 'messages', 'generated_apps', 'tenant_groups'];
        
        foreach ($tables as $table) {
            $this->info("Optimizing {$table}...");
            DB::statement("OPTIMIZE TABLE {$table}");
        }
    }
    
    private function vacuumTables(): void
    {
        $this->info('Vacuuming deleted records...');
        
        // Clean soft-deleted records older than 90 days
        DB::table('conversations')
            ->whereNotNull('deleted_at')
            ->where('deleted_at', '<', now()->subDays(90))
            ->delete();
    }
    
    private function analyzeTables(): void
    {
        $this->info('Analyzing tables to update statistics...');
        
        $tables = ['conversations', 'messages', 'generated_apps'];
        
        foreach ($tables as $table) {
            DB::statement("ANALYZE TABLE {$table}");
        }
    }
}

// Schedule in app/Console/Kernel.php
protected function schedule(Schedule $schedule): void
{
    // Run maintenance weekly (Sunday 4 AM)
    $schedule->command('db:maintenance --optimize --analyze')
        ->weekly()
        ->sundays()
        ->at('04:00');
    
    // Vacuum monthly
    $schedule->command('db:maintenance --vacuum')
        ->monthly();
}
```

##### **7.7 Connection Pooling (PgBouncer for PostgreSQL, ProxySQL for MySQL)**

```yaml
# docker-compose.yml (ProxySQL for MySQL)
proxysql:
  image: proxysql/proxysql:latest
  ports:
    - "6033:6033"  # ProxySQL port
  volumes:
    - ./docker/proxysql/proxysql.cnf:/etc/proxysql.cnf
  environment:
    - PROXYSQL_ADMIN_USER=admin
    - PROXYSQL_ADMIN_PASSWORD=admin
  networks:
    - natan_network
```

```ini
# docker/proxysql/proxysql.cnf
datadir="/var/lib/proxysql"

admin_variables=
{
    admin_credentials="admin:admin"
    mysql_ifaces="0.0.0.0:6032"
}

mysql_variables=
{
    threads=4
    max_connections=2048
    default_query_delay=0
    default_query_timeout=36000000
    have_compress=true
    poll_timeout=2000
    interfaces="0.0.0.0:6033"
    default_schema="natan_db"
    stacksize=1048576
    server_version="8.0.0"
    connect_timeout_server=3000
    monitor_username="monitor"
    monitor_password="monitor"
    monitor_history=600000
    monitor_connect_interval=60000
    monitor_ping_interval=10000
    ping_interval_server_msec=120000
    commands_stats=true
    sessions_sort=true
    connect_retries_on_failure=10
}

mysql_servers=
(
    {
        address="mysql_master"
        port=3306
        hostgroup=0  # Write group
        max_connections=100
    },
    {
        address="mysql_replica_1"
        port=3306
        hostgroup=1  # Read group
        max_connections=100
    }
)

mysql_query_rules=
(
    {
        rule_id=1
        active=1
        match_pattern="^SELECT .* FOR UPDATE$"
        destination_hostgroup=0  # Write to master
        apply=1
    },
    {
        rule_id=2
        active=1
        match_pattern="^SELECT"
        destination_hostgroup=1  # Read from replica
        apply=1
    }
)
```

#### ✓ CHECKLIST VERIFICA DATABASE

```
☐ All tables analyzed (ANALYZE TABLE)
☐ Unused indexes identified and removed
☐ Composite indexes created for common queries
☐ Table partitioning implemented for large tables (>10M rows)
☐ Slow query log analyzed (EXPLAIN on slow queries)
☐ Read replicas configured (if applicable)
☐ Sticky sessions enabled for write-after-read consistency
☐ Daily backups configured and tested
☐ Backup retention policy defined (30 days)
☐ Backup uploaded to S3/cloud storage
☐ Restore procedure tested (dry run)
☐ Database maintenance scheduled (weekly OPTIMIZE, monthly VACUUM)
☐ Connection pooling configured (ProxySQL/PgBouncer)
☐ Database monitoring enabled (slow queries, deadlocks, replication lag)
☐ Disk space monitoring (alert at 80%)
```

---

## 8️⃣ CODE QUALITY EXCELLENCE

### ⚠️ IL PROBLEMA

**Codice senza standard = technical debt exponential growth:**
- Ogni developer scrive stile diverso
- Code review inconsistent
- Bug nascosti da type errors
- **Refactoring diventa nightmare**

### ✅ LA SOLUZIONE ENTERPRISE

**Static Analysis + Code Style + Pre-commit Hooks + CI/CD**

#### 🛠️ IMPLEMENTAZIONE PRATICA

##### **8.1 PHP Static Analysis (PHPStan Level 9)**

```bash
# Install PHPStan
composer require --dev phpstan/phpstan

# Install Laravel extension
composer require --dev phpstan/phpstan-laravel
```

```neon
# phpstan.neon
includes:
    - vendor/phpstan/phpstan-laravel/extension.neon

parameters:
    level: 9  # Maximum strictness
    paths:
        - app
        - tests
    
    excludePaths:
        - app/Console/Kernel.php
        - app/Exceptions/Handler.php
    
    checkMissingIterableValueType: true
    checkGenericClassInNonGenericObjectType: true
    reportUnmatchedIgnoredErrors: true
    
    ignoreErrors:
        # Allow dynamic properties for Eloquent models
        - '#Access to an undefined property [a-zA-Z0-9\\_]+::\$[a-zA-Z0-9_]+#'
```

```bash
# Run PHPStan
vendor/bin/phpstan analyse --memory-limit=2G

# Expected output: No errors (Level 9)
```

##### **8.2 Code Style (PHP CS Fixer)**

```bash
# Install PHP CS Fixer
composer require --dev friendsofphp/php-cs-fixer
```

```php
// .php-cs-fixer.php
<?php

return (new PhpCsFixer\Config())
    ->setRules([
        '@PSR12' => true,
        '@PHP81Migration' => true,
        
        // Array syntax
        'array_syntax' => ['syntax' => 'short'],
        'no_multiline_whitespace_around_double_arrow' => true,
        'trim_array_spaces' => true,
        
        // Imports
        'ordered_imports' => ['sort_algorithm' => 'alpha'],
        'no_unused_imports' => true,
        'global_namespace_import' => [
            'import_classes' => true,
            'import_constants' => true,
            'import_functions' => true,
        ],
        
        // Strict types
        'declare_strict_types' => true,
        'strict_param' => true,
        'strict_comparison' => true,
        
        // Spacing
        'blank_line_after_namespace' => true,
        'blank_line_after_opening_tag' => true,
        'no_blank_lines_after_phpdoc' => true,
        
        // PHPDoc
        'phpdoc_align' => ['align' => 'vertical'],
        'phpdoc_indent' => true,
        'phpdoc_no_empty_return' => true,
        'phpdoc_order' => true,
        'phpdoc_scalar' => true,
        'phpdoc_types' => true,
        'phpdoc_types_order' => ['null_adjustment' => 'always_last'],
        
        // Return
        'return_type_declaration' => ['space_before' => 'none'],
        'simplified_null_return' => true,
        
        // Visibility
        'visibility_required' => ['elements' => ['property', 'method', 'const']],
    ])
    ->setFinder(
        PhpCsFixer\Finder::create()
            ->in(__DIR__)
            ->exclude(['vendor', 'storage', 'node_modules'])
            ->name('*.php')
            ->notName('*.blade.php')
            ->ignoreDotFiles(true)
            ->ignoreVCS(true)
    );
```

```bash
# Run PHP CS Fixer
vendor/bin/php-cs-fixer fix --dry-run --diff  # Preview changes
vendor/bin/php-cs-fixer fix                    # Apply fixes
```

##### **8.3 Pre-commit Hooks (Husky equivalent for PHP)**

```bash
# Install GrumPHP
composer require --dev phpro/grumphp
```

```yaml
# grumphp.yml
grumphp:
    tasks:
        phpstan:
            configuration: phpstan.neon
            memory_limit: 2G
        
        phpcsfixer:
            config: .php-cs-fixer.php
            allow_risky: true
        
        phpunit:
            testsuite: Unit
            always_execute: false
        
        git_commit_message:
            matchers:
                - '/^\[(FEAT|FIX|REFACTOR|DOC|TEST|CHORE)\] .{10,}/'
            case_insensitive: false
        
        phpversion:
            project: '8.1'
        
        jsonlint:
            detect_key_conflicts: true
        
        yamllint:
            parse_constant: true
    
    stop_on_failure: true
```

##### **8.4 CI/CD Pipeline (GitHub Actions)**

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  tests:
    name: Tests (PHP ${{ matrix.php }})
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        php: ['8.1', '8.2']
    
    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: password
          MYSQL_DATABASE: natan_test
        options: >-
          --health-cmd="mysqladmin ping"
          --health-interval=10s
          --health-timeout=5s
          --health-retries=3
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: ${{ matrix.php }}
          extensions: mbstring, dom, pdo, mysql, redis
          coverage: pcov
      
      - name: Install Composer dependencies
        run: composer install --prefer-dist --no-progress
      
      - name: Copy .env
        run: cp .env.ci .env
      
      - name: Generate application key
        run: php artisan key:generate
      
      - name: Run migrations
        run: php artisan migrate --force
      
      - name: Run PHPStan
        run: vendor/bin/phpstan analyse --memory-limit=2G
      
      - name: Run PHP CS Fixer (check)
        run: vendor/bin/php-cs-fixer fix --dry-run --diff
      
      - name: Run PHPUnit
        run: vendor/bin/phpunit --coverage-clover coverage.xml
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage.xml
          fail_ci_if_error: true

  security:
    name: Security Check
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: '8.1'
      
      - name: Install dependencies
        run: composer install --prefer-dist
      
      - name: Security check (composer audit)
        run: composer audit
      
      - name: Security check (local-php-security-checker)
        uses: symfonycorp/security-checker-action@v4
```

##### **8.5 Code Coverage Requirements**

```xml
<!-- phpunit.xml -->
<coverage processUncoveredFiles="true"
          cacheDirectory="build/phpunit/code-coverage">
    <include>
        <directory suffix=".php">app</directory>
    </include>
    
    <report>
        <html outputDirectory="build/coverage"/>
        <clover outputFile="build/logs/clover.xml"/>
    </report>
</coverage>

<!-- Enforce minimum coverage -->
<coverage>
    <report>
        <clover outputFile="clover.xml"/>
    </report>
</coverage>

<!-- Add to CI -->
<coverage>
    <report>
        <text outputFile="php://stdout" showUncoveredFiles="false"/>
    </report>
</coverage>
```

```bash
# Check coverage threshold
vendor/bin/phpunit --coverage-text --coverage-clover=coverage.xml

# Fail if coverage < 80%
if [ $(grep -oP 'lines="[^"]*"' coverage.xml | grep -oP '\d+' | awk 'NR==1{t=$1} NR==2{print int($1/t*100)}') -lt 80 ]; then
    echo "Code coverage is below 80%!"
    exit 1
fi
```

##### **8.6 Documentation Generation (phpDocumentor)**

```bash
# Install phpDocumentor
composer require --dev phpdocumentor/phpdocumentor
```

```xml
<!-- phpdoc.xml -->
<?xml version="1.0" encoding="UTF-8" ?>
<phpdocumentor>
    <title>NATAN_LOC API Documentation</title>
    <parser>
        <target>build/api-cache</target>
    </parser>
    <transformer>
        <target>build/api-docs</target>
    </transformer>
    <files>
        <directory>app</directory>
        <ignore>app/Console/</ignore>
        <ignore>app/Exceptions/Handler.php</ignore>
    </files>
</phpdocumentor>
```

```bash
# Generate docs
vendor/bin/phpdoc run

# Output: build/api-docs/index.html
```

##### **8.7 Type Coverage (Psalm)**

```bash
# Install Psalm
composer require --dev vimeo/psalm

# Initialize
vendor/bin/psalm --init
```

```xml
<!-- psalm.xml -->
<?xml version="1.0"?>
<psalm
    errorLevel="3"
    resolveFromConfigFile="true"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xmlns="https://getpsalm.org/schema/config"
    xsi:schemaLocation="https://getpsalm.org/schema/config vendor/vimeo/psalm/config.xsd"
    findUnusedBaselineEntry="true"
    findUnusedCode="true"
>
    <projectFiles>
        <directory name="app"/>
        <ignoreFiles>
            <directory name="vendor"/>
        </ignoreFiles>
    </projectFiles>
    
    <plugins>
        <pluginClass class="Psalm\LaravelPlugin\Plugin"/>
    </plugins>
    
    <issueHandlers>
        <MissingReturnType errorLevel="error"/>
        <MissingParamType errorLevel="error"/>
        <InvalidReturnType errorLevel="error"/>
        <InvalidArgument errorLevel="error"/>
    </issueHandlers>
</psalm>
```

```bash
# Run Psalm
vendor/bin/psalm

# Generate baseline (for legacy code)
vendor/bin/psalm --set-baseline=psalm-baseline.xml
```

#### ✓ CHECKLIST VERIFICA CODE QUALITY

```
☐ PHPStan Level 9 passing (0 errors)
☐ PHP CS Fixer configured with strict rules
☐ GrumPHP pre-commit hooks active
☐ CI/CD pipeline configured (GitHub Actions)
☐ All tests passing in CI
☐ Code coverage > 80%
☐ Security audit passing (composer audit)
☐ No known vulnerabilities (security-checker)
☐ PHPDoc coverage > 90%
☐ API documentation generated (phpDocumentor)
☐ Psalm type coverage > 95%
☐ Commit message format enforced ([FEAT], [FIX], etc.)
☐ Branch protection rules enabled (require PR + CI pass)
☐ Code review required before merge
☐ Automated changelog generation
```

---

## 🎯 IMPLEMENTAZIONE PRIORITARIA

**Ordine consigliato di implementazione:**

### **FASE 1: Foundation (Settimana 1)**
1. ✅ Logging Excellence → QueryLogger, structured logs, correlation ID
2. ✅ Database Excellence → Indexes, constraints, optimization
3. ✅ Performance Excellence → Redis cache, query optimization

### **FASE 2: Security (Settimana 2)**
4. 🔒 Security Excellence → HtmlSanitizer, CSP, sandbox
5. 🧪 Testing Excellence → Unit tests, feature tests

### **FASE 3: Production Ready (Settimana 3)**
6. 📊 Monitoring Excellence → Performance monitor, alerting
7. 📚 Documentation Excellence → ADR, API docs, runbooks

---

## ✓ MASTER CHECKLIST

```
LOGGING & DEBUGGING
☐ Correlation ID implementato
☐ Structured logging configurato
☐ Query tracing attivo

SECURITY
☐ HTML/JS sanitization implementata
☐ CSP configurato
☐ Sandbox iframe serving

PERFORMANCE
☐ Redis cache operativo
☐ Database indexes ottimizzati
☐ Query pagination implementata

TESTING
☐ Unit tests (>80% coverage)
☐ Feature tests per API principali
☐ Load testing eseguito

DOCUMENTATION
☐ ADR scritti (>5)
☐ API docs pubblicati
☐ Runbooks creati

MONITORING
☐ Performance monitoring attivo
☐ Slow query logging
☐ Error tracking con Sentry
```

---

**Questo documento è la tua roadmap verso la ULTRA ECCELLENZA ENTERPRISE.**

**Ogni sezione è implementabile, testabile, verificabile.**

**Procediamo passo dopo passo. Prima implementiamo, poi testiamo, poi documentiamo.**

**🚀 Ready to achieve Ultra Excellence?**

