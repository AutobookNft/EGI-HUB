<?php

declare(strict_types=1);

namespace App\Enums;

/**
 * @package App\Enums
 * @author Padmin D. Curtis (AI Partner OS3.0) for Fabio Cherici
 * @version 1.0.0 (EGI-HUB - Contracts)
 * @date 2026-03-14
 * @purpose Periodicità di fatturazione di un contratto EGI
 */
enum BillingPeriod: string
{
    case Monthly  = 'monthly';
    case Annual   = 'annual';
    case OneTime  = 'one_time';
    case Custom   = 'custom';

    public function label(): string
    {
        return match($this) {
            self::Monthly  => 'Mensile',
            self::Annual   => 'Annuale',
            self::OneTime  => 'Una tantum',
            self::Custom   => 'Personalizzata',
        };
    }
}
