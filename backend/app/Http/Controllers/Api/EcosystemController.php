<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;

/**
 * Ecosystem Controller
 * 
 * Public API for EGI-HUB-HOME frontend.
 * Provides real-time metrics and dynamic node configuration.
 */
class EcosystemController extends Controller
{
    /**
     * Get real-time ecosystem metrics.
     * Public endpoint: /api/ecosystem/metrics
     */
    public function metrics(): JsonResponse
    {
        // 1. Get real tenant count
        $tenantCount = 0;
        try {
            // Use direct model reference for stability
            if (class_exists(\App\Models\Tenant::class)) {
                $tenantCount = \App\Models\Tenant::count();
            }
        } catch (\Exception $e) {
            // Fallback to 0 if table missing
        }

        // 2. Determine system status (DB connection check)
        $status = 'online';
        try {
            DB::connection()->getPdo();
        } catch (\Exception $e) {
            $status = 'maintenance';
        }

        return response()->json([
            'tenants' => $tenantCount,
            'status' => $status,
            'projects' => 7, // Fixed for now, can be dynamic later
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    /**
     * Get ecosystem nodes configuration.
     * Public endpoint: /api/ecosystem
     * Returns color-coded nodes based on active status.
     */
    public function index(\Illuminate\Http\Request $request): JsonResponse
    {
        // Colors
        $colors = [
            'active' => [
                'hub' => 0xffd700,    // Gold
                'natan' => 0x00ffdd,  // Cyan
                'art' => 0xff6b9d,    // Pink
                'info' => 0x00bfff,   // Blue
                'oracode' => 0xe34234, // Red
                'epp' => 0x228b22,    // Green
                'partner' => 0x9932cc, // Dark Orchid
            ],
            'inactive' => 0x444444,   // Gray
        ];

        // CHECK VIEW MODE
        $view = $request->query('view', 'main');

        if ($view === 'projects') {
             // --- PROJECT PAGE NODES ---
             // egi-hub (Center), egi, natan-loc, egi-info, egi-partner (sidebar only)
             $nodes = [
                'core' => [
                    'label' => 'EGI HUB',
                    'tagline' => 'Centro di Controllo',
                    'cat' => 'CORE',
                    'color' => $colors['active']['hub'],
                    'desc' => 'Home Page. Torna alla dashboard principale.',
                    'bullets' => ['Back to Home', 'System Status'],
                    'egi_link' => 'Il cuore dell\'ecosistema.',
                    'route' => '/', // Back to root (React router handles this)
                    'status' => 'active'
                ],
                // 1. EGI
                'egi' => [
                    'label' => 'EGI',
                    'tagline' => 'Ecosystem App',
                    'cat' => 'APP',
                    'color' => 0xff00ff, // Magenta
                    'desc' => 'L\'applicazione principale per gestire gli EGI.',
                    'bullets' => ['Marketplace', 'Wallet', 'Assets'],
                    'egi_link' => 'Applicazione EGI.',
                    'route' => 'https://egi.13.53.205.215.sslip.io',
                    'status' => 'active'
                ],
                // 2. NATAN-LOC
                'natan_loc' => [
                    'label' => 'NATAN LOC', // Natan Localization? Or Local?
                    'tagline' => 'AI Localization',
                    'cat' => 'AI',
                    'color' => $colors['active']['natan'],
                    'desc' => 'Servizi di localizzazione e assistenza AI.',
                    'bullets' => ['Localization', 'Assistance', 'AI Tools'],
                    'egi_link' => 'Intelligenza locale.',
                    'route' => 'https://natan-loc.13.53.205.215.sslip.io',
                    'status' => 'active'
                ],
                // 3. EGI-INFO
                'egi_info' => [
                    'label' => 'EGI INFO',
                    'tagline' => 'Documentation',
                    'cat' => 'DOCS',
                    'color' => $colors['active']['info'],
                    'desc' => 'Hub informativo e documentale.',
                    'bullets' => ['Docs', 'Guides', 'Wiki'],
                    'egi_link' => 'Informazione certificata.',
                    'route' => 'https://egi-info.13.53.205.215.sslip.io',
                    'status' => 'active'
                ],
                // 4. EGI-PARTNER (Sidebar Only - but we render it for 4-point symmetry?)
                // User said "metti solo la sidebar a destra come fai adesso".
                // If I don't put it in nodes, it won't appear as a sphere.
                // Assuming user wants 4 spheres.
                'egi_partner' => [
                    'label' => 'PARTNER',
                    'tagline' => 'Partner Hub',
                    'cat' => 'B2B',
                    'color' => $colors['active']['partner'],
                    'desc' => 'Area riservata ai partner.',
                    'bullets' => ['B2B Access', 'Integration', 'Support'],
                    'egi_link' => 'Collaborazione estesa.',
                    'route' => '#',
                    'status' => 'active'
                ],
                'orbitalConfig' => [
                    ['id' => 'egi', 'orbit' => 1],
                    ['id' => 'natan_loc', 'orbit' => 1],
                    ['id' => 'egi_info', 'orbit' => 1],
                    ['id' => 'egi_partner', 'orbit' => 1],
                ]
            ];
             return response()->json($nodes);
        }

        // --- MAIN VIEW (Default) ---
        // TODO: In Phase 4, fetch status from DB 'projects' table
        $nodes = [
            'core' => [
                'label' => 'HUB',
                'tagline' => 'Centro di Controllo',
                'cat' => 'CORE',
                'color' => $colors['active']['hub'],
                'desc' => 'Il cuore pulsante dell\'ecosistema.',
                'bullets' => ['Governance', 'Identity', 'System Status'],
                'egi_link' => 'Il punto di partenza.',
                'route' => 'https://egi-hub.13.53.205.215.sslip.io',
                'status' => 'active'
            ],
            // 1. GLI EGIS
            'egis' => [
                'label' => 'GLI EGIS',
                'tagline' => 'Asset & Collezioni',
                'cat' => 'ASSETS',
                'color' => 0xff00ff, // Magenta for Assets/Art
                'desc' => 'Tutto ciò che è stato Egizzato: Arte, Beni, Documenti.',
                'bullets' => ['Marketplace', 'NFT Collections', 'My Assets'],
                'egi_link' => 'Se esiste, vale.',
                'route' => 'https://egi.13.53.205.215.sslip.io',
                'status' => 'active'
            ],
            // 2. PROGETTI
            'progetti' => [
                'label' => 'PROGETTI',
                'tagline' => 'Applicazioni & Servizi',
                'cat' => 'APPS',
                'color' => 0x0088ff, // Blue for Projects/Apps
                'desc' => 'Le applicazioni verticali dell\'ecosistema.',
                'bullets' => ['FlorenceArtEGI', 'PartnerHub', 'Finance'],
                'egi_link' => 'Gli strumenti per operare.',
                'route' => '/projects', // Internal Client Route
                'status' => 'active'
            ],
            // 3. AMBIENTE
            'ambiente' => [
                'label' => 'AMBIENTE',
                'tagline' => 'Impatto & Rigenerazione',
                'cat' => 'IMPACT',
                'color' => 0x00ff00, // Green for Environment
                'desc' => 'Il monitoraggio dell\'impatto ambientale reale.',
                'bullets' => ['EPP Dashboard', 'Riforestazione', 'Certificati Green'],
                'egi_link' => 'Rigenera mentre operi.',
                'route' => '#',
                'status' => 'active'
            ],
            // 4. ORACODE
            'oracode' => [
                'label' => 'ORACODE',
                'tagline' => 'Verità & Codice',
                'cat' => 'ETHICS',
                'color' => 0xffaa00, // Gold/Orange for Truth/Code
                'desc' => 'Le regole, l\'etica e la documentazione del sistema.',
                'bullets' => ['White Paper', 'Documentation', 'Compliance'],
                'egi_link' => 'Il codice non mente.',
                'route' => '#',
                'status' => 'active'
            ],
            'orbitalConfig' => [
                ['id' => 'egis', 'orbit' => 1],
                ['id' => 'progetti', 'orbit' => 1],
                ['id' => 'ambiente', 'orbit' => 1],
                ['id' => 'oracode', 'orbit' => 1], // Balanced 4-point orbit
            ]
        ];

        return response()->json($nodes);
    }
}
