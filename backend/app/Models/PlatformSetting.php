<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

/**
 * PlatformSetting Model — EGI-HUB
 *
 * Punta alla tabella `platform_settings` del DB condiviso (PostgreSQL AWS RDS).
 * Nessuna migration: tabella già esistente, creata da EGI.
 *
 * Struttura tabella:
 *   id, group, key, value, value_type (string|integer|decimal|boolean|json),
 *   label, description, is_editable, created_at, updated_at
 *
 * @package App\Models
 * @author Padmin D. Curtis (AI Partner OS3.0) for Fabio Cherici
 * @version 1.0.0 (FlorenceEGI - EGI-HUB Billing FASE 2)
 * @date 2026-02-25
 * @purpose Read-write access alla tabella platform_settings dal punto di controllo EGI-HUB
 */
class PlatformSetting extends Model
{
    protected $table = 'platform_settings';

    protected $fillable = [
        'group',
        'key',
        'value',
        'value_type',
        'label',
        'description',
        'is_editable',
    ];

    protected $casts = [
        'is_editable' => 'boolean',
    ];

    private const CACHE_TTL = 3600; // 1 ora
    private const CACHE_KEY = 'platform_settings';

    // ─── STATIC HELPERS ───────────────────────────────────────────────────────

    /**
     * Legge un setting con cast automatico del tipo.
     */
    public static function get(string $group, string $key, mixed $default = null): mixed
    {
        $all = self::allCached();
        $setting = $all->first(fn($s) => $s->group === $group && $s->key === $key);

        if (! $setting) {
            return $default;
        }

        return self::castValue($setting->value, $setting->value_type);
    }

    /**
     * Scrive un setting nel DB e invalida la cache.
     */
    public static function set(string $group, string $key, mixed $value): void
    {
        self::updateOrCreate(
            ['group' => $group, 'key' => $key],
            ['value' => is_array($value) || is_object($value) ? json_encode($value) : (string) $value]
        );

        Cache::forget(self::CACHE_KEY);
    }

    /**
     * Invalida la cache.
     */
    public static function invalidateCache(): void
    {
        Cache::forget(self::CACHE_KEY);
    }

    /**
     * Tutti i setting raggruppati per group.
     */
    public static function allGrouped(): \Illuminate\Support\Collection
    {
        return self::orderBy('group')->orderBy('key')->get()->groupBy('group');
    }

    // ─── INTERNALS ────────────────────────────────────────────────────────────

    private static function allCached(): \Illuminate\Support\Collection
    {
        return Cache::remember(self::CACHE_KEY, self::CACHE_TTL, fn() => self::all());
    }

    private static function castValue(mixed $value, string $type): mixed
    {
        return match ($type) {
            'integer' => (int)   $value,
            'decimal' => (float) $value,
            'boolean' => filter_var($value, FILTER_VALIDATE_BOOLEAN),
            'json'    => json_decode((string) $value, true),
            default   => (string) $value,
        };
    }
}
