<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\BillingPeriod;
use App\Enums\ContractStatus;
use App\Enums\ContractType;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @package App\Models
 * @author Padmin D. Curtis (AI Partner OS3.0) for Fabio Cherici
 * @version 1.0.0 (EGI-HUB - Contracts)
 * @date 2026-03-14
 * @purpose Contratto tra FlorenceEGI e un tenant — precede sempre l'onboarding dell'admin
 */
class Contract extends Model
{
    use HasFactory, SoftDeletes;

    protected $connection = 'pgsql';
    protected $table      = 'contracts';

    protected $fillable = [
        'tenant_id',
        'system_project_id',
        'contract_number',
        'contract_type',
        'status',
        'parent_contract_id',
        'signatory_name',
        'signatory_email',
        'signatory_role',
        'signatory_is_admin',
        'signed_at',
        'value',
        'currency',
        'billing_period',
        'start_date',
        'end_date',
        'document_url',
        'notes',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'status'             => ContractStatus::class,
        'contract_type'      => ContractType::class,
        'billing_period'     => BillingPeriod::class,
        'signatory_is_admin' => 'boolean',
        'signed_at'          => 'datetime',
        'start_date'         => 'date',
        'end_date'           => 'date',
        'value'              => 'decimal:2',
    ];

    // =========================================================================
    // RELAZIONI
    // =========================================================================

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'tenant_id');
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class, 'system_project_id');
    }

    /** Contratto padre (se questo è un rinnovo) */
    public function parentContract(): BelongsTo
    {
        return $this->belongsTo(Contract::class, 'parent_contract_id');
    }

    /** Rinnovi generati da questo contratto */
    public function renewals(): HasMany
    {
        return $this->hasMany(Contract::class, 'parent_contract_id');
    }

    /** Bootstrap degli admin collegati a questo contratto */
    public function adminBootstraps(): HasMany
    {
        return $this->hasMany(TenantAdminBootstrap::class, 'contract_id');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    // =========================================================================
    // SCOPES
    // =========================================================================

    public function scopeActive(Builder $q): Builder
    {
        return $q->where('status', ContractStatus::Active->value);
    }

    public function scopeDraft(Builder $q): Builder
    {
        return $q->where('status', ContractStatus::Draft->value);
    }

    public function scopeExpired(Builder $q): Builder
    {
        return $q->where('status', ContractStatus::Expired->value);
    }

    public function scopeForTenant(Builder $q, int $tenantId): Builder
    {
        return $q->where('tenant_id', $tenantId);
    }

    public function scopeForProject(Builder $q, int $projectId): Builder
    {
        return $q->where('system_project_id', $projectId);
    }

    /** Contratti scaduti per data ma non ancora marcati expired */
    public function scopeOverdue(Builder $q): Builder
    {
        return $q->where('status', ContractStatus::Active->value)
                 ->whereNotNull('end_date')
                 ->where('end_date', '<', now()->toDateString());
    }

    // =========================================================================
    // HELPERS
    // =========================================================================

    public function isPerpetual(): bool
    {
        return $this->end_date === null;
    }

    public function isExpired(): bool
    {
        if ($this->isPerpetual()) {
            return false;
        }
        return $this->end_date->isPast();
    }

    public function canBeRenewed(): bool
    {
        return $this->status->canBeRenewed();
    }

    public function canBeActivated(): bool
    {
        return $this->status->canBeActivated();
    }

    /**
     * Crea un contratto di rinnovo partendo da questo.
     * Il nuovo contratto eredita tenant, progetto e tipo.
     * Lo stato del corrente passa a 'renewed'.
     */
    public function createRenewal(array $overrides = []): self
    {
        $renewal = self::create(array_merge([
            'tenant_id'         => $this->tenant_id,
            'system_project_id' => $this->system_project_id,
            'contract_type'     => $this->contract_type,
            'status'            => ContractStatus::Draft,
            'parent_contract_id'=> $this->id,
            'signatory_name'    => $this->signatory_name,
            'signatory_email'   => $this->signatory_email,
            'signatory_role'    => $this->signatory_role,
            'signatory_is_admin'=> $this->signatory_is_admin,
            'currency'          => $this->currency,
            'billing_period'    => $this->billing_period,
            'value'             => $this->value,
            'start_date'        => $this->end_date?->addDay() ?? now()->toDateString(),
            'created_by'        => $overrides['created_by'] ?? $this->created_by,
        ], $overrides));

        $this->update(['status' => ContractStatus::Renewed]);

        return $renewal;
    }

    /**
     * Genera il prossimo numero contratto per un progetto.
     * Formato: EGI-YYYY-NNN
     */
    public static function generateContractNumber(int $systemProjectId): string
    {
        $year = now()->year;
        $prefix = 'EGI-' . $year . '-';

        $last = self::where('contract_number', 'like', $prefix . '%')
            ->orderByDesc('contract_number')
            ->value('contract_number');

        $seq = $last ? ((int) substr($last, -3)) + 1 : 1;

        return $prefix . str_pad((string) $seq, 3, '0', STR_PAD_LEFT);
    }
}
