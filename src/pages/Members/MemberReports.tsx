import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Download,
  FileText,
  Users,
  MapPin,
  Heart,
  Building2,
  X,
  Calendar,
  FileSpreadsheet,
  File,
  Sparkles,
  ChevronRight,
  ChevronDown
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import Layout from '@/components/Layout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { groupsService, Group } from '@/services/groups'
import { branchesService } from '@/services/branches'
import { membersService, Member } from '@/services/members'
import { showToast } from '@/utils/toast'

interface Report {
  id: string
  name: string
  description: string
  formats: ('pdf' | 'excel' | 'csv')[]
  filters: ('dateRange' | 'branch' | 'district' | 'unit' | 'status' | 'gender' | 'month')[]
}

interface ReportCategory {
  id: string
  title: string
  icon: any
  color: string
  gradient: string
  reports: Report[]
}

const reportCategories: ReportCategory[] = [
  {
    id: 'membership',
    title: 'Membership',
    icon: Users,
    color: 'bg-blue-500',
    gradient: 'from-blue-500 to-blue-600',
    reports: [
      { id: 'all-members', name: 'All Members', description: 'Complete member directory', formats: ['pdf', 'excel', 'csv'], filters: ['branch', 'district', 'status', 'gender'] },
      { id: 'active-members', name: 'Active Members', description: 'Currently active members', formats: ['pdf', 'excel', 'csv'], filters: ['branch', 'district'] },
      { id: 'inactive-members', name: 'Inactive Members', description: 'Inactive member list', formats: ['pdf', 'excel'], filters: ['branch', 'district', 'dateRange'] },
      { id: 'new-members', name: 'New Members', description: 'Recently joined members', formats: ['pdf', 'excel', 'csv'], filters: ['dateRange', 'branch', 'district'] },
    ]
  },
  {
    id: 'location',
    title: 'Location',
    icon: MapPin,
    color: 'bg-emerald-500',
    gradient: 'from-emerald-500 to-emerald-600',
    reports: [
      { id: 'by-district', name: 'By District', description: 'Members grouped by district', formats: ['pdf', 'excel'], filters: ['branch', 'district'] },
      { id: 'by-branch', name: 'By Branch', description: 'Members grouped by branch', formats: ['pdf', 'excel'], filters: ['branch'] },
      { id: 'unassigned', name: 'Unassigned', description: 'Members without location', formats: ['pdf', 'excel', 'csv'], filters: ['branch'] },
    ]
  },
  {
    id: 'units',
    title: 'Units',
    icon: Building2,
    color: 'bg-violet-500',
    gradient: 'from-violet-500 to-violet-600',
    reports: [
      { id: 'by-unit', name: 'By Unit', description: 'Members grouped by unit', formats: ['pdf', 'excel'], filters: ['branch', 'unit'] },
      { id: 'unit-leaders', name: 'Unit Leaders', description: 'All unit leadership', formats: ['pdf', 'excel'], filters: ['branch', 'unit'] },
    ]
  },
  {
    id: 'demographics',
    title: 'Demographics',
    icon: Heart,
    color: 'bg-rose-500',
    gradient: 'from-rose-500 to-rose-600',
    reports: [
      { id: 'age-distribution', name: 'Age Distribution', description: 'Members by age group', formats: ['pdf', 'excel'], filters: ['branch', 'district', 'gender'] },
      { id: 'gender-distribution', name: 'Gender Distribution', description: 'Male vs female ratio', formats: ['pdf', 'excel'], filters: ['branch', 'district'] },
      { id: 'birthdays', name: 'Birthday List', description: 'Members by birth month', formats: ['pdf', 'excel', 'csv'], filters: ['month', 'branch', 'district'] },
    ]
  },
  {
    id: 'analytics',
    title: 'Analytics',
    icon: FileText,
    color: 'bg-amber-500',
    gradient: 'from-amber-500 to-amber-600',
    reports: [
      { id: 'growth-report', name: 'Growth Report', description: 'Membership growth trends', formats: ['pdf', 'excel'], filters: ['dateRange', 'branch'] },
      { id: 'retention-report', name: 'Retention Report', description: 'Member retention analysis', formats: ['pdf', 'excel'], filters: ['dateRange', 'branch'] },
    ]
  },
]

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'MEMBER', label: 'Member' },
  { value: 'DC', label: "David's Company" },
  { value: 'LXL', label: 'League of Xtraordinary Leaders' },
  { value: 'DIRECTOR', label: 'Director' },
  { value: 'PASTOR', label: 'Pastor' },
]

const genderOptions = [
  { value: '', label: 'All Genders' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
]

const monthOptions = [
  { value: '', label: 'All Months' },
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
]

export default function MemberReports() {
  const [showModal, setShowModal] = useState(false)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<ReportCategory | null>(null)
  const [generating, setGenerating] = useState(false)

  // Filter states
  const [dateRange, setDateRange] = useState('all')
  const [customDateFrom, setCustomDateFrom] = useState('')
  const [customDateTo, setCustomDateTo] = useState('')
  const [selectedBranch, setSelectedBranch] = useState('')
  const [selectedDistrict, setSelectedDistrict] = useState('')
  const [selectedUnit, setSelectedUnit] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [selectedGender, setSelectedGender] = useState('')
  const [selectedMonth, setSelectedMonth] = useState('')
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'excel' | 'csv'>('excel')

  // Data for filters
  const [branches, setBranches] = useState<any[]>([])
  const [districts, setDistricts] = useState<Group[]>([])
  const [units, setUnits] = useState<Group[]>([])

  useEffect(() => {
    loadFilterData()
  }, [])

  const loadFilterData = async () => {
    try {
      const [branchesRes, districtsRes, unitsRes] = await Promise.all([
        branchesService.getBranches({ limit: 100 }),
        groupsService.getDistricts({ limit: 100 }),
        groupsService.getUnits({ limit: 100 }),
      ])
      setBranches(branchesRes.items || [])
      setDistricts(districtsRes.items || [])
      setUnits(unitsRes.items || [])
    } catch (error) {
      console.error('Error loading filter data:', error)
    }
  }

  const handleOpenModal = (report: Report, category: ReportCategory) => {
    setSelectedReport(report)
    setSelectedCategory(category)
    setSelectedFormat(report.formats[0])
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setSelectedReport(null)
    setSelectedCategory(null)
    resetFilters()
  }

  const resetFilters = () => {
    setDateRange('all')
    setCustomDateFrom('')
    setCustomDateTo('')
    setSelectedBranch('')
    setSelectedDistrict('')
    setSelectedUnit('')
    setSelectedStatus('')
    setSelectedGender('')
    setSelectedMonth('')
  }

  const fetchMembersForReport = async (): Promise<Member[]> => {
    const baseParams: any = { limit: 100 }

    // Apply filters based on selected values using correct API parameter names
    if (selectedDistrict) baseParams.districtId = selectedDistrict
    if (selectedUnit) baseParams.unitId = selectedUnit
    if (selectedStatus) baseParams.membershipStatus = selectedStatus
    if (selectedGender) baseParams.gender = selectedGender

    // Date range filter
    if (dateRange !== 'all' && dateRange !== 'custom') {
      const days = parseInt(dateRange)
      const fromDate = new Date()
      fromDate.setDate(fromDate.getDate() - days)
      baseParams.dateJoinedFrom = fromDate.toISOString().split('T')[0]
    } else if (dateRange === 'custom' && customDateFrom) {
      baseParams.dateJoinedFrom = customDateFrom
      if (customDateTo) {
        baseParams.dateJoinedTo = customDateTo
      }
    }

    try {
      // Fetch all pages of data
      let allMembers: Member[] = []
      let currentPage = 1
      let hasMore = true

      while (hasMore) {
        const response = await membersService.getMembers({ ...baseParams, page: currentPage })
        const members = response.items || []
        allMembers = [...allMembers, ...members]

        // Check if there are more pages
        hasMore = response.pagination?.hasNext || false
        currentPage++

        // Safety limit to prevent infinite loops
        if (currentPage > 1000) break
      }

      // Client-side filtering for birthday month (if API doesn't support it)
      if (selectedMonth) {
        const targetMonth = parseInt(selectedMonth)
        allMembers = allMembers.filter(member => {
          if (!member.dateOfBirth) return false
          const birthMonth = new Date(member.dateOfBirth).getMonth() + 1
          return birthMonth === targetMonth
        })
      }

      return allMembers
    } catch (error) {
      console.error('Error fetching members:', error)
      throw error
    }
  }

  const formatMemberData = (members: Member[]) => {
    return members.map(member => ({
      'First Name': member.firstName || '',
      'Last Name': member.lastName || '',
      'Email': member.email || '',
      'Phone': member.phone || '',
      'Gender': member.gender || '',
      'Date of Birth': member.dateOfBirth ? new Date(member.dateOfBirth).toLocaleDateString() : '',
      'Membership Status': member.membershipStatus || '',
      'Address': member.address ? `${member.address.street || ''}, ${member.address.city || ''}, ${member.address.state || ''}`.replace(/^, |, $/g, '') : '',
      'Joined Date': member.createdAt ? new Date(member.createdAt).toLocaleDateString() : '',
    }))
  }

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      showToast('error', 'No data to export')
      return
    }

    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(','),
      ...data.map(row =>
        headers.map(header => {
          const value = row[header]?.toString() || ''
          // Escape quotes and wrap in quotes if contains comma
          return value.includes(',') || value.includes('"')
            ? `"${value.replace(/"/g, '""')}"`
            : value
        }).join(',')
      )
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    saveAs(blob, `${filename}.csv`)
  }

  const exportToExcel = (data: any[], filename: string) => {
    if (data.length === 0) {
      showToast('error', 'No data to export')
      return
    }

    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Members')

    // Auto-size columns
    const maxWidth = 30
    const colWidths = Object.keys(data[0]).map(key => ({
      wch: Math.min(maxWidth, Math.max(key.length, ...data.map(row => (row[key]?.toString() || '').length)))
    }))
    worksheet['!cols'] = colWidths

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    saveAs(blob, `${filename}.xlsx`)
  }

  const exportToPDF = (data: any[], filename: string, reportName: string) => {
    if (data.length === 0) {
      showToast('error', 'No data to export')
      return
    }

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
    const headers = Object.keys(data[0])
    const currentDate = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

    // Add title
    doc.setFontSize(18)
    doc.setTextColor(30, 64, 175)
    doc.text(reportName, 14, 20)

    // Add subtitle
    doc.setFontSize(10)
    doc.setTextColor(100, 116, 139)
    doc.text('Church Management System', 14, 27)

    // Add meta info
    doc.setFontSize(9)
    doc.text(`Generated: ${currentDate}`, 14, 35)
    doc.text(`Total Records: ${data.length}`, 250, 35)

    // Add table
    const tableData = data.map(row => headers.map(h => row[h] || '-'))

    autoTable(doc, {
      head: [headers],
      body: tableData,
      startY: 40,
      styles: {
        fontSize: 8,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [30, 64, 175],
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      margin: { left: 14, right: 14 },
    })

    // Save the PDF
    doc.save(`${filename}.pdf`)
  }

  const handleGenerate = async () => {
    if (!selectedReport) return

    setGenerating(true)
    try {
      const members = await fetchMembersForReport()
      const formattedData = formatMemberData(members)
      const filename = `${selectedReport.id}-${new Date().toISOString().split('T')[0]}`

      switch (selectedFormat) {
        case 'csv':
          exportToCSV(formattedData, filename)
          break
        case 'excel':
          exportToExcel(formattedData, filename)
          break
        case 'pdf':
          exportToPDF(formattedData, filename, selectedReport.name)
          break
      }

      showToast('success', `${selectedReport.name} report generated successfully!`)
      handleCloseModal()
    } catch (error) {
      console.error('Error generating report:', error)
      showToast('error', 'Failed to generate report')
    } finally {
      setGenerating(false)
    }
  }

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'pdf':
        return <File className="w-4 h-4" />
      case 'excel':
      case 'csv':
        return <FileSpreadsheet className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  const getFormatColor = (format: string, isSelected: boolean) => {
    if (!isSelected) return 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
    switch (format) {
      case 'pdf':
        return 'bg-red-50 border-red-200 text-red-700'
      case 'excel':
        return 'bg-green-50 border-green-200 text-green-700'
      case 'csv':
        return 'bg-blue-50 border-blue-200 text-blue-700'
      default:
        return 'bg-primary-50 border-primary-200 text-primary-700'
    }
  }

  const hasFilter = (filter: string) => selectedReport?.filters.includes(filter as any)

  // Custom styled select component
  const StyledSelect = ({
    value,
    onChange,
    children,
    placeholder
  }: {
    value: string
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
    children: React.ReactNode
    placeholder?: string
  }) => (
    <div className="relative">
      <select
        value={value}
        onChange={onChange}
        className="w-full appearance-none px-4 py-3 pr-10 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 shadow-sm hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all cursor-pointer"
      >
        {children}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
        <ChevronDown className="h-4 w-4 text-gray-400" />
      </div>
    </div>
  )

  return (
    <Layout title="Member Reports" subtitle="Generate and download reports">
      <div className="space-y-4">
        {/* Report Categories Grid */}
        {reportCategories.map((category, catIndex) => (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: catIndex * 0.05 }}
          >
            <Card className="p-4">
              {/* Category Header */}
              <div className="flex items-center gap-2 mb-3">
                <div className={`p-1.5 rounded-md ${category.color}`}>
                  <category.icon className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900">{category.title}</h3>
              </div>

              {/* Reports Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                {category.reports.map((report) => (
                  <button
                    key={report.id}
                    onClick={() => handleOpenModal(report, category)}
                    className="group flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-100 hover:border-gray-200 transition-all text-left"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 text-sm truncate">{report.name}</p>
                      <p className="text-xs text-gray-500 truncate">{report.description}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-primary-600 flex-shrink-0 ml-2 transition-colors" />
                  </button>
                ))}
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Generate Report Modal */}
      <AnimatePresence>
        {showModal && selectedReport && selectedCategory && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                onClick={handleCloseModal}
              />

              {/* Modal */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
              >
                {/* Gradient Header */}
                <div className={`bg-gradient-to-r ${selectedCategory.gradient} px-6 py-5`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                        <selectedCategory.icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white text-lg">{selectedReport.name}</h3>
                        <p className="text-white/80 text-sm">{selectedReport.description}</p>
                      </div>
                    </div>
                    <button
                      onClick={handleCloseModal}
                      className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                    >
                      <X className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-5">
                  {/* Date Range - Only show if report has dateRange filter */}
                  {hasFilter('dateRange') && (
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        Date Range
                      </label>
                      <StyledSelect
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                      >
                        <option value="all">All Time</option>
                        <option value="30">Last 30 Days</option>
                        <option value="90">Last 3 Months</option>
                        <option value="180">Last 6 Months</option>
                        <option value="365">Last Year</option>
                        <option value="custom">Custom Range</option>
                      </StyledSelect>

                      {dateRange === 'custom' && (
                        <div className="grid grid-cols-2 gap-3 mt-3">
                          <div>
                            <label className="text-xs font-medium text-gray-500 mb-1.5 block">From</label>
                            <input
                              type="date"
                              value={customDateFrom}
                              onChange={(e) => setCustomDateFrom(e.target.value)}
                              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 shadow-sm hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all cursor-pointer"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-500 mb-1.5 block">To</label>
                            <input
                              type="date"
                              value={customDateTo}
                              onChange={(e) => setCustomDateTo(e.target.value)}
                              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 shadow-sm hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all cursor-pointer"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Month Filter - Only for birthday reports */}
                  {hasFilter('month') && (
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        Birth Month
                      </label>
                      <StyledSelect
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                      >
                        {monthOptions.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </StyledSelect>
                    </div>
                  )}

                  {/* Location Filters */}
                  {(hasFilter('branch') || hasFilter('district') || hasFilter('unit')) && (
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        Location
                      </label>
                      <div className="space-y-3">
                        {hasFilter('branch') && (
                          <StyledSelect
                            value={selectedBranch}
                            onChange={(e) => setSelectedBranch(e.target.value)}
                          >
                            <option value="">All Branches</option>
                            {branches.map((branch) => (
                              <option key={branch._id} value={branch._id}>{branch.name}</option>
                            ))}
                          </StyledSelect>
                        )}

                        {hasFilter('district') && (
                          <StyledSelect
                            value={selectedDistrict}
                            onChange={(e) => setSelectedDistrict(e.target.value)}
                          >
                            <option value="">All Districts</option>
                            {districts.map((district) => (
                              <option key={district._id} value={district._id}>{district.name}</option>
                            ))}
                          </StyledSelect>
                        )}

                        {hasFilter('unit') && (
                          <StyledSelect
                            value={selectedUnit}
                            onChange={(e) => setSelectedUnit(e.target.value)}
                          >
                            <option value="">All Units</option>
                            {units.map((unit) => (
                              <option key={unit._id} value={unit._id}>{unit.name}</option>
                            ))}
                          </StyledSelect>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Member Filters */}
                  {(hasFilter('status') || hasFilter('gender')) && (
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        Member Filters
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        {hasFilter('status') && (
                          <StyledSelect
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                          >
                            {statusOptions.map((option) => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </StyledSelect>
                        )}

                        {hasFilter('gender') && (
                          <StyledSelect
                            value={selectedGender}
                            onChange={(e) => setSelectedGender(e.target.value)}
                          >
                            {genderOptions.map((option) => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </StyledSelect>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Format Selection */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <Sparkles className="w-4 h-4 text-gray-400" />
                      Export Format
                    </label>
                    <div className="flex gap-2">
                      {selectedReport.formats.map((format) => (
                        <button
                          key={format}
                          onClick={() => setSelectedFormat(format)}
                          className={`
                            flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all flex-1 justify-center
                            ${getFormatColor(format, selectedFormat === format)}
                          `}
                        >
                          {getFormatIcon(format)}
                          {format.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
                  <button
                    onClick={resetFilters}
                    className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    Reset filters
                  </button>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={handleCloseModal}
                      disabled={generating}
                      className="rounded-xl"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleGenerate}
                      loading={generating}
                      className="rounded-xl flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      {generating ? 'Generating...' : 'Generate'}
                    </Button>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </Layout>
  )
}
