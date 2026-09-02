import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getAllRoles, createRole, updateRole, deleteRole } from '@/api/rolesApi'
import DataTable from '@/components/admin/DataTable'
import Modal from '@/components/admin/Modal'
import ConfirmDialog from '@/components/admin/ConfirmDialog'
import Alert from '@/components/ui/Alert'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

/**
 * RolesPage — /admin/roles
 *
 * Features:
 *   - Paginated table of all roles (GET /api/v1/roles)
 *   - Create role modal (POST /api/v1/roles)
 *   - Edit role modal   (PUT  /api/v1/roles/{roleId})
 *   - Delete role confirm dialog (DELETE /api/v1/roles/{roleId})
 *   - System role warning when targeting ADMIN/ENGINEER/CLIENT
 */

const SYSTEM_ROLES = ['ADMIN', 'ENGINEER', 'CLIENT']
const PAGE_SIZE = 10

export default function RolesPage() {
  const { t, i18n } = useTranslation()

  // Table state
  const [roles, setRoles]           = useState([])
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [page, setPage]             = useState(0)
  const [tableLoading, setTableLoading] = useState(true)

  // Alerts
  const [error, setError]     = useState(null)
  const [success, setSuccess] = useState(null)

  // Create / Edit modal
  const [modalOpen, setModalOpen]   = useState(false)
  const [editTarget, setEditTarget] = useState(null) // null = create mode
  const [roleName, setRoleName]     = useState('')
  const [nameError, setNameError]   = useState('')
  const [saving, setSaving]         = useState(false)

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState(null) // { roleId, roleName }
  const [deleting, setDeleting]         = useState(false)

  /* ── Fetch ────────────────────────────────────────── */
  const fetchRoles = useCallback(() => {
    setTableLoading(true)
    setError(null)
    getAllRoles(page, PAGE_SIZE)
      .then(({ data: res }) => {
        const p = res.data
        setRoles(p.content ?? [])
        setTotalPages(p.totalPages ?? 0)
        setTotalElements(p.totalElements ?? 0)
      })
      .catch((err) => setError(err.response?.data?.message ?? t('errors.generic')))
      .finally(() => setTableLoading(false))
  }, [page, t])

  useEffect(() => { fetchRoles() }, [fetchRoles])

  /* ── Modal helpers ────────────────────────────────── */
  const openCreate = () => {
    setEditTarget(null)
    setRoleName('')
    setNameError('')
    setModalOpen(true)
  }

  const openEdit = (role) => {
    setEditTarget(role)
    setRoleName(role.roleName)
    setNameError('')
    setModalOpen(true)
  }

  const closeModal = () => {
    if (saving) return
    setModalOpen(false)
    setEditTarget(null)
    setRoleName('')
    setNameError('')
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!roleName.trim()) {
      setNameError(t('validation.required'))
      return
    }
    setNameError('')
    setSaving(true)
    setError(null)
    try {
      if (editTarget) {
        await updateRole(editTarget.roleId, roleName.trim())
        setSuccess(t('roles.update_success'))
      } else {
        await createRole(roleName.trim())
        setSuccess(t('roles.create_success'))
      }
      closeModal()
      setPage(0)
      fetchRoles()
    } catch (err) {
      setError(err.response?.data?.message ?? t('errors.generic'))
    } finally {
      setSaving(false)
    }
  }

  /* ── Delete helpers ───────────────────────────────── */
  const openDelete = (role) => setDeleteTarget(role)

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    setError(null)
    try {
      await deleteRole(deleteTarget.roleId)
      setSuccess(t('roles.delete_success'))
      setDeleteTarget(null)
      if (roles.length === 1 && page > 0) setPage((p) => p - 1)
      else fetchRoles()
    } catch (err) {
      setError(err.response?.data?.message ?? t('errors.generic'))
      setDeleteTarget(null)
    } finally {
      setDeleting(false)
    }
  }

  /* ── Columns ──────────────────────────────────────── */
  const formatDate = (iso) =>
    iso ? new Date(iso).toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : 'en-GB') : '—'

  const columns = [
    {
      key: 'roleId',
      header: t('roles.role_id'),
      className: 'font-mono text-xs text-slate-500 w-16',
    },
    {
      key: 'roleName',
      header: t('roles.role_name'),
      render: (val) => (
        <span className={`inline-flex items-center gap-1.5 font-semibold
          ${SYSTEM_ROLES.includes(val) ? 'text-brand-300' : 'text-slate-200'}`}>
          {SYSTEM_ROLES.includes(val) && (
            <span className="w-1.5 h-1.5 rounded-full bg-brand-400 inline-block" />
          )}
          {val}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: t('roles.created_at'),
      render: (val) => <span className="text-slate-500 text-xs">{formatDate(val)}</span>,
    },
    {
      key: 'updatedAt',
      header: t('roles.updated_at'),
      render: (val) => <span className="text-slate-500 text-xs">{formatDate(val)}</span>,
    },
    {
      key: '_actions',
      header: t('roles.actions'),
      headerClass: 'text-end',
      className: 'text-end',
      render: (_, row) => (
        <div className="flex items-center justify-end gap-2">
          <ActionBtn
            onClick={() => openEdit(row)}
            title={t('roles.edit')}
            icon={<EditIcon />}
            color="brand"
          />
          <ActionBtn
            onClick={() => openDelete(row)}
            title={t('roles.delete')}
            icon={<TrashIcon />}
            color="red"
          />
        </div>
      ),
    },
  ]

  return (
    <div className="animate-slide-up space-y-5">
      {/* Page heading + actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">{t('roles.title')}</h2>
          <p className="text-slate-500 text-sm mt-0.5">{t('roles.subtitle')}</p>
        </div>
        <button
          id="create-role-btn"
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl
            bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm
            transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500/50
            active:scale-[0.98] shadow-glow-indigo self-start"
        >
          <PlusIcon />
          {t('roles.create')}
        </button>
      </div>

      {/* Alerts */}
      <Alert message={error}   variant="error"   onClose={() => setError(null)} />
      <Alert message={success} variant="success" onClose={() => setSuccess(null)} />

      {/* System roles info banner */}
      <div className="flex items-start gap-3 px-4 py-3 rounded-xl
        bg-brand-900/30 border border-brand-700/30 text-xs text-brand-300">
        <InfoIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <span>{t('roles.system_role_warning')}</span>
      </div>

      {/* Table */}
      <div className="glass-card p-0 overflow-hidden">
        <DataTable
          columns={columns}
          data={roles}
          loading={tableLoading}
          totalPages={totalPages}
          totalElements={totalElements}
          currentPage={page}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
          emptyMessage={t('roles.no_roles')}
          keyExtractor={(row) => String(row.roleId)}
        />
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editTarget ? t('roles.edit') : t('roles.create')}
        size="sm"
      >
        <form id="role-form" onSubmit={handleSave} noValidate className="space-y-4">
          <Input
            id="role-name-input"
            label={t('roles.role_name')}
            placeholder={t('roles.role_name_placeholder')}
            value={roleName}
            onChange={(e) => setRoleName(e.target.value.toUpperCase())}
            error={nameError}
            autoFocus
            autoComplete="off"
          />
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="ghost" type="button" onClick={closeModal} disabled={saving}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" loading={saving}>
              {saving
                ? (editTarget ? t('roles.updating') : t('roles.creating'))
                : (editTarget ? t('roles.edit') : t('roles.create'))}
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
        title={t('roles.delete_confirm_title')}
        message={t('roles.delete_confirm_message', { name: deleteTarget?.roleName ?? '' })}
        confirmLabel={deleting ? t('roles.deleting') : t('roles.delete')}
      />
    </div>
  )
}

/* ── Small helpers ─────────────────────────────────────── */
function ActionBtn({ onClick, title, icon, color }) {
  const cls = color === 'red'
    ? 'text-slate-500 hover:text-red-400 hover:bg-red-900/30'
    : 'text-slate-500 hover:text-brand-300 hover:bg-brand-900/30'
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className={`w-8 h-8 rounded-lg flex items-center justify-center
        transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-brand-500/40
        ${cls}`}
    >
      {icon}
    </button>
  )
}

function PlusIcon()  { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg> }
function EditIcon()  { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" /></svg> }
function TrashIcon() { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg> }
function InfoIcon({ className }) { return <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" /></svg> }
