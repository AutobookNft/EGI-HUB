/**
 * Project Admin Dashboard
 * 
 * Main dashboard for a Project Admin after entering a specific project.
 * Shows project stats, tenant management, and quick actions.
 */

import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeftIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  ServerIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
  UsersIcon
} from '@heroicons/react/24/outline';
import { getProject, checkProjectHealth } from '../../services/projectApi';
import type { Project, ProjectHealthCheck } from '../../types/project';

interface DashboardCard {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  link?: string;
}

export default function ProjectDashboard() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  
  const [project, setProject] = useState<Project | null>(null);
  const [health, setHealth] = useState<ProjectHealthCheck | null>(null);
  const [loading, setLoading] = useState(true);
  const [healthLoading, setHealthLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (slug) {
      loadProject();
    }
  }, [slug]);

  const loadProject = async () => {
    try {
      setLoading(true);
      // For now, we'll get project by slug from the list
      // In a real scenario, we'd have a getProjectBySlug endpoint
      const response = await fetch(`/api/projects?slug=${slug}`);
      const data = await response.json();
      
      if (data.success && data.data.length > 0) {
        setProject(data.data[0]);
      } else {
        setError('Progetto non trovato');
      }
    } catch (err) {
      setError('Impossibile caricare il progetto');
      console.error('Error loading project:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshHealth = async () => {
    if (!project) return;
    
    try {
      setHealthLoading(true);
      const response = await checkProjectHealth(project.id);
      setHealth(response.health);
      setProject(response.project);
    } catch (err) {
      console.error('Error checking health:', err);
    } finally {
      setHealthLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="alert alert-error">
        <ExclamationCircleIcon className="w-6 h-6" />
        <span>{error || 'Progetto non trovato'}</span>
        <Link to="/my-projects" className="btn btn-sm">
          Torna ai miei progetti
        </Link>
      </div>
    );
  }

  const dashboardCards: DashboardCard[] = [
    {
      title: 'Tenant Attivi',
      value: '—',  // TODO: Fetch from project API
      icon: <UserGroupIcon className="w-8 h-8" />,
      color: 'text-primary',
      link: `/projects/${slug}/tenants`,
    },
    {
      title: 'Utenti Totali',
      value: '—',
      icon: <UsersIcon className="w-8 h-8" />,
      color: 'text-secondary',
      link: `/projects/${slug}/users`,
    },
    {
      title: 'API Calls (24h)',
      value: '—',
      icon: <ChartBarIcon className="w-8 h-8" />,
      color: 'text-accent',
      link: `/projects/${slug}/analytics`,
    },
    {
      title: 'Logs',
      value: 'Vedi',
      icon: <DocumentTextIcon className="w-8 h-8" />,
      color: 'text-info',
      link: `/projects/${slug}/logs`,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm breadcrumbs">
        <Link to="/my-projects" className="link link-hover flex items-center gap-1">
          <ArrowLeftIcon className="w-4 h-4" />
          I Miei Progetti
        </Link>
        <span>/</span>
        <span className="font-medium">{project.name}</span>
      </div>

      {/* Project Header */}
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${project.is_healthy ? 'bg-success/10' : 'bg-error/10'}`}>
                <ServerIcon className={`w-8 h-8 ${project.is_healthy ? 'text-success' : 'text-error'}`} />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{project.name}</h1>
                <p className="text-base-content/60">{project.url}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Health Status */}
              <div className={`badge ${project.is_healthy ? 'badge-success' : 'badge-error'} gap-1 badge-lg`}>
                {project.is_healthy 
                  ? <CheckCircleIcon className="w-4 h-4" />
                  : <ExclamationCircleIcon className="w-4 h-4" />
                }
                {project.is_healthy ? 'Online' : 'Offline'}
              </div>

              <button 
                className={`btn btn-sm btn-ghost ${healthLoading ? 'loading' : ''}`}
                onClick={refreshHealth}
                disabled={healthLoading}
              >
                <ArrowPathIcon className={`w-4 h-4 ${healthLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          {project.description && (
            <p className="mt-4 text-base-content/70">{project.description}</p>
          )}

          {/* Last Health Check */}
          {project.last_health_check && (
            <p className="text-xs text-base-content/50 mt-2">
              Ultimo controllo: {new Date(project.last_health_check).toLocaleString()}
            </p>
          )}
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {dashboardCards.map((card, index) => (
          <Link 
            key={index}
            to={card.link || '#'}
            className="card bg-base-100 shadow hover:shadow-lg transition-shadow"
          >
            <div className="card-body">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-base-content/60 text-sm">{card.title}</p>
                  <p className="text-2xl font-bold mt-1">{card.value}</p>
                </div>
                <div className={card.color}>
                  {card.icon}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tenant Management Card */}
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <h2 className="card-title">
              <UserGroupIcon className="w-5 h-5" />
              Gestione Tenant
            </h2>
            <p className="text-base-content/70">
              Gestisci i tenant (clienti) di questo progetto.
            </p>
            <div className="card-actions justify-end mt-4">
              <Link to={`/projects/${slug}/tenants`} className="btn btn-primary btn-sm">
                Vai ai Tenant
              </Link>
            </div>
          </div>
        </div>

        {/* Settings Card */}
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <h2 className="card-title">
              <Cog6ToothIcon className="w-5 h-5" />
              Configurazione
            </h2>
            <p className="text-base-content/70">
              Modifica le impostazioni e configurazioni del progetto.
            </p>
            <div className="card-actions justify-end mt-4">
              <Link to={`/projects/${slug}/settings`} className="btn btn-outline btn-sm">
                Impostazioni
              </Link>
            </div>
          </div>
        </div>

        {/* Admins Card */}
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <h2 className="card-title">
              <ShieldCheckIcon className="w-5 h-5" />
              Project Admins
            </h2>
            <p className="text-base-content/70">
              Gestisci chi ha accesso a questo progetto e con quali permessi.
            </p>
            <div className="card-actions justify-end mt-4">
              <Link to={`/projects/${slug}/admins`} className="btn btn-outline btn-sm">
                Gestisci Admins
              </Link>
            </div>
          </div>
        </div>

        {/* Analytics Card */}
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <h2 className="card-title">
              <ChartBarIcon className="w-5 h-5" />
              Analytics
            </h2>
            <p className="text-base-content/70">
              Visualizza statistiche e metriche del progetto.
            </p>
            <div className="card-actions justify-end mt-4">
              <Link to={`/projects/${slug}/analytics`} className="btn btn-outline btn-sm">
                Vedi Analytics
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
