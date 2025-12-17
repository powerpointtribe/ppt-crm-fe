import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Download,
  FileText,
  Calendar,
  Filter,
  Users,
  MapPin,
  Heart,
  Building2,
  CheckCircle
} from 'lucide-react'
import Layout from '@/components/Layout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'

export default function MemberReports() {
  const [selectedReport, setSelectedReport] = useState<string | null>(null)

  const reportCategories = [
    {
      title: 'Membership Reports',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      reports: [
        {
          id: 'all-members',
          name: 'All Members Directory',
          description: 'Complete list of all registered members',
          format: ['PDF', 'Excel', 'CSV']
        },
        {
          id: 'active-members',
          name: 'Active Members Report',
          description: 'List of currently active members',
          format: ['PDF', 'Excel', 'CSV']
        },
        {
          id: 'inactive-members',
          name: 'Inactive Members Report',
          description: 'Members marked as inactive',
          format: ['PDF', 'Excel']
        },
        {
          id: 'new-members',
          name: 'New Members Report',
          description: 'Recently registered members',
          format: ['PDF', 'Excel', 'CSV']
        }
      ]
    },
    {
      title: 'District Reports',
      icon: MapPin,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      reports: [
        {
          id: 'members-by-district',
          name: 'Members by District',
          description: 'Member distribution across districts',
          format: ['PDF', 'Excel']
        },
        {
          id: 'district-growth',
          name: 'District Growth Report',
          description: 'Growth trends for each district',
          format: ['PDF', 'Excel']
        }
      ]
    },
    {
      title: 'Ministry Reports',
      icon: Heart,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      reports: [
        {
          id: 'members-by-ministry',
          name: 'Members by Ministry',
          description: 'Member distribution across ministries',
          format: ['PDF', 'Excel']
        },
        {
          id: 'ministry-engagement',
          name: 'Ministry Engagement Report',
          description: 'Member participation in ministries',
          format: ['PDF', 'Excel']
        }
      ]
    },
    {
      title: 'Unit Reports',
      icon: Building2,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      reports: [
        {
          id: 'members-by-unit',
          name: 'Members by Unit',
          description: 'Member distribution across units',
          format: ['PDF', 'Excel']
        },
        {
          id: 'unit-attendance',
          name: 'Unit Attendance Report',
          description: 'Attendance statistics per unit',
          format: ['PDF', 'Excel']
        }
      ]
    },
    {
      title: 'Statistical Reports',
      icon: FileText,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      reports: [
        {
          id: 'demographic-report',
          name: 'Demographic Report',
          description: 'Age, gender, and location statistics',
          format: ['PDF', 'Excel']
        },
        {
          id: 'growth-report',
          name: 'Growth Analysis Report',
          description: 'Membership growth trends over time',
          format: ['PDF', 'Excel']
        },
        {
          id: 'retention-report',
          name: 'Member Retention Report',
          description: 'Analysis of member retention rates',
          format: ['PDF', 'Excel']
        }
      ]
    }
  ]

  const handleGenerateReport = (reportId: string) => {
    setSelectedReport(reportId)
    // TODO: Implement report generation logic
    console.log('Generating report:', reportId)
  }

  return (
    <Layout title="Member Reports" subtitle="Generate and download member reports">
      <div className="space-y-6">
        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="p-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white">
                  <option>Last 30 Days</option>
                  <option>Last 3 Months</option>
                  <option>Last 6 Months</option>
                  <option>Last Year</option>
                  <option>Custom Range</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-muted-foreground" />
                <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white">
                  <option>All Districts</option>
                  <option>District A</option>
                  <option>District B</option>
                  <option>District C</option>
                </select>
              </div>
              <Button variant="outline" className="ml-auto">
                <Download className="h-4 w-4 mr-2" />
                Bulk Download
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* Report Categories */}
        <div className="space-y-6">
          {reportCategories.map((category, categoryIndex) => (
            <motion.div
              key={category.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: categoryIndex * 0.1 }}
            >
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className={`p-3 rounded-lg ${category.bgColor}`}>
                    <category.icon className={`h-6 w-6 ${category.color}`} />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">{category.title}</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {category.reports.map((report) => (
                    <div
                      key={report.id}
                      className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all duration-300 hover:border-primary-300"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-foreground mb-1">{report.name}</h4>
                          <p className="text-sm text-muted-foreground">{report.description}</p>
                        </div>
                        {selectedReport === report.id && (
                          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 ml-2" />
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                          {report.format.map((fmt) => (
                            <Badge key={fmt} variant="outline" className="text-xs">
                              {fmt}
                            </Badge>
                          ))}
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleGenerateReport(report.id)}
                          className="flex items-center gap-2"
                        >
                          <Download className="h-3 w-3" />
                          Generate
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Recent Reports */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Recent Reports</h3>
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No reports generated yet</p>
              <p className="text-sm">Generated reports will appear here</p>
            </div>
          </Card>
        </motion.div>
      </div>
    </Layout>
  )
}
