<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migrazione: Creazione tabella tenants
 * 
 * I tenant sono i clienti finali dei progetti SaaS.
 * Ogni tenant appartiene a UN progetto specifico.
 * 
 * Esempi:
 * - NATAN_LOC (project) → Comune di Firenze, Comune di Prato (tenants)
 * - FlorenceArtEGI (project) → Galleria Uffizi, Artista X (tenants)
 * 
 * NOTA: FlorenceArtEGI è mono-tenant, quindi avrà un solo tenant
 * o potrebbe non usare questa tabella.
 * 
 * @author Fabio Cherici
 * @date 2025-12-05
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('tenants', function (Blueprint $table) {
            $table->id();
            
            // Riferimento al progetto di appartenenza
            $table->foreignId('project_id')
                ->constrained('projects')
                ->onDelete('cascade')
                ->comment('Progetto SaaS di appartenenza');
            
            // Identificazione tenant
            $table->string('name', 255)->comment('Nome tenant (es. Comune di Firenze)');
            $table->string('slug', 100)->comment('Slug URL-friendly');
            $table->text('description')->nullable()->comment('Descrizione del tenant');
            
            // URL e accesso
            $table->string('url', 500)->nullable()->comment('URL specifico del tenant');
            $table->string('subdomain', 100)->nullable()->comment('Sottodominio assegnato');
            
            // Configurazione
            $table->json('settings')->nullable()->comment('Impostazioni specifiche tenant');
            $table->json('metadata')->nullable()->comment('Metadati aggiuntivi');
            
            // Contatto principale
            $table->string('contact_name', 255)->nullable()->comment('Nome referente');
            $table->string('contact_email', 255)->nullable()->comment('Email referente');
            $table->string('contact_phone', 50)->nullable()->comment('Telefono referente');
            
            // Stato
            $table->enum('status', ['active', 'inactive', 'suspended', 'trial'])
                ->default('active')
                ->comment('Stato del tenant');
            
            // Subscription/Piano
            $table->string('plan', 50)->nullable()->comment('Piano sottoscritto');
            $table->timestamp('trial_ends_at')->nullable()->comment('Fine periodo trial');
            $table->timestamp('subscription_ends_at')->nullable()->comment('Fine sottoscrizione');
            
            // Health check
            $table->boolean('is_healthy')->default(true)->comment('Stato di salute');
            $table->timestamp('last_health_check')->nullable()->comment('Ultimo health check');
            
            // Timestamps e soft delete
            $table->timestamps();
            $table->softDeletes();
            
            // Indici
            $table->unique(['project_id', 'slug'], 'tenants_project_slug_unique');
            $table->index('status');
            $table->index('subdomain');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tenants');
    }
};
