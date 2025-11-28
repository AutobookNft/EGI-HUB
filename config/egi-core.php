<?php

declare(strict_types=1);

/**
 * Configurazione FlorenceEGI Core Models
 * 
 * Configurazioni condivise tra tutti i progetti EGI
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
        'model' => env('EGI_TENANT_MODEL', \FlorenceEgi\CoreModels\Models\BaseTenant::class),
    ],
];
