<?php

namespace App\Helpers;

class EarlyEnvironmentHelper
{
    public static function loadCriticalEnvironmentVariables(string $basePath): void
    {
        $envFile = $basePath . '/.env';
        if (file_exists($envFile)) {
            $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            foreach ($lines as $line) {
                if (strpos($line, '=') !== false && !str_starts_with(trim($line), '#')) {
                    putenv(trim($line));
                }
            }
        }
    }
}
