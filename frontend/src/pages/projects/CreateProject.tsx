import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderKanban, ArrowLeft, Save, Globe, Server, Terminal } from 'lucide-react';
import api from '@/services/api';

/**
 * CreateProject
 * 
 * Form per creare un nuovo progetto SaaS nell'ecosistema EGI-HUB.
 * 
 * NOTE: I "Projects" in EGI-HUB sono le applicazioni SaaS (NATAN_LOC, EGI, etc.)
 * mentre i "Tenants" sono i clienti finali di ogni progetto.
 */
export default function CreateProject() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    url: '',
    production_url: '',
    staging_url: '',
    local_start_script: '',
    local_stop_script: '',
    supervisor_program: '',
    status: 'active',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await api.post('/projects', formData);
      navigate('/projects');
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Errore nella creazione del progetto');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Auto-genera slug dal nome
    if (field === 'name' && !formData.slug) {
      setFormData(prev => ({
        ...prev,
        slug: value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/projects')} className="btn btn-ghost btn-square">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <FolderKanban className="w-8 h-8 text-primary" />
            Nuovo Progetto SaaS
          </h1>
          <p className="text-base-content/60 mt-1">
            Registra un nuovo progetto nell'ecosistema EGI-HUB
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h2 className="card-title text-lg mb-4">
              <FolderKanban className="w-5 h-5" />
              Informazioni Base
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Nome Progetto *</span>
                </label>
                <input
                  type="text"
                  placeholder="es. NATAN LOC"
                  className="input input-bordered"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  required
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Slug *</span>
                </label>
                <input
                  type="text"
                  placeholder="es. natan"
                  className="input input-bordered font-mono"
                  value={formData.slug}
                  onChange={(e) => handleChange('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  required
                />
                <label className="label">
                  <span className="label-text-alt text-base-content/60">
                    Identificativo univoco (solo lettere minuscole, numeri e trattini)
                  </span>
                </label>
              </div>

              <div className="form-control md:col-span-2">
                <label className="label">
                  <span className="label-text font-medium">Descrizione</span>
                </label>
                <textarea
                  placeholder="es. AI Assistant per Pubbliche Amministrazioni - SaaS multi-tenant"
                  className="textarea textarea-bordered"
                  rows={2}
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* URLs */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h2 className="card-title text-lg mb-4">
              <Globe className="w-5 h-5" />
              URL del Progetto
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control md:col-span-2">
                <label className="label">
                  <span className="label-text font-medium">URL Attivo *</span>
                </label>
                <input
                  type="url"
                  placeholder="http://localhost:7000"
                  className="input input-bordered"
                  value={formData.url}
                  onChange={(e) => handleChange('url', e.target.value)}
                  required
                />
                <label className="label">
                  <span className="label-text-alt text-base-content/60">
                    URL corrente del progetto (cambia in base all'ambiente)
                  </span>
                </label>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">URL Staging</span>
                </label>
                <input
                  type="url"
                  placeholder="https://natan-loc.13.48.57.194.sslip.io"
                  className="input input-bordered"
                  value={formData.staging_url}
                  onChange={(e) => handleChange('staging_url', e.target.value)}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">URL Produzione</span>
                </label>
                <input
                  type="url"
                  placeholder="https://natan.florenceegi.com"
                  className="input input-bordered"
                  value={formData.production_url}
                  onChange={(e) => handleChange('production_url', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Service Control */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h2 className="card-title text-lg mb-4">
              <Terminal className="w-5 h-5" />
              Controllo Servizi
            </h2>
            
            <div className="alert alert-info mb-4">
              <Server className="w-5 h-5" />
              <div>
                <p className="font-medium">Ambiente Locale vs Produzione</p>
                <p className="text-sm">In locale usa gli script bash, in staging/produzione usa Supervisor (Forge)</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Script Start (Locale)</span>
                </label>
                <input
                  type="text"
                  placeholder="/home/fabio/dev/NATAN_LOC/start_services.sh"
                  className="input input-bordered font-mono text-sm"
                  value={formData.local_start_script}
                  onChange={(e) => handleChange('local_start_script', e.target.value)}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Script Stop (Locale)</span>
                </label>
                <input
                  type="text"
                  placeholder="/home/fabio/dev/NATAN_LOC/stop_services.sh"
                  className="input input-bordered font-mono text-sm"
                  value={formData.local_stop_script}
                  onChange={(e) => handleChange('local_stop_script', e.target.value)}
                />
              </div>

              <div className="form-control md:col-span-2">
                <label className="label">
                  <span className="label-text font-medium">Programma Supervisor (Produzione)</span>
                </label>
                <input
                  type="text"
                  placeholder="tenant-natan"
                  className="input input-bordered font-mono"
                  value={formData.supervisor_program}
                  onChange={(e) => handleChange('supervisor_program', e.target.value)}
                />
                <label className="label">
                  <span className="label-text-alt text-base-content/60">
                    Nome del programma Supervisor configurato su Forge
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <button 
            type="button" 
            className="btn btn-ghost"
            onClick={() => navigate('/projects')}
          >
            Annulla
          </button>
          <button 
            type="submit" 
            className="btn btn-primary gap-2"
            disabled={loading}
          >
            {loading ? (
              <span className="loading loading-spinner loading-sm"></span>
            ) : (
              <Save className="w-5 h-5" />
            )}
            Crea Progetto
          </button>
        </div>
      </form>
    </div>
  );
}
