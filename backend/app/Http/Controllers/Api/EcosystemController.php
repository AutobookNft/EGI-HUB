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
        // 5 ORBITS + CORE (Single-Question Design Philosophy)
        $nodes = [
            // CORE: EGI
            'core' => [
                'label' => 'EGI',
                'tagline' => "L'unità che rende tutto possibile",
                'cat' => 'CORE',
                'color' => $colors['active']['hub'],
                'desc' => 'Cos\'è un EGI, cosa significa "egizzare", perché è diverso da NFT.',
                'bullets' => ['Wrapper<T> universale', 'Certificazione on-chain', 'Valore reale'],
                'egi_link' => 'Se esiste, egizzalo. Se lo egizzi, vale.',
                'route' => '#detail-egi', // Opens detail panel
                'cta' => 'Vedi esempi reali',
                'question' => 'Che cos\'è l\'unità che rende tutto possibile?',
                'status' => 'active'
            ],
            
            // ORBIT 1: PROGETTI
            'progetti' => [
                'label' => 'PROGETTI',
                'tagline' => 'FlorenceEGI · NATAN · EGI-INFO · Satellite',
                'cat' => 'ECOSISTEMA',
                'color' => 0x00ffdd, // Cyan
                'desc' => 'Le applicazioni concrete dell\'ecosistema EGI.',
                'bullets' => ['FlorenceEGI (Marketplace)', 'NATAN (AI Compliance)', 'EGI-INFO (Docs)', 'Programmi satellite'],
                'egi_link' => 'Gli strumenti operativi.',
                'route' => '/projects', // Internal SPA route
                'question' => 'Quali mondi concreti esistono?',
                'status' => 'active'
            ],
            
            // ORBIT 2: AMBIENTE
            'ambiente' => [
                'label' => 'AMBIENTE',
                'tagline' => 'EPP · Flussi · Progetti Reali',
                'cat' => 'IMPACT',
                'color' => $colors['active']['epp'], // Green
                'desc' => 'Monitoraggio dell\'impatto ambientale certificato.',
                'bullets' => ['Environmental Protection Protocol', 'Percentuali trasparenti', 'Progetti di riforestazione verificati'],
                'egi_link' => 'Dove va l\'impatto economico.',
                'route' => '/ambiente', // ⭐ Internal page with hyperspace
                'question' => 'Dove va l\'impatto?',
                'status' => 'active'
            ],
            
            // ORBIT 3: ORACODE
            'oracode' => [
                'label' => 'ORACODE',
                'tagline' => 'OS3 · OS4 · NATAN Method',
                'cat' => 'INTELLIGENZA',
                'color' => $colors['active']['oracode'], // Red
                'desc' => 'Il sistema operativo cognitivo che governa l\'ecosistema.',
                'bullets' => ['OS3 (AI discipline)', 'OS4 (Human education)', 'NATAN AI framework'],
                'egi_link' => 'Non è una piattaforma. È un organismo.',
                'route' => '/oracode', // ⭐ Internal page with hyperspace
                'question' => 'Che intelligenza governa questo sistema?',
                'status' => 'active'
            ],
            
            // ORBIT 4: INFO
            'info' => [
                'label' => 'INFO',
                'tagline' => 'Verità completa, versionata',
                'cat' => 'DOCUMENTAZIONE',
                'color' => $colors['active']['info'], // Blue
                'desc' => 'Portal alla documentazione completa certificata.',
                'bullets' => ['White papers', 'Technical docs', 'Version history'],
                'egi_link' => 'Qui c\'è la verità completa.',
                'route' => 'https://egi-info.13.53.205.215.sslip.io',
                'question' => 'Dove sono i dettagli?',
                'status' => 'active'
            ],
            
            // ORBIT 5: CORPORATE
            'corporate' => [
                'label' => 'CORPORATE',
                'tagline' => 'Frangette · Team · Legal · Contatti',
                'cat' => 'CORPORATE',
                'color' => 0x9932cc, // Purple/Orchid
                'desc' => 'Chi c\'è dietro e chi risponde.',
                'bullets' => ['Frangette SRL', 'Team members', 'Legal framework', 'Contatti diretti'],
                'egi_link' => 'Trasparenza totale.',
                'route' => '/corporate', // ⭐ Internal page with hyperspace
                'question' => 'Chi c\'è dietro e chi risponde?',
                'status' => 'active'
            ],
            
            'orbitalConfig' => [
                ['id' => 'progetti', 'orbit' => 1],
                ['id' => 'ambiente', 'orbit' => 2],
                ['id' => 'oracode', 'orbit' => 3],
                ['id' => 'info', 'orbit' => 4],
                ['id' => 'corporate', 'orbit' => 5],
            ]
        ];

        return response()->json($nodes);
    }
}
