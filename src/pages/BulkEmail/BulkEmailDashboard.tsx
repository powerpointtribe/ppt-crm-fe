import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Mail, FileText, Send, Clock, CheckCircle, Plus, TrendingUp, Users,
  ArrowRight, Sparkles, BookOpen, MailPlus
} from 'lucide-react'
import Layout from '@/components/Layout'
import Card from '@/components/ui/Card'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Badge from '@/components/ui/Badge'
import { bulkEmailService } from '@/services/bulk-email'
import { EmailCampaign } from '@/types/bulk-email'
import { formatDate } from '@/utils/formatters'

const STATUS_DOT: Record<string, string> = {
  draft: 'bg-gray-400',
  scheduled: 'bg-blue-500',
  sending: 'bg-amber-500',
  sent: 'bg-emerald-500',
  failed: 'bg-red-500',
  cancelled: 'bg-gray-400',
}

export default function BulkEmailDashboard() {
  const navigate = useNavigate()
  const [statistics, setStatistics] = useState<any>(null)
  const [recentCampaigns, setRecentCampaigns] = useState<EmailCampaign[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [stats, campaignsRes] = await Promise.all([
        bulkEmailService.getStatistics().catch(() => null),
        bulkEmailService.getCampaigns({ limit: 5 }).catch(() => ({ items: [] })),
      ])
      setStatistics(stats)
      setRecentCampaigns(campaignsRes.items || [])
    } catch {
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Layout title="Messaging">
        <div className="flex justify-center items-center h-64"><LoadingSpinner /></div>
      </Layout>
    )
  }

  const s: any = statistics || {}
  const ds = s.deliveryStats || {}
  const statusMap = s.statusBreakdown || {}
  const totalSent = ds.totalSent || 0
  const totalDelivered = ds.totalDelivered || 0
  const deliveryRate = totalSent > 0 ? ((totalDelivered / totalSent) * 100).toFixed(1) : '0'

  const NAV_CARDS = [
    {
      icon: Send,
      title: 'Campaigns',
      desc: 'Create, schedule, and send bulk emails to your audience',
      path: '/bulk-email/campaigns',
      color: 'from-blue-500 to-blue-600',
      stat: `${s.totalCampaigns || 0} campaigns`,
      action: 'View Campaigns',
    },
    {
      icon: FileText,
      title: 'Templates',
      desc: 'Design reusable email templates with variables and styling',
      path: '/bulk-email/templates',
      color: 'from-purple-500 to-purple-600',
      stat: null,
      action: 'Manage Templates',
    },
    {
      icon: Users,
      title: 'Mailing Lists',
      desc: 'Import CSV contacts, create lists from events, or paste emails',
      path: '/bulk-email/mailing-lists',
      color: 'from-emerald-500 to-emerald-600',
      stat: null,
      action: 'Manage Lists',
    },
  ]

  return (
    <Layout title="Messaging">
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Messaging Hub</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage email campaigns, templates, and mailing lists</p>
          </div>
          <button
            onClick={() => navigate('/bulk-email/campaigns/new')}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#0D7770] hover:bg-[#095D58] text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
          >
            <MailPlus className="w-4 h-4" />
            New Campaign
          </button>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total Campaigns', value: s.totalCampaigns || 0, icon: Send, color: 'text-blue-600 bg-blue-50' },
            { label: 'Sent', value: statusMap.sent || 0, icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50' },
            { label: 'Emails Delivered', value: totalDelivered.toLocaleString(), icon: Mail, color: 'text-purple-600 bg-purple-50' },
            { label: 'Delivery Rate', value: `${deliveryRate}%`, icon: TrendingUp, color: 'text-amber-600 bg-amber-50' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-xl border border-gray-100 p-4"
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Navigation cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {NAV_CARDS.map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.08 }}
            >
              <Link to={card.path} className="block group">
                <div className="bg-white rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all p-5 h-full">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-4`}>
                    <card.icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 mb-1">{card.title}</h3>
                  <p className="text-sm text-gray-500 mb-4 leading-relaxed">{card.desc}</p>
                  <div className="flex items-center justify-between">
                    {card.stat && (
                      <span className="text-xs font-medium text-gray-400">{card.stat}</span>
                    )}
                    <span className="text-xs font-medium text-[#0D7770] group-hover:text-[#095D58] flex items-center gap-1 ml-auto">
                      {card.action} <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Recent campaigns */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-900">Recent Campaigns</h2>
            <Link to="/bulk-email/campaigns" className="text-xs text-[#0D7770] hover:text-[#095D58] font-medium flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {recentCampaigns.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
              <Sparkles className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No campaigns yet. Create your first one!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentCampaigns.map((c, i) => {
                const stats = c.stats || { totalRecipients: 0, sent: 0, delivered: 0 }
                const rate = stats.sent > 0 ? Math.round((stats.delivered / stats.sent) * 100) : 0

                return (
                  <motion.div
                    key={c._id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.04 }}
                  >
                    <Link to={`/bulk-email/campaigns/${c._id}`} className="block">
                      <div className="bg-white rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all px-4 py-3 flex items-center gap-3">
                        <span className={`w-2 h-2 rounded-full ${STATUS_DOT[c.status] || 'bg-gray-400'} shrink-0`}></span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{c.name}</p>
                          <p className="text-xs text-gray-500 truncate">{c.subject}</p>
                        </div>
                        <div className="hidden sm:flex items-center gap-3 shrink-0 text-xs text-gray-500">
                          {c.status === 'sent' && (
                            <span className="text-emerald-600 font-medium">{rate}% delivered</span>
                          )}
                          <span className="capitalize">{c.status}</span>
                          {c.sentAt && <span>{formatDate(c.sentAt)}</span>}
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                      </div>
                    </Link>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
