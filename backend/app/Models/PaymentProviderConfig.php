<?php

declare(strict_types=1);

/**
 * @package App\Models
 * @author Padmin D. Curtis (AI Partner OS3.0) for Fabio Cherici
 * @version 1.0.0 (EGI-HUB - BILLING FASE 4.2)
 * @date 2026-02-25
 * @purpose Configurazioni provider pagamento per progetto — tabella payment_provider_configs
 */

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

class PaymentProviderConfig extends Model {
    use HasFactory, SoftDeletes;

    protected $table = 'payment_provider_configs';

    protected $fillable = [
        'project_id',
        'provider',
        'is_enabled',
        'config',
        'environment',
        'notes',
    ];

    protected $casts = [
        'is_enabled'  => 'boolean',
        'config'      => 'encrypted:array',   // JSON cifrato a riposo
        'deleted_at'  => 'datetime',
    ];

    /**
     * Campi sensibili — mai esposti nelle risposte API.
     */
    protected $hidden = ['config'];

    // ─── Relations ───────────────────────────────────────────────────────────

    public function project(): BelongsTo {
        return $this->belongsTo(Project::class, 'project_id');
    }

    // ─── Scopes ──────────────────────────────────────────────────────────────

    public function scopeEnabled(Builder $query): Builder {
        return $query->where('is_enabled', true);
    }

    public function scopeForProject(Builder $query, int $projectId): Builder {
        return $query->where('project_id', $projectId);
    }

    public function scopeLive(Builder $query): Builder {
        return $query->where('environment', 'live');
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    /**
     * Restituisce la config decriptata — usare SOLO server-side, mai in API response.
     */
    public function getDecryptedConfig(): ?array {
        return $this->config;
    }

    /**
     * Ritorna la config mascherando i valori sensibili (per UI).
     * Mostra solo le chiavi presenti, con valori oscurati se non vuoti.
     */
    public function getMaskedConfig(): array {
        $config = $this->config ?? [];
        $masked = [];
        foreach ($config as $key => $value) {
            $masked[$key] = $value ? '••••••••' : '';
        }
        return $masked;
    }

    /**
     * Schema chiavi attese per ogni provider.
     */
    public static function configSchema(string $provider): array {
        return match ($provider) {
            'stripe'  => ['publishable_key', 'secret_key', 'webhook_secret'],
            'paypal'  => ['client_id', 'client_secret', 'webhook_id'],
            'crypto'  => ['api_key', 'api_secret', 'wallet_address'],
            default   => [],
        };
    }
}
