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
  FileText,
} from 'lucide-react';
import Layout from '@/components/Layout';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
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

  // Branch team state
  const [branchMembers, setBranchMembers] = useState<Member[]>([]);
  const [loadingBranchMembers, setLoadingBranchMembers] = useState(false);
  const [leadershipPage, setLeadershipPage] = useState(1);
  const leadershipLimit = 10;

  // Leadership hierarchy: highest rank first
  const leadershipHierarchy: Record<string, number> = {
    SENIOR_PASTOR: 1,
    CAMPUS_PASTOR: 2,
    PASTOR: 3,
    DIRECTOR: 4,
    LXL: 5,
  };

  const leadershipLabels: Record<string, string> = {
    SENIOR_PASTOR: 'Senior Pastor',
    CAMPUS_PASTOR: 'Campus Pastor',
    PASTOR: 'Pastor',
    DIRECTOR: 'Director',
    LXL: 'LXL',
  };

  // Filter and sort leadership members by hierarchy
  const leadershipMembers = branchMembers
    .filter((m) => m.membershipStatus in leadershipHierarchy)
    .sort((a, b) => (leadershipHierarchy[a.membershipStatus] || 99) - (leadershipHierarchy[b.membershipStatus] || 99));

  const leadershipTotal = leadershipMembers.length;
  const leadershipTotalPages = Math.ceil(leadershipTotal / leadershipLimit);
  const paginatedLeadership = leadershipMembers.slice(
    (leadershipPage - 1) * leadershipLimit,
    leadershipPage * leadershipLimit
  );


  // Copy link state
  const [copied, setCopied] = useState(false);
  const [requisitionCopied, setRequisitionCopied] = useState(false);

  // Generate first-timer registration link
  const getFirstTimerLink = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/visitor-registration/${branch?.slug}`;
  };

  // Generate requisition form link
  const getRequisitionLink = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/requisition/${branch?.slug}`;
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

  const copyRequisitionLink = async () => {
    const link = getRequisitionLink();
    try {
      await navigator.clipboard.writeText(link);
      setRequisitionCopied(true);
      setTimeout(() => setRequisitionCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const canUpdateBranch = hasPermission('branches:update');

  useEffect(() => {
    if (id) {
      fetchBranch(id);
      fetchBranchMembers(id);
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

  const fetchBranchMembers = async (branchId: string) => {
    try {
      setLoadingBranchMembers(true);
      const response = await membersService.getMembers({ branchId, limit: 500 });
      setBranchMembers(response.items || []);
    } catch (err) {
      console.error('Error fetching branch members:', err);
    } finally {
      setLoadingBranchMembers(false);
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

        {/* Requisition Form QR Code */}
        <Card className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* QR Code */}
            <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100">
              <QRCodeSVG
                value={getRequisitionLink()}
                size={120}
                level="M"
                includeMargin={false}
              />
            </div>
            {/* Link and Copy */}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                <FileText className="h-4 w-4 text-emerald-600" />
                <h3 className="font-semibold text-foreground text-sm">Requisition Form</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                Scan QR or share link to submit requisitions
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <code className="text-xs bg-white px-2 py-1 rounded border border-gray-200 text-emerald-700 break-all max-w-full">
                  {getRequisitionLink()}
                </code>
                <Button
                  variant={requisitionCopied ? 'primary' : 'outline'}
                  size="sm"
                  onClick={copyRequisitionLink}
                  className={`shrink-0 text-xs ${requisitionCopied ? 'bg-green-600 hover:bg-green-700 border-green-600' : ''}`}
                >
                  {requisitionCopied ? (
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
              {leadershipTotal > 0 && (
                <Badge variant="secondary" className="text-xs ml-1">
                  {leadershipTotal}
                </Badge>
              )}
            </h2>
          </div>

          {loadingBranchMembers ? (
            <div className="flex justify-center py-4">
              <LoadingSpinner size="sm" />
            </div>
          ) : paginatedLeadership.length > 0 ? (
            <>
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
                    {paginatedLeadership.map((member) => (
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
                            {leadershipLabels[member.membershipStatus] || member.membershipStatus}
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

              {leadershipTotalPages > 1 && (
                <div className="flex items-center justify-between pt-3 mt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    Page {leadershipPage} of {leadershipTotalPages}
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setLeadershipPage(leadershipPage - 1)}
                      disabled={leadershipPage <= 1}
                      className="px-2 py-1 text-xs rounded border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setLeadershipPage(leadershipPage + 1)}
                      disabled={leadershipPage >= leadershipTotalPages}
                      className="px-2 py-1 text-xs rounded border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-4">
              <p className="text-muted-foreground text-sm">
                No leadership members in this campus yet
              </p>
            </div>
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

    </Layout>
  );
}
