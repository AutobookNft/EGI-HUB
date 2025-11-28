<?php

declare(strict_types=1);

namespace FlorenceEgi\Hub\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Model: AggregationMember
 * 
 * Rappresenta l'appartenenza di un tenant a un'aggregazione.
 * Gestisce il workflow di invito/accettazione e i permessi specifici.
 * 
 * STATI:
 * - pending: Invito inviato, in attesa di risposta
 * - accepted: Membro attivo dell'aggregazione
 * - rejected: Ha rifiutato l'invito
 * - left: Ha lasciato volontariamente
 * - removed: Rimosso dall'admin
 * - expired: Invito scaduto
 * 
 * @package FlorenceEgi\Hub\Models
 * @author Fabio Cherici
 * @version 1.0.0
 * @date 2025-11-28
 * 
 * @property int $id
 * @property int $aggregation_id
 * @property int $tenant_id
 * @property int|null $invited_by_tenant_id
 * @property string $status
 * @property string $role
 * @property array|null $permissions
 * @property \Carbon\Carbon|null $invited_at
 * @property \Carbon\Carbon|null $responded_at
 * @property \Carbon\Carbon|null $joined_at
 * @property \Carbon\Carbon|null $left_at
 * @property \Carbon\Carbon|null $expires_at
 * @property string|null $invitation_message
 * @property string|null $response_message
 * @property string|null $leave_reason
 */
class AggregationMember extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'aggregation_members';

    protected $fillable = [
        'aggregation_id',
        'tenant_id',
        'invited_by_tenant_id',
        'status',
        'role',
        'permissions',
        'invited_at',
        'responded_at',
        'joined_at',
        'left_at',
        'expires_at',
        'invitation_message',
        'response_message',
        'leave_reason',
    ];

    protected $casts = [
        'permissions' => 'array',
        'invited_at' => 'datetime',
        'responded_at' => 'datetime',
        'joined_at' => 'datetime',
        'left_at' => 'datetime',
        'expires_at' => 'datetime',
    ];

    // =========================================================================
    // COSTANTI
    // =========================================================================

    public const STATUS_PENDING = 'pending';
    public const STATUS_ACCEPTED = 'accepted';
    public const STATUS_REJECTED = 'rejected';
    public const STATUS_LEFT = 'left';
    public const STATUS_REMOVED = 'removed';
    public const STATUS_EXPIRED = 'expired';

    public const ROLE_ADMIN = 'admin';
    public const ROLE_MEMBER = 'member';
    public const ROLE_READONLY = 'readonly';

    // =========================================================================
    // RELAZIONI
    // =========================================================================

    /**
     * L'aggregazione di appartenenza
     */
    public function aggregation(): BelongsTo
    {
        return $this->belongsTo(Aggregation::class, 'aggregation_id');
    }

    /**
     * Il tenant membro
     */
    public function tenant(): BelongsTo
    {
        $tenantModel = config('egi-core.tenants.model', 'App\\Models\\Tenant');
        return $this->belongsTo($tenantModel, 'tenant_id');
    }

    /**
     * Il tenant che ha inviato l'invito
     */
    public function invitedBy(): BelongsTo
    {
        $tenantModel = config('egi-core.tenants.model', 'App\\Models\\Tenant');
        return $this->belongsTo($tenantModel, 'invited_by_tenant_id');
    }

    // =========================================================================
    // SCOPES
    // =========================================================================

    /**
     * Solo membri attivi (accepted)
     */
    public function scopeActive($query)
    {
        return $query->where('status', self::STATUS_ACCEPTED);
    }

    /**
     * Solo inviti pendenti
     */
    public function scopePending($query)
    {
        return $query->where('status', self::STATUS_PENDING);
    }

    /**
     * Inviti pendenti non scaduti
     */
    public function scopePendingNotExpired($query)
    {
        return $query->where('status', self::STATUS_PENDING)
            ->where(function ($q) {
                $q->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now());
            });
    }

    /**
     * Per un tenant specifico
     */
    public function scopeForTenant($query, int $tenantId)
    {
        return $query->where('tenant_id', $tenantId);
    }

    // =========================================================================
    // METODI AZIONI
    // =========================================================================

    /**
     * Accetta l'invito
     */
    public function accept(?string $message = null): bool
    {
        if ($this->status !== self::STATUS_PENDING) {
            return false;
        }

        // Verifica scadenza
        if ($this->expires_at && $this->expires_at->isPast()) {
            $this->update(['status' => self::STATUS_EXPIRED]);
            return false;
        }

        // Verifica se l'aggregazione può accettare nuovi membri
        if (!$this->aggregation->canAcceptMoreMembers()) {
            return false;
        }

        return $this->update([
            'status' => self::STATUS_ACCEPTED,
            'responded_at' => now(),
            'joined_at' => now(),
            'response_message' => $message,
        ]);
    }

    /**
     * Rifiuta l'invito
     */
    public function reject(?string $message = null): bool
    {
        if ($this->status !== self::STATUS_PENDING) {
            return false;
        }

        return $this->update([
            'status' => self::STATUS_REJECTED,
            'responded_at' => now(),
            'response_message' => $message,
        ]);
    }

    /**
     * Lascia l'aggregazione
     */
    public function leave(?string $reason = null): bool
    {
        if ($this->status !== self::STATUS_ACCEPTED) {
            return false;
        }

        // Il creatore dell'aggregazione non può uscire (deve archiviare l'aggregazione)
        if ($this->tenant_id === $this->aggregation->created_by_tenant_id) {
            throw new \Exception("Il creatore non può abbandonare l'aggregazione. Archiviala invece.");
        }

        return $this->update([
            'status' => self::STATUS_LEFT,
            'left_at' => now(),
            'leave_reason' => $reason,
        ]);
    }

    /**
     * Rimuovi membro (solo admin)
     */
    public function remove(?string $reason = null): bool
    {
        if ($this->status !== self::STATUS_ACCEPTED) {
            return false;
        }

        return $this->update([
            'status' => self::STATUS_REMOVED,
            'left_at' => now(),
            'leave_reason' => $reason,
        ]);
    }

    // =========================================================================
    // METODI HELPER
    // =========================================================================

    /**
     * Verifica se è un membro attivo
     */
    public function isActive(): bool
    {
        return $this->status === self::STATUS_ACCEPTED;
    }

    /**
     * Verifica se l'invito è pendente
     */
    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    /**
     * Verifica se l'invito è scaduto
     */
    public function isExpired(): bool
    {
        if ($this->status === self::STATUS_EXPIRED) {
            return true;
        }

        if ($this->status === self::STATUS_PENDING && $this->expires_at) {
            return $this->expires_at->isPast();
        }

        return false;
    }

    /**
     * Verifica se il membro è admin
     */
    public function isAdmin(): bool
    {
        return $this->role === self::ROLE_ADMIN;
    }

    /**
     * Verifica un permesso specifico
     */
    public function hasPermission(string $permission): bool
    {
        // Se ha permessi custom, usa quelli
        if ($this->permissions && isset($this->permissions[$permission])) {
            return (bool) $this->permissions[$permission];
        }

        // Altrimenti usa le impostazioni dell'aggregazione
        $aggregation = $this->aggregation;

        return match ($permission) {
            'share_documents' => $aggregation->share_documents,
            'share_analytics' => $aggregation->share_analytics,
            'share_templates' => $aggregation->share_templates,
            'invite_members' => $aggregation->members_can_invite,
            default => false,
        };
    }
}
