<?php

declare(strict_types=1);

/**
 * EGI-HUB API Routes
 * 
 * API-only routes returning JSON responses.
 * Consumed by React frontend and external projects.
 * 
 * @package EGI-HUB
 * @author Fabio Cherici
 * @version 1.1.0
 * @date 2025-12-03
 * 
 * NOTA: "Projects" in EGI-HUB sono le applicazioni SaaS (NATAN_LOC, EGI, etc.)
 * mentre "Tenants" sono i clienti finali di ogni progetto.
 */

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AggregationController;
use App\Http\Controllers\Api\ProjectController;
use App\Http\Controllers\Api\ProjectProxyController;
use App\Http\Controllers\Api\ProjectActivityController;
use App\Http\Controllers\Api\ProjectAdminController;

// Legacy aliases (deprecated, use projects instead)
use App\Http\Controllers\Api\TenantController;
use App\Http\Controllers\Api\TenantProxyController;
use App\Http\Controllers\Api\TenantActivityController;

// Superadmin Controllers
use App\Http\Controllers\Api\Superadmin\DashboardController;
use App\Http\Controllers\Api\Superadmin\AiConsultationsController;
use App\Http\Controllers\Api\Superadmin\AiCreditsController;
use App\Http\Controllers\Api\Superadmin\AiFeaturesController;
use App\Http\Controllers\Api\Superadmin\AiStatisticsController;
use App\Http\Controllers\Api\Superadmin\EgiliController;
use App\Http\Controllers\Api\Superadmin\EquilibriumController;
use App\Http\Controllers\Api\Superadmin\RolesController;
use App\Http\Controllers\Api\Superadmin\FeaturePricingController;
use App\Http\Controllers\Api\Superadmin\PromotionsController;
use App\Http\Controllers\Api\Superadmin\FeaturedCalendarController;
use App\Http\Controllers\Api\Superadmin\ConsumptionLedgerController;
use App\Http\Controllers\Api\Superadmin\PadminDashboardController;
use App\Http\Controllers\Api\Superadmin\PadminViolationsController;
use App\Http\Controllers\Api\Superadmin\PadminSymbolsController;
use App\Http\Controllers\Api\Superadmin\PadminSearchController;
use App\Http\Controllers\Api\Superadmin\PadminStatisticsController;

/*
|--------------------------------------------------------------------------
| Authentication Routes (Public)
|--------------------------------------------------------------------------
*/
Route::prefix('auth')->name('auth.')->group(function () {
    Route::post('login', [AuthController::class, 'login'])->name('login');
    Route::post('register', [AuthController::class, 'register'])->name('register');
});

/*
|--------------------------------------------------------------------------
| Authenticated Routes
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {
    // Auth user routes
    Route::prefix('auth')->name('auth.')->group(function () {
        Route::post('logout', [AuthController::class, 'logout'])->name('logout');
        Route::get('me', [AuthController::class, 'me'])->name('me');
        Route::put('profile', [AuthController::class, 'updateProfile'])->name('profile');
    });
});

/*
|--------------------------------------------------------------------------
| Superadmin API Routes
|--------------------------------------------------------------------------
| All routes for the React SuperAdmin frontend.
| Prefix: /api/superadmin
*/
Route::prefix('superadmin')->name('superadmin.')->group(function () {
    
    // Dashboard
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('stats', [DashboardController::class, 'stats'])->name('stats');

    /*
    |--------------------------------------------------------------------------
    | AI Management
    |--------------------------------------------------------------------------
    */
    Route::prefix('ai')->name('ai.')->group(function () {
        // Consultations
        Route::get('consultations', [AiConsultationsController::class, 'index'])->name('consultations.index');
        Route::get('consultations/{id}', [AiConsultationsController::class, 'show'])->name('consultations.show');
        
        // Credits
        Route::get('credits', [AiCreditsController::class, 'index'])->name('credits.index');
        Route::post('credits', [AiCreditsController::class, 'store'])->name('credits.store');
        Route::post('credits/{userId}/reset', [AiCreditsController::class, 'reset'])->name('credits.reset');
        
        // Features
        Route::get('features', [AiFeaturesController::class, 'index'])->name('features.index');
        Route::post('features/{slug}/toggle', [AiFeaturesController::class, 'toggle'])->name('features.toggle');
        Route::put('features/{slug}', [AiFeaturesController::class, 'update'])->name('features.update');
        
        // Statistics
        Route::get('statistics', [AiStatisticsController::class, 'index'])->name('statistics');
    });

    /*
    |--------------------------------------------------------------------------
    | Tokenomics
    |--------------------------------------------------------------------------
    */
    Route::prefix('tokenomics')->name('tokenomics.')->group(function () {
        // Egili
        Route::get('egili', [EgiliController::class, 'index'])->name('egili.index');
        Route::post('egili/mint', [EgiliController::class, 'mint'])->name('egili.mint');
        Route::post('egili/burn', [EgiliController::class, 'burn'])->name('egili.burn');
        
        // Equilibrium
        Route::get('equilibrium', [EquilibriumController::class, 'index'])->name('equilibrium.index');
        Route::post('equilibrium/recalculate', [EquilibriumController::class, 'recalculate'])->name('equilibrium.recalculate');
    });

    /*
    |--------------------------------------------------------------------------
    | Platform Management
    |--------------------------------------------------------------------------
    */
    Route::prefix('platform')->name('platform.')->group(function () {
        // Roles
        Route::get('roles', [RolesController::class, 'index'])->name('roles.index');
        Route::post('roles', [RolesController::class, 'store'])->name('roles.store');
        Route::delete('roles/{id}', [RolesController::class, 'destroy'])->name('roles.destroy');
        
        // Feature Pricing
        Route::get('pricing', [FeaturePricingController::class, 'index'])->name('pricing.index');
        Route::put('pricing/{id}', [FeaturePricingController::class, 'update'])->name('pricing.update');
        
        // Promotions
        Route::get('promotions', [PromotionsController::class, 'index'])->name('promotions.index');
        Route::post('promotions', [PromotionsController::class, 'store'])->name('promotions.store');
        Route::put('promotions/{id}', [PromotionsController::class, 'update'])->name('promotions.update');
        Route::delete('promotions/{id}', [PromotionsController::class, 'destroy'])->name('promotions.destroy');
        
        // Featured Calendar
        Route::get('featured-calendar', [FeaturedCalendarController::class, 'index'])->name('featured-calendar.index');
        Route::post('featured-calendar', [FeaturedCalendarController::class, 'store'])->name('featured-calendar.store');
        Route::delete('featured-calendar/{id}', [FeaturedCalendarController::class, 'destroy'])->name('featured-calendar.destroy');
        
        // Consumption Ledger
        Route::get('consumption-ledger', [ConsumptionLedgerController::class, 'index'])->name('consumption-ledger.index');
        Route::get('consumption-ledger/export', [ConsumptionLedgerController::class, 'export'])->name('consumption-ledger.export');
    });

    /*
    |--------------------------------------------------------------------------
    | Padmin OS3
    |--------------------------------------------------------------------------
    */
    Route::prefix('padmin')->name('padmin.')->group(function () {
        // Dashboard
        Route::get('dashboard', [PadminDashboardController::class, 'index'])->name('dashboard');
        Route::post('scan', [PadminDashboardController::class, 'scan'])->name('scan');
        
        // Violations
        Route::get('violations', [PadminViolationsController::class, 'index'])->name('violations.index');
        Route::put('violations/{id}', [PadminViolationsController::class, 'update'])->name('violations.update');
        Route::post('violations/{id}/autofix', [PadminViolationsController::class, 'autofix'])->name('violations.autofix');
        
        // Symbols
        Route::get('symbols', [PadminSymbolsController::class, 'index'])->name('symbols.index');
        Route::get('symbols/{id}', [PadminSymbolsController::class, 'show'])->name('symbols.show');
        Route::post('symbols/analyze', [PadminSymbolsController::class, 'analyze'])->name('symbols.analyze');
        
        // Search
        Route::get('search', [PadminSearchController::class, 'index'])->name('search');
        
        // Statistics
        Route::get('statistics', [PadminStatisticsController::class, 'index'])->name('statistics');
    });
});

/*
|--------------------------------------------------------------------------
| Aggregations API
|--------------------------------------------------------------------------
*/
Route::prefix('aggregations')->name('aggregations.')->group(function () {
    Route::get('/', [AggregationController::class, 'index'])->name('index');
    Route::post('/', [AggregationController::class, 'store'])->name('store');
    Route::get('{aggregation}', [AggregationController::class, 'show'])->name('show');
    Route::put('{aggregation}', [AggregationController::class, 'update'])->name('update');
    Route::delete('{aggregation}', [AggregationController::class, 'destroy'])->name('destroy');
    
    // Members management
    Route::post('{aggregation}/invite', [AggregationController::class, 'invite'])->name('invite');
    Route::get('{aggregation}/members', [AggregationController::class, 'members'])->name('members');
});

/*
|--------------------------------------------------------------------------
| Projects Management API (NEW - Primary)
|--------------------------------------------------------------------------
| Routes for managing projects (SaaS applications) in the EGI-HUB ecosystem.
| Projects = NATAN_LOC, FlorenceArtEGI, etc.
| Only accessible by SuperAdmin.
*/
Route::prefix('projects')->name('projects.')->group(function () {
    // CRUD operations
    Route::get('/', [ProjectController::class, 'index'])->name('index');
    Route::post('/', [ProjectController::class, 'store'])->name('store');
    Route::get('stats', [ProjectController::class, 'stats'])->name('stats');
    Route::get('{project}', [ProjectController::class, 'show'])->name('show');
    Route::put('{project}', [ProjectController::class, 'update'])->name('update');
    Route::delete('{project}', [ProjectController::class, 'destroy'])->name('destroy');
    
    // Health checks
    Route::get('{project}/health', [ProjectController::class, 'healthCheck'])->name('health');
    Route::post('health-check-all', [ProjectController::class, 'healthCheckAll'])->name('health-all');
    
    // Service control (Start/Stop)
    Route::post('{project}/start', [ProjectController::class, 'start'])->name('start');
    Route::post('{project}/stop', [ProjectController::class, 'stop'])->name('stop');
    
    // Project activities
    Route::get('{project}/activities', [ProjectActivityController::class, 'forProject'])->name('activities');
    
    // Project Admins management
    Route::get('{slug}/admins', [ProjectAdminController::class, 'index'])->name('admins.index');
    Route::post('{slug}/admins', [ProjectAdminController::class, 'store'])->name('admins.store');
    Route::get('{slug}/admins/{adminId}', [ProjectAdminController::class, 'show'])->name('admins.show');
    Route::put('{slug}/admins/{adminId}', [ProjectAdminController::class, 'update'])->name('admins.update');
    Route::delete('{slug}/admins/{adminId}', [ProjectAdminController::class, 'destroy'])->name('admins.destroy');
    Route::post('{slug}/admins/{adminId}/suspend', [ProjectAdminController::class, 'suspend'])->name('admins.suspend');
    Route::post('{slug}/admins/{adminId}/reactivate', [ProjectAdminController::class, 'reactivate'])->name('admins.reactivate');
});

/*
|--------------------------------------------------------------------------
| My Projects API (User's accessible projects)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {
    Route::prefix('auth')->name('auth.')->group(function () {
        Route::post('logout', [AuthController::class, 'logout'])->name('logout');
        Route::get('me', [AuthController::class, 'me'])->name('me');
        Route::put('profile', [AuthController::class, 'updateProfile'])->name('profile');
    });

    /*
    |--------------------------------------------------------------------------
    | Privacy & GDPR
    |--------------------------------------------------------------------------
    */
    Route::prefix('privacy')->name('privacy.')->group(function () {
        Route::get('export', [App\Http\Controllers\Api\GdprController::class, 'export'])->name('export');
        Route::delete('forget-me', [App\Http\Controllers\Api\GdprController::class, 'destroy'])->name('destroy');
    });

    Route::prefix('consents')->name('consents.')->group(function () {
        Route::get('/', [App\Http\Controllers\Api\ConsentController::class, 'index'])->name('index');
        Route::post('/', [App\Http\Controllers\Api\ConsentController::class, 'update'])->name('update');
        Route::get('history', [App\Http\Controllers\Api\ConsentController::class, 'history'])->name('history');
    });

    /*
    |--------------------------------------------------------------------------
    | My Projects API (User's accessible projects)
    |--------------------------------------------------------------------------
    */
    Route::get('my-projects', [ProjectAdminController::class, 'myProjects'])->name('my-projects');
});

/*
|--------------------------------------------------------------------------
| Tenants Management API (LEGACY - Deprecated, use /projects instead)
|--------------------------------------------------------------------------
| Maintained for backward compatibility.
| Will be removed in future versions.
*/
Route::prefix('tenants')->name('tenants.')->group(function () {
    // CRUD operations
    Route::get('/', [TenantController::class, 'index'])->name('index');
    Route::post('/', [TenantController::class, 'store'])->name('store');
    Route::get('stats', [TenantController::class, 'stats'])->name('stats');
    Route::get('{tenant}', [TenantController::class, 'show'])->name('show');
    Route::put('{tenant}', [TenantController::class, 'update'])->name('update');
    Route::delete('{tenant}', [TenantController::class, 'destroy'])->name('destroy');
    
    // Health checks
    Route::get('{tenant}/health', [TenantController::class, 'healthCheck'])->name('health');
    Route::post('health-check-all', [TenantController::class, 'healthCheckAll'])->name('health-all');
    
    // Service control (Start/Stop)
    Route::post('{tenant}/start', [TenantController::class, 'start'])->name('start');
    Route::post('{tenant}/stop', [TenantController::class, 'stop'])->name('stop');
    
    // Tenant activities
    Route::get('{tenant}/activities', [TenantActivityController::class, 'forTenant'])->name('activities');
});

/*
|--------------------------------------------------------------------------
| Project Activities API
|--------------------------------------------------------------------------
| Routes for viewing and analyzing project activities.
*/
Route::prefix('activities')->name('activities.')->group(function () {
    Route::get('/', [ProjectActivityController::class, 'index'])->name('index');
    Route::get('stats', [ProjectActivityController::class, 'stats'])->name('stats');
    Route::get('recent', [ProjectActivityController::class, 'recent'])->name('recent');
    Route::get('timeline', [ProjectActivityController::class, 'timeline'])->name('timeline');
});

/*
|--------------------------------------------------------------------------
| Project Proxy API
|--------------------------------------------------------------------------
| Routes for proxying requests to project APIs.
| EGI-HUB acts as intermediary between frontend and project backends.
*/
Route::prefix('proxy')->name('proxy.')->group(function () {
    // Aggregate data from all projects
    Route::get('aggregate', [ProjectProxyController::class, 'aggregate'])->name('aggregate');
    
    // Proxy to specific project
    Route::get('{projectSlug}/{path?}', [ProjectProxyController::class, 'get'])
        ->where('path', '.*')
        ->name('get');
    Route::post('{projectSlug}/{path?}', [ProjectProxyController::class, 'post'])
        ->where('path', '.*')
        ->name('post');
    Route::put('{projectSlug}/{path?}', [ProjectProxyController::class, 'put'])
        ->where('path', '.*')
        ->name('put');
    Route::patch('{projectSlug}/{path?}', [ProjectProxyController::class, 'patch'])
        ->where('path', '.*')
        ->name('patch');
    Route::delete('{projectSlug}/{path?}', [ProjectProxyController::class, 'delete'])
        ->where('path', '.*')
        ->name('delete');
});
