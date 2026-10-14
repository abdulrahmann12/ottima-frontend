import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import ClientProjectCard from '@/components/client/ClientProjectCard'
import Alert from '@/components/ui/Alert'
import useProjectsStore from '@/store/projectsStore'
import { getClientProjects } from '@/api/projectsApi'

const PAGE_SIZE = 12

/**
 * ClientProjectsPage — modern separated cards dashboard for clients.
 *
 * Lists projects via GET /api/v1/client/projects (paginated).
 * Each project is rendered in its own standalone card.
 * Clicking a card navigates to a full-page detail route at /client/projects/:id.
 */
export default function ClientProjectsPage() {
  const { t, i18n } = useTranslation()
  const isRtl = i18n.language === 'ar'
  const navigate = useNavigate()
  const { clientPage, setClientPage } = useProjectsStore()

  const [projects, setProjects] = useState([])
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  const searchInputRef = useRef(null)

  // ── ⌘K / Ctrl+K keyboard shortcut to focus search ───────
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // ── Fetch list ──────────────────────────────────────────
  const fetchProjects = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await getClientProjects(clientPage, PAGE_SIZE)
      const page = data.data
      setProjects(page?.content ?? [])
      setTotalPages(page?.totalPages ?? 0)
      setTotalElements(page?.totalElements ?? 0)
    } catch (err) {
      setError(err?.response?.data?.message ?? t('errors.generic'))
    } finally {
      setLoading(false)
    }
  }, [clientPage, t])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  const handleRowClick = (project) =>
    navigate(`/client/projects/${project.projectId}`, { state: { projectSummary: project } })

  // Instant client search filtering
  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return projects
    const q = searchQuery.trim().toLowerCase()
    return projects.filter((p) => {
      const nameAr = (p.nameAr || '').toLowerCase()
      const nameEn = (p.nameEn || '').toLowerCase()
      const addrAr = (p.addressAr || '').toLowerCase()
      const addrEn = (p.addressEn || '').toLowerCase()
      const eng = (p.engineerName || '').toLowerCase()
      return (
        nameAr.includes(q) ||
        nameEn.includes(q) ||
        addrAr.includes(q) ||
        addrEn.includes(q) ||
        eng.includes(q)
      )
    })
  }, [projects, searchQuery])

  return (
    <div className="space-y-6 animate-slide-up pb-8">
      {/* ── Page Header & Quick Search ───────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-medium text-gray-900 tracking-tight">
              {t('projects.title', { defaultValue: isRtl ? 'المشاريع' : 'Projects' })}
            </h1>
            {totalElements > 0 && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-[#F4EDE4] text-[#7D583F] border border-[#D9C7B8]/60 shadow-2xs">
                {totalElements} {isRtl ? 'مشاريع' : 'Projects'}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-600 font-light">
            {t('projects.client_subtitle', {
              defaultValue: isRtl
                ? 'تابع تقدم مشروعك وإنفاقه'
                : 'Follow your project progress and spending',
            })}
          </p>
        </div>

        {/* Quick Search & Refresh */}
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="relative flex-1 w-full sm:w-[420px] md:w-[480px] lg:w-[520px]">
            <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-4 text-[#7D583F]">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
            </div>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setSearchQuery('')
                  searchInputRef.current?.blur()
                }
              }}
              placeholder={isRtl ? 'ابحث باسم المشروع أو العنوان...' : 'Search by project name or address...'}
              className="w-full h-12 rounded-2xl border border-[#D9C7B8] bg-white ps-12 pe-12 text-sm sm:text-base text-gray-900 placeholder-gray-400 font-medium focus:border-[#7D583F] focus:outline-none focus:ring-4 focus:ring-[#7D583F]/15 shadow-xs hover:border-[#7D583F]/70 hover:shadow-sm transition-all"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('')
                  searchInputRef.current?.focus()
                }}
                className="absolute inset-y-0 end-0 flex items-center pe-3.5 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                title={isRtl ? 'مسح' : 'Clear'}
              >
                <span className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-xs font-bold transition-all active:scale-95">
                  ✕
                </span>
              </button>
            ) : (
              <div className="hidden sm:flex pointer-events-none absolute inset-y-0 end-0 items-center pe-3.5">
                <kbd className="inline-flex items-center gap-0.5 rounded-lg border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] font-medium text-gray-400 font-sans shadow-2xs">
                  <span className="text-[10px]">⌘</span>K
                </kbd>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={fetchProjects}
            disabled={loading}
            title={isRtl ? 'تحديث المشاريع' : 'Refresh Projects'}
            className="h-12 w-12 flex items-center justify-center rounded-2xl border border-[#D9C7B8] bg-white text-gray-700 hover:text-[#7D583F] hover:border-[#7D583F] hover:bg-[#F4EDE4]/60 shadow-xs hover:shadow-sm transition-all active:scale-95 disabled:opacity-50 cursor-pointer shrink-0"
          >
            <svg
              className={`w-5 h-5 ${loading ? 'animate-spin text-[#7D583F]' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          </button>
        </div>
      </div>

      <Alert message={error} variant="error" onClose={() => setError(null)} />

      {/* ── Loading Skeleton Grid ────────────────────── */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-4 animate-pulse"
            >
              <div className="flex items-center justify-between">
                <div className="h-5 w-20 rounded-full bg-gray-200" />
                <div className="h-5 w-24 rounded-lg bg-gray-200" />
              </div>
              <div className="space-y-2">
                <div className="h-5 w-3/4 rounded-md bg-gray-200" />
                <div className="h-3 w-1/2 rounded-md bg-gray-100" />
              </div>
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between">
                  <div className="h-3 w-16 rounded bg-gray-200" />
                  <div className="h-3 w-8 rounded bg-gray-200" />
                </div>
                <div className="h-2.5 w-full rounded-full bg-gray-100" />
              </div>
              <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
                <div className="h-4 w-28 rounded bg-gray-200" />
                <div className="w-8 h-8 rounded-full bg-gray-200" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Empty State ──────────────────────────────── */}
      {!loading && filteredProjects.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white rounded-2xl border border-gray-200 shadow-xs">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F4EDE4] text-[#7D583F]">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
            </svg>
          </div>
          <h3 className="text-base font-medium text-gray-900">
            {searchQuery
              ? (isRtl ? 'لا توجد مشاريع تطابق بحثك' : 'No projects match your search')
              : (isRtl ? 'لا توجد مشاريع مسجلة حالياً' : 'No projects found')}
          </h3>
          <p className="mt-1 text-xs text-gray-500 font-light max-w-sm">
            {searchQuery
              ? (isRtl ? 'جرب البحث بكلمات أخرى أو امسح حقل البحث' : 'Try searching with different terms or clear the search field.')
              : (isRtl ? 'سيتم إدراج مشاريعك وتفاصيلها هنا فور إسنادها لحسابك من قبل الإدارة.' : 'Your assigned projects will appear here once configured by the admin.')}
          </p>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold bg-[#7D583F] text-white hover:bg-[#684833] transition-colors cursor-pointer"
            >
              {isRtl ? 'مسح البحث' : 'Clear Search'}
            </button>
          )}
        </div>
      )}

      {/* ── Standalone Separated Project Cards Grid ──── */}
      {!loading && filteredProjects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredProjects.map((project) => (
            <ClientProjectCard
              key={project.projectId}
              project={project}
              onClick={() => handleRowClick(project)}
            />
          ))}
        </div>
      )}

      {/* ── Pagination ───────────────────────────────── */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200/80 pt-4 px-1 text-xs text-gray-500">
          <span>
            {isRtl
              ? `الصفحة ${clientPage + 1} من ${totalPages}`
              : `Page ${clientPage + 1} of ${totalPages}`}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={clientPage <= 0}
              onClick={() => setClientPage(Math.max(0, clientPage - 1))}
              className="rounded-xl border border-gray-200 bg-white px-3.5 py-1.5 font-semibold text-gray-700 hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-40 transition-colors shadow-2xs cursor-pointer"
            >
              {isRtl ? 'السابق' : 'Previous'}
            </button>
            <button
              type="button"
              disabled={clientPage >= totalPages - 1}
              onClick={() => setClientPage(clientPage + 1)}
              className="rounded-xl border border-gray-200 bg-white px-3.5 py-1.5 font-semibold text-gray-700 hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-40 transition-colors shadow-2xs cursor-pointer"
            >
              {isRtl ? 'التالي' : 'Next'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

