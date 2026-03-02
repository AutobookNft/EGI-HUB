<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use PragmaRX\Google2FA\Google2FA;

class TwoFactorAuthenticationController extends Controller {
    /**
     * Genera il QR Code e la chiave segreta per il setup della 2FA.
     */
    public function setup(Request $request): JsonResponse {
        $user = $request->user();
        $google2fa = new Google2FA();

        // Se l'utente non ha un secret, lo creiamo
        if (!$user->two_factor_secret) {
            $user->two_factor_secret = $google2fa->generateSecretKey();
            // Evitiamo che venga considerato confermato
            $user->two_factor_confirmed_at = null;
            $user->save();
        }

        $qrCodeUrl = $google2fa->getQRCodeUrl(
            config('app.name', 'EGI-HUB'), // Nome App
            $user->email,
            $user->two_factor_secret
        );

        return response()->json([
            'success' => true,
            'data' => [
                'secret' => $user->two_factor_secret,
                'qr_code_url' => $qrCodeUrl, // URL da passare a un generatore QR in React (es. QRCode.react)
                'is_confirmed' => !is_null($user->two_factor_confirmed_at)
            ]
        ]);
    }

    /**
     * Conferma il codice per attivare definitivamente la 2FA (primo setup).
     */
    public function confirm(Request $request): JsonResponse {
        $request->validate([
            'code' => 'required|string',
        ]);

        $user = $request->user();
        $google2fa = new Google2FA();

        $valid = $google2fa->verifyKey($user->two_factor_secret, $request->code);

        if ($valid) {
            $user->two_factor_confirmed_at = now();
            $user->save();

            // Aggiorniamo le abilities del token corrente per bypassare il controllo 2FA
            $request->user()->currentAccessToken()->update([
                'abilities' => ['*']
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Autenticazione a Due Fattori abilitata con successo.'
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'Codice non valido. Riprova.'
        ], 400);
    }

    /**
     * Verifica il codice per il login (chiesto dal middleware / UI se 2FA già attiva).
     */
    public function verify(Request $request): JsonResponse {
        $request->validate([
            'code' => 'required|string',
        ]);

        $user = $request->user();
        $google2fa = new Google2FA();

        $valid = $google2fa->verifyKey($user->two_factor_secret, $request->code);

        if ($valid) {
            // Promuoviamo il token attuale a "completamente abilitato"
            $request->user()->currentAccessToken()->update([
                'abilities' => ['*']
            ]);

            return response()->json([
                'success' => true,
                'message' => '2FA verificata, accesso consentito.'
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'Codice non valido.'
        ], 400);
    }
}
