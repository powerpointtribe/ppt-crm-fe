import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import {
  Building2,
  ArrowLeft,
  Save,
  MapPin,
  Phone,
  Mail,
  Globe,
  Clock,
  Star,
  AlertCircle,
} from 'lucide-react';
import Layout from '@/components/Layout';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { branchesService } from '@/services/branches';
import { useAuth } from '@/contexts/AuthContext-unified';
import type { Branch, CreateBranchData } from '@/types/branch';

const branchSchema = z.object({
  name: z
    .string()
    .min(2, 'Branch name must be at least 2 characters')
    .max(100, 'Branch name cannot exceed 100 characters'),
  slug: z
    .string()
    .min(2, 'Slug must be at least 2 characters')
    .max(50, 'Slug cannot exceed 50 characters')
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Slug must be lowercase with hyphens only (e.g., lagos-mainland)'
    ),
  description: z.string().max(500, 'Description cannot exceed 500 characters').optional(),
  phone: z.string().optional(),
  email: z.string().email('Please enter a valid email').optional().or(z.literal('')),
  timezone: z.string().optional(),
  isActive: z.boolean().default(true),
  isMainBranch: z.boolean().default(false),
  address: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      country: z.string().default('Nigeria'),
      zipCode: z.string().optional(),
    })
    .optional(),
  serviceTypes: z.array(z.string()).optional(),
});

type BranchFormData = z.infer<typeof branchSchema>;

interface BranchFormProps {
  mode?: 'create' | 'edit';
}

export default function BranchForm({ mode = 'create' }: BranchFormProps) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { hasPermission } = useAuth();
  const [loading, setLoading] = useState(mode === 'edit');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [branch, setBranch] = useState<Branch | null>(null);

  const isEditMode = mode === 'edit' && id;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BranchFormData>({
    resolver: zodResolver(branchSchema),
    defaultValues: {
      isActive: true,
      isMainBranch: false,
      address: {
        country: 'Nigeria',
      },
      serviceTypes: [],
    },
  });

  const nameValue = watch('name');

  // Auto-generate slug from name
  useEffect(() => {
    if (!isEditMode && nameValue) {
      const generatedSlug = branchesService.generateSlug(nameValue);
      setValue('slug', generatedSlug);
    }
  }, [nameValue, isEditMode, setValue]);

  // Fetch branch data for edit mode
  useEffect(() => {
    if (isEditMode && id) {
      fetchBranch(id);
    }
  }, [id, isEditMode]);

  const fetchBranch = async (branchId: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await branchesService.getBranchById(branchId);
      setBranch(data);

      // Populate form with existing data
      setValue('name', data.name);
      setValue('slug', data.slug);
      setValue('description', data.description || '');
      setValue('phone', data.phone || '');
      setValue('email', data.email || '');
      setValue('timezone', data.timezone || '');
      setValue('isActive', data.isActive);
      setValue('isMainBranch', data.isMainBranch);
      setValue('address', {
        street: data.address?.street || '',
        city: data.address?.city || '',
        state: data.address?.state || '',
        country: data.address?.country || 'Nigeria',
        zipCode: data.address?.zipCode || '',
      });
      setValue('serviceTypes', data.serviceTypes || []);
    } catch (err: any) {
      console.error('Error fetching branch:', err);
      setError(err.message || 'Failed to load branch');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: BranchFormData) => {
    try {
      setSubmitting(true);
      setError(null);

      // Clean up empty email
      const cleanedData: CreateBranchData = {
        ...data,
        email: data.email || undefined,
      };

      if (isEditMode && id) {
        await branchesService.updateBranch(id, cleanedData);
      } else {
        await branchesService.createBranch(cleanedData);
      }

      navigate('/branches');
    } catch (err: any) {
      console.error('Error saving branch:', err);
      setError(err.message || 'Failed to save branch');
    } finally {
      setSubmitting(false);
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

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/branches')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Building2 className="h-7 w-7 text-primary-600" />
              {isEditMode ? 'Edit Branch' : 'Create New Branch'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isEditMode
                ? 'Update branch information and settings'
                : 'Add a new church branch to the system'}
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-start gap-2">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary-600" />
              Basic Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Branch Name *
                </label>
                <Input
                  {...register('name')}
                  placeholder="e.g., Lagos Mainland Branch"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  URL Slug *
                </label>
                <Input
                  {...register('slug')}
                  placeholder="e.g., lagos-mainland"
                  className={errors.slug ? 'border-red-500' : ''}
                />
                {errors.slug && (
                  <p className="text-red-500 text-sm mt-1">{errors.slug.message}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Used in URLs for branch-specific forms
                </p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-1">
                  Description
                </label>
                <textarea
                  {...register('description')}
                  rows={3}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  placeholder="Brief description of the branch..."
                />
                {errors.description && (
                  <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
                )}
              </div>
            </div>
          </Card>

          {/* Contact Information */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Phone className="h-5 w-5 text-primary-600" />
              Contact Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    {...register('phone')}
                    placeholder="+234 xxx xxx xxxx"
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    {...register('email')}
                    type="email"
                    placeholder="branch@church.org"
                    className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                )}
              </div>
            </div>
          </Card>

          {/* Address */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary-600" />
              Address
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-1">
                  Street Address
                </label>
                <Input
                  {...register('address.street')}
                  placeholder="123 Church Street"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  City
                </label>
                <Input {...register('address.city')} placeholder="Lagos" />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  State
                </label>
                <Input {...register('address.state')} placeholder="Lagos" />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Country
                </label>
                <Input {...register('address.country')} placeholder="Nigeria" />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Zip Code
                </label>
                <Input {...register('address.zipCode')} placeholder="100001" />
              </div>
            </div>
          </Card>

          {/* Settings */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary-600" />
              Settings
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Timezone
                </label>
                <select
                  {...register('timezone')}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select timezone</option>
                  <option value="Africa/Lagos">Africa/Lagos (WAT)</option>
                  <option value="Africa/Accra">Africa/Accra (GMT)</option>
                  <option value="Europe/London">Europe/London (GMT/BST)</option>
                  <option value="America/New_York">America/New_York (EST/EDT)</option>
                </select>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  {...register('isActive')}
                  id="isActive"
                  className="h-4 w-4 rounded border-border text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="isActive" className="text-sm text-foreground">
                  Branch is active and visible in the system
                </label>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  {...register('isMainBranch')}
                  id="isMainBranch"
                  className="h-4 w-4 rounded border-border text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="isMainBranch" className="text-sm text-foreground flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-500" />
                  This is the main/headquarters branch
                </label>
              </div>
            </div>
          </Card>

          {/* Submit */}
          <div className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/branches')}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  {isEditMode ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {isEditMode ? 'Update Branch' : 'Create Branch'}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
