export type DaemonStatus = 'running' | 'stopped' | 'starting' | 'error' | 'unknown';

export interface DaemonProcess {
  id: number;
  name: string;
  slug: string;
  supervisor_program: string;
  command: string;
  directory: string | null;
  user: string;
  numprocs: number;
  autostart: boolean;
  autorestart: boolean;
  startsecs: number;
  startretries: number;
  stopwaitsecs: number;
  stopsignal: string;
  stdout_logfile: string | null;
  stderr_logfile: string | null;
  project_id: number | null;
  project?: { id: number; name: string; slug: string } | null;
  status: DaemonStatus;
  environment: string | null;
  metadata: Record<string, unknown> | null;
  last_status_check: string | null;
  created_at: string;
  updated_at: string;
}

export interface DaemonStats {
  total: number;
  running: number;
  stopped: number;
  error: number;
}

export interface CreateDaemonData {
  name: string;
  command: string;
  directory?: string;
  user?: string;
  numprocs?: number;
  autostart?: boolean;
  autorestart?: boolean;
  startsecs?: number;
  startretries?: number;
  stopwaitsecs?: number;
  stopsignal?: string;
  stdout_logfile?: string;
  stderr_logfile?: string;
  project_id?: number | null;
  environment?: string;
  auto_start_now?: boolean;
}

export interface UpdateDaemonData extends Partial<CreateDaemonData> {}

export interface DaemonLogData {
  success: boolean;
  content: string;
  file: string;
  lines: number;
  error?: string;
}
