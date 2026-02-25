<?php

declare(strict_types=1);

/**
 * @package App\Http\Controllers\Api\Superadmin
 * @author Padmin D. Curtis (AI Partner OS3.0) for Fabio Cherici
 * @version 1.0.0 (EGI-HUB - BILLING FASE 4.2)
 * @date 2026-02-25
 * @purpose CRUD configurazioni provider di pagamento per progetto
 */

namespace App\Http\Controllers\Api\Superadmin;

use App\Http\Controllers\Controller;
use App\Models\PaymentProviderConfig;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PaymentProviderConfigsController extends Controller {
    /**
     * GET /superadmin/billing/payment-providers
     * Lista tutte le config, raggruppate per progetto o filtrate.
     */
    public function index(Request $request): JsonResponse {
        $query = PaymentProviderConfig::with('project:id,name,slug');

        if ($request->filled('project_id')) {
            $query->forProject((int) $request->project_id);
        }

        if ($request->filled('provider')) {
            $query->where('provider', $request->provider);
        }

        if ($request->filled('environment')) {
            $query->where('environment', $request->environment);
        }

        $configs = $query->orderBy('project_id')->orderBy('provider')->get();

        // Aggiungo: schema chiavi attese + config mascherata per UI
        $configs->each(function (PaymentProviderConfig $cfg) {
            $cfg->makeVisible([]); // config rimane hidden
            $cfg->setRelation('_meta', null); // non usato
        });

        return response()->json([
            'success' => true,
            'data'    => $configs->map(fn($cfg) => array_merge(
                $cfg->toArray(),
                [
                    'config_masked'  => $cfg->getMaskedConfig(),
                    'config_schema'  => PaymentProviderConfig::configSchema($cfg->provider),
                ]
            )),
            'total'   => $configs->count(),
        ]);
    }

    /**
     * POST /superadmin/billing/payment-providers
     * Crea una nuova config provider per un progetto.
     */
    public function store(Request $request): JsonResponse {
        $validated = $request->validate([
            'project_id'  => ['required', 'integer', 'exists:system_projects,id'],
            'provider'    => ['required', Rule::in(['stripe', 'paypal', 'crypto'])],
            'is_enabled'  => ['boolean'],
            'config'      => ['nullable', 'array'],
            'environment' => ['required', Rule::in(['sandbox', 'live'])],
            'notes'       => ['nullable', 'string'],
        ]);

        // Verifica unicità (project_id + provider)
        $exists = PaymentProviderConfig::withTrashed()
            ->where('project_id', $validated['project_id'])
            ->where('provider', $validated['provider'])
            ->exists();

        if ($exists) {
            return response()->json([
                'success' => false,
                'message' => "Esiste già una configurazione {$validated['provider']} per questo progetto.",
            ], 422);
        }

        $config = PaymentProviderConfig::create($validated);

        return response()->json([
            'success' => true,
            'data'    => array_merge(
                $config->toArray(),
                ['config_schema' => PaymentProviderConfig::configSchema($config->provider)]
            ),
            'message' => 'Configurazione creata.',
        ], 201);
    }

    /**
     * PUT /superadmin/billing/payment-providers/{id}
     * Aggiorna config (inclusa la parte cifrata).
     */
    public function update(Request $request, int $id): JsonResponse {
        $cfg = PaymentProviderConfig::findOrFail($id);

        $validated = $request->validate([
            'is_enabled'  => ['sometimes', 'boolean'],
            'config'      => ['nullable', 'array'],
            'environment' => ['sometimes', Rule::in(['sandbox', 'live'])],
            'notes'       => ['nullable', 'string'],
        ]);

        // Per la config: merge con quella esistente (non sovrascrittura completa)
        // in modo da aggiornare solo le chiavi fornite
        if (isset($validated['config']) && is_array($validated['config'])) {
            $existing = $cfg->getDecryptedConfig() ?? [];
            $validated['config'] = array_merge($existing, $validated['config']);
        }

        $cfg->update($validated);

        return response()->json([
            'success' => true,
            'data'    => array_merge(
                $cfg->fresh()->toArray(),
                [
                    'config_masked' => $cfg->fresh()->getMaskedConfig(),
                    'config_schema' => PaymentProviderConfig::configSchema($cfg->provider),
                ]
            ),
            'message' => 'Configurazione aggiornata.',
        ]);
    }

    /**
     * DELETE /superadmin/billing/payment-providers/{id}
     */
    public function destroy(int $id): JsonResponse {
        $cfg = PaymentProviderConfig::findOrFail($id);
        $cfg->delete();

        return response()->json([
            'success' => true,
            'message' => 'Configurazione eliminata.',
        ]);
    }

    /**
     * GET /superadmin/billing/payment-providers/schema/{provider}
     * Ritorna lo schema delle chiavi attese per un provider.
     * Usato dall'UI per generare il form dinamicamente.
     */
    public function schema(string $provider): JsonResponse {
        $allowed = ['stripe', 'paypal', 'crypto'];
        if (!in_array($provider, $allowed, true)) {
            return response()->json(['success' => false, 'message' => 'Provider non valido.'], 422);
        }

        return response()->json([
            'success' => true,
            'data'    => [
                'provider' => $provider,
                'keys'     => PaymentProviderConfig::configSchema($provider),
            ],
        ]);
    }
}
