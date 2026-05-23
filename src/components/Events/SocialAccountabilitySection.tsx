import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart3, Users, TrendingUp, Target, Edit, X, Check, ChevronLeft, ChevronRight,
  Instagram, Youtube, Twitter, Smartphone, ExternalLink
} from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { eventsService, EventRegistration } from '@/services/events'
import { useToast } from '@/hooks/useToast'

interface Props {
  eventId: string
  registrations: EventRegistration[]
}

const PLATFORM_ICONS: Record<string, any> = {
  Instagram: Instagram,
  Youtube: Youtube,
  YouTube: Youtube,
  X: Twitter,
  TikTok: Smartphone,
  LinkedIn: Users,
  WhatsApp: Smartphone,
}

export default function SocialAccountabilitySection({ eventId, registrations }: Props) {
  const toast = useToast()
  const [selectedWeek, setSelectedWeek] = useState(1)
  const [loading, setLoading] = useState(false)
  const [overview, setOverview] = useState<any>(null)
  const [editingEntry, setEditingEntry] = useState<any>(null)
  const [saving, setSaving] = useState(false)

  // Form state for editing
  const [form, setForm] = useState({
    postCount: 0,
    engagementRate: 0,
    followerGrowth: 0,
    consistencyScore: 5,
    peerReviewScore: 0,
    notes: '',
    postLinks: [''],
  })

  const loadOverview = useCallback(async () => {
    try {
      setLoading(true)
      const data = await eventsService.getSocialAccountabilityOverview(eventId, selectedWeek)
      setOverview(data)
    } catch (err) {
      console.error('Failed to load accountability:', err)
    } finally {
      setLoading(false)
    }
  }, [eventId, selectedWeek])

  useEffect(() => { loadOverview() }, [loadOverview])

  const openEdit = (reg: EventRegistration, existingEntry?: any) => {
    const platform = reg.customFieldResponses?.platform || reg.customFieldResponses?.get?.('platform') || ''
    setEditingEntry({ registration: reg, entry: existingEntry })
    setForm({
      postCount: existingEntry?.postCount || 0,
      engagementRate: existingEntry?.engagementRate || 0,
      followerGrowth: existingEntry?.followerGrowth || 0,
      consistencyScore: existingEntry?.consistencyScore || 5,
      peerReviewScore: existingEntry?.peerReviewScore || 0,
      notes: existingEntry?.notes || '',
      postLinks: existingEntry?.postLinks?.length ? existingEntry.postLinks : [''],
    })
  }

  const handleSave = async () => {
    if (!editingEntry) return
    try {
      setSaving(true)
      const reg = editingEntry.registration
      const platform = reg.customFieldResponses?.platform || reg.customFieldResponses?.get?.('platform') || ''
      await eventsService.recordSocialAccountability(eventId, {
        registrationId: reg._id,
        week: selectedWeek,
        platform,
        postCount: form.postCount,
        postLinks: form.postLinks.filter(l => l.trim()),
        engagementRate: form.engagementRate,
        followerGrowth: form.followerGrowth,
        consistencyScore: form.consistencyScore,
        peerReviewScore: form.peerReviewScore,
        notes: form.notes,
      })
      toast.success('Accountability recorded')
      setEditingEntry(null)
      loadOverview()
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  // Map entries by registration ID for quick lookup
  const entryMap = new Map<string, any>()
  if (overview?.entries) {
    overview.entries.forEach((e: any) => {
      const regId = e.registration?._id || e.registration
      entryMap.set(regId?.toString(), e)
    })
  }

  const summary = overview?.summary

  return (
    <div className="space-y-4 mt-6">
      {/* Header */}
      <Card className="shadow-sm rounded-lg border-gray-100">
        <div className="p-3 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#0D7770]" />
                Social Media Accountability
              </h3>
              <p className="text-xs text-gray-500">Track weekly posting metrics for the evaluation phase</p>
            </div>
            {/* Week selector */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setSelectedWeek(w => Math.max(1, w - 1))}
                disabled={selectedWeek <= 1}
                className="p-1 rounded hover:bg-gray-200 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {[1, 2, 3, 4, 5, 6].map(w => (
                <button
                  key={w}
                  onClick={() => setSelectedWeek(w)}
                  className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${
                    w === selectedWeek
                      ? 'bg-[#0D7770] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  W{w}
                </button>
              ))}
              <button
                onClick={() => setSelectedWeek(w => Math.min(6, w + 1))}
                disabled={selectedWeek >= 6}
                className="p-1 rounded hover:bg-gray-200 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Summary pills */}
      {summary && (
        <div className="flex gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium bg-white border-gray-200 text-gray-700">
            <Users className="w-3.5 h-3.5" /> {summary.totalParticipants} tracked
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium bg-emerald-50 border-emerald-200 text-emerald-700">
            <Target className="w-3.5 h-3.5" /> Avg {summary.avgPostCount} posts/week
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium bg-blue-50 border-blue-200 text-blue-700">
            <TrendingUp className="w-3.5 h-3.5" /> {summary.avgEngagement}% avg engagement
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium bg-purple-50 border-purple-200 text-purple-700">
            <TrendingUp className="w-3.5 h-3.5" /> +{summary.totalFollowerGrowth} followers
          </div>
        </div>
      )}

      {/* Participants table */}
      {loading ? (
        <div className="flex justify-center py-12"><LoadingSpinner /></div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50/80">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Participant</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Platform</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Posts</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Engagement</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Followers</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Consistency</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Peer</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {registrations.map(reg => {
                  const entry = entryMap.get(reg._id)
                  const platform = reg.customFieldResponses?.platform || reg.customFieldResponses?.get?.('platform') || '—'
                  const PlatformIcon = PLATFORM_ICONS[platform] || Smartphone

                  return (
                    <tr key={reg._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-gradient-to-br from-[#0D7770] to-[#0FA89E] rounded-full flex items-center justify-center text-white text-xs font-semibold">
                            {reg.attendeeInfo.firstName[0]}{reg.attendeeInfo.lastName?.[0] || ''}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{reg.attendeeInfo.firstName} {reg.attendeeInfo.lastName}</div>
                            <div className="text-xs text-gray-500">{reg.checkInCode}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <PlatformIcon className="w-3.5 h-3.5 text-gray-500" />
                          <span className="text-xs text-gray-600">{platform}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {entry ? (
                          <span className="text-sm font-semibold text-gray-900">{entry.postCount}</span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {entry ? (
                          <span className="text-sm text-gray-700">{entry.engagementRate}%</span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {entry ? (
                          <span className={`text-sm font-medium ${entry.followerGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {entry.followerGrowth >= 0 ? '+' : ''}{entry.followerGrowth}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {entry ? (
                          <div className="flex items-center justify-center gap-1">
                            <div className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${entry.consistencyScore >= 7 ? 'bg-green-500' : entry.consistencyScore >= 4 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                style={{ width: `${entry.consistencyScore * 10}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-600">{entry.consistencyScore}/10</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {entry?.peerReviewScore ? (
                          <span className="text-xs text-gray-600">{entry.peerReviewScore}/10</span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => openEdit(reg, entry)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-[#0D7770] transition-colors"
                          title={entry ? 'Edit metrics' : 'Record metrics'}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {registrations.length === 0 && (
            <div className="p-8 text-center text-gray-500 text-sm">No registrations to track</div>
          )}
        </Card>
      )}

      {/* Edit Modal */}
      <AnimatePresence>
        {editingEntry && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setEditingEntry(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    Week {selectedWeek} — {editingEntry.registration.attendeeInfo.firstName} {editingEntry.registration.attendeeInfo.lastName}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {editingEntry.registration.customFieldResponses?.platform || '—'}
                  </p>
                </div>
                <button onClick={() => setEditingEntry(null)} className="p-1 text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Posts this week</label>
                    <input
                      type="number"
                      min={0}
                      value={form.postCount}
                      onChange={e => setForm(f => ({ ...f, postCount: Number(e.target.value) }))}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0D7770]/20 focus:border-[#0D7770] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Engagement Rate (%)</label>
                    <input
                      type="number"
                      min={0}
                      step={0.1}
                      value={form.engagementRate}
                      onChange={e => setForm(f => ({ ...f, engagementRate: Number(e.target.value) }))}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0D7770]/20 focus:border-[#0D7770] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Follower Growth</label>
                    <input
                      type="number"
                      value={form.followerGrowth}
                      onChange={e => setForm(f => ({ ...f, followerGrowth: Number(e.target.value) }))}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0D7770]/20 focus:border-[#0D7770] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Consistency (1-10)</label>
                    <input
                      type="number"
                      min={0}
                      max={10}
                      value={form.consistencyScore}
                      onChange={e => setForm(f => ({ ...f, consistencyScore: Math.min(10, Math.max(0, Number(e.target.value))) }))}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0D7770]/20 focus:border-[#0D7770] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Peer Review Score (1-10)</label>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    value={form.peerReviewScore}
                    onChange={e => setForm(f => ({ ...f, peerReviewScore: Math.min(10, Math.max(0, Number(e.target.value))) }))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0D7770]/20 focus:border-[#0D7770] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Post Links</label>
                  {form.postLinks.map((link, i) => (
                    <div key={i} className="flex gap-1 mb-1">
                      <input
                        type="text"
                        value={link}
                        placeholder="https://..."
                        onChange={e => {
                          const links = [...form.postLinks]
                          links[i] = e.target.value
                          setForm(f => ({ ...f, postLinks: links }))
                        }}
                        className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0D7770]/20 focus:border-[#0D7770] outline-none"
                      />
                      {form.postLinks.length > 1 && (
                        <button
                          onClick={() => setForm(f => ({ ...f, postLinks: f.postLinks.filter((_, j) => j !== i) }))}
                          className="p-1 text-gray-400 hover:text-red-500"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => setForm(f => ({ ...f, postLinks: [...f.postLinks, ''] }))}
                    className="text-xs text-[#0D7770] hover:text-[#095D58] font-medium mt-1"
                  >
                    + Add link
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={form.notes}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    rows={2}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0D7770]/20 focus:border-[#0D7770] outline-none resize-none"
                    placeholder="Optional notes..."
                  />
                </div>
              </div>

              <div className="p-4 border-t border-gray-100 flex justify-end gap-2">
                <Button variant="secondary" size="sm" onClick={() => setEditingEntry(null)} disabled={saving}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSave} disabled={saving}>
                  {saving ? <LoadingSpinner size="sm" /> : <><Check className="w-3.5 h-3.5 mr-1" /> Save</>}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
