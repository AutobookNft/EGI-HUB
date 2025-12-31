<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Model ProjectAdmin
 * 
 * Gestisce l'associazione tra utenti e progetti con ruoli/permessi.
 * Ogni utente può essere assegnato a più progetti con ruoli diversi.
 * 
 * @property int $id
 * @property int $project_id
 * @property int $user_id
 * @property string $role (owner|admin|viewer)
 * @property array|null $permissions
 * @property int|null $assigned_by
 * @property \Carbon\Carbon $assigned_at
 * @property \Carbon\Carbon|null $expires_at
 * @property bool $is_active
 * @property string|null $notes
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 * 
 * @property-read Project $project
 * @property-read User $user
 * @property-read User|null $assignedBy
 */
class ProjectAdmin extends Model
{
    use HasFactory;

    /**
     * The connection name for the model.
     *
     * @var string|null
     */
    protected $connection = 'mariadb';

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'project_id',
        'user_id',
        'role',
        'permissions',
        'assigned_by',
        'assigned_at',
        'expires_at',
        'is_active',
        'notes',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'permissions' => 'array',
        'assigned_at' => 'datetime',
        'expires_at' => 'datetime',
        'is_active' => 'boolean',
    ];

    /**
     * Ruoli disponibili per i project admin
     */
    public const ROLE_OWNER = 'owner';
    public const ROLE_ADMIN = 'admin';
    public const ROLE_VIEWER = 'viewer';

    /**
     * Permessi di default per ogni ruolo
     */
    public const DEFAULT_PERMISSIONS = [
        self::ROLE_OWNER => [
            'can_manage_tenants' => true,
            'can_manage_settings' => true,
            'can_manage_admins' => true,
            'can_view_logs' => true,
            'can_export' => true,
            'can_delete' => true,
        ],
        self::ROLE_ADMIN => [
            'can_manage_tenants' => true,
            'can_manage_settings' => true,
            'can_manage_admins' => false,
            'can_view_logs' => true,
            'can_export' => true,
            'can_delete' => false,
        ],
        self::ROLE_VIEWER => [
            'can_manage_tenants' => false,
            'can_manage_settings' => false,
            'can_manage_admins' => false,
            'can_view_logs' => true,
            'can_export' => false,
            'can_delete' => false,
        ],
    ];

    // ==========================================
    // RELAZIONI
    // ==========================================

    /**
     * Il progetto a cui è assegnato questo admin
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * L'utente che ha questo ruolo
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * L'utente che ha assegnato questo ruolo
     */
    public function assignedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_by');
    }

    // ==========================================
    // SCOPES
    // ==========================================

    /**
     * Scope per filtrare solo record attivi e non scaduti
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true)
                     ->where(function ($q) {
                         $q->whereNull('expires_at')
                           ->orWhere('expires_at', '>', now());
                     });
    }

    /**
     * Scope per filtrare per ruolo
     */
    public function scopeWithRole($query, string $role)
    {
        return $query->where('role', $role);
    }

    /**
     * Scope per filtrare per progetto
     */
    public function scopeForProject($query, int $projectId)
    {
        return $query->where('project_id', $projectId);
    }

    /**
     * Scope per filtrare per utente
     */
    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    // ==========================================
    // METODI HELPER
    // ==========================================

    /**
     * Verifica se l'admin è attivo e non scaduto
     */
    public function isValid(): bool
    {
        if (!$this->is_active) {
            return false;
        }

        if ($this->expires_at && $this->expires_at->isPast()) {
            return false;
        }

        return true;
    }

    /**
     * Verifica se l'admin è owner del progetto
     */
    public function isOwner(): bool
    {
        return $this->role === self::ROLE_OWNER;
    }

    /**
     * Verifica se l'admin ha almeno ruolo admin
     */
    public function isAtLeastAdmin(): bool
    {
        return in_array($this->role, [self::ROLE_OWNER, self::ROLE_ADMIN]);
    }

    /**
     * Verifica se ha un permesso specifico
     * Prima controlla i permessi custom, poi quelli di default del ruolo
     */
    public function hasPermission(string $permission): bool
    {
        // Controlla permessi custom
        if ($this->permissions && isset($this->permissions[$permission])) {
            return (bool) $this->permissions[$permission];
        }

        // Fallback ai permessi di default del ruolo
        return self::DEFAULT_PERMISSIONS[$this->role][$permission] ?? false;
    }

    /**
     * Ottieni tutti i permessi effettivi (merge di custom + default)
     */
    public function getEffectivePermissions(): array
    {
        $defaults = self::DEFAULT_PERMISSIONS[$this->role] ?? [];
        $custom = $this->permissions ?? [];

        return array_merge($defaults, $custom);
    }

    /**
     * Verifica se può gestire un altro admin (solo owner)
     */
    public function canManageAdmin(ProjectAdmin $other): bool
    {
        // Solo owner può gestire altri admin
        if (!$this->isOwner()) {
            return false;
        }

        // Non può gestire se stesso
        if ($this->id === $other->id) {
            return false;
        }

        return true;
    }

    /**
     * Sospendi temporaneamente l'accesso
     */
    public function suspend(?string $reason = null): self
    {
        $this->update([
            'is_active' => false,
            'notes' => $reason ?? $this->notes,
        ]);

        return $this;
    }

    /**
     * Riattiva l'accesso
     */
    public function reactivate(): self
    {
        $this->update([
            'is_active' => true,
        ]);

        return $this;
    }

    /**
     * Prolunga la scadenza
     */
    public function extendExpiration(\DateTimeInterface $newExpiration): self
    {
        $this->update([
            'expires_at' => $newExpiration,
        ]);

        return $this;
    }

    /**
     * Ottieni etichetta leggibile del ruolo
     */
    public function getRoleLabelAttribute(): string
    {
        return match($this->role) {
            self::ROLE_OWNER => 'Project Owner',
            self::ROLE_ADMIN => 'Project Admin',
            self::ROLE_VIEWER => 'Viewer',
            default => 'Unknown',
        };
    }

    /**
     * Ottieni colore badge del ruolo (per UI)
     */
    public function getRoleBadgeColorAttribute(): string
    {
        return match($this->role) {
            self::ROLE_OWNER => 'badge-primary',
            self::ROLE_ADMIN => 'badge-success',
            self::ROLE_VIEWER => 'badge-info',
            default => 'badge-ghost',
        };
    }
}
