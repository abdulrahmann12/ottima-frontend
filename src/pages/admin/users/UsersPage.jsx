import { getAllRoles } from '@/api/rolesApi'
import {
    activateUser,
    createAdmin,
    createClient,
    createEngineer,
    deleteUser,
    getAllAdmins,
    getAllClients,
    getAllDeactivatedUsers,
    getAllEngineers,
    searchUsers,
    updateUserByAdmin,
} from '@/api/usersApi'
import ConfirmDialog from '@/components/admin/ConfirmDialog'
import DataTable from '@/components/admin/DataTable'
import Modal from '@/components/admin/Modal'
import UserBadge from '@/components/admin/UserBadge'
import Alert from '@/components/ui/Alert'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

/**
 * UsersPage — /admin/users (ADMIN only)
 *
 * Tabbed interface managing Admins, Engineers, and Clients.
 * Validates backend rules:
 *   - username: 6–50 chars
 *   - email: valid format, max 100 chars
 *   - fullNameAr & fullNameEn: required
 *   - phoneNumber: exactly 11 digits
 *   - password: min 8 chars (create mode only)
 *   - roleId: required for admin update
 */

const PAGE_SIZE = 10

const EMPTY_CREATE_FORM = {
  username: '',
  email: '',
  fullNameAr: '',
  fullNameEn: '',
  password: '',
  phoneNumber: '',
}

const EMPTY_EDIT_FORM = {
  username: '',
  email: '',
  fullNameAr: '',
  fullNameEn: '',
  phoneNumber: '',
  roleId: '',
}

export default function UsersPage() {
  const { t, i18n } = useTranslation()

  // Tab state: 'ADMIN' | 'ENGINEER' | 'CLIENT' | 'DEACTIVATED'
  const [activeTab, setActiveTab] = useState('ADMIN')
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Table state
  const [users, setUsers]           = useState([])
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [page, setPage]             = useState(0)
  const [loading, setLoading]       = useState(true)

  // Roles list for Edit Modal dropdown
  const [availableRoles, setAvailableRoles] = useState([])

  // Alerts
  const [error, setError]     = useState(null)
  const [success, setSuccess] = useState(null)

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editTarget, setEditTarget]           = useState(null) // null when modal closed
  const [viewTarget, setViewTarget]           = useState(null) // for user details
  const [createForm, setCreateForm]           = useState(EMPTY_CREATE_FORM)
  const [editForm, setEditForm]               = useState(EMPTY_EDIT_FORM)
  const [fieldErrors, setFieldErrors]         = useState({})
  const [saving, setSaving]                   = useState(false)

  // Deactivate/Activate Confirm Dialog
  const [confirmTarget, setConfirmTarget]   = useState(null) // { user, action: 'deactivate' | 'activate' }
  const [actionLoading, setActionLoading]   = useState(false)

  // Load available roles on mount
  useEffect(() => {
    getAllRoles(0, 100)
      .then(({ data: res }) => {
        setAvailableRoles(res.data?.content ?? [])
      })
      .catch(() => {})
  }, [])

  // Handle debounced search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setPage(0)
    }, 400)
    return () => clearTimeout(handler)
  }, [searchQuery])

  /* ── Fetch tab users ────────────────────────────────── */
  const fetchUsers = useCallback(() => {
    setLoading(true)
    setError(null)

    let fetcher
    let args = [page, PAGE_SIZE]

    if (debouncedSearch.trim()) {
      fetcher = searchUsers
      args = [debouncedSearch.trim(), page, PAGE_SIZE]
    } else {
      if (activeTab === 'ADMIN') fetcher = getAllAdmins
      else if (activeTab === 'ENGINEER') fetcher = getAllEngineers
      else if (activeTab === 'CLIENT') fetcher = getAllClients
      else if (activeTab === 'DEACTIVATED') fetcher = getAllDeactivatedUsers
    }

    fetcher(...args)
      .then(({ data: res }) => {
        const p = res.data
        setUsers(p.content ?? [])
        setTotalPages(p.totalPages ?? 0)
        setTotalElements(p.totalElements ?? 0)
      })
      .catch((err) => setError(err.response?.data?.message ?? t('errors.generic')))
      .finally(() => setLoading(false))
  }, [activeTab, page, debouncedSearch, t])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setPage(0)
    setError(null)
    setSuccess(null)
  }

  /* ── Create User ────────────────────────────────────── */
  const openCreateModal = () => {
    setCreateForm(EMPTY_CREATE_FORM)
    setFieldErrors({})
    setCreateModalOpen(true)
  }

  const validateCreate = () => {
    const errs = {}
    if (!createForm.username || createForm.username.length < 6 || createForm.username.length > 50) {
      errs.username = t('users.username_length')
    }
    if (!createForm.email) errs.email = t('validation.required')
    if (!createForm.fullNameAr) errs.fullNameAr = t('validation.required')
    if (!createForm.fullNameEn) errs.fullNameEn = t('validation.required')
    if (!createForm.password || createForm.password.length < 8) {
      errs.password = t('validation.password_min')
    }
    if (!createForm.phoneNumber || createForm.phoneNumber.length !== 11) {
      errs.phoneNumber = t('users.phone_exact_length')
    }
    return errs
  }

  const handleCreateSubmit = async (e) => {
    e.preventDefault()
    const errs = validateCreate()
    if (Object.keys(errs).length) {
      setFieldErrors(errs)
      return
    }
    setFieldErrors({})
    setSaving(true)
    setError(null)

    const creator =
      activeTab === 'ADMIN'
        ? createAdmin
        : activeTab === 'ENGINEER'
        ? createEngineer
        : createClient

    try {
      await creator(createForm)
      setSuccess(t('users.create_success'))
      setCreateModalOpen(false)
      setPage(0)
      fetchUsers()
    } catch (err) {
      setError(err.response?.data?.message ?? t('errors.generic'))
    } finally {
      setSaving(false)
    }
  }

  /* ── Edit User ──────────────────────────────────────── */
  const openEditModal = (user) => {
    setEditTarget(user)
    // Find matching role Long ID from availableRoles
    const matchedRole = availableRoles.find((r) => r.roleName === user.roleName)

    setEditForm({
      username:   user.username ?? '',
      email:      user.email ?? '',
      fullNameAr: user.fullNameAr ?? '',
      fullNameEn: user.fullNameEn ?? '',
      phoneNumber: user.phoneNumber ?? '',
      roleId:     matchedRole ? String(matchedRole.roleId) : '',
    })
    setFieldErrors({})
  }

  const validateEdit = () => {
    const errs = {}
    if (!editForm.username || editForm.username.length < 6 || editForm.username.length > 50) {
      errs.username = t('users.username_length')
    }
    if (!editForm.email) errs.email = t('validation.required')
    if (!editForm.fullNameAr) errs.fullNameAr = t('validation.required')
    if (!editForm.fullNameEn) errs.fullNameEn = t('validation.required')
    if (!editForm.phoneNumber || editForm.phoneNumber.length !== 11) {
      errs.phoneNumber = t('users.phone_exact_length')
    }
    if (!editForm.roleId) errs.roleId = t('validation.required')
    return errs
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    const errs = validateEdit()
    if (Object.keys(errs).length) {
      setFieldErrors(errs)
      return
    }
    setFieldErrors({})
    setSaving(true)
    setError(null)

    const payload = {
      ...editForm,
      roleId: Number(editForm.roleId),
    }

    try {
      await updateUserByAdmin(editTarget.userId, payload)
      setSuccess(t('users.update_success'))
      setEditTarget(null)
      fetchUsers()
    } catch (err) {
      setError(err.response?.data?.message ?? t('errors.generic'))
    } finally {
      setSaving(false)
    }
  }

  /* ── User Active Helper ────────────────────────────── */
  const isUserActive = useCallback((u) => {
    if (!u) return false
    if (u.active === true || u.status === 'ACTIVE' || u.isActive === true) return true
    if (u.active === false || u.status === 'DEACTIVATED' || u.isActive === false) return false
    if (u.deletesAt != null || u.deletedAt != null) return false
    if (activeTab === 'DEACTIVATED') return false
    return true
  }, [activeTab])

  /* ── Deactivate / Activate Action ──────────────────── */
  const handleToggleStatus = async () => {
    if (!confirmTarget) return
    const { user, action } = confirmTarget
    setActionLoading(true)
    setError(null)

    try {
      if (action === 'deactivate') {
        await deleteUser(user.userId)
        setSuccess(t('users.deactivate_success'))
      } else {
        await activateUser(user.userId)
        setSuccess(t('users.activate_success'))
      }
    } catch (err) {
      setError(err.response?.data?.message ?? t('errors.generic'))
    } finally {
      setConfirmTarget(null)
      setActionLoading(false)
      // Always resync with the backend so the badge reflects the true status,
      // even if the action failed because the row's status was already stale.
      fetchUsers()
    }
  }

  /* ── Table Columns ─────────────────────────────────── */
  const formatDate = (iso) =>
    iso ? new Date(iso).toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : 'en-GB') : '—'

  const columns = [
    {
      key: 'fullNameEn',
      header: t('users.full_name_en'),
      render: (val, row) => (
        <div>
          <p className="text-white font-medium">{val}</p>
          <p className="text-slate-500 text-xs font-mono">{row.username}</p>
        </div>
      ),
    },
    {
      key: 'fullNameAr',
      header: t('users.full_name_ar'),
      render: (val) => <span className="text-slate-300" dir="rtl">{val}</span>,
    },
    {
      key: 'email',
      header: t('users.email'),
      render: (val) => <span className="text-slate-300 font-mono text-xs">{val}</span>,
    },
    {
      key: 'phoneNumber',
      header: t('users.phone'),
      render: (val) => <span className="text-slate-300 font-mono text-xs">{val}</span>,
    },
    {
      key: 'active',
      header: t('users.status'),
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <UserBadge active={isUserActive(row)} />
          <UserBadge roleName={row.roleName} type="role" />
        </div>
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
      render: (_, row) => {
        const active = isUserActive(row)
        return (
          <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => openEditModal(row)}
              title={t('roles.edit')}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500
                hover:text-brand-300 hover:bg-brand-900/30 transition-colors focus:outline-none"
            >
              <EditIcon />
            </button>
            {active ? (
              <button
                type="button"
                onClick={() => setConfirmTarget({ user: row, action: 'deactivate' })}
                title={t('users.deactivate')}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500
                  hover:text-red-400 hover:bg-red-900/30 transition-colors focus:outline-none"
              >
                <PowerOffIcon />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmTarget({ user: row, action: 'activate' })}
                title={t('users.activate')}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500
                  hover:text-emerald-400 hover:bg-emerald-900/30 transition-colors focus:outline-none"
              >
                <PowerOnIcon />
              </button>
            )}
          </div>
        )
      },
    },
  ]

  const tabLabelKey =
    activeTab === 'ADMIN' ? 'create_admin' : activeTab === 'ENGINEER' ? 'create_engineer' : 'create_client'

  return (
    <div className="animate-slide-up space-y-5">
      {/* Page Heading & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">{t('users.title')}</h2>
          <p className="text-slate-500 text-sm mt-0.5">{t('users.subtitle')}</p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <input
            type="text"
            placeholder={t('users.search_placeholder', 'Search users...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-4 py-2 bg-slate-800 border border-surface-border rounded-xl text-sm text-white focus:outline-none focus:border-brand-500 w-full sm:w-64 transition-colors"
          />
          {activeTab !== 'DEACTIVATED' && (
            <button
              id="create-user-btn"
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl
                bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm
                transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500/50
                active:scale-[0.98] shadow-glow-indigo self-start"
            >
              <PlusIcon />
              {t(`users.${tabLabelKey}`)}
            </button>
          )}
        </div>
      </div>

      {/* Alerts */}
      <Alert message={error}   variant="error"   onClose={() => setError(null)} />
      <Alert message={success} variant="success" onClose={() => setSuccess(null)} />

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-surface-border pb-2 overflow-x-auto">
        {[
          { id: 'ADMIN',    label: t('users.tab_admins') },
          { id: 'ENGINEER', label: t('users.tab_engineers') },
          { id: 'CLIENT',   label: t('users.tab_clients') },
          { id: 'DEACTIVATED', label: t('users.tab_deactivated', 'Deactivated') },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleTabChange(tab.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200
              ${activeTab === tab.id
                ? 'bg-brand-600 text-white shadow-glow-indigo'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Data Table */}
      <div className="glass-card p-0 overflow-hidden">
        <DataTable
          columns={columns}
          data={users}
          loading={loading}
          totalPages={totalPages}
          totalElements={totalElements}
          currentPage={page}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
          onRowClick={(row) => setViewTarget(row)}
          emptyMessage={t('users.no_users')}
          keyExtractor={(row) => String(row.userId)}
        />
      </div>

      {/* Create User Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title={t(`users.${tabLabelKey}`)}
        size="lg"
      >
        <form onSubmit={handleCreateSubmit} noValidate className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="user-username"
              label={t('users.username')}
              placeholder={t('users.username_placeholder')}
              value={createForm.username}
              onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
              error={fieldErrors.username}
              autoComplete="off"
            />
            <Input
              id="user-email"
              label={t('users.email')}
              placeholder={t('users.email_placeholder')}
              type="email"
              value={createForm.email}
              onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
              error={fieldErrors.email}
              autoComplete="off"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="user-fullname-ar"
              label={t('users.full_name_ar')}
              placeholder={t('users.full_name_ar_placeholder')}
              value={createForm.fullNameAr}
              onChange={(e) => setCreateForm({ ...createForm, fullNameAr: e.target.value })}
              error={fieldErrors.fullNameAr}
              dir="rtl"
              lang="ar"
            />
            <Input
              id="user-fullname-en"
              label={t('users.full_name_en')}
              placeholder={t('users.full_name_en_placeholder')}
              value={createForm.fullNameEn}
              onChange={(e) => setCreateForm({ ...createForm, fullNameEn: e.target.value })}
              error={fieldErrors.fullNameEn}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="user-password"
              label={t('users.password')}
              type="password"
              placeholder={t('users.password_placeholder')}
              value={createForm.password}
              onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
              error={fieldErrors.password}
            />
            <Input
              id="user-phone"
              label={t('users.phone')}
              placeholder={t('users.phone_placeholder')}
              value={createForm.phoneNumber}
              onChange={(e) => setCreateForm({ ...createForm, phoneNumber: e.target.value })}
              error={fieldErrors.phoneNumber}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-surface-border">
            <Button variant="ghost" type="button" onClick={() => setCreateModalOpen(false)} disabled={saving}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" loading={saving}>
              {saving ? t('users.creating') : t('users.create_user')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={!!editTarget}
        onClose={() => setEditTarget(null)}
        title={t('users.edit_user')}
        size="lg"
      >
        <form onSubmit={handleEditSubmit} noValidate className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="edit-user-username"
              label={t('users.username')}
              value={editForm.username}
              onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
              error={fieldErrors.username}
            />
            <Input
              id="edit-user-email"
              label={t('users.email')}
              type="email"
              value={editForm.email}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              error={fieldErrors.email}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="edit-user-fullname-ar"
              label={t('users.full_name_ar')}
              value={editForm.fullNameAr}
              onChange={(e) => setEditForm({ ...editForm, fullNameAr: e.target.value })}
              error={fieldErrors.fullNameAr}
              dir="rtl"
            />
            <Input
              id="edit-user-fullname-en"
              label={t('users.full_name_en')}
              value={editForm.fullNameEn}
              onChange={(e) => setEditForm({ ...editForm, fullNameEn: e.target.value })}
              error={fieldErrors.fullNameEn}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="edit-user-phone"
              label={t('users.phone')}
              value={editForm.phoneNumber}
              onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })}
              error={fieldErrors.phoneNumber}
            />

            <div>
              <label className="form-label">{t('users.role')}</label>
              <select
                value={editForm.roleId}
                onChange={(e) => setEditForm({ ...editForm, roleId: e.target.value })}
                className="input-base text-sm"
              >
                <option value="" disabled>Select Role</option>
                {availableRoles.map((r) => (
                  <option key={r.roleId} value={r.roleId} className="bg-slate-800 text-white">
                    {r.roleName}
                  </option>
                ))}
              </select>
              {fieldErrors.roleId && <p className="mt-1 text-xs text-red-400">{fieldErrors.roleId}</p>}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-surface-border">
            <Button variant="ghost" type="button" onClick={() => setEditTarget(null)} disabled={saving}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" loading={saving}>
              {saving ? t('users.updating') : t('common.submit')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* View User Modal */}
      <Modal
        isOpen={!!viewTarget}
        onClose={() => setViewTarget(null)}
        title={t('users.user_details', 'User Details')}
        size="md"
      >
        {viewTarget && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 border-b border-surface-border pb-4">
               <div className="w-14 h-14 rounded-2xl bg-brand-900/80 border border-brand-700/50 flex items-center justify-center text-brand-400 font-bold text-xl">
                 {viewTarget.fullNameEn?.charAt(0) || 'U'}
               </div>
               <div>
                 <h2 className="text-lg font-bold text-white">{viewTarget.fullNameEn}</h2>
                 <p className="text-slate-400 text-sm font-mono">@{viewTarget.username}</p>
               </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm mt-2">
               <div>
                  <span className="text-slate-500 block mb-1">{t('users.full_name_ar')}</span>
                  <span className="text-slate-300" dir="rtl">{viewTarget.fullNameAr}</span>
               </div>
               <div>
                  <span className="text-slate-500 block mb-1">{t('users.email')}</span>
                  <span className="text-slate-300 font-mono break-all">{viewTarget.email}</span>
               </div>
               <div>
                  <span className="text-slate-500 block mb-1">{t('users.phone')}</span>
                  <span className="text-slate-300 font-mono">{viewTarget.phoneNumber}</span>
               </div>
               <div>
                  <span className="text-slate-500 block mb-1">{t('users.role')}</span>
                  <UserBadge roleName={viewTarget.roleName} type="role" />
               </div>
               <div>
                  <span className="text-slate-500 block mb-1">{t('users.status')}</span>
                  <UserBadge active={isUserActive(viewTarget)} />
               </div>
               <div>
                  <span className="text-slate-500 block mb-1">{t('standard_items.created_at')}</span>
                  <span className="text-slate-300 whitespace-nowrap">{formatDate(viewTarget.createdAt)}</span>
               </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Confirm Deactivate / Activate Dialog */}
      <ConfirmDialog
        isOpen={!!confirmTarget}
        onClose={() => setConfirmTarget(null)}
        onConfirm={handleToggleStatus}
        loading={actionLoading}
        title={
          confirmTarget?.action === 'deactivate'
            ? t('users.deactivate_confirm_title')
            : t('users.activate_confirm_title')
        }
        message={
          confirmTarget?.action === 'deactivate'
            ? t('users.deactivate_confirm_message', { name: confirmTarget?.user?.fullNameEn ?? '' })
            : t('users.activate_confirm_message', { name: confirmTarget?.user?.fullNameEn ?? '' })
        }
        confirmLabel={
          confirmTarget?.action === 'deactivate'
            ? (actionLoading ? t('users.deactivating') : t('users.deactivate'))
            : (actionLoading ? t('users.activating') : t('users.activate'))
        }
      />
    </div>
  )
}

/* ── Icons ────────────────────────────────────────────────── */
function PlusIcon()     { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg> }
function EditIcon()     { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" /></svg> }
function PowerOffIcon() { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M5.636 5.636a9 9 0 1 0 12.728 0M12 3v9" /></svg> }
function PowerOnIcon()  { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg> }
