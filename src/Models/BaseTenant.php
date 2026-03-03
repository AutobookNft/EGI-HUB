<?php

declare(strict_types=1);

namespace FlorenceEgi\Hub\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * BaseTenant Model
 *
 * Modello base per i tenant dell'ecosistema FlorenceEGI.
 * Le applicazioni host possono estendere questo modello o sostituirlo
 * tramite la configurazione `egi-hub.tenants.model` o la variabile d'ambiente
 * `EGI_TENANT_MODEL`.
 *
 * @package FlorenceEgi\Hub\Models
 * @author Padmin D. Curtis (AI Partner OS3.0) for Fabio Cherici
 * @version 1.0.0 (EGI-HUB - BaseTenant Package Model)
 * @date 2026-03-03
 * @purpose Base Eloquent model for tenant management across EGI-HUB ecosystem
 */
class BaseTenant extends Model {
    use SoftDeletes;

    /**
     * The table associated with the model.
     */
    protected $table = 'tenants';

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
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

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'settings'              => 'array',
        'metadata'              => 'array',
        'is_healthy'            => 'boolean',
        'trial_ends_at'         => 'datetime',
        'subscription_ends_at'  => 'datetime',
        'last_health_check'     => 'datetime',
    ];

    /**
     * Status constants — compatibili con il migration EGI-HUB
     */
    public const STATUS_ACTIVE   = 'active';
    public const STATUS_INACTIVE = 'inactive';
    public const STATUS_SUSPENDED = 'suspended';
    public const STATUS_TRIAL    = 'trial';

    /**
     * Scope per filtrare i tenant attivi.
     */
    public function scopeActive($query) {
        return $query->where('status', self::STATUS_ACTIVE);
    }

    /**
     * Scope per filtrare i tenant in salute.
     */
    public function scopeHealthy($query) {
        return $query->where('is_healthy', true);
    }
}
