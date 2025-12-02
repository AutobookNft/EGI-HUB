<?php


declare(strict_types=1);declare(strict_types=1);



/**namespace FlorenceEgi\Hub;

 * EGI-HUB API Routes

 * use Illuminate\Support\Facades\Route;

 * API-only routes returning JSON responses.use Illuminate\Support\ServiceProvider;

 * Consumed by React frontend and external projects.

 * /**

 * @package FlorenceEgi\Hub * Service Provider per FlorenceEGI Hub

 * @author Fabio Cherici * 

 * @version 1.0.0 * EGI-HUB è un API-only backend. Il frontend è una SPA React separata.

 * @date 2025-12-01 * NON registra views Blade - solo routes API, migrazioni e configurazioni.

 */ * 

 * @package FlorenceEgi\Hub

use Illuminate\Support\Facades\Route; * @author Fabio Cherici

use FlorenceEgi\Hub\Http\Controllers\Api\Superadmin\DashboardController; * @version 1.1.0

use FlorenceEgi\Hub\Http\Controllers\Api\AggregationController; * @date 2025-12-01

 */

/*class HubServiceProvider extends ServiceProvider

|--------------------------------------------------------------------------{

| Superadmin Dashboard    /**

|--------------------------------------------------------------------------     * Bootstrap any application services.

*/     */

if (config('superadmin.features.dashboard', true)) {    public function boot(): void

    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');    {

    Route::get('stats', [DashboardController::class, 'stats'])->name('stats');        // Load migrations

}        $this->loadMigrationsFrom(__DIR__ . '/../database/migrations');



/*        // Register API routes (if enabled)

|--------------------------------------------------------------------------        $this->registerApiRoutes();

| Aggregations API

|--------------------------------------------------------------------------        // Publish configuration files

*/        $this->publishes([

Route::prefix('aggregations')->name('aggregations.')->group(function () {            __DIR__ . '/../config/egi-hub.php' => config_path('egi-hub.php'),

    Route::get('/', [AggregationController::class, 'index'])->name('index');            __DIR__ . '/../config/superadmin.php' => config_path('superadmin.php'),

    Route::post('/', [AggregationController::class, 'store'])->name('store');        ], 'egi-hub-config');

    Route::get('{aggregation}', [AggregationController::class, 'show'])->name('show');

    Route::put('{aggregation}', [AggregationController::class, 'update'])->name('update');        // Publish migrations (optional, for customisation)

    Route::delete('{aggregation}', [AggregationController::class, 'destroy'])->name('destroy');        $this->publishes([

                __DIR__ . '/../database/migrations' => database_path('migrations'),

    // Members management        ], 'egi-hub-migrations');

    Route::post('{aggregation}/invite', [AggregationController::class, 'invite'])->name('invite');    }

    Route::get('{aggregation}/members', [AggregationController::class, 'members'])->name('members');

});    /**

     * Register any application services.

/*     */

|--------------------------------------------------------------------------    public function register(): void

| AI Management (placeholder)    {

|--------------------------------------------------------------------------        // Merge core configuration

*/        $this->mergeConfigFrom(

if (config('superadmin.features.ai_management', true)) {            __DIR__ . '/../config/egi-hub.php',

    Route::prefix('ai')->name('ai.')->group(function () {            'egi-hub'

        // Route::apiResource('consultations', AiConsultationsController::class);        );

        // Route::apiResource('credits', AiCreditsController::class);

        // Route::apiResource('features', AiFeaturesController::class);        // Merge superadmin configuration

        // Route::get('statistics', [AiStatisticsController::class, 'index'])->name('statistics');        $this->mergeConfigFrom(

    });            __DIR__ . '/../config/superadmin.php',

}            'superadmin'

        );

/*    }

|--------------------------------------------------------------------------

| Platform Management (placeholder)    /**

|--------------------------------------------------------------------------     * Register API routes if enabled in configuration.

*/     * 

if (config('superadmin.features.platform_management', true)) {     * Routes return JSON responses only - no views.

    Route::prefix('platform')->name('platform.')->group(function () {     */

        // Route::apiResource('roles', RolesController::class);    protected function registerApiRoutes(): void

        // Route::apiResource('permissions', PermissionsController::class);    {

    });        // Skip if routes are disabled

}        if (! config('superadmin.routes.enabled', true)) {

            return;
        }

        Route::group([
            'prefix' => 'api/' . config('superadmin.routes.prefix', 'superadmin'),
            'middleware' => config('superadmin.routes.middleware', ['api', 'auth:sanctum']),
            'as' => 'api.superadmin.',
        ], function () {
            $this->loadRoutesFrom(__DIR__ . '/../routes/api.php');
        });
    }
}
