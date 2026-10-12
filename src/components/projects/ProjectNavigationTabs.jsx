import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

function OverviewIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.9} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
    </svg>
  )
}

function TicketIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.9} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 0 1 0 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 0 1 0-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375Z" />
    </svg>
  )
}

function ChatIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.9} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a.75.75 0 0 1-.974-.94 5.95 5.95 0 0 0 .548-2.57c-1.826-1.558-2.984-3.67-2.984-5.46C2 7.444 6.03 3.75 11 3.75s9 3.694 9 8.25Z" />
    </svg>
  )
}

function CameraIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.9} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
    </svg>
  )
}

export default function ProjectNavigationTabs({
  activeTab,
  onTabChange,
  dailyUpdatesUrl,
  project,
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <div className="flex items-center justify-between gap-2 rounded-2xl bg-stone-100/85 p-1 sm:p-1.5 border border-stone-200/80 shadow-2xs">
      {/* Scrollable track for tabs */}
      <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden flex-nowrap min-w-0 flex-1 px-0.5 py-0.5">
        {/* 1. Items & Progress */}
        <button
          type="button"
          onClick={() => onTabChange('OVERVIEW')}
          className={`inline-flex items-center gap-1.5 min-h-[38px] sm:min-h-[40px] px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === 'OVERVIEW'
              ? 'bg-warm-brown text-white shadow-xs'
              : 'text-stone-700 hover:text-stone-900 hover:bg-white/70 active:scale-[0.98]'
          }`}
        >
          <OverviewIcon className="w-4 h-4 shrink-0" />
          <span>{t('projects.tab_overview', { defaultValue: 'Items & Progress' })}</span>
        </button>

        {/* 2. Tickets */}
        <button
          type="button"
          onClick={() => onTabChange('TICKETS')}
          className={`inline-flex items-center gap-1.5 min-h-[38px] sm:min-h-[40px] px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === 'TICKETS'
              ? 'bg-warm-brown text-white shadow-xs'
              : 'text-stone-700 hover:text-stone-900 hover:bg-white/70 active:scale-[0.98]'
          }`}
        >
          <TicketIcon className="w-4 h-4 shrink-0" />
          <span>{t('projects.tab_tickets', { defaultValue: 'Tickets' })}</span>
        </button>

        {/* 3. Project Chat */}
        <button
          type="button"
          onClick={() => onTabChange('PROJECT_CHAT')}
          className={`inline-flex items-center gap-1.5 min-h-[38px] sm:min-h-[40px] px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === 'PROJECT_CHAT'
              ? 'bg-warm-brown text-white shadow-xs'
              : 'text-stone-700 hover:text-stone-900 hover:bg-white/70 active:scale-[0.98]'
          }`}
        >
          <ChatIcon className="w-4 h-4 shrink-0" />
          <span>{t('projects.tab_project_chat', { defaultValue: 'Project Chat' })}</span>
        </button>

        {/* 4. Daily Updates (mobile-only tab in track to prevent awkward stacking) */}
        {dailyUpdatesUrl && (
          <button
            type="button"
            onClick={() => navigate(dailyUpdatesUrl, { state: { projectSummary: project } })}
            className="sm:hidden inline-flex items-center gap-1.5 min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-bold text-warm-brown bg-white border border-warm-sand/80 hover:bg-warm-brown hover:text-white transition-all shrink-0 cursor-pointer shadow-2xs"
          >
            <CameraIcon className="w-3.5 h-3.5 shrink-0" />
            <span>{t('nav.daily_updates', { defaultValue: 'Daily Updates' })}</span>
            <svg className="w-3 h-3 shrink-0 opacity-70 rtl:-scale-x-100" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 19.5 15-15m0 0H8.25m11.25 0v11.25" />
            </svg>
          </button>
        )}
      </div>

      {/* Desktop action button on the right */}
      {dailyUpdatesUrl && (
        <button
          type="button"
          onClick={() => navigate(dailyUpdatesUrl, { state: { projectSummary: project } })}
          className="hidden sm:inline-flex items-center gap-2 min-h-[40px] px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-warm-brown bg-white border border-stone-200/90 hover:bg-warm-brown hover:text-white transition-all shadow-2xs shrink-0 cursor-pointer group"
        >
          <CameraIcon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
          <span>{t('nav.daily_updates', { defaultValue: 'Daily Updates' })}</span>
          <svg className="w-3.5 h-3.5 shrink-0 rtl:rotate-180 transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
        </button>
      )}
    </div>
  )
}
