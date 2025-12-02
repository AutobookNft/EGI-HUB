<?php

declare(strict_types=1);

/**
 * Superadmin Module Configuration
 * 
 * Centralised superadmin settings for all EGI ecosystem projects.
 * Each project can override these values via environment variables.
 * 
 * @package FlorenceEgi\Hub
 * @author Fabio Cherici
 * @version 1.0.0
 * @date 2025-12-01
 */

return [
    /*
    |--------------------------------------------------------------------------
    | Route Settings
    |--------------------------------------------------------------------------
    |
    | Configure how superadmin routes are registered.
    |
    */
    'routes' => [
        // Enable/disable superadmin routes (useful for consumer projects that don't need them)
        'enabled' => env('EGI_SUPERADMIN_ROUTES_ENABLED', true),

        // Route prefix (e.g., /api/superadmin/dashboard)
        'prefix' => env('EGI_SUPERADMIN_PREFIX', 'superadmin'),

        // Middleware stack applied to all superadmin routes (API-only)
        'middleware' => ['api', 'auth:sanctum'],

        // Route name prefix (e.g., api.superadmin.dashboard)
        'as' => 'api.superadmin.',
    ],

    /*
    |--------------------------------------------------------------------------
    | Feature Flags
    |--------------------------------------------------------------------------
    |
    | Toggle individual superadmin modules. Projects can disable modules
    | they don't need via environment variables.
    |
    */
    'features' => [
        // Dashboard module
        'dashboard' => env('EGI_SUPERADMIN_DASHBOARD', true),

        // AI Management (consultations, credits, features, statistics)
        'ai_management' => env('EGI_SUPERADMIN_AI_MANAGEMENT', true),

        // Padmin OS3 Analyzer
        'padmin_analyzer' => env('EGI_SUPERADMIN_PADMIN_ANALYZER', true),

        // NATAN AI Configuration
        'natan_config' => env('EGI_SUPERADMIN_NATAN_CONFIG', true),

        // Tokenomics (Egili, Equilibrium)
        'tokenomics' => env('EGI_SUPERADMIN_TOKENOMICS', true),

        // Platform Management (roles, permissions, pricing)
        'platform_management' => env('EGI_SUPERADMIN_PLATFORM_MANAGEMENT', true),

        // Migration Orchestrator
        'migration_orchestrator' => env('EGI_SUPERADMIN_MIGRATION_ORCHESTRATOR', true),
    ],

    /*
    |--------------------------------------------------------------------------
    | View Settings
    |--------------------------------------------------------------------------
    |
    | Configure view rendering options.
    |
    */
    'views' => [
        // Layout to extend (can be overridden per project)
        'layout' => env('EGI_SUPERADMIN_LAYOUT', 'egi-hub::layouts.superadmin'),

        // Namespace for views
        'namespace' => 'egi-hub',
    ],

    /*
    |--------------------------------------------------------------------------
    | Access Control
    |--------------------------------------------------------------------------
    |
    | Configure who can access superadmin features.
    |
    */
    'access' => [
        // Minimum role required (can be overridden via Gate/Policy)
        'role' => env('EGI_SUPERADMIN_ROLE', 'superadmin'),

        // Guard to use for authentication
        'guard' => env('EGI_SUPERADMIN_GUARD', 'web'),

        // IP whitelist (empty = allow all)
        'ip_whitelist' => array_filter(explode(',', env('EGI_SUPERADMIN_IP_WHITELIST', ''))),
    ],
];
