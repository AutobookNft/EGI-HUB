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
        'PROJECT_LIST_ERROR' => [
            'type' => 'error',
            'blocking' => 'semi-blocking',
            'dev_message_key' => 'error-manager::errors_2.dev.project_list_error',
            'user_message_key' => 'error-manager::errors_2.user.project_list_error',
            'http_status_code' => 500,
            'msg_to' => 'toast',
        ],
        'PROJECT_CREATION_ERROR' => [
            'type' => 'error',
            'blocking' => 'blocking',
            'dev_message_key' => 'error-manager::errors_2.dev.project_creation_error',
            'user_message_key' => 'error-manager::errors_2.user.project_creation_error',
            'http_status_code' => 500,
            'msg_to' => 'toast',
        ],
        'PROJECT_UPDATE_ERROR' => [
            'type' => 'error',
            'blocking' => 'blocking',
            'dev_message_key' => 'error-manager::errors_2.dev.project_update_error',
            'user_message_key' => 'error-manager::errors_2.user.project_update_error',
            'http_status_code' => 500,
            'msg_to' => 'toast',
        ],
        'TENANT_HEALTH_CHECK_FAILED' => [
            'type' => 'warning',
            'blocking' => 'not',
            'dev_message_key' => 'error-manager::errors_2.dev.tenant_health_check_failed',
            'user_message_key' => 'error-manager::errors_2.user.tenant_health_check_failed',
            'http_status_code' => 503,
            'msg_to' => 'slack',
        ],
        'TENANT_SYNC_FAILED' => [
            'type' => 'error',
            'blocking' => 'semi-blocking',
            'dev_message_key' => 'error-manager::errors_2.dev.tenant_sync_failed',
            'user_message_key' => 'error-manager::errors_2.user.tenant_sync_failed',
            'http_status_code' => 502,
            'msg_to' => 'toast',
        ],
        'TENANT_ACTION_ERROR' => [
            'type' => 'error',
            'blocking' => 'blocking',
            'dev_message_key' => 'error-manager::errors_2.dev.tenant_action_error',
            'user_message_key' => 'error-manager::errors_2.user.tenant_action_error',
            'http_status_code' => 500,
            'msg_to' => 'toast',
        ],
        'TENANT_ACTIVITY_LIST_ERROR' => [
            'type' => 'error',
            'blocking' => 'semi-blocking',
            'dev_message_key' => 'error-manager::errors_2.dev.tenant_activity_list_error',
            'user_message_key' => 'error-manager::errors_2.user.tenant_activity_list_error',
            'http_status_code' => 500,
            'msg_to' => 'toast',
        ],
        'TENANT_STATS_ERROR' => [
            'type' => 'error',
            'blocking' => 'semi-blocking',
            'dev_message_key' => 'error-manager::errors_2.dev.tenant_stats_error',
            'user_message_key' => 'error-manager::errors_2.user.tenant_stats_error',
            'http_status_code' => 500,
            'msg_to' => 'toast',
        ],
        'PROJECT_PROXY_ERROR' => [
            'type' => 'error',
            'blocking' => 'blocking',
            'dev_message_key' => 'error-manager::errors_2.dev.project_proxy_error',
            'user_message_key' => 'error-manager::errors_2.user.project_proxy_error',
            'http_status_code' => 502,
            'msg_to' => 'toast',
        ],
        'PROJECT_ACTIVITY_LIST_ERROR' => [
            'type' => 'error',
            'blocking' => 'semi-blocking',
            'dev_message_key' => 'error-manager::errors_2.dev.project_activity_list_error',
            'user_message_key' => 'error-manager::errors_2.user.project_activity_list_error',
            'http_status_code' => 500,
            'msg_to' => 'toast',
        ],
        'AUTH_LOGIN_ERROR' => [
            'type' => 'error',
            'blocking' => 'blocking',
            'dev_message_key' => 'error-manager::errors_2.dev.auth_login_error',
            'user_message_key' => 'error-manager::errors_2.user.auth_login_error',
            'http_status_code' => 500,
            'msg_to' => 'toast',
        ],
        'AUTH_REGISTER_ERROR' => [
            'type' => 'error',
            'blocking' => 'blocking',
            'dev_message_key' => 'error-manager::errors_2.dev.auth_register_error',
            'user_message_key' => 'error-manager::errors_2.user.auth_register_error',
            'http_status_code' => 500,
            'msg_to' => 'toast',
        ],
        'AUTH_PROFILE_ERROR' => [
            'type' => 'error',
            'blocking' => 'blocking',
            'dev_message_key' => 'error-manager::errors_2.dev.auth_profile_error',
            'user_message_key' => 'error-manager::errors_2.user.auth_profile_error',
            'http_status_code' => 500,
            'msg_to' => 'toast',
        ],
    ],
];
