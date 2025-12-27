import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  ArrowLeft,
  Edit,
  MapPin,
  Phone,
  Mail,
  Clock,
  Star,
  User,
  Users,
  Globe,
  Calendar,
  Copy,
  Check,
  QrCode,
  Shield,
  Search,
} from 'lucide-react';
import Layout from '@/components/Layout';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { branchesService } from '@/services/branches';
import { membersService } from '@/services/members-unified';
import { rolesService, type Role } from '@/services/roles';
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

  // Branch team state
  const [branchMembers, setBranchMembers] = useState<Member[]>([]);
  const [loadingBranchMembers, setLoadingBranchMembers] = useState(false);

  // Roles state (fetched on mount for display)
  const [roles, setRoles] = useState<Role[]>([]);
  const [rolesMap, setRolesMap] = useState<Record<string, Role>>({});

  // Role assignment modal
  const [showAssignRoleModal, setShowAssignRoleModal] = useState(false);
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [loadingModalData, setLoadingModalData] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [memberSearch, setMemberSearch] = useState('');
  const [assigning, setAssigning] = useState(false);

  // Copy link state
  const [copied, setCopied] = useState(false);

  // Generate first-timer registration link
  const getFirstTimerLink = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/visitor-registration/${branch?.slug}`;
  };

  const copyToClipboard = async () => {
    const link = getFirstTimerLink();
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const canUpdateBranch = hasPermission('branches:update');
  const canManageRoles = hasPermission('users:manage') || hasPermission('roles:assign-permissions');

  useEffect(() => {
    if (id) {
      fetchBranch(id);
      fetchBranchMembers(id);
    }
    // Fetch roles for display
    fetchRoles();
  }, [id]);

  const fetchRoles = async () => {
    try {
      const rolesData = await rolesService.getRoles({ isActive: true });
      const rolesArray = Array.isArray(rolesData) ? rolesData : [];
      setRoles(rolesArray);
      // Create lookup map by ID
      const map: Record<string, Role> = {};
      rolesArray.forEach((role) => {
        map[role._id] = role;
      });
      setRolesMap(map);
    } catch (err) {
      console.error('Error fetching roles:', err);
    }
  };

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

  const fetchBranchMembers = async (branchId: string) => {
    try {
      setLoadingBranchMembers(true);
      const response = await membersService.getMembers({ branchId, limit: 100 });
      setBranchMembers(response.items || []);
    } catch (err) {
      console.error('Error fetching branch members:', err);
    } finally {
      setLoadingBranchMembers(false);
    }
  };

  const openAssignRoleModal = async () => {
    setSelectedMemberId('');
    setSelectedRoleId('');
    setMemberSearch('');
    setShowAssignRoleModal(true);

    try {
      setLoadingModalData(true);
      // Fetch members from this branch (roles already fetched on mount)
      const membersResponse = await membersService.getMembers({ branchId: id, limit: 100 });
      setAllMembers(membersResponse?.items || []);
    } catch (err) {
      console.error('Error fetching modal data:', err);
    } finally {
      setLoadingModalData(false);
    }
  };

  const handleAssignRole = async () => {
    if (!selectedMemberId || !selectedRoleId) return;

    try {
      setAssigning(true);
      await membersService.assignRole(selectedMemberId, { roleId: selectedRoleId });
      setShowAssignRoleModal(false);
      // Refresh branch members to show updated roles
      if (id) fetchBranchMembers(id);
    } catch (err: any) {
      console.error('Error assigning role:', err);
    } finally {
      setAssigning(false);
    }
  };

  // Filter members based on search
  const filteredMembers = allMembers.filter((member) => {
    if (!memberSearch) return true;
    const searchLower = memberSearch.toLowerCase();
    return (
      member.firstName.toLowerCase().includes(searchLower) ||
      member.lastName.toLowerCase().includes(searchLower) ||
      member.email.toLowerCase().includes(searchLower)
    );
  });

  // Get members with roles assigned (for display in team section)
  const membersWithRoles = branchMembers.filter((m) => m.role);

  // Helper to get role display name
  const getRoleName = (role: Member['role']): string => {
    if (!role) return 'Member';
    if (typeof role === 'object' && role !== null) {
      return role.displayName || role.name || 'Member';
    }
    // Role is an ID string, look it up in the map
    const roleData = rolesMap[role as string];
    return roleData?.displayName || roleData?.name || 'Member';
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
          <div className="text-red-500 mb-4">{error || 'Campus not found'}</div>
          <Button onClick={() => navigate('/branches')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Campuses
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/branches')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-foreground">{branch.name}</h1>
                {branch.isMainBranch && (
                  <Badge variant="warning" className="text-xs">
                    <Star className="h-3 w-3 mr-1" />
                    Main
                  </Badge>
                )}
                <Badge variant={branch.isActive ? 'success' : 'secondary'} className="text-xs">
                  {branch.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              {branch.description && (
                <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{branch.description}</p>
              )}
            </div>
          </div>
          {canUpdateBranch && (
            <Button size="sm" onClick={() => navigate(`/branches/${id}/edit`)}>
              <Edit className="h-4 w-4 mr-1.5" />
              Edit
            </Button>
          )}
        </div>

        {/* Visitor Registration QR Code */}
        <Card className="p-4 bg-gradient-to-r from-primary-50 to-blue-50 border-primary-200">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* QR Code */}
            <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100">
              <QRCodeSVG
                value={getFirstTimerLink()}
                size={120}
                level="M"
                includeMargin={false}
              />
            </div>
            {/* Link and Copy */}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                <QrCode className="h-4 w-4 text-primary-600" />
                <h3 className="font-semibold text-foreground text-sm">Visitor Registration</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                Scan QR or share link for new visitors
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <code className="text-xs bg-white px-2 py-1 rounded border border-gray-200 text-primary-700 break-all max-w-full">
                  {getFirstTimerLink()}
                </code>
                <Button
                  variant={copied ? 'primary' : 'outline'}
                  size="sm"
                  onClick={copyToClipboard}
                  className={`shrink-0 text-xs ${copied ? 'bg-green-600 hover:bg-green-700 border-green-600' : ''}`}
                >
                  {copied ? (
                    <>
                      <Check className="h-3 w-3 mr-1" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Contact Information */}
        <Card className="p-4">
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Phone className="h-4 w-4 text-primary-600" />
            Contact Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            {branch.address && (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <div className="text-muted-foreground">
                  {branch.address.street && <span>{branch.address.street}, </span>}
                  {[branch.address.city, branch.address.state].filter(Boolean).join(', ')}
                </div>
              </div>
            )}
            {branch.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a href={`tel:${branch.phone}`} className="text-primary-600 hover:underline">
                  {branch.phone}
                </a>
              </div>
            )}
            {branch.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a href={`mailto:${branch.email}`} className="text-primary-600 hover:underline text-xs">
                  {branch.email}
                </a>
              </div>
            )}
            {branch.timezone && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{branch.timezone}</span>
              </div>
            )}
          </div>
        </Card>

        {/* Campus Leadership Team */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Users className="h-4 w-4 text-primary-600" />
              Campus Leadership Team
              {membersWithRoles.length > 0 && (
                <Badge variant="secondary" className="text-xs ml-1">
                  {membersWithRoles.length}
                </Badge>
              )}
            </h2>
            {canManageRoles && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-7 px-2"
                onClick={openAssignRoleModal}
              >
                <Shield className="h-3 w-3 mr-1" />
                Assign Role
              </Button>
            )}
          </div>

          {loadingBranchMembers ? (
            <div className="flex justify-center py-4">
              <LoadingSpinner size="sm" />
            </div>
          ) : membersWithRoles.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground">Name</th>
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground">Role</th>
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground hidden sm:table-cell">Email</th>
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground hidden md:table-cell">Phone</th>
                  </tr>
                </thead>
                <tbody>
                  {membersWithRoles.map((member) => (
                    <tr
                      key={member._id}
                      className="border-b border-border last:border-0 hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/members/${member._id}`)}
                    >
                      <td className="py-2 px-2">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 bg-primary-100 rounded-full flex items-center justify-center shrink-0">
                            <User className="h-3.5 w-3.5 text-primary-600" />
                          </div>
                          <span className="font-medium">
                            {member.firstName} {member.lastName}
                          </span>
                        </div>
                      </td>
                      <td className="py-2 px-2">
                        <Badge variant="secondary" className="text-xs">
                          {getRoleName(member.role)}
                        </Badge>
                      </td>
                      <td className="py-2 px-2 text-muted-foreground hidden sm:table-cell">
                        {member.email}
                      </td>
                      <td className="py-2 px-2 text-muted-foreground hidden md:table-cell">
                        {member.phone || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-muted-foreground text-sm mb-2">
                No leadership team members assigned yet
              </p>
              {canManageRoles && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={openAssignRoleModal}
                >
                  <Shield className="h-3 w-3 mr-1" />
                  Assign First Role
                </Button>
              )}
            </div>
          )}

          {branchMembers.length > 0 && (
            <p className="text-xs text-muted-foreground mt-3 pt-2 border-t">
              {branchMembers.length} total member{branchMembers.length !== 1 ? 's' : ''} in this campus
            </p>
          )}
        </Card>

        {/* Service Types & Metadata combined row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Service Types */}
          {branch.serviceTypes && branch.serviceTypes.length > 0 && (
            <Card className="p-4">
              <h2 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary-600" />
                Service Types
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {branch.serviceTypes.map((service, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {service}
                  </Badge>
                ))}
              </div>
            </Card>
          )}

          {/* Metadata */}
          <Card className="p-4">
            <h2 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary-600" />
              Details
            </h2>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-muted-foreground">Created</p>
                <p className="font-medium">
                  {new Date(branch.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Updated</p>
                <p className="font-medium">
                  {new Date(branch.updatedAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Slug</p>
                <code className="font-medium bg-muted px-1 rounded text-xs">{branch.slug}</code>
              </div>
              <div>
                <p className="text-muted-foreground">Main Campus</p>
                <div className="flex items-center gap-1 font-medium">
                  {branch.isMainBranch ? (
                    <>
                      <Star className="h-3 w-3 text-yellow-600" />
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
      </div>

      {/* Assign Role Modal */}
      <Modal
        isOpen={showAssignRoleModal}
        onClose={() => setShowAssignRoleModal(false)}
        title="Assign Role to Member"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Select a member from this campus and assign them a role.
          </p>

          {loadingModalData ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : (
            <>
              {/* Member Search */}
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Member {allMembers.length > 0 && <span className="text-muted-foreground font-normal">({filteredMembers.length} found)</span>}
                </label>
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search members..."
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <select
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">{allMembers.length === 0 ? 'No members found' : 'Select a member...'}</option>
                  {filteredMembers.map((member) => (
                    <option key={member._id} value={member._id}>
                      {member.firstName} {member.lastName}
                      {member.role && typeof member.role === 'object'
                        ? ` (Current: ${member.role.displayName || member.role.name})`
                        : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Role {roles.length > 0 && <span className="text-muted-foreground font-normal">({roles.length} available)</span>}
                </label>
                <select
                  value={selectedRoleId}
                  onChange={(e) => setSelectedRoleId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">{roles.length === 0 ? 'No roles found' : 'Select a role...'}</option>
                  {roles.map((role) => (
                    <option key={role._id} value={role._id}>
                      {role.displayName || role.name}
                      {role.description ? ` - ${role.description}` : ''}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  The selected role determines what permissions the member will have.
                </p>
              </div>

              {/* Warning */}
              {selectedMemberId && selectedRoleId && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-xs text-yellow-800">
                    The member's permissions will change immediately. They may need to log out and back in to see the changes.
                  </p>
                </div>
              )}
            </>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" size="sm" onClick={() => setShowAssignRoleModal(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleAssignRole}
              disabled={!selectedMemberId || !selectedRoleId || assigning}
            >
              {assigning ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Assigning...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-1.5" />
                  Assign Role
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
}
