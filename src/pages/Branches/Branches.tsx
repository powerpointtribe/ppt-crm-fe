import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Building2,
  Plus,
  Search,
  MapPin,
  Phone,
  Mail,
  User,
  ChevronRight,
  Star,
  ToggleLeft,
  ToggleRight,
  Edit,
  Eye,
} from 'lucide-react';
import Layout from '@/components/Layout';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { branchesService } from '@/services/branches';
import { useAuth } from '@/contexts/AuthContext-unified';
import type { Branch } from '@/types/branch';

export default function Branches() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const canCreateBranch = hasPermission('branches:create');
  const canUpdateBranch = hasPermission('branches:update');
  const canViewDetails = hasPermission('branches:view-details');

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await branchesService.getBranches();
      setBranches(data);
    } catch (err: any) {
      console.error('Error fetching branches:', err);
      setError(err.message || 'Failed to load branches');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (branch: Branch) => {
    try {
      if (branch.isActive) {
        await branchesService.deactivateBranch(branch._id);
      } else {
        await branchesService.reactivateBranch(branch._id);
      }
      fetchBranches();
    } catch (err: any) {
      console.error('Error toggling branch status:', err);
    }
  };

  const filteredBranches = branches.filter(
    (branch) =>
      branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      branch.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      branch.address?.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      branch.address?.state?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeBranches = filteredBranches.filter((b) => b.isActive);
  const inactiveBranches = filteredBranches.filter((b) => !b.isActive);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Building2 className="h-7 w-7 text-primary-600" />
              Church Campuses
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage church campuses and their leadership
            </p>
          </div>
          {canCreateBranch && (
            <Button onClick={() => navigate('/branches/new')}>
              <Plus className="h-4 w-4 mr-2" />
              Add Campus
            </Button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Building2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeBranches.length}</p>
                <p className="text-sm text-muted-foreground">Active Campuses</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Star className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {branches.filter((b) => b.isMainBranch).length}
                </p>
                <p className="text-sm text-muted-foreground">Main Campus</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <ToggleLeft className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{inactiveBranches.length}</p>
                <p className="text-sm text-muted-foreground">Inactive Campuses</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search campuses by name, location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg">
            {error}
          </div>
        )}

        {/* Branches Grid */}
        {filteredBranches.length === 0 ? (
          <Card className="p-8 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground">No campuses found</h3>
            <p className="text-muted-foreground mt-2">
              {searchTerm
                ? 'Try adjusting your search terms'
                : 'Get started by creating your first campus'}
            </p>
            {canCreateBranch && !searchTerm && (
              <Button onClick={() => navigate('/branches/new')} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Create Campus
              </Button>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBranches.map((branch, index) => (
              <motion.div
                key={branch._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="p-5 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start gap-2 mb-3">
                    <h3 className="font-semibold text-foreground truncate">{branch.name}</h3>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {branch.isMainBranch && (
                        <Badge variant="warning" className="text-xs">
                          <Star className="h-3 w-3 mr-1" />
                          Main
                        </Badge>
                      )}
                      <Badge variant={branch.isActive ? 'success' : 'secondary'}>
                        {branch.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {branch.description || 'No description available'}
                  </p>

                  {/* Contact Info */}
                  <div className="space-y-2 text-sm">
                    {branch.address?.city && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4 shrink-0" />
                        <span className="truncate">
                          {[branch.address.city, branch.address.state]
                            .filter(Boolean)
                            .join(', ')}
                        </span>
                      </div>
                    )}
                    {branch.phone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-4 w-4 shrink-0" />
                        <span>{branch.phone}</span>
                      </div>
                    )}
                    {branch.email && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-4 w-4 shrink-0" />
                        <span className="truncate">{branch.email}</span>
                      </div>
                    )}
                  </div>

                  {/* Pastor Info */}
                  {branch.branchPastorDetails && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-primary-600" />
                        <span className="font-medium">Campus Pastor:</span>
                        <span className="text-muted-foreground">
                          {branch.branchPastorDetails.firstName}{' '}
                          {branch.branchPastorDetails.lastName}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border">
                    {canViewDetails && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/branches/${branch._id}`)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    )}
                    {canUpdateBranch && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/branches/${branch._id}/edit`)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleActive(branch)}
                          className={branch.isActive ? 'text-red-600' : 'text-green-600'}
                        >
                          {branch.isActive ? (
                            <>
                              <ToggleRight className="h-4 w-4 mr-1" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <ToggleLeft className="h-4 w-4 mr-1" />
                              Activate
                            </>
                          )}
                        </Button>
                      </>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
