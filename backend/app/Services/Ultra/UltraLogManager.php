<?php

namespace App\Services\Ultra;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;

class UltraLogManager
{
    /**
     * Log an info message with standard OS3 context
     */
    public function info(string $message, array $context = []): void
    {
        $this->log('info', $message, $context);
    }

    /**
     * Log a warning message with standard OS3 context
     */
    public function warning(string $message, array $context = []): void
    {
        $this->log('warning', $message, $context);
    }

    /**
     * Log an error message with standard OS3 context
     */
    public function error(string $message, array $context = []): void
    {
        $this->log('error', $message, $context);
    }

    /**
     * Log a debug message with standard OS3 context
     */
    public function debug(string $message, array $context = []): void
    {
        $this->log('debug', $message, $context);
    }

    /**
     * Log a critical message with standard OS3 context
     */
    public function critical(string $message, array $context = []): void
    {
        $this->log('critical', $message, $context);
    }

    protected function log(string $level, string $message, array $context): void
    {
        // Enforce OS3 Structure
        $finalContext = array_merge([
            'user_id' => Auth::id() ?? 'system',
            'timestamp' => now()->toIso8601String(),
            'log_category' => $context['log_category'] ?? 'GENERAL',
        ], $context);

        // Remove log_category from context if it was merged to avoid duplication in some drivers? 
        // No, keep it for clarity.

        // Log to standard stack (which includes daily)
        // AND potentially to specific ULM channels if needed. 
        // For now, mapping to standard Log facade is sufficient as per "ULM vs UEM" guide which says "Generic logging".
        Log::log($level, $message, $finalContext);
    }
}
