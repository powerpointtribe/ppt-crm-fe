import { Routes, Route } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'

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
import Groups from '@/pages/Groups/Groups'
import GroupNew from '@/pages/Groups/GroupNew'
import GroupDetail from '@/pages/Groups/GroupDetail'
import GroupEdit from '@/pages/Groups/GroupEdit'
import FirstTimers from '@/pages/FirstTimers/FirstTimers'
import FirstTimerNew from '@/pages/FirstTimers/FirstTimerNew'
import FirstTimerDetail from '@/pages/FirstTimers/FirstTimerDetail'
import FirstTimerEdit from '@/pages/FirstTimers/FirstTimerEdit'
import PublicVisitorRegistration from '@/pages/PublicVisitorRegistration'
import Settings from '@/pages/Settings'

// Bulk Operations Module
import BulkOperationsDashboard from '@/pages/BulkOperations/BulkOperationsDashboard'
import BulkUpload from '@/pages/BulkOperations/BulkUpload'
import BulkUpdate from '@/pages/BulkOperations/BulkUpdate'

// Additional Pages
import QueueManagement from '@/pages/Queue/QueueManagement'
import Analytics from '@/pages/Reports/Analytics'

function App() {
  return (
    <AnimatePresence mode="wait">
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/visitor-registration" element={<PublicVisitorRegistration />} />

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
      </Routes>
    </AnimatePresence>
  )
}

export default App
