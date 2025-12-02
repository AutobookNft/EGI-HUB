<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Creates the tenants table for managing applications in the EGI-HUB ecosystem.
     * Each tenant represents an independent application with its own API.
     */
    public function up(): void
    {
        Schema::create('tenants', function (Blueprint $table) {
            $table->id();
            
            // Basic info
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            
            // Connection info
            $table->string('url');
            $table->string('api_key')->nullable();
            $table->string('api_secret')->nullable();
            
            // Status management
            $table->enum('status', ['active', 'inactive', 'maintenance', 'error'])
                  ->default('active');
            $table->boolean('is_healthy')->default(true);
            $table->timestamp('last_health_check')->nullable();
            
            // Extended metadata (JSON for flexibility)
            $table->json('metadata')->nullable();
            
            // Timestamps
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes
            $table->index('status');
            $table->index('is_healthy');
            $table->index(['status', 'is_healthy']);
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
