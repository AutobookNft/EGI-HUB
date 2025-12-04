<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Aggiunge il campo is_super_admin alla tabella users.
     * I Super Admin EGI hanno accesso totale a tutti i progetti e funzionalità.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('is_super_admin')
                  ->default(false)
                  ->after('remember_token')
                  ->comment('Super Admin EGI ha accesso totale a tutti i progetti');
            
            $table->index('is_super_admin');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['is_super_admin']);
            $table->dropColumn('is_super_admin');
        });
    }
};
