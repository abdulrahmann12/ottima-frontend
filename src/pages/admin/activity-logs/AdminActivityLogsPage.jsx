import { getActivityLogsByUser, getAllActivityLogs } from '@/api/adminActivityLogApi'
import { searchUsers } from '@/api/usersApi'
import DataTable from '@/components/admin/DataTable'
import Modal from '@/components/admin/Modal'
import Alert from '@/components/ui/Alert'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import SearchableSelect from '@/components/ui/SearchableSelect'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

const PAGE_SIZE = 10

const ACTION_OPTIONS = [
  'CREATE',
  'UPDATE',
  'DELETE',
  'LOGIN_SUCCESS',
  'LOGIN_FAILED',
  'LOGOUT',
  'UPLOAD',
  'DOWNLOAD',
]

const STATUS_OPTIONS = ['SUCCESS', 'FAILED']

/**
 * Safely parse JSON strings
 */
function safeJsonParse(val) {
  if (!val) return null
  if (typeof val === 'object') return val
  try {
    return JSON.parse(val)
  } catch {
    return null
  }
}

/**
 * Helper to unnest single-wrapper objects like { "request": { ... } }
 */
function unwrapObject(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj
  const keys = Object.keys(obj)
  if (keys.length === 1 && typeof obj[keys[0]] === 'object' && obj[keys[0]] !== null && !Array.isArray(obj[keys[0]])) {
    return unwrapObject(obj[keys[0]])
  }
  return obj
}

/**
 * Helper to format camelCase or snake_case keys into human-readable titles
 */
function formatFieldLabel(key) {
  if (!key) return ''
  const LABELS = {
    username: 'Username',
    email: 'Email Address',
    fullNameAr: 'Full Name (Arabic)',
    fullNameEn: 'Full Name (English)',
    phoneNumber: 'Phone Number',
    roleName: 'Role Name',
    roleId: 'Role ID',
    active: 'Active Status',
    enabled: 'Account Enabled',
    createdAt: 'Created Timestamp',
    updatedAt: 'Last Updated Timestamp',
    amount: 'Financial Amount',
    recordType: 'Transaction Type',
    description: 'Description',
    titleAr: 'Title (Arabic)',
    titleEn: 'Title (English)',
    nameAr: 'Name (Arabic)',
    nameEn: 'Name (English)',
    estimatedBudget: 'Estimated Budget',
  }
  if (LABELS[key]) return LABELS[key]

  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase())
    .trim()
}

/**
 * Helper to format field values for display
 */
function formatDisplayValue(val) {
  if (val === null || val === undefined) return '—'
  if (typeof val === 'boolean') return val ? 'Active (True)' : 'Inactive (False)'
  if (typeof val === 'object') return JSON.stringify(val)
  return String(val)
}

/**
 * Computes diff between old & new values
 */
function computeDiff(oldDataRaw, newDataRaw) {
  const oldParsed = typeof oldDataRaw === 'string' ? safeJsonParse(oldDataRaw) : oldDataRaw
  const newParsed = typeof newDataRaw === 'string' ? safeJsonParse(newDataRaw) : newDataRaw

  const oldObj = unwrapObject(oldParsed) || {}
  const newObj = unwrapObject(newParsed) || {}

  const allKeys = Array.from(new Set([...Object.keys(oldObj), ...Object.keys(newObj)]))
  const diffs = []

  allKeys.forEach((key) => {
    const hasOld = Object.prototype.hasOwnProperty.call(oldObj, key) && oldObj[key] !== undefined && oldObj[key] !== null
    const hasNew = Object.prototype.hasOwnProperty.call(newObj, key) && newObj[key] !== undefined && newObj[key] !== null

    const oldVal = oldObj[key]
    const newVal = newObj[key]

    const oldStr = JSON.stringify(oldVal)
    const newStr = JSON.stringify(newVal)

    let type = 'UNCHANGED'
    if (!hasOld && hasNew) {
      type = 'ADDED'
    } else if (hasOld && !hasNew) {
      type = 'REMOVED'
    } else if (oldStr !== newStr) {
      type = 'CHANGED'
    }

    diffs.push({
      key,
      label: formatFieldLabel(key),
      type,
      oldVal,
      newVal,
      oldFormatted: formatDisplayValue(oldVal),
      newFormatted: formatDisplayValue(newVal),
    })
  })

  // Priority: CHANGED -> ADDED -> REMOVED -> UNCHANGED
  const priority = { CHANGED: 1, ADDED: 2, REMOVED: 3, UNCHANGED: 4 }
  diffs.sort((a, b) => priority[a.type] - priority[b.type])

  return diffs
}

/**
 * Action badge component
 */
function ActionBadge({ action }) {
  const act = (action || '').toUpperCase()

  let colorClasses = 'bg-gray-100 text-gray-600 border-gray-200'
  if (['CREATE', 'ADD', 'REGISTER', 'SAVE', 'INSERT'].some((a) => act.includes(a))) {
    colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200'
  } else if (['UPDATE', 'EDIT', 'MODIFY', 'PUT', 'PATCH', 'CHANGE'].some((a) => act.includes(a))) {
    colorClasses = 'bg-sky-50 text-sky-700 border-sky-200'
  } else if (['DELETE', 'REMOVE', 'DEACTIVATE', 'DROP'].some((a) => act.includes(a))) {
    colorClasses = 'bg-red-50 text-red-600 border-red-200'
  } else if (['LOGIN', 'LOGOUT', 'AUTH', 'TOKEN'].some((a) => act.includes(a))) {
    colorClasses = 'bg-purple-50 text-purple-700 border-purple-200'
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colorClasses}`}
    >
      {action || 'UNKNOWN'}
    </span>
  )
}

/**
 * Status badge component
 */
function StatusBadge({ status }) {
  const st = (status || '').toUpperCase()
  const isSuccess = st === 'SUCCESS' || st === 'OK' || st === '200'

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
        isSuccess
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
          : 'bg-red-50 text-red-600 border-red-200'
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          isSuccess ? 'bg-emerald-500' : 'bg-red-500'
        }`}
      />
      {status || 'UNKNOWN'}
    </span>
  )
}

export default function AdminActivityLogsPage() {
  const { t, i18n } = useTranslation()

  // State
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Pagination state
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [totalElements, setTotalElements] = useState(0)

  // Filters State
  const [selectedUserId, setSelectedUserId] = useState('')
  const [selectedAction, setSelectedAction] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [entityFilter, setEntityFilter] = useState('')

  // Users for filter dropdown
  const [users, setUsers] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(false)

  // View Details Modal State
  const [selectedLog, setSelectedLog] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [viewMode, setViewMode] = useState('simple') // 'simple' | 'side-by-side' | 'raw'
  const [showUnchanged, setShowUnchanged] = useState(false)
  const [diffSearchKeyword, setDiffSearchKeyword] = useState('')
  const [copied, setCopied] = useState(false)

  // Fetch users for user filter
  useEffect(() => {
    let isMounted = true
    setLoadingUsers(true)
    searchUsers('', 0, 100)
      .then((res) => {
        if (!isMounted) return
        const userList = res.data?.data?.content || res.data?.content || res.data?.data || []
        setUsers(Array.isArray(userList) ? userList : [])
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setLoadingUsers(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  // Fetch Activity Logs
  const fetchLogs = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const filters = {
        userId: selectedUserId || undefined,
        action: selectedAction || undefined,
        status: selectedStatus || undefined,
        entityName: entityFilter.trim() || undefined,
      }

      let res
      if (selectedUserId && !selectedAction && !selectedStatus && !entityFilter.trim()) {
        res = await getActivityLogsByUser(selectedUserId, page, PAGE_SIZE)
      } else {
        res = await getAllActivityLogs(filters, page, PAGE_SIZE)
      }

      const pageData = res.data?.data || res.data || {}
      const logList = pageData.content || (Array.isArray(pageData) ? pageData : [])
      setLogs(logList)
      setTotalPages(pageData.totalPages ?? 1)
      setTotalElements(pageData.totalElements ?? logList.length)
    } catch (err) {
      setError(err?.response?.data?.message || t('errors.generic'))
      setLogs([])
    } finally {
      setLoading(false)
    }
  }, [selectedUserId, selectedAction, selectedStatus, entityFilter, page, t])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const handleResetFilters = () => {
    setSelectedUserId('')
    setSelectedAction('')
    setSelectedStatus('')
    setEntityFilter('')
    setPage(0)
  }

  const handleViewChanges = (log) => {
    setSelectedLog(log)
    setViewMode('simple')
    setShowUnchanged(false)
    setDiffSearchKeyword('')
    setCopied(false)
    setIsModalOpen(true)
  }

  const handleCopyLogData = () => {
    if (!selectedLog) return
    const content = JSON.stringify(selectedLog, null, 2)
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  // Table Columns
  const columns = [
    {
      key: 'createdAt',
      header: t('activity_logs.table.date', 'Date & Time'),
      render: (val) => {
        if (!val) return '—'
        const dateObj = new Date(val)
        return (
          <div className="flex flex-col text-xs">
            <span className="font-medium text-gray-800">
              {dateObj.toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : 'en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </span>
            <span className="text-gray-500 font-mono text-[11px]">
              {dateObj.toLocaleTimeString(i18n.language === 'ar' ? 'ar-EG' : 'en-US', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </span>
          </div>
        )
      },
    },
    {
      key: 'username',
      header: t('activity_logs.table.user', 'User'),
      render: (val, row) => {
        const username = val || row.user?.username || row.user?.email || (row.userId ? `User #${row.userId}` : 'System')
        return (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-warm-brown/10 border border-warm-brown/20 flex items-center justify-center text-xs font-semibold text-warm-brown flex-shrink-0">
              {username.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-800 truncate">{username}</p>
              {row.user?.fullNameEn && (
                <p className="text-[11px] text-gray-500 truncate">
                  {i18n.language === 'ar' && row.user?.fullNameAr
                    ? row.user.fullNameAr
                    : row.user.fullNameEn}
                </p>
              )}
            </div>
          </div>
        )
      },
    },
    {
      key: 'action',
      header: t('activity_logs.table.action', 'Action'),
      render: (val) => <ActionBadge action={val} />,
    },
    {
      key: 'entityName',
      header: t('activity_logs.table.entity', 'Entity'),
      render: (val, row) => (
        <span className="font-mono text-xs font-semibold text-gray-700">
          {val || row.entity_name || '—'}
        </span>
      ),
    },
    {
      key: 'status',
      header: t('activity_logs.table.status', 'Status'),
      render: (val) => <StatusBadge status={val} />,
    },
    {
      key: 'ipAddress',
      header: t('activity_logs.table.ip', 'IP Address'),
      render: (val, row) => (
        <span className="font-mono text-xs text-gray-500">
          {val || row.ip_address || '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: t('activity_logs.table.actions', 'Actions'),
      render: (_, row) => (
        <Button
          variant="secondary"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            handleViewChanges(row)
          }}
          className="text-xs py-1 px-2.5 flex items-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          </svg>
          {t('activity_logs.table.view_changes', 'View Details')}
        </Button>
      ),
    },
  ]

  // Compute Diffs for selected log
  const diffs = selectedLog ? computeDiff(selectedLog.oldValues ?? selectedLog.old_values, selectedLog.newValues ?? selectedLog.new_values) : []
  
  // Filter diffs based on keyword & showUnchanged flag
  const visibleDiffs = diffs.filter((d) => {
    if (!showUnchanged && d.type === 'UNCHANGED') return false
    if (!diffSearchKeyword.trim()) return true
    const kw = diffSearchKeyword.toLowerCase()
    return (
      d.label.toLowerCase().includes(kw) ||
      d.key.toLowerCase().includes(kw) ||
      d.oldFormatted.toLowerCase().includes(kw) ||
      d.newFormatted.toLowerCase().includes(kw)
    )
  })

  const hasActiveFilters = selectedUserId || selectedAction || selectedStatus || entityFilter

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {t('activity_logs.title', 'System Activity Logs')}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {t('activity_logs.subtitle', 'Audit trail and security event logs')}
          </p>
        </div>
      </div>

      {/* Filter Toolbar Card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
            <svg className="w-4 h-4 text-warm-brown" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z" />
            </svg>
            {t('activity_logs.filters', 'Filter Logs')}
          </span>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs text-warm-brown hover:text-warm-brown/80 transition-colors font-medium"
            >
              {t('common.clear_all', 'Clear Filters')}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* User Filter */}
          <SearchableSelect
            id="filter-user"
            label={t('activity_logs.filter_user', 'User')}
            placeholder={t('activity_logs.all_users', 'All Users')}
            searchPlaceholder={t('activity_logs.search_users', 'Search users...')}
            value={selectedUserId}
            onChange={(val) => {
              const value = typeof val === 'object' && val !== null && 'target' in val ? val.target.value : val
              setSelectedUserId(value)
              setPage(0)
            }}
            disabled={loadingUsers}
            loading={loadingUsers}
            isClearable={true}
            options={users
              .filter((u) => u.userId || u.id)
              .map((u) => {
                const id = u.userId ?? u.id
                return {
                  value: String(id),
                  label: `${u.fullNameEn || u.fullNameAr || u.username || u.email}${u.username ? ` (@${u.username})` : ''}`,
                  sublabel: u.email || u.phoneNumber,
                }
              })}
          />

          {/* Action Filter */}
          <SearchableSelect
            id="filter-action"
            label={t('activity_logs.filter_action', 'Action')}
            placeholder={t('activity_logs.all_actions', 'All Actions')}
            value={selectedAction}
            onChange={(val) => {
              const value = typeof val === 'object' && val !== null && 'target' in val ? val.target.value : val
              setSelectedAction(value)
              setPage(0)
            }}
            isClearable={true}
            options={ACTION_OPTIONS.map((act) => ({
              value: act,
              label: act,
            }))}
          />

          {/* Status Filter */}
          <SearchableSelect
            id="filter-status"
            label={t('activity_logs.filter_status', 'Status')}
            placeholder={t('activity_logs.all_statuses', 'All Statuses')}
            value={selectedStatus}
            onChange={(val) => {
              const value = typeof val === 'object' && val !== null && 'target' in val ? val.target.value : val
              setSelectedStatus(value)
              setPage(0)
            }}
            isClearable={true}
            options={STATUS_OPTIONS.map((st) => ({
              value: st,
              label: st,
            }))}
          />

          {/* Entity Name Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-gray-700 block">
              {t('activity_logs.filter_entity', 'Entity Name')}
            </label>
            <Input
              type="text"
              placeholder={t('activity_logs.filter_entity_placeholder', 'e.g. USER, PROJECT')}
              value={entityFilter}
              onChange={(e) => {
                setEntityFilter(e.target.value)
                setPage(0)
              }}
              className="py-1.5 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={logs}
        loading={loading}
        totalPages={totalPages}
        currentPage={page}
        onPageChange={(newPage) => setPage(newPage)}
        totalElements={totalElements}
        pageSize={PAGE_SIZE}
        emptyMessage={t('activity_logs.empty', 'No activity logs found.')}
        keyExtractor={(row) => row.id ?? `log-${row.createdAt}-${row.username}`}
      />

      {/* View Details Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedLog(null)
        }}
        title={t('activity_logs.modal.title', 'Activity Log Details')}
        size="xl"
      >
        {selectedLog && (
          <div className="space-y-6">
            {/* Top Action Header Card */}
            <div className="relative overflow-hidden bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-warm-brown/10 border border-warm-brown/20 flex items-center justify-center text-warm-brown flex-shrink-0">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <ActionBadge action={selectedLog.action} />
                      <StatusBadge status={selectedLog.status} />
                      {selectedLog.entityName && (
                        <span className="px-2 py-0.5 rounded text-xs font-mono font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                          {selectedLog.entityName}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-gray-900 mt-1">
                      {selectedLog.entityName ? `${selectedLog.action} on ${selectedLog.entityName}` : selectedLog.action}
                    </p>
                  </div>
                </div>

                {/* Copy JSON Button */}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleCopyLogData}
                  className="text-xs py-1.5 px-3 self-start sm:self-auto flex items-center gap-1.5"
                >
                  {copied ? (
                    <>
                      <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                      <span className="text-emerald-400 font-medium">{t('activity_logs.copied', 'Copied!')}</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.75v-6.75" />
                      </svg>
                      <span>{t('activity_logs.copy_json', 'Copy JSON')}</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Metadata 4-Column Grid Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* User Card */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-warm-brown/10 border border-warm-brown/20 flex items-center justify-center text-warm-brown flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 block">
                    {t('activity_logs.table.user', 'Operator')}
                  </span>
                  <p className="text-xs font-bold text-gray-900 truncate mt-0.5">
                    {selectedLog.username || selectedLog.user?.username || (selectedLog.userId ? `User #${selectedLog.userId}` : 'System')}
                  </p>
                  {selectedLog.user?.email && (
                    <p className="text-[11px] text-gray-500 truncate">{selectedLog.user.email}</p>
                  )}
                </div>
              </div>

              {/* Target Entity Card */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600 flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 block">
                    {t('activity_logs.table.entity', 'Target Entity')}
                  </span>
                  <p className="text-xs font-mono font-bold text-sky-700 truncate mt-0.5">
                    {selectedLog.entityName || selectedLog.entity_name || 'System Event'}
                  </p>
                  {(selectedLog.entityId || selectedLog.entity_id) && (
                    <p className="text-[11px] font-mono text-gray-500 truncate">
                      ID: {selectedLog.entityId || selectedLog.entity_id}
                    </p>
                  )}
                </div>
              </div>

              {/* IP & Security Card */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m-17.432-6.5C3.099 8.467 3 9.222 3 12c0 1.268.26 2.474.73 3.568" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 block">
                    {t('activity_logs.table.ip', 'IP Address')}
                  </span>
                  <p className="text-xs font-mono font-semibold text-gray-800 truncate mt-0.5">
                    {selectedLog.ipAddress || selectedLog.ip_address || '—'}
                  </p>
                </div>
              </div>

              {/* Timestamp Card */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 block">
                    {t('activity_logs.table.date', 'Timestamp')}
                  </span>
                  <p className="text-xs font-mono font-semibold text-gray-800 truncate mt-0.5">
                    {selectedLog.createdAt ? new Date(selectedLog.createdAt).toLocaleTimeString() : '—'}
                  </p>
                  <p className="text-[11px] text-gray-500 truncate">
                    {selectedLog.createdAt ? new Date(selectedLog.createdAt).toLocaleDateString() : ''}
                  </p>
                </div>
              </div>
            </div>

            {/* Audit Note / Details Callout */}
            {selectedLog.details && (
              <div className="bg-amber-50 border-l-4 border-l-warm-brown border border-amber-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-warm-brown flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                  </svg>
                  <div>
                    <span className="text-xs font-bold text-warm-brown uppercase tracking-wider block mb-1">
                      {t('activity_logs.modal.details', 'Audit Log Description')}
                    </span>
                    <p className="text-xs text-gray-700 leading-relaxed font-sans">
                      {selectedLog.details}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Data Changes Inspector Section */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 pb-3">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-warm-brown" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                  </svg>
                  <h3 className="text-sm font-bold text-gray-900">
                    {t('activity_logs.modal.state_comparison', 'Data Changes Inspector')}
                  </h3>
                </div>

                {/* View Mode Toggle Buttons */}
                <div className="bg-gray-100 border border-gray-200 p-1 rounded-xl flex items-center gap-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setViewMode('simple')}
                    className={`px-3 py-1 rounded-lg font-medium transition-all ${
                      viewMode === 'simple'
                        ? 'bg-warm-brown text-white shadow-sm'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    {t('activity_logs.modal.view_simple', 'Visual Summary')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('side-by-side')}
                    className={`px-3 py-1 rounded-lg font-medium transition-all ${
                      viewMode === 'side-by-side'
                        ? 'bg-warm-brown text-white shadow-sm'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    {t('activity_logs.modal.view_side_by_side', 'Side-by-Side')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('raw')}
                    className={`px-3 py-1 rounded-lg font-medium transition-all ${
                      viewMode === 'raw'
                        ? 'bg-warm-brown text-white shadow-sm'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    {t('activity_logs.modal.view_raw', 'Raw JSON')}
                  </button>
                </div>
              </div>

              {/* View 1: Visual Summary Card List */}
              {viewMode === 'simple' && (
                <div className="space-y-4">
                  {diffs.length === 0 ? (
                    <div className="p-8 text-center bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-400 italic">
                      {t('activity_logs.modal.no_changes_recorded', 'No specific data field changes recorded for this activity.')}
                    </div>
                  ) : (
                    <>
                      {/* Filter Search & Unchanged Toggle Bar */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200">
                        <div className="relative flex-1 max-w-xs">
                          <input
                            type="text"
                            placeholder={t('activity_logs.diff.search_fields', 'Search changed fields...')}
                            value={diffSearchKeyword}
                            onChange={(e) => setDiffSearchKeyword(e.target.value)}
                            className="w-full bg-white border border-gray-200 rounded-lg text-xs text-gray-900 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-warm-brown/30"
                          />
                        </div>

                        <div className="flex items-center gap-4 text-xs">
                          <span className="text-gray-500 font-medium">
                            {t('activity_logs.modal.changed_fields_count', { count: diffs.filter((d) => d.type !== 'UNCHANGED').length })}
                          </span>

                          {diffs.some((d) => d.type === 'UNCHANGED') && (
                            <label className="flex items-center gap-2 text-gray-500 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={showUnchanged}
                                onChange={(e) => setShowUnchanged(e.target.checked)}
                                className="rounded border-gray-300 text-warm-brown focus:ring-warm-brown/30"
                              />
                              {t('activity_logs.modal.show_unchanged', 'Show unchanged fields')}
                            </label>
                          )}
                        </div>
                      </div>

                      {/* Changed Field Cards Grid */}
                      <div className="space-y-2.5 max-h-[380px] overflow-y-auto scrollbar-thin pr-1">
                        {visibleDiffs.map((diff) => {
                          return (
                            <div
                              key={diff.key}
                              className="bg-white border border-gray-200 hover:border-gray-300 rounded-xl p-4 transition-all"
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                {/* Left: Field Title */}
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h4 className="text-xs font-bold text-gray-900 tracking-wide">{diff.label}</h4>
                                    {diff.type === 'CHANGED' && (
                                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                                        Modified
                                      </span>
                                    )}
                                    {diff.type === 'ADDED' && (
                                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                                        Added
                                      </span>
                                    )}
                                    {diff.type === 'REMOVED' && (
                                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-600 border border-red-200">
                                        Removed
                                      </span>
                                    )}
                                    {diff.type === 'UNCHANGED' && (
                                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-500">
                                        Unchanged
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[10px] font-mono text-gray-400">{diff.key}</span>
                                </div>

                                {/* Right: Value Change Visualization */}
                                <div className="flex items-center gap-2 text-xs flex-wrap">
                                  {/* Old Value */}
                                  {diff.type !== 'ADDED' && (
                                    <div className="bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-lg text-rose-300 font-mono flex items-center gap-2 max-w-full overflow-x-auto">
                                      <span className="text-[10px] text-rose-400/70 uppercase font-semibold">Previous:</span>
                                      <span className={diff.type === 'CHANGED' ? 'line-through opacity-80' : ''}>{diff.oldFormatted}</span>
                                    </div>
                                  )}

                                  {/* Arrow Icon */}
                                  {diff.type === 'CHANGED' && (
                                    <svg className="w-4 h-4 text-slate-500 flex-shrink-0 rtl:rotate-180" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                                    </svg>
                                  )}

                                  {/* New Value */}
                                  {diff.type !== 'REMOVED' && (
                                    <div className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg text-emerald-300 font-mono font-semibold flex items-center gap-2 max-w-full overflow-x-auto">
                                      <span className="text-[10px] text-emerald-400/70 uppercase font-semibold">New:</span>
                                      <span>{diff.newFormatted}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* View 2: Side-by-Side Code View */}
              {viewMode === 'side-by-side' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Old Values */}
                  <div className="flex flex-col rounded-xl border border-rose-500/20 bg-slate-950/90 overflow-hidden shadow-sm">
                    <div className="px-4 py-2.5 bg-rose-500/10 border-b border-rose-500/20 flex items-center justify-between">
                      <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-400" />
                        {t('activity_logs.modal.old_values', 'Old Values (Before)')}
                      </span>
                      <span className="text-[10px] uppercase font-mono text-rose-400/70">PREVIOUS STATE</span>
                    </div>
                    <div className="p-3.5 flex-1 overflow-x-auto scrollbar-thin max-h-72">
                      <pre className="text-xs font-mono text-rose-200/90 whitespace-pre-wrap leading-relaxed">
                        <code>{JSON.stringify(selectedLog.oldValues ?? selectedLog.old_values ?? {}, null, 2)}</code>
                      </pre>
                    </div>
                  </div>

                  {/* New Values */}
                  <div className="flex flex-col rounded-xl border border-emerald-500/20 bg-slate-950/90 overflow-hidden shadow-sm">
                    <div className="px-4 py-2.5 bg-emerald-500/10 border-b border-emerald-500/20 flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        {t('activity_logs.modal.new_values', 'New Values (After)')}
                      </span>
                      <span className="text-[10px] uppercase font-mono text-emerald-400/70">UPDATED STATE</span>
                    </div>
                    <div className="p-3.5 flex-1 overflow-x-auto scrollbar-thin max-h-72">
                      <pre className="text-xs font-mono text-emerald-200/90 whitespace-pre-wrap leading-relaxed">
                        <code>{JSON.stringify(selectedLog.newValues ?? selectedLog.new_values ?? {}, null, 2)}</code>
                      </pre>
                    </div>
                  </div>
                </div>
              )}

              {/* View 3: Raw Full Object JSON */}
              {viewMode === 'raw' && (
                <div className="rounded-xl border border-gray-200 bg-gray-50 overflow-hidden">
                  <div className="px-4 py-2 bg-gray-100 border-b border-gray-200 flex items-center justify-between text-xs text-gray-500 font-mono">
                    <span>Full ActivityLogResponse Object</span>
                    <span>JSON</span>
                  </div>
                  <div className="p-4 overflow-x-auto scrollbar-thin max-h-80">
                    <pre className="text-xs font-mono text-sky-700 whitespace-pre-wrap leading-relaxed">
                      <code>{JSON.stringify(selectedLog, null, 2)}</code>
                    </pre>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end pt-3 border-t border-gray-200">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setIsModalOpen(false)
                  setSelectedLog(null)
                }}
              >
                {t('common.close', 'Close')}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
