import { getClientProjects } from '@/api/projectsApi'
import ClientFinanceDashboard from '@/components/client/finance/ClientFinanceDashboard'
import Alert from '@/components/ui/Alert'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

/**
 * ClientFinancePage — /client/finance
 *
 * If the client has only one project, it is auto-selected.
 * Otherwise, a project selector dropdown is shown first.
 */
export default function ClientFinancePage() {
  const { i18n } = useTranslation()
  const lang = i18n.language

  const [projects,        setProjects]        = useState([])
  const [projectsLoading, setProjectsLoading] = useState(true)
  const [projectsError,   setProjectsError]   = useState(null)
  const [selectedId,      setSelectedId]      = useState('')

  // Fetch client's own projects (small list expected)
  useEffect(() => {
    ;(async () => {
      setProjectsLoading(true)
      try {
        const { data } = await getClientProjects(0, 100)
        const list = data.data?.content ?? []
        setProjects(list)
        // Auto-select first project by default
        if (list.length > 0) setSelectedId(list[0].projectId)
      } catch (err) {
        setProjectsError(err?.response?.data?.message ?? 'Failed to load projects.')
      } finally {
        setProjectsLoading(false)
      }
    })()
  }, [])

  const projectName = (p) =>
    (lang === 'ar' ? p.nameAr : p.nameEn) || p.nameEn || p.nameAr || p.projectId

  return (
    <div className="space-y-6">
      {/* ── Page header ── */}
      <section className="overflow-hidden rounded-3xl border border-surface-border bg-slate-900/40 shadow-xl">
        <div className="bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.16),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(99,102,241,0.10),transparent_35%)] px-5 py-6 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300/80">
            Financial Transparency
          </p>
          <h1 className="mt-3 text-3xl font-bold text-white">Finance</h1>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Your project's financial overview — deposits, expenses, and receipt gallery.
          </p>
        </div>
      </section>

      <Alert message={projectsError} variant="error" onClose={() => setProjectsError(null)} />

      {/* ── Project selector (hidden if auto-selected) ── */}
      {!projectsLoading && projects.length > 1 && (
        <section className="overflow-hidden rounded-3xl border border-surface-border bg-slate-900/40 shadow-xl">
          <div className="px-5 py-4 sm:px-6">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Select Project
              <select
                className="input-base mt-2 text-sm"
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
              >
                <option value="">— Choose a project —</option>
                {projects.map((p) => (
                  <option key={p.projectId} value={p.projectId}>
                    {projectName(p)}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>
      )}

      {/* ── Empty state when no project chosen ── */}
      {!projectsLoading && projects.length > 1 && !selectedId && (
        <div className="py-16 text-center">
          <p className="text-base font-semibold text-slate-400">Select a project to view financials</p>
          <p className="mt-1 text-sm text-slate-600">
            Choose one from the dropdown above.
          </p>
        </div>
      )}

      {/* ── Loading skeleton ── */}
      {projectsLoading && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-3xl border border-surface-border bg-slate-800/40" />
            ))}
          </div>
        </div>
      )}

      {/* ── Dashboard ── */}
      {selectedId && (
        <ClientFinanceDashboard projectId={selectedId} language={lang} />
      )}
    </div>
  )
}
