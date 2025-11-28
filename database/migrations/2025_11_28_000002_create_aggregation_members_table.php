<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migrazione: Creazione tabella aggregation_members
 * 
 * Tabella pivot che gestisce l'appartenenza dei tenant alle aggregazioni.
 * Include il workflow di invito/accettazione e i permessi specifici.
 * 
 * WORKFLOW STATI:
 * - pending: Invito inviato, in attesa di risposta
 * - accepted: Tenant ha accettato, fa parte dell'aggregazione
 * - rejected: Tenant ha rifiutato l'invito
 * - left: Tenant ha lasciato l'aggregazione volontariamente
 * - removed: Tenant è stato rimosso dall'admin dell'aggregazione
 * - expired: Invito scaduto senza risposta
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
        Schema::create('aggregation_members', function (Blueprint $table) {
            $table->id();
            
            // Relazioni
            $table->foreignId('aggregation_id')
                ->constrained('aggregations')
                ->onDelete('cascade')
                ->comment('Aggregazione di appartenenza');
            
            $table->foreignId('tenant_id')
                ->constrained('tenants')
                ->onDelete('cascade')
                ->comment('Tenant membro');
            
            // Chi ha invitato (null = creatore aggregazione)
            $table->foreignId('invited_by_tenant_id')
                ->nullable()
                ->constrained('tenants')
                ->onDelete('set null')
                ->comment('Tenant che ha inviato invito');
            
            // Stato membership
            $table->enum('status', [
                'pending',   // Invito inviato
                'accepted',  // Membro attivo
                'rejected',  // Ha rifiutato
                'left',      // Se n'è andato
                'removed',   // Rimosso da admin
                'expired'    // Invito scaduto
            ])->default('pending')->comment('Stato appartenenza');
            
            // Ruolo nel gruppo
            $table->enum('role', [
                'admin',     // Può gestire membri e impostazioni
                'member',    // Membro standard
                'readonly'   // Solo lettura dati condivisi
            ])->default('member')->comment('Ruolo nel gruppo');
            
            // Permessi granulari (override delle impostazioni aggregazione)
            $table->json('permissions')->nullable()->comment('Permessi specifici per questo membro');
            
            // Timeline
            $table->timestamp('invited_at')->nullable()->comment('Data invito');
            $table->timestamp('responded_at')->nullable()->comment('Data risposta (accept/reject)');
            $table->timestamp('joined_at')->nullable()->comment('Data ingresso effettivo');
            $table->timestamp('left_at')->nullable()->comment('Data uscita');
            $table->timestamp('expires_at')->nullable()->comment('Scadenza invito');
            
            // Motivazioni
            $table->text('invitation_message')->nullable()->comment('Messaggio invito');
            $table->text('response_message')->nullable()->comment('Messaggio risposta');
            $table->text('leave_reason')->nullable()->comment('Motivo uscita');
            
            // Audit
            $table->timestamps();
            $table->softDeletes();
            
            // Vincolo unicità: un tenant può essere in un'aggregazione una sola volta
            $table->unique(['aggregation_id', 'tenant_id'], 'unique_aggregation_member');
            
            // Indici per query frequenti
            $table->index(['tenant_id', 'status'], 'idx_tenant_active_memberships');
            $table->index(['aggregation_id', 'status'], 'idx_aggregation_active_members');
            $table->index('status');
            $table->index('expires_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('aggregation_members');
    }
};
