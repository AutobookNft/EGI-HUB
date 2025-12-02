import { useState } from 'react';
import { Search, Loader2, AlertCircle, FileCode, Filter } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';

interface SearchResult {
  id: number;
  file_path: string;
  line_number: number;
  content: string;
  match_type: 'symbol' | 'comment' | 'code';
  relevance_score: number;
}

interface SearchResponse {
  results: SearchResult[];
  total: number;
  query: string;
}

export default function PadminSearch() {
  const [query, setQuery] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const { data, isLoading, error, refetch } = useQuery<SearchResponse>({
    queryKey: ['padmin-search', searchQuery],
    queryFn: () => api.get(`/superadmin/padmin/search?q=${searchQuery}`).then(res => res.data),
    enabled: searchQuery.length > 0,
  });

  const handleSearch = () => {
    setSearchQuery(query);
    refetch();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-base-content">OS3 Search</h1>
        <p className="text-base-content/60">Ricerca semantica nel codebase</p>
      </div>

      {/* Search Box */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="flex gap-2">
            <div className="join flex-1">
              <input 
                type="text"
                placeholder="Cerca nel codebase (simboli, commenti, codice)..."
                className="input input-bordered join-item flex-1"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button className="btn btn-ghost join-item">
                <Filter className="w-4 h-4" />
              </button>
              <button 
                className="btn btn-primary join-item"
                onClick={handleSearch}
                disabled={query.length < 2}
              >
                <Search className="w-4 h-4" />
                Cerca
              </button>
            </div>
          </div>
          <div className="flex gap-2 mt-2">
            <span className="text-sm text-base-content/60">Suggerimenti:</span>
            {['@Oracode', 'TODO:', 'FIXME:', 'class:', 'function:'].map((suggestion) => (
              <button 
                key={suggestion}
                className="badge badge-ghost cursor-pointer hover:badge-primary"
                onClick={() => setQuery(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-2">Ricerca in corso...</span>
        </div>
      )}

      {error && (
        <div className="alert alert-error">
          <AlertCircle className="w-6 h-6" />
          <span>Errore nella ricerca. Assicurati che il backend EGI sia attivo.</span>
        </div>
      )}

      {data && (
        <div className="space-y-4">
          <div className="text-sm text-base-content/60">
            {data.total} risultati per "{data.query}"
          </div>

          {data.results?.length ? (
            data.results.map((result) => (
              <div key={result.id} className="card bg-base-100 shadow">
                <div className="card-body py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileCode className="w-4 h-4 text-primary" />
                      <code className="text-sm">{result.file_path}</code>
                      <span className="text-base-content/60">:{result.line_number}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`badge badge-sm ${
                        result.match_type === 'symbol' ? 'badge-primary' :
                        result.match_type === 'comment' ? 'badge-secondary' : 'badge-ghost'
                      }`}>
                        {result.match_type}
                      </span>
                      <span className="text-xs text-base-content/40">
                        Score: {result.relevance_score.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <pre className="bg-base-200 rounded-lg p-3 text-sm overflow-x-auto mt-2">
                    <code>{result.content}</code>
                  </pre>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <Search className="w-12 h-12 mx-auto text-base-content/30 mb-4" />
              <p className="text-base-content/60">Nessun risultato trovato</p>
            </div>
          )}
        </div>
      )}

      {!data && !isLoading && !error && (
        <div className="text-center py-12">
          <Search className="w-16 h-16 mx-auto text-base-content/20 mb-4" />
          <p className="text-base-content/60">Inserisci un termine di ricerca per iniziare</p>
        </div>
      )}
    </div>
  );
}
