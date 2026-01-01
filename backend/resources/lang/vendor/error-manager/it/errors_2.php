<?php

return [
    'dev' => [
        'consent_update_failed' => 'Failed to update user consent for user_id: :user_id. Database error: :error_message',
        'gdpr_data_export_failed' => 'Critical GDPR export failure for user_id: :user_id. Export format: :format. Error: :error_message',
        'generic_error' => 'An unexpected error occurred. context: :json_context',
        'project_list_error' => 'Failed to retrieve project list. Params: :query_params. Error: :exception_message',
        'project_creation_error' => 'Failed to create project with slug: :slug. Error: :exception_message',
        'project_update_error' => 'Failed to update project: :project_id. Error: :exception_message',
    ],
    'user' => [
        'consent_update_failed' => 'Non è stato possibile aggiornare le tue preferenze sui consensi. Riprova più tardi.',
        'gdpr_data_export_failed' => 'Si è verificato un errore durante l\'esportazione dei tuoi dati. Il nostro team è stato notificato.',
        'generic_error' => 'Si è verificato un errore imprevisto. Riprova più tardi.',
        'project_list_error' => 'Impossibile caricare la lista dei progetti.',
        'project_creation_error' => 'Impossibile creare il progetto. Verifica I dati.',
        'project_update_error' => 'Impossibile aggiornare il progetto.',
    ]
];
        'tenant_health_check_failed' => 'Health check failed for tenant :tenant. Error: :error',
        'tenant_sync_failed' => 'Sync failed for tenant :tenant. Error: :error',
