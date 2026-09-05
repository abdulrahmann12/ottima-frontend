import { getClientDailyUpdates } from '@/api/clientDailyUpdateApi'
import Alert from '@/components/ui/Alert'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

const PAGE_SIZE = 10

const responseError = (err, fallback) => err?.response?.data?.message ?? fallback

export default function ClientItemDailyUpdatesPage() {
  const { projectItemId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { t, i18n } = useTranslation()

  const [updates, setUpdates] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)

  const fetchUpdates = useCallback(async () => {
    if (!projectItemId) return

    setLoading(true)
    setError(null)

    try {
      const { data } = await getClientDailyUpdates(projectItemId, page, PAGE_SIZE)
      const updatesPage = data.data
      setUpdates(updatesPage?.content ?? [])
      setTotalPages(updatesPage?.totalPages ?? 0)
      setTotalElements(updatesPage?.totalElements ?? 0)
    } catch (err) {
      setError(responseError(err, t('errors.generic')))
    } finally {
      setLoading(false)
    }
  }, [page, projectItemId, t])

  useEffect(() => {
    fetchUpdates()
  }, [fetchUpdates])

  const stateItemName = i18n.language === 'ar' ? location.state?.itemNameAr : location.state?.itemNameEn
  const fallbackItemName = updates[0] ? (i18n.language === 'ar' ? updates[0].itemNameAr : updates[0].itemNameEn) : null
  const itemName = stateItemName || fallbackItemName || t('nav.daily_updates')
  const projectName = i18n.language === 'ar' ? location.state?.projectNameAr : location.state?.projectNameEn

  const handleBack = () => {
    if (location.state?.projectId) {
      navigate(`/client/projects/${location.state.projectId}`)
      return
    }

    navigate('/client/projects')
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-surface-border bg-slate-900/40 shadow-xl">
        <div className="bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.18),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.10),transparent_35%)] px-5 py-6 sm:px-6">
          <button
            type="button"
            onClick={handleBack}
            className="text-sm font-medium text-cyan-300 transition-colors hover:text-cyan-200"
          >
            ← {location.state?.projectId ? t('daily_updates.return_to_project') : t('daily_updates.return_to_projects')}
          </button>

          <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-200">
                  {t('daily_updates.read_only')}
                </span>
                <span className="inline-flex items-center rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-semibold text-cyan-200">
                  {t('daily_updates.approved_only_hint')}
                </span>
              </div>

              <p className="mt-5 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300/80">
                {t('nav.daily_updates')}
              </p>
              <h1 className="mt-3 text-3xl font-bold text-white">{itemName}</h1>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                {projectName || t('daily_updates.client_hero_copy')}
              </p>
            </div>

            <div className="rounded-3xl border border-surface-border bg-slate-950/45 px-5 py-4 backdrop-blur-sm">
              <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">{t('daily_updates.total_updates')}</p>
              <p className="mt-2 text-3xl font-bold text-cyan-300">{totalElements}</p>
              <p className="mt-1 text-xs text-slate-500">{t('daily_updates.client_page_subtitle')}</p>
            </div>
          </div>
        </div>
      </section>

      <Alert message={error} variant="error" onClose={() => setError(null)} />

      {loading ? (
        <div className="space-y-4 rounded-3xl border border-surface-border bg-slate-900/40 p-5 shadow-xl">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-44 animate-pulse rounded-2xl bg-slate-800/60" />
          ))}
        </div>
      ) : updates.length === 0 ? (
        <div className="rounded-3xl border border-surface-border bg-slate-900/40 p-10 text-center shadow-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-surface-border bg-slate-950/60 text-cyan-300">
            <TimelineIcon className="h-7 w-7" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-white">{t('daily_updates.timeline_empty_title')}</h2>
          <p className="mt-2 text-sm text-slate-400">{t('daily_updates.timeline_empty_copy')}</p>
        </div>
      ) : (
        <section className="overflow-hidden rounded-3xl border border-surface-border bg-slate-900/40 shadow-xl">
          <div className="border-b border-surface-border px-5 py-4 sm:px-6">
            <h2 className="text-lg font-semibold text-white">{t('daily_updates.client_hero_title')}</h2>
            <p className="mt-1 text-sm text-slate-400">{t('daily_updates.client_page_subtitle')}</p>
          </div>

          <div className="p-5 sm:p-6">
            <div className="relative space-y-8 before:absolute before:bottom-0 before:left-4 before:top-0 before:hidden before:w-px before:bg-gradient-to-b before:from-cyan-400/70 before:via-cyan-500/20 before:to-transparent md:before:block">
              {updates.map((update) => (
                <article key={update.dailyUpdateId} className="relative grid gap-4 md:grid-cols-[92px_minmax(0,1fr)] md:gap-6">
                  <div className="pt-1 text-xs text-slate-500">
                    <p className="font-semibold uppercase tracking-wider text-cyan-200">{formatDate(update.createdAt, i18n.language, 'date')}</p>
                    <p className="mt-1">{formatDate(update.createdAt, i18n.language, 'time')}</p>
                  </div>

                  <div className="relative overflow-hidden rounded-3xl border border-surface-border bg-slate-950/45 p-5 shadow-[0_24px_60px_rgba(2,6,23,0.25)]">
                    <span className="absolute left-4 top-7 hidden h-3 w-3 rounded-full border-2 border-cyan-300 bg-slate-950 md:block md:-translate-x-[2.45rem]" />

                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-xl font-semibold text-white">{update.title}</p>
                          <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-200">
                            {t('daily_updates.approved')}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-slate-400">
                          {t('daily_updates.published_by', {
                            name: (i18n.language === 'ar' ? update.engineerNameAr : update.engineerNameEn) || update.engineerUsername || '—',
                          })}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-surface-border bg-slate-900/60 px-4 py-3 text-sm text-slate-300">
                        <p className="text-[11px] uppercase tracking-wider text-slate-500">{t('daily_updates.images_count', { count: update.images?.length ?? 0 })}</p>
                        <p className="mt-1 font-semibold text-white">{t('daily_updates.approved_only_hint')}</p>
                      </div>
                    </div>

                    <p className="mt-5 rounded-2xl border border-surface-border bg-slate-900/50 px-4 py-4 text-sm leading-7 text-slate-300">
                      {update.notes || t('daily_updates.no_notes')}
                    </p>

                    {update.images?.length > 0 && (
                      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {update.images.map((image) => (
                          <div key={image.updateImageId} className="overflow-hidden rounded-2xl border border-surface-border bg-slate-900/60">
                            <div className="aspect-[4/3] overflow-hidden bg-slate-950/50">
                              <img src={image.imageUrl} alt={update.title} className="h-full w-full object-cover" />
                            </div>
                            <div className="flex items-center justify-between px-4 py-3">
                              <p className="text-[11px] uppercase tracking-wider text-slate-500">{t('daily_updates.image_review')}</p>
                              <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-200">
                                {t('daily_updates.approved')}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between rounded-2xl border border-surface-border bg-slate-950/40 px-4 py-3">
                <p className="text-xs text-slate-500">
                  {t('table.page')} <span className="font-medium text-slate-200">{page + 1}</span> {t('table.of')} <span className="font-medium text-slate-200">{totalPages}</span>
                  {totalElements > 0 && <span className="ml-2 text-slate-600">({totalElements})</span>}
                </p>
                <div className="flex gap-2">
                  <PagerButton disabled={page === 0} onClick={() => setPage((current) => current - 1)}>
                    {t('table.previous')}
                  </PagerButton>
                  <PagerButton disabled={page >= totalPages - 1} onClick={() => setPage((current) => current + 1)}>
                    {t('table.next')}
                  </PagerButton>
                </div>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  )
}

function PagerButton({ children, disabled, onClick }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="rounded-lg border border-surface-border px-3 py-1.5 text-xs text-slate-400 transition-colors hover:border-brand-500/60 hover:text-white disabled:pointer-events-none disabled:opacity-30"
    >
      {children}
    </button>
  )
}

function formatDate(value, language, mode = 'datetime') {
  if (!value) return '—'

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value

  const locale = language === 'ar' ? 'ar-EG' : 'en-US'
  const options = mode === 'date'
    ? { dateStyle: 'medium' }
    : mode === 'time'
      ? { timeStyle: 'short' }
      : { dateStyle: 'medium', timeStyle: 'short' }

  return new Intl.DateTimeFormat(locale, options).format(parsed)
}

function TimelineIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h12M3.75 3h16.5M3.75 3v.75A2.25 2.25 0 0 0 6 6h12a2.25 2.25 0 0 0 2.25-2.25V3m-13.5 18 3.75-3.75m0 0 2.25 2.25 5.25-5.25" />
    </svg>
  )
}