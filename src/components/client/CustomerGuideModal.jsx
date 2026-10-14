import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

/**
 * CustomerGuideModal — Luxury, Modern Classic Client User Guide
 *
 * Provides a comprehensive, interactive client walkthrough with visual UI mockups,
 * chapter jumping, interactive FAQs, and quick-action shortcuts.
 */
export default function CustomerGuideModal({ isOpen, onClose }) {
  const { t, i18n } = useTranslation()
  const isArabic = i18n.language === 'ar'
  const navigate = useNavigate()

  const [activeStep, setActiveStep] = useState(0)
  const [viewMode, setViewMode] = useState('tour') // 'tour' | 'catalog' | 'faq'
  const [expandedFaq, setExpandedFaq] = useState(null)

  // Reset to first step on open
  useEffect(() => {
    if (isOpen) {
      setActiveStep(0)
      setViewMode('tour')
      setExpandedFaq(null)
    }
  }, [isOpen])

  // Prevent background scroll while open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  const chapters = [
    {
      id: 'welcome',
      number: '01',
      badgeAr: 'نظرة عامة',
      badgeEn: 'Overview',
      titleAr: 'مرحباً بك في تجربة أوتيما الذكية',
      titleEn: 'Welcome to Ottima Smart Experience',
      subtitleAr: 'منصة فاخرة تمنحك متابعة دقيقة وشاملة لكل تفاصيل تشطيب منزلك',
      subtitleEn: 'A luxury platform offering live tracking of every finishing phase with absolute precision',
      descAr: 'صُممت منصة أوتيما لتضعك في قلب مشروعك لحظة بلحظة. وداعاً للزيارات المجهدة والمكالمات المتكررة؛ كل خطوة هندسية، مليم مالي، وصورة ميدانية موثقة ومتاحة أمامك بشفافية مطلقة.',
      descEn: 'The Ottima portal is crafted to place you at the heart of your home finishing journey. Every milestone, payment receipt, and site progress photo is thoroughly documented and accessible at any moment.',
      features: [
        {
          titleAr: 'متابعة حية وشاملة 24/7',
          titleEn: '24/7 Real-Time Monitoring',
          descAr: 'اطّلع على نسب إنجاز الشقة أو الفيلا وجدول التنفيذ من أي جهاز في أي وقت.',
          descEn: 'Track your villa or apartment completion rate and timeline from any device, anytime.',
          icon: '⚡',
        },
        {
          titleAr: 'رقابة هندسية واعتماد مسبق',
          titleEn: 'Strict Engineering Quality Control',
          descAr: 'كل تحديث وصورة يمر بفحص وتدقيق مهندسي الجودة بالإدارة قبل عرضه لك.',
          descEn: 'Every site photo is verified by our quality engineers before publication.',
          icon: '🛡️',
        },
        {
          titleAr: 'شفافية مالية وفواتير موثقة',
          titleEn: 'Certified Financial Transparency',
          descAr: 'كشف حساب لحظي يوثق كل دفعة، إيصال، ومصروفات المواد بدقة كاملة.',
          descEn: 'Instant ledger showing payments, material invoices, and remaining balance.',
          icon: '💎',
        },
      ],
      previewType: 'welcome',
    },
    {
      id: 'projects',
      number: '02',
      badgeAr: 'المشاريع والبنود',
      badgeEn: 'Projects & Items',
      titleAr: 'كروت المشاريع وجدول البنود الهندسي',
      titleEn: 'Project Cards & Item Breakdown',
      subtitleAr: 'كل مشروع في كارت منفصل، مع تفصيل كامل لكل بند تشطيب',
      subtitleEn: 'Every project in a dedicated card with comprehensive milestone breakdown',
      descAr: 'تعرض صفحة المشاريع كروت مستقلة ومفصلة لوحداتك. عند النقر على أي مشروع، ستجد جدول البنود التفصيلي (محارة، سباكة، كهرباء، عزل، دهانات، أرضيات رخام وبورسلين) مع تفاصيل المهندس المسؤول وتاريخ التسليم.',
      descEn: 'The Projects dashboard presents standalone cards for your properties. Clicking any project unlocks the full finishing breakdown (plumbing, masonry, wiring, waterproofing, marble, painting) with target deadlines and lead engineers.',
      features: [
        {
          titleAr: 'أوزان نسبية دقيقة لكل بند (Weight %)',
          titleEn: 'Weighted Percentage Allocation',
          descAr: 'كل بند له وزن هندسي محدد؛ إنجاز البنود الأساسية يرفع مؤشر التقدم الإجمالي آلياً.',
          descEn: 'Items carry precise engineering weight, automatically driving the overall completion rate.',
          icon: '⚖️',
        },
        {
          titleAr: 'تاريخ التسليم المستهدف المعتمد',
          titleEn: 'Verified Target Delivery Date',
          descAr: 'تاريخ تسليم محدد وواضح لمتابعة الالتزام الدقيق بالجدول الزمني للتشطيب.',
          descEn: 'Strict delivery schedule to monitor on-time milestone execution.',
          icon: '📅',
        },
        {
          titleAr: 'المهندس المشرف وفريق الموقع',
          titleEn: 'Assigned Lead Engineer',
          descAr: 'معرفة المهندس القائم على كل بند وسهولة التواصل وتوجيه الملاحظات له.',
          descEn: 'Direct visibility of the engineer in charge of each milestone.',
          icon: '👷',
        },
      ],
      previewType: 'project_card',
    },
    {
      id: 'daily_updates',
      number: '03',
      badgeAr: 'التحديثات والميديا',
      badgeEn: 'Daily Updates & Media',
      titleAr: 'معرض الصور وملفات الـ PDF بجانب بعضها',
      titleEn: 'Side-by-Side Photo & PDF Gallery',
      subtitleAr: 'تصفح صور الموقع وملفات الـ PDF بسهولة وسحب أفقي ناعم',
      subtitleEn: 'Browse site photos and PDF documents side by side with smooth horizontal swipe',
      descAr: 'يقوم مهندسو أوتيما بتوثيق العمل الميداني بتحديثات مصورة دورية. صممنا لك معرض وسائط حديث يعرض الصور والمستندات بجانب بعضها (جنب بعض) لتتمكن من التمرير والسحب أفقياً (Swipe) والتكبير بسهولة تامة.',
      descEn: 'Site engineers document work progress through photo and PDF updates. Our side-by-side gallery allows you to effortlessly swipe horizontally across all media, inspect high-resolution details, and open PDF documents.',
      features: [
        {
          titleAr: 'تصفح أفقي وسحب سلس (Swipe & Slide)',
          titleEn: 'Side-by-Side Horizontal Swiping',
          descAr: 'الصور ومستندات الـ PDF معروضة بجانب بعضها بدلاً من التراكم رأسياً لتحت.',
          descEn: 'Media cards sit side-by-side with snap gestures instead of endless vertical scrolling.',
          icon: '↔️',
        },
        {
          titleAr: 'دعم كامل لمستندات الـ PDF وفواتير التوريد',
          titleEn: 'Integrated PDF Document Viewer',
          descAr: 'استعراض وقراءة ملفات الـ PDF صفحة بصفحة مع خيارات التكبير والتدوير والتحميل.',
          descEn: 'Read, zoom, paginate, and download multi-page PDF files directly in-app.',
          icon: '📄',
        },
        {
          titleAr: 'تكبير وفحص جودة التشطيب (HD Zoom)',
          titleEn: 'High-Definition Detail Zoom',
          descAr: 'انقر على أي صورة لتكبيرها وفحص أدق تفاصيل السيراميك، الدهانات، والجبس.',
          descEn: 'Tap any photo to zoom in and evaluate finishing quality in crisp high resolution.',
          icon: '🔍',
        },
      ],
      previewType: 'media_gallery',
    },
    {
      id: 'comments',
      number: '04',
      badgeAr: 'التواصل الفوري',
      badgeEn: 'Live Communication',
      titleAr: 'إبداء الملاحظات واستلام الردود الفورية',
      titleEn: 'Instant Feedback & Administration Chat',
      subtitleAr: 'صوتك مسموع وملاحظتك تصل فوراً لإدارة أوتيما للمتابعة والتنفيذ',
      subtitleEn: 'Your notes and requests reach management and site teams instantly',
      descAr: 'في أسفل كل تحديث يومي، يمكنك كتابة استفسار أو ملاحظة حول أي صورة أو عمل منجز. تصل رسالتك فوراً إلى لوحة تحكم الإدارة، ويتلقى مهندس الموقع توجيهات فورية لمعالجة ملاحظتك، مع إشعارك فور الرد.',
      descEn: 'Under every daily update, you can post comments or inquiries regarding any work or photo. Your note triggers instant alerts to management and field engineers, ensuring rapid turnaround with real-time response notifications.',
      features: [
        {
          titleAr: 'إشعارات علوية ذكية (Top Push Toasts)',
          titleEn: 'Sleek Top Push Notifications',
          descAr: 'إشعار فوري يظهر في أعلى الشاشة فور رد الإدارة؛ سهل السحب للأعلى للإغلاق.',
          descEn: 'Instant banner appearing at top of screen with smooth swipe-up gesture to dismiss.',
          icon: '🔔',
        },
        {
          titleAr: 'توثيق رسمي لكافة التعديلات',
          titleEn: 'Recorded Decision Trail',
          descAr: 'سجل محادثات مكتوب ومؤرشف يضمن حفظ كل طلب أو تعديل طلبته في الوحدة.',
          descEn: 'Permanent archived discussion log protecting your change requests and preferences.',
          icon: '✍️',
        },
        {
          titleAr: 'توجيه مباشر لمهندسي الموقع',
          titleEn: 'Direct Field Coordination',
          descAr: 'تقوم الإدارة بتوجيه المهندس والعمال فورياً بناءً على ما تطلبه في التعليقات.',
          descEn: 'Management forwards actions to site supervisors for prompt implementation.',
          icon: '🚀',
        },
      ],
      previewType: 'comments_chat',
    },
    {
      id: 'finance',
      number: '05',
      badgeAr: 'المالية والحسابات',
      badgeEn: 'Finance & Invoices',
      titleAr: 'الشفافية المالية وكشف الحساب الشامل',
      titleEn: 'Financial Transparency & Payment Ledger',
      subtitleAr: 'متابعة الدفعات المسددة، المصروفات، ومتبقي الميزانية بدقة تامة',
      subtitleEn: 'Monitor paid milestones, material expenses, and remaining budget transparently',
      descAr: 'من خلال قسم المالية، يمكنك الاطمئنان التام على أموالك. يوفر القسم كشف حساب دقيق يُظهر كل دفعة سددتها، وتوزيع المصروفات الميدانية، مع إمكانية تحميل الإيصالات وفواتير المشتريات المرفقة بصيغة PDF.',
      descEn: 'The Finance module grants you peace of mind. Review certified statements recording paid installments, calculated site expenses, and remaining balances, alongside verified supplier receipts and downloadable PDF vouchers.',
      features: [
        {
          titleAr: 'مؤشرات مالية واضحة بنظرة واحدة',
          titleEn: 'High-Level Financial Cards',
          descAr: 'ثلاث كروت تلخص (إجمالي المسدد، المصروفات المحسوبة، الرصيد المتبقي).',
          descEn: 'Three clean metrics: Total Paid, Calculated Spent, and Remaining Balance.',
          icon: '💳',
        },
        {
          titleAr: 'إيصالات السداد وفواتير المواد المرفقة',
          titleEn: 'Downloadable PDF Invoices',
          descAr: 'تحميل ومراجعة أي إيصال توريد أو سند دفع معتمد من الموقع بصيغة PDF.',
          descEn: 'Inspect and save certified payment receipts and vendor invoices in high quality.',
          icon: '📑',
        },
        {
          titleAr: 'تنزيل كشف حساب دوري كامل',
          titleEn: 'Export Statement of Account',
          descAr: 'تصدير كشف حساب محاسبي شامل يوثق حركة الأموال طوال فترة المشروع.',
          descEn: 'Export certified statements tracking all financial transactions across the project lifespan.',
          icon: '📊',
        },
      ],
      previewType: 'finance_summary',
    },
  ]

  const faqs = [
    {
      qAr: 'هل يرى العميل صور الموقع بمجرد أن يلتقطها المهندس؟',
      qEn: 'Are site photos visible to the client immediately after being taken?',
      aAr: 'لا، تمر جميع التحديثات والصور أولاً بمراجعة وتدقيق مهندسي الجودة في إدارة أوتيما. يتم فحص مطابقتها للمواصفات والرسومات الهندسية، وبمجرد اعتمادها (Approved) تظهر فوراً في حسابك لضمان عدم وصول أي صورة غير مطابقة.',
      aEn: 'No. All site photos and daily updates are first reviewed by Ottima engineering management. Once inspected against quality standards and approved, they immediately appear on your portal.',
    },
    {
      qAr: 'كيف يتم حساب النسبة المئوية لإنجاز المشروع؟',
      qEn: 'How is the overall project completion percentage calculated?',
      aAr: 'تُحسب النسبة آلياً وفقاً للأوزان الهندسية النسبية المعتمدة لكل بند (Weight %). مثلاً بند السباكة والكهرباء والمحارة يمثل ثقلاً أكبر من بنود الإكسسوارات، لذا يعكس المؤشر التقدم الحقيقي الفعلي للمشروع بدقة هندسية.',
      aEn: 'The percentage is dynamically calculated based on pre-assigned engineering weights (Weight %). Structural and core phases carry proportional weight, ensuring the overall progress bar reflects genuine physical milestone completion.',
    },
    {
      qAr: 'ماذا يحدث عند كتابة ملاحظة أو تعليق على التحديث اليومي؟',
      qEn: 'What happens when I post a comment or note on a daily update?',
      aAr: 'يصل تنبيه فوري لإدارة أوتيما ولمدير المشروع. تتم مراجعة ملاحظتك وتوجيه فريق الموقع لتنفيذ التعديل أو توضيح الاستفسار، ويصلك إشعار فوري (Toast Notification) أعلى شاشتك فور تسجيل الرد.',
      aEn: 'An instant high-priority notification reaches Ottima management and the lead project manager. Site instructions are issued accordingly, and you receive an alert banner as soon as management posts a response.',
    },
    {
      qAr: 'كيف يمكنني استعراض وتحميل فواتير المواد وإيصالات الدفع؟',
      qEn: 'How can I review and download material invoices and payment receipts?',
      aAr: 'من تبويب "المالية" في الشريط السفلي، ستجد جدولاً بالسجلات المالية وإيصالات الدفع. اضغط على أي سجل لتصفحه أو النقر على رمز الـ PDF لاستعراض المستند بالكامل وتحميله على هاتفك أو حاسوبك.',
      aEn: 'Through the Finance tab in the bottom bar, access your ledger records. Click any entry to inspect details or tap the PDF icon to view and download official receipts directly to your device.',
    },
    {
      qAr: 'هل يمكنني استخدام المنصة باللغتين العربية والإنجليزية؟',
      qEn: 'Can I use the platform in both Arabic and English?',
      aAr: 'نعم بكل تأكيد! يمكنك التبديل بين اللغتين في أي وقت بضغطة زر واحدة من أعلى الشاشة (AR / EN) وستتحول المنصة بالكامل مع اتجاه القراءة المناسب فوراً.',
      aEn: 'Absolutely. You can toggle between Arabic and English anytime with a single click from the top header (AR / EN). The interface adapts layout and direction instantly.',
    },
  ]

  const currentChapter = chapters[activeStep]

  const handleNext = () => {
    if (activeStep < chapters.length - 1) {
      setActiveStep(activeStep + 1)
    } else {
      onClose()
    }
  }

  const handlePrev = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-fade-in select-none">
      <div
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden bg-white border border-[#D9C7B8]/70 shadow-2xl rounded-3xl"
        dir={isArabic ? 'rtl' : 'ltr'}
      >
        {/* ── Luxury Header Banner ─────────────────────────────────── */}
        <div className="relative px-5 sm:px-8 py-5 sm:py-6 bg-gradient-to-r from-[#2D1E15] via-[#432C1E] to-[#5A3D2B] text-white shrink-0 overflow-hidden">
          {/* Subtle ambient luxury light circles */}
          <div className="absolute -top-12 -end-12 w-48 h-48 rounded-full bg-[#C6AB7C]/20 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-8 -start-8 w-36 h-36 rounded-full bg-[#7D583F]/30 blur-xl pointer-events-none" />

          <div className="relative z-10 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#C6AB7C] to-[#8C6D43] p-0.5 shadow-lg shadow-black/20 shrink-0 flex items-center justify-center">
                <div className="w-full h-full rounded-[14px] bg-[#2D1E15] flex items-center justify-center text-xl">
                  📖
                </div>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#C6AB7C] bg-[#C6AB7C]/15 px-2 py-0.5 rounded-md border border-[#C6AB7C]/30">
                    OTTIMA CLIENT EXPERIENCE
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-medium text-white tracking-tight truncate mt-0.5">
                  {isArabic ? 'دليل العميل الذكي للتشطيبات' : 'Smart Client Finishing Guide'}
                </h2>
                <p className="text-xs text-[#D9C7B8] font-light truncate hidden sm:block">
                  {isArabic
                    ? 'دليلك الشامل لمتابعة كل مليم وكل خطوة في تشطيب وحدتك بأعلى معايير الدقة والشفافية'
                    : 'Your comprehensive guide to track every penny and milestone with total transparency'}
                </p>
              </div>
            </div>

            {/* Mode Switchers & Close */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="hidden md:flex items-center bg-black/40 rounded-xl p-1 border border-white/10 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setViewMode('tour')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    viewMode === 'tour'
                      ? 'bg-[#C6AB7C] text-black font-bold shadow-xs'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  {isArabic ? 'الجولة الإرشادية' : 'Tour'}
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('catalog')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    viewMode === 'catalog'
                      ? 'bg-[#C6AB7C] text-black font-bold shadow-xs'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  {isArabic ? 'كافة الفصول' : 'Chapters'}
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('faq')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    viewMode === 'faq'
                      ? 'bg-[#C6AB7C] text-black font-bold shadow-xs'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  {isArabic ? 'الأسئلة الشائعة' : 'FAQs'}
                </button>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors flex items-center justify-center font-bold text-sm cursor-pointer shadow-2xs"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Stepper Tabs Bar (Visible in Tour mode) */}
          {viewMode === 'tour' && (
            <div className="relative z-10 flex items-center gap-2 mt-5 pt-3 border-t border-white/10 overflow-x-auto no-scrollbar">
              {chapters.map((ch, idx) => {
                const isActive = idx === activeStep
                const isPassed = idx < activeStep
                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => setActiveStep(idx)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                      isActive
                        ? 'bg-[#C6AB7C] text-gray-950 shadow-md shadow-[#C6AB7C]/20 scale-105'
                        : isPassed
                        ? 'bg-white/15 text-white/90 hover:bg-white/25'
                        : 'bg-white/5 text-white/40 hover:bg-white/10'
                    }`}
                  >
                    <span className="font-mono text-[10px] opacity-80">{ch.number}</span>
                    <span>{isArabic ? ch.badgeAr : ch.badgeEn}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Main Scrollable Body ──────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-5 sm:p-7 bg-[#FAF7F3]">
          {/* ══════════ MODE 1: STEP-BY-STEP TOUR ══════════ */}
          {viewMode === 'tour' && (
            <div className="space-y-6 max-w-3xl mx-auto animate-fade-in">
              {/* Chapter Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#D9C7B8]/40 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black font-mono text-[#7D583F] bg-[#F4EDE4] px-2.5 py-0.5 rounded-md border border-[#D9C7B8]/60">
                      CHAPTER {currentChapter.number}
                    </span>
                    <span className="text-xs font-bold text-gray-400">
                      {isArabic ? currentChapter.badgeAr : currentChapter.badgeEn}
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-medium text-gray-950 mt-1">
                    {isArabic ? currentChapter.titleAr : currentChapter.titleEn}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#7D583F] font-light mt-0.5">
                    {isArabic ? currentChapter.subtitleAr : currentChapter.subtitleEn}
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                  <span className="text-xs font-bold text-gray-500 font-mono">
                    {activeStep + 1} / {chapters.length}
                  </span>
                </div>
              </div>

              {/* Main Description */}
              <p className="text-sm sm:text-base leading-relaxed text-gray-700 bg-white p-4.5 rounded-2xl border border-gray-200/80 shadow-2xs">
                {isArabic ? currentChapter.descAr : currentChapter.descEn}
              </p>

              {/* Visual Interactive Mockup Display Box */}
              <div className="rounded-2xl border-2 border-[#D9C7B8]/60 bg-white p-4 sm:p-5 shadow-xs overflow-hidden">
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1.5">
                  <span>✨</span>
                  <span>{isArabic ? 'معاينة حية للميزة في التطبيق' : 'Live In-App Feature Simulation'}</span>
                </p>

                {/* Simulated UI: Welcome */}
                {currentChapter.previewType === 'welcome' && (
                  <div className="p-4 rounded-xl bg-gradient-to-br from-[#F4EDE4]/60 to-white border border-[#D9C7B8]/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="space-y-1 text-start">
                      <p className="text-xs font-extrabold text-[#7D583F]">OTTIMA FINISHING PORTAL</p>
                      <h4 className="text-base font-medium text-gray-900">
                        {isArabic ? 'وحدتك في أيدي مهندسين محترفين' : 'Your Property in Master Hands'}
                      </h4>
                      <p className="text-xs text-gray-500 font-light">
                        {isArabic ? 'تحديثات صور فورية • جداول بنود معتمدة • أمان مالي تام' : 'Real-time photos • Approved items • Full financial security'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        {isArabic ? 'النظام متصل ونشط' : 'System Live & Active'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Simulated UI: Project Card */}
                {currentChapter.previewType === 'project_card' && (
                  <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">
                          {isArabic ? 'مشروع فيلا الياسمين (تشطيب كامل)' : 'Al-Yasmin Villa (Full Finishing)'}
                        </h4>
                        <p className="text-xs text-gray-500 font-light flex items-center gap-1 mt-0.5">
                          📍 {isArabic ? 'التجمع الخامس، القاهرة' : 'New Cairo, Egypt'}
                        </p>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {isArabic ? 'قيد التنفيذ' : 'IN PROGRESS'}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-gray-500">{isArabic ? 'نسبة الإنجاز الإجمالية' : 'Overall Progress'}</span>
                        <span className="text-[#7D583F] font-bold font-mono">68%</span>
                      </div>
                      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-[#7D583F] to-amber-600 rounded-full w-[68%]" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs text-gray-500">
                      <span>👷 {isArabic ? 'المهندس: م. أحمد حسام' : 'Engineer: Eng. Ahmed Hossam'}</span>
                      <span className="font-semibold text-amber-800">📅 2027-01-15</span>
                    </div>
                  </div>
                )}

                {/* Simulated UI: Media Gallery Side-by-Side */}
                {currentChapter.previewType === 'media_gallery' && (
                  <div className="p-3 rounded-xl bg-[#F4EDE4]/40 border border-[#D9C7B8]/40 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-gray-700">
                      <span>📸 {isArabic ? 'المرفقات جنباً إلى جنب (Swipe)' : 'Side-by-Side Media Gallery'}</span>
                      <span className="text-gray-400 font-normal">{isArabic ? 'اسحب للتنقل ↔' : 'Swipe ↔'}</span>
                    </div>
                    <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
                      <div className="w-36 h-24 rounded-xl bg-gray-200 border border-gray-300 shrink-0 relative overflow-hidden flex items-center justify-center text-xs font-bold text-gray-600">
                        📷 {isArabic ? 'صورة الدهان' : 'Wall Paint'}
                        <span className="absolute top-1 end-1 bg-black/60 text-white text-[9px] px-1 rounded">1/3</span>
                      </div>
                      <div className="w-36 h-24 rounded-xl bg-gray-200 border border-gray-300 shrink-0 relative overflow-hidden flex items-center justify-center text-xs font-bold text-gray-600">
                        📷 {isArabic ? 'تمديدات السباكة' : 'Plumbing'}
                        <span className="absolute top-1 end-1 bg-black/60 text-white text-[9px] px-1 rounded">2/3</span>
                      </div>
                      <div className="w-36 h-24 rounded-xl bg-rose-50 border border-rose-200 shrink-0 relative overflow-hidden flex flex-col items-center justify-center text-xs font-bold text-rose-700">
                        <span>📄 PDF</span>
                        <span className="text-[10px] font-normal">{isArabic ? 'فاتورة المواد' : 'Invoice.pdf'}</span>
                        <span className="absolute top-1 end-1 bg-rose-600 text-white text-[9px] px-1 rounded">3/3</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Simulated UI: Comments Chat */}
                {currentChapter.previewType === 'comments_chat' && (
                  <div className="p-3 rounded-xl bg-white border border-gray-200 space-y-2.5">
                    <div className="flex items-start gap-2 bg-[#F4EDE4]/50 p-2.5 rounded-xl border border-[#D9C7B8]/40">
                      <div className="w-7 h-7 rounded-full bg-[#7D583F] text-white flex items-center justify-center text-xs font-bold shrink-0">
                        👤
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-900">{isArabic ? 'أنت (العميل):' : 'You (Client):'}</p>
                        <p className="text-xs text-gray-700 mt-0.5">
                          {isArabic ? 'برجاء مراجعة درجة لون دهان الريسبشن قبل البدء في الوجه الثاني.' : 'Please verify reception paint shade before second coat.'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-200 ms-4">
                      <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                        ✓
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-emerald-900">{isArabic ? 'إدارة أوتيما (Admin):' : 'Ottima Management:'}</p>
                        <p className="text-xs text-emerald-800 mt-0.5">
                          {isArabic ? 'تم إبلاغ مهندس الموقع فورياً وسيتم إرسال عينة معتمدة للتأكيد قبل التنفيذ.' : 'Site engineer instructed. A certified sample will be confirmed first.'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Simulated UI: Finance */}
                {currentChapter.previewType === 'finance_summary' && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-center">
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                      <p className="text-[10px] font-bold text-emerald-700 uppercase">{isArabic ? 'إجمالي المسدد' : 'Total Paid'}</p>
                      <p className="text-sm font-extrabold text-emerald-900 mt-0.5 font-mono">450,000 ج.م</p>
                    </div>
                    <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
                      <p className="text-[10px] font-bold text-blue-700 uppercase">{isArabic ? 'المصروفات الفعلية' : 'Calculated Spent'}</p>
                      <p className="text-sm font-extrabold text-blue-900 mt-0.5 font-mono">380,000 ج.م</p>
                    </div>
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                      <p className="text-[10px] font-bold text-amber-700 uppercase">{isArabic ? 'الرصيد المتبقي' : 'Remaining Balance'}</p>
                      <p className="text-sm font-extrabold text-amber-900 mt-0.5 font-mono">70,000 ج.م</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Three Key Pillar Cards for Current Chapter */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {currentChapter.features.map((feat, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-2xl border border-gray-200/90 bg-white hover:border-[#7D583F]/50 hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      <span className="text-2xl">{feat.icon}</span>
                      <h4 className="text-sm font-medium text-gray-900 mt-2">
                        {isArabic ? feat.titleAr : feat.titleEn}
                      </h4>
                      <p className="text-xs text-gray-600 font-light mt-1 leading-relaxed">
                        {isArabic ? feat.descAr : feat.descEn}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══════════ MODE 2: ALL CHAPTERS CATALOG ══════════ */}
          {viewMode === 'catalog' && (
            <div className="space-y-4 max-w-3xl mx-auto animate-fade-in">
              <div className="text-center max-w-md mx-auto mb-6">
                <h3 className="text-xl font-medium text-gray-900">
                  {isArabic ? 'فهرس فصول الدليل الذكي' : 'All Guide Chapters'}
                </h3>
                <p className="text-xs text-gray-500 font-light mt-1">
                  {isArabic ? 'اختر أي موضوع للانتقال إليه مباشرة والاطلاع على تفاصيله' : 'Select any chapter to jump directly to its details'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {chapters.map((ch, idx) => (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => {
                      setActiveStep(idx)
                      setViewMode('tour')
                    }}
                    className="p-4 rounded-2xl border border-gray-200/80 bg-white hover:border-[#7D583F] hover:shadow-lg transition-all text-start cursor-pointer group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-mono font-bold text-[#7D583F] bg-[#F4EDE4] px-2 py-0.5 rounded border border-[#D9C7B8]/60">
                          {ch.number}
                        </span>
                        <span className="text-xs font-semibold text-gray-400 group-hover:text-[#7D583F] transition-colors">
                          {isArabic ? 'عرض الفصل ›' : 'View ›'}
                        </span>
                      </div>
                      <h4 className="text-base font-medium text-gray-900 group-hover:text-[#7D583F] transition-colors">
                        {isArabic ? ch.titleAr : ch.titleEn}
                      </h4>
                      <p className="text-xs text-gray-500 font-light line-clamp-2 mt-1 leading-relaxed">
                        {isArabic ? ch.subtitleAr : ch.subtitleEn}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ══════════ MODE 3: FAQS ══════════ */}
          {viewMode === 'faq' && (
            <div className="space-y-4 max-w-3xl mx-auto animate-fade-in">
              <div className="text-center max-w-md mx-auto mb-6">
                <h3 className="text-xl font-medium text-gray-900">
                  {isArabic ? 'الأسئلة الأكثر شيوعاً للعملاء' : 'Frequently Asked Questions'}
                </h3>
                <p className="text-xs text-gray-500 font-light mt-1">
                  {isArabic ? 'إجابات واضحة ومباشرة لأهم التساؤلات حول متابعة تشطيب وحدتك' : 'Clear answers to essential questions regarding your project'}
                </p>
              </div>

              <div className="space-y-3">
                {faqs.map((faq, idx) => {
                  const isExpanded = expandedFaq === idx
                  return (
                    <div
                      key={idx}
                      className="rounded-2xl border border-gray-200/90 bg-white overflow-hidden shadow-2xs transition-all"
                    >
                      <button
                        type="button"
                        onClick={() => setExpandedFaq(isExpanded ? null : idx)}
                        className="w-full p-4 flex items-center justify-between gap-3 text-start font-bold text-sm text-gray-900 hover:text-[#7D583F] cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <span className="text-base text-[#7D583F]">❓</span>
                          <span>{isArabic ? faq.qAr : faq.qEn}</span>
                        </span>
                        <span className="text-xs font-bold text-gray-400 transition-transform duration-200 shrink-0">
                          {isExpanded ? '▲' : '▼'}
                        </span>
                      </button>

                      {isExpanded && (
                        <div className="px-4 pb-4 pt-1 text-xs leading-relaxed text-gray-700 border-t border-gray-100 bg-gray-50/50">
                          <p>{isArabic ? faq.aAr : faq.aEn}</p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── Footer Navigation Actions ─────────────────────────────── */}
        <div className="flex items-center justify-between px-5 sm:px-8 py-4 border-t border-[#D9C7B8]/40 bg-white shrink-0">
          {viewMode === 'tour' ? (
            <>
              <button
                type="button"
                onClick={handlePrev}
                disabled={activeStep === 0}
                className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
                  activeStep === 0
                    ? 'opacity-30 cursor-not-allowed text-gray-400'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {isArabic ? '← السابق' : '← Previous'}
              </button>

              <div className="flex items-center gap-1.5">
                {chapters.map((_, i) => (
                  <span
                    key={i}
                    onClick={() => setActiveStep(i)}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      i === activeStep
                        ? 'w-7 bg-[#7D583F]'
                        : 'w-2 bg-gray-200 hover:bg-gray-400'
                    }`}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2.5 text-xs sm:text-sm font-bold text-white transition-all shadow-md bg-gradient-to-r from-[#7D583F] to-[#5A3D2B] hover:brightness-110 rounded-xl shadow-[#7D583F]/25 active:scale-95 cursor-pointer"
              >
                {activeStep === chapters.length - 1
                  ? isArabic
                    ? 'بدء الاستخدام ✓'
                    : 'Get Started ✓'
                  : isArabic
                  ? 'التالي ←'
                  : 'Next →'}
              </button>
            </>
          ) : (
            <div className="w-full flex items-center justify-between">
              <button
                type="button"
                onClick={() => setViewMode('tour')}
                className="text-xs font-bold text-[#7D583F] hover:underline cursor-pointer"
              >
                {isArabic ? '← العودة للجولة الإرشادية' : '← Back to Tour'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 text-xs sm:text-sm font-bold text-white bg-[#7D583F] hover:bg-[#5A3D2B] rounded-xl cursor-pointer"
              >
                {isArabic ? 'إغلاق الدليل' : 'Close Guide'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
