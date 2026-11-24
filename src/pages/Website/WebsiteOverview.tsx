import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BookOpen, Building2, CalendarDays, HelpCircle, FileText, Gift, Hand, Inbox, Layers, Megaphone, PackageSearch, Settings, ShoppingBag, Users, Wallet, type LucideIcon,
} from 'lucide-react'
import Layout from '@/components/Layout'
import Button from '@/components/ui/Button'
import { useAuth } from '@/contexts/AuthContext-unified'
import { getMyLostItems, getSummary, type MyLostItem } from '@/services/website-admin'
import { Empty, ErrorNote, errMsg, fmtDay, Loading, StatusBadge, useWebsiteCan } from './shared'

/** The website admin's "what needs attention" tiles (crm-be /website/summary). */
const TILES: { key: string; label: string; href: string; icon: LucideIcon; color: string }[] = [
  { key: 'newSubmissions', label: 'New form submissions', href: '/website/submissions?status=new', icon: Inbox, color: 'bg-amber-50 text-amber-600' },
  { key: 'ordersToFulfil', label: 'Paid orders to hand over', href: '/store/orders', icon: ShoppingBag, color: 'bg-indigo-50 text-indigo-600' },
  { key: 'lostItemsToReview', label: 'Found items to review', href: '/website/lost-items?status=pending_review', icon: PackageSearch, color: 'bg-rose-50 text-rose-600' },
  { key: 'claimsPending', label: 'Claims to check', href: '/website/claims', icon: Hand, color: 'bg-orange-50 text-orange-600' },
  { key: 'accountsAwaitingApproval', label: 'Giving accounts awaiting approval', href: '/website/giving-accounts?approvalStatus=draft', icon: Wallet, color: 'bg-green-50 text-green-600' },
  { key: 'draftSermons', label: 'Draft sermons', href: '/website/sermons?status=draft', icon: BookOpen, color: 'bg-gray-50 text-gray-600' },
  { key: 'upcomingEvents', label: 'Upcoming events', href: '/website/events?status=published', icon: CalendarDays, color: 'bg-blue-50 text-blue-600' },
]

/** Every website admin screen, grouped as in the website's own admin. `resource` + `action` gate visibility. */
export const WEBSITE_SECTIONS: { group: string; items: { href: string; label: string; resource: string; action?: string; icon: LucideIcon }[] }[] = [
  {
    group: 'Messages',
    items: [
      { href: '/website/sermons', label: 'Sermons', resource: 'sermons', icon: BookOpen },
      { href: '/website/series', label: 'Series', resource: 'series', icon: Layers },
      { href: '/website/devotionals', label: 'Push Buttons', resource: 'devotionals', icon: Megaphone },
      { href: '/website/events', label: 'Events', resource: 'events', icon: CalendarDays },
    ],
  },
  {
    group: 'People & pages',
    items: [
      { href: '/website/pastors', label: 'Pastors', resource: 'pastors', icon: Users },
      { href: '/website/testimonies', label: 'Testimonies', resource: 'testimonies', icon: FileText },
      { href: '/website/units', label: 'Units', resource: 'units', icon: Layers },
      { href: '/website/tribe-groups', label: 'Tribe groups', resource: 'tribe_groups', icon: Users },
      { href: '/website/faqs', label: 'FAQs', resource: 'faqs', icon: HelpCircle },
      { href: '/website/campuses', label: 'Campuses', resource: 'campuses', icon: Building2 },
    ],
  },
  {
    group: 'Shop & giving',
    items: [
      { href: '/website/products', label: 'Products', resource: 'products', icon: ShoppingBag },
      { href: '/website/donations', label: 'Donations', resource: 'donations', action: 'RT', icon: Gift },
      { href: '/website/giving-accounts', label: 'Giving accounts', resource: 'giving_accounts', icon: Wallet },
    ],
  },
  {
    group: 'Care & inbox',
    items: [
      { href: '/website/submissions', label: 'Form submissions', resource: 'form_submissions', action: 'R', icon: Inbox },
      { href: '/website/lost-items', label: 'Lost and found', resource: 'lost_items', action: 'R', icon: PackageSearch },
      { href: '/website/claims', label: 'Claims', resource: 'lost_item_claims', icon: Hand },
    ],
  },
  {
    group: 'Site',
    items: [{ href: '/website/settings', label: 'Site settings', resource: 'site_settings', icon: Settings }],
  },
]

export default function WebsiteOverview() {
  const { member } = useAuth()
  const can = useWebsiteCan()
  const [summary, setSummary] = useState<Record<string, number> | null>(null)
  const [mine, setMine] = useState<MyLostItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  // Workforce: may post found items but not review them.
  const workforce = can('C', 'lost_items') && !can('R', 'lost_items')

  useEffect(() => {
    const fail = (e: unknown) => setError(errMsg(e, 'Couldn’t load the overview.'))
    if (workforce) getMyLostItems().then(setMine, fail)
    else getSummary().then(setSummary, fail)
  }, [workforce])

  const firstName = (member?.firstName as string | undefined) ?? ''

  if (workforce) {
    return (
      <Layout
        title={`Hi ${firstName}`.trim()}
        subtitle="Found something at church? Post it here. The care desk checks it, then it shows on the Care Closet page."
        actions={
          <Link to="/website/lost-items/new">
            <Button size="sm">Post a found item</Button>
          </Link>
        }
      >
        {error && <ErrorNote>{error}</ErrorNote>}
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Items you posted</h2>
        {!mine && !error && <Loading />}
        {mine?.length === 0 && <Empty>Nothing yet.</Empty>}
        {mine && mine.length > 0 && (
          <ul className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
            {mine.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="text-sm font-medium text-gray-900 dark:text-white">{m.description}</span>
                <span className="text-xs text-gray-500">{fmtDay(m.foundOn)}</span>
                <StatusBadge status={m.status} />
              </li>
            ))}
          </ul>
        )}
      </Layout>
    )
  }

  const tiles = TILES.filter((t) => summary && t.key in summary)
  const sections = WEBSITE_SECTIONS.map((s) => ({
    ...s,
    items: s.items.filter((i) => [...(i.action ?? 'R')].some((a) => can(a, i.resource))),
  })).filter((s) => s.items.length)

  return (
    <Layout title="Website" subtitle="What needs attention across the public website, and everything you can manage on it.">
      {error && <ErrorNote>{error}</ErrorNote>}
      {!summary && !error && <Loading />}
      {tiles.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {tiles.map((t) => (
            <Link
              key={t.key}
              to={t.href}
              className={`bg-white dark:bg-gray-800 rounded-xl border p-4 hover:shadow-md transition ${summary![t.key] > 0 ? 'border-primary-200 dark:border-primary-800' : 'border-gray-200 dark:border-gray-700'}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">{t.label}</span>
                <div className={`p-2 rounded-lg ${t.color}`}>
                  <t.icon className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary![t.key]}</p>
            </Link>
          ))}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {sections.map((s) => (
          <section key={s.group} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-3">{s.group}</h2>
            <ul className="space-y-1">
              {s.items.map((i) => (
                <li key={i.href}>
                  <Link to={i.href} className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <i.icon className="w-4 h-4 text-gray-400" />
                    {i.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Layout>
  )
}
