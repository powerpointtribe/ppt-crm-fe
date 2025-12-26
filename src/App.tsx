import { Routes, Route, BrowserRouter } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import { ModuleAccessGuard } from '@/guards'
import GlobalLoadingIndicator from '@/components/GlobalLoadingIndicator'

// Auth Pages
import Login from '@/pages/auth/Login'
import ForgotPassword from '@/pages/auth/ForgotPassword'
import ResetPassword from '@/pages/auth/ResetPassword'

// Public Pages
import LandingPage from '@/pages/LandingPage'

// Protected Pages
import Dashboard from '@/pages/Dashboard'
import Members from '@/pages/Members/Members'
import MemberNew from '@/pages/Members/MemberNew'
import MemberEdit from '@/pages/Members/MemberEdit'
import MemberDetail from '@/pages/Members/MemberDetail'
import MemberAnalytics from '@/pages/Members/MemberAnalytics'
import MemberReports from '@/pages/Members/MemberReports'
import Groups from '@/pages/Groups/Groups'
import GroupNew from '@/pages/Groups/GroupNew'
import GroupDetail from '@/pages/Groups/GroupDetail'
import GroupEdit from '@/pages/Groups/GroupEdit'
import FirstTimers from '@/pages/FirstTimers/FirstTimers'
import FirstTimerNew from '@/pages/FirstTimers/FirstTimerNew'
import FirstTimerDetail from '@/pages/FirstTimers/FirstTimerDetail'
import FirstTimerEdit from '@/pages/FirstTimers/FirstTimerEdit'
import AssignedFirstTimers from '@/pages/FirstTimers/AssignedFirstTimers'
import CallReports from '@/pages/FirstTimers/CallReports'
import MessageDrafts from '@/pages/FirstTimers/MessageDrafts'
import MessageDraftForm from '@/pages/FirstTimers/MessageDraftForm'
import MessageDraftDetail from '@/pages/FirstTimers/MessageDraftDetail'
import ServiceReports from '@/pages/ServiceReports/ServiceReports'
import ServiceReportNew from '@/pages/ServiceReports/ServiceReportNew'
import ServiceReportDetail from '@/pages/ServiceReports/ServiceReportDetail'
import ServiceReportEdit from '@/pages/ServiceReports/ServiceReportEdit'
import PublicVisitorRegistration from '@/pages/PublicVisitorRegistration'
import Settings from '@/pages/Settings'

// Bulk Operations Module
import BulkOperationsDashboard from '@/pages/BulkOperations/BulkOperationsDashboard'
import BulkUpload from '@/pages/BulkOperations/BulkUpload'
import BulkUpdate from '@/pages/BulkOperations/BulkUpdate'

// Additional Pages
import QueueManagement from '@/pages/Queue/QueueManagement'
import Analytics from '@/pages/Reports/Analytics'

// Workers Training Pages
import WorkersTraining from '@/pages/WorkersTraining/WorkersTraining'
import CohortManagement from '@/pages/WorkersTraining/CohortManagement'
import TraineeAssignment from '@/pages/WorkersTraining/TraineeAssignment'
import WorkersTrainingRegistration from '@/pages/WorkersTrainingRegistration'

// Inventory Management Pages
import InventoryDashboard from '@/pages/Inventory/InventoryDashboard'
import InventoryItems from '@/pages/Inventory/InventoryItems'

// Audit Management Pages
import AuditDashboard from '@/pages/Audit/AuditDashboard'
import AuditLogs from '@/pages/Audit/AuditLogs'

// Roles Management Pages
import { RolesListPage, CreateRolePage, EditRolePage, RoleDetailsPage } from '@/pages/roles'

// User Management Pages
import UserManagement from '@/pages/UserManagement'

// Branches Management Pages
import { Branches, BranchForm, BranchDetail } from '@/pages/Branches'

function App() {
  return (
    <>
      <GlobalLoadingIndicator />
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

        {/* Dashboard - Requires Login Only */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />

        {/* Members */}
        <Route path="/members" element={
          <ProtectedRoute>
            <Members />
          </ProtectedRoute>
        } />
        <Route path="/members/analytics" element={
          <ProtectedRoute>
            <MemberAnalytics />
          </ProtectedRoute>
        } />
        <Route path="/members/reports" element={
          <ProtectedRoute>
            <MemberReports />
          </ProtectedRoute>
        } />
        <Route path="/members/new" element={
          <ProtectedRoute>
            <MemberNew />
          </ProtectedRoute>
        } />
        <Route path="/members/:id" element={
          <ProtectedRoute>
            <MemberDetail />
          </ProtectedRoute>
        } />
        <Route path="/members/:id/edit" element={
          <ProtectedRoute>
            <MemberEdit />
          </ProtectedRoute>
        } />

        {/* Groups */}
        <Route path="/groups" element={
          <ProtectedRoute>
            <Groups />
          </ProtectedRoute>
        } />
        <Route path="/groups/new" element={
          <ProtectedRoute>
            <GroupNew />
          </ProtectedRoute>
        } />
        <Route path="/groups/:id" element={
          <ProtectedRoute>
            <GroupDetail />
          </ProtectedRoute>
        } />
        <Route path="/groups/:id/edit" element={
          <ProtectedRoute>
            <GroupEdit />
          </ProtectedRoute>
        } />

        {/* First Timers */}
        <Route path="/first-timers" element={
          <ProtectedRoute>
            <FirstTimers />
          </ProtectedRoute>
        } />
        <Route path="/first-timers/new" element={
          <ProtectedRoute>
            <FirstTimerNew />
          </ProtectedRoute>
        } />
        <Route path="/first-timers/:id" element={
          <ProtectedRoute>
            <FirstTimerDetail />
          </ProtectedRoute>
        } />
        <Route path="/first-timers/:id/edit" element={
          <ProtectedRoute>
            <FirstTimerEdit />
          </ProtectedRoute>
        } />
        <Route path="/my-assigned-first-timers" element={
          <ProtectedRoute>
            <AssignedFirstTimers />
          </ProtectedRoute>
        } />
        <Route path="/first-timers/call-reports" element={
          <ProtectedRoute>
            <CallReports />
          </ProtectedRoute>
        } />
        <Route path="/first-timers/message-drafts" element={
          <ProtectedRoute>
            <MessageDrafts />
          </ProtectedRoute>
        } />
        <Route path="/first-timers/message-drafts/new" element={
          <ProtectedRoute>
            <MessageDraftForm />
          </ProtectedRoute>
        } />
        <Route path="/first-timers/message-drafts/:id" element={
          <ProtectedRoute>
            <MessageDraftDetail />
          </ProtectedRoute>
        } />
        <Route path="/first-timers/message-drafts/:id/edit" element={
          <ProtectedRoute>
            <MessageDraftForm />
          </ProtectedRoute>
        } />

        {/* Service Reports - Under Members section */}
        <Route path="/members/service-reports" element={
          <ProtectedRoute>
            <ServiceReports />
          </ProtectedRoute>
        } />
        <Route path="/members/service-reports/new" element={
          <ProtectedRoute>
            <ServiceReportNew />
          </ProtectedRoute>
        } />
        <Route path="/members/service-reports/:id" element={
          <ProtectedRoute>
            <ServiceReportDetail />
          </ProtectedRoute>
        } />
        <Route path="/members/service-reports/:id/edit" element={
          <ProtectedRoute>
            <ServiceReportEdit />
          </ProtectedRoute>
        } />

        {/* Bulk Operations */}
        <Route path="/bulk-operations" element={
          <ProtectedRoute>
            <BulkOperationsDashboard />
          </ProtectedRoute>
        } />
        <Route path="/bulk-operations/upload" element={
          <ProtectedRoute>
            <BulkUpload />
          </ProtectedRoute>
        } />
        <Route path="/bulk-operations/update" element={
          <ProtectedRoute>
            <BulkUpdate />
          </ProtectedRoute>
        } />

        {/* Settings */}
        <Route path="/settings" element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        } />

        {/* Queue Management */}
        <Route path="/queue" element={
          <ProtectedRoute>
            <QueueManagement />
          </ProtectedRoute>
        } />

        {/* Analytics & Reports */}
        <Route path="/analytics" element={
          <ProtectedRoute>
            <Analytics />
          </ProtectedRoute>
        } />
        <Route path="/reports" element={
          <ProtectedRoute>
            <Analytics />
          </ProtectedRoute>
        } />

        {/* Workers Training */}
        <Route path="/workers-training" element={
          <ProtectedRoute>
            <WorkersTraining />
          </ProtectedRoute>
        } />
        <Route path="/workers-training/cohorts" element={
          <ProtectedRoute>
            <CohortManagement />
          </ProtectedRoute>
        } />
        <Route path="/workers-training/trainees/assignment" element={
          <ProtectedRoute>
            <TraineeAssignment />
          </ProtectedRoute>
        } />
        <Route path="/workers-training/cohorts/:cohortId/assignment" element={
          <ProtectedRoute>
            <TraineeAssignment />
          </ProtectedRoute>
        } />

        {/* Inventory Management */}
        <Route path="/inventory" element={
          <ProtectedRoute>
            <InventoryDashboard />
          </ProtectedRoute>
        } />
        <Route path="/inventory/dashboard" element={
          <ProtectedRoute>
            <InventoryDashboard />
          </ProtectedRoute>
        } />
        <Route path="/inventory/items" element={
          <ProtectedRoute>
            <InventoryItems />
          </ProtectedRoute>
        } />

        {/* Audit Management */}
        <Route path="/audit" element={
          <ProtectedRoute>
            <AuditDashboard />
          </ProtectedRoute>
        } />
        <Route path="/audit/dashboard" element={
          <ProtectedRoute>
            <AuditDashboard />
          </ProtectedRoute>
        } />
        <Route path="/audit/logs" element={
          <ProtectedRoute>
            <AuditLogs />
          </ProtectedRoute>
        } />

        {/* Roles Management - Protected by module access guard */}
        <Route path="/roles" element={
          <ProtectedRoute>
            <ModuleAccessGuard module="roles">
              <RolesListPage />
            </ModuleAccessGuard>
          </ProtectedRoute>
        } />
        <Route path="/roles/create" element={
          <ProtectedRoute>
            <ModuleAccessGuard module="roles">
              <CreateRolePage />
            </ModuleAccessGuard>
          </ProtectedRoute>
        } />
        <Route path="/roles/:id" element={
          <ProtectedRoute>
            <ModuleAccessGuard module="roles">
              <RoleDetailsPage />
            </ModuleAccessGuard>
          </ProtectedRoute>
        } />
        <Route path="/roles/:id/edit" element={
          <ProtectedRoute>
            <ModuleAccessGuard module="roles">
              <EditRolePage />
            </ModuleAccessGuard>
          </ProtectedRoute>
        } />

        {/* User Management - Protected by permission guard */}
        <Route path="/user-management" element={
          <ProtectedRoute>
            <UserManagement />
          </ProtectedRoute>
        } />

        {/* Branches Management - Protected by module access guard */}
        <Route path="/branches" element={
          <ProtectedRoute>
            <ModuleAccessGuard module="branches">
              <Branches />
            </ModuleAccessGuard>
          </ProtectedRoute>
        } />
        <Route path="/branches/new" element={
          <ProtectedRoute>
            <ModuleAccessGuard module="branches">
              <BranchForm mode="create" />
            </ModuleAccessGuard>
          </ProtectedRoute>
        } />
        <Route path="/branches/:id" element={
          <ProtectedRoute>
            <ModuleAccessGuard module="branches">
              <BranchDetail />
            </ModuleAccessGuard>
          </ProtectedRoute>
        } />
        <Route path="/branches/:id/edit" element={
          <ProtectedRoute>
            <ModuleAccessGuard module="branches">
              <BranchForm mode="edit" />
            </ModuleAccessGuard>
          </ProtectedRoute>
        } />
        </Routes>
      </AnimatePresence>
    </>
  )
}

export default App
