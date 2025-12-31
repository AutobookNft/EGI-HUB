<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasApiTokens;

    /**
     * The connection name for the model.
     *
     * @var string|null
     */
    protected $connection = 'pgsql';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'is_super_admin',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_super_admin' => 'boolean',
        ];
    }

    // ==========================================
    // RELAZIONI PROJECT ADMIN
    // ==========================================

    /**
     * Tutti i record ProjectAdmin di questo utente
     */
    public function projectAdminRecords(): HasMany
    {
        return $this->hasMany(ProjectAdmin::class);
    }

    /**
     * Tutti i progetti a cui questo utente ha accesso
     */
    public function projects(): BelongsToMany
    {
        return $this->belongsToMany(Project::class, 'project_admins')
                    ->withPivot(['role', 'permissions', 'is_active', 'expires_at'])
                    ->withTimestamps();
    }

    /**
     * Progetti di cui l'utente è owner
     */
    public function ownedProjects(): BelongsToMany
    {
        return $this->projects()->wherePivot('role', ProjectAdmin::ROLE_OWNER);
    }

    /**
     * Progetti a cui l'utente ha accesso attivo
     */
    public function activeProjects(): BelongsToMany
    {
        return $this->projects()
                    ->wherePivot('is_active', true)
                    ->where(function ($query) {
                        $query->whereNull('project_admins.expires_at')
                              ->orWhere('project_admins.expires_at', '>', now());
                    });
    }

    // ==========================================
    // METODI HELPER
    // ==========================================

    /**
     * Verifica se l'utente è Super Admin EGI
     */
    public function isSuperAdmin(): bool
    {
        return $this->is_super_admin ?? false;
    }

    /**
     * Verifica se l'utente ha accesso a un progetto specifico
     */
    public function hasAccessToProject(Project $project): bool
    {
        // Super Admin ha accesso a tutto
        if ($this->isSuperAdmin()) {
            return true;
        }

        return $this->activeProjects()->where('projects.id', $project->id)->exists();
    }

    /**
     * Ottieni il record ProjectAdmin per un progetto specifico
     */
    public function getProjectAdminRecord(Project $project): ?ProjectAdmin
    {
        return $this->projectAdminRecords()
                    ->forProject($project->id)
                    ->active()
                    ->first();
    }

    /**
     * Verifica se l'utente è owner di un progetto
     */
    public function isOwnerOf(Project $project): bool
    {
        if ($this->isSuperAdmin()) {
            return true;
        }

        $record = $this->getProjectAdminRecord($project);
        return $record && $record->isOwner();
    }

    /**
     * Verifica se l'utente è almeno admin di un progetto
     */
    public function isAdminOf(Project $project): bool
    {
        if ($this->isSuperAdmin()) {
            return true;
        }

        $record = $this->getProjectAdminRecord($project);
        return $record && $record->isAtLeastAdmin();
    }

    /**
     * Verifica un permesso specifico su un progetto
     */
    public function hasProjectPermission(Project $project, string $permission): bool
    {
        if ($this->isSuperAdmin()) {
            return true;
        }

        $record = $this->getProjectAdminRecord($project);
        return $record && $record->hasPermission($permission);
    }
}
