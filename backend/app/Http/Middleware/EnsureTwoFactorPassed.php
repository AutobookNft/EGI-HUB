<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureTwoFactorPassed {
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response {
        $user = $request->user();

        // Se l'utente non è autenticato ignoriamo (ci pensa auth:sanctum prima)
        if (!$user) {
            return $next($request);
        }

        // Se il token ha l'ability '2fa:pending', l'utente deve superare la 2FA.
        //
        // ATTENZIONE: NON usare $token->can('2fa:pending') perché il metodo Sanctum
        // restituisce TRUE anche per token con abilities ['*'] (wildcard = può tutto).
        // Dobbiamo controllare l'array DIRETTAMENTE: il token è "pending" solo se
        // contiene '2fa:pending' SENZA il wildcard '*'.
        $tokenAbilities = (array) ($user->currentAccessToken()?->abilities ?? []);
        $isPending = in_array('2fa:pending', $tokenAbilities) && !in_array('*', $tokenAbilities);

        if ($isPending) {

            // Verifichiamo se l'utente HA GIÀ un secret confermato.
            // In caso contrario, deve configurarlo.
            if (!$user->two_factor_confirmed_at) {
                return response()->json([
                    'error' => '2fa_setup_required',
                    'message' => 'Devi configurare l\'Autenticazione a Due Fattori per procedere.'
                ], 403);
            }

            // Altrimenti deve solo inserire il codice
            return response()->json([
                'error' => '2fa_challenge_required',
                'message' => 'Devi inserire il codice a 6 cifre per sbloccare la sessione.'
            ], 403);
        }

        // Se non ha 2fa:pending vuol dire che ha già superato o non ne aveva bisogno ('*')
        return $next($request);
    }
}
