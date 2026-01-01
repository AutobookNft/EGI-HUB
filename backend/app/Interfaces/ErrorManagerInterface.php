<?php

namespace App\Interfaces;

use Throwable;

interface ErrorManagerInterface
{
    /**
     * Handle an error based on UEM configuration
     *
     * @param string $errorCode The error code defined in config/error-manager.php
     * @param array $context Context data for placeholders and logging
     * @param Throwable|null $exception Original exception if available
     * @return mixed Response or throws exception based on config
     */
    public function handle(string $errorCode, array $context = [], ?Throwable $exception = null): mixed;
}
