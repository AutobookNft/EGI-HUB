<?php

declare(strict_types=1);

namespace FlorenceEgi\CoreModels\Traits;

use FlorenceEgi\CoreModels\Models\Aggregation;
use FlorenceEgi\CoreModels\Models\AggregationMember;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Trait: HasAggregations
 * 
 * Aggiunge funzionalità di aggregazione al modello Tenant.
 * Usa questo trait nel tuo modello Tenant per abilitare
 * il sistema di aggregazioni P2P.
 * 
 * ESEMPIO:
 * ```php
 * class Tenant extends Model
 * {
 *     use \FlorenceEgi\CoreModels\Traits\HasAggregations;
 * }
 * ```
 * 
 * @package FlorenceEgi\CoreModels\Traits
 * @author Fabio Cherici
 * @version 1.0.0
 * @date 2025-11-28
 */
trait HasAggregations
{
    /**
     * Aggregazioni create da questo tenant
     */
    public function createdAggregations(): HasMany
    {
        return $this->hasMany(Aggregation::class, 'created_by_tenant_id');
    }

    /**
     * Tutte le membership di questo tenant
     */
    public function aggregationMemberships(): HasMany
    {
        return $this->hasMany(AggregationMember::class, 'tenant_id');
    }

    /**
     * Solo le membership attive (accepted)
     */
    public function activeAggregationMemberships(): HasMany
    {
        return $this->hasMany(AggregationMember::class, 'tenant_id')
            ->where('status', AggregationMember::STATUS_ACCEPTED);
    }

    /**
     * Inviti pendenti ricevuti
     */
    public function pendingAggregationInvitations(): HasMany
    {
        return $this->hasMany(AggregationMember::class, 'tenant_id')
            ->where('status', AggregationMember::STATUS_PENDING)
            ->where(function ($q) {
                $q->whereNull('expires_at')
                  ->orWhere('expires_at', '>', now());
            });
    }

    /**
     * Ottieni tutte le aggregazioni attive di cui questo tenant fa parte
     */
    public function getActiveAggregations()
    {
        return Aggregation::active()
            ->whereHas('activeMembers', function ($q) {
                $q->where('tenant_id', $this->id);
            })
            ->get();
    }

    /**
     * Ottieni tutti i tenant_id accessibili tramite le aggregazioni
     * Include sempre il proprio tenant_id
     */
    public function getAccessibleTenantIds(): array
    {
        $tenantIds = [$this->id]; // Sempre include se stesso

        $aggregations = $this->getActiveAggregations();

        foreach ($aggregations as $aggregation) {
            $memberIds = $aggregation->getMemberTenantIds();
            $tenantIds = array_merge($tenantIds, $memberIds);
        }

        return array_unique($tenantIds);
    }

    /**
     * Ottieni i tenant_id accessibili raggruppati per aggregazione
     * Utile per mostrare un selector con checkboxes
     */
    public function getAccessibleTenantsByAggregation(): array
    {
        $result = [
            'my_tenant' => [
                'id' => $this->id,
                'name' => $this->name ?? 'Il mio ente',
            ],
            'aggregations' => [],
        ];

        $aggregations = $this->getActiveAggregations();

        foreach ($aggregations as $aggregation) {
            $members = $aggregation->activeMembers()
                ->with('tenant:id,name')
                ->get()
                ->map(function ($member) {
                    return [
                        'tenant_id' => $member->tenant_id,
                        'name' => $member->tenant->name ?? 'Tenant ' . $member->tenant_id,
                        'role' => $member->role,
                    ];
                })
                ->toArray();

            $result['aggregations'][] = [
                'id' => $aggregation->id,
                'name' => $aggregation->name,
                'slug' => $aggregation->slug,
                'members' => $members,
            ];
        }

        return $result;
    }

    /**
     * Crea una nuova aggregazione
     */
    public function createAggregation(string $name, array $options = []): Aggregation
    {
        $aggregation = Aggregation::create(array_merge([
            'name' => $name,
            'created_by_tenant_id' => $this->id,
            'status' => 'active',
        ], $options));

        // Il creatore è automaticamente membro admin
        $aggregation->memberships()->create([
            'tenant_id' => $this->id,
            'invited_by_tenant_id' => null,
            'status' => AggregationMember::STATUS_ACCEPTED,
            'role' => AggregationMember::ROLE_ADMIN,
            'joined_at' => now(),
        ]);

        return $aggregation;
    }

    /**
     * Verifica se può accedere ai dati di un altro tenant
     */
    public function canAccessTenant(int $tenantId): bool
    {
        // Sempre può accedere ai propri dati
        if ($this->id === $tenantId) {
            return true;
        }

        // Verifica se condivide un'aggregazione
        $accessibleIds = $this->getAccessibleTenantIds();
        return in_array($tenantId, $accessibleIds);
    }
}
