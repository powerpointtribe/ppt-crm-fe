import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Edit, Phone, Mail, MapPin, Calendar, User, Users, Crown, Shield, Star, Clock } from 'lucide-react'
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

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      new_convert: 'bg-green-100 text-green-800',
      worker: 'bg-blue-100 text-blue-800',
      volunteer: 'bg-purple-100 text-purple-800',
      leader: 'bg-yellow-100 text-yellow-800',
      district_pastor: 'bg-red-100 text-red-800',
      champ: 'bg-indigo-100 text-indigo-800',
      unit_head: 'bg-orange-100 text-orange-800',
      inactive: 'bg-gray-100 text-gray-800',
      transferred: 'bg-pink-100 text-pink-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getLeadershipIcon = (role: string) => {
    switch (role) {
      case 'district_pastor': return <Crown className="h-4 w-4" />
      case 'champ': return <Shield className="h-4 w-4" />
      case 'unit_head': return <Star className="h-4 w-4" />
      default: return <User className="h-4 w-4" />
    }
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/members')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Members
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {member.firstName} {member.lastName}
              </h1>
              <p className="text-gray-600">Member since {formatDate(member.dateJoined)}</p>
            </div>
          </div>
          <Button onClick={() => navigate(`/members/${member._id}/edit`)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Member
          </Button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'profile'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <User className="h-4 w-4 mr-2 inline" />
              Profile Information
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'timeline'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Clock className="h-4 w-4 mr-2 inline" />
              Activity Timeline
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'profile' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Full Name</label>
                    <p className="text-gray-900">{member.firstName} {member.lastName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <a href={`mailto:${member.email}`} className="text-blue-600 hover:underline">
                        {member.email}
                      </a>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Phone</label>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <a href={`tel:${member.phone}`} className="text-blue-600 hover:underline">
                        {member.phone}
                      </a>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Date of Birth</label>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <p className="text-gray-900">{formatDate(member.dateOfBirth)}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Gender</label>
                    <p className="text-gray-900 capitalize">{member.gender}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Marital Status</label>
                    <p className="text-gray-900 capitalize">{member.maritalStatus.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Membership Status</label>
                    <div>
                      <Badge className={getStatusColor(member.membershipStatus)}>
                        {member.membershipStatus.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Occupation</label>
                    <p className="text-gray-900">{member.occupation || 'Not specified'}</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Address Information */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Address Information</h2>
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-gray-400 mt-1" />
                <div>
                  <p className="text-gray-900">{member.address.street}</p>
                  <p className="text-gray-600">
                    {member.address.city}, {member.address.state} {member.address.zipCode}
                  </p>
                  <p className="text-gray-600">{member.address.country}</p>
                </div>
              </div>
              {member.workAddress && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <label className="text-sm font-medium text-gray-500">Work Address</label>
                  <p className="text-gray-900 mt-1">{member.workAddress}</p>
                </div>
              )}
            </Card>

            {/* Church Information */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Church Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Date Joined</label>
                    <p className="text-gray-900">{formatDate(member.dateJoined)}</p>
                  </div>
                  {member.baptismDate && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Baptism Date</label>
                      <p className="text-gray-900">{formatDate(member.baptismDate)}</p>
                    </div>
                  )}
                  {member.confirmationDate && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Confirmation Date</label>
                      <p className="text-gray-900">{formatDate(member.confirmationDate)}</p>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">District</label>
                    <p className="text-gray-900">{typeof member.district === 'object' ? member.district?.name : member.district || 'Not assigned'}</p>
                  </div>
                  {member.unit && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Unit</label>
                      <p className="text-gray-900">{typeof member.unit === 'object' ? member.unit?.name : member.unit}</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Ministries & Skills */}
            {(member.ministries && member.ministries.length > 0) || (member.skills && member.skills.length > 0) ? (
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4">Ministries & Skills</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {member.ministries && member.ministries.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Ministries</label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {member.ministries.map((ministry, index) => (
                          <Badge key={index} variant="default">
                            {ministry}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {member.skills && member.skills.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Skills</label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {member.skills.map((skill, index) => (
                          <Badge key={index} variant="secondary">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            ) : null}

            {/* Notes */}
            {member.notes && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4">Notes</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{member.notes}</p>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Leadership Roles */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Leadership Roles</h2>
              <div className="space-y-3">
                {member.leadershipRoles.isDistrictPastor && (
                  <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                    <Crown className="h-5 w-5 text-red-600" />
                    <div>
                      <p className="font-medium text-red-800">District Pastor</p>
                      {member.leadershipRoles.pastorsDistrict && (
                        <p className="text-sm text-red-600">District: {member.leadershipRoles.pastorsDistrict}</p>
                      )}
                    </div>
                  </div>
                )}
                {member.leadershipRoles.isChamp && (
                  <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-lg">
                    <Shield className="h-5 w-5 text-indigo-600" />
                    <div>
                      <p className="font-medium text-indigo-800">Champ</p>
                      {member.leadershipRoles.champForDistrict && (
                        <p className="text-sm text-indigo-600">For District: {member.leadershipRoles.champForDistrict}</p>
                      )}
                    </div>
                  </div>
                )}
                {member.leadershipRoles.isUnitHead && (
                  <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                    <Star className="h-5 w-5 text-orange-600" />
                    <div>
                      <p className="font-medium text-orange-800">Unit Head</p>
                      {member.leadershipRoles.leadsUnit && (
                        <p className="text-sm text-orange-600">Leads Unit: {member.leadershipRoles.leadsUnit}</p>
                      )}
                    </div>
                  </div>
                )}
                {!member.leadershipRoles.isDistrictPastor &&
                 !member.leadershipRoles.isChamp &&
                 !member.leadershipRoles.isUnitHead && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <User className="h-5 w-5 text-gray-400" />
                    <p className="text-gray-600">No leadership roles assigned</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Family Information */}
            {(member.spouse || (member.children && member.children.length > 0) || member.parent) && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4">Family Information</h2>
                <div className="space-y-3">
                  {member.spouse && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Spouse</label>
                      <p className="text-gray-900">{typeof member.spouse === 'object' ? `${member.spouse?.firstName} ${member.spouse?.lastName}` : member.spouse}</p>
                    </div>
                  )}
                  {member.children && member.children.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Children</label>
                      <div className="space-y-1">
                        {member.children.map((child, index) => (
                          <p key={index} className="text-gray-900">{typeof child === 'object' ? `${child?.firstName} ${child?.lastName}` : child}</p>
                        ))}
                      </div>
                    </div>
                  )}
                  {member.parent && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Parent</label>
                      <p className="text-gray-900">{typeof member.parent === 'object' ? `${member.parent?.firstName} ${member.parent?.lastName}` : member.parent}</p>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Emergency Contact */}
            {member.emergencyContact && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4">Emergency Contact</h2>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Name</label>
                    <p className="text-gray-900">{member.emergencyContact.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Relationship</label>
                    <p className="text-gray-900">{member.emergencyContact.relationship}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Phone</label>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <a href={`tel:${member.emergencyContact.phone}`} className="text-blue-600 hover:underline">
                        {member.emergencyContact.phone}
                      </a>
                    </div>
                  </div>
                  {member.emergencyContact.email && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Email</label>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <a href={`mailto:${member.emergencyContact.email}`} className="text-blue-600 hover:underline">
                          {member.emergencyContact.email}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Quick Actions */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Phone className="h-4 w-4 mr-2" />
                  Call Member
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Mail className="h-4 w-4 mr-2" />
                  Send Email
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  View Groups
                </Button>
              </div>
            </Card>
          </div>
        </div>
        ) : (
          <div className="mt-6">
            <MemberTimeline memberId={member._id} />
          </div>
        )}
      </div>
    </Layout>
  )
}