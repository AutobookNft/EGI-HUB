<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Tenant Model
 * 
 * Rappresenta un tenant (cliente finale) di un progetto SaaS.
 * 
 * Esempi:
 * - NATAN_LOC (project) -> Comune di Firenze, Comune di Prato (tenants)
 * - FlorenceArtEGI (project) -> Galleria, Artista (tenants)
 */
class Tenant extends Model
{
    use HasFactory, SoftDeletes;

    const STATUS_ACTIVE = 'active';
    const STATUS_INACTIVE = 'inactive';
    const STATUS_SUSPENDED = 'suspended';
    const STATUS_TRIAL = 'trial';

    protected $fillable = [
        'project_id',
        'name',
        'slug',
        'description',
        'url',
        'subdomain',
        'settings',
        'metadata',
        'contact_name',
        'contact_email',
        'contact_phone',
        'status',
        'plan',
        'trial_ends_at',
        'subscription_ends_at',
        'is_healthy',
        'last_health_check',
    ];

    protected $casts = [
        'settings' => 'array',
        'metadata' => 'array',
        'trial_ends_at' => 'datetime',
        'subscription_ends_at' => 'datetime',
        'last_health_check' => 'datetime',
        'is_healthy' => 'boolean',
    ];

    protected $attributes = [
        'status' => 'active',
        'is_healthy' => true,
    ];

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function scopeActive($query)
    {
        return $query->where('status', self::STATUS_ACTIVE);
    }

    public function scopeTrial($query)
    {
        return $query->where('status', self::STATUS_TRIAL);
    }

    public function scopeHealthy($query)
    {
        return $query->where('is_healthy', true);
    }

    public function scopeForProject($query, int $projectId)
    {
        return $query->where('project_id', $projectId);
    }

    public function isActive(): bool
    {
        return $this->status === self::STATUS_ACTIVE;
    }

    public function isInTrial(): bool
    {
        return $this->status === self::STATUS_TRIAL;
    }

    public function getStatusColor(): string
    {
        return match($this->status) {
            self::STATUS_ACTIVE => 'success',
            self::STATUS_INACTIVE => 'warning',
            self::STATUS_SUSPENDED => 'error',
            self::STATUS_TRIAL => 'info',
            default => 'neutral',
        };
    }

    public function getStatusLabel(): string
    {
        return match($this->status) {
            self::STATUS_ACTIVE => 'Attivo',
            self::STATUS_INACTIVE => 'Inattivo',
            self::STATUS_SUSPENDED => 'Sospeso',
            self::STATUS_TRIAL => 'Trial',
            default => 'Sconosciuto',
        };
    }
}
