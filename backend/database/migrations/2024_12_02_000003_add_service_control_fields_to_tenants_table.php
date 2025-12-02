<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Aggiunge i campi per il controllo dei servizi tenant:
     * - local_script_path: percorso script per ambiente dev locale
     * - supervisor_program: nome programma Supervisor per produzione (Forge)
     */
    public function up(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            // Percorso script locale (es: /home/fabio/dev/NATAN_LOC/start_services.sh)
            $table->string('local_start_script')->nullable()->after('metadata');
            $table->string('local_stop_script')->nullable()->after('local_start_script');
            
            // Nome programma Supervisor per produzione (es: tenant-natan)
            $table->string('supervisor_program')->nullable()->after('local_stop_script');
            
            // URL produzione (es: natan.florenceegi.com) vs URL staging (es: natan_loc.13.48.57.194.sslip.io)
            $table->string('production_url')->nullable()->after('url');
            $table->string('staging_url')->nullable()->after('production_url');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->dropColumn([
                'local_start_script',
                'local_stop_script', 
                'supervisor_program',
                'production_url',
                'staging_url',
            ]);
        });
    }
};
