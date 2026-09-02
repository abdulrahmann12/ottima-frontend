import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  getAllStandardItems,
  createStandardItem,
  updateStandardItem,
  deleteStandardItem,
} from '@/api/standardItemsApi'
import DataTable  from '@/components/admin/DataTable'
import SearchBar  from '@/components/admin/SearchBar'
import Modal      from '@/components/admin/Modal'
import ConfirmDialog from '@/components/admin/ConfirmDialog'
import Alert      from '@/components/ui/Alert'
import Input      from '@/components/ui/Input'
import Button     from '@/components/ui/Button'

/**
 * StandardItemsPage — /admin/standard-items
 *
 * Full CRUD for the StandardItem catalog.
 * API: GET /api/v1/standard-items?search&page&size
 *      POST  /api/v1/standard-items
 *      PUT   /api/v1/standard-items/{itemId}
 *      DELETE /api/v1/standard-items/{itemId}
 */

const PAGE_SIZE = 10

const EMPTY_FORM = {
  nameAr: '',
  nameEn: '',
  descriptionAr: '',
  descriptionEn: '',
  defaultSequence: '',
}

export default function StandardItemsPage() {
  const { t, i18n } = useTranslation()

  // Table state
  const [items, setItems]           = useState([])
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [page, setPage]             = useState(0)
  const [search, setSearch]         = useState('')
  const [tableLoading, setTableLoading] = useState(true)

  // Alerts
  const [error, setError]     = useState(null)
  const [success, setSuccess] = useState(null)

  // Create / Edit modal
  const [modalOpen, setModalOpen]   = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [form, setForm]             = useState(EMPTY_FORM)
  const [fieldErrors, setFieldErrors] = useState({})
  const [saving, setSaving]         = useState(false)

  // Delete
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting]         = useState(false)

  /* ── Fetch ────────────────────────────────────────── */
  const fetchItems = useCallback(() => {
    setTableLoading(true)
    setError(null)
    getAllStandardItems(search, page, PAGE_SIZE)
      .then(({ data: res }) => {
        const p = res.data
        setItems(p.content ?? [])
        setTotalPages(p.totalPages ?? 0)
        setTotalElements(p.totalElements ?? 0)
      })
      .catch((err) => setError(err.response?.data?.message ?? t('errors.generic')))
      .finally(() => setTableLoading(false))
  }, [search, page, t])

  useEffect(() => { fetchItems() }, [fetchItems])

  // Reset page to 0 when search changes
  const handleSearch = (val) => {
    setSearch(val)
    setPage(0)
  }

  /* ── Modal helpers ────────────────────────────────── */
  const openCreate = () => {
    setEditTarget(null)
    setForm(EMPTY_FORM)
    setFieldErrors({})
    setModalOpen(true)
  }

  const openEdit = (item) => {
    setEditTarget(item)
    setForm({
      nameAr:          item.nameAr          ?? '',
      nameEn:          item.nameEn          ?? '',
      descriptionAr:   item.descriptionAr   ?? '',
      descriptionEn:   item.descriptionEn   ?? '',
      defaultSequence: item.defaultSequence != null ? String(item.defaultSequence) : '',
    })
    setFieldErrors({})
    setModalOpen(true)
  }

  const closeModal = () => {
    if (saving) return
    setModalOpen(false)
    setEditTarget(null)
    setForm(EMPTY_FORM)
    setFieldErrors({})
  }

  const handleFormChange = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const validate = () => {
    const errs = {}
    if (!form.nameAr.trim()) errs.nameAr = t('validation.required')
    if (!form.nameEn.trim()) errs.nameEn = t('validation.required')
    return errs
  }

  const handleSave = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setFieldErrors(errs); return }
    setFieldErrors({})
    setSaving(true)
    setError(null)

    const payload = {
      nameAr:          form.nameAr.trim(),
      nameEn:          form.nameEn.trim(),
      descriptionAr:   form.descriptionAr.trim() || undefined,
      descriptionEn:   form.descriptionEn.trim() || undefined,
      defaultSequence: form.defaultSequence ? parseInt(form.defaultSequence, 10) : undefined,
    }

    try {
      if (editTarget) {
        await updateStandardItem(editTarget.itemId, payload)
        setSuccess(t('standard_items.update_success'))
      } else {
        await createStandardItem(payload)
        setSuccess(t('standard_items.create_success'))
      }
      closeModal()
      setPage(0)
      fetchItems()
    } catch (err) {
      setError(err.response?.data?.message ?? t('errors.generic'))
    } finally {
      setSaving(false)
    }
  }

  /* ── Delete helpers ───────────────────────────────── */
  const openDelete = (item) => setDeleteTarget(item)

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    setError(null)
    try {
      await deleteStandardItem(deleteTarget.itemId)
      setSuccess(t('standard_items.delete_success'))
      setDeleteTarget(null)
      if (items.length === 1 && page > 0) setPage((p) => p - 1)
      else fetchItems()
    } catch (err) {
      setError(err.response?.data?.message ?? t('errors.generic'))
      setDeleteTarget(null)
    } finally {
      setDeleting(false)
    }
  }

  /* ── Table columns ────────────────────────────────── */
  const formatDate = (iso) =>
    iso ? new Date(iso).toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : 'en-GB') : '—'

  const columns = [
    {
      key: 'nameAr',
      header: t('standard_items.name_ar'),
      render: (val) => <span className="text-white font-medium">{val}</span>,
    },
    {
      key: 'nameEn',
      header: t('standard_items.name_en'),
      render: (val) => <span className="text-slate-300">{val}</span>,
    },
    {
      key: 'descriptionEn',
      header: t('standard_items.description_en'),
      className: 'max-w-[200px]',
      render: (val) => (
        <span className="text-slate-500 text-xs truncate block" title={val}>
          {val || '—'}
        </span>
      ),
    },
    {
      key: 'defaultSequence',
      header: t('standard_items.default_sequence'),
      className: 'text-center w-20',
      headerClass: 'text-center',
      render: (val) => (
        <span className="text-slate-400 text-xs">
          {val ?? '—'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: t('standard_items.created_at'),
      render: (val) => <span className="text-slate-500 text-xs whitespace-nowrap">{formatDate(val)}</span>,
    },
    {
      key: '_actions',
      header: t('standard_items.actions'),
      headerClass: 'text-end',
      className: 'text-end',
      render: (_, row) => (
        <div className="flex items-center justify-end gap-2">
          <ActionBtn
            onClick={() => openEdit(row)}
            title={t('standard_items.edit')}
            icon={<EditIcon />}
            color="brand"
          />
          <ActionBtn
            onClick={() => openDelete(row)}
            title={t('standard_items.delete')}
            icon={<TrashIcon />}
            color="red"
          />
        </div>
      ),
    },
  ]

  /* ── Display name for delete confirm ─────────────── */
  const deleteName = deleteTarget
    ? (i18n.language === 'ar' ? deleteTarget.nameAr : deleteTarget.nameEn)
    : ''

  return (
    <div className="animate-slide-up space-y-5">
      {/* Page heading + actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">{t('standard_items.title')}</h2>
          <p className="text-slate-500 text-sm mt-0.5">{t('standard_items.subtitle')}</p>
        </div>
        <button
          id="create-standard-item-btn"
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl
            bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm
            transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500/50
            active:scale-[0.98] shadow-glow-indigo self-start"
        >
          <PlusIcon />
          {t('standard_items.create')}
        </button>
      </div>

      {/* Alerts */}
      <Alert message={error}   variant="error"   onClose={() => setError(null)} />
      <Alert message={success} variant="success" onClose={() => setSuccess(null)} />

      {/* Search bar */}
      <div className="flex items-center gap-3">
        <SearchBar
          value={search}
          onChange={handleSearch}
          placeholder={t('standard_items.search_placeholder')}
          className="flex-1 max-w-sm"
        />
        {totalElements > 0 && !tableLoading && (
          <span className="text-slate-600 text-xs hidden sm:block">
            {t('standard_items.showing', {
              from: page * PAGE_SIZE + 1,
              to: Math.min((page + 1) * PAGE_SIZE, totalElements),
              total: totalElements,
            })}
          </span>
        )}
      </div>

      {/* Table */}
      <div className="glass-card p-0 overflow-hidden">
        <DataTable
          columns={columns}
          data={items}
          loading={tableLoading}
          totalPages={totalPages}
          totalElements={totalElements}
          currentPage={page}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
          emptyMessage={search ? t('table.empty') : t('standard_items.no_items')}
          keyExtractor={(row) => row.itemId}
        />
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editTarget ? t('standard_items.edit') : t('standard_items.create')}
        size="lg"
      >
        <form id="standard-item-form" onSubmit={handleSave} noValidate className="space-y-4">
          {/* Name fields in a 2-column grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="item-name-ar"
              label={t('standard_items.name_ar')}
              placeholder={t('standard_items.name_ar_placeholder')}
              value={form.nameAr}
              onChange={handleFormChange('nameAr')}
              error={fieldErrors.nameAr}
              dir="rtl"
              lang="ar"
              autoComplete="off"
            />
            <Input
              id="item-name-en"
              label={t('standard_items.name_en')}
              placeholder={t('standard_items.name_en_placeholder')}
              value={form.nameEn}
              onChange={handleFormChange('nameEn')}
              error={fieldErrors.nameEn}
              autoComplete="off"
            />
          </div>

          {/* Description fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                {t('standard_items.description_ar')}
              </label>
              <textarea
                id="item-desc-ar"
                value={form.descriptionAr}
                onChange={handleFormChange('descriptionAr')}
                placeholder={t('standard_items.description_ar_placeholder')}
                rows={3}
                dir="rtl"
                lang="ar"
                className="input-base resize-none text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                {t('standard_items.description_en')}
              </label>
              <textarea
                id="item-desc-en"
                value={form.descriptionEn}
                onChange={handleFormChange('descriptionEn')}
                placeholder={t('standard_items.description_en_placeholder')}
                rows={3}
                className="input-base resize-none text-sm"
              />
            </div>
          </div>

          {/* Default sequence */}
          <div className="max-w-[180px]">
            <Input
              id="item-default-sequence"
              label={t('standard_items.default_sequence')}
              placeholder={t('standard_items.default_sequence_placeholder')}
              value={form.defaultSequence}
              onChange={handleFormChange('defaultSequence')}
              type="number"
              min={1}
              autoComplete="off"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-surface-border">
            <Button variant="ghost" type="button" onClick={closeModal} disabled={saving}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" loading={saving}>
              {saving
                ? (editTarget ? t('standard_items.updating') : t('standard_items.creating'))
                : (editTarget ? t('standard_items.edit') : t('standard_items.create'))}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title={t('standard_items.delete_confirm_title')}
        message={t('standard_items.delete_confirm_message', { name: deleteName })}
        confirmLabel={deleting ? t('standard_items.deleting') : t('standard_items.delete')}
      />
    </div>
  )
}

/* ── Helpers ─────────────────────────────────────────────── */
function ActionBtn({ onClick, title, icon, color }) {
  const cls = color === 'red'
    ? 'text-slate-500 hover:text-red-400 hover:bg-red-900/30'
    : 'text-slate-500 hover:text-brand-300 hover:bg-brand-900/30'
  return (
    <button type="button" onClick={onClick} title={title} aria-label={title}
      className={`w-8 h-8 rounded-lg flex items-center justify-center
        transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-brand-500/40 ${cls}`}>
      {icon}
    </button>
  )
}

function PlusIcon()  { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg> }
function EditIcon()  { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" /></svg> }
function TrashIcon() { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg> }
