import { useState, lazy, Suspense } from 'react'
import { ClipboardCheck, Users } from 'lucide-react'
import Layout from '@/components/Layout'
import PageLoader from '@/components/PageLoader'

const ServiceAttendanceTab = lazy(() => import('./ServiceAttendanceTab'))
const MeetingAttendanceTab = lazy(() => import('./GroupMeetingOverview'))

type Tab = 'service' | 'meetings'

const tabs: { key: Tab; label: string; icon: typeof ClipboardCheck }[] = [
  { key: 'service', label: 'Service Attendance', icon: ClipboardCheck },
  { key: 'meetings', label: 'Meeting Attendance', icon: Users },
]

export default function Attendance() {
  const [activeTab, setActiveTab] = useState<Tab>('service')

  return (
    <Layout
      title="Attendance"
      subtitle="Track service and group meeting attendance"
    >
      <div className="space-y-5">
        {/* Tab bar */}
        <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                activeTab === tab.key
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <Suspense fallback={<PageLoader />}>
          {activeTab === 'service' && <ServiceAttendanceTab />}
          {activeTab === 'meetings' && <MeetingAttendanceTab />}
        </Suspense>
      </div>
    </Layout>
  )
}
