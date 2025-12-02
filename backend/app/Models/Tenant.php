<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Tenant Model
 * 
 * Rappresenta un tenant (applicazione) gestito da EGI-HUB.
 * Ogni tenant è un'applicazione separata con la propria API.
 * 
 * @property int $id
 * @property string $name
 * @property string $slug
 * @property string $url
 * @property string|null $api_key
 * @property string|null $api_secret
 * @property string $status
 * @property array|null $metadata
 * @property \Carbon\Carbon|null $last_health_check
 * @property bool $is_healthy
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 * @property \Carbon\Carbon|null $deleted_at
 */
class Tenant extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * Status constants
     */
    const STATUS_ACTIVE = 'active';
    const STATUS_INACTIVE = 'inactive';
    const STATUS_MAINTENANCE = 'maintenance';
    const STATUS_ERROR = 'error';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'slug',
        'url',
        'production_url',
        'staging_url',
        'api_key',
        'api_secret',
        'status',
        'metadata',
        'local_start_script',
        'local_stop_script',
        'supervisor_program',
        'last_health_check',
        'is_healthy',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'api_key',
        'api_secret',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'metadata' => 'array',
        'last_health_check' => 'datetime',
        'is_healthy' => 'boolean',
    ];

    /**
     * The model's default values for attributes.
     *
     * @var array
     */
    protected $attributes = [
        'status' => self::STATUS_ACTIVE,
        'is_healthy' => true,
    ];

    /**
     * Scope: only active tenants
     */
    public function scopeActive($query)
    {
        return $query->where('status', self::STATUS_ACTIVE);
    }

    /**
     * Scope: only healthy tenants
     */
    public function scopeHealthy($query)
    {
        return $query->where('is_healthy', true);
    }

    /**
     * Check if tenant is active
     */
    public function isActive(): bool
    {
        return $this->status === self::STATUS_ACTIVE;
    }

    /**
     * Check if tenant is in maintenance mode
     */
    public function isInMaintenance(): bool
    {
        return $this->status === self::STATUS_MAINTENANCE;
    }

    /**
     * Get the full API URL for a given endpoint
     */
    public function getApiUrl(string $endpoint = ''): string
    {
        $baseUrl = rtrim($this->url, '/');
        $endpoint = ltrim($endpoint, '/');
        
        return $endpoint ? "{$baseUrl}/{$endpoint}" : $baseUrl;
    }

    /**
     * Get authentication headers for API requests
     */
    public function getAuthHeaders(): array
    {
        $headers = [
            'Accept' => 'application/json',
            'Content-Type' => 'application/json',
        ];

        if ($this->api_key) {
            $headers['X-API-Key'] = $this->api_key;
        }

        if ($this->api_secret) {
            $headers['X-API-Secret'] = $this->api_secret;
        }

        return $headers;
    }

    /**
     * Update health status
     */
    public function updateHealthStatus(bool $isHealthy): void
    {
        $this->update([
            'is_healthy' => $isHealthy,
            'last_health_check' => now(),
            'status' => $isHealthy ? self::STATUS_ACTIVE : self::STATUS_ERROR,
        ]);
    }

    /**
     * Get status badge color for UI
     */
    public function getStatusColor(): string
    {
        return match($this->status) {
            self::STATUS_ACTIVE => 'success',
            self::STATUS_INACTIVE => 'warning',
            self::STATUS_MAINTENANCE => 'info',
            self::STATUS_ERROR => 'error',
            default => 'neutral',
        };
    }
}
