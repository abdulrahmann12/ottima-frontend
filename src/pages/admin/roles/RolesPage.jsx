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
    if (SYSTEM_ROLES.includes(role.roleName)) {
      setError(t('roles.cannot_edit_system_role'))
      return
    }
    if ((role.userCount ?? 0) > 0) {
      setError(t('roles.cannot_edit_role_in_use', { count: role.userCount }))
      return
    }
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
  const openDelete = (role) => {
    if (SYSTEM_ROLES.includes(role.roleName)) {
      setError(t('roles.cannot_delete_system_role'))
      return
    }
    if ((role.userCount ?? 0) > 0) {
      setError(t('roles.cannot_delete_role_in_use', { count: role.userCount }))
      return
    }
    setDeleteTarget(role)
  }

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
    iso ? new Date(iso).toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : 'en-US') : '—'

  const columns = [
    {
      key: 'roleId',
      header: t('roles.role_id'),
      className: 'font-mono text-xs text-gray-500 w-16',
    },
    {
      key: 'roleName',
      header: t('roles.role_name'),
      render: (val) => (
        <span className={`inline-flex items-center gap-1.5 font-semibold
          ${SYSTEM_ROLES.includes(val) ? 'text-warm-brown' : 'text-gray-900'}`}>
          {SYSTEM_ROLES.includes(val) && (
            <span className="w-1.5 h-1.5 rounded-full bg-warm-brown inline-block" />
          )}
          {val}
        </span>
      ),
    },
    {
      key: 'userCount',
      header: t('roles.user_count', 'Assigned Users'),
      render: (val) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
          (val ?? 0) > 0 ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-gray-100 text-gray-500'
        }`}>
          {val ?? 0}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: t('roles.created_at'),
      render: (val) => <span className="text-gray-500 text-xs">{formatDate(val)}</span>,
    },
    {
      key: 'updatedAt',
      header: t('roles.updated_at'),
      render: (val) => <span className="text-gray-500 text-xs">{formatDate(val)}</span>,
    },
    {
      key: '_actions',
      header: t('roles.actions'),
      headerClass: 'text-end',
      className: 'text-end',
      render: (_, row) => {
        const isSystem = SYSTEM_ROLES.includes(row.roleName)
        const hasUsers = (row.userCount ?? 0) > 0
        const cannotModify = isSystem || hasUsers

        const editTitle = isSystem
          ? t('roles.cannot_edit_system_role')
          : hasUsers
          ? t('roles.cannot_edit_role_in_use', { count: row.userCount })
          : t('roles.edit')

        const deleteTitle = isSystem
          ? t('roles.cannot_delete_system_role')
          : hasUsers
          ? t('roles.cannot_delete_role_in_use', { count: row.userCount })
          : t('roles.delete')

        return (
          <div className="flex items-center justify-end gap-2">
            <ActionBtn
              onClick={() => openEdit(row)}
              title={editTitle}
              icon={<EditIcon />}
              color={cannotModify ? 'gray' : 'brand'}
              disabled={cannotModify}
            />
            <ActionBtn
              onClick={() => openDelete(row)}
              title={deleteTitle}
              icon={<TrashIcon />}
              color={cannotModify ? 'gray' : 'red'}
              disabled={cannotModify}
            />
          </div>
        )
      },
    },
  ]

  /* ── Mobile Card Renderer ───────────────────────────── */
  const renderRoleCard = (role) => {
    const isSystem = SYSTEM_ROLES.includes(role.roleName)
    const hasUsers = (role.userCount ?? 0) > 0
    const cannotModify = isSystem || hasUsers

    const editTitle = isSystem
      ? t('roles.cannot_edit_system_role')
      : hasUsers
      ? t('roles.cannot_edit_role_in_use', { count: role.userCount })
      : t('roles.edit')

    const deleteTitle = isSystem
      ? t('roles.cannot_delete_system_role')
      : hasUsers
      ? t('roles.cannot_delete_role_in_use', { count: role.userCount })
      : t('roles.delete')

    return (
      <div
        className="bg-white rounded-2xl border border-gray-200/90 p-4 shadow-xs hover:shadow-md transition-all duration-200 space-y-3"
      >
        {/* Top Header: Icon + Name + Badges */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${
                isSystem
                  ? 'bg-warm-brown/10 border-warm-brown/20 text-warm-brown'
                  : 'bg-indigo-50 border-indigo-200 text-indigo-700'
              }`}
            >
              <ShieldIcon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-gray-900 font-medium text-sm truncate">
                  {role.roleName}
                </h3>
                {isSystem && (
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-warm-brown shrink-0"
                    title={t('roles.system_role', 'System Role')}
                  />
                )}
              </div>
              <p className="text-gray-500 text-xs font-mono">
                #{role.roleId}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1 shrink-0">
            {isSystem ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-warm-brown/10 text-warm-brown border border-warm-brown/20">
                <span className="w-1.5 h-1.5 rounded-full bg-warm-brown" />
                {t('roles.system_role', 'System')}
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                {t('roles.custom_role', 'Custom')}
              </span>
            )}
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                hasUsers
                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              <UsersIcon className="w-3 h-3" />
              <span>{role.userCount ?? 0}</span>
            </span>
          </div>
        </div>

        {/* Info Grid */}
        <div className="bg-gray-50/80 rounded-xl p-3 space-y-2 text-xs border border-gray-100">
          <div className="flex items-center justify-between gap-2">
            <span className="text-gray-500 font-medium">{t('roles.user_count', 'Assigned Users')}</span>
            <span className={`font-semibold ${hasUsers ? 'text-amber-700' : 'text-gray-600'}`}>
              {role.userCount ?? 0} {t('roles.users_count', 'users')}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-gray-500 font-medium">{t('roles.created_at')}</span>
            <span className="text-gray-700">{formatDate(role.createdAt)}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-gray-500 font-medium">{t('roles.updated_at')}</span>
            <span className="text-gray-700">{formatDate(role.updatedAt)}</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div
          className="flex items-center justify-end gap-2 pt-1 border-t border-gray-100"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => openEdit(role)}
            disabled={cannotModify}
            title={editTitle}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors border ${
              cannotModify
                ? 'text-gray-300 border-gray-200/50 bg-gray-50/50 cursor-not-allowed opacity-40'
                : 'text-gray-700 hover:text-warm-brown hover:bg-warm-brown/10 border-gray-200 cursor-pointer'
            }`}
          >
            <EditIcon />
            <span>{t('roles.edit')}</span>
          </button>

          <button
            type="button"
            onClick={() => openDelete(role)}
            disabled={cannotModify}
            title={deleteTitle}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors border ${
              cannotModify
                ? 'text-gray-300 border-gray-200/50 bg-gray-50/50 cursor-not-allowed opacity-40'
                : 'text-red-700 bg-red-50/80 border-red-200 hover:bg-red-100 cursor-pointer'
            }`}
          >
            <TrashIcon />
            <span>{t('roles.delete')}</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-slide-up space-y-5">
      {/* Page heading + actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-medium text-gray-900">{t('roles.title')}</h2>
          <p className="text-gray-500 text-sm font-light mt-0.5">{t('roles.subtitle')}</p>
        </div>
        <button
          id="create-role-btn"
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl
            bg-warm-brown hover:bg-[#6B4A33] text-white font-semibold text-sm
            transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-warm-brown/50
            active:scale-[0.98] shadow-sm self-start"
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
        bg-amber-50 border border-amber-200 text-xs text-amber-900 font-medium">
        <InfoIcon className="w-4 h-4 mt-0.5 text-amber-700 flex-shrink-0" />
        <span>{t('roles.system_role_warning')}</span>
      </div>

      {/* Table */}
      <div className="md:glass-card md:p-0 md:overflow-hidden">
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
          renderMobileCard={renderRoleCard}
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
function ActionBtn({ onClick, title, icon, color, disabled }) {
  const cls = disabled
    ? 'text-gray-300 cursor-not-allowed opacity-40'
    : color === 'red'
    ? 'text-gray-500 hover:text-red-600 hover:bg-red-50 cursor-pointer'
    : 'text-gray-500 hover:text-warm-brown hover:bg-light-blue/40 cursor-pointer'
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      className={`w-8 h-8 rounded-lg flex items-center justify-center
        transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-warm-brown/40
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
function ShieldIcon({ className = 'w-4 h-4' }) { return <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" /></svg> }
function UsersIcon({ className = 'w-3 h-3' }) { return <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" /></svg> }
