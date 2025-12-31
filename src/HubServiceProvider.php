<?php

declare(strict_types=1);

namespace FlorenceEgi\Hub;

use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

/**
 * Service Provider per FlorenceEGI Hub
 *
 * @package FlorenceEgi\Hub
 * @author Fabio Cherici
 * @version 1.1.0
 */
class HubServiceProvider extends ServiceProvider
{
    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Load migrations
        $this->loadMigrationsFrom(__DIR__ . '/../database/migrations');

        // Register API routes
        $this->registerApiRoutes();

        // Publish configuration files
        $this->publishes([
            __DIR__ . '/../config/egi-hub.php' => config_path('egi-hub.php'),
            __DIR__ . '/../config/superadmin.php' => config_path('superadmin.php'),
        ], 'egi-hub-config');

        // Publish migrations
        $this->publishes([
            __DIR__ . '/../database/migrations' => database_path('migrations'),
        ], 'egi-hub-migrations');
    }

    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Merge core configuration
        $this->mergeConfigFrom(
            __DIR__ . '/../config/egi-hub.php',
            'egi-hub'
        );

        // Merge superadmin configuration
        $this->mergeConfigFrom(
            __DIR__ . '/../config/superadmin.php',
            'superadmin'
        );
    }

    /**
     * Register API routes.
     */
    protected function registerApiRoutes(): void
    {
        // Load routes from api.php
        // We apply 'api' prefix and middleware here
        Route::group([
            'prefix' => 'api',
            'middleware' => ['api'],
            'as' => 'api.',
        ], function () {
            $this->loadRoutesFrom(__DIR__ . '/../routes/api.php');
        });
    }
}
