import { lazy, Suspense, useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import ProtectedRoute from '@/components/ProtectedRoute'
import { ModuleAccessGuard } from '@/guards'
import GlobalLoadingIndicator from '@/components/GlobalLoadingIndicator'
import PageLoader from '@/components/PageLoader'
import { PWAPrompt } from '@/components/PWAPrompt'
import { OfflineBanner } from '@/components/OfflineBanner'
import { preloadCommonRoutes } from '@/utils/routePreloader'

// Auth Pages - Load immediately (critical path)
import Login from '@/pages/auth/Login'
import ForgotPassword from '@/pages/auth/ForgotPassword'
import ResetPassword from '@/pages/auth/ResetPassword'

// Public Pages - Load immediately
import LandingPage from '@/pages/LandingPage'
import PublicVisitorRegistration from '@/pages/PublicVisitorRegistration'
import WorkersTrainingRegistration from '@/pages/WorkersTrainingRegistration'
import PublicRequisitionForm from '@/pages/Finance/PublicRequisitionForm'
import PublicRequisitionAction from '@/pages/Finance/PublicRequisitionAction'
import PublicActionResult from '@/pages/Finance/PublicActionResult'
import PublicEventRegistration from '@/pages/PublicEventRegistration'

// Dashboard - Load immediately (most visited)
import Dashboard from '@/pages/Dashboard'

// Lazy loaded pages with prefetch support
const Members = lazy(() => import('@/pages/Members/Members'))
const MemberNew = lazy(() => import('@/pages/Members/MemberNew'))
const MemberEdit = lazy(() => import('@/pages/Members/MemberEdit'))
const MemberDetail = lazy(() => import('@/pages/Members/MemberDetail'))
const MemberAnalytics = lazy(() => import('@/pages/Members/MemberAnalytics'))
const MemberReports = lazy(() => import('@/pages/Members/MemberReports'))

const Groups = lazy(() => import('@/pages/Groups/Groups'))
const GroupNew = lazy(() => import('@/pages/Groups/GroupNew'))
const GroupDetail = lazy(() => import('@/pages/Groups/GroupDetail'))
const GroupEdit = lazy(() => import('@/pages/Groups/GroupEdit'))

const FirstTimers = lazy(() => import('@/pages/FirstTimers/FirstTimers'))
const FirstTimerNew = lazy(() => import('@/pages/FirstTimers/FirstTimerNew'))
const FirstTimerDetail = lazy(() => import('@/pages/FirstTimers/FirstTimerDetail'))
const FirstTimerEdit = lazy(() => import('@/pages/FirstTimers/FirstTimerEdit'))
const FirstTimerEntryImport = lazy(() => import('@/pages/FirstTimers/FirstTimerEntryImport'))
const AssignedFirstTimers = lazy(() => import('@/pages/FirstTimers/AssignedFirstTimers'))
const CallReports = lazy(() => import('@/pages/FirstTimers/CallReports'))
const FirstTimerReports = lazy(() => import('@/pages/FirstTimers/FirstTimerReports'))
const MessageDrafts = lazy(() => import('@/pages/FirstTimers/MessageDrafts'))
const MessageDraftForm = lazy(() => import('@/pages/FirstTimers/MessageDraftForm'))
const MessageDraftDetail = lazy(() => import('@/pages/FirstTimers/MessageDraftDetail'))

const ServiceReports = lazy(() => import('@/pages/ServiceReports/ServiceReports'))
const ServiceReportNew = lazy(() => import('@/pages/ServiceReports/ServiceReportNew'))
const ServiceReportDetail = lazy(() => import('@/pages/ServiceReports/ServiceReportDetail'))
const ServiceReportEdit = lazy(() => import('@/pages/ServiceReports/ServiceReportEdit'))

const Settings = lazy(() => import('@/pages/Settings'))
const UserSettings = lazy(() => import('@/pages/UserSettings'))

const BulkOperationsDashboard = lazy(() => import('@/pages/BulkOperations/BulkOperationsDashboard'))
const BulkUpload = lazy(() => import('@/pages/BulkOperations/BulkUpload'))
const BulkUpdate = lazy(() => import('@/pages/BulkOperations/BulkUpdate'))

const QueueManagement = lazy(() => import('@/pages/Queue/QueueManagement'))
const Analytics = lazy(() => import('@/pages/Reports/Analytics'))

const WorkersTraining = lazy(() => import('@/pages/WorkersTraining/WorkersTraining'))
const CohortManagement = lazy(() => import('@/pages/WorkersTraining/CohortManagement'))
const TraineeAssignment = lazy(() => import('@/pages/WorkersTraining/TraineeAssignment'))

const InventoryDashboard = lazy(() => import('@/pages/Inventory/InventoryDashboard'))
const InventoryItems = lazy(() => import('@/pages/Inventory/InventoryItems'))

const AuditDashboard = lazy(() => import('@/pages/Audit/AuditDashboard'))
const AuditLogs = lazy(() => import('@/pages/Audit/AuditLogs'))

const RolesListPage = lazy(() => import('@/pages/roles').then(m => ({ default: m.RolesListPage })))
const CreateRolePage = lazy(() => import('@/pages/roles').then(m => ({ default: m.CreateRolePage })))
const EditRolePage = lazy(() => import('@/pages/roles').then(m => ({ default: m.EditRolePage })))
const RoleDetailsPage = lazy(() => import('@/pages/roles').then(m => ({ default: m.RoleDetailsPage })))

const UserManagement = lazy(() => import('@/pages/UserManagement'))

const Branches = lazy(() => import('@/pages/Branches').then(m => ({ default: m.Branches })))
const BranchForm = lazy(() => import('@/pages/Branches').then(m => ({ default: m.BranchForm })))
const BranchDetail = lazy(() => import('@/pages/Branches').then(m => ({ default: m.BranchDetail })))

const FinanceDashboard = lazy(() => import('@/pages/Finance/FinanceDashboard'))
const RequisitionNew = lazy(() => import('@/pages/Finance/RequisitionNew'))
const RequisitionsList = lazy(() => import('@/pages/Finance/RequisitionsList'))
const RequisitionDetail = lazy(() => import('@/pages/Finance/RequisitionDetail'))
const PendingApprovals = lazy(() => import('@/pages/Finance/PendingApprovals'))
const PendingDisbursements = lazy(() => import('@/pages/Finance/PendingDisbursements'))
const FormFieldsSettings = lazy(() => import('@/pages/Finance/FormFieldsSettings'))

const EntryImport = lazy(() => import('@/pages/EntryImport'))
const ImportDetail = lazy(() => import('@/pages/EntryImport/ImportDetail'))

const Events = lazy(() => import('@/pages/Events/Events'))
const EventNew = lazy(() => import('@/pages/Events/EventNew'))
const EventDetail = lazy(() => import('@/pages/Events/EventDetail'))
const EventEdit = lazy(() => import('@/pages/Events/EventEdit'))

// Library Management
const LibraryDashboard = lazy(() => import('@/pages/Library/LibraryDashboard'))
const Books = lazy(() => import('@/pages/Library/Books'))
const BookNew = lazy(() => import('@/pages/Library/BookNew'))
const BookDetail = lazy(() => import('@/pages/Library/BookDetail'))
const BookEdit = lazy(() => import('@/pages/Library/BookEdit'))
const LibraryCategories = lazy(() => import('@/pages/Library/Categories'))
const Borrowings = lazy(() => import('@/pages/Library/Borrowings'))
const BorrowingNew = lazy(() => import('@/pages/Library/BorrowingNew'))
const OverdueBooks = lazy(() => import('@/pages/Library/OverdueBooks'))
const MemberBorrowingHistory = lazy(() => import('@/pages/Library/MemberHistory'))

// Bulk Email Management
const BulkEmailDashboard = lazy(() => import('@/pages/BulkEmail/BulkEmailDashboard'))
const EmailTemplates = lazy(() => import('@/pages/BulkEmail/Templates'))
const EmailTemplateNew = lazy(() => import('@/pages/BulkEmail/TemplateNew'))
const EmailTemplateDetail = lazy(() => import('@/pages/BulkEmail/TemplateDetail'))
const EmailTemplateEdit = lazy(() => import('@/pages/BulkEmail/TemplateEdit'))
const EmailCampaigns = lazy(() => import('@/pages/BulkEmail/Campaigns'))
const EmailCampaignNew = lazy(() => import('@/pages/BulkEmail/CampaignNew'))
const EmailCampaignDetail = lazy(() => import('@/pages/BulkEmail/CampaignDetail'))
const EmailCampaignEdit = lazy(() => import('@/pages/BulkEmail/CampaignEdit'))
const EmailSendHistory = lazy(() => import('@/pages/BulkEmail/SendHistory'))

// Wrapper for lazy components with smooth loading
function LazyPage({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<PageLoader />}>
      {children}
    </Suspense>
  )
}

// Scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])

  return null
}

function App() {
  // Preload common routes after initial render
  useEffect(() => {
    preloadCommonRoutes()
  }, [])

  return (
    <>
      <OfflineBanner />
      <GlobalLoadingIndicator />
      <ScrollToTop />
      <PWAPrompt />
      <AnimatePresence mode="wait">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/visitor-registration" element={<PublicVisitorRegistration />} />
          <Route path="/visitor-registration/:branchSlug" element={<PublicVisitorRegistration />} />
          <Route path="/workers-training-registration" element={<WorkersTrainingRegistration />} />
          <Route path="/requisition" element={<PublicRequisitionForm />} />
          <Route path="/requisition/:branchSlug" element={<PublicRequisitionForm />} />
          <Route path="/requisition-action" element={<PublicRequisitionAction />} />
          <Route path="/requisition-result" element={<PublicActionResult />} />
          <Route path="/event-registration/:slug" element={<PublicEventRegistration />} />

          {/* Dashboard - Requires Login Only */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />

          {/* Members */}
          <Route path="/members" element={
            <ProtectedRoute>
              <LazyPage><Members /></LazyPage>
            </ProtectedRoute>
          } />
          <Route path="/members/analytics" element={
            <ProtectedRoute>
              <LazyPage><MemberAnalytics /></LazyPage>
            </ProtectedRoute>
          } />
          <Route path="/members/reports" element={
            <ProtectedRoute>
              <LazyPage><MemberReports /></LazyPage>
            </ProtectedRoute>
          } />
          <Route path="/members/new" element={
            <ProtectedRoute>
              <LazyPage><MemberNew /></LazyPage>
            </ProtectedRoute>
          } />
          <Route path="/members/:id" element={
            <ProtectedRoute>
              <LazyPage><MemberDetail /></LazyPage>
            </ProtectedRoute>
          } />
          <Route path="/members/:id/edit" element={
            <ProtectedRoute>
              <LazyPage><MemberEdit /></LazyPage>
            </ProtectedRoute>
          } />

          {/* Groups */}
          <Route path="/groups" element={
            <ProtectedRoute>
              <LazyPage><Groups /></LazyPage>
            </ProtectedRoute>
          } />
          <Route path="/groups/new" element={
            <ProtectedRoute>
              <LazyPage><GroupNew /></LazyPage>
            </ProtectedRoute>
          } />
          <Route path="/groups/:id" element={
            <ProtectedRoute>
              <LazyPage><GroupDetail /></LazyPage>
            </ProtectedRoute>
          } />
          <Route path="/groups/:id/edit" element={
            <ProtectedRoute>
              <LazyPage><GroupEdit /></LazyPage>
            </ProtectedRoute>
          } />

          {/* First Timers */}
          <Route path="/first-timers" element={
            <ProtectedRoute>
              <LazyPage><FirstTimers /></LazyPage>
            </ProtectedRoute>
          } />
          <Route path="/first-timers/new" element={
            <ProtectedRoute>
              <LazyPage><FirstTimerNew /></LazyPage>
            </ProtectedRoute>
          } />
          <Route path="/first-timers/entry-import" element={
            <ProtectedRoute>
              <LazyPage><FirstTimerEntryImport /></LazyPage>
            </ProtectedRoute>
          } />
          <Route path="/first-timers/:id" element={
            <ProtectedRoute>
              <LazyPage><FirstTimerDetail /></LazyPage>
            </ProtectedRoute>
          } />
          <Route path="/first-timers/:id/edit" element={
            <ProtectedRoute>
              <LazyPage><FirstTimerEdit /></LazyPage>
            </ProtectedRoute>
          } />
          <Route path="/my-assigned-first-timers" element={
            <ProtectedRoute>
              <LazyPage><AssignedFirstTimers /></LazyPage>
            </ProtectedRoute>
          } />
          <Route path="/first-timers/call-reports" element={
            <ProtectedRoute>
              <LazyPage><CallReports /></LazyPage>
            </ProtectedRoute>
          } />
          <Route path="/first-timers/reports" element={
            <ProtectedRoute>
              <LazyPage><FirstTimerReports /></LazyPage>
            </ProtectedRoute>
          } />
          <Route path="/first-timers/message-drafts" element={
            <ProtectedRoute>
              <LazyPage><MessageDrafts /></LazyPage>
            </ProtectedRoute>
          } />
          <Route path="/first-timers/message-drafts/new" element={
            <ProtectedRoute>
              <LazyPage><MessageDraftForm /></LazyPage>
            </ProtectedRoute>
          } />
          <Route path="/first-timers/message-drafts/:id" element={
            <ProtectedRoute>
              <LazyPage><MessageDraftDetail /></LazyPage>
            </ProtectedRoute>
          } />
          <Route path="/first-timers/message-drafts/:id/edit" element={
            <ProtectedRoute>
              <LazyPage><MessageDraftForm /></LazyPage>
            </ProtectedRoute>
          } />

          {/* Service Reports - Under Members section */}
          <Route path="/members/service-reports" element={
            <ProtectedRoute>
              <LazyPage><ServiceReports /></LazyPage>
            </ProtectedRoute>
          } />
          <Route path="/members/service-reports/new" element={
            <ProtectedRoute>
              <LazyPage><ServiceReportNew /></LazyPage>
            </ProtectedRoute>
          } />
          <Route path="/members/service-reports/:id" element={
            <ProtectedRoute>
              <LazyPage><ServiceReportDetail /></LazyPage>
            </ProtectedRoute>
          } />
          <Route path="/members/service-reports/:id/edit" element={
            <ProtectedRoute>
              <LazyPage><ServiceReportEdit /></LazyPage>
            </ProtectedRoute>
          } />

          {/* Bulk Operations */}
          <Route path="/bulk-operations" element={
            <ProtectedRoute>
              <LazyPage><BulkOperationsDashboard /></LazyPage>
            </ProtectedRoute>
          } />
          <Route path="/bulk-operations/upload" element={
            <ProtectedRoute>
              <LazyPage><BulkUpload /></LazyPage>
            </ProtectedRoute>
          } />
          <Route path="/bulk-operations/update" element={
            <ProtectedRoute>
              <LazyPage><BulkUpdate /></LazyPage>
            </ProtectedRoute>
          } />

          {/* User Settings - Personal preferences for all users */}
          <Route path="/my-settings" element={
            <ProtectedRoute>
              <LazyPage><UserSettings /></LazyPage>
            </ProtectedRoute>
          } />

          {/* Admin Settings - System-wide configuration */}
          <Route path="/settings" element={
            <ProtectedRoute>
              <LazyPage><Settings /></LazyPage>
            </ProtectedRoute>
          } />

          {/* Queue Management */}
          <Route path="/queue" element={
            <ProtectedRoute>
              <LazyPage><QueueManagement /></LazyPage>
            </ProtectedRoute>
          } />

          {/* Analytics & Reports */}
          <Route path="/analytics" element={
            <ProtectedRoute>
              <LazyPage><Analytics /></LazyPage>
            </ProtectedRoute>
          } />
          <Route path="/reports" element={
            <ProtectedRoute>
              <LazyPage><Analytics /></LazyPage>
            </ProtectedRoute>
          } />

          {/* Workers Training */}
          <Route path="/workers-training" element={
            <ProtectedRoute>
              <LazyPage><WorkersTraining /></LazyPage>
            </ProtectedRoute>
          } />
          <Route path="/workers-training/cohorts" element={
            <ProtectedRoute>
              <LazyPage><CohortManagement /></LazyPage>
            </ProtectedRoute>
          } />
          <Route path="/workers-training/trainees/assignment" element={
            <ProtectedRoute>
              <LazyPage><TraineeAssignment /></LazyPage>
            </ProtectedRoute>
          } />
          <Route path="/workers-training/cohorts/:cohortId/assignment" element={
            <ProtectedRoute>
              <LazyPage><TraineeAssignment /></LazyPage>
            </ProtectedRoute>
          } />

          {/* Inventory Management */}
          <Route path="/inventory" element={
            <ProtectedRoute>
              <LazyPage><InventoryDashboard /></LazyPage>
            </ProtectedRoute>
          } />
          <Route path="/inventory/dashboard" element={
            <ProtectedRoute>
              <LazyPage><InventoryDashboard /></LazyPage>
            </ProtectedRoute>
          } />
          <Route path="/inventory/items" element={
            <ProtectedRoute>
              <LazyPage><InventoryItems /></LazyPage>
            </ProtectedRoute>
          } />

          {/* Audit Management */}
          <Route path="/audit" element={
            <ProtectedRoute>
              <LazyPage><AuditDashboard /></LazyPage>
            </ProtectedRoute>
          } />
          <Route path="/audit/dashboard" element={
            <ProtectedRoute>
              <LazyPage><AuditDashboard /></LazyPage>
            </ProtectedRoute>
          } />
          <Route path="/audit/logs" element={
            <ProtectedRoute>
              <LazyPage><AuditLogs /></LazyPage>
            </ProtectedRoute>
          } />

          {/* Roles Management - Protected by module access guard */}
          <Route path="/roles" element={
            <ProtectedRoute>
              <ModuleAccessGuard module="roles">
                <LazyPage><RolesListPage /></LazyPage>
              </ModuleAccessGuard>
            </ProtectedRoute>
          } />
          <Route path="/roles/create" element={
            <ProtectedRoute>
              <ModuleAccessGuard module="roles">
                <LazyPage><CreateRolePage /></LazyPage>
              </ModuleAccessGuard>
            </ProtectedRoute>
          } />
          <Route path="/roles/:id" element={
            <ProtectedRoute>
              <ModuleAccessGuard module="roles">
                <LazyPage><RoleDetailsPage /></LazyPage>
              </ModuleAccessGuard>
            </ProtectedRoute>
          } />
          <Route path="/roles/:id/edit" element={
            <ProtectedRoute>
              <ModuleAccessGuard module="roles">
                <LazyPage><EditRolePage /></LazyPage>
              </ModuleAccessGuard>
            </ProtectedRoute>
          } />

          {/* User Management - Protected by permission guard */}
          <Route path="/user-management" element={
            <ProtectedRoute>
              <LazyPage><UserManagement /></LazyPage>
            </ProtectedRoute>
          } />

          {/* Branches Management - Protected by module access guard */}
          <Route path="/branches" element={
            <ProtectedRoute>
              <ModuleAccessGuard module="branches">
                <LazyPage><Branches /></LazyPage>
              </ModuleAccessGuard>
            </ProtectedRoute>
          } />
          <Route path="/branches/new" element={
            <ProtectedRoute>
              <ModuleAccessGuard module="branches">
                <LazyPage><BranchForm mode="create" /></LazyPage>
              </ModuleAccessGuard>
            </ProtectedRoute>
          } />
          <Route path="/branches/:id" element={
            <ProtectedRoute>
              <ModuleAccessGuard module="branches">
                <LazyPage><BranchDetail /></LazyPage>
              </ModuleAccessGuard>
            </ProtectedRoute>
          } />
          <Route path="/branches/:id/edit" element={
            <ProtectedRoute>
              <ModuleAccessGuard module="branches">
                <LazyPage><BranchForm mode="edit" /></LazyPage>
              </ModuleAccessGuard>
            </ProtectedRoute>
          } />

          {/* Finance Management */}
          <Route path="/finance" element={
            <ProtectedRoute>
              <LazyPage><FinanceDashboard /></LazyPage>
            </ProtectedRoute>
          } />
          <Route path="/finance/requisitions" element={
            <ProtectedRoute>
              <LazyPage><RequisitionsList /></LazyPage>
            </ProtectedRoute>
          } />
          <Route path="/finance/requisitions/new" element={
            <ProtectedRoute>
              <LazyPage><RequisitionNew /></LazyPage>
            </ProtectedRoute>
          } />
          <Route path="/finance/requisitions/:id" element={
            <ProtectedRoute>
              <LazyPage><RequisitionDetail /></LazyPage>
            </ProtectedRoute>
          } />
          <Route path="/finance/approvals" element={
            <ProtectedRoute>
              <LazyPage><PendingApprovals /></LazyPage>
            </ProtectedRoute>
          } />
          <Route path="/finance/disbursements" element={
            <ProtectedRoute>
              <LazyPage><PendingDisbursements /></LazyPage>
            </ProtectedRoute>
          } />
          <Route path="/finance/settings/form-fields" element={
            <ProtectedRoute>
              <LazyPage><FormFieldsSettings /></LazyPage>
            </ProtectedRoute>
          } />

          {/* Entry Import - Super Admin Only */}
          <Route path="/entry-import" element={
            <ProtectedRoute>
              <LazyPage><EntryImport /></LazyPage>
            </ProtectedRoute>
          } />
          <Route path="/entry-import/:id" element={
            <ProtectedRoute>
              <LazyPage><ImportDetail /></LazyPage>
            </ProtectedRoute>
          } />

          {/* Events Management */}
          <Route path="/events" element={
            <ProtectedRoute>
              <LazyPage><Events /></LazyPage>
            </ProtectedRoute>
          } />
          <Route path="/events/new" element={
            <ProtectedRoute>
              <LazyPage><EventNew /></LazyPage>
            </ProtectedRoute>
          } />
          <Route path="/events/:id" element={
            <ProtectedRoute>
              <LazyPage><EventDetail /></LazyPage>
            </ProtectedRoute>
          } />
          <Route path="/events/:id/edit" element={
            <ProtectedRoute>
              <LazyPage><EventEdit /></LazyPage>
            </ProtectedRoute>
          } />

          {/* Library Management */}
          <Route path="/library" element={
            <ProtectedRoute>
              <LazyPage><LibraryDashboard /></LazyPage>
            </ProtectedRoute>
          } />
          <Route path="/library/books" element={
            <ProtectedRoute>
              <LazyPage><Books /></LazyPage>
            </ProtectedRoute>
          } />
          <Route path="/library/books/new" element={
            <ProtectedRoute>
              <LazyPage><BookNew /></LazyPage>
            </ProtectedRoute>
          } />
          <Route path="/library/books/:id" element={
            <ProtectedRoute>
              <LazyPage><BookDetail /></LazyPage>
            </ProtectedRoute>
          } />
          <Route path="/library/books/:id/edit" element={
            <ProtectedRoute>
              <LazyPage><BookEdit /></LazyPage>
            </ProtectedRoute>
          } />
          <Route path="/library/categories" element={
            <ProtectedRoute>
              <LazyPage><LibraryCategories /></LazyPage>
            </ProtectedRoute>
          } />
          <Route path="/library/borrowings" element={
            <ProtectedRoute>
              <LazyPage><Borrowings /></LazyPage>
            </ProtectedRoute>
          } />
          <Route path="/library/borrowings/new" element={
            <ProtectedRoute>
              <LazyPage><BorrowingNew /></LazyPage>
            </ProtectedRoute>
          } />
          <Route path="/library/overdue" element={
            <ProtectedRoute>
              <LazyPage><OverdueBooks /></LazyPage>
            </ProtectedRoute>
          } />
          <Route path="/library/member/:memberId" element={
            <ProtectedRoute>
              <LazyPage><MemberBorrowingHistory /></LazyPage>
            </ProtectedRoute>
          } />

          {/* Bulk Email Management */}
          <Route path="/bulk-email" element={
            <ProtectedRoute>
              <LazyPage><BulkEmailDashboard /></LazyPage>
            </ProtectedRoute>
          } />
          <Route path="/bulk-email/templates" element={
            <ProtectedRoute>
              <LazyPage><EmailTemplates /></LazyPage>
            </ProtectedRoute>
          } />
          <Route path="/bulk-email/templates/new" element={
            <ProtectedRoute>
              <LazyPage><EmailTemplateNew /></LazyPage>
            </ProtectedRoute>
          } />
          <Route path="/bulk-email/templates/:id" element={
            <ProtectedRoute>
              <LazyPage><EmailTemplateDetail /></LazyPage>
            </ProtectedRoute>
          } />
          <Route path="/bulk-email/templates/:id/edit" element={
            <ProtectedRoute>
              <LazyPage><EmailTemplateEdit /></LazyPage>
            </ProtectedRoute>
          } />
          <Route path="/bulk-email/campaigns" element={
            <ProtectedRoute>
              <LazyPage><EmailCampaigns /></LazyPage>
            </ProtectedRoute>
          } />
          <Route path="/bulk-email/campaigns/new" element={
            <ProtectedRoute>
              <LazyPage><EmailCampaignNew /></LazyPage>
            </ProtectedRoute>
          } />
          <Route path="/bulk-email/campaigns/:id" element={
            <ProtectedRoute>
              <LazyPage><EmailCampaignDetail /></LazyPage>
            </ProtectedRoute>
          } />
          <Route path="/bulk-email/campaigns/:id/edit" element={
            <ProtectedRoute>
              <LazyPage><EmailCampaignEdit /></LazyPage>
            </ProtectedRoute>
          } />
          <Route path="/bulk-email/history" element={
            <ProtectedRoute>
              <LazyPage><EmailSendHistory /></LazyPage>
            </ProtectedRoute>
          } />
        </Routes>
      </AnimatePresence>
    </>
  )
}

export default App
