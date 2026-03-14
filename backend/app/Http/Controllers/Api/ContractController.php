<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Enums\ContractStatus;
use App\Enums\ContractType;
use App\Enums\BillingPeriod;
use App\Http\Controllers\Controller;
use App\Models\Contract;
use App\Models\Tenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

/**
 * @package App\Http\Controllers\Api
 * @author Padmin D. Curtis (AI Partner OS3.0) for Fabio Cherici
 * @version 1.0.0 (EGI-HUB - Contracts)
 * @date 2026-03-14
 * @purpose CRUD contratti + azioni lifecycle (activate, terminate, renew)
 */
class ContractController extends Controller
{
    /**
     * Lista contratti di un tenant
     * GET /api/tenants/{tenantId}/contracts
     */
    public function index(Request $request, int $tenantId): JsonResponse
    {
        $tenant = Tenant::findOrFail($tenantId);

        $contracts = Contract::forTenant($tenantId)
            ->with(['createdBy:id,name,email', 'parentContract:id,contract_number'])
            ->orderByDesc('created_at')
            ->get()
            ->map(fn(Contract $c) => $this->formatContract($c));

        return response()->json([
            'success' => true,
            'data'    => $contracts,
            'tenant'  => ['id' => $tenant->id, 'name' => $tenant->name],
        ]);
    }

    /**
     * Dettaglio contratto
     * GET /api/contracts/{id}
     */
    public function show(int $id): JsonResponse
    {
        $contract = Contract::with([
            'tenant:id,name,slug',
            'project:id,name,slug',
            'createdBy:id,name,email',
            'parentContract:id,contract_number,status',
            'renewals:id,contract_number,status,start_date,end_date',
            'adminBootstraps:id,contract_id,first_name_snapshot,last_name_snapshot,email_snapshot,status',
        ])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data'    => $this->formatContract($contract, detailed: true),
        ]);
    }

    /**
     * Crea nuovo contratto
     * POST /api/tenants/{tenantId}/contracts
     */
    public function store(Request $request, int $tenantId): JsonResponse
    {
        $tenant = Tenant::findOrFail($tenantId);

        $validator = Validator::make($request->all(), [
            'system_project_id'  => 'required|integer|exists:system_projects,id',
            'contract_type'      => 'required|in:saas,pilot,trial,custom',
            'signatory_name'     => 'required|string|max:255',
            'signatory_email'    => 'required|email|max:255',
            'signatory_role'     => 'nullable|string|max:255',
            'signatory_is_admin' => 'boolean',
            'signed_at'          => 'nullable|date',
            'value'              => 'nullable|numeric|min:0',
            'currency'           => 'nullable|string|size:3',
            'billing_period'     => 'nullable|in:monthly,annual,one_time,custom',
            'start_date'         => 'required|date',
            'end_date'           => 'nullable|date|after:start_date',
            'document_url'       => 'nullable|url|max:1000',
            'notes'              => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors'  => $validator->errors(),
            ], 422);
        }

        $data = $validator->validated();
        $data['tenant_id']       = $tenantId;
        $data['status']          = ContractStatus::Draft->value;
        $data['contract_number'] = Contract::generateContractNumber($data['system_project_id']);
        $data['created_by']      = $request->user()->id;

        $contract = Contract::create($data);

        return response()->json([
            'success' => true,
            'data'    => $this->formatContract($contract->fresh()),
            'message' => 'Contratto creato — numero: ' . $contract->contract_number,
        ], 201);
    }

    /**
     * Aggiorna contratto (solo se draft)
     * PUT /api/contracts/{id}
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $contract = Contract::findOrFail($id);

        if ($contract->status !== ContractStatus::Draft) {
            return response()->json([
                'success' => false,
                'message' => 'Solo i contratti in bozza possono essere modificati.',
            ], 422);
        }

        $validator = Validator::make($request->all(), [
            'signatory_name'     => 'sometimes|string|max:255',
            'signatory_email'    => 'sometimes|email|max:255',
            'signatory_role'     => 'nullable|string|max:255',
            'signatory_is_admin' => 'boolean',
            'signed_at'          => 'nullable|date',
            'value'              => 'nullable|numeric|min:0',
            'currency'           => 'nullable|string|size:3',
            'billing_period'     => 'nullable|in:monthly,annual,one_time,custom',
            'start_date'         => 'sometimes|date',
            'end_date'           => 'nullable|date|after:start_date',
            'document_url'       => 'nullable|url|max:1000',
            'notes'              => 'nullable|string',
            'contract_type'      => 'sometimes|in:saas,pilot,trial,custom',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $data               = $validator->validated();
        $data['updated_by'] = $request->user()->id;
        $contract->update($data);

        return response()->json([
            'success' => true,
            'data'    => $this->formatContract($contract->fresh()),
        ]);
    }

    /**
     * Attiva contratto (draft → active)
     * POST /api/contracts/{id}/activate
     */
    public function activate(Request $request, int $id): JsonResponse
    {
        $contract = Contract::findOrFail($id);

        if (! $contract->canBeActivated()) {
            return response()->json([
                'success' => false,
                'message' => 'Il contratto non può essere attivato dallo stato attuale: ' . $contract->status->label(),
            ], 422);
        }

        $contract->update([
            'status'     => ContractStatus::Active,
            'updated_by' => $request->user()->id,
            'signed_at'  => $contract->signed_at ?? now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Contratto attivato.',
            'data'    => $this->formatContract($contract->fresh()),
        ]);
    }

    /**
     * Termina contratto (draft|active → terminated)
     * POST /api/contracts/{id}/terminate
     */
    public function terminate(Request $request, int $id): JsonResponse
    {
        $contract = Contract::findOrFail($id);

        if (! $contract->status->canBeTerminated()) {
            return response()->json([
                'success' => false,
                'message' => 'Il contratto non può essere terminato dallo stato attuale.',
            ], 422);
        }

        $contract->update([
            'status'     => ContractStatus::Terminated,
            'updated_by' => $request->user()->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Contratto terminato.',
            'data'    => $this->formatContract($contract->fresh()),
        ]);
    }

    /**
     * Crea rinnovo (active|expired → renewed + nuovo draft)
     * POST /api/contracts/{id}/renew
     */
    public function renew(Request $request, int $id): JsonResponse
    {
        $contract = Contract::findOrFail($id);

        if (! $contract->canBeRenewed()) {
            return response()->json([
                'success' => false,
                'message' => 'Il contratto non può essere rinnovato dallo stato attuale.',
            ], 422);
        }

        $validator = Validator::make($request->all(), [
            'end_date'      => 'nullable|date',
            'value'         => 'nullable|numeric|min:0',
            'billing_period'=> 'nullable|in:monthly,annual,one_time,custom',
            'notes'         => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $renewal = $contract->createRenewal(array_merge(
            $validator->validated(),
            ['created_by' => $request->user()->id]
        ));

        return response()->json([
            'success' => true,
            'message' => 'Rinnovo creato — numero: ' . $renewal->contract_number,
            'data'    => $this->formatContract($renewal->fresh()),
        ], 201);
    }

    /**
     * Elimina contratto (soft delete — solo draft)
     * DELETE /api/contracts/{id}
     */
    public function destroy(int $id): JsonResponse
    {
        $contract = Contract::findOrFail($id);

        if ($contract->status !== ContractStatus::Draft) {
            return response()->json([
                'success' => false,
                'message' => 'Solo i contratti in bozza possono essere eliminati.',
            ], 422);
        }

        $contract->delete();

        return response()->json(['success' => true, 'message' => 'Contratto eliminato.']);
    }

    // =========================================================================
    // HELPER
    // =========================================================================

    private function formatContract(Contract $c, bool $detailed = false): array
    {
        $base = [
            'id'                 => $c->id,
            'contract_number'    => $c->contract_number,
            'contract_type'      => $c->contract_type?->value,
            'contract_type_label'=> $c->contract_type?->label(),
            'status'             => $c->status->value,
            'status_label'       => $c->status->label(),
            'status_color'       => $c->status->color(),
            'signatory_name'     => $c->signatory_name,
            'signatory_email'    => $c->signatory_email,
            'signatory_role'     => $c->signatory_role,
            'signatory_is_admin' => $c->signatory_is_admin,
            'signed_at'          => $c->signed_at?->toISOString(),
            'value'              => $c->value,
            'currency'           => $c->currency ?? 'EUR',
            'billing_period'     => $c->billing_period?->value,
            'billing_period_label' => $c->billing_period?->label(),
            'start_date'         => $c->start_date?->toDateString(),
            'end_date'           => $c->end_date?->toDateString(),
            'is_perpetual'       => $c->isPerpetual(),
            'is_expired'         => $c->isExpired(),
            'can_be_renewed'     => $c->canBeRenewed(),
            'can_be_activated'   => $c->canBeActivated(),
            'parent_contract_id' => $c->parent_contract_id,
            'created_at'         => $c->created_at->toISOString(),
            'created_by'         => $c->createdBy ? [
                'id'    => $c->createdBy->id,
                'name'  => $c->createdBy->name,
                'email' => $c->createdBy->email,
            ] : null,
        ];

        if ($detailed) {
            $base['tenant']          = $c->tenant ? ['id' => $c->tenant->id, 'name' => $c->tenant->name, 'slug' => $c->tenant->slug] : null;
            $base['project']         = $c->project ? ['id' => $c->project->id, 'name' => $c->project->name, 'slug' => $c->project->slug] : null;
            $base['parent_contract'] = $c->parentContract ? ['id' => $c->parentContract->id, 'contract_number' => $c->parentContract->contract_number] : null;
            $base['renewals']        = $c->renewals?->map(fn($r) => ['id' => $r->id, 'contract_number' => $r->contract_number, 'status' => $r->status->value])->toArray() ?? [];
            $base['admin_bootstraps']= $c->adminBootstraps?->map(fn($b) => ['id' => $b->id, 'name' => $b->first_name_snapshot . ' ' . $b->last_name_snapshot, 'email' => $b->email_snapshot, 'status' => $b->status->value])->toArray() ?? [];
            $base['document_url']    = $c->document_url;
            $base['notes']           = $c->notes;
        }

        return $base;
    }
}
