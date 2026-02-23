<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

/**
 * DaemonProcess Model
 *
 * Rappresenta un processo daemon gestito via Supervisor.
 * Sostituisce la gestione daemon di Laravel Forge.
 */
class DaemonProcess extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'daemon_processes';

    const STATUS_RUNNING  = 'running';
    const STATUS_STOPPED  = 'stopped';
    const STATUS_STARTING = 'starting';
    const STATUS_ERROR    = 'error';
    const STATUS_UNKNOWN  = 'unknown';

    protected $fillable = [
        'name',
        'slug',
        'supervisor_program',
        'command',
        'directory',
        'user',
        'numprocs',
        'autostart',
        'autorestart',
        'startsecs',
        'startretries',
        'stopwaitsecs',
        'stopsignal',
        'stdout_logfile',
        'stderr_logfile',
        'stdout_logfile_maxbytes',
        'stderr_logfile_maxbytes',
        'project_id',
        'status',
        'environment',
        'metadata',
        'last_status_check',
    ];

    protected $casts = [
        'metadata'              => 'array',
        'autostart'             => 'boolean',
        'autorestart'           => 'boolean',
        'numprocs'              => 'integer',
        'startsecs'             => 'integer',
        'startretries'          => 'integer',
        'stopwaitsecs'          => 'integer',
        'stdout_logfile_maxbytes' => 'integer',
        'stderr_logfile_maxbytes' => 'integer',
        'last_status_check'     => 'datetime',
    ];

    protected $attributes = [
        'status' => self::STATUS_UNKNOWN,
        'user' => 'forge',
        'numprocs' => 1,
        'autostart' => true,
        'autorestart' => true,
        'startsecs' => 1,
        'startretries' => 3,
        'stopwaitsecs' => 10,
        'stopsignal' => 'TERM',
        'stdout_logfile_maxbytes' => 5242880,
        'stderr_logfile_maxbytes' => 5242880,
    ];

    // =========================================================================
    // BOOT
    // =========================================================================

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function ($model) {
            if (!$model->slug) {
                $model->slug = Str::slug($model->name);
            }
            if (!$model->supervisor_program) {
                $model->supervisor_program = $model->slug;
            }
            if (!$model->stdout_logfile) {
                $model->stdout_logfile = "/var/log/{$model->slug}.out.log";
            }
            if (!$model->stderr_logfile) {
                $model->stderr_logfile = "/var/log/{$model->slug}.err.log";
            }
        });
    }

    // =========================================================================
    // RELATIONSHIPS
    // =========================================================================

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class, 'project_id');
    }

    // =========================================================================
    // SCOPES
    // =========================================================================

    public function scopeRunning($query)
    {
        return $query->where('status', self::STATUS_RUNNING);
    }

    public function scopeStopped($query)
    {
        return $query->where('status', self::STATUS_STOPPED);
    }

    // =========================================================================
    // HELPERS
    // =========================================================================

    public function isRunning(): bool
    {
        return $this->status === self::STATUS_RUNNING;
    }

    public function getStatusColor(): string
    {
        return match ($this->status) {
            self::STATUS_RUNNING  => 'success',
            self::STATUS_STOPPED  => 'warning',
            self::STATUS_STARTING => 'info',
            self::STATUS_ERROR    => 'error',
            default               => 'neutral',
        };
    }

    /**
     * Genera il contenuto del file .conf per supervisor.
     */
    public function getSupervisorConfContent(): string
    {
        $program = $this->supervisor_program;
        $maxbytesStdout = $this->formatBytes($this->stdout_logfile_maxbytes);
        $maxbytesStderr = $this->formatBytes($this->stderr_logfile_maxbytes);

        $conf = "[program:{$program}]\n";
        $conf .= "command={$this->command}\n";

        if ($this->directory) {
            $conf .= "directory={$this->directory}\n";
        }

        $conf .= "user={$this->user}\n";
        $conf .= "autostart=" . ($this->autostart ? 'true' : 'false') . "\n";
        $conf .= "autorestart=" . ($this->autorestart ? 'true' : 'false') . "\n";
        $conf .= "startsecs={$this->startsecs}\n";
        $conf .= "startretries={$this->startretries}\n";
        $conf .= "stopwaitsecs={$this->stopwaitsecs}\n";
        $conf .= "stopsignal={$this->stopsignal}\n";
        $conf .= "numprocs={$this->numprocs}\n";
        $conf .= "stdout_logfile={$this->stdout_logfile}\n";
        $conf .= "stderr_logfile={$this->stderr_logfile}\n";
        $conf .= "stdout_logfile_maxbytes={$maxbytesStdout}\n";
        $conf .= "stderr_logfile_maxbytes={$maxbytesStderr}\n";

        if ($this->environment) {
            $conf .= "environment={$this->environment}\n";
        }

        return $conf;
    }

    protected function formatBytes(int $bytes): string
    {
        if ($bytes >= 1048576) {
            return round($bytes / 1048576) . 'MB';
        }
        if ($bytes >= 1024) {
            return round($bytes / 1024) . 'KB';
        }
        return $bytes . 'B';
    }
}
