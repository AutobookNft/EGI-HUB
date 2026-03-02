<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SuperAdminOnly {
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response {
        if (!auth()->check() || !auth()->user()->is_super_admin) {
            return response()->json([
                'error' => 'Forbidden',
                'message' => __('errors.super_admin_only')
            ], 403);
        }

        return $next($request);
    }
}
