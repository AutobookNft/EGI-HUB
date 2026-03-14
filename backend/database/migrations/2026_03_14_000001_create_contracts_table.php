<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * @package Database\Migrations
 * @author Padmin D. Curtis (AI Partner OS3.0) for Fabio Cherici
 * @version 1.0.0 (EGI-HUB - Contracts)
 * @date 2026-03-14
 * @purpose Tabella contratti tra FlorenceEGI e i tenant dei progetti SaaS
 *
 * Un contratto è l'accordo legale/commerciale che precede l'attivazione
 * di un tenant. Il firmatario può coincidere con il primo admin (signatory_is_admin).
 * I rinnovi sono tracciati tramite parent_contract_id (chain).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('contracts', function (Blueprint $table) {
            $table->id();

            // Riferimenti principali
            $table->unsignedBigInteger('tenant_id')
                ->comment('Tenant destinatario del contratto');
            $table->foreign('tenant_id')
                ->references('id')->on('tenants')
                ->onDelete('restrict');

            $table->unsignedBigInteger('system_project_id')
                ->comment('Progetto SaaS di riferimento');
            $table->foreign('system_project_id')
                ->references('id')->on('system_projects')
                ->onDelete('restrict');

            // Identificazione
            $table->string('contract_number', 100)->unique()
                ->comment('Numero contratto univoco (es. EGI-2026-001)');

            $table->enum('contract_type', ['saas', 'pilot', 'trial', 'custom'])
                ->default('saas')
                ->comment('Tipologia contratto');

            $table->enum('status', ['draft', 'active', 'expired', 'terminated', 'renewed'])
                ->default('draft')
                ->comment('Stato ciclo di vita');

            // Chain rinnovi
            $table->unsignedBigInteger('parent_contract_id')->nullable()
                ->comment('FK al contratto precedente — valorizzato se è un rinnovo');
            $table->foreign('parent_contract_id')
                ->references('id')->on('contracts')
                ->onDelete('set null');

            // Firmatario
            $table->string('signatory_name', 255)
                ->comment('Nome e cognome del firmatario');
            $table->string('signatory_email', 255)
                ->comment('Email del firmatario');
            $table->string('signatory_role', 255)->nullable()
                ->comment('Ruolo/qualifica del firmatario (es. Dirigente Servizi Digitali)');
            $table->boolean('signatory_is_admin')->default(false)
                ->comment('Il firmatario è anche il primo admin del tenant');
            $table->timestamp('signed_at')->nullable()
                ->comment('Data/ora di firma — null se ancora in draft');

            // Economico (tutto opzionale)
            $table->decimal('value', 12, 2)->nullable()
                ->comment('Valore contratto');
            $table->string('currency', 3)->nullable()->default('EUR')
                ->comment('Valuta (ISO 4217)');
            $table->enum('billing_period', ['monthly', 'annual', 'one_time', 'custom'])->nullable()
                ->comment('Periodicità fatturazione');

            // Date validità
            $table->date('start_date')
                ->comment('Data inizio validità');
            $table->date('end_date')->nullable()
                ->comment('Data fine validità — null = perpetuo');

            // Documento
            $table->string('document_url', 1000)->nullable()
                ->comment('URL documento contratto (S3 o altro storage)');
            $table->text('notes')->nullable()
                ->comment('Note interne');

            // Audit
            $table->unsignedBigInteger('created_by')
                ->comment('SuperAdmin che ha creato il contratto');
            $table->unsignedBigInteger('updated_by')->nullable()
                ->comment('SuperAdmin che ha modificato il contratto');

            $table->timestamps();
            $table->softDeletes();

            // Indici
            $table->index('tenant_id');
            $table->index('system_project_id');
            $table->index('status');
            $table->index('end_date');
            $table->index(['tenant_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contracts');
    }
};
