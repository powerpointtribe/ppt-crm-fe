import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit, Phone, Mail, User, Users, Star, Clock, Briefcase } from 'lucide-react'
import Layout from '@/components/Layout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ErrorBoundary from '@/components/ui/ErrorBoundary'
import MemberTimeline from '@/components/member/MemberTimeline'
import { Member, membersService } from '@/services/members'
import { formatDate } from '@/utils/formatters'

export default function MemberDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [member, setMember] = useState<Member | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'profile' | 'timeline'>('profile')

  useEffect(() => {
    if (id) {
      loadMember(id)
    }
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

  const getStatusBadgeVariant = (status: string): 'default' | 'secondary' | 'success' | 'warning' | 'destructive' => {
    const variants: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'destructive'> = {
      MEMBER: 'default',
      DC: 'secondary',
      LXL: 'secondary',
      DIRECTOR: 'warning',
      PASTOR: 'success',
      SENIOR_PASTOR: 'success',
      LEFT: 'destructive'
    }
    return variants[status] || 'default'
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

  return (
    <Layout title={`${member.firstName} ${member.lastName}`}>
      <div className="max-w-5xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/members')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center">
                <User className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-bold text-foreground">
                    {member.firstName} {member.lastName}
                  </h1>
                  <Badge variant={getStatusBadgeVariant(member.membershipStatus)} className="text-xs">
                    {member.membershipStatus?.replace('_', ' ') || 'Member'}
                  </Badge>
                  {member.role && typeof member.role === 'object' && (
                    <Badge variant="secondary" className="text-xs">
                      {member.role.displayName || member.role.name}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Member since {formatDate(member.dateJoined)}
                </p>
              </div>
            </div>
          </div>
          <Button size="sm" onClick={() => navigate(`/members/${member._id}/edit`)}>
            <Edit className="h-4 w-4 mr-1.5" />
            Edit
          </Button>
        </div>

        {/* Tabs */}
        <div className="border-b border-border">
          <nav className="-mb-px flex gap-6">
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-2 border-b-2 text-sm font-medium transition-colors ${
                activeTab === 'profile'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <User className="h-4 w-4 mr-1.5 inline" />
              Profile
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`py-2 border-b-2 text-sm font-medium transition-colors ${
                activeTab === 'timeline'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Clock className="h-4 w-4 mr-1.5 inline" />
              Timeline
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'profile' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-4">
              {/* Contact & Personal Info */}
              <Card className="p-4">
                <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <User className="h-4 w-4 text-primary-600" />
                  Personal Information
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Email</p>
                    <a href={`mailto:${member.email}`} className="text-primary-600 hover:underline truncate block">
                      {member.email}
                    </a>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Phone</p>
                    <a href={`tel:${member.phone}`} className="text-primary-600 hover:underline">
                      {member.phone}
                    </a>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Date of Birth</p>
                    <p>{formatDate(member.dateOfBirth)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Gender</p>
                    <p className="capitalize">{member.gender}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Marital Status</p>
                    <p className="capitalize">{member.maritalStatus?.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Occupation</p>
                    <p>{member.occupation || '-'}</p>
                  </div>
                  {member.address && (
                    <div className="col-span-2">
                      <p className="text-muted-foreground text-xs">Address</p>
                      <p className="truncate">
                        {[member.address.street, member.address.city, member.address.state].filter(Boolean).join(', ')}
                      </p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Church Information */}
              <Card className="p-4">
                <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Star className="h-4 w-4 text-primary-600" />
                  Church Information
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Date Joined</p>
                    <p>{formatDate(member.dateJoined)}</p>
                  </div>
                  {member.baptismDate && (
                    <div>
                      <p className="text-muted-foreground text-xs">Baptism Date</p>
                      <p>{formatDate(member.baptismDate)}</p>
                    </div>
                  )}
                  {member.confirmationDate && (
                    <div>
                      <p className="text-muted-foreground text-xs">Confirmation</p>
                      <p>{formatDate(member.confirmationDate)}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-muted-foreground text-xs">District</p>
                    <p>{typeof member.district === 'object' ? member.district?.name : member.district || '-'}</p>
                  </div>
                  {member.unit && (
                    <div>
                      <p className="text-muted-foreground text-xs">Unit</p>
                      <p>{typeof member.unit === 'object' ? member.unit?.name : member.unit}</p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Ministries & Skills */}
              {((member.ministries && member.ministries.length > 0) || (member.skills && member.skills.length > 0)) && (
                <Card className="p-4">
                  <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-primary-600" />
                    Ministries & Skills
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {member.ministries && member.ministries.length > 0 && (
                      <div>
                        <p className="text-muted-foreground text-xs mb-1.5">Ministries</p>
                        <div className="flex flex-wrap gap-1">
                          {member.ministries.map((ministry, index) => (
                            <Badge key={index} variant="default" className="text-xs">
                              {ministry}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {member.skills && member.skills.length > 0 && (
                      <div>
                        <p className="text-muted-foreground text-xs mb-1.5">Skills</p>
                        <div className="flex flex-wrap gap-1">
                          {member.skills.map((skill, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              )}

              {/* Notes */}
              {member.notes && (
                <Card className="p-4">
                  <h2 className="text-sm font-semibold mb-2">Notes</h2>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{member.notes}</p>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Quick Actions */}
              <Card className="p-4">
                <h2 className="text-sm font-semibold mb-3">Quick Actions</h2>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" className="text-xs" asChild>
                    <a href={`tel:${member.phone}`}>
                      <Phone className="h-3.5 w-3.5 mr-1" />
                      Call
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs" asChild>
                    <a href={`mailto:${member.email}`}>
                      <Mail className="h-3.5 w-3.5 mr-1" />
                      Email
                    </a>
                  </Button>
                </div>
              </Card>

              {/* Family Information */}
              {(member.spouse || (member.children && member.children.length > 0) || member.parent) && (
                <Card className="p-4">
                  <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary-600" />
                    Family
                  </h2>
                  <div className="space-y-2 text-sm">
                    {member.spouse && (
                      <div>
                        <p className="text-muted-foreground text-xs">Spouse</p>
                        <p>{typeof member.spouse === 'object' ? `${member.spouse?.firstName} ${member.spouse?.lastName}` : member.spouse}</p>
                      </div>
                    )}
                    {member.children && member.children.length > 0 && (
                      <div>
                        <p className="text-muted-foreground text-xs">Children</p>
                        {member.children.map((child, index) => (
                          <p key={index}>{typeof child === 'object' ? `${child?.firstName} ${child?.lastName}` : child}</p>
                        ))}
                      </div>
                    )}
                    {member.parent && (
                      <div>
                        <p className="text-muted-foreground text-xs">Parent</p>
                        <p>{typeof member.parent === 'object' ? `${member.parent?.firstName} ${member.parent?.lastName}` : member.parent}</p>
                      </div>
                    )}
                  </div>
                </Card>
              )}

              {/* Emergency Contact */}
              {member.emergencyContact && member.emergencyContact.name && (
                <Card className="p-4">
                  <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Phone className="h-4 w-4 text-primary-600" />
                    Emergency Contact
                  </h2>
                  <div className="space-y-2 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs">Name</p>
                      <p>{member.emergencyContact.name}</p>
                    </div>
                    {member.emergencyContact.relationship && (
                      <div>
                        <p className="text-muted-foreground text-xs">Relationship</p>
                        <p>{member.emergencyContact.relationship}</p>
                      </div>
                    )}
                    {member.emergencyContact.phone && (
                      <div>
                        <p className="text-muted-foreground text-xs">Phone</p>
                        <a href={`tel:${member.emergencyContact.phone}`} className="text-primary-600 hover:underline">
                          {member.emergencyContact.phone}
                        </a>
                      </div>
                    )}
                  </div>
                </Card>
              )}
            </div>
          </div>
        ) : (
          <MemberTimeline memberId={member._id} />
        )}
      </div>
    </Layout>
  )
}
