<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

/**
 * Adapts the existing database for EGI-HUB deployment.
 *
 * The shared PostgreSQL database (florenceegi) already has:
 * - core.system_projects (basic project info)
 * - core.tenants (end customers with system_project_id FK)
 * - core.users (shared user table)
 * - core.personal_access_tokens (Sanctum)
 *
 * This migration:
 * 1. Adds EGI-HUB specific columns to system_projects
 * 2. Creates project_admins table (user-project role assignment)
 * 3. Creates project_activities table (activity logging)
 * 4. Adds is_super_admin to users
 */
return new class extends Migration
{
    public function up(): void
    {
        // 1. Add missing columns to system_projects
        Schema::table('system_projects', function (Blueprint $table) {
            if (!Schema::hasColumn('system_projects', 'slug')) {
                $table->string('slug')->nullable()->after('code');
            }
            if (!Schema::hasColumn('system_projects', 'description')) {
                $table->text('description')->nullable()->after('name');
            }
            if (!Schema::hasColumn('system_projects', 'url')) {
                $table->string('url')->nullable()->after('description');
            }
            if (!Schema::hasColumn('system_projects', 'production_url')) {
                $table->string('production_url')->nullable()->after('url');
            }
            if (!Schema::hasColumn('system_projects', 'staging_url')) {
                $table->string('staging_url')->nullable()->after('production_url');
            }
            if (!Schema::hasColumn('system_projects', 'api_key')) {
                $table->string('api_key')->nullable()->after('staging_url');
            }
            if (!Schema::hasColumn('system_projects', 'api_secret')) {
                $table->string('api_secret')->nullable()->after('api_key');
            }
            if (!Schema::hasColumn('system_projects', 'status')) {
                $table->string('status', 20)->default('active')->after('is_active');
            }
            if (!Schema::hasColumn('system_projects', 'metadata')) {
                $table->json('metadata')->nullable()->after('settings');
            }
            if (!Schema::hasColumn('system_projects', 'local_start_script')) {
                $table->string('local_start_script', 500)->nullable();
            }
            if (!Schema::hasColumn('system_projects', 'local_stop_script')) {
                $table->string('local_stop_script', 500)->nullable();
            }
            if (!Schema::hasColumn('system_projects', 'supervisor_program')) {
                $table->string('supervisor_program')->nullable();
            }
            if (!Schema::hasColumn('system_projects', 'last_health_check')) {
                $table->timestamp('last_health_check')->nullable();
            }
            if (!Schema::hasColumn('system_projects', 'is_healthy')) {
                $table->boolean('is_healthy')->default(true);
            }
            if (!Schema::hasColumn('system_projects', 'deleted_at')) {
                $table->softDeletes();
            }
        });

        // Populate slug from code for existing rows
        DB::statement("UPDATE system_projects SET slug = code WHERE slug IS NULL AND code IS NOT NULL");

        // 2. Create project_admins table
        if (!Schema::hasTable('project_admins')) {
            Schema::create('project_admins', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('project_id');
                $table->unsignedBigInteger('user_id');
                $table->string('role', 20)->default('viewer');
                $table->json('permissions')->nullable();
                $table->unsignedBigInteger('assigned_by')->nullable();
                $table->timestamp('assigned_at')->useCurrent();
                $table->timestamp('expires_at')->nullable();
                $table->boolean('is_active')->default(true);
                $table->text('notes')->nullable();
                $table->timestamps();

                $table->foreign('project_id')->references('id')->on('system_projects')->onDelete('cascade');
                $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
                $table->foreign('assigned_by')->references('id')->on('users')->onDelete('set null');

                $table->unique(['project_id', 'user_id']);
                $table->index('role');
                $table->index('is_active');
            });
        }

        // 3. Create project_activities table
        if (!Schema::hasTable('project_activities')) {
            Schema::create('project_activities', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('project_id');
                $table->string('type', 50);
                $table->string('action');
                $table->text('description')->nullable();
                $table->string('status', 20)->default('info');
                $table->string('endpoint', 500)->nullable();
                $table->string('method', 10)->nullable();
                $table->integer('response_code')->nullable();
                $table->integer('response_time_ms')->nullable();
                $table->json('metadata')->nullable();
                $table->string('ip_address', 45)->nullable();
                $table->text('user_agent')->nullable();
                $table->timestamps();

                $table->foreign('project_id')->references('id')->on('system_projects')->onDelete('cascade');

                $table->index('type');
                $table->index('status');
                $table->index('created_at');
                $table->index(['project_id', 'type']);
            });
        }

        // 4. Add is_super_admin to users
        if (!Schema::hasColumn('users', 'is_super_admin')) {
            Schema::table('users', function (Blueprint $table) {
                $table->boolean('is_super_admin')->default(false);
                $table->index('is_super_admin');
            });
        }
    }

    public function down(): void
    {
        // Remove is_super_admin from users
        if (Schema::hasColumn('users', 'is_super_admin')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropIndex(['is_super_admin']);
                $table->dropColumn('is_super_admin');
            });
        }

        Schema::dropIfExists('project_activities');
        Schema::dropIfExists('project_admins');

        // Remove added columns from system_projects
        $columnsToRemove = [
            'slug', 'description', 'url', 'production_url', 'staging_url',
            'api_key', 'api_secret', 'status', 'metadata',
            'local_start_script', 'local_stop_script', 'supervisor_program',
            'last_health_check', 'is_healthy', 'deleted_at',
        ];

        Schema::table('system_projects', function (Blueprint $table) use ($columnsToRemove) {
            foreach ($columnsToRemove as $col) {
                if (Schema::hasColumn('system_projects', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
