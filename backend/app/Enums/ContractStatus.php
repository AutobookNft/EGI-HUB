<?php

declare(strict_types=1);

namespace App\Enums;

/**
 * @package App\Enums
 * @author Padmin D. Curtis (AI Partner OS3.0) for Fabio Cherici
 * @version 1.0.0 (EGI-HUB - Contracts)
 * @date 2026-03-14
 * @purpose Ciclo di vita di un contratto EGI
 */
enum ContractStatus: string
{
    case Draft      = 'draft';
    case Active     = 'active';
    case Expired    = 'expired';
    case Terminated = 'terminated';
    case Renewed    = 'renewed';

    public function label(): string
    {
        return match($this) {
            self::Draft      => 'Bozza',
            self::Active     => 'Attivo',
            self::Expired    => 'Scaduto',
            self::Terminated => 'Terminato',
            self::Renewed    => 'Rinnovato',
        };
    }

    public function color(): string
    {
        return match($this) {
            self::Draft      => 'gray',
            self::Active     => 'green',
            self::Expired    => 'yellow',
            self::Terminated => 'red',
            self::Renewed    => 'blue',
        };
    }

    public function canBeActivated(): bool
    {
        return $this === self::Draft;
    }

    public function canBeTerminated(): bool
    {
        return in_array($this, [self::Draft, self::Active]);
    }

    public function canBeRenewed(): bool
    {
        return in_array($this, [self::Active, self::Expired]);
    }
}
