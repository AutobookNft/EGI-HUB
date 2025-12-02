<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Creates the tenant_activities table for tracking tenant events and activities.
     */
    public function up(): void
    {
        Schema::create('tenant_activities', function (Blueprint $table) {
            $table->id();
            
            // Relation to tenant
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            
            // Activity type (health_check, api_call, error, sync, etc.)
            $table->string('type');
            
            // Activity details
            $table->string('action');
            $table->text('description')->nullable();
            
            // Status (success, warning, error, info)
            $table->enum('status', ['success', 'warning', 'error', 'info'])->default('info');
            
            // Request/Response data
            $table->string('endpoint')->nullable();
            $table->string('method')->nullable();
            $table->integer('response_code')->nullable();
            $table->integer('response_time_ms')->nullable();
            
            // Extended metadata
            $table->json('metadata')->nullable();
            
            // IP and user info
            $table->ipAddress('ip_address')->nullable();
            $table->string('user_agent')->nullable();
            
            $table->timestamps();
            
            // Indexes for fast queries
            $table->index('type');
            $table->index('status');
            $table->index('created_at');
            $table->index(['tenant_id', 'created_at']);
            $table->index(['tenant_id', 'type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tenant_activities');
    }
};
