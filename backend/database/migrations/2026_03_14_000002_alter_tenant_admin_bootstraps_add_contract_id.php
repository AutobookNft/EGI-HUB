<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * @package Database\Migrations
 * @author Padmin D. Curtis (AI Partner OS3.0) for Fabio Cherici
 * @version 1.0.0 (EGI-HUB - TenantAdminBootstrap contract FK)
 * @date 2026-03-14
 * @purpose Sostituisce contract_reference (string) con contract_id (FK contracts)
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tenant_admin_bootstraps', function (Blueprint $table) {
            // Aggiunge FK al contratto (nullable per retrocompatibilità)
            $table->unsignedBigInteger('contract_id')->nullable()->after('tenant_id')
                ->comment('FK al contratto — sostituisce contract_reference');
            $table->foreign('contract_id')
                ->references('id')->on('contracts')
                ->onDelete('set null');

            // Rimuove il vecchio campo stringa
            $table->dropColumn('contract_reference');
        });
    }

    public function down(): void
    {
        Schema::table('tenant_admin_bootstraps', function (Blueprint $table) {
            $table->dropForeign(['contract_id']);
            $table->dropColumn('contract_id');
            $table->string('contract_reference', 100)->nullable();
        });
    }
};
