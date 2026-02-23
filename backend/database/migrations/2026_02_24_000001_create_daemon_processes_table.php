<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Creates daemon_processes table for managing supervisor daemons from EGI-HUB.
 * Replaces Laravel Forge daemon management functionality.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('daemon_processes', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('supervisor_program')->unique();
            $table->string('command', 1000);
            $table->string('directory', 500)->nullable();
            $table->string('user', 100)->default('forge');
            $table->unsignedSmallInteger('numprocs')->default(1);
            $table->boolean('autostart')->default(true);
            $table->boolean('autorestart')->default(true);
            $table->unsignedSmallInteger('startsecs')->default(1);
            $table->unsignedSmallInteger('startretries')->default(3);
            $table->unsignedSmallInteger('stopwaitsecs')->default(10);
            $table->string('stopsignal', 10)->default('TERM');
            $table->string('stdout_logfile', 500)->nullable();
            $table->string('stderr_logfile', 500)->nullable();
            $table->unsignedBigInteger('stdout_logfile_maxbytes')->default(5242880);
            $table->unsignedBigInteger('stderr_logfile_maxbytes')->default(5242880);
            $table->unsignedBigInteger('project_id')->nullable();
            $table->string('status', 20)->default('unknown');
            $table->string('environment', 2000)->nullable();
            $table->json('metadata')->nullable();
            $table->timestamp('last_status_check')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('project_id')
                  ->references('id')
                  ->on('system_projects')
                  ->onDelete('set null');

            $table->index('status');
            $table->index('project_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('daemon_processes');
    }
};
