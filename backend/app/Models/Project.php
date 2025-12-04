<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/**
 * Project Model
 * 
 * Rappresenta un progetto SaaS gestito da EGI-HUB.
 * Ogni progetto è un'applicazione multi-tenant separata (es. NATAN_LOC, FlorenceArtEGI).
 * 
 * NOTA: I "Projects" in EGI-HUB sono le applicazioni SaaS stesse,
 * mentre i "Tenants" sono i clienti finali di ogni progetto (Comuni, Gallerie, etc.)
 * 
 * @property int $id
 * @property string $name
 * @property string $slug
 * @property string|null $description
 * @property string $url
 * @property string|null $production_url
 * @property string|null $staging_url
 * @property string|null $api_key
 * @property string|null $api_secret
 * @property string $status
 * @property array|null $metadata
 * @property string|null $local_start_script
 * @property string|null $local_stop_script
 * @property string|null $supervisor_program
 * @property \Carbon\Carbon|null $last_health_check
 * @property bool $is_healthy
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 * @property \Carbon\Carbon|null $deleted_at
 */
class Project extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * The table associated with the model.
     */
    protected $table = 'projects';

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
        'description',
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

    // =========================================================================
    // RELATIONSHIPS
    // =========================================================================

    /**
     * Get activities for this project
     */
    public function activities(): HasMany
    {
        return $this->hasMany(ProjectActivity::class);
    }

    /**
     * Tutti i record ProjectAdmin di questo progetto
     */
    public function adminRecords(): HasMany
    {
        return $this->hasMany(ProjectAdmin::class);
    }

    /**
     * Tutti gli utenti che hanno accesso a questo progetto
     */
    public function admins(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'project_admins')
                    ->withPivot(['role', 'permissions', 'is_active', 'expires_at'])
                    ->withTimestamps();
    }

    /**
     * Utenti con accesso attivo
     */
    public function activeAdmins(): BelongsToMany
    {
        return $this->admins()
                    ->wherePivot('is_active', true)
                    ->where(function ($query) {
                        $query->whereNull('project_admins.expires_at')
                              ->orWhere('project_admins.expires_at', '>', now());
                    });
    }

    /**
     * Owner del progetto
     */
    public function owners(): BelongsToMany
    {
        return $this->activeAdmins()->wherePivot('role', ProjectAdmin::ROLE_OWNER);
    }

    /**
     * Assegna un utente come admin del progetto
     */
    public function assignAdmin(
        User $user,
        string $role = ProjectAdmin::ROLE_VIEWER,
        ?array $permissions = null,
        ?User $assignedBy = null,
        ?\DateTimeInterface $expiresAt = null
    ): ProjectAdmin {
        return ProjectAdmin::create([
            'project_id' => $this->id,
            'user_id' => $user->id,
            'role' => $role,
            'permissions' => $permissions,
            'assigned_by' => $assignedBy?->id,
            'expires_at' => $expiresAt,
            'is_active' => true,
        ]);
    }

    /**
     * Rimuovi l'accesso di un utente
     */
    public function removeAdmin(User $user): bool
    {
        return $this->adminRecords()
                    ->where('user_id', $user->id)
                    ->delete() > 0;
    }

    // =========================================================================
    // SCOPES
    // =========================================================================

    /**
     * Scope: only active projects
     */
    public function scopeActive($query)
    {
        return $query->where('status', self::STATUS_ACTIVE);
    }

    /**
     * Scope: only healthy projects
     */
    public function scopeHealthy($query)
    {
        return $query->where('is_healthy', true);
    }

    // =========================================================================
    // HELPERS
    // =========================================================================

    /**
     * Check if project is active
     */
    public function isActive(): bool
    {
        return $this->status === self::STATUS_ACTIVE;
    }

    /**
     * Check if project is in maintenance mode
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
