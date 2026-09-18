import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Edit, Phone, Mail, User, Users, Star, Clock, Briefcase, Zap,
  MapPin, Globe, Building2, Calendar, Shield, BookOpen, Heart, Activity,
  CheckCircle2, Circle, ExternalLink, AlertTriangle,
} from 'lucide-react'
import Layout from '@/components/Layout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ErrorBoundary from '@/components/ui/ErrorBoundary'
import MemberTimeline from '@/components/member/MemberTimeline'
import QuickEditMemberModal from '@/components/member/QuickEditMemberModal'
import { Member, membersService } from '@/services/members'
import { formatDate } from '@/utils/formatters'

export default function MemberDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [member, setMember] = useState<Member | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'profile' | 'timeline'>('profile')
  const [showQuickEdit, setShowQuickEdit] = useState(false)

  useEffect(() => {
    if (id) loadMember(id)
  }, [id])

  const loadMember = async (memberId: string) => {
    try {
      setError(null)
      const memberData = await membersService.getMemberById(memberId)
      setMember(memberData)
    } catch (error: any) {
      console.error('Error loading member:', error)
      setError(error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      MEMBER: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      DC: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      LXL: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
      DIRECTOR: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      PASTOR: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
      CAMPUS_PASTOR: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
      SENIOR_PASTOR: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
      LEFT: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      RELOCATED: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    }
    return colors[status] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
  }

  if (loading) {
    return (
      <Layout title="Member Details">
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    )
  }

  if (error || !member) {
    return (
      <Layout title="Member Details">
        <ErrorBoundary
          error={error || { message: 'Member not found' }}
          onRetry={() => id && loadMember(id)}
        />
      </Layout>
    )
  }

  const hasAddress = member.address && (member.address.street || member.address.city || member.address.landmark || member.address.lga)
  const hasWork = member.occupation || member.profession || member.employer || member.businessName || member.workAddress
  const hasSocialMedia = member.socialMedia && Object.values(member.socialMedia).some(Boolean)
  const hasSkillsOrInterests = (member.ministries && member.ministries.length > 0) || (member.skills && member.skills.length > 0) || (member.interests && member.interests.length > 0)
  const hasFamily = member.spouse || (member.children && member.children.length > 0) || member.parent
  const hasEmergencyContact = member.emergencyContact && member.emergencyContact.name

  const journeySteps = member.spiritualJourney ? [
    { label: 'Foundation Class', ...member.spiritualJourney.foundationClass },
    { label: 'Baptism Class', ...member.spiritualJourney.baptismClass },
    { label: 'Membership Class', ...member.spiritualJourney.membershipClass },
    { label: 'Leadership Class', ...member.spiritualJourney.leadershipClass },
  ] : []
  const completedSteps = journeySteps.filter(s => s.completed).length

  const fullAddress = member.address
    ? [member.address.street, member.address.landmark && `(Near ${member.address.landmark})`, member.address.city, member.address.lga && `${member.address.lga} LGA`, member.address.state, member.address.country].filter(Boolean).join(', ')
    : null

  return (
    <Layout title={`${member.firstName} ${member.lastName}`}>
      <div className="max-w-6xl mx-auto space-y-5">

        {/* ── Header ── */}
        <div className="flex items-center gap-2 mb-1">
          <Button variant="ghost" size="sm" onClick={() => navigate('/members')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">Members</span>
        </div>

        <Card className="p-5">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {member.profilePicture ? (
                <img src={member.profilePicture} alt="" className="h-16 w-16 rounded-full object-cover" />
              ) : (
                <div className="h-16 w-16 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                  <span className="text-xl font-bold text-primary-600 dark:text-primary-400">
                    {member.firstName?.[0]}{member.lastName?.[0]}
                  </span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-xl font-bold text-foreground">{member.firstName} {member.lastName}</h1>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(member.membershipStatus)}`}>
                  {member.membershipStatus?.replace('_', ' ') || 'Member'}
                </span>
                {member.role && typeof member.role === 'object' && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                    <Shield className="h-3 w-3 mr-1" />
                    {member.role.displayName || member.role.name}
                  </span>
                )}
                {!member.isActive && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                    Inactive
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                {member.occupation || member.profession || ''}{(member.occupation || member.profession) ? ' · ' : ''}Member since {formatDate(member.dateJoined)}
              </p>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                {member.phone && (
                  <a href={`tel:${member.phone}`} className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
                    <Phone className="h-3.5 w-3.5" />
                    {member.phone}
                  </a>
                )}
                {member.phone && member.email && <span className="text-border">|</span>}
                {member.email && (
                  <a href={`mailto:${member.email}`} className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors truncate">
                    <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                    {member.email}
                  </a>
                )}
                {(member.phone || member.email) && fullAddress && <span className="text-border hidden sm:inline">|</span>}
                {fullAddress && (
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground truncate">
                    <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="truncate">{member.address?.city}{member.address?.city && member.address?.state ? ', ' : ''}{member.address?.state}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex sm:flex-col gap-2 flex-shrink-0">
              <Button size="sm" onClick={() => navigate(`/members/${member._id}/edit`)}>
                <Edit className="h-3.5 w-3.5 mr-1.5" />
                Edit
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowQuickEdit(true)}>
                <Zap className="h-3.5 w-3.5 mr-1.5" />
                Quick Edit
              </Button>
            </div>
          </div>
        </Card>

        {/* ── Tabs ── */}
        <div className="border-b border-border">
          <nav className="-mb-px flex gap-6">
            {(['profile', 'timeline'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-2.5 border-b-2 text-sm font-medium transition-colors capitalize ${
                  activeTab === tab
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab === 'profile' ? <User className="h-4 w-4 mr-1.5 inline" /> : <Clock className="h-4 w-4 mr-1.5 inline" />}
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {/* ── Tab Content ── */}
        {activeTab === 'profile' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

            {/* ─── Main Column ─── */}
            <div className="lg:col-span-2 space-y-5">

              {/* Contact & Personal */}
              <Card className="p-5">
                <SectionHeader icon={User} title="Personal Information" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                  <InfoRow label="Email" value={member.email} href={`mailto:${member.email}`} />
                  <InfoRow label="Phone" value={member.phone} href={`tel:${member.phone}`} />
                  <InfoRow label="Date of Birth" value={formatDate(member.dateOfBirth)} />
                  <InfoRow label="Gender" value={member.gender} capitalize />
                  <InfoRow label="Marital Status" value={member.maritalStatus?.replace('_', ' ')} capitalize />
                  {member.weddingAnniversary && <InfoRow label="Wedding Anniversary" value={formatDate(member.weddingAnniversary)} />}
                </div>
              </Card>

              {/* Address */}
              {hasAddress && (
                <Card className="p-5">
                  <SectionHeader icon={MapPin} title="Address" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                    {member.address!.street && <InfoRow label="Street" value={member.address!.street} wide />}
                    {member.address!.landmark && <InfoRow label="Nearest Landmark" value={member.address!.landmark} wide />}
                    {member.address!.city && <InfoRow label="City" value={member.address!.city} />}
                    {member.address!.lga && <InfoRow label="LGA" value={member.address!.lga} />}
                    {member.address!.state && <InfoRow label="State" value={member.address!.state} />}
                    {member.address!.country && <InfoRow label="Country" value={member.address!.country} />}
                  </div>
                </Card>
              )}

              {/* Work & Business */}
              {hasWork && (
                <Card className="p-5">
                  <SectionHeader icon={Building2} title="Work & Business" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                    {member.profession && <InfoRow label="Profession" value={member.profession} />}
                    {member.occupation && <InfoRow label="Occupation" value={member.occupation} />}
                    {member.employer && <InfoRow label="Employer" value={member.employer} />}
                    {member.workAddress && <InfoRow label="Work Address" value={member.workAddress} />}
                    {member.businessName && <InfoRow label="Business Name" value={member.businessName} />}
                    {member.businessType && <InfoRow label="Business Type" value={member.businessType} />}
                  </div>
                </Card>
              )}

              {/* Church Information */}
              <Card className="p-5">
                <SectionHeader icon={Star} title="Church Information" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                  <InfoRow label="Date Joined" value={formatDate(member.dateJoined)} />
                  <InfoRow label="Membership Status" value={member.membershipStatus?.replace('_', ' ')} capitalize />
                  {member.memberCategory && <InfoRow label="Member Category" value={member.memberCategory} capitalize />}
                  {member.howLongAttending && <InfoRow label="How Long Attending" value={member.howLongAttending} />}
                  <InfoRow label="District" value={typeof member.district === 'object' ? member.district?.name : member.district || '-'} />
                  {member.unit && <InfoRow label="Unit" value={typeof member.unit === 'object' ? member.unit?.name : member.unit} />}
                  {member.branch && (
                    <InfoRow label="Branch" value={typeof member.branch === 'object' ? member.branch?.name : member.branch} />
                  )}
                  {member.baptismDate && <InfoRow label="Baptism Date" value={formatDate(member.baptismDate)} />}
                  {member.confirmationDate && <InfoRow label="Confirmation Date" value={formatDate(member.confirmationDate)} />}
                  {member.previousChurch && <InfoRow label="Previous Church" value={member.previousChurch} />}
                </div>
              </Card>

              {/* Ministries, Skills & Interests */}
              {hasSkillsOrInterests && (
                <Card className="p-5">
                  <SectionHeader icon={Briefcase} title="Ministries, Skills & Interests" />
                  <div className="space-y-4">
                    {member.ministries && member.ministries.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2">Ministries</p>
                        <div className="flex flex-wrap gap-1.5">
                          {member.ministries.map((m: any, i: number) => (
                            <Badge key={i} variant="default" className="text-xs">{m}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {member.skills && member.skills.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2">Skills</p>
                        <div className="flex flex-wrap gap-1.5">
                          {member.skills.map((s: any, i: number) => (
                            <Badge key={i} variant="secondary" className="text-xs">{s}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {member.interests && member.interests.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2">Interests</p>
                        <div className="flex flex-wrap gap-1.5">
                          {member.interests.map((int: any, i: number) => (
                            <Badge key={i} variant="secondary" className="text-xs">{int}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              )}

              {/* Social Media */}
              {hasSocialMedia && (
                <Card className="p-5">
                  <SectionHeader icon={Globe} title="Social Media" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                    {member.socialMedia!.facebook && <SocialRow platform="Facebook" handle={member.socialMedia!.facebook} />}
                    {member.socialMedia!.instagram && <SocialRow platform="Instagram" handle={member.socialMedia!.instagram} />}
                    {member.socialMedia!.twitter && <SocialRow platform="Twitter / X" handle={member.socialMedia!.twitter} />}
                    {member.socialMedia!.linkedin && <SocialRow platform="LinkedIn" handle={member.socialMedia!.linkedin} />}
                    {member.socialMedia!.tiktok && <SocialRow platform="TikTok" handle={member.socialMedia!.tiktok} />}
                  </div>
                </Card>
              )}

              {/* Notes */}
              {member.notes && (
                <Card className="p-5">
                  <SectionHeader icon={BookOpen} title="Notes" />
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{member.notes}</p>
                </Card>
              )}
            </div>

            {/* ─── Sidebar ─── */}
            <div className="space-y-5">

              {/* Engagement Summary */}
              {member.engagement && (
                <Card className="p-5">
                  <SectionHeader icon={Activity} title="Engagement" />
                  <div className="grid grid-cols-2 gap-3 mt-1">
                    <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">{member.engagement.attendanceCount}</p>
                      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-0.5">Attendance</p>
                    </div>
                    <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{member.engagement.engagementScore}</p>
                      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-0.5">Eng. Score</p>
                    </div>
                  </div>
                  {member.engagement.lastAttendance && (
                    <p className="text-xs text-muted-foreground mt-3">
                      Last attended {formatDate(member.engagement.lastAttendance)}
                    </p>
                  )}
                  {member.lastLogin && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Last login {formatDate(member.lastLogin)}
                    </p>
                  )}
                </Card>
              )}

              {/* Spiritual Journey */}
              {journeySteps.length > 0 && (
                <Card className="p-5">
                  <SectionHeader icon={BookOpen} title="Spiritual Journey" />
                  <p className="text-xs text-muted-foreground mb-3">{completedSteps} of {journeySteps.length} completed</p>
                  <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 mb-4">
                    <div
                      className="bg-primary-500 h-1.5 rounded-full transition-all"
                      style={{ width: `${(completedSteps / journeySteps.length) * 100}%` }}
                    />
                  </div>
                  <div className="space-y-3">
                    {journeySteps.map((step, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        {step.completed ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                        ) : (
                          <Circle className="h-4 w-4 text-gray-300 dark:text-gray-600 mt-0.5 flex-shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className={`text-sm ${step.completed ? 'text-foreground' : 'text-muted-foreground'}`}>{step.label}</p>
                          {step.completed && step.completionDate && (
                            <p className="text-[11px] text-muted-foreground">{formatDate(step.completionDate)}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Family */}
              {hasFamily && (
                <Card className="p-5">
                  <SectionHeader icon={Heart} title="Family" />
                  <div className="space-y-3">
                    {member.spouse && (
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 bg-pink-50 dark:bg-pink-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Heart className="h-3.5 w-3.5 text-pink-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{typeof member.spouse === 'object' ? `${member.spouse?.firstName} ${member.spouse?.lastName}` : member.spouse}</p>
                          <p className="text-[11px] text-muted-foreground">Spouse</p>
                        </div>
                      </div>
                    )}
                    {member.children && member.children.length > 0 && member.children.map((child: any, i: number) => (
                      <div key={i} className="flex items-center gap-2.5">
                        <div className="h-8 w-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          <User className="h-3.5 w-3.5 text-blue-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{typeof child === 'object' ? `${child?.firstName} ${child?.lastName}` : child}</p>
                          <p className="text-[11px] text-muted-foreground">Child</p>
                        </div>
                      </div>
                    ))}
                    {member.parent && (
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 bg-amber-50 dark:bg-amber-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Users className="h-3.5 w-3.5 text-amber-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{typeof member.parent === 'object' ? `${member.parent?.firstName} ${member.parent?.lastName}` : member.parent}</p>
                          <p className="text-[11px] text-muted-foreground">Parent</p>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              )}

              {/* Emergency Contact */}
              {hasEmergencyContact && (
                <Card className="p-5">
                  <SectionHeader icon={AlertTriangle} title="Emergency Contact" />
                  <div className="space-y-2">
                    <InfoRow label="Name" value={member.emergencyContact!.name} />
                    {member.emergencyContact!.relationship && <InfoRow label="Relationship" value={member.emergencyContact!.relationship} />}
                    {member.emergencyContact!.phone && <InfoRow label="Phone" value={member.emergencyContact!.phone} href={`tel:${member.emergencyContact!.phone}`} />}
                    {member.emergencyContact!.email && <InfoRow label="Email" value={member.emergencyContact!.email} href={`mailto:${member.emergencyContact!.email}`} />}
                  </div>
                </Card>
              )}

              {/* System Info */}
              <Card className="p-5">
                <SectionHeader icon={Clock} title="System" />
                <div className="space-y-2">
                  <InfoRow label="Account Status" value={member.isActive ? 'Active' : 'Inactive'} />
                  <InfoRow label="Created" value={formatDate(member.createdAt)} />
                  <InfoRow label="Last Updated" value={formatDate(member.updatedAt)} />
                </div>
              </Card>
            </div>
          </div>
        ) : (
          <MemberTimeline memberId={member._id} />
        )}
      </div>

      <QuickEditMemberModal
        isOpen={showQuickEdit}
        onClose={() => setShowQuickEdit(false)}
        member={member}
        onSuccess={() => { if (id) loadMember(id) }}
      />
    </Layout>
  )
}

function SectionHeader({ icon: Icon, title }: { icon: any; title: string }) {
  return (
    <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
      <Icon className="h-4 w-4 text-primary-500" />
      {title}
    </h2>
  )
}

function InfoRow({ label, value, href, capitalize: cap, wide }: {
  label: string; value?: string | null; href?: string; capitalize?: boolean; wide?: boolean;
}) {
  if (!value || value === '-') {
    return (
      <div className={wide ? 'sm:col-span-2' : ''}>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm text-muted-foreground/60">-</p>
      </div>
    )
  }
  return (
    <div className={wide ? 'sm:col-span-2' : ''}>
      <p className="text-xs text-muted-foreground">{label}</p>
      {href ? (
        <a href={href} className="text-sm text-primary-600 hover:underline truncate block">{cap ? value.charAt(0).toUpperCase() + value.slice(1) : value}</a>
      ) : (
        <p className={`text-sm text-foreground ${cap ? 'capitalize' : ''}`}>{value}</p>
      )}
    </div>
  )
}

function SocialRow({ platform, handle }: { platform: string; handle: string }) {
  const isUrl = handle.startsWith('http')
  return (
    <div>
      <p className="text-xs text-muted-foreground">{platform}</p>
      {isUrl ? (
        <a href={handle} target="_blank" rel="noopener noreferrer" className="text-sm text-primary-600 hover:underline truncate inline-flex items-center gap-1">
          {handle.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
          <ExternalLink className="h-3 w-3 flex-shrink-0" />
        </a>
      ) : (
        <p className="text-sm text-foreground truncate">{handle}</p>
      )}
    </div>
  )
}
