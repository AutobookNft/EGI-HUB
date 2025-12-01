# 🌐 EGI-HUB - Contesto per Copilot

## Stato Attuale (Dicembre 2025)

EGI-HUB è il layer di coordinamento centrale per l'ecosistema FlorenceEGI.

### ✅ Già Implementato

1. **Sistema Aggregazioni P2P** - Permette ai tenant (Comuni) di formare federazioni consensuali
2. **Modelli creati**:
   - `src/Models/Aggregation.php`
   - `src/Models/AggregationMember.php`
3. **Trait**: `src/Traits/HasAggregations.php` (già integrato in Tenant.php di NATAN_LOC)
4. **Migrazioni**: 
   - `database/migrations/2025_11_28_000001_create_aggregations_table.php`
   - `database/migrations/2025_11_28_000002_create_aggregation_members_table.php`
5. **Service Provider**: `src/HubServiceProvider.php`

### 🔲 Da Implementare (Prossimi Passi)

1. **API Controller per Aggregazioni**
   - CRUD aggregazioni
   - Sistema inviti (invite, accept, reject)
   - Lista membri
   - Uscita volontaria

2. **Frontend Selector**
   - Widget per scelta fonti dati nelle query
   - Visualizzazione aggregazioni disponibili

3. **Integrazione Python Service**
   - Passare `tenant_ids[]` a MongoDB per query multi-tenant
   - Aggiornare RAG service

4. **NATAN_DDQF** (Document-Driven Question Framework)
   - Framework per domande basate su documenti

## Progetti Collegati

| Progetto | Path | Descrizione |
|----------|------|-------------|
| **NATAN_LOC** | `/home/fabio/NATAN_LOC` | AI Assistant per PA - Usa EGI-HUB come dipendenza |
| **EGI** | `/home/fabio/EGI` | FlorenceArtEGI - Piattaforma NFT |

## Come Usare EGI-HUB

### Da NATAN_LOC
```php
// Già configurato in composer.json
use FlorenceEgi\Hub\Traits\HasAggregations;

class Tenant extends Model {
    use HasAggregations;
    
    // Metodi disponibili:
    // $tenant->getActiveAggregations()
    // $tenant->getAccessibleTenantIds()
    // $tenant->canAccessTenant($tenantId)
    // $tenant->createAggregation($name, $options)
}
```

## File di Riferimento

- **README principale**: `/home/fabio/EGI-HUB/README.md`
- **NATAN_LOC stato**: `docs/NATAN_LOC_STATO_DELLARTE.md`
- **Standard OS3**: `docs/Oracode_Systems/`
- **Regole enterprise**: `docs/ULTRA_EXCELLENCE_ENTERPRISE_RULES.md`

## Database

EGI-HUB usa il **MariaDB condiviso** con NATAN_LOC e EGI:
- Host: localhost
- Database: EGI
- Tabelle: `aggregations`, `aggregation_members`
