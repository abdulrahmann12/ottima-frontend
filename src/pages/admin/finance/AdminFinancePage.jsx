import {
  deleteFinancialRecord,
  getAdminFinancialRecords,
  getAdminFinancialSummary,
} from '@/api/adminFinancialApi'
import FinancialRecordModal from '@/components/admin/finance/FinancialRecordModal'
import ConfirmDialog from '@/components/admin/ConfirmDialog'
import DataTable from '@/components/admin/DataTable'
import Alert from '@/components/ui/Alert'
import SearchableSelect from '@/components/ui/SearchableSelect'
import { getAdminProjects, getAdminProject } from '@/api/projectsApi'
import FinancialSummaryCards from '@/components/finance/FinancialSummaryCards'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

const PAGE_SIZE = 10
const apiErr = (err, fb) => err?.response?.data?.message ?? fb

// ─── Currency formatter ───────────────────────────────────────
function formatMoney(value, language = 'en') {
  if (value == null) return '—'
  const locale = language === 'ar' ? 'ar-EG' : 'en-EG'
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EGP',
    minimumFractionDigits: 2,
  }).format(value)
}

// ─── Date formatter ───────────────────────────────────────────
function formatDate(value, language) {
  if (!value) return '—'
  return new Intl.DateTimeFormat(language === 'ar' ? 'ar-EG' : 'en-US', {
    dateStyle: 'medium',
  }).format(new Date(value))
}

// ─── Pill components ─────────────────────────────────────────
function RecordTypePill({ type }) {
  const palette = {
    DEPOSIT: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
    EXPENSE: 'border-rose-500/30    bg-rose-500/10    text-rose-300',
  }
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${palette[type] ?? ''}`}>
      {type}
    </span>
  )
}

// ─── Main page ────────────────────────────────────────────────
export default function AdminFinancePage() {
  const { i18n } = useTranslation()
  const lang = i18n.language

  // ── Project selector state ──
  const [projects,        setProjects]        = useState([])
  const [projectsLoading, setProjectsLoading] = useState(true)
  const [selectedProject, setSelectedProject] = useState(null)   // full project obj

  // ── Records table state ──
  const [records,        setRecords]        = useState([])
  const [loading,        setLoading]        = useState(false)
  const [error,          setError]          = useState(null)
  const [page,           setPage]           = useState(0)
  const [totalPages,     setTotalPages]     = useState(0)
  const [totalElements,  setTotalElements]  = useState(0)

  // ── Project items & Summary state ──
  const [projectItems,   setProjectItems]   = useState([])
  const [summary,        setSummary]        = useState(null)
  const [summaryLoading, setSummaryLoading] = useState(false)

  // ── Modal / dialog state ──
  const [modalOpen,      setModalOpen]      = useState(false)
  const [editRecord,     setEditRecord]     = useState(null)
  const [deleteTarget,   setDeleteTarget]   = useState(null)
  const [deleting,       setDeleting]       = useState(false)
  const [deleteError,    setDeleteError]    = useState(null)

  // ── Fetch projects once ──
  useEffect(() => {
    ;(async () => {
      setProjectsLoading(true)
      try {
        const { data } = await getAdminProjects(0, 200)
        const list = data.data?.content ?? []
        setProjects(list)
      } catch {
        // silently ignore — selector will just stay empty
      } finally {
        setProjectsLoading(false)
      }
    })()
  }, [])

  // ── Fetch records ──
  const fetchRecords = useCallback(async () => {
    if (!selectedProject) return
    setLoading(true)
    setError(null)
    try {
      const { data } = await getAdminFinancialRecords(selectedProject.projectId, page, PAGE_SIZE)
      const pg = data.data
      setRecords(pg?.content ?? [])
      setTotalPages(pg?.totalPages ?? 0)
      setTotalElements(pg?.totalElements ?? 0)
    } catch (err) {
      setError(apiErr(err, 'Failed to load financial records.'))
    } finally {
      setLoading(false)
    }
  }, [selectedProject, page])

  useEffect(() => {
    fetchRecords()
  }, [fetchRecords])

  // ── Fetch summary for selected project ──
  const fetchSummary = useCallback(async () => {
    if (!selectedProject?.projectId) {
      setSummary(null)
      return
    }
    setSummaryLoading(true)
    try {
      const { data } = await getAdminFinancialSummary(selectedProject.projectId)
      setSummary(data.data)
    } catch {
      setSummary(null)
    } finally {
      setSummaryLoading(false)
    }
  }, [selectedProject?.projectId])

  useEffect(() => {
    fetchSummary()
  }, [fetchSummary])

  // ── Fetch full project items for expense item dropdown ──
  useEffect(() => {
    if (!selectedProject?.projectId) {
      setProjectItems([])
      return
    }
    let cancelled = false
    getAdminProject(selectedProject.projectId)
      .then(({ data }) => {
        if (!cancelled) setProjectItems(data.data?.items ?? [])
      })
      .catch(() => {
        if (!cancelled) setProjectItems([])
      })
    return () => { cancelled = true }
  }, [selectedProject?.projectId])

  // Reset page when project changes
  const handleProjectChange = (e) => {
    const proj = projects.find((p) => p.projectId === e.target.value) ?? null
    setSelectedProject(proj)
    setPage(0)
    setRecords([])
  }

  // ── Delete ──
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteFinancialRecord(deleteTarget.financialRecordId)
      setDeleteTarget(null)
      fetchSummary()
      if (records.length === 1 && page > 0) {
        setPage((p) => p - 1)
      } else {
        await fetchRecords()
      }
    } catch (err) {
      setDeleteError(apiErr(err, 'Failed to delete record.'))
    } finally {
      setDeleting(false)
    }
  }

  // ── Table columns ──
  const columns = [
    {
      key: 'transactionDate',
      header: 'Date',
      render: (v) => <span className="whitespace-nowrap">{formatDate(v, lang)}</span>,
    },
    {
      key: 'recordType',
      header: 'Type',
      render: (v) => <RecordTypePill type={v} />,
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (v, row) => (
        <span className={`font-semibold ${row.recordType === 'DEPOSIT' ? 'text-emerald-300' : 'text-rose-300'}`}>
          {row.recordType === 'EXPENSE' ? '−' : '+'}{formatMoney(v, lang)}
        </span>
      ),
    },
    {
      key: 'paymentMethod',
      header: 'Method',
      render: (v) => <span className="text-slate-400 text-xs">{v?.replace('_', ' ') ?? '—'}</span>,
    },
    {
      key: 'itemNameEn',
      header: 'Item',
      render: (_, row) => {
        const name = (lang === 'ar' ? row.itemNameAr : row.itemNameEn)
        return <span className="text-slate-400 text-xs">{name || <em className="text-slate-600">Project-level</em>}</span>
      },
    },
    {
      key: 'documentUrl',
      header: 'Doc',
      render: (v) =>
        v ? (
          <a
            href={v}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 rounded-lg border border-brand-500/30 bg-brand-500/10 px-2 py-0.5 text-[11px] font-medium text-brand-300 hover:text-brand-200 transition-colors"
          >
            <DocIcon className="w-3 h-3" /> View
          </a>
        ) : (
          <span className="text-slate-600 text-xs">—</span>
        ),
    },
    {
      key: 'notes',
      header: 'Notes',
      render: (v) => (
        <span className="text-xs text-slate-500 max-w-[180px] truncate block">{v || '—'}</span>
      ),
    },
    {
      key: '_actions',
      header: '',
      render: (_, row) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <IconBtn
            label="Edit"
            onClick={() => { setEditRecord(row); setModalOpen(true) }}
            className="hover:text-brand-300"
          >
            <PencilIcon />
          </IconBtn>
          <IconBtn
            label="Delete"
            onClick={() => setDeleteTarget(row)}
            className="hover:text-red-400"
          >
            <TrashIcon />
          </IconBtn>
        </div>
      ),
    },
  ]

  const projectName = (proj) =>
    proj ? ((lang === 'ar' ? proj.nameAr : proj.nameEn) || proj.nameEn || proj.nameAr || proj.projectId) : ''

  return (
    <div className="space-y-6">
      {/* ── Page header ── */}
      <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl shadow-sm px-5 py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Financial Management</p>
          <h1 className="mt-1 text-xl font-bold text-gray-900">Finance</h1>
          <p className="mt-0.5 text-sm text-gray-500">Track deposits, expenses, and receipts across all projects.</p>
        </div>
      </div>

      {/* ── Alerts ── */}
      <Alert message={error} variant="error" onClose={() => setError(null)} />
      <Alert message={deleteError} variant="error" onClose={() => setDeleteError(null)} />

      {/* ── Summary Cards (shown once a project is selected) ── */}
      {selectedProject && (
        <FinancialSummaryCards
          summary={summary}
          loading={summaryLoading}
        />
      )}

      {/* ── Main card ── */}
      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {/* Toolbar */}
        <div className="flex flex-col gap-4 border-b border-gray-200 px-5 py-4 sm:flex-row sm:items-end sm:px-6">
          {/* Project selector */}
          <div className="flex-1">
            <SearchableSelect
              id="admin-finance-project-select"
              label="Select Project"
              value={selectedProject?.projectId ?? ''}
              onChange={handleProjectChange}
              disabled={projectsLoading}
              loading={projectsLoading}
              placeholder="— Choose a project —"
              options={projects.map((p) => ({
                value: p.projectId,
                label: projectName(p),
                sublabel: p.clientName ? `Client: ${p.clientName}` : undefined,
              }))}
            />
          </div>

          {/* Stats */}
          {selectedProject && !loading && (
            <div className="flex items-center gap-3">
              <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-center">
                <p className="text-[10px] uppercase tracking-wider text-gray-500">Records</p>
                <p className="mt-0.5 text-lg font-bold text-warm-brown">{totalElements}</p>
              </div>
            </div>
          )}

          {/* New record button */}
          <button
            type="button"
            id="new-financial-record-btn"
            disabled={!selectedProject}
            onClick={() => { setEditRecord(null); setModalOpen(true) }}
            className="flex items-center gap-2 rounded-xl bg-warm-brown px-5 py-2.5 text-sm font-semibold text-white
              transition-all hover:bg-[#6B4A33] hover:shadow-sm
              disabled:cursor-not-allowed disabled:opacity-40 active:scale-[0.98]"
          >
            <PlusIcon className="w-4 h-4" />
            New Record
          </button>
        </div>

        {/* Empty project state */}
        {!selectedProject ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 text-gray-300">
              <BanknoteIcon className="h-7 w-7" />
            </div>
            <p className="mt-4 text-base font-semibold text-gray-500">Select a project to begin</p>
            <p className="mt-1 text-sm text-slate-600">
              Financial records are scoped per project. Choose one from the dropdown above.
            </p>
          </div>
        ) : (
          <div className="p-5 sm:p-6">
            <DataTable
              columns={columns}
              data={records}
              loading={loading}
              totalPages={totalPages}
              currentPage={page}
              onPageChange={setPage}
              totalElements={totalElements}
              pageSize={PAGE_SIZE}
              keyExtractor={(r) => r.financialRecordId}
              emptyMessage="No financial records found for this project."
            />
          </div>
        )}
      </section>

      {/* ── Create / Edit Modal ── */}
      <FinancialRecordModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditRecord(null) }}
        projectId={selectedProject?.projectId}
        record={editRecord}
        projectItems={projectItems}
        language={lang}
        onSaved={async () => {
          setModalOpen(false)
          setEditRecord(null)
          fetchSummary()
          if (page === 0) {
            await fetchRecords()
          } else {
            setPage(0)
          }
        }}
      />

      {/* ── Delete confirmation ── */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => { if (!deleting) setDeleteTarget(null) }}
        onConfirm={handleDeleteConfirm}
        loading={deleting}
        title="Delete Financial Record"
        message={`Are you sure you want to permanently delete this ${deleteTarget?.recordType?.toLowerCase()} record of ${formatMoney(deleteTarget?.amount)}? This action cannot be undone.`}
        confirmLabel="Delete Record"
      />
    </div>
  )
}

// ─── Mini icon components ─────────────────────────────────────

function IconBtn({ children, label, onClick, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-700/60 ${className}`}
    >
      {children}
    </button>
  )
}

function PencilIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
  )
}

function PlusIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  )
}

function DocIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
  )
}

function BanknoteIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
    </svg>
  )
}
