import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Building2,
  ArrowLeft,
  Edit,
  MapPin,
  Phone,
  Mail,
  Clock,
  Star,
  User,
  Users,
  Plus,
  Trash2,
  Globe,
  Calendar,
  CheckCircle,
  XCircle,
  UserPlus,
} from 'lucide-react';
import Layout from '@/components/Layout';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { branchesService } from '@/services/branches';
import { membersService } from '@/services/members-unified';
import { useAuth } from '@/contexts/AuthContext-unified';
import type { Branch } from '@/types/branch';
import type { Member } from '@/types';

export default function BranchDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { hasPermission } = useAuth();
  const [branch, setBranch] = useState<Branch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pastor assignment modal
  const [showAssignPastorModal, setShowAssignPastorModal] = useState(false);
  const [assignmentType, setAssignmentType] = useState<'branch' | 'assistant'>('branch');
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [assigning, setAssigning] = useState(false);

  const canUpdateBranch = hasPermission('branches:update');
  const canAssignPastor = hasPermission('branches:assign-pastor');

  useEffect(() => {
    if (id) {
      fetchBranch(id);
    }
  }, [id]);

  const fetchBranch = async (branchId: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await branchesService.getBranchById(branchId);
      setBranch(data);
    } catch (err: any) {
      console.error('Error fetching branch:', err);
      setError(err.message || 'Failed to load branch');
    } finally {
      setLoading(false);
    }
  };

  const openAssignPastorModal = async (type: 'branch' | 'assistant') => {
    setAssignmentType(type);
    setSelectedMemberId('');
    setShowAssignPastorModal(true);

    try {
      setLoadingMembers(true);
      const response = await membersService.getMembers({ limit: 100 });
      setMembers(response.items || []);
    } catch (err) {
      console.error('Error fetching members:', err);
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleAssignPastor = async () => {
    if (!selectedMemberId || !id) return;

    try {
      setAssigning(true);
      if (assignmentType === 'branch') {
        await branchesService.assignBranchPastor(id, { pastorId: selectedMemberId });
      } else {
        await branchesService.addAssistantPastor(id, { pastorId: selectedMemberId });
      }
      setShowAssignPastorModal(false);
      fetchBranch(id);
    } catch (err: any) {
      console.error('Error assigning pastor:', err);
    } finally {
      setAssigning(false);
    }
  };

  const handleRemoveAssistantPastor = async (pastorId: string) => {
    if (!id) return;

    if (!confirm('Are you sure you want to remove this assistant pastor?')) {
      return;
    }

    try {
      await branchesService.removeAssistantPastor(id, pastorId);
      fetchBranch(id);
    } catch (err: any) {
      console.error('Error removing assistant pastor:', err);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  if (error || !branch) {
    return (
      <Layout>
        <div className="text-center py-12">
          <div className="text-red-500 mb-4">{error || 'Branch not found'}</div>
          <Button onClick={() => navigate('/branches')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Branches
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/branches')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-foreground">{branch.name}</h1>
                {branch.isMainBranch && (
                  <Badge variant="warning">
                    <Star className="h-3 w-3 mr-1" />
                    Main Branch
                  </Badge>
                )}
                <Badge variant={branch.isActive ? 'success' : 'secondary'}>
                  {branch.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <p className="text-muted-foreground mt-1">
                Slug: <code className="bg-muted px-1 rounded">{branch.slug}</code>
              </p>
            </div>
          </div>
          {canUpdateBranch && (
            <Button onClick={() => navigate(`/branches/${id}/edit`)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Branch
            </Button>
          )}
        </div>

        {/* Description */}
        {branch.description && (
          <Card className="p-5">
            <p className="text-foreground">{branch.description}</p>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Contact Information */}
          <Card className="p-5">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Phone className="h-5 w-5 text-primary-600" />
              Contact Information
            </h2>
            <div className="space-y-3">
              {branch.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    {branch.address.street && <p>{branch.address.street}</p>}
                    <p>
                      {[branch.address.city, branch.address.state, branch.address.zipCode]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                    {branch.address.country && <p>{branch.address.country}</p>}
                  </div>
                </div>
              )}
              {branch.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <a href={`tel:${branch.phone}`} className="text-primary-600 hover:underline">
                    {branch.phone}
                  </a>
                </div>
              )}
              {branch.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <a href={`mailto:${branch.email}`} className="text-primary-600 hover:underline">
                    {branch.email}
                  </a>
                </div>
              )}
              {branch.timezone && (
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <span>{branch.timezone}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Branch Pastor */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <User className="h-5 w-5 text-primary-600" />
                Branch Pastor
              </h2>
              {canAssignPastor && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openAssignPastorModal('branch')}
                >
                  <UserPlus className="h-4 w-4 mr-1" />
                  {branch.branchPastor ? 'Change' : 'Assign'}
                </Button>
              )}
            </div>

            {branch.branchPastorDetails ? (
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <p className="font-medium">
                    {branch.branchPastorDetails.firstName} {branch.branchPastorDetails.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {branch.branchPastorDetails.email}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No branch pastor assigned yet
              </p>
            )}
          </Card>
        </div>

        {/* Assistant Pastors */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Users className="h-5 w-5 text-primary-600" />
              Assistant Pastors
            </h2>
            {canAssignPastor && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => openAssignPastorModal('assistant')}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Assistant Pastor
              </Button>
            )}
          </div>

          {branch.assistantPastorDetails && branch.assistantPastorDetails.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {branch.assistantPastorDetails.map((pastor) => (
                <div
                  key={pastor._id}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {pastor.firstName} {pastor.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">{pastor.email}</p>
                    </div>
                  </div>
                  {canAssignPastor && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleRemoveAssistantPastor(pastor._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              No assistant pastors assigned yet
            </p>
          )}
        </Card>

        {/* Service Types */}
        {branch.serviceTypes && branch.serviceTypes.length > 0 && (
          <Card className="p-5">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary-600" />
              Service Types
            </h2>
            <div className="flex flex-wrap gap-2">
              {branch.serviceTypes.map((service, index) => (
                <Badge key={index} variant="secondary">
                  {service}
                </Badge>
              ))}
            </div>
          </Card>
        )}

        {/* Metadata */}
        <Card className="p-5">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary-600" />
            Additional Information
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Created</p>
              <p className="font-medium">
                {new Date(branch.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Last Updated</p>
              <p className="font-medium">
                {new Date(branch.updatedAt).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Status</p>
              <div className="flex items-center gap-1 font-medium">
                {branch.isActive ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Active
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-red-600" />
                    Inactive
                  </>
                )}
              </div>
            </div>
            <div>
              <p className="text-muted-foreground">Main Branch</p>
              <div className="flex items-center gap-1 font-medium">
                {branch.isMainBranch ? (
                  <>
                    <Star className="h-4 w-4 text-yellow-600" />
                    Yes
                  </>
                ) : (
                  'No'
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Assign Pastor Modal */}
      <Modal
        isOpen={showAssignPastorModal}
        onClose={() => setShowAssignPastorModal(false)}
        title={assignmentType === 'branch' ? 'Assign Branch Pastor' : 'Add Assistant Pastor'}
      >
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Select a member to {assignmentType === 'branch' ? 'assign as branch pastor' : 'add as assistant pastor'}:
          </p>

          {loadingMembers ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : (
            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Select a member...</option>
              {members.map((member) => (
                <option key={member._id} value={member._id}>
                  {member.firstName} {member.lastName} ({member.email})
                </option>
              ))}
            </select>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowAssignPastorModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAssignPastor}
              disabled={!selectedMemberId || assigning}
            >
              {assigning ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Assigning...
                </>
              ) : (
                'Assign'
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
}
