import { useQuery } from '@tanstack/react-query';
import { Code2, Loader2, AlertCircle, Search, Eye } from 'lucide-react';
import { useState } from 'react';
import api from '../../services/api';

interface Symbol {
  id: number;
  name: string;
  type: 'class' | 'function' | 'method' | 'variable' | 'constant';
  file_path: string;
  line_number: number;
  description: string;
  tags: string[];
  compliance_status: 'compliant' | 'needs_review' | 'non_compliant';
}

interface SymbolsResponse {
  symbols: Symbol[];
  total: number;
  by_type: Record<string, number>;
}

export default function Symbols() {
  const [searchTerm, setSearchTerm] = useState('');
  
  const { data, isLoading, error } = useQuery<SymbolsResponse>({
    queryKey: ['padmin-symbols', searchTerm],
    queryFn: () => api.get(`/superadmin/padmin/symbols?search=${searchTerm}`).then(res => res.data),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error">
        <AlertCircle className="w-6 h-6" />
        <span>Errore nel caricamento dei simboli. Assicurati che il backend EGI sia attivo.</span>
      </div>
    );
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'class': return '🏛️';
      case 'function': return '⚡';
      case 'method': return '🔧';
      case 'variable': return '📦';
      case 'constant': return '🔒';
      default: return '📄';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'compliant': return 'badge-success';
      case 'needs_review': return 'badge-warning';
      case 'non_compliant': return 'badge-error';
      default: return 'badge-ghost';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-base-content">OS3 Symbols</h1>
        <p className="text-base-content/60">Catalogo dei simboli del codebase</p>
      </div>

      {/* Search */}
      <div className="join w-full max-w-xl">
        <input 
          type="text"
          placeholder="Cerca simboli..."
          className="input input-bordered join-item flex-1"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button className="btn btn-primary join-item">
          <Search className="w-4 h-4" />
        </button>
      </div>

      {/* Stats */}
      <div className="flex gap-4 flex-wrap">
        {data?.by_type && Object.entries(data.by_type).map(([type, count]) => (
          <div key={type} className="badge badge-lg badge-outline gap-2">
            {getTypeIcon(type)}
            <span className="capitalize">{type}</span>
            <span className="font-bold">{count}</span>
          </div>
        ))}
      </div>

      {/* Symbols Table */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Nome</th>
                  <th>File</th>
                  <th>Descrizione</th>
                  <th>Tags</th>
                  <th>Stato</th>
                  <th>Azioni</th>
                </tr>
              </thead>
              <tbody>
                {data?.symbols?.length ? (
                  data.symbols.map((symbol) => (
                    <tr key={symbol.id}>
                      <td>
                        <span className="text-xl" title={symbol.type}>
                          {getTypeIcon(symbol.type)}
                        </span>
                      </td>
                      <td><code className="font-mono text-sm">{symbol.name}</code></td>
                      <td>
                        <div className="text-xs">
                          <code>{symbol.file_path}</code>
                          <span className="text-base-content/60 ml-1">:{symbol.line_number}</span>
                        </div>
                      </td>
                      <td className="max-w-xs truncate">{symbol.description}</td>
                      <td>
                        <div className="flex gap-1 flex-wrap">
                          {symbol.tags.slice(0, 3).map((tag, idx) => (
                            <span key={idx} className="badge badge-sm badge-ghost">{tag}</span>
                          ))}
                          {symbol.tags.length > 3 && (
                            <span className="badge badge-sm">+{symbol.tags.length - 3}</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${getStatusBadge(symbol.compliance_status)}`}>
                          {symbol.compliance_status.replace('_', ' ')}
                        </span>
                      </td>
                      <td>
                        <button className="btn btn-ghost btn-xs">
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center py-12">
                      <Code2 className="w-12 h-12 mx-auto text-base-content/30 mb-4" />
                      <p className="text-base-content/60">Nessun simbolo trovato</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
