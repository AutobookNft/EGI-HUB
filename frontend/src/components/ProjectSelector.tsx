/**
 * Project Selector
 * 
 * Dropdown per selezionare il progetto corrente.
 * Appare nella navbar superiore.
 */

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronDown, 
  FolderOpen, 
  Check, 
  X,
  Star,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useProject } from '../contexts/ProjectContext';

export default function ProjectSelector() {
  const navigate = useNavigate();
  const { 
    projects, 
    loadingProjects, 
    currentProject, 
    selectProject,
    isSuperAdmin 
  } = useProject();
  
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Chiudi dropdown quando si clicca fuori
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectProject = (project: typeof projects[0] | null) => {
    selectProject(project);
    setIsOpen(false);
    
    if (project) {
      navigate(`/project/${project.slug}`);
    } else {
      navigate('/');
    }
  };

  if (loadingProjects) {
    return (
      <div className="flex items-center gap-2 px-3 py-2">
        <span className="loading loading-spinner loading-sm"></span>
        <span className="text-sm text-base-content/70">Caricamento...</span>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-lg transition-colors
          ${currentProject 
            ? 'bg-primary/10 text-primary hover:bg-primary/20' 
            : 'bg-base-200 hover:bg-base-300'
          }
        `}
      >
        <FolderOpen className="w-4 h-4" />
        <span className="font-medium max-w-[150px] truncate">
          {currentProject ? currentProject.name : 'Seleziona Progetto'}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-base-100 rounded-lg shadow-xl border border-base-300 z-50 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-base-300 bg-base-200/50">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">I tuoi progetti</span>
              {isSuperAdmin && (
                <span className="badge badge-warning badge-sm gap-1">
                  <Star className="w-3 h-3" />
                  Super Admin
                </span>
              )}
            </div>
          </div>

          {/* Project List */}
          <div className="max-h-80 overflow-y-auto">
            {/* Exit Project Option */}
            {currentProject && (
              <button
                onClick={() => handleSelectProject(null)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-base-200 transition-colors border-b border-base-300"
              >
                <div className="w-8 h-8 rounded-lg bg-base-300 flex items-center justify-center">
                  <X className="w-4 h-4" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium text-sm">Esci dal progetto</div>
                  <div className="text-xs text-base-content/60">Torna alla vista globale</div>
                </div>
              </button>
            )}

            {/* Projects */}
            {projects.length === 0 ? (
              <div className="px-4 py-8 text-center text-base-content/60">
                <FolderOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nessun progetto accessibile</p>
              </div>
            ) : (
              projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => handleSelectProject(project)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 hover:bg-base-200 transition-colors
                    ${currentProject?.id === project.id ? 'bg-primary/10' : ''}
                  `}
                >
                  {/* Project Icon */}
                  <div className={`
                    w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm
                    ${project.is_healthy ? 'bg-primary' : 'bg-error'}
                  `}>
                    {project.name.substring(0, 2).toUpperCase()}
                  </div>

                  {/* Project Info */}
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">{project.name}</span>
                      {project.is_healthy ? (
                        <CheckCircle className="w-3 h-3 text-success flex-shrink-0" />
                      ) : (
                        <AlertCircle className="w-3 h-3 text-error flex-shrink-0" />
                      )}
                    </div>
                    <div className="text-xs text-base-content/60 truncate">
                      {project.access?.role_label || project.slug}
                    </div>
                  </div>

                  {/* Selected Indicator */}
                  {currentProject?.id === project.id && (
                    <Check className="w-4 h-4 text-primary flex-shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>

          {/* Footer - SuperAdmin Link */}
          {isSuperAdmin && (
            <div className="px-4 py-3 border-t border-base-300 bg-base-200/50">
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate('/projects');
                }}
                className="text-xs text-primary hover:underline"
              >
                Gestisci tutti i progetti →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
