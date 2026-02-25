/**
 * @package frontend/src/pages/platform
 * @author Padmin D. Curtis (AI Partner OS3.0) for Fabio Cherici
 * @version 1.0.0 (EGI-HUB - PlatformSettings UI)
 * @date 2025-01-28
 * @purpose Gestione impostazioni di piattaforma raggruppate per gruppo — FASE 2.4
 */

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Settings, Save, ChevronDown, ChevronRight, Lock, Edit2, X, Check } from 'lucide-react'
import api from '../../services/api'

// ─────────────────────────────────────────────────────────────────────────────
// Interfaces
// ─────────────────────────────────────────────────────────────────────────────

interface PlatformSetting {
  id: number
  group: string
  key: string
  value: string | number | boolean | null
  value_type: 'string' | 'integer' | 'decimal' | 'boolean' | 'json'
  label: string
  description: string | null
  is_editable: boolean
}

interface SettingsResponse {
  success: boolean
  data: Record<string, PlatformSetting[]>
  groups: string[]
  total: number
}

interface UpdateSinglePayload {
  value: string | number | boolean | null
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper functions
// ─────────────────────────────────────────────────────────────────────────────

function formatValueType(type: PlatformSetting['value_type']): { label: string; color: string } {
  const map: Record<string, { label: string; color: string }> = {
    string:  { label: 'string',  color: 'badge-info' },
    integer: { label: 'integer', color: 'badge-warning' },
    decimal: { label: 'decimal', color: 'badge-warning' },
    boolean: { label: 'boolean', color: 'badge-success' },
    json:    { label: 'JSON',    color: 'badge-error' },
  }
  return map[type] ?? { label: type, color: 'badge-ghost' }
}

function displayValue(setting: PlatformSetting): string {
  if (setting.value === null || setting.value === undefined) return '—'
  if (setting.value_type === 'boolean') return setting.value ? 'true' : 'false'
  return String(setting.value)
}

function parseInputValue(
  raw: string,
  type: PlatformSetting['value_type']
): string | number | boolean | null {
  if (raw === '') return null
  if (type === 'integer') return parseInt(raw, 10)
  if (type === 'decimal') return parseFloat(raw)
  if (type === 'boolean') return raw === 'true'
  return raw
}

// ─────────────────────────────────────────────────────────────────────────────
// Inline Edit Cell
// ─────────────────────────────────────────────────────────────────────────────

interface EditCellProps {
  setting: PlatformSetting
  onSave: (id: number, value: string | number | boolean | null) => void
  saving: boolean
}

function EditCell({ setting, onSave, saving }: EditCellProps) {
  const [editing, setEditing] = useState(false)
  const [raw, setRaw] = useState(() => displayValue(setting))

  if (!setting.is_editable) {
    return (
      <span className="flex items-center gap-1 text-base-content/50">
        <Lock size={12} />
        {displayValue(setting)}
      </span>
    )
  }

  if (!editing) {
    return (
      <button
        className="flex items-center gap-2 hover:text-primary transition-colors group"
        onClick={() => {
          setRaw(displayValue(setting))
          setEditing(true)
        }}
        title="Modifica valore"
      >
        <span className="font-mono text-sm">{displayValue(setting)}</span>
        <Edit2 size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>
    )
  }

  const handleSave = () => {
    onSave(setting.id, parseInputValue(raw, setting.value_type))
    setEditing(false)
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave()
    if (e.key === 'Escape') setEditing(false)
  }

  // Boolean gets a select
  if (setting.value_type === 'boolean') {
    return (
      <div className="flex items-center gap-1">
        <select
          className="select select-xs select-bordered font-mono"
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          autoFocus
        >
          <option value="true">true</option>
          <option value="false">false</option>
        </select>
        <button
          className="btn btn-xs btn-success"
          onClick={handleSave}
          disabled={saving}
          title="Salva"
        >
          <Check size={12} />
        </button>
        <button
          className="btn btn-xs btn-ghost"
          onClick={() => setEditing(false)}
          title="Annulla"
        >
          <X size={12} />
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1">
      <input
        type={setting.value_type === 'integer' || setting.value_type === 'decimal' ? 'number' : 'text'}
        className="input input-xs input-bordered font-mono w-40"
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        onKeyDown={handleKey}
        autoFocus
        step={setting.value_type === 'decimal' ? '0.01' : undefined}
      />
      <button
        className="btn btn-xs btn-success"
        onClick={handleSave}
        disabled={saving}
        title="Salva"
      >
        <Check size={12} />
      </button>
      <button
        className="btn btn-xs btn-ghost"
        onClick={() => setEditing(false)}
        title="Annulla"
      >
        <X size={12} />
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Group Section
// ─────────────────────────────────────────────────────────────────────────────

interface GroupSectionProps {
  group: string
  settings: PlatformSetting[]
  onSaveSingle: (id: number, value: string | number | boolean | null) => void
  savingId: number | null
}

function GroupSection({ group, settings, onSaveSingle, savingId }: GroupSectionProps) {
  const [collapsed, setCollapsed] = useState(false)

  const editableCount = settings.filter((s) => s.is_editable).length

  return (
    <div className="card bg-base-100 shadow-sm border border-base-200 mb-4">
      {/* Group Header */}
      <div
        className="card-body p-4 cursor-pointer select-none"
        onClick={() => setCollapsed((c) => !c)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {collapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
            <h3 className="font-semibold text-base capitalize">{group.replace(/_/g, ' ')}</h3>
            <span className="badge badge-outline badge-sm">{settings.length} impostazioni</span>
            {editableCount > 0 && (
              <span className="badge badge-success badge-outline badge-sm">
                {editableCount} modificabili
              </span>
            )}
          </div>
          <span className="font-mono text-xs text-base-content/40">{group}</span>
        </div>
      </div>

      {/* Group Body */}
      {!collapsed && (
        <div className="overflow-x-auto px-4 pb-4">
          <table className="table table-sm w-full">
            <thead>
              <tr>
                <th className="w-1/4">Chiave</th>
                <th className="w-1/4">Label</th>
                <th>Valore</th>
                <th className="w-20 text-center">Tipo</th>
                <th className="w-48">Descrizione</th>
              </tr>
            </thead>
            <tbody>
              {settings.map((s) => {
                const typeInfo = formatValueType(s.value_type)
                return (
                  <tr key={s.id} className="hover">
                    <td className="font-mono text-xs text-base-content/70">{s.key}</td>
                    <td className="font-medium text-sm">{s.label}</td>
                    <td>
                      <EditCell
                        setting={s}
                        onSave={onSaveSingle}
                        saving={savingId === s.id}
                      />
                    </td>
                    <td className="text-center">
                      <span className={`badge badge-xs ${typeInfo.color}`}>{typeInfo.label}</span>
                    </td>
                    <td className="text-xs text-base-content/50 max-w-xs truncate">
                      {s.description ?? '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

export default function PlatformSettings() {
  const queryClient = useQueryClient()
  const [savingId, setSavingId] = useState<number | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const { data, isLoading, isError } = useQuery<SettingsResponse>({
    queryKey: ['platform-settings'],
    queryFn: async () => {
      const res = await api.get('/superadmin/platform/settings')
      return res.data
    },
  })

  // ── Mutation: singolo setting ──────────────────────────────────────────────
  const updateSingle = useMutation<void, Error, { id: number; value: string | number | boolean | null }>({
    mutationFn: async ({ id, value }) => {
      await api.put(`/superadmin/platform/settings/${id}`, { value } as UpdateSinglePayload)
    },
    onMutate: ({ id }) => {
      setSavingId(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-settings'] })
      setSuccessMsg('Impostazione salvata')
      setTimeout(() => setSuccessMsg(null), 2500)
    },
    onError: (err) => {
      alert(`Errore: ${err.message}`)
    },
    onSettled: () => {
      setSavingId(null)
    },
  })

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleSaveSingle = (id: number, value: string | number | boolean | null) => {
    updateSingle.mutate({ id, value })
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const groups = data?.data ?? {}
  const groupNames = data?.groups ?? Object.keys(groups)
  const total = data?.total ?? 0

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Settings size={28} className="text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Platform Settings</h1>
            <p className="text-base-content/60 text-sm">
              Configurazione globale della piattaforma
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {successMsg && (
            <div className="alert alert-success alert-sm py-1 px-3 text-sm">
              <Check size={14} />
              {successMsg}
            </div>
          )}
          <div className="badge badge-outline gap-1">
            <Save size={12} />
            {total} impostazioni
          </div>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-16">
          <span className="loading loading-spinner loading-lg text-primary" />
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="alert alert-error">
          <span>Impossibile caricare le impostazioni. Riprova.</span>
        </div>
      )}

      {/* Groups */}
      {!isLoading && !isError && groupNames.length === 0 && (
        <div className="alert alert-info">
          <span>Nessuna impostazione trovata.</span>
        </div>
      )}

      {!isLoading &&
        !isError &&
        groupNames.map((group) => (
          <GroupSection
            key={group}
            group={group}
            settings={groups[group] ?? []}
            onSaveSingle={handleSaveSingle}
            savingId={savingId}
          />
        ))}
    </div>
  )
}
