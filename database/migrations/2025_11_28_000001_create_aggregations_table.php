<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migrazione: Creazione tabella aggregations
 * 
 * Le aggregazioni sono gruppi consensuali di tenant che decidono
 * di condividere i propri dati. A differenza di una gerarchia parent-child,
 * ogni tenant può partecipare a multiple aggregazioni e uscirne liberamente.
 * 
 * ARCHITETTURA P2P:
 * - Qualsiasi tenant può creare un'aggregazione
 * - I membri vengono invitati e devono accettare
 * - Un tenant può essere in N aggregazioni contemporaneamente
 * - Le aggregazioni sono peer-to-peer, non gerarchiche
 * 
 * @package FlorenceEgi\CoreModels
 * @author Fabio Cherici
 * @version 1.0.0
 * @date 2025-11-28
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('aggregations', function (Blueprint $table) {
            $table->id();
            
            // Identificazione aggregazione
            $table->string('name', 100)->comment('Nome descrittivo aggregazione');
            $table->string('slug', 100)->unique()->comment('Slug URL-friendly');
            $table->text('description')->nullable()->comment('Descrizione scopo aggregazione');
            
            // Chi ha creato l'aggregazione
            $table->foreignId('created_by_tenant_id')
                ->constrained('tenants')
                ->onDelete('cascade')
                ->comment('Tenant che ha creato aggregazione');
            
            // Stato
            $table->enum('status', ['active', 'suspended', 'archived'])
                ->default('active')
                ->comment('Stato aggregazione');
            
            // Configurazioni
            $table->json('settings')->nullable()->comment('Impostazioni aggregazione (permessi, limiti, etc.)');
            
            // Opzioni di condivisione dati
            $table->boolean('share_documents')->default(true)->comment('Condividi documenti/atti');
            $table->boolean('share_analytics')->default(false)->comment('Condividi analytics aggregati');
            $table->boolean('share_templates')->default(true)->comment('Condividi template e modelli');
            
            // Gestione membri
            $table->boolean('members_can_invite')->default(true)->comment('I membri possono invitare altri tenant');
            $table->unsignedInteger('max_members')->nullable()->comment('Limite massimo membri (null=illimitato)');
            
            // Audit
            $table->timestamps();
            $table->softDeletes();
            
            // Indici
            $table->index('status');
            $table->index('created_by_tenant_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('aggregations');
    }
};
