<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * La tabella project_admins gestisce chi ha accesso a quale progetto (SaaS application)
     * Es: User "Mario Rossi" è admin del progetto "NATAN_LOC" con ruolo "admin"
     * 
     * STRUTTURA GOVERNANCE EGI:
     * - Super Admin EGI: accesso totale a EGI-HUB (definito in users.is_super_admin)
     * - Project Admin: gestisce un progetto specifico (questa tabella)
     * - Project Owner: proprietario del progetto, può assegnare admin
     * - Project Viewer: solo visualizzazione del progetto
     */
    public function up(): void
    {
        Schema::create('project_admins', function (Blueprint $table) {
            $table->id();
            
            // Foreign keys
            $table->foreignId('project_id')
                  ->constrained('projects')
                  ->onDelete('cascade');
            
            $table->foreignId('user_id')
                  ->constrained('users')
                  ->onDelete('cascade');
            
            // Ruolo dell'utente nel progetto
            // owner: proprietario, può tutto incluso assegnare admin
            // admin: può gestire tenant, configurazioni, ma non assegnare altri admin
            // viewer: solo visualizzazione statistiche e logs
            $table->enum('role', ['owner', 'admin', 'viewer'])->default('viewer');
            
            // Permessi granulari (JSON per flessibilità futura)
            // Es: {"can_manage_tenants": true, "can_view_logs": true, "can_export": false}
            $table->json('permissions')->nullable();
            
            // Data di assegnazione e chi ha assegnato
            $table->foreignId('assigned_by')
                  ->nullable()
                  ->constrained('users')
                  ->onDelete('set null');
            
            $table->timestamp('assigned_at')->useCurrent();
            
            // Scadenza dell'accesso (null = nessuna scadenza)
            $table->timestamp('expires_at')->nullable();
            
            // Stato attivo/disattivo (per sospensioni temporanee)
            $table->boolean('is_active')->default(true);
            
            // Note interne
            $table->text('notes')->nullable();
            
            $table->timestamps();
            
            // Indici
            $table->unique(['project_id', 'user_id']); // Un utente può avere un solo ruolo per progetto
            $table->index(['user_id', 'is_active']);   // Per query "tutti i progetti di un utente"
            $table->index(['project_id', 'role']);     // Per query "tutti gli admin di un progetto"
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('project_admins');
    }
};
