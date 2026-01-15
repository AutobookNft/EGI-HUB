/**
 * Project Context
 * 
 * Gestisce il progetto attualmente selezionato.
 * Quando un progetto è selezionato, la sidebar mostra le sezioni di quel progetto.
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getMyProjects } from '../services/projectApi';
import { useAuth } from './AuthContext';
import type { MyProject } from '../types/project';

interface ProjectContextType {
  // Lista progetti accessibili
  natan_loc COMprojects: MyProject[];
  loadingProjects: boolean;
  
  // Progetto correntemente selezionato
  currentProject: MyProject | null;
  selectProject: (project: MyProject | null) => void;
  
  // Helper
  isSuperAdmin: boolean;
  isInProjectContext: boolean;
  
  // Refresh
  refreshProjects: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

const CURRENT_PROJECT_KEY = 'egi_hub_current_project';

export function ProjectProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [projects, setProjects] = useState<MyProject[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [currentProject, setCurrentProject] = useState<MyProject | null>(null);

  // Carica i progetti quando l'utente è autenticato
  useEffect(() => {
    if (isAuthenticated) {
      refreshProjects();
    } else {
      setProjects([]);
      setCurrentProject(null);
      setIsSuperAdmin(false);
      setLoadingProjects(false);
    }
  }, [isAuthenticated]);

  // Ripristina il progetto salvato
  useEffect(() => {
    if (projects.length > 0) {
      const savedProjectSlug = localStorage.getItem(CURRENT_PROJECT_KEY);
      if (savedProjectSlug) {
        const savedProject = projects.find(p => p.slug === savedProjectSlug);
        if (savedProject) {
          setCurrentProject(savedProject);
        }
      }
    }
  }, [projects]);

  const refreshProjects = async () => {
    try {
      setLoadingProjects(true);
      const response = await getMyProjects();
      setProjects(response.data);
      setIsSuperAdmin(response.is_super_admin);
    } catch (error) {
      console.error('Error loading projects:', error);
      setProjects([]);
    } finally {
      setLoadingProjects(false);
    }
  };

  const selectProject = (project: MyProject | null) => {
    setCurrentProject(project);
    if (project) {
      localStorage.setItem(CURRENT_PROJECT_KEY, project.slug);
    } else {
      localStorage.removeItem(CURRENT_PROJECT_KEY);
    }
  };

  return (
    <ProjectContext.Provider
      value={{
        projects,
        loadingProjects,
        currentProject,
        selectProject,
        isSuperAdmin,
        isInProjectContext: currentProject !== null,
        refreshProjects,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}
