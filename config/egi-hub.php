<?php

declare(strict_types=1);

/**
 * Configurazione FlorenceEGI Hub
 * 
 * Configurazioni condivise tra tutti i progetti EGI.
 * I modelli possono essere sovrascritti dall'applicazione host.
 * 
 * @package FlorenceEgi\Hub
 * @author Fabio Cherici
 * @version 1.1.0
 * @date 2025-12-01
 */

return [
    /*
    |--------------------------------------------------------------------------
    | Aggregation Settings
    |--------------------------------------------------------------------------
    |
    | Configurazioni per il sistema di aggregazioni tra tenant
    |
    */
    'aggregations' => [
        // Numero massimo di tenant in un'aggregazione
        'max_members' => env('EGI_AGGREGATION_MAX_MEMBERS', 50),

        // Giorni prima che un invito scada
        'invitation_expiry_days' => env('EGI_INVITATION_EXPIRY_DAYS', 30),

        // Permetti a qualsiasi membro di invitare altri
        'members_can_invite' => env('EGI_MEMBERS_CAN_INVITE', true),
    ],

    /*
    |--------------------------------------------------------------------------
    | Tenant Settings
    |--------------------------------------------------------------------------
    |
    | Configurazioni relative ai tenant
    |
    */
    'tenants' => [
        // Tabella dei tenant (può variare tra progetti)
        'table' => env('EGI_TENANTS_TABLE', 'tenants'),

        // Modello Tenant (override se necessario)
        'model' => env('EGI_TENANT_MODEL', \FlorenceEgi\Hub\Models\BaseTenant::class),
    ],

    /*
    |--------------------------------------------------------------------------
    | Model Mappings
    |--------------------------------------------------------------------------
    |
    | Mappa i modelli EGI-HUB ai modelli dell'applicazione host.
    | Questi vengono usati dai controller API per interrogare i dati reali.
    |
    */
    'models' => [
        // Core EGI models
        'egi' => env('EGI_MODEL_EGI', 'App\\Models\\Egi'),
        'egi_trait' => env('EGI_MODEL_EGI_TRAIT', 'App\\Models\\EgiTrait'),
        
        // AI models
        'ai_trait_generation' => env('EGI_MODEL_AI_TRAIT', 'App\\Models\\AiTraitGeneration'),
        'ai_feature' => env('EGI_MODEL_AI_FEATURE', 'App\\Models\\AiFeature'),
        
        // Tokenomics models
        'egili_transaction' => env('EGI_MODEL_EGILI_TX', 'App\\Models\\EgiliTransaction'),
        'equilibrium_entry' => env('EGI_MODEL_EQUILIBRIUM', 'App\\Models\\EquilibriumEntry'),
        
        // Platform models
        'feature_pricing' => env('EGI_MODEL_PRICING', 'App\\Models\\FeaturePricing'),
        'promotion' => env('EGI_MODEL_PROMOTION', 'App\\Models\\Promotion'),
        'featured_egi' => env('EGI_MODEL_FEATURED', 'App\\Models\\FeaturedEgi'),
        'consumption_ledger' => env('EGI_MODEL_LEDGER', 'App\\Models\\ConsumptionLedger'),
        
        // Padmin OS3 models
        'padmin_scan' => env('EGI_MODEL_PADMIN_SCAN', 'App\\Models\\PadminScan'),
        'padmin_violation' => env('EGI_MODEL_PADMIN_VIOLATION', 'App\\Models\\PadminViolation'),
        'padmin_symbol' => env('EGI_MODEL_PADMIN_SYMBOL', 'App\\Models\\PadminSymbol'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Featured EGI Settings
    |--------------------------------------------------------------------------
    */
    'featured' => [
        // Massimo EGI in evidenza per giorno
        'max_per_day' => env('EGI_FEATURED_MAX_PER_DAY', 5),
    ],

    /*
    |--------------------------------------------------------------------------
    | AI Features (Default Configuration)
    |--------------------------------------------------------------------------
    |
    | Configurazione di default delle feature AI se non salvate in database.
    |
    */
    'ai_features' => [
        [
            'name' => 'Trait Generation',
            'slug' => 'trait-generation',
            'description' => 'Generate AI-powered traits for EGI digital identities',
            'enabled' => true,
            'credits_cost' => 1,
            'model' => 'gpt-4',
            'max_tokens' => 2000,
        ],
        [
            'name' => 'Style Transfer',
            'slug' => 'style-transfer',
            'description' => 'Apply artistic styles to EGI visual representations',
            'enabled' => true,
            'credits_cost' => 2,
            'model' => 'dall-e-3',
            'max_tokens' => 1000,
        ],
        [
            'name' => 'N.A.T.A.N. Chat',
            'slug' => 'natan-chat',
            'description' => 'Interactive AI assistant powered by N.A.T.A.N.',
            'enabled' => true,
            'credits_cost' => 1,
            'model' => 'gpt-4-turbo',
            'max_tokens' => 4000,
        ],
    ],
];
