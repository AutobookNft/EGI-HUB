<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * AiFeaturePricing Model — EGI-HUB
 *
 * Punta alla tabella `ai_feature_pricing` del DB condiviso (PostgreSQL AWS RDS).
 * Nessuna migration: la tabella è già esistente, creata da EGI.
 *
 * @package App\Models
 * @author Padmin D. Curtis (AI Partner OS3.0) for Fabio Cherici
 * @version 1.0.0 (FlorenceEGI - EGI-HUB Billing FASE 1)
 * @date 2026-02-25
 * @purpose Read-write access alla tabella ai_feature_pricing dal punto di controllo EGI-HUB
 */
class AiFeaturePricing extends Model
{
    use SoftDeletes;

    protected $table = 'ai_feature_pricing';

    protected $fillable = [
        'feature_code',
        'feature_name',
        'feature_description',
        'feature_category',
        'cost_fiat_eur',
        'cost_egili',
        'is_free',
        'free_monthly_limit',
        'tier_pricing',
        'min_tier_required',
        'is_bundle',
        'bundle_features',
        'discount_percentage',
        'bundle_type',
        'is_recurring',
        'recurrence_period',
        'duration_hours',
        'expires',
        'max_uses_per_purchase',
        'monthly_quota',
        'stackable',
        'feature_parameters',
        'benefits',
        'expected_roi_multiplier',
        'is_active',
        'available_from',
        'available_until',
        'is_beta',
        'requires_approval',
        'display_order',
        'is_featured',
        'icon_name',
        'badge_color',
        'total_purchases',
        'total_egili_spent',
        'total_fiat_revenue',
        'last_purchased_at',
        'metadata',
        'admin_notes',
    ];

    protected $casts = [
        'cost_fiat_eur'          => 'decimal:2',
        'cost_egili'             => 'integer',
        'is_free'                => 'boolean',
        'free_monthly_limit'     => 'integer',
        'tier_pricing'           => 'array',
        'is_bundle'              => 'boolean',
        'bundle_features'        => 'array',
        'discount_percentage'    => 'integer',
        'is_recurring'           => 'boolean',
        'duration_hours'         => 'integer',
        'expires'                => 'boolean',
        'max_uses_per_purchase'  => 'integer',
        'monthly_quota'          => 'integer',
        'stackable'              => 'boolean',
        'feature_parameters'     => 'array',
        'benefits'               => 'array',
        'expected_roi_multiplier'=> 'decimal:2',
        'is_active'              => 'boolean',
        'available_from'         => 'datetime',
        'available_until'        => 'datetime',
        'is_beta'                => 'boolean',
        'requires_approval'      => 'boolean',
        'display_order'          => 'integer',
        'is_featured'            => 'boolean',
        'total_purchases'        => 'integer',
        'total_egili_spent'      => 'integer',
        'total_fiat_revenue'     => 'decimal:2',
        'last_purchased_at'      => 'datetime',
        'metadata'               => 'array',
    ];

    // === SCOPES ===

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeCategory($query, string $category)
    {
        return $query->where('feature_category', $category);
    }

    public function scopeBundles($query)
    {
        return $query->where('is_bundle', true);
    }

    public function scopeCreditPackages($query)
    {
        return $query->where('bundle_type', 'credit_package');
    }

    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true);
    }
}
