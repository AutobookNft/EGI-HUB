<?php

namespace App\Services\Ultra;

use App\Interfaces\ErrorManagerInterface;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\JsonResponse;
use Throwable;

class ErrorManager implements ErrorManagerInterface
{
    /**
     * Handle an error based on UEM configuration
     */
    public function handle(string $errorCode, array $context = [], ?Throwable $exception = null): mixed
    {
        // 1. Load config
        $config = config("error-manager.errors.{$errorCode}");

        if (!$config) {
            // Fallback for undefined errors
            $config = config("error-manager.errors.GENERIC_ERROR") ?? [
                'type' => 'error',
                'blocking' => 'blocking',
                'http_status_code' => 500,
                'msg_to' => 'toast'
            ];
            Log::warning("UEM: Undefined error code '{$errorCode}' used. Falling back to GENERIC_ERROR.");
        }

        // 2. Prepare Context
        $fullContext = array_merge($context, [
            'error_code' => $errorCode,
            'exception_message' => $exception?->getMessage(),
            'exception_trace' => $exception?->getTraceAsString(),
        ]);

        // 3. Log to UEM Channel
        // "error_manager" channel defined in logging.php
        Log::channel('error_manager')->log(
            $this->mapLevel($config['type']),
            "UEM Handle: {$errorCode}",
            $fullContext
        );

        // 4. Determine Response Strategy
        // If blocking/semi-blocking, we often return a JSON response with the error details.
        // If 'not', we might just return null or continue (but handle() usually is returned by controller).
        
        // Construct User Message (using keys would require translation files, here we mock/fallback)
        $userMsg = $this->getTranslation($config['user_message_key'] ?? '', $fullContext) 
                   ?? "An error occurred: {$errorCode}";

        if ($config['blocking'] === 'not') {
            return null; // Continue execution
        }

        return response()->json([
            'success' => false,
            'error' => [
                'code' => $errorCode,
                'message' => $userMsg,
                'type' => $config['type'],
                // Do NOT expose detailed dev info to user unless in debug mode
                'debug' => config('app.debug') ? $exception?->getMessage() : null,
            ],
            'data' => null
        ], $config['http_status_code'] ?? 500);
    }

    protected function mapLevel(string $type): string
    {
        return match($type) {
            'warning' => 'warning',
            'critical' => 'critical',
            default => 'error',
        };
    }

    protected function getTranslation(string $key, array $replace): ?string
    {
        // Simple mock for translation replacement until lang files exist
        // In real OS3, this uses __($key, $replace)
        $msg = $key; // Placeholder
        // If key looks like 'error-manager::...', try to translate
        // For now, return a generic friendly message if translation fails
        return $msg;
    }
}
