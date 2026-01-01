<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Ultra Error Manager Configuration
    |--------------------------------------------------------------------------
    |
    | This configuration file defines the error codes, types, and handling
    | strategies for the Ultra Error Manager (UEM).
    |
    | P0-5 RULE: UEM-FIRST. Do not replace with generic logging.
    |
    */

    'defaults' => [
        'base_error_code' => 'GENERIC_ERROR',
        'log_channel' => 'error_manager',
    ],

    /*
    |--------------------------------------------------------------------------
    | Error Codes Definition
    |--------------------------------------------------------------------------
    */
    'errors' => [
        'GENERIC_ERROR' => [
            'type' => 'error',
            'blocking' => 'blocking',
            'dev_message_key' => 'error-manager::errors.dev.generic_error',
            'user_message_key' => 'error-manager::errors.user.generic_error',
            'http_status_code' => 500,
            'msg_to' => 'toast', 
        ],
        'CONSENT_UPDATE_FAILED' => [
            'type' => 'error',
            'blocking' => 'semi-blocking',
            'dev_message_key' => 'error-manager::errors.dev.consent_update_failed',
            'user_message_key' => 'error-manager::errors.user.consent_update_failed',
            'http_status_code' => 500,
            'msg_to' => 'toast',
        ],
        'GDPR_DATA_EXPORT_FAILED' => [
            'type' => 'critical',
            'blocking' => 'blocking',
            'dev_message_key' => 'error-manager::errors.dev.gdpr_data_export_failed',
            'user_message_key' => 'error-manager::errors.user.gdpr_data_export_failed',
            'http_status_code' => 500,
            'msg_to' => 'multiple',
        ],
        'DB_CONNECTION_ERROR' => [
            'type' => 'critical',
            'blocking' => 'blocking',
            'dev_message_key' => 'error-manager::errors.dev.db_connection_error',
            'user_message_key' => 'error-manager::errors.user.service_unavailable',
            'http_status_code' => 503,
            'msg_to' => 'slack',
        ],
    ],
];
