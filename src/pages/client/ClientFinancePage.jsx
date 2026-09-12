import { getClientProjects } from '@/api/projectsApi'
import ClientFinanceDashboard from '@/components/client/finance/ClientFinanceDashboard'
import Alert from '@/components/ui/Alert'
import SearchableSelect from '@/components/ui/SearchableSelect'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

/**
 * ClientFinancePage — /client/finance
 *
 * If the client has only one project, it is auto-selected.
 * Otherwise, a project selector dropdown is shown first.
 */
export default function ClientFinancePage() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language

  const [projects, setProjects] = useState([])
  const [projectsLoading, setProjectsLoading] = useState(true)
  const [projectsError, setProjectsError] = useState(null)
  const [selectedId, setSelectedId] = useState('')

  // Fetch client's own projects
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
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-card">
        <div className="border-b border-gray-200 bg-gradient-to-r from-cream/60 via-white to-gray-50/80 px-5 py-6 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-warm-brown">
            {t('nav.finance', 'Financial Transparency')}
          </p>
          <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-gray-900">{t('finance.title', 'Finance')}</h1>
          <p className="mt-1 text-sm leading-6 text-gray-600">
            {t('finance.client_subtitle', "Your project's financial overview — deposits, expenses, and receipt gallery.")}
          </p>
        </div>
      </section>

      <Alert message={projectsError} variant="error" onClose={() => setProjectsError(null)} />

      {/* ── Project selector (hidden if only 1 project) ── */}
      {!projectsLoading && projects.length > 1 && (
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-card">
          <SearchableSelect
            id="client-finance-project-select"
            label={t('projects.select_project', 'Select Project')}
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            placeholder={t('projects.select_project_placeholder', '— Choose a project —')}
            options={projects.map((p) => ({
              value: p.projectId,
              label: projectName(p),
            }))}
          />
        </section>
      )}

      {/* ── Empty state when no project chosen ── */}
      {!projectsLoading && projects.length > 1 && !selectedId && (
        <div className="py-16 text-center">
          <p className="text-base font-semibold text-gray-600">Select a project to view financials</p>
          <p className="mt-1 text-sm text-gray-400">
            Choose one from the dropdown above.
          </p>
        </div>
      )}

      {/* ── Loading skeleton ── */}
      {projectsLoading && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl border border-gray-200 bg-gray-100" />
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
