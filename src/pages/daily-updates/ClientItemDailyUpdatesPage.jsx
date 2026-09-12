import { getClientDailyUpdates } from '@/api/clientDailyUpdateApi'
import { resolveNotificationContext } from '@/api/notificationApi'
import CommentsSection from '@/components/daily-updates/CommentsSection'
import ImageLightboxModal from '@/components/daily-updates/ImageLightboxModal'
import Alert from '@/components/ui/Alert'
import { optimizeCloudinaryUrl } from '@/utils/imageUtils'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'

const PAGE_SIZE = 10

const responseError = (err, fallback) => err?.response?.data?.message ?? fallback

export default function ClientItemDailyUpdatesPage() {
  const { projectItemId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { t, i18n } = useTranslation()

  // Extract target deep-link IDs
  const targetCommentId = searchParams.get('targetCommentId') || location.state?.targetCommentId
  const targetUpdateId = searchParams.get('targetUpdateId') || location.state?.targetUpdateId

  const [updates, setUpdates] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [previewImage, setPreviewImage] = useState(null)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [highlightedUpdateId, setHighlightedUpdateId] = useState(targetUpdateId || null)
  const updateRefs = useRef({})

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
      // Automatic fallback recovery: check if projectItemId was actually a commentId or dailyUpdateId
      try {
        const commentRes = await resolveNotificationContext('COMMENT', projectItemId)
        const ctx = commentRes.data?.data || commentRes.data
        if (ctx?.projectItemId && ctx.projectItemId !== projectItemId) {
          navigate(`/client/items/${ctx.projectItemId}/daily-updates?targetCommentId=${projectItemId}`, {
            replace: true,
            state: {
              projectId: ctx.projectId,
              projectNameAr: ctx.projectNameAr,
              projectNameEn: ctx.projectNameEn,
              itemNameAr: ctx.itemNameAr,
              itemNameEn: ctx.itemNameEn,
            },
          })
          return
        }
      } catch {
        try {
          const updateRes = await resolveNotificationContext('DAILY_UPDATE', projectItemId)
          const ctx = updateRes.data?.data || updateRes.data
          if (ctx?.projectItemId && ctx.projectItemId !== projectItemId) {
            navigate(`/client/items/${ctx.projectItemId}/daily-updates?targetUpdateId=${projectItemId}`, {
              replace: true,
              state: {
                projectId: ctx.projectId,
                projectNameAr: ctx.projectNameAr,
                projectNameEn: ctx.projectNameEn,
                itemNameAr: ctx.itemNameAr,
                itemNameEn: ctx.itemNameEn,
              },
            })
            return
          }
        } catch {
          // Both fallback resolutions failed, surface real error
        }
      }

      setError(responseError(err, t('errors.generic')))
    } finally {
      setLoading(false)
    }
  }, [page, projectItemId, navigate, t])

  useEffect(() => {
    fetchUpdates()
  }, [fetchUpdates])

  // Auto-scroll and highlight target daily update
  useEffect(() => {
    if (!targetUpdateId || updates.length === 0) return

    const matched = updates.find(
      (u) => String(u.dailyUpdateId || u.id) === String(targetUpdateId)
    )

    if (matched) {
      const uId = String(matched.dailyUpdateId || matched.id)
      setHighlightedUpdateId(uId)

      setTimeout(() => {
        const el = updateRefs.current[uId]
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 200)

      const timer = setTimeout(() => {
        setHighlightedUpdateId(null)
      }, 4000)

      return () => clearTimeout(timer)
    }
  }, [updates, targetUpdateId])

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
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-card">
        <div className="border-b border-gray-200 bg-gradient-to-r from-cream/60 via-white to-gray-50/80 px-5 py-6 sm:px-6">
          <button
            type="button"
            onClick={handleBack}
            className="text-sm font-semibold text-warm-brown transition-colors hover:text-[#6B4A33]"
          >
            ← {location.state?.projectId ? t('daily_updates.return_to_project') : t('daily_updates.return_to_projects')}
          </button>

          <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                  {t('daily_updates.read_only')}
                </span>
                <span className="inline-flex items-center rounded-full border border-warm-brown/20 bg-warm-brown/10 px-2.5 py-0.5 text-[11px] font-semibold text-warm-brown">
                  {t('daily_updates.approved_only_hint')}
                </span>
              </div>

              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.24em] text-warm-brown">
                {t('nav.daily_updates')}
              </p>
              <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-gray-900">{itemName}</h1>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                {projectName || t('daily_updates.client_hero_copy')}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-400">{t('daily_updates.total_updates')}</p>
              <p className="mt-1 text-3xl font-extrabold text-warm-brown">{totalElements}</p>
              <p className="mt-1 text-xs text-gray-500">{t('daily_updates.client_page_subtitle')}</p>
            </div>
          </div>
        </div>
      </section>

      <Alert message={error} variant="error" onClose={() => setError(null)} />

      {loading ? (
        <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-card">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-44 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : updates.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center shadow-card">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-gray-200 bg-cream text-warm-brown">
            <TimelineIcon className="h-7 w-7" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-gray-900">{t('daily_updates.timeline_empty_title')}</h2>
          <p className="mt-2 text-sm text-gray-500">{t('daily_updates.timeline_empty_copy')}</p>
        </div>
      ) : (
        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-card">
          <div className="border-b border-gray-200 bg-gray-50 px-5 py-4 sm:px-6">
            <h2 className="text-lg font-semibold text-gray-900">{t('daily_updates.client_hero_title')}</h2>
            <p className="mt-0.5 text-sm text-gray-500">{t('daily_updates.client_page_subtitle')}</p>
          </div>

          <div className="p-5 sm:p-6">
            <div className="relative space-y-8 before:absolute before:bottom-0 before:left-4 before:top-0 before:hidden before:w-px before:bg-gradient-to-b before:from-warm-brown/50 before:via-gray-200 before:to-transparent md:before:block">
              {updates.map((update) => {
                const uId = String(update.dailyUpdateId || update.id)
                const isUpdateHighlighted = uId === String(highlightedUpdateId)

                return (
                  <article
                    key={update.dailyUpdateId}
                    ref={(el) => {
                      if (el) updateRefs.current[uId] = el
                    }}
                    className={`relative grid gap-4 md:grid-cols-[92px_minmax(0,1fr)] md:gap-6 transition-all duration-300 ${
                      isUpdateHighlighted
                        ? 'p-2 rounded-2xl ring-2 ring-warm-brown bg-warm-brown/[0.03]'
                        : ''
                    }`}
                  >
                    <div className="pt-1 text-xs text-gray-500">
                      <p className="font-bold uppercase tracking-wider text-warm-brown">{formatDate(update.createdAt, i18n.language, 'date')}</p>
                      <p className="mt-1 text-gray-400">{formatDate(update.createdAt, i18n.language, 'time')}</p>
                    </div>

                    <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-card">
                      <span className="absolute left-4 top-7 hidden h-3 w-3 rounded-full border-2 border-warm-brown bg-white md:block md:-translate-x-[2.45rem]" />

                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-xl font-bold text-gray-900">{update.title}</p>
                            <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                              {t('daily_updates.approved')}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-gray-500">
                            {t('daily_updates.published_by', {
                              name: (i18n.language === 'ar' ? update.engineerNameAr : update.engineerNameEn) || update.engineerUsername || '—',
                            })}
                          </p>
                        </div>

                        <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-700">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">{t('daily_updates.images_count', { count: update.images?.length ?? 0 })}</p>
                          <p className="mt-0.5 text-xs font-semibold text-emerald-700">{t('daily_updates.approved_only_hint')}</p>
                        </div>
                      </div>

                      <p className="mt-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm leading-7 text-gray-700">
                        {update.notes || t('daily_updates.no_notes')}
                      </p>

                      {update.images?.length > 0 && (
                        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          {update.images.map((image) => (
                            <div
                              key={image.updateImageId}
                              className="group relative overflow-hidden rounded-xl border border-gray-200 bg-gray-50 shadow-sm transition-all hover:border-warm-brown/40"
                            >
                              <div
                                className="aspect-[4/3] overflow-hidden bg-gray-100 cursor-zoom-in"
                                onClick={() => setPreviewImage(image.imageUrl)}
                                title="Click to zoom image"
                              >
                                <img
                                  src={optimizeCloudinaryUrl(image.imageUrl, { width: 600 })}
                                  alt={update.title}
                                  loading="lazy"
                                  decoding="async"
                                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                              </div>
                              <div className="flex items-center justify-between border-t border-gray-200 bg-white px-3 py-2">
                                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">{t('daily_updates.image_review')}</p>
                                <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                                  {t('daily_updates.approved')}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* ── Comments thread ── */}
                      <div className="mt-6 pt-4 border-t border-gray-100">
                        <CommentsSection
                          dailyUpdateId={update.dailyUpdateId}
                          userRole="CLIENT"
                          updateStatus={update.status}
                          targetCommentId={targetCommentId}
                        />
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>

            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
                <p className="text-xs text-gray-500">
                  {t('table.page')} <span className="font-semibold text-gray-900">{page + 1}</span> {t('table.of')}{' '}
                  <span className="font-semibold text-gray-900">{totalPages}</span>
                  {totalElements > 0 && <span className="ml-2 text-gray-400">({totalElements})</span>}
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

      <ImageLightboxModal
        isOpen={Boolean(previewImage)}
        src={previewImage}
        alt="Daily Update Image"
        onClose={() => setPreviewImage(null)}
      />
    </div>
  )
}

function PagerButton({ children, disabled, onClick }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:border-warm-brown/40 hover:bg-gray-50 hover:text-gray-900 disabled:pointer-events-none disabled:opacity-30"
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