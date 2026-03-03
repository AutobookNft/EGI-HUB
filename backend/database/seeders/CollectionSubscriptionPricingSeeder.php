<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * @package Database\Seeders
 * @author Padmin D. Curtis (AI Partner OS3.0) for Fabio Cherici
 * @version 1.0.0 (FlorenceEGI - Collection Subscription Pricing)
 * @date 2026-03-03
 * @purpose Seed dei 4 piani abbonamento Collection in ai_feature_pricing.
 *          Gestiti da SuperAdmin EGI-HUB, letti da EGI (art.florenceegi.com).
 *          Operazione idempotente: upsert su feature_code univoco.
 */
class CollectionSubscriptionPricingSeeder extends Seeder {
    /**
     * Project ID di FlorenceArtEGI in core.system_projects
     */
    private const EGI_PROJECT_ID = 1;

    /**
     * Piani abbonamento Collection per Company (Profilo NORMAL).
     * Prezzi in EUR come da doc 04_Gestione_Pagamenti.md.
     * egili_discount_percent: % sconto sul prezzo EUR se l'utente spende Egili.
     * egili_required_for_discount: Egili necessari per ottenere lo sconto.
     */
    private array $plans = [
        [
            'feature_code'        => 'collection_subscription_starter',
            'feature_name'        => 'Collection Subscription - Starter',
            'feature_description' => 'Piano abbonamento mensile per collezioni fino a 19 EGI. Profilo NORMAL (Company).',
            'feature_category'    => 'platform_services',
            'cost_fiat_eur'       => 4.90,
            'cost_egili'          => null,          // Pagamento solo FIAT — Egili = sconto opzionale
            'is_free'             => false,
            'is_recurring'        => true,
            'recurrence_period'   => 'monthly',
            'expires'             => true,
            'is_active'           => true,
            'display_order'       => 10,
            'feature_parameters'  => [
                'max_egis'                    => 19,
                'plan_tier'                   => 'starter',
                'project_id'                  => self::EGI_PROJECT_ID,
                'egili_discount_percent'      => 0,   // SuperAdmin può modificare via EGI-HUB
                'egili_required_for_discount' => 0,
            ],
            'benefits' => [
                'max_egis'          => 19,
                'full_analytics'    => true,
                'priority_support'  => true,
            ],
        ],
        [
            'feature_code'        => 'collection_subscription_basic',
            'feature_name'        => 'Collection Subscription - Basic',
            'feature_description' => 'Piano abbonamento mensile per collezioni da 20 a 49 EGI. Profilo NORMAL (Company).',
            'feature_category'    => 'platform_services',
            'cost_fiat_eur'       => 7.90,
            'cost_egili'          => null,
            'is_free'             => false,
            'is_recurring'        => true,
            'recurrence_period'   => 'monthly',
            'expires'             => true,
            'is_active'           => true,
            'display_order'       => 20,
            'feature_parameters'  => [
                'max_egis'                    => 49,
                'plan_tier'                   => 'basic',
                'project_id'                  => self::EGI_PROJECT_ID,
                'egili_discount_percent'      => 0,
                'egili_required_for_discount' => 0,
            ],
            'benefits' => [
                'max_egis'          => 49,
                'full_analytics'    => true,
                'priority_support'  => true,
            ],
        ],
        [
            'feature_code'        => 'collection_subscription_professional',
            'feature_name'        => 'Collection Subscription - Professional',
            'feature_description' => 'Piano abbonamento mensile per collezioni da 50 a 99 EGI. Profilo NORMAL (Company).',
            'feature_category'    => 'platform_services',
            'cost_fiat_eur'       => 9.90,
            'cost_egili'          => null,
            'is_free'             => false,
            'is_recurring'        => true,
            'recurrence_period'   => 'monthly',
            'expires'             => true,
            'is_active'           => true,
            'display_order'       => 30,
            'feature_parameters'  => [
                'max_egis'                    => 99,
                'plan_tier'                   => 'professional',
                'project_id'                  => self::EGI_PROJECT_ID,
                'egili_discount_percent'      => 0,
                'egili_required_for_discount' => 0,
            ],
            'benefits' => [
                'max_egis'          => 99,
                'full_analytics'    => true,
                'priority_support'  => true,
            ],
        ],
        [
            'feature_code'        => 'collection_subscription_unlimited',
            'feature_name'        => 'Collection Subscription - Unlimited',
            'feature_description' => 'Piano abbonamento mensile per collezioni con 100+ EGI. Profilo NORMAL (Company).',
            'feature_category'    => 'platform_services',
            'cost_fiat_eur'       => 19.90,
            'cost_egili'          => null,
            'is_free'             => false,
            'is_recurring'        => true,
            'recurrence_period'   => 'monthly',
            'expires'             => true,
            'is_active'           => true,
            'display_order'       => 40,
            'feature_parameters'  => [
                'max_egis'                    => null,   // Illimitato
                'plan_tier'                   => 'unlimited',
                'project_id'                  => self::EGI_PROJECT_ID,
                'egili_discount_percent'      => 0,
                'egili_required_for_discount' => 0,
            ],
            'benefits' => [
                'max_egis'          => null,
                'full_analytics'    => true,
                'priority_support'  => true,
            ],
        ],
    ];

    /**
     * Esegue il seed idempotente dei piani abbonamento Collection.
     * Upsert su feature_code: se esiste aggiorna, altrimenti inserisce.
     * NON tocca record con feature_code diverso.
     */
    public function run(): void {
        $this->command->info('[CollectionSubscriptionPricingSeeder] Seeding 4 piani abbonamento Collection...');

        foreach ($this->plans as $plan) {
            $featureCode = $plan['feature_code'];

            // Prepara JSON columns
            $featureParameters = json_encode($plan['feature_parameters']);
            $benefits          = json_encode($plan['benefits']);

            $exists = DB::table('ai_feature_pricing')
                ->where('feature_code', $featureCode)
                ->exists();

            if ($exists) {
                DB::table('ai_feature_pricing')
                    ->where('feature_code', $featureCode)
                    ->update([
                        'feature_name'        => $plan['feature_name'],
                        'feature_description' => $plan['feature_description'],
                        'cost_fiat_eur'       => $plan['cost_fiat_eur'],
                        'cost_egili'          => $plan['cost_egili'],
                        'is_recurring'        => $plan['is_recurring'],
                        'recurrence_period'   => $plan['recurrence_period'],
                        'is_active'           => $plan['is_active'],
                        'display_order'       => $plan['display_order'],
                        'feature_parameters'  => $featureParameters,
                        'benefits'            => $benefits,
                        'updated_at'          => now(),
                    ]);

                $this->command->line("  [UPDATE] {$featureCode}");
            } else {
                DB::table('ai_feature_pricing')->insert([
                    'feature_code'        => $featureCode,
                    'feature_name'        => $plan['feature_name'],
                    'feature_description' => $plan['feature_description'],
                    'feature_category'    => $plan['feature_category'],
                    'cost_fiat_eur'       => $plan['cost_fiat_eur'],
                    'cost_egili'          => $plan['cost_egili'],
                    'is_free'             => $plan['is_free'],
                    'is_recurring'        => $plan['is_recurring'],
                    'recurrence_period'   => $plan['recurrence_period'],
                    'expires'             => $plan['expires'],
                    'is_active'           => $plan['is_active'],
                    'display_order'       => $plan['display_order'],
                    'feature_parameters'  => $featureParameters,
                    'benefits'            => $benefits,
                    'is_bundle'           => false,
                    'stackable'           => false,
                    'is_beta'             => false,
                    'requires_approval'   => false,
                    'is_featured'         => false,
                    'discount_percentage' => 0,
                    'created_at'          => now(),
                    'updated_at'          => now(),
                ]);

                $this->command->line("  [INSERT] {$featureCode}");
            }
        }

        $this->command->info('[CollectionSubscriptionPricingSeeder] Done. 4 piani in core.ai_feature_pricing.');
    }
}
