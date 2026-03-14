<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\BootstrapStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @package App\Models
 * @author Padmin D. Curtis (AI Partner OS3.0) for Fabio Cherici
 * @version 1.0.0 (EGI-HUB - TenantAdminBootstrap)
 * @date 2026-03-13
 * @purpose Model per il ciclo di vita dell'onboarding degli amministratori tenant
 *
 * @property int $id
 * @property int $system_project_id
 * @property int $tenant_id
 * @property int|null $user_id
 * @property int|null $contract_id
 * @property string $first_name_snapshot
 * @property string $last_name_snapshot
 * @property string $email_snapshot
 * @property string|null $phone_snapshot
 * @property string|null $job_title_snapshot
 * @property BootstrapStatus $status
 * @property string|null $invitation_token_hash
 * @property \Carbon\Carbon|null $invitation_sent_at
 * @property \Carbon\Carbon|null $invitation_expires_at
 * @property \Carbon\Carbon|null $activated_at
 * @property \Carbon\Carbon|null $suspended_at
 * @property \Carbon\Carbon|null $revoked_at
 * @property int $created_by
 * @property int|null $updated_by
 * @property int|null $revoked_by
 * @property string|null $notes
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 */
class TenantAdminBootstrap extends Model
{
    use HasFactory;

    protected $connection = 'pgsql';

    protected $table = 'tenant_admin_bootstraps';

    protected $fillable = [
        'system_project_id',
        'tenant_id',
        'user_id',
        'contract_id',
        'first_name_snapshot',
        'last_name_snapshot',
        'email_snapshot',
        'phone_snapshot',
        'job_title_snapshot',
        'status',
        'invitation_token_hash',
        'invitation_sent_at',
        'invitation_expires_at',
        'activated_at',
        'suspended_at',
        'revoked_at',
        'created_by',
        'updated_by',
        'revoked_by',
        'notes',
    ];

    protected $casts = [
        'status'                 => BootstrapStatus::class,
        'invitation_sent_at'     => 'datetime',
        'invitation_expires_at'  => 'datetime',
        'activated_at'           => 'datetime',
        'suspended_at'           => 'datetime',
        'revoked_at'             => 'datetime',
    ];

    // =========================================================================
    // RELAZIONI
    // =========================================================================

    /** Il progetto SaaS di appartenenza. */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class, 'system_project_id');
    }

    /** Il tenant a cui è destinato l'admin. */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'tenant_id');
    }

    /** Il contratto che ha originato questo bootstrap. */
    public function contract(): BelongsTo
    {
        return $this->belongsTo(Contract::class, 'contract_id');
    }

    /** L'utente creato a completamento dell'attivazione (nullable). */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /** Il SuperAdmin che ha creato il bootstrap. */
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /** L'ultimo SuperAdmin che ha modificato il record. */
    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /** Il SuperAdmin che ha revocato il bootstrap. */
    public function revokedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'revoked_by');
    }

    // =========================================================================
    // SCOPES
    // =========================================================================

    public function scopePending(Builder $query): Builder
    {
        return $query->where('status', BootstrapStatus::Pending->value);
    }

    public function scopeInvited(Builder $query): Builder
    {
        return $query->where('status', BootstrapStatus::Invited->value);
    }

    public function scopeActivated(Builder $query): Builder
    {
        return $query->where('status', BootstrapStatus::Activated->value);
    }

    public function scopeSuspended(Builder $query): Builder
    {
        return $query->where('status', BootstrapStatus::Suspended->value);
    }

    public function scopeRevoked(Builder $query): Builder
    {
        return $query->where('status', BootstrapStatus::Revoked->value);
    }

    public function scopeForProject(Builder $query, int $projectId): Builder
    {
        return $query->where('system_project_id', $projectId);
    }

    public function scopeForTenant(Builder $query, int $tenantId): Builder
    {
        return $query->where('tenant_id', $tenantId);
    }

    // =========================================================================
    // HELPERS
    // =========================================================================

    /**
     * Verifica se il bootstrap può passare allo stato activated.
     * Richiede stato invited e token non scaduto.
     */
    public function isActivatable(): bool
    {
        if (! $this->status->canBeActivated()) {
            return false;
        }

        if ($this->invitation_expires_at && $this->invitation_expires_at->isPast()) {
            return false;
        }

        return true;
    }

    /**
     * Verifica se è possibile inviare un nuovo invito.
     * Permette reinvio se lo stato è pending o invited.
     */
    public function canResendInvite(): bool
    {
        return $this->status->canBeInvited();
    }

    /**
     * Verifica se il token di invito è scaduto.
     */
    public function isExpired(): bool
    {
        if ($this->invitation_expires_at === null) {
            return false;
        }

        return $this->invitation_expires_at->isPast();
    }
}
