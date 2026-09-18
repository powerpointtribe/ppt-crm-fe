import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { apiService } from '@/services/api'
import { showToast } from '@/utils/toast'
import {
  Users, Search, Clock, CheckCircle2, XCircle, Eye,
  ChevronLeft, ChevronRight, Loader2, UserCheck, UserPlus,
  X, AlertCircle, Filter, Inbox
} from 'lucide-react'
import Layout from '@/components/Layout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { SkeletonTable } from '@/components/ui/Skeleton'

interface Submission {
  _id: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  dateOfBirth?: string
  gender?: string
  maritalStatus?: string
  weddingAnniversary?: string
  occupation?: string
  profession?: string
  businessName?: string
  businessType?: string
  employer?: string
  workAddress?: string
  interests?: string[]
  skills?: string[]
  socialMedia?: {
    facebook?: string
    instagram?: string
    twitter?: string
    linkedin?: string
    tiktok?: string
  }
  district?: string
  unit?: string
  memberCategory?: string
  howLongAttending?: string
  previousChurch?: string
  address?: {
    street?: string
    city?: string
    state?: string
    country?: string
    lga?: string
    landmark?: string
  }
  emergencyContact?: {
    name?: string
    relationship?: string
    phone?: string
  }
  status: string
  matchedMember?: { _id: string; firstName: string; lastName: string; email?: string }
  processedBy?: { firstName: string; lastName: string }
  processedAt?: string
  createdAt: string
}

interface Stats {
  pending: number
  matched: number
  created: number
  dismissed: number
  total: number
}

interface MemberMatch {
  _id: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  branch?: { name: string }
}

const statusBadgeVariant: Record<string, 'warning' | 'success' | 'default' | 'secondary'> = {
  pending: 'warning',
  matched: 'success',
  created: 'default',
  dismissed: 'secondary',
}

export default function ProfileSubmissions() {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [stats, setStats] = useState<Stats>({ pending: 0, matched: 0, created: 0, dismissed: 0, total: 0 })
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('pending')
  const [page, setPage] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [selected, setSelected] = useState<Submission | null>(null)
  const [matchQuery, setMatchQuery] = useState('')
  const [matchResults, setMatchResults] = useState<MemberMatch[]>([])
  const [searching, setSearching] = useState(false)
  const [processing, setProcessing] = useState(false)
  const limit = 15

  const fetchSubmissions = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiService.get<any>(
        '/members/profile-submissions',
        { params: { status: statusFilter || undefined, page, limit } },
      )
      const data = (res as any).data
      setSubmissions(data.items)
      setTotalItems(data.total)
    } catch {
      showToast.error('Failed to fetch submissions')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, page])

  const fetchStats = useCallback(async () => {
    try {
      const res = await apiService.get<any>('/members/profile-submissions/stats')
      setStats((res as any).data)
    } catch { /* ignore */ }
  }, [])

  useEffect(() => { fetchSubmissions() }, [fetchSubmissions])
  useEffect(() => { fetchStats() }, [fetchStats])

  const searchMembers = async (query: string) => {
    if (query.length < 2) { setMatchResults([]); return }
    setSearching(true)
    try {
      const res = await apiService.get<any>(
        '/members/profile-submissions/search-members',
        { params: { q: query } },
      )
      setMatchResults((res as any).data)
    } catch { setMatchResults([]) }
    finally { setSearching(false) }
  }

  useEffect(() => {
    const timer = setTimeout(() => { if (matchQuery) searchMembers(matchQuery) }, 300)
    return () => clearTimeout(timer)
  }, [matchQuery])

  const handleMatch = async (memberId: string) => {
    if (!selected) return
    setProcessing(true)
    try {
      await apiService.post(`/members/profile-submissions/${selected._id}/match/${memberId}`)
      showToast.success('Submission matched to member successfully')
      setSelected(null)
      setMatchQuery('')
      setMatchResults([])
      fetchSubmissions()
      fetchStats()
    } catch (err: any) {
      showToast.error(err?.response?.data?.message || 'Failed to match')
    } finally { setProcessing(false) }
  }

  const handleDismiss = async (id: string) => {
    setProcessing(true)
    try {
      await apiService.patch(`/members/profile-submissions/${id}/dismiss`)
      showToast.success('Submission dismissed')
      setSelected(null)
      fetchSubmissions()
      fetchStats()
    } catch (err: any) {
      showToast.error(err?.response?.data?.message || 'Failed to dismiss')
    } finally { setProcessing(false) }
  }

  const totalPages = Math.ceil(totalItems / limit)

  const formatDate = (d?: string) => {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  if (loading) {
    return (
      <Layout title="Profile Submissions" subtitle="Review member profile submissions">
        <SkeletonTable />
      </Layout>
    )
  }

  return (
    <Layout title="Profile Submissions" subtitle="Review and match member profile submissions">
      <div className="space-y-6 max-w-full overflow-hidden">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
            { label: 'Matched', value: stats.matched, icon: UserCheck, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
            { label: 'Created', value: stats.created, icon: UserPlus, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
            { label: 'Dismissed', value: stats.dismissed, icon: XCircle, color: 'text-gray-500', bg: 'bg-gray-50 dark:bg-gray-800/50' },
          ].map((s) => (
            <Card key={s.label}>
              <div className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <s.icon size={16} className={s.color} />
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{s.label}</span>
                </div>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            </Card>
          ))}
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={16} className="text-gray-400" />
          {[
            { value: '', label: 'All' },
            { value: 'pending', label: 'Pending' },
            { value: 'matched', label: 'Matched' },
            { value: 'created', label: 'Created' },
            { value: 'dismissed', label: 'Dismissed' },
          ].map((s) => (
            <Button
              key={s.value}
              variant={statusFilter === s.value ? 'primary' : 'outline'}
              size="sm"
              onClick={() => { setStatusFilter(s.value); setPage(1) }}
            >
              {s.label}
            </Button>
          ))}
        </div>

        {/* Table */}
        <Card>
          {submissions.length === 0 ? (
            <div className="text-center py-16">
              <Inbox size={40} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
              <p className="text-sm text-gray-500 dark:text-gray-400">No submissions found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800/50 text-left">
                      <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Name</th>
                      <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Email / Phone</th>
                      <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400 hidden md:table-cell">District / Unit</th>
                      <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Status</th>
                      <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400 hidden sm:table-cell">Submitted</th>
                      <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {submissions.map((sub) => (
                      <tr key={sub._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition">
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                          {sub.firstName} {sub.lastName}
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                          <div>{sub.email || '—'}</div>
                          {sub.phone && <div className="text-xs text-gray-400">{sub.phone}</div>}
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300 hidden md:table-cell">
                          <div>{sub.district || '—'}</div>
                          {sub.unit && <div className="text-xs text-gray-400">{sub.unit}</div>}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={statusBadgeVariant[sub.status] || 'default'}>
                            {sub.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs hidden sm:table-cell">
                          {formatDate(sub.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { setSelected(sub); setMatchQuery(''); setMatchResults([]) }}
                          >
                            <Eye size={14} className="mr-1" /> View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-700">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {totalItems} total · Page {page} of {totalPages}
                  </span>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                      <ChevronLeft size={14} />
                    </Button>
                    <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                      <ChevronRight size={14} />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-900 z-10 rounded-t-2xl">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    {selected.firstName} {selected.lastName}
                  </h2>
                  <Badge variant={statusBadgeVariant[selected.status] || 'default'} className="mt-1">
                    {selected.status}
                  </Badge>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>
                  <X size={18} />
                </Button>
              </div>

              <div className="px-6 py-4 space-y-5">
                {/* Personal */}
                <DetailSection title="Personal Information">
                  <DetailRow label="Full Name" value={`${selected.firstName} ${selected.lastName}`} />
                  <DetailRow label="Email" value={selected.email} />
                  <DetailRow label="Phone" value={selected.phone} />
                  <DetailRow label="Date of Birth" value={formatDate(selected.dateOfBirth)} />
                  <DetailRow label="Gender" value={selected.gender} />
                  <DetailRow label="Marital Status" value={selected.maritalStatus} />
                  {selected.weddingAnniversary && <DetailRow label="Wedding Anniversary" value={selected.weddingAnniversary} />}
                </DetailSection>

                {/* Address */}
                {selected.address && (selected.address.street || selected.address.city || selected.address.state) && (
                  <DetailSection title="Address">
                    <DetailRow label="Street" value={selected.address.street} />
                    <DetailRow label="Landmark" value={selected.address.landmark} />
                    <DetailRow label="City" value={selected.address.city} />
                    <DetailRow label="LGA" value={selected.address.lga} />
                    <DetailRow label="State" value={selected.address.state} />
                    <DetailRow label="Country" value={selected.address.country} />
                  </DetailSection>
                )}

                {/* Work */}
                {(selected.profession || selected.occupation || selected.employer || selected.businessName) && (
                  <DetailSection title="Work & Business">
                    <DetailRow label="Profession" value={selected.profession} />
                    <DetailRow label="Occupation" value={selected.occupation} />
                    <DetailRow label="Employer" value={selected.employer} />
                    <DetailRow label="Work Address" value={selected.workAddress} />
                    <DetailRow label="Business Name" value={selected.businessName} />
                    <DetailRow label="Business Type" value={selected.businessType} />
                  </DetailSection>
                )}

                {/* Church */}
                {(selected.district || selected.unit || selected.memberCategory) && (
                  <DetailSection title="Church Information">
                    <DetailRow label="Member Category" value={selected.memberCategory} />
                    <DetailRow label="District" value={selected.district} />
                    <DetailRow label="Unit" value={selected.unit} />
                    <DetailRow label="Attending Since" value={selected.howLongAttending} />
                    <DetailRow label="Previous Church" value={selected.previousChurch} />
                  </DetailSection>
                )}

                {/* Interests & Skills */}
                {(selected.interests?.length || selected.skills?.length) ? (
                  <DetailSection title="Interests & Skills">
                    {selected.interests?.length ? (
                      <div className="col-span-2 mb-2">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Interests</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selected.interests.map((i, idx) => (
                            <Badge key={idx} variant="default">{i}</Badge>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    {selected.skills?.length ? (
                      <div className="col-span-2">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Skills</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selected.skills.map((s, idx) => (
                            <Badge key={idx} variant="success">{s}</Badge>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </DetailSection>
                ) : null}

                {/* Social Media */}
                {selected.socialMedia && (selected.socialMedia.facebook || selected.socialMedia.instagram || selected.socialMedia.twitter || selected.socialMedia.linkedin || selected.socialMedia.tiktok) && (
                  <DetailSection title="Social Media">
                    <DetailRow label="Facebook" value={selected.socialMedia.facebook} />
                    <DetailRow label="Instagram" value={selected.socialMedia.instagram} />
                    <DetailRow label="Twitter / X" value={selected.socialMedia.twitter} />
                    <DetailRow label="LinkedIn" value={selected.socialMedia.linkedin} />
                    <DetailRow label="TikTok" value={selected.socialMedia.tiktok} />
                  </DetailSection>
                )}

                {/* Emergency */}
                {selected.emergencyContact && (selected.emergencyContact.name || selected.emergencyContact.phone) && (
                  <DetailSection title="Emergency Contact">
                    <DetailRow label="Name" value={selected.emergencyContact.name} />
                    <DetailRow label="Relationship" value={selected.emergencyContact.relationship} />
                    <DetailRow label="Phone" value={selected.emergencyContact.phone} />
                  </DetailSection>
                )}

                {/* Match info */}
                {selected.matchedMember && (
                  <Card>
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <p className="text-sm text-green-800 dark:text-green-300">
                        Matched to <strong>{selected.matchedMember.firstName} {selected.matchedMember.lastName}</strong>
                        {selected.processedBy && (
                          <span> by {selected.processedBy.firstName} {selected.processedBy.lastName}</span>
                        )}
                        {selected.processedAt && <span> on {formatDate(selected.processedAt)}</span>}
                      </p>
                    </div>
                  </Card>
                )}

                {/* Actions for pending submissions */}
                {selected.status === 'pending' && (
                  <div className="border-t border-gray-100 dark:border-gray-700 pt-5">
                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                      <UserCheck size={16} /> Match to Existing Member
                    </h3>
                    <div className="relative mb-3">
                      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={matchQuery}
                        onChange={(e) => setMatchQuery(e.target.value)}
                        placeholder="Search members by name, email, or phone..."
                        className="w-full pl-9 pr-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                      />
                      {searching && <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-gray-400" />}
                    </div>

                    {matchResults.length > 0 && (
                      <Card>
                        <div className="divide-y divide-gray-100 dark:divide-gray-700">
                          {matchResults.map((m) => (
                            <div
                              key={m._id}
                              className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition"
                            >
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">{m.firstName} {m.lastName}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {m.email || m.phone || ''}
                                  {m.branch?.name ? ` · ${m.branch.name}` : ''}
                                </p>
                              </div>
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleMatch(m._id)}
                                disabled={processing}
                              >
                                {processing ? <Loader2 size={12} className="animate-spin mr-1" /> : <UserCheck size={12} className="mr-1" />}
                                Match
                              </Button>
                            </div>
                          ))}
                        </div>
                      </Card>
                    )}

                    {matchQuery.length >= 2 && !searching && matchResults.length === 0 && (
                      <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
                        <AlertCircle size={14} /> No matching members found
                      </div>
                    )}

                    <div className="flex gap-3 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDismiss(selected._id)}
                        disabled={processing}
                      >
                        <XCircle size={14} className="mr-1" /> Dismiss
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  )
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">{title}</h3>
      <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">{children}</div>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value?: string }) {
  if (!value || value === '—') return null
  return (
    <div>
      <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
      <p className="text-sm text-gray-900 dark:text-white">{value}</p>
    </div>
  )
}
