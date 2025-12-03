<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Rinomina la tabella 'tenants' in 'projects' per chiarezza semantica.
     * 
     * In EGI-HUB, i "projects" sono le applicazioni SaaS (NATAN_LOC, EGI, etc.)
     * mentre i "tenants" sono i clienti finali di ogni progetto (Comuni, Gallerie, etc.)
     * 
     * @author Fabio Cherici
     * @date 2025-12-03
     */
    public function up(): void
    {
        // Rinomina la tabella principale
        Schema::rename('tenants', 'projects');
        
        // Rinomina anche la tabella delle attività se esiste
        if (Schema::hasTable('tenant_activities')) {
            Schema::rename('tenant_activities', 'project_activities');
            
            // Rinomina la colonna tenant_id in project_id
            Schema::table('project_activities', function (Blueprint $table) {
                $table->renameColumn('tenant_id', 'project_id');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Rinomina la colonna project_id in tenant_id
        if (Schema::hasTable('project_activities')) {
            Schema::table('project_activities', function (Blueprint $table) {
                $table->renameColumn('project_id', 'tenant_id');
            });
            
            Schema::rename('project_activities', 'tenant_activities');
        }
        
        Schema::rename('projects', 'tenants');
    }
};
