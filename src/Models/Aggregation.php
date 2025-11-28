<?php

declare(strict_types=1);

namespace FlorenceEgi\Hub\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Str;

/**
 * Model: Aggregation
 * 
 * Rappresenta un'aggregazione consensuale di tenant che condividono dati.
 * Le aggregazioni sono peer-to-peer: qualsiasi tenant può crearle e
 * invitare altri tenant a partecipare.
 * 
 * @package FlorenceEgi\Hub\Models
 * @author Fabio Cherici
 * @version 1.0.1
 * @date 2025-11-28
 */
class Aggregation extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'aggregations';

    protected $fillable = [
        'name',
        'slug',
        'description',
        'created_by_tenant_id',
        'status',
        'settings',
        'share_documents',
        'share_analytics',
        'share_templates',
        'members_can_invite',
        'max_members',
    ];

    protected $casts = [
        'settings' => 'array',
        'share_documents' => 'boolean',
        'share_analytics' => 'boolean',
        'share_templates' => 'boolean',
        'members_can_invite' => 'boolean',
        'max_members' => 'integer',
    ];

    /**
     * Boot del modello - usa booted() invece di boot() per evitare
     * problemi durante il caricamento dell'autoloader
     */
    protected static function booted(): void
    {
        // Auto-genera slug se non fornito
        static::creating(function ($aggregation) {
            if (empty($aggregation->slug)) {
                $aggregation->slug = Str::slug($aggregation->name);
            }

            // Assicura unicità slug - solo se la connessione è disponibile
            try {
                $originalSlug = $aggregation->slug;
                $counter = 1;
                while (static::where('slug', $aggregation->slug)->exists()) {
                    $aggregation->slug = $originalSlug . '-' . $counter++;
                }
            } catch (\Exception $e) {
                // Se DB non disponibile, usa timestamp per unicità
                $aggregation->slug = $aggregation->slug . '-' . time();
            }
        });
    }

    // =========================================================================
    // RELAZIONI
    // =========================================================================

    /**
     * Tenant che ha creato l'aggregazione
     */
    public function creator(): BelongsTo
    {
        $tenantModel = config('egi-core.tenants.model', 'App\\Models\\Tenant');
        return $this->belongsTo($tenantModel, 'created_by_tenant_id');
    }

    /**
     * Tutti i record membership (inclusi pending, rejected, etc.)
     */
    public function memberships(): HasMany
    {
        return $this->hasMany(AggregationMember::class, 'aggregation_id');
    }

    /**
     * Solo i membri attivi (accepted)
     */
    public function activeMembers(): HasMany
    {
        return $this->hasMany(AggregationMember::class, 'aggregation_id')
            ->where('status', 'accepted');
    }

    /**
     * Inviti pendenti
     */
    public function pendingInvitations(): HasMany
    {
        return $this->hasMany(AggregationMember::class, 'aggregation_id')
            ->where('status', 'pending');
    }

    /**
     * Tenant membri (relazione many-to-many attraverso pivot)
     */
    public function tenants(): BelongsToMany
    {
        $tenantModel = config('egi-core.tenants.model', 'App\\Models\\Tenant');
        return $this->belongsToMany($tenantModel, 'aggregation_members', 'aggregation_id', 'tenant_id')
            ->withPivot(['status', 'role', 'permissions', 'joined_at'])
            ->wherePivot('status', 'accepted');
    }

    // =========================================================================
    // SCOPES
    // =========================================================================

    /**
     * Solo aggregazioni attive
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * Aggregazioni dove un tenant è membro attivo
     */
    public function scopeForTenant($query, int $tenantId)
    {
        return $query->whereHas('activeMembers', function ($q) use ($tenantId) {
            $q->where('tenant_id', $tenantId);
        });
    }

    // =========================================================================
    // METODI HELPER
    // =========================================================================

    /**
     * Verifica se un tenant è membro attivo
     */
    public function hasMember(int $tenantId): bool
    {
        return $this->activeMembers()->where('tenant_id', $tenantId)->exists();
    }

    /**
     * Verifica se un tenant è admin dell'aggregazione
     */
    public function isAdmin(int $tenantId): bool
    {
        if ($this->created_by_tenant_id === $tenantId) {
            return true;
        }

        return $this->activeMembers()
            ->where('tenant_id', $tenantId)
            ->where('role', 'admin')
            ->exists();
    }

    /**
     * Ottiene tutti gli ID dei tenant membri attivi
     */
    public function getMemberTenantIds(): array
    {
        return $this->activeMembers()->pluck('tenant_id')->toArray();
    }

    /**
     * Conta i membri attivi
     */
    public function getActiveMembersCount(): int
    {
        return $this->activeMembers()->count();
    }

    /**
     * Verifica se può accettare nuovi membri
     */
    public function canAcceptMoreMembers(): bool
    {
        if ($this->status !== 'active') {
            return false;
        }

        if ($this->max_members === null) {
            return true;
        }

        return $this->getActiveMembersCount() < $this->max_members;
    }

    /**
     * Invita un tenant all'aggregazione
     */
    public function inviteTenant(int $tenantId, int $invitedByTenantId, ?string $message = null): AggregationMember
    {
        $existing = $this->memberships()
            ->where('tenant_id', $tenantId)
            ->whereIn('status', ['pending', 'accepted'])
            ->first();

        if ($existing) {
            throw new \Exception("Tenant già membro o con invito pendente");
        }

        $expiryDays = config('egi-core.aggregations.invitation_expiry_days', 30);

        return $this->memberships()->create([
            'tenant_id' => $tenantId,
            'invited_by_tenant_id' => $invitedByTenantId,
            'status' => 'pending',
            'role' => 'member',
            'invited_at' => now(),
            'expires_at' => now()->addDays($expiryDays),
            'invitation_message' => $message,
        ]);
    }
}
