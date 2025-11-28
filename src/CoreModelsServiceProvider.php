<?php

declare(strict_types=1);

namespace FlorenceEgi\CoreModels;

use Illuminate\Support\ServiceProvider;

/**
 * Service Provider per FlorenceEGI Core Models
 * 
 * Registra automaticamente le migrazioni condivise in tutti i progetti
 * che utilizzano questo package (NATAN_LOC, EGI, FlorenceArtEgi, etc.)
 * 
 * @package FlorenceEgi\CoreModels
 * @author Fabio Cherici
 * @version 1.0.0
 * @date 2025-11-28
 */
class CoreModelsServiceProvider extends ServiceProvider
{
    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Pubblica le migrazioni
        $this->loadMigrationsFrom(__DIR__ . '/../database/migrations');
        
        // Pubblica la configurazione
        $this->publishes([
            __DIR__ . '/../config/egi-core.php' => config_path('egi-core.php'),
        ], 'egi-core-config');
        
        // Pubblica le migrazioni (opzionale, per customizzazione)
        $this->publishes([
            __DIR__ . '/../database/migrations' => database_path('migrations'),
        ], 'egi-core-migrations');
    }

    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->mergeConfigFrom(
            __DIR__ . '/../config/egi-core.php',
            'egi-core'
        );
    }
}
