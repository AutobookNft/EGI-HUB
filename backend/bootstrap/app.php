<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use App\Helpers\EarlyEnvironmentHelper;


// 🔐 Carica le variabili di ambiente critiche prima del bootstrap
EarlyEnvironmentHelper::loadCriticalEnvironmentVariables(dirname(__DIR__));


return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        api: __DIR__.'/../routes/api.php',
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Registra middleware personalizzati per Project Access
        $middleware->alias([
            'project.access' => \App\Http\Middleware\ProjectAccess::class,
            'project.permission' => \App\Http\Middleware\ProjectPermission::class,
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->reportable(function (Throwable $e) {
            try {
                // Tenta di risolvere UEM dal container e tracciare l'errore
                $errorManager = app(\Ultra\ErrorManager\Interfaces\ErrorManagerInterface::class);
                $errorManager->handle('GENERIC_ERROR', [
                    'log_category' => 'GLOBAL_EXCEPTION_HANDLER',
                    'exception_class' => get_class($e),
                ], $e);
            } catch (\Throwable $loggingException) {
                // Fallback estremo se UEM fallisce (es. DB down)
                // Laravel userà il logger di default configurato in logging.php
            }
        });
    })->create();
