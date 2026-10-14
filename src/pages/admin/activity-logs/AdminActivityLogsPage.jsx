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
 * Helper to unnest single-wrapper objects like { "request": { ... } } or { "result": { ... } }
 */
function unwrapObject(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj
  const keys = Object.keys(obj)
  if (
    keys.length === 1 &&
    ['request', 'result', 'body', 'data', 'dto'].includes(keys[0].toLowerCase()) &&
    typeof obj[keys[0]] === 'object' &&
    obj[keys[0]] !== null &&
    !Array.isArray(obj[keys[0]])
  ) {
    return unwrapObject(obj[keys[0]])
  }
  return obj
}

/**
 * Friendly User-Agent parser (OS & Browser in plain human words)
 */
function humanizeUserAgent(ua, lang) {
  if (!ua) return lang === 'ar' ? 'غير متوفر' : 'Not available'
  let os = 'Unknown OS'
  let browser = 'Unknown Browser'

  if (/Windows NT 10.0|Windows NT 11.0/i.test(ua)) os = 'Windows 10/11'
  else if (/Windows NT 6.3/i.test(ua)) os = 'Windows 8.1'
  else if (/Windows/i.test(ua)) os = 'Windows'
  else if (/iPhone/i.test(ua)) os = 'iPhone (iOS)'
  else if (/iPad/i.test(ua)) os = 'iPad (iPadOS)'
  else if (/Mac OS X/i.test(ua)) os = 'macOS (Mac)'
  else if (/Android/i.test(ua)) os = 'Android Mobile'
  else if (/Linux/i.test(ua)) os = 'Linux'

  if (/Edg\//i.test(ua)) browser = 'Microsoft Edge'
  else if (/Chrome\//i.test(ua)) browser = 'Google Chrome'
  else if (/Safari\//i.test(ua) && !/Chrome/i.test(ua)) browser = 'Apple Safari'
  else if (/Firefox\//i.test(ua)) browser = 'Mozilla Firefox'
  else if (/Opera|OPR\//i.test(ua)) browser = 'Opera'

  return `${browser} • ${os}`
}

/**
 * Friendly relative time formatting
 */
function formatFriendlyRelativeTime(dateString, lang) {
  if (!dateString) return '—'
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  const isAr = lang === 'ar'
  if (diffSec < 60) return isAr ? 'منذ لحظات' : 'Just now'
  if (diffMin < 60) return isAr ? `منذ ${diffMin} دقيقة` : `${diffMin}m ago`
  if (diffHour < 24) return isAr ? `منذ ${diffHour} ساعة` : `${diffHour}h ago`
  if (diffDay === 1) return isAr ? 'أمس' : 'Yesterday'
  if (diffDay < 7) return isAr ? `منذ ${diffDay} أيام` : `${diffDay}d ago`
  return date.toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/**
 * Friendly Entity dictionary
 */
const ENTITY_DICTIONARY = {
  Project: { en: 'Project', ar: 'مشروع' },
  ProjectItem: { en: 'Project Item', ar: 'بند بالمشروع' },
  DailyUpdate: { en: 'Daily Site Update', ar: 'تقرير موقع يومي' },
  FinancialRecord: { en: 'Financial Transaction', ar: 'معاملة مالية' },
  InternalTicket: { en: 'Internal Request', ar: 'طلب داخلي' },
  Ticket: { en: 'Internal Request', ar: 'طلب داخلي' },
  StandardItem: { en: 'Standard Item', ar: 'بند تشطيب قياسي' },
  User: { en: 'User Account', ar: 'حساب مستخدم' },
  Admin: { en: 'System Administrator', ar: 'مدير النظام' },
  Engineer: { en: 'Site Engineer', ar: 'مهندس الموقع' },
  Client: { en: 'Client Account', ar: 'حساب عميل' },
  Comment: { en: 'Discussion Comment', ar: 'تعليق ومحادثة' },
  Attachment: { en: 'File Attachment', ar: 'ملف مرفق' },
  Authentication: { en: 'Security / Login', ar: 'جلسة تسجيل الدخول' },
}

/**
 * Friendly Action dictionary
 */
const ACTION_DICTIONARY = {
  CREATE: { en: 'Created New', ar: 'إنشاء جديد' },
  UPDATE: { en: 'Updated', ar: 'تعديل وتحديث' },
  DELETE: { en: 'Deactivated / Deleted', ar: 'تعطيل / حذف' },
  LOGIN_SUCCESS: { en: 'Successful Login', ar: 'تسجيل دخول ناجح' },
  LOGIN_FAILED: { en: 'Failed Login', ar: 'فشل تسجيل الدخول' },
  LOGOUT: { en: 'Logged Out', ar: 'تسجيل خروج' },
  UPLOAD: { en: 'Uploaded File', ar: 'رفع ملف' },
  DOWNLOAD: { en: 'Downloaded File', ar: 'تحميل ملف' },
}

/**
 * Friendly Field Names Dictionary
 */
const FIELD_DICTIONARY = {
  projectName: { en: 'Project Name', ar: 'اسم المشروع' },
  titleAr: { en: 'Arabic Title', ar: 'العنوان بالعربية' },
  titleEn: { en: 'English Title', ar: 'العنوان بالإنجليزية' },
  nameAr: { en: 'Arabic Name', ar: 'الاسم بالعربية' },
  nameEn: { en: 'English Name', ar: 'الاسم بالإنجليزية' },
  fullNameAr: { en: 'Full Name (Arabic)', ar: 'الاسم الكامل (عربي)' },
  fullNameEn: { en: 'Full Name (English)', ar: 'الاسم الكامل (إنجليزي)' },
  username: { en: 'Username', ar: 'اسم المستخدم' },
  email: { en: 'Email Address', ar: 'البريد الإلكتروني' },
  phoneNumber: { en: 'Phone Number', ar: 'رقم الهاتف' },
  role: { en: 'User Role', ar: 'الدور / الصلاحية' },
  roleName: { en: 'Role Name', ar: 'اسم الصلاحية' },
  roleId: { en: 'Assigned Role', ar: 'الدور المسند' },
  estimatedBudget: { en: 'Estimated Budget', ar: 'الميزانية التقديرية', isCurrency: true },
  actualCost: { en: 'Actual Cost', ar: 'التكلفة الفعلية', isCurrency: true },
  amount: { en: 'Amount', ar: 'المبلغ', isCurrency: true },
  totalCost: { en: 'Total Cost', ar: 'إجمالي التكلفة', isCurrency: true },
  unitPrice: { en: 'Unit Price', ar: 'سعر الوحدة', isCurrency: true },
  quantity: { en: 'Quantity', ar: 'الكمية' },
  unit: { en: 'Measurement Unit', ar: 'وحدة القياس' },
  overallStatus: { en: 'Project Status', ar: 'حالة المشروع', isStatus: true },
  status: { en: 'Status', ar: 'الحالة', isStatus: true },
  recordType: { en: 'Transaction Type', ar: 'نوع المعاملة' },
  paymentMethod: { en: 'Payment Method', ar: 'طريقة الدفع' },
  description: { en: 'Description / Remarks', ar: 'الوصف والملاحظات' },
  notes: { en: 'Site Notes', ar: 'ملاحظات الموقع' },
  address: { en: 'Location / Address', ar: 'العنوان والموقع' },
  clientName: { en: 'Client Name', ar: 'اسم العميل' },
  engineerName: { en: 'Engineer Name', ar: 'اسم المهندس' },
  clientId: { en: 'Client ID / Account', ar: 'العميل المسند' },
  engineerId: { en: 'Engineer ID / Account', ar: 'المهندس المشرف' },
  startDate: { en: 'Start Date', ar: 'تاريخ البدء', isDate: true },
  deliveryDate: { en: 'Delivery Date', ar: 'تاريخ التسليم', isDate: true },
  expectedEndDate: { en: 'Expected End Date', ar: 'تاريخ الانتهاء المتوقع', isDate: true },
  progressPercentage: { en: 'Completion Progress', ar: 'نسبة الإنجاز', isPercent: true },
  enabled: { en: 'Account Status', ar: 'حالة الحساب', isBoolean: true },
  active: { en: 'Active Status', ar: 'حالة التفعيل', isBoolean: true },
  isVerified: { en: 'Email Verified', ar: 'تأكيد البريد', isBoolean: true },
  images: { en: 'Attached Photos', ar: 'الصور المرفقة', isList: true },
  imageUrls: { en: 'Attached Photos', ar: 'الصور المرفقة', isList: true },
  attachments: { en: 'Attached Files', ar: 'الملفات المرفقة', isList: true },
  items: { en: 'Project Items List', ar: 'قائمة بنود المشروع', isList: true },
  itemIds: { en: 'Assigned Items', ar: 'البنود المسندة', isList: true },
  priority: { en: 'Priority Level', ar: 'مستوى الأهمية' },
  subject: { en: 'Subject', ar: 'الموضوع' },
  type: { en: 'Request Type', ar: 'نوع الطلب' },
  evaluationStatus: { en: 'Evaluation Decision', ar: 'قرار الاعتماد', isStatus: true },
  evaluationNotes: { en: 'Review Remarks', ar: 'ملاحظات المراجعة' },
  decision: { en: 'Decision', ar: 'القرار' },
}

/**
 * Translates and formats field label into human words
 */
function getBusinessFieldLabel(key, lang) {
  if (!key) return ''
  if (FIELD_DICTIONARY[key]) {
    return lang === 'ar' ? FIELD_DICTIONARY[key].ar : FIELD_DICTIONARY[key].en
  }
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase())
    .trim()
}

/**
 * Status value mapping dictionary for friendly badges
 */
const STATUS_VALUE_MAP = {
  DELIVERED: { en: 'Delivered', ar: 'تم التسليم', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  COMPLETED: { en: 'Completed', ar: 'مكتمل', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  APPROVED: { en: 'Approved', ar: 'معتمد', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  SUCCESS: { en: 'Successful', ar: 'ناجح', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  IN_PROGRESS: { en: 'In Progress', ar: 'قيد التنفيذ', color: 'bg-sky-50 text-sky-700 border-sky-200' },
  PENDING: { en: 'Pending', ar: 'معلق', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  PENDING_REVIEW: { en: 'Pending Review', ar: 'بانتظار المراجعة', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  REJECTED: { en: 'Rejected', ar: 'مرفوض', color: 'bg-red-50 text-red-700 border-red-200' },
  FAILED: { en: 'Failed', ar: 'فشلت', color: 'bg-red-50 text-red-700 border-red-200' },
  CANCELLED: { en: 'Cancelled', ar: 'ملغي', color: 'bg-gray-100 text-gray-700 border-gray-200' },
  EXPENSE: { en: 'Expense (Outflow)', ar: 'مصروفات', color: 'bg-rose-50 text-rose-700 border-rose-200' },
  REVENUE: { en: 'Revenue (Inflow)', ar: 'إيرادات', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  ADMIN: { en: 'Administrator', ar: 'مدير نظام', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  ENGINEER: { en: 'Site Engineer', ar: 'مهندس موقع', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  CLIENT: { en: 'Client', ar: 'عميل', color: 'bg-sky-50 text-sky-700 border-sky-200' },
}

/**
 * Format any field value in human-friendly display
 */
function renderBusinessValue(key, val, lang) {
  const isAr = lang === 'ar'
  if (val === null || val === undefined || val === '') {
    return <span className="text-gray-400 italic font-normal text-xs">{isAr ? 'غير محدد' : 'Not specified'}</span>
  }

  const meta = FIELD_DICTIONARY[key] || {}

  // Currency
  if (meta.isCurrency || typeof val === 'number' && ['amount', 'budget', 'price', 'cost'].some((k) => key.toLowerCase().includes(k))) {
    const num = Number(val)
    if (!isNaN(num)) {
      return (
        <span className="font-semibold text-gray-900 tracking-wide text-xs">
          {num.toLocaleString(isAr ? 'ar-EG' : 'en-US')} {isAr ? 'ج.م' : 'EGP'}
        </span>
      )
    }
  }

  // Percent
  if (meta.isPercent || (typeof val === 'number' && key.toLowerCase().includes('percent'))) {
    return <span className="font-semibold text-warm-brown text-xs">{val}%</span>
  }

  // Boolean
  if (typeof val === 'boolean' || meta.isBoolean) {
    const isTrue = Boolean(val)
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${
          isTrue
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : 'bg-red-50 text-red-700 border-red-200'
        }`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${isTrue ? 'bg-emerald-500' : 'bg-red-500'}`} />
        {isTrue ? (isAr ? 'نشط ومفعل' : 'Active (Enabled)') : (isAr ? 'معطل / غير نشط' : 'Disabled')}
      </span>
    )
  }

  // Status Enum
  if (typeof val === 'string' && STATUS_VALUE_MAP[val.toUpperCase()]) {
    const mapped = STATUS_VALUE_MAP[val.toUpperCase()]
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${mapped.color}`}
      >
        {isAr ? mapped.ar : mapped.en}
      </span>
    )
  }

  // Date
  if (meta.isDate || (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}/.test(val))) {
    const d = new Date(val)
    if (!isNaN(d.getTime())) {
      return (
        <span className="text-gray-800 text-xs font-medium">
          {d.toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </span>
      )
    }
  }

  // Array / List
  if (Array.isArray(val)) {
    if (val.length === 0) {
      return <span className="text-gray-400 italic text-xs">{isAr ? 'قائمة فارغة' : 'Empty list'}</span>
    }
    // List of Image URLs
    const isImages = val.every((item) => typeof item === 'string' && (item.includes('http') || item.includes('cloudinary')))
    if (isImages) {
      return (
        <div className="flex items-center gap-2 flex-wrap mt-1">
          {val.slice(0, 4).map((url, idx) => (
            <a
              key={idx}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-lg border border-gray-200 overflow-hidden bg-gray-100 hover:opacity-80 transition-opacity block flex-shrink-0"
            >
              <img src={url} alt="Attachment" className="w-full h-full object-cover" />
            </a>
          ))}
          {val.length > 4 && (
            <span className="text-xs text-gray-500 font-medium">+{val.length - 4} {isAr ? 'صور أخرى' : 'more'}</span>
          )}
        </div>
      )
    }

    return (
      <div className="flex flex-wrap gap-1.5 mt-0.5">
        {val.map((item, idx) => (
          <span
            key={idx}
            className="px-2 py-0.5 rounded-md bg-gray-100 border border-gray-200 text-xs text-gray-700"
          >
            {typeof item === 'object' ? JSON.stringify(item) : String(item)}
          </span>
        ))}
      </div>
    )
  }

  // Nested Object
  if (typeof val === 'object') {
    const keys = Object.keys(val)
    if (keys.length === 0) return <span className="text-gray-400 italic text-xs">—</span>
    return (
      <div className="space-y-1 bg-gray-50 border border-gray-200 rounded-lg p-2.5 mt-1 text-xs">
        {keys.map((k) => (
          <div key={k} className="flex items-center justify-between gap-2 border-b border-gray-100 last:border-0 pb-1 last:pb-0">
            <span className="text-gray-500 font-medium">{getBusinessFieldLabel(k, lang)}:</span>
            <span className="text-gray-900 font-medium">{renderBusinessValue(k, val[k], lang)}</span>
          </div>
        ))}
      </div>
    )
  }

  return <span className="text-gray-800 text-xs font-medium">{String(val)}</span>
}

/**
 * Extracts key details and crafts a natural-language headline and summary for the activity
 */
function generateActivityStory(log, lang) {
  const isAr = lang === 'ar'
  if (!log) return { headline: '', subDescription: '', iconType: 'system', categoryLabel: '' }

  const action = (log.action || '').toUpperCase()
  const entity = (log.entityName || log.entity_name || '').trim()
  const status = (log.status || '').toUpperCase()
  const details = log.details || ''

  // Operator Name
  const user = log.user || {}
  const rawUsername = log.username || user.username || (log.userId ? `User #${log.userId}` : isAr ? 'النظام' : 'System')
  const fullName = isAr && user.fullNameAr ? user.fullNameAr : user.fullNameEn || rawUsername

  // Unwrapped payloads
  const oldParsed = typeof log.oldValues === 'string' ? safeJsonParse(log.oldValues) : (log.oldValues || log.old_values)
  const newParsed = typeof log.newValues === 'string' ? safeJsonParse(log.newValues) : (log.newValues || log.new_values)
  const data = unwrapObject(newParsed) || unwrapObject(oldParsed) || {}

  // Target item names or amounts if present
  const targetTitle = data.titleAr && isAr ? data.titleAr : data.titleEn || data.title || data.projectName || data.nameAr || data.nameEn || data.name || data.subject || ''
  const targetAmount = data.amount || data.estimatedBudget || data.totalCost

  // 1. Authentication Events
  if (action === 'LOGIN_SUCCESS') {
    return {
      headline: isAr
        ? `تسجيل دخول ناجح للمستخدم (${fullName})`
        : `User (${fullName}) successfully logged into the system`,
      subDescription: isAr
        ? `تمت المصادقة وبدء جلسة آمنة بنجاح`
        : `Session authenticated securely`,
      iconType: 'auth',
      categoryLabel: isAr ? 'جلسة النظام' : 'System Security',
    }
  }

  if (action === 'LOGIN_FAILED') {
    return {
      headline: isAr
        ? `فشلت محاولة تسجيل الدخول للمستخدم (${fullName})`
        : `Failed login attempt for user (${fullName})`,
      subDescription: details || (isAr ? 'بيانات الاعتماد غير صحيحة أو الحساب معطل' : 'Invalid credentials or inactive account'),
      iconType: 'auth_failed',
      categoryLabel: isAr ? 'تنبيه أمان' : 'Security Alert',
    }
  }

  if (action === 'LOGOUT') {
    return {
      headline: isAr
        ? `قام المستخدم (${fullName}) بتسجيل الخروج`
        : `User (${fullName}) logged out of the system`,
      subDescription: isAr ? 'تم إنهاء الجلسة بأمان' : 'Session ended safely',
      iconType: 'auth',
      categoryLabel: isAr ? 'جلسة النظام' : 'System Security',
    }
  }

  // 2. Project Events
  if (entity.toLowerCase().includes('project') && !entity.toLowerCase().includes('item')) {
    if (action.includes('CREATE')) {
      return {
        headline: isAr
          ? `تم إنشاء مشروع جديد${targetTitle ? ` "${targetTitle}"` : ''} بواسطة (${fullName})`
          : `New project${targetTitle ? ` "${targetTitle}"` : ''} was created by (${fullName})`,
        subDescription: isAr
          ? `تم تسجيل بيانات المشروع وإسناد فريق العمل والميزانية`
          : `Project created with assigned team and budget`,
        iconType: 'project',
        categoryLabel: isAr ? 'إدارة المشاريع' : 'Project Management',
      }
    }
    if (action.includes('UPDATE')) {
      return {
        headline: isAr
          ? `قام (${fullName}) بتعديل بيانات المشروع${targetTitle ? ` "${targetTitle}"` : ''}`
          : `(${fullName}) updated project details${targetTitle ? ` for "${targetTitle}"` : ''}`,
        subDescription: details || (isAr ? 'تم حفظ التعديلات الجديدة على المشروع' : 'Project updates saved'),
        iconType: 'project',
        categoryLabel: isAr ? 'إدارة المشاريع' : 'Project Management',
      }
    }
    if (action.includes('DELETE')) {
      return {
        headline: isAr
          ? `قام (${fullName}) بأرشفة أو حذف المشروع`
          : `(${fullName}) archived/deleted project`,
        subDescription: isAr ? 'تمت إزالة المشروع من القائمة النشطة' : 'Removed from active projects',
        iconType: 'delete',
        categoryLabel: isAr ? 'إدارة المشاريع' : 'Project Management',
      }
    }
  }

  // 3. Project Items
  if (entity.toLowerCase().includes('projectitem')) {
    if (action.includes('CREATE')) {
      return {
        headline: isAr
          ? `قام (${fullName}) بإسناد بنود تشطيب جديدة للمشروع`
          : `(${fullName}) assigned new finishing items to project`,
        subDescription: isAr ? 'تمت إضافة البنود القياسية إلى جدول المشروع' : 'Standard items added to project schedule',
        iconType: 'item',
        categoryLabel: isAr ? 'بنود التشطيب' : 'Project Items',
      }
    }
    if (action.includes('UPDATE')) {
      return {
        headline: isAr
          ? `قام (${fullName}) بتحديث مواصفات أو حالة بند التشطيب`
          : `(${fullName}) updated project item specifications or status`,
        subDescription: details || (isAr ? 'تم تعديل كميات أو أسعار أو حالة البند' : 'Item quantities/pricing/status modified'),
        iconType: 'item',
        categoryLabel: isAr ? 'بنود التشطيب' : 'Project Items',
      }
    }
  }

  // 4. Daily Site Updates
  if (entity.toLowerCase().includes('dailyupdate')) {
    if (action.includes('CREATE')) {
      return {
        headline: isAr
          ? `قام المهندس (${fullName}) برفع تقرير موقع يومي جديد`
          : `Engineer (${fullName}) submitted a new daily site progress update`,
        subDescription: isAr ? 'يتضمن التقرير ملاحظات الموقع والصور المرفقة' : 'Includes site notes and progress photos',
        iconType: 'daily_update',
        categoryLabel: isAr ? 'متابعة الموقع اليومية' : 'Daily Site Updates',
      }
    }
    if (action.includes('UPDATE')) {
      const isApproved = details.toLowerCase().includes('approve') || (data.status === 'APPROVED')
      const isRejected = details.toLowerCase().includes('reject') || (data.status === 'REJECTED')
      if (isApproved) {
        return {
          headline: isAr
            ? `قام (${fullName}) باعتماد تقرير الموقع اليومي`
            : `(${fullName}) approved the daily site progress report`,
          subDescription: isAr ? 'تمت الموافقة على التقرير ونشره للعميل' : 'Report approved and published for client',
          iconType: 'daily_update',
          categoryLabel: isAr ? 'متابعة الموقع اليومية' : 'Daily Site Updates',
        }
      }
      if (isRejected) {
        return {
          headline: isAr
            ? `قام (${fullName}) برفض تقرير الموقع اليومي وإعادته للتعديل`
            : `(${fullName}) rejected the daily site report for revision`,
          subDescription: isAr ? 'تم تسجيل ملاحظات الرفض للمهندس' : 'Rejection feedback sent to engineer',
          iconType: 'daily_update',
          categoryLabel: isAr ? 'متابعة الموقع اليومية' : 'Daily Site Updates',
        }
      }
      return {
        headline: isAr
          ? `قام (${fullName}) بتحديث ومراجعة تقرير الموقع اليومي`
          : `(${fullName}) reviewed/modified daily site report`,
        subDescription: details || (isAr ? 'تم تعديل تقرير الموقع' : 'Daily report updated'),
        iconType: 'daily_update',
        categoryLabel: isAr ? 'متابعة الموقع اليومية' : 'Daily Site Updates',
      }
    }
  }

  // 5. Financial Records
  if (entity.toLowerCase().includes('financial')) {
    const formattedAmt = targetAmount ? Number(targetAmount).toLocaleString(isAr ? 'ar-EG' : 'en-US') : ''
    if (action.includes('CREATE')) {
      return {
        headline: isAr
          ? `قام (${fullName}) بتسجيل معاملة مالية جديدة${formattedAmt ? ` بقيمة ${formattedAmt} ج.م` : ''}`
          : `(${fullName}) recorded a new financial entry${formattedAmt ? ` of ${formattedAmt} EGP` : ''}`,
        subDescription: isAr ? 'تم توثيق المعاملة في الحسابات المالية' : 'Transaction documented in financial logs',
        iconType: 'financial',
        categoryLabel: isAr ? 'الإدارة المالية' : 'Financials',
      }
    }
    if (action.includes('UPDATE')) {
      return {
        headline: isAr
          ? `قام (${fullName}) بتعديل السجل المالي`
          : `(${fullName}) updated financial record details`,
        subDescription: details || (isAr ? 'تم حفظ التعديلات على المعاملة المالية' : 'Financial record updated'),
        iconType: 'financial',
        categoryLabel: isAr ? 'الإدارة المالية' : 'Financials',
      }
    }
  }

  // 6. Internal Tickets / Requests
  if (entity.toLowerCase().includes('ticket')) {
    if (action.includes('CREATE')) {
      return {
        headline: isAr
          ? `قام (${fullName}) بإرسال طلب / تذكرة داخلية جديدة${targetTitle ? ` "${targetTitle}"` : ''}`
          : `(${fullName}) submitted an internal request${targetTitle ? ` "${targetTitle}"` : ''}`,
        subDescription: isAr ? 'تم إرسال الطلب لمتابعة الإدارة والمهندسين' : 'Request sent for admin/engineer review',
        iconType: 'ticket',
        categoryLabel: isAr ? 'الطلبات الداخلية' : 'Internal Requests',
      }
    }
    if (action.includes('UPDATE')) {
      return {
        headline: isAr
          ? `قام (${fullName}) بتحديث حالة الطلب الداخلي${targetTitle ? ` "${targetTitle}"` : ''}`
          : `(${fullName}) updated internal request${targetTitle ? ` "${targetTitle}"` : ''}`,
        subDescription: details || (isAr ? 'تم اعتماد أو تعديل حالة الطلب' : 'Request status updated'),
        iconType: 'ticket',
        categoryLabel: isAr ? 'الطلبات الداخلية' : 'Internal Requests',
      }
    }
  }

  // 7. Users / Admins / Engineers / Clients
  if (['user', 'admin', 'engineer', 'client'].some((k) => entity.toLowerCase().includes(k))) {
    const roleName = ENTITY_DICTIONARY[entity] ? (isAr ? ENTITY_DICTIONARY[entity].ar : ENTITY_DICTIONARY[entity].en) : entity
    if (action.includes('CREATE')) {
      return {
        headline: isAr
          ? `قام (${fullName}) بإنشاء حساب مستخدم جديد (${roleName})${targetTitle ? ` "${targetTitle}"` : ''}`
          : `(${fullName}) registered a new ${roleName} account${targetTitle ? ` "${targetTitle}"` : ''}`,
        subDescription: isAr ? 'تم تفعيل الحساب وإرسال بيانات الدخول' : 'User account initialized',
        iconType: 'user',
        categoryLabel: isAr ? 'إدارة المستخدمين' : 'User Management',
      }
    }
    if (action.includes('UPDATE')) {
      return {
        headline: isAr
          ? `قام (${fullName}) بتحديث بيانات الحساب${targetTitle ? ` "${targetTitle}"` : ''}`
          : `(${fullName}) updated profile details${targetTitle ? ` for "${targetTitle}"` : ''}`,
        subDescription: details || (isAr ? 'تم حفظ التعديلات على حساب المستخدم' : 'Profile updated'),
        iconType: 'user',
        categoryLabel: isAr ? 'إدارة المستخدمين' : 'User Management',
      }
    }
    if (action.includes('DELETE')) {
      return {
        headline: isAr
          ? `قام (${fullName}) بتعطيل حساب المستخدم`
          : `(${fullName}) deactivated user account`,
        subDescription: isAr ? 'تم إيقاف صلاحيات دخول المستخدم' : 'User account login disabled',
        iconType: 'delete',
        categoryLabel: isAr ? 'إدارة المستخدمين' : 'User Management',
      }
    }
  }

  // 8. Standard Library Items
  if (entity.toLowerCase().includes('standarditem')) {
    if (action.includes('CREATE')) {
      return {
        headline: isAr
          ? `قام (${fullName}) بإضافة بند تشطيب قياسي جديد${targetTitle ? ` "${targetTitle}"` : ''}`
          : `(${fullName}) added new standard finishing item${targetTitle ? ` "${targetTitle}"` : ''}`,
        subDescription: isAr ? 'تمت إضافة البند إلى مكتبة التشطيبات القياسية' : 'Added to standard catalog',
        iconType: 'item',
        categoryLabel: isAr ? 'مكتبة بنود التشطيب' : 'Standard Catalog',
      }
    }
  }

  // Fallback Generic Story
  const friendlyAction = ACTION_DICTIONARY[action] ? (isAr ? ACTION_DICTIONARY[action].ar : ACTION_DICTIONARY[action].en) : action
  const friendlyEntity = ENTITY_DICTIONARY[entity] ? (isAr ? ENTITY_DICTIONARY[entity].ar : ENTITY_DICTIONARY[entity].en) : entity || (isAr ? 'عنصر بالنظام' : 'System Element')

  return {
    headline: isAr
      ? `قام (${fullName}) بـ ${friendlyAction} على (${friendlyEntity})`
      : `(${fullName}) performed ${friendlyAction} on (${friendlyEntity})`,
    subDescription: details || (status === 'SUCCESS' ? (isAr ? 'تمت العملية بنجاح' : 'Operation completed successfully') : (isAr ? 'فشلت العملية' : 'Operation failed')),
    iconType: 'system',
    categoryLabel: friendlyEntity,
  }
}

/**
 * Computes business-friendly diffs between old and new state
 */
function computeBusinessDiff(oldDataRaw, newDataRaw, lang) {
  const oldParsed = typeof oldDataRaw === 'string' ? safeJsonParse(oldDataRaw) : oldDataRaw
  const newParsed = typeof newDataRaw === 'string' ? safeJsonParse(newDataRaw) : newDataRaw

  const oldObj = unwrapObject(oldParsed) || {}
  const newObj = unwrapObject(newParsed) || {}

  // Filter out internal non-business keys
  const IGNORED_KEYS = new Set([
    'id', 'userId', 'projectId', 'createdAt', 'updatedAt', 'password', 'token',
    'version', 'isDeleted', 'deletedAt', 'clientIp', 'userAgent', 'hibernateLazyInitializer'
  ])

  const allKeys = Array.from(new Set([...Object.keys(oldObj), ...Object.keys(newObj)]))
    .filter((k) => !IGNORED_KEYS.has(k) && !k.startsWith('_'))

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
      label: getBusinessFieldLabel(key, lang),
      type,
      oldVal,
      newVal,
    })
  })

  // Priority: CHANGED -> ADDED -> REMOVED -> UNCHANGED
  const priority = { CHANGED: 1, ADDED: 2, REMOVED: 3, UNCHANGED: 4 }
  diffs.sort((a, b) => priority[a.type] - priority[b.type])

  return diffs
}

/**
 * Event Icon Component
 */
function EventIcon({ type, className = 'w-6 h-6' }) {
  if (type === 'project') {
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" />
      </svg>
    )
  }
  if (type === 'daily_update') {
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
      </svg>
    )
  }
  if (type === 'financial') {
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    )
  }
  if (type === 'ticket') {
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a.75.75 0 0 1-.75-.75v-2.222A7.525 7.525 0 0 1 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
      </svg>
    )
  }
  if (type === 'user') {
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
      </svg>
    )
  }
  if (type === 'auth') {
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
      </svg>
    )
  }
  if (type === 'auth_failed') {
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
      </svg>
    )
  }
  if (type === 'item') {
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z" />
      </svg>
    )
  }
  if (type === 'delete') {
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
      </svg>
    )
  }

  // Generic System Icon
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
    </svg>
  )
}

/**
 * Friendly Action Badge
 */
function ActionBadge({ action, lang = 'en' }) {
  const act = (action || '').toUpperCase()
  const isAr = lang === 'ar'
  const friendlyText = ACTION_DICTIONARY[act] ? (isAr ? ACTION_DICTIONARY[act].ar : ACTION_DICTIONARY[act].en) : action

  let colorClasses = 'bg-gray-100 text-gray-700 border-gray-200'
  if (['CREATE', 'ADD', 'REGISTER', 'SAVE', 'INSERT'].some((a) => act.includes(a))) {
    colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200'
  } else if (['UPDATE', 'EDIT', 'MODIFY', 'PUT', 'PATCH', 'CHANGE'].some((a) => act.includes(a))) {
    colorClasses = 'bg-sky-50 text-sky-700 border-sky-200'
  } else if (['DELETE', 'REMOVE', 'DEACTIVATE', 'DROP'].some((a) => act.includes(a))) {
    colorClasses = 'bg-red-50 text-red-700 border-red-200'
  } else if (['LOGIN_SUCCESS', 'AUTH'].some((a) => act.includes(a))) {
    colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200'
  } else if (['LOGIN_FAILED'].some((a) => act.includes(a))) {
    colorClasses = 'bg-rose-50 text-rose-700 border-rose-200'
  } else if (['LOGOUT'].some((a) => act.includes(a))) {
    colorClasses = 'bg-purple-50 text-purple-700 border-purple-200'
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colorClasses}`}
    >
      {friendlyText || '—'}
    </span>
  )
}

/**
 * Friendly Status Badge
 */
function StatusBadge({ status, lang = 'en' }) {
  const st = (status || '').toUpperCase()
  const isSuccess = st === 'SUCCESS' || st === 'OK' || st === '200'
  const isAr = lang === 'ar'

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
        isSuccess
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
          : 'bg-red-50 text-red-700 border-red-200'
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          isSuccess ? 'bg-emerald-500' : 'bg-red-500'
        }`}
      />
      {isSuccess ? (isAr ? 'تمت بنجاح' : 'Success') : (isAr ? 'فشلت العملية' : 'Failed')}
    </span>
  )
}

export default function AdminActivityLogsPage() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language || 'en'
  const isAr = lang === 'ar'

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
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false)
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
    setShowTechnicalDetails(false)
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

  // Selected Log Story & Diffs
  const activeStory = selectedLog ? generateActivityStory(selectedLog, lang) : null
  const businessDiffs = selectedLog
    ? computeBusinessDiff(
        selectedLog.oldValues ?? selectedLog.old_values,
        selectedLog.newValues ?? selectedLog.new_values,
        lang
      )
    : []

  const visibleDiffs = businessDiffs.filter((d) => {
    if (!showUnchanged && d.type === 'UNCHANGED') return false
    if (!diffSearchKeyword.trim()) return true
    const kw = diffSearchKeyword.toLowerCase()
    return d.label.toLowerCase().includes(kw) || d.key.toLowerCase().includes(kw)
  })

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
            <span className="font-semibold text-gray-800">
              {dateObj.toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </span>
            <span className="text-gray-500 text-[11px] mt-0.5">
              {formatFriendlyRelativeTime(val, lang)}
            </span>
          </div>
        )
      },
    },
    {
      key: 'username',
      header: t('activity_logs.table.user', 'Operator'),
      render: (val, row) => {
        const username = val || row.user?.username || row.user?.email || (row.userId ? `User #${row.userId}` : isAr ? 'النظام' : 'System')
        const fullName = isAr && row.user?.fullNameAr ? row.user.fullNameAr : row.user?.fullNameEn || username
        return (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-warm-brown/10 border border-warm-brown/20 flex items-center justify-center text-xs font-bold text-warm-brown flex-shrink-0">
              {username.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-gray-900 truncate">{fullName}</p>
              <p className="text-[11px] text-gray-500 font-mono truncate">@{username}</p>
            </div>
          </div>
        )
      },
    },
    {
      key: 'summary',
      header: t('activity_logs.table.summary', 'What Happened'),
      render: (_, row) => {
        const story = generateActivityStory(row, lang)
        return (
          <div className="max-w-md py-0.5">
            <p className="text-xs font-semibold text-gray-900 line-clamp-1">{story.headline}</p>
            <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">{story.subDescription}</p>
          </div>
        )
      },
    },
    {
      key: 'action',
      header: t('activity_logs.table.action', 'Action'),
      render: (val) => <ActionBadge action={val} lang={lang} />,
    },
    {
      key: 'entityName',
      header: t('activity_logs.table.entity', 'Subject / Entity'),
      render: (val, row) => {
        const rawEntity = val || row.entity_name || 'System'
        const friendly = ENTITY_DICTIONARY[rawEntity] ? (isAr ? ENTITY_DICTIONARY[rawEntity].ar : ENTITY_DICTIONARY[rawEntity].en) : rawEntity
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
            {friendly}
          </span>
        )
      },
    },
    {
      key: 'status',
      header: t('activity_logs.table.status', 'Result'),
      render: (val) => <StatusBadge status={val} lang={lang} />,
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
          className="text-xs py-1.5 px-3 flex items-center gap-1.5 shadow-xs"
        >
          <svg className="w-3.5 h-3.5 text-warm-brown" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          </svg>
          {t('activity_logs.table.view_changes', 'View Details')}
        </Button>
      ),
    },
  ]

  const hasActiveFilters = selectedUserId || selectedAction || selectedStatus || entityFilter

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-medium text-gray-900">
            {t('activity_logs.title', 'System Activity Logs')}
          </h1>
          <p className="text-sm text-gray-500 font-light mt-0.5">
            {t('activity_logs.subtitle', 'Track all system actions, updates, and user operations in clear business terms')}
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
            label={t('activity_logs.filter_user', 'Operator / User')}
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
            label={t('activity_logs.filter_action', 'Action Type')}
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
              label: ACTION_DICTIONARY[act] ? (isAr ? ACTION_DICTIONARY[act].ar : ACTION_DICTIONARY[act].en) : act,
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
              label: st === 'SUCCESS' ? (isAr ? 'تمت بنجاح' : 'Completed Successfully') : (isAr ? 'فشلت العملية' : 'Failed'),
            }))}
          />

          {/* Entity Name Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-gray-700 block">
              {t('activity_logs.filter_entity', 'Category / Entity')}
            </label>
            <Input
              type="text"
              placeholder={t('activity_logs.filter_entity_placeholder', 'e.g. Project, Financial, Daily Update')}
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

      {/* View Details Modal (Humanized Executive View) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedLog(null)
        }}
        title={t('activity_logs.modal.title', 'Activity Log Details')}
        size="xl"
      >
        {selectedLog && activeStory && (
          <div className="space-y-6">
            {/* 1. Executive Story Hero Card */}
            <div className="relative overflow-hidden bg-gradient-to-br from-amber-50/60 via-white to-orange-50/30 border border-warm-brown/20 rounded-2xl p-5 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 relative z-10">
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-warm-brown/10 border border-warm-brown/20 flex items-center justify-center text-warm-brown flex-shrink-0 shadow-xs">
                    <EventIcon type={activeStory.iconType} className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <ActionBadge action={selectedLog.action} lang={lang} />
                      <StatusBadge status={selectedLog.status} lang={lang} />
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-warm-brown/10 text-warm-brown border border-warm-brown/20">
                        {activeStory.categoryLabel}
                      </span>
                    </div>
                    <h3 className="text-base font-medium text-gray-900 leading-snug mt-1">
                      {activeStory.headline}
                    </h3>
                    <p className="text-xs text-gray-600 font-light mt-1 leading-relaxed">
                      {activeStory.subDescription}
                    </p>
                  </div>
                </div>

                <div className="flex sm:flex-col items-end gap-1 flex-shrink-0">
                  <span className="text-xs font-semibold text-gray-800">
                    {selectedLog.createdAt ? new Date(selectedLog.createdAt).toLocaleTimeString(isAr ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                  <span className="text-[11px] text-gray-500 font-medium">
                    {formatFriendlyRelativeTime(selectedLog.createdAt, lang)}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Core Executive Context Badges (4 Clean Cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Operator Card */}
              <div className="bg-gray-50/80 border border-gray-200 rounded-xl p-3.5 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-warm-brown/10 border border-warm-brown/20 flex items-center justify-center text-warm-brown flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 block">
                    {t('activity_logs.modal.operator_info', 'Who Did This?')}
                  </span>
                  <p className="text-xs font-medium text-gray-900 truncate mt-0.5">
                    {isAr && selectedLog.user?.fullNameAr
                      ? selectedLog.user.fullNameAr
                      : selectedLog.user?.fullNameEn || selectedLog.username || (selectedLog.userId ? `User #${selectedLog.userId}` : isAr ? 'النظام' : 'System')}
                  </p>
                  <p className="text-[11px] text-gray-500 truncate font-mono font-light">
                    @{selectedLog.username || selectedLog.user?.username || 'system'}
                  </p>
                </div>
              </div>

              {/* Target Entity Card */}
              <div className="bg-gray-50/80 border border-gray-200 rounded-xl p-3.5 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600 flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 block">
                    {t('activity_logs.modal.target_info', 'Target Subject')}
                  </span>
                  <p className="text-xs font-medium text-sky-800 truncate mt-0.5">
                    {ENTITY_DICTIONARY[selectedLog.entityName]
                      ? (isAr ? ENTITY_DICTIONARY[selectedLog.entityName].ar : ENTITY_DICTIONARY[selectedLog.entityName].en)
                      : selectedLog.entityName || (isAr ? 'عنصر بالنظام' : 'System Event')}
                  </p>
                  {(selectedLog.entityId || selectedLog.entity_id) && (
                    <p className="text-[11px] text-gray-500 truncate font-light">
                      {isAr ? 'رقم السجل: ' : 'ID: '}#{selectedLog.entityId || selectedLog.entity_id}
                    </p>
                  )}
                </div>
              </div>

              {/* Device & Location Card */}
              <div className="bg-gray-50/80 border border-gray-200 rounded-xl p-3.5 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0H3" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 block">
                    {t('activity_logs.modal.session_info', 'Device & Location')}
                  </span>
                  <p className="text-xs font-medium text-gray-800 truncate mt-0.5">
                    {humanizeUserAgent(selectedLog.userAgent || selectedLog.user_agent, lang)}
                  </p>
                  <p className="text-[11px] font-mono text-gray-500 truncate font-light">
                    IP: {selectedLog.ipAddress || selectedLog.ip_address || '—'}
                  </p>
                </div>
              </div>

              {/* Exact Date & Time Card */}
              <div className="bg-gray-50/80 border border-gray-200 rounded-xl p-3.5 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 block">
                    {t('activity_logs.modal.date_time', 'Date & Time')}
                  </span>
                  <p className="text-xs font-medium text-gray-800 truncate mt-0.5">
                    {selectedLog.createdAt
                      ? new Date(selectedLog.createdAt).toLocaleTimeString(isAr ? 'ar-EG' : 'en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })
                      : '—'}
                  </p>
                  <p className="text-[11px] text-gray-500 truncate font-light">
                    {selectedLog.createdAt
                      ? new Date(selectedLog.createdAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })
                      : ''}
                  </p>
                </div>
              </div>
            </div>

            {/* 3. System Note / Description Callout if available */}
            {selectedLog.details && (
              <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                <svg className="w-5 h-5 text-warm-brown flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                </svg>
                <div>
                  <span className="text-xs font-bold text-warm-brown uppercase tracking-wider block mb-0.5">
                    {t('activity_logs.modal.details_note', 'System Note / Description')}
                  </span>
                  <p className="text-xs text-gray-700 leading-relaxed font-sans">
                    {selectedLog.details}
                  </p>
                </div>
              </div>
            )}

            {/* 4. Business Data & Changes Section */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 pb-3">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-warm-brown" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                  </svg>
                  <h3 className="text-sm font-medium text-gray-900">
                    {selectedLog.action === 'CREATE'
                      ? t('activity_logs.modal.created_data', 'Registered Information')
                      : selectedLog.action === 'DELETE'
                      ? t('activity_logs.modal.deleted_data', 'Deactivated Record')
                      : t('activity_logs.modal.updated_data', 'Changes Made')}
                  </h3>
                </div>

                {/* Filter / Search within Changed Fields */}
                {businessDiffs.length > 3 && (
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder={isAr ? 'بحث في الحقول...' : 'Search fields...'}
                        value={diffSearchKeyword}
                        onChange={(e) => setDiffSearchKeyword(e.target.value)}
                        className="w-44 sm:w-56 bg-white border border-gray-200 rounded-lg text-xs text-gray-900 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-warm-brown/30"
                      />
                    </div>
                    {businessDiffs.some((d) => d.type === 'UNCHANGED') && (
                      <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={showUnchanged}
                          onChange={(e) => setShowUnchanged(e.target.checked)}
                          className="rounded border-gray-300 text-warm-brown focus:ring-warm-brown/30"
                        />
                        <span>{isAr ? 'عرض الكل' : 'Show all'}</span>
                      </label>
                    )}
                  </div>
                )}
              </div>

              {/* Data Rows List */}
              {businessDiffs.length === 0 ? (
                <div className="p-8 text-center bg-gray-50 rounded-2xl border border-gray-200 text-xs text-gray-500">
                  <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                  </svg>
                  {t('activity_logs.modal.no_changes', 'No specific field changes recorded for this event.')}
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[380px] overflow-y-auto scrollbar-thin pr-1">
                  {visibleDiffs.map((diff) => {
                    const isChanged = diff.type === 'CHANGED'
                    const isAdded = diff.type === 'ADDED'
                    const isRemoved = diff.type === 'REMOVED'

                    return (
                      <div
                        key={diff.key}
                        className={`bg-white border rounded-xl p-3.5 transition-all ${
                          isChanged
                            ? 'border-amber-200 hover:border-amber-300 bg-amber-50/10'
                            : isAdded
                            ? 'border-emerald-200 hover:border-emerald-300 bg-emerald-50/10'
                            : isRemoved
                            ? 'border-red-200 hover:border-red-300 bg-red-50/10'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          {/* Field Title & Badge */}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-xs font-medium text-gray-900">{diff.label}</h4>
                              {isChanged && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                                  {isAr ? 'تم تعديله' : 'Modified'}
                                </span>
                              )}
                              {isAdded && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  {isAr ? 'جديد' : 'Added'}
                                </span>
                              )}
                              {isRemoved && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-700 border border-red-200">
                                  {isAr ? 'تم حذفه' : 'Removed'}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Value Change Flow */}
                          <div className="flex items-center gap-2.5 text-xs flex-wrap">
                            {/* Old / Previous Value */}
                            {isChanged && (
                              <div className="bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-lg flex items-center gap-2 max-w-full overflow-x-auto">
                                <span className="text-[10px] text-rose-600 font-bold uppercase">
                                  {isAr ? 'السابق:' : 'Before:'}
                                </span>
                                <span className="line-through opacity-80">
                                  {renderBusinessValue(diff.key, diff.oldVal, lang)}
                                </span>
                              </div>
                            )}

                            {/* Arrow Indicator */}
                            {isChanged && (
                              <svg className="w-4 h-4 text-warm-brown flex-shrink-0 rtl:rotate-180" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                              </svg>
                            )}

                            {/* New / Current Value */}
                            <div className={`px-3 py-1.5 rounded-lg flex items-center gap-2 max-w-full overflow-x-auto ${
                              isChanged || isAdded
                                ? 'bg-emerald-50 border border-emerald-200'
                                : isRemoved
                                ? 'bg-rose-50 border border-rose-200'
                                : 'bg-gray-50 border border-gray-200'
                            }`}>
                              {(isChanged || isAdded) && (
                                <span className="text-[10px] text-emerald-700 font-bold uppercase">
                                  {isAr ? 'الجديد:' : 'After:'}
                                </span>
                              )}
                              {renderBusinessValue(diff.key, isRemoved ? diff.oldVal : diff.newVal, lang)}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* 5. Collapsible Technical Diagnostics (for developers) */}
            <div className="border-t border-gray-200 pt-3">
              <button
                type="button"
                onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                className="w-full flex items-center justify-between p-2.5 text-xs font-semibold text-gray-500 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all"
              >
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
                  </svg>
                  {showTechnicalDetails
                    ? t('activity_logs.modal.hide_technical', 'Hide Technical Diagnostics')
                    : t('activity_logs.modal.technical_details', 'Technical Diagnostics (For Developers)')}
                </span>
                <svg
                  className={`w-4 h-4 transition-transform duration-200 ${showTechnicalDetails ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </button>

              {showTechnicalDetails && (
                <div className="mt-3 space-y-3 bg-gray-900 text-gray-100 rounded-xl p-4 text-xs font-mono">
                  <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                    <span className="text-gray-400 font-semibold">Raw JSON Audit Payload</span>
                    <button
                      type="button"
                      onClick={handleCopyLogData}
                      className="px-2.5 py-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-200 text-[11px] transition-colors flex items-center gap-1.5"
                    >
                      {copied ? (
                        <>
                          <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                          </svg>
                          <span className="text-emerald-400 font-medium">{t('activity_logs.copied', 'Copied!')}</span>
                        </>
                      ) : (
                        <span>{t('activity_logs.copy_json', 'Copy Raw JSON')}</span>
                      )}
                    </button>
                  </div>
                  <pre className="overflow-x-auto max-h-60 scrollbar-thin text-[11px] text-sky-300 leading-relaxed">
                    <code>{JSON.stringify(selectedLog, null, 2)}</code>
                  </pre>
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
