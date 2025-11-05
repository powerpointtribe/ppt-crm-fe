import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  X,
  Download,
  Calendar,
  Filter,
  Users,
  Group,
  UserPlus
} from 'lucide-react'
import Modal from './Modal'
import Button from './Button'
import Input from './Input'

interface FilterOptions {
  // Date range filters
  dateFrom?: string
  dateTo?: string

  // Member filters
  membershipStatus?: string
  gender?: string
  maritalStatus?: string
  district?: string
  unit?: string
  ageMin?: number
  ageMax?: number

  // Group filters
  groupType?: string
  isActive?: boolean
  maxCapacity?: number

  // First Timer filters
  status?: string
  interestedInJoining?: boolean
  converted?: boolean
  howDidYouHear?: string
  visitorType?: string

  // Common filters
  searchText?: string
}

interface ExportFilterModalProps {
  isOpen: boolean
  onClose: () => void
  onExport: (filters: FilterOptions) => void
  entityType: 'members' | 'groups' | 'first-timers'
  entityName: string
}

export default function ExportFilterModal({
  isOpen,
  onClose,
  onExport,
  entityType,
  entityName
}: ExportFilterModalProps) {
  const [filters, setFilters] = useState<FilterOptions>({})
  const [isExporting, setIsExporting] = useState(false)

  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleExport = async () => {
    setIsExporting(true)
    try {
      await onExport(filters)
      onClose()
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const handleClearFilters = () => {
    setFilters({})
  }

  const getEntityIcon = () => {
    switch (entityType) {
      case 'members': return Users
      case 'groups': return Group
      case 'first-timers': return UserPlus
      default: return Filter
    }
  }

  const EntityIcon = getEntityIcon()

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title={
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <EntityIcon className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Export {entityName}</h2>
            <p className="text-sm text-muted-foreground">Filter and export your data</p>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Common Filters */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
            <Filter className="h-4 w-4" />
            General Filters
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Search"
              placeholder="Search by name, email, phone..."
              value={filters.searchText || ''}
              onChange={(e) => handleFilterChange('searchText', e.target.value)}
            />

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Export Range</label>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Date range</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="From Date"
              type="date"
              value={filters.dateFrom || ''}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            />
            <Input
              label="To Date"
              type="date"
              value={filters.dateTo || ''}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
            />
          </div>
        </div>

        {/* Entity-specific Filters */}
        {entityType === 'members' && (
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-foreground">Member Filters</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Membership Status</label>
                <select
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                  value={filters.membershipStatus || ''}
                  onChange={(e) => handleFilterChange('membershipStatus', e.target.value)}
                >
                  <option value="">All Statuses</option>
                  <option value="new_convert">New Convert</option>
                  <option value="baptized">Baptized</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="member">Member</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Gender</label>
                <select
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                  value={filters.gender || ''}
                  onChange={(e) => handleFilterChange('gender', e.target.value)}
                >
                  <option value="">All Genders</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Marital Status</label>
                <select
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                  value={filters.maritalStatus || ''}
                  onChange={(e) => handleFilterChange('maritalStatus', e.target.value)}
                >
                  <option value="">All Statuses</option>
                  <option value="single">Single</option>
                  <option value="married">Married</option>
                  <option value="divorced">Divorced</option>
                  <option value="widowed">Widowed</option>
                </select>
              </div>

              <Input
                label="District"
                placeholder="Filter by district"
                value={filters.district || ''}
                onChange={(e) => handleFilterChange('district', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Minimum Age"
                type="number"
                placeholder="18"
                value={filters.ageMin || ''}
                onChange={(e) => handleFilterChange('ageMin', parseInt(e.target.value) || undefined)}
              />
              <Input
                label="Maximum Age"
                type="number"
                placeholder="65"
                value={filters.ageMax || ''}
                onChange={(e) => handleFilterChange('ageMax', parseInt(e.target.value) || undefined)}
              />
            </div>
          </div>
        )}

        {entityType === 'groups' && (
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-foreground">Group Filters</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Group Type</label>
                <select
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                  value={filters.groupType || ''}
                  onChange={(e) => handleFilterChange('groupType', e.target.value)}
                >
                  <option value="">All Types</option>
                  <option value="district">District</option>
                  <option value="unit">Unit</option>
                  <option value="ministry">Ministry</option>
                  <option value="fellowship">Fellowship</option>
                  <option value="committee">Committee</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Status</label>
                <select
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                  value={filters.isActive === undefined ? '' : filters.isActive.toString()}
                  onChange={(e) => handleFilterChange('isActive', e.target.value === '' ? undefined : e.target.value === 'true')}
                >
                  <option value="">All Groups</option>
                  <option value="true">Active Only</option>
                  <option value="false">Inactive Only</option>
                </select>
              </div>
            </div>

            <Input
              label="Maximum Capacity"
              type="number"
              placeholder="Filter groups by max capacity"
              value={filters.maxCapacity || ''}
              onChange={(e) => handleFilterChange('maxCapacity', parseInt(e.target.value) || undefined)}
            />
          </div>
        )}

        {entityType === 'first-timers' && (
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-foreground">First Timer Filters</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Status</label>
                <select
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                  value={filters.status || ''}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <option value="">All Statuses</option>
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="engaged">Engaged</option>
                  <option value="converted">Converted</option>
                  <option value="lost">Lost</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Visitor Type</label>
                <select
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                  value={filters.visitorType || ''}
                  onChange={(e) => handleFilterChange('visitorType', e.target.value)}
                >
                  <option value="">All Types</option>
                  <option value="first_time">First Time</option>
                  <option value="returning">Returning</option>
                  <option value="new_to_area">New to Area</option>
                  <option value="church_shopping">Church Shopping</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">How Did You Hear</label>
                <select
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                  value={filters.howDidYouHear || ''}
                  onChange={(e) => handleFilterChange('howDidYouHear', e.target.value)}
                >
                  <option value="">All Sources</option>
                  <option value="friend">Friend</option>
                  <option value="family">Family</option>
                  <option value="advertisement">Advertisement</option>
                  <option value="online">Online</option>
                  <option value="event">Event</option>
                  <option value="social_media">Social Media</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Interest in Joining</label>
                <select
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                  value={filters.interestedInJoining === undefined ? '' : filters.interestedInJoining.toString()}
                  onChange={(e) => handleFilterChange('interestedInJoining', e.target.value === '' ? undefined : e.target.value === 'true')}
                >
                  <option value="">All</option>
                  <option value="true">Interested</option>
                  <option value="false">Not Interested</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Conversion Status</label>
              <select
                className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                value={filters.converted === undefined ? '' : filters.converted.toString()}
                onChange={(e) => handleFilterChange('converted', e.target.value === '' ? undefined : e.target.value === 'true')}
              >
                <option value="">All</option>
                <option value="true">Converted</option>
                <option value="false">Not Converted</option>
              </select>
            </div>
          </div>
        )}

        {/* Filter Summary */}
        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-foreground mb-2">Filter Summary</h4>
          <div className="text-sm text-muted-foreground">
            {Object.keys(filters).length === 0 ? (
              'No filters applied - all records will be exported'
            ) : (
              `${Object.keys(filters).length} filter(s) applied`
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between pt-4 border-t border-border">
          <Button
            variant="ghost"
            onClick={handleClearFilters}
            disabled={Object.keys(filters).length === 0}
          >
            Clear Filters
          </Button>

          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center gap-2"
            >
              {isExporting ? (
                <motion.div
                  className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {isExporting ? 'Exporting...' : 'Export Data'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}