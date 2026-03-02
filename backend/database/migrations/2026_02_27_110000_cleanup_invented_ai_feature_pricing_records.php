<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    /**
     * Rimuove i record inventati dall'AI da ai_feature_pricing.
     * Si tengono solo i 4 pacchetti AI Token legittimi.
     */
    public function up(): void {
        DB::table('ai_feature_pricing')
            ->whereNotIn('feature_code', [
                'ai_token_pack_starter',
                'ai_token_pack_professional',
                'ai_token_pack_business',
                'ai_token_pack_enterprise',
            ])
            ->delete();
    }

    public function down(): void {
        // Non si ripristinano record inventati
    }
};
