<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     *
     * @author Padmin D. Curtis (AI Partner OS3.0) for Fabio Cherici
     * @version 1.0.0 (EGI-HUB - BILLING FASE 4.1)
     * @date 2026-02-25
     * @purpose Configurazioni provider di pagamento per progetto — Stripe, PayPal, Crypto
     */
    public function up(): void {
        Schema::create('payment_provider_configs', function (Blueprint $table) {
            $table->id();

            // FK al progetto
            $table->unsignedBigInteger('project_id')
                ->comment('FK system_projects.id');
            $table->foreign('project_id')
                ->references('id')->on('system_projects')
                ->onDelete('cascade');

            // Provider
            $table->enum('provider', ['stripe', 'paypal', 'crypto'])
                ->comment('Provider di pagamento');

            $table->boolean('is_enabled')->default(false)
                ->comment('Provider attivo per questo progetto');

            // Configurazione sensibile (encrypted)
            $table->text('config')->nullable()
                ->comment('JSON encrypted: api_key, api_secret, webhook_secret, ecc.');

            $table->enum('environment', ['sandbox', 'live'])->default('sandbox')
                ->comment('Ambiente di esecuzione');

            $table->text('notes')->nullable()
                ->comment('Note operative opzionali');

            $table->timestamps();
            $table->softDeletes();

            // Un solo record per progetto+provider
            $table->unique(['project_id', 'provider'], 'payment_configs_project_provider_unique');
            $table->index('project_id');
            $table->index('is_enabled');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void {
        Schema::dropIfExists('payment_provider_configs');
    }
};
