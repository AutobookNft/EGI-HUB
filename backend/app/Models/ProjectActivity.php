<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * ProjectActivity Model
 * 
 * Tracks all activities and events related to a project.
 * Used for monitoring, debugging, and analytics.
 * 
 * @property int $id
 * @property int $project_id
 * @property string $type
 * @property string $action
 * @property string|null $description
 * @property string $status
 * @property string|null $endpoint
 * @property string|null $method
 * @property int|null $response_code
 * @property int|null $response_time_ms
 * @property array|null $metadata
 * @property string|null $ip_address
 * @property string|null $user_agent
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 */
class ProjectActivity extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     */
    protected $table = 'project_activities';

    /**
     * Activity types
     */
    const TYPE_HEALTH_CHECK = 'health_check';
    const TYPE_API_CALL = 'api_call';
    const TYPE_PROXY = 'proxy';
    const TYPE_SYNC = 'sync';
    const TYPE_CONFIG = 'config';
    const TYPE_ERROR = 'error';
    const TYPE_AUTH = 'auth';

    /**
     * Status constants
     */
    const STATUS_SUCCESS = 'success';
    const STATUS_WARNING = 'warning';
    const STATUS_ERROR = 'error';
    const STATUS_INFO = 'info';

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'project_id',
        'type',
        'action',
        'description',
        'status',
        'endpoint',
        'method',
        'response_code',
        'response_time_ms',
        'metadata',
        'ip_address',
        'user_agent',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'metadata' => 'array',
        'response_code' => 'integer',
        'response_time_ms' => 'integer',
    ];

    // =========================================================================
    // RELATIONSHIPS
    // =========================================================================

    /**
     * Relationship: belongs to a Project
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    // =========================================================================
    // SCOPES
    // =========================================================================

    /**
     * Scope: filter by type
     */
    public function scopeOfType($query, string $type)
    {
        return $query->where('type', $type);
    }

    /**
     * Scope: filter by status
     */
    public function scopeWithStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope: only errors
     */
    public function scopeErrors($query)
    {
        return $query->where('status', self::STATUS_ERROR);
    }

    /**
     * Scope: recent activities (last N hours)
     */
    public function scopeRecent($query, int $hours = 24)
    {
        return $query->where('created_at', '>=', now()->subHours($hours));
    }

    /**
     * Scope: for a specific project
     */
    public function scopeForProject($query, int $projectId)
    {
        return $query->where('project_id', $projectId);
    }

    // =========================================================================
    // STATIC LOGGING METHODS
    // =========================================================================

    /**
     * Create a health check activity
     */
    public static function logHealthCheck(
        Project $project, 
        bool $isHealthy, 
        int $responseCode, 
        float $responseTimeMs
    ): self {
        return self::create([
            'project_id' => $project->id,
            'type' => self::TYPE_HEALTH_CHECK,
            'action' => 'Health Check',
            'description' => $isHealthy ? 'Project is healthy' : 'Project health check failed',
            'status' => $isHealthy ? self::STATUS_SUCCESS : self::STATUS_ERROR,
            'endpoint' => $project->url,
            'method' => 'GET',
            'response_code' => $responseCode,
            'response_time_ms' => (int) $responseTimeMs,
        ]);
    }

    /**
     * Create a proxy request activity
     */
    public static function logProxyRequest(
        Project $project,
        string $method,
        string $endpoint,
        int $responseCode,
        float $responseTimeMs,
        bool $success = true
    ): self {
        return self::create([
            'project_id' => $project->id,
            'type' => self::TYPE_PROXY,
            'action' => "Proxy {$method}",
            'description' => "Proxied {$method} request to {$endpoint}",
            'status' => $success ? self::STATUS_SUCCESS : self::STATUS_ERROR,
            'endpoint' => $endpoint,
            'method' => $method,
            'response_code' => $responseCode,
            'response_time_ms' => (int) $responseTimeMs,
        ]);
    }

    /**
     * Create an error activity
     */
    public static function logError(
        Project $project,
        string $action,
        string $description,
        array $metadata = []
    ): self {
        return self::create([
            'project_id' => $project->id,
            'type' => self::TYPE_ERROR,
            'action' => $action,
            'description' => $description,
            'status' => self::STATUS_ERROR,
            'metadata' => $metadata,
        ]);
    }

    /**
     * Create an info activity
     */
    public static function logInfo(
        Project $project,
        string $action,
        string $description,
        array $metadata = []
    ): self {
        return self::create([
            'project_id' => $project->id,
            'type' => self::TYPE_CONFIG,
            'action' => $action,
            'description' => $description,
            'status' => self::STATUS_INFO,
            'metadata' => $metadata,
        ]);
    }

    // =========================================================================
    // HELPERS
    // =========================================================================

    /**
     * Get status color for UI
     */
    public function getStatusColor(): string
    {
        return match($this->status) {
            self::STATUS_SUCCESS => 'success',
            self::STATUS_WARNING => 'warning',
            self::STATUS_ERROR => 'error',
            self::STATUS_INFO => 'info',
            default => 'neutral',
        };
    }

    /**
     * Get type icon for UI
     */
    public function getTypeIcon(): string
    {
        return match($this->type) {
            self::TYPE_HEALTH_CHECK => 'activity',
            self::TYPE_API_CALL => 'zap',
            self::TYPE_PROXY => 'arrow-right-left',
            self::TYPE_SYNC => 'refresh-cw',
            self::TYPE_CONFIG => 'settings',
            self::TYPE_ERROR => 'alert-triangle',
            self::TYPE_AUTH => 'lock',
            default => 'info',
        };
    }
}
